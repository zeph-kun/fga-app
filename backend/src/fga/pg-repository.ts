import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RelationTuple, TupleRepository, TupleSubject } from './model';

interface TupleRow {
  id: string;
  namespace: string;
  object_id: string;
  relation: string;
  subject_type: string;
  subject_id: string;
  subject_namespace: string;
  subject_relation: string;
}

function rowToTuple(row: TupleRow): RelationTuple {
  const subject: TupleSubject = { type: row.subject_type as TupleSubject['type'], id: row.subject_id };
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

@Injectable()
export class PgTupleRepository implements TupleRepository {
  constructor(private readonly db: DatabaseService) {}

  async findTuples(namespace: string, objectId: string, relation: string): Promise<RelationTuple[]> {
    const { rows } = await this.db.query<TupleRow>(
      'SELECT * FROM relation_tuples WHERE namespace = $1 AND object_id = $2 AND relation = $3 ORDER BY id',
      [namespace, objectId, relation],
    );
    return rows.map(rowToTuple);
  }

  async listTuples(namespace?: string, objectId?: string): Promise<RelationTuple[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (namespace !== undefined) {
      params.push(namespace);
      conditions.push(`namespace = $${params.length}`);
    }
    if (objectId !== undefined) {
      params.push(objectId);
      conditions.push(`object_id = $${params.length}`);
    }
    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.db.query<TupleRow>(
      `SELECT * FROM relation_tuples${where} ORDER BY id`,
      params,
    );
    return rows.map(rowToTuple);
  }

  async insert(tuple: RelationTuple): Promise<RelationTuple> {
    const { rows } = await this.db.query<TupleRow>(
      `INSERT INTO relation_tuples (namespace, object_id, relation, subject_type, subject_id, subject_namespace, subject_relation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (namespace, object_id, relation, subject_type, subject_id, subject_namespace, subject_relation)
       DO UPDATE SET subject_type = EXCLUDED.subject_type
       RETURNING *`,
      [
        tuple.namespace,
        tuple.objectId,
        tuple.relation,
        tuple.subject.type,
        tuple.subject.id,
        tuple.subject.namespace ?? '',
        tuple.subject.relation ?? '',
      ],
    );
    return rowToTuple(rows[0]);
  }

  async delete(id: number): Promise<void> {
    await this.db.query('DELETE FROM relation_tuples WHERE id = $1', [id]);
  }
}
