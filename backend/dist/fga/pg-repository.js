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
exports.PgTupleRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
function rowToTuple(row) {
    const subject = { type: row.subject_type, id: row.subject_id };
    if (row.subject_namespace) {
        subject.namespace = row.subject_namespace;
    }
    if (row.subject_relation) {
        subject.relation = row.subject_relation;
    }
    return {
        id: Number(row.id),
        namespace: row.namespace,
        objectId: row.object_id,
        relation: row.relation,
        subject,
    };
}
let PgTupleRepository = class PgTupleRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findTuples(namespace, objectId, relation) {
        const { rows } = await this.db.query('SELECT * FROM relation_tuples WHERE namespace = $1 AND object_id = $2 AND relation = $3 ORDER BY id', [namespace, objectId, relation]);
        return rows.map(rowToTuple);
    }
    async listTuples(namespace, objectId) {
        const conditions = [];
        const params = [];
        if (namespace !== undefined) {
            params.push(namespace);
            conditions.push(`namespace = $${params.length}`);
        }
        if (objectId !== undefined) {
            params.push(objectId);
            conditions.push(`object_id = $${params.length}`);
        }
        const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await this.db.query(`SELECT * FROM relation_tuples${where} ORDER BY id`, params);
        return rows.map(rowToTuple);
    }
    async insert(tuple) {
        const { rows } = await this.db.query(`INSERT INTO relation_tuples (namespace, object_id, relation, subject_type, subject_id, subject_namespace, subject_relation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (namespace, object_id, relation, subject_type, subject_id, subject_namespace, subject_relation)
       DO UPDATE SET subject_type = EXCLUDED.subject_type
       RETURNING *`, [
            tuple.namespace,
            tuple.objectId,
            tuple.relation,
            tuple.subject.type,
            tuple.subject.id,
            tuple.subject.namespace ?? '',
            tuple.subject.relation ?? '',
        ]);
        return rowToTuple(rows[0]);
    }
    async delete(id) {
        await this.db.query('DELETE FROM relation_tuples WHERE id = $1', [id]);
    }
};
exports.PgTupleRepository = PgTupleRepository;
exports.PgTupleRepository = PgTupleRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PgTupleRepository);
//# sourceMappingURL=pg-repository.js.map