import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FgaService } from '../fga/fga.service';
import { DOCUMENT_PERMISSIONS, DocumentPermission } from './document-permissions';

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
    private readonly db: PrismaService,
    private readonly fga: FgaService,
  ) {}

  /** Lists every document with the permission map for a given user. */
  async listForUser(userId: string): Promise<DocumentWithPermissionsDto[]> {
    const documents = await this.listAll();
    return Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        permissions: await this.permissionsFor(userId, doc.id),
      })),
    );
  }

  async permissionsFor(userId: string, documentId: string): Promise<Record<DocumentPermission, boolean>> {
    const entries = await Promise.all(
      DOCUMENT_PERMISSIONS.map(async (permission) => {
        const allowed = await this.fga.checkAllowed(userId, permission, 'document', documentId);
        return [permission, allowed] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<DocumentPermission, boolean>;
  }

  private async listAll(): Promise<DocumentDto[]> {
    const [documents, folders] = await Promise.all([
      this.db.document.findMany({ orderBy: { id: 'asc' } }),
      this.db.folder.findMany({ select: { id: true, name: true } }),
    ]);
    const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      folder: doc.folderId
        ? { id: doc.folderId, name: folderNames.get(doc.folderId) ?? doc.folderId }
        : null,
    }));
  }
}
