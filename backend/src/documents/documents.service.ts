import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FgaService } from '../fga/fga.service';
import { DOCUMENT_PERMISSIONS, DocumentPermission } from '../fga/config';

export interface DocumentDto {
  id: string;
  title: string;
  content: string;
  folder: { id: string; name: string } | null;
}

export interface DocumentWithPermissionsDto extends DocumentDto {
  permissions: Record<DocumentPermission, boolean>;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly fga: FgaService,
  ) {}

  /** Lists every document with the permission map for a given user. */
  async listForUser(userId: string): Promise<DocumentWithPermissionsDto[]> {
    const documents = await this.listAll();
    const withPermissions = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        permissions: await this.permissionsFor(userId, doc.id),
      })),
    );
    return withPermissions;
  }

  async permissionsFor(userId: string, documentId: string): Promise<Record<DocumentPermission, boolean>> {
    const entries = await Promise.all(
      DOCUMENT_PERMISSIONS.map(async (permission) => {
        const result = await this.fga.check(userId, permission, 'document', documentId);
        return [permission, result.allowed] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<DocumentPermission, boolean>;
  }

  private async listAll(): Promise<DocumentDto[]> {
    const { rows } = await this.db.query<{
      id: string;
      title: string;
      content: string;
      folder_id: string | null;
      folder_name: string | null;
    }>(
      `SELECT d.id, d.title, d.content,
            p.subject_id AS folder_id, f.name AS folder_name
       FROM documents d
       LEFT JOIN relation_tuples p
            ON p.namespace = 'document' AND p.object_id = d.id AND p.relation = 'parent'
       LEFT JOIN folders f ON f.id = p.subject_id
       ORDER BY d.id`,
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      folder: row.folder_id ? { id: row.folder_id, name: row.folder_name ?? row.folder_id } : null,
    }));
  }
}
