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
exports.DirectoryService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let DirectoryService = class DirectoryService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listUsers() {
        const { rows } = await this.db.query('SELECT id, name, email, color FROM users ORDER BY id');
        return rows;
    }
    async listGroups() {
        const { rows: groupRows } = await this.db.query('SELECT id, name FROM groups ORDER BY id');
        const { rows: memberRows } = await this.db.query("SELECT object_id, subject_type, subject_id FROM relation_tuples WHERE namespace = 'group' AND relation = 'member' ORDER BY id");
        return groupRows.map((group) => ({
            id: group.id,
            name: group.name,
            members: memberRows
                .filter((m) => m.object_id === group.id)
                .map((m) => ({ type: m.subject_type, id: m.subject_id })),
        }));
    }
    async listFolders() {
        const { rows } = await this.db.query('SELECT id, name FROM folders ORDER BY id');
        return rows;
    }
};
exports.DirectoryService = DirectoryService;
exports.DirectoryService = DirectoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DirectoryService);
//# sourceMappingURL=directory.service.js.map