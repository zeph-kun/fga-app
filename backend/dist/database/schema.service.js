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
exports.SchemaService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("./database.service");
const seed_1 = require("./seed");
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS relation_tuples (
  id BIGSERIAL PRIMARY KEY,
  namespace TEXT NOT NULL,
  object_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subject_namespace TEXT NOT NULL DEFAULT '',
  subject_relation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (namespace, object_id, relation, subject_type, subject_id, subject_namespace, subject_relation)
);

CREATE INDEX IF NOT EXISTS idx_tuples_object ON relation_tuples (namespace, object_id, relation);
`;
let SchemaService = class SchemaService {
    db;
    constructor(db) {
        this.db = db;
    }
    async onModuleInit() {
        await this.db.query(SCHEMA_SQL);
        const { rows } = await this.db.query('SELECT COUNT(*)::text AS count FROM users');
        if (rows[0].count === '0') {
            await (0, seed_1.seed)(this.db);
        }
    }
};
exports.SchemaService = SchemaService;
exports.SchemaService = SchemaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SchemaService);
//# sourceMappingURL=schema.service.js.map