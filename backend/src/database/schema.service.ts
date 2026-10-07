import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { seed } from './seed';

// Table DDL is owned by prisma/schema.prisma and applied at boot via
// `prisma db push` (see docker-compose.yml). Only the one-shot migration
// away from the legacy homemade FGA engine stays here: it moves the parent
// links from relation_tuples into documents.folder_id, then drops the table.
const LEGACY_MIGRATION_SQL = `
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
  constructor(private readonly db: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.db.$executeRawUnsafe(LEGACY_MIGRATION_SQL);

    if ((await this.db.user.count()) === 0) {
      await seed(this.db);
    }
  }
}
