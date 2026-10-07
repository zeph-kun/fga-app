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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const fga_service_1 = require("../fga/fga.service");
const config_1 = require("../fga/config");
let DocumentsService = class DocumentsService {
    db;
    fga;
    constructor(db, fga) {
        this.db = db;
        this.fga = fga;
    }
    async listForUser(userId) {
        const documents = await this.listAll();
        const withPermissions = await Promise.all(documents.map(async (doc) => ({
            ...doc,
            permissions: await this.permissionsFor(userId, doc.id),
        })));
        return withPermissions;
    }
    async permissionsFor(userId, documentId) {
        const entries = await Promise.all(config_1.DOCUMENT_PERMISSIONS.map(async (permission) => {
            const result = await this.fga.check(userId, permission, 'document', documentId);
            return [permission, result.allowed];
        }));
        return Object.fromEntries(entries);
    }
    async listAll() {
        const { rows } = await this.db.query(`SELECT d.id, d.title, d.content,
            p.subject_id AS folder_id, f.name AS folder_name
       FROM documents d
       LEFT JOIN relation_tuples p
            ON p.namespace = 'document' AND p.object_id = d.id AND p.relation = 'parent'
       LEFT JOIN folders f ON f.id = p.subject_id
       ORDER BY d.id`);
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            content: row.content,
            folder: row.folder_id ? { id: row.folder_id, name: row.folder_name ?? row.folder_id } : null,
        }));
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        fga_service_1.FgaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map