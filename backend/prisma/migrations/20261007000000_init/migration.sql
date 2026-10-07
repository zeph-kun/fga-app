-- Baseline migration, written idempotent so it applies safely both to a
-- fresh database and to an existing one created by the former homegrown
-- SchemaService DDL. The OpenFGA tables (store, tuple, changelog,
-- authorization_model, goose_db_version) live in the same database and are
-- owned by the OpenFGA migrate container: migrations must never touch them.

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "folder_id" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- Older databases may predate the folder_id column.
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "folder_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_documents_folder" ON "documents"("folder_id");
