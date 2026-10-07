import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { seed } from './seed';

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

@Injectable()
export class SchemaService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.db.query(SCHEMA_SQL);

    const { rows } = await this.db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    if (rows[0].count === '0') {
      await seed(this.db);
    }
  }
}
