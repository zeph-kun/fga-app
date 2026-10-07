"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jose_1 = require("jose");
const database_service_1 = require("../database/database.service");
const AVATAR_COLORS = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#ec4899', '#14b8a6'];
let JwtAuthGuard = class JwtAuthGuard {
    db;
    jwks;
    issuer;
    allowedClients;
    constructor(db) {
        this.db = db;
        this.issuer = process.env.KEYCLOAK_ISSUER ?? 'http://localhost:8180/realms/fga';
        const jwksUrl = process.env.KEYCLOAK_JWKS_URL ?? 'http://keycloak:8080/realms/fga/protocol/openid-connect/certs';
        this.jwks = (0, jose_1.createRemoteJWKSet)(new URL(jwksUrl));
        this.allowedClients = new Set((process.env.KEYCLOAK_ALLOWED_CLIENTS ?? 'fga-web').split(',').map((c) => c.trim()));
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const header = request.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        let payload;
        try {
            const verified = await (0, jose_1.jwtVerify)(header.slice('Bearer '.length), this.jwks, {
                issuer: this.issuer,
                clockTolerance: 5,
            });
            payload = verified.payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(`Invalid access token: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
        const clientId = String(payload.azp ?? '');
        if (!this.allowedClients.has(clientId)) {
            throw new common_1.UnauthorizedException(`Client "${clientId}" is not allowed`);
        }
        const id = String(payload.preferred_username ?? '');
        if (!id) {
            throw new common_1.UnauthorizedException('Token has no preferred_username claim');
        }
        const user = {
            id,
            name: `${payload.given_name ?? ''} ${payload.family_name ?? ''}`.trim() || id,
            email: String(payload.email ?? ''),
        };
        request.user = user;
        await this.ensureDirectoryEntry(user);
        return true;
    }
    async ensureDirectoryEntry(user) {
        const color = AVATAR_COLORS[[...user.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
        try {
            await this.db.query(`INSERT INTO users (id, name, email, color) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`, [user.id, user.name, user.email, color]);
        }
        catch {
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map