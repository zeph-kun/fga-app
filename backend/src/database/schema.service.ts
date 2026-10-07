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
  content TEXT NOT NULL DEFAULT '',
  folder_id TEXT
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents (folder_id);

-- One-time migration to OpenFGA: move the parent links from the legacy
-- relation_tuples table into documents.folder_id, then drop the table.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relation_tuples') THEN
    UPDATE documents d
    SET folder_id = p.subject_id
    FROM relation_tuples p
    WHERE p.namespace = 'document'
      AND p.object_id = d.id
      AND p.relation = 'parent'
      AND p.subject_type = 'object';
    DROP TABLE relation_tuples;
  END IF;
END
$$;
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
