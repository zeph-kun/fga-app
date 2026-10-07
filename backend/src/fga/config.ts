import { NamespaceConfig } from './model';

/**
 * Authorization model of the application.
 *
 * - `document` and `folder` expose owner/editor/viewer, with a `parent`
 *   relation linking a document to its folder (and folders to folders).
 * - Permissions are unions: view includes editor and owner, edit includes
 *   owner, share and delete are owner-only (inherited through parents).
 * - `group` supports direct members, nested groups via 'member' tuples whose
 *   subject is a group (group:child#member), and parent links.
 */
export const FGA_CONFIG: NamespaceConfig = {
  document: {
    relations: ['owner', 'editor', 'viewer', 'parent'],
    permissions: {
      view: ['viewer', 'editor', 'owner', { relation: 'parent', permission: 'view' }],
      edit: ['editor', 'owner', { relation: 'parent', permission: 'edit' }],
      share: ['owner', { relation: 'parent', permission: 'share' }],
      delete: ['owner'],
    },
  },
  folder: {
    relations: ['owner', 'editor', 'viewer', 'parent'],
    permissions: {
      view: ['viewer', 'editor', 'owner', { relation: 'parent', permission: 'view' }],
      edit: ['editor', 'owner', { relation: 'parent', permission: 'edit' }],
      share: ['owner', { relation: 'parent', permission: 'share' }],
      delete: ['owner'],
    },
  },
  group: {
    relations: ['member', 'parent'],
    permissions: {
      member: ['member', { relation: 'parent', permission: 'member' }],
    },
  },
};

export const DOCUMENT_PERMISSIONS = ['view', 'edit', 'share', 'delete'] as const;
export type DocumentPermission = (typeof DOCUMENT_PERMISSIONS)[number];
