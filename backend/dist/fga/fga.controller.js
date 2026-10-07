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
exports.FgaController = void 0;
const common_1 = require("@nestjs/common");
const dto_1 = require("./dto");
const fga_service_1 = require("./fga.service");
let FgaController = class FgaController {
    fga;
    constructor(fga) {
        this.fga = fga;
    }
    check(dto) {
        return this.fga.check(dto.userId, dto.permission, dto.namespace, dto.objectId);
    }
    listTuples(namespace, objectId) {
        return this.fga.listTuples(namespace, objectId);
    }
    createTuple(request, dto) {
        const { namespace, objectId, relation, subject } = dto;
        return this.fga.createTuple(request.user.id, { namespace, objectId, relation, subject });
    }
    deleteTuple(request, id) {
        return this.fga.deleteTuple(request.user.id, id);
    }
};
exports.FgaController = FgaController;
__decorate([
    (0, common_1.Post)('check'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CheckRequestDto]),
    __metadata("design:returntype", void 0)
], FgaController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('tuples'),
    __param(0, (0, common_1.Query)('namespace')),
    __param(1, (0, common_1.Query)('objectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FgaController.prototype, "listTuples", null);
__decorate([
    (0, common_1.Post)('tuples'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateTupleDto]),
    __metadata("design:returntype", void 0)
], FgaController.prototype, "createTuple", null);
__decorate([
    (0, common_1.Delete)('tuples/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], FgaController.prototype, "deleteTuple", null);
exports.FgaController = FgaController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [fga_service_1.FgaService])
], FgaController);
//# sourceMappingURL=fga.controller.js.map