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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FgaService = void 0;
const common_1 = require("@nestjs/common");
const engine_1 = require("./engine");
const model_1 = require("./model");
let FgaService = class FgaService {
    engine;
    repo;
    constructor(engine, repo) {
        this.engine = engine;
        this.repo = repo;
    }
    async check(userId, permission, namespace, objectId) {
        return this.engine.check(userId, permission, namespace, objectId);
    }
    async listTuples(namespace, objectId) {
        return this.repo.listTuples(namespace, objectId);
    }
    async createTuple(actingUser, tuple) {
        await this.assertCanShare(actingUser, tuple.namespace, tuple.objectId);
        return this.repo.insert(tuple);
    }
    async deleteTuple(actingUser, tupleId) {
        const tuples = await this.repo.listTuples();
        const tuple = tuples.find((t) => t.id === tupleId);
        if (!tuple) {
            return;
        }
        await this.assertCanShare(actingUser, tuple.namespace, tuple.objectId);
        await this.repo.delete(tupleId);
    }
    async assertCanShare(userId, namespace, objectId) {
        const result = await this.engine.check(userId, 'share', namespace, objectId);
        if (!result.allowed) {
            throw new common_1.ForbiddenException(`User "${userId}" is not allowed to share ${namespace}:${objectId}`);
        }
    }
};
exports.FgaService = FgaService;
exports.FgaService = FgaService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(model_1.TUPLE_REPOSITORY)),
    __metadata("design:paramtypes", [engine_1.FgaEngine, Object])
], FgaService);
//# sourceMappingURL=fga.service.js.map