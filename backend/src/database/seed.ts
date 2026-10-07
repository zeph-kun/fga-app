import { PrismaClient } from '@prisma/client';

/**
 * PostgreSQL seed: directory and app data. Authorization tuples live in
 * OpenFGA (see OPENFGA_SEED_TUPLES below) — the parent relation is mirrored
 * in documents.folder_id for display purposes only.
 */

interface SeedUser {
  id: string;
  name: string;
  email: string;
  color: string;
}

const USERS: SeedUser[] = [
  { id: 'alice', name: 'Alice Martin', email: 'alice@example.com', color: '#8b5cf6' },
  { id: 'bob', name: 'Bob Dupont', email: 'bob@example.com', color: '#0ea5e9' },
  { id: 'carol', name: 'Carol Nguyen', email: 'carol@example.com', color: '#f43f5e' },
  { id: 'dave', name: 'Dave Externe', email: 'dave@contractor.io', color: '#f59e0b' },
  { id: 'eve', name: 'Eve Admin', email: 'eve@example.com', color: '#10b981' },
];

const GROUPS = [
  { id: 'eng', name: 'Engineering' },
  { id: 'design', name: 'Design' },
  { id: 'contractors', name: 'Contractors' },
  { id: 'staff', name: 'Staff (parent group)' },
];

const FOLDERS = [
  { id: 'f-eng', name: 'Engineering' },
  { id: 'f-proj', name: 'Projects' },
  { id: 'f-design', name: 'Design' },
  { id: 'f-private', name: 'Private' },
];

const DOCUMENTS = [
  { id: 'doc-rfc', title: 'Architecture RFC', content: 'Proposal for the new event-driven architecture.', folderId: 'f-proj' },
  { id: 'doc-onboarding', title: 'Onboarding Guide', content: 'Welcome! Here is how to get started.', folderId: 'f-eng' },
  { id: 'doc-logo', title: 'Logo Proposal', content: 'Three variants for the new logo.', folderId: 'f-design' },
  { id: 'doc-roadmap', title: 'Secret Roadmap', content: 'Confidential Q4 roadmap.', folderId: 'f-private' },
];

const user = (id: string) => `user:${id}`;
const groupMember = (id: string) => `group:${id}#member`;
const folderRef = (id: string) => `folder:${id}`;

/** Seed tuples in OpenFGA native format (user, relation, object). */
export const OPENFGA_SEED_TUPLES: { user: string; relation: string; object: string }[] = [
  // Folders
  { user: user('alice'), relation: 'owner', object: 'folder:f-eng' },
  { user: groupMember('eng'), relation: 'viewer', object: 'folder:f-eng' },
  { user: folderRef('f-eng'), relation: 'parent', object: 'folder:f-proj' },
  { user: groupMember('contractors'), relation: 'viewer', object: 'folder:f-proj' },
  { user: user('eve'), relation: 'owner', object: 'folder:f-design' },
  { user: groupMember('design'), relation: 'editor', object: 'folder:f-design' },
  { user: user('alice'), relation: 'owner', object: 'folder:f-private' },

  // Documents: parent links
  { user: folderRef('f-proj'), relation: 'parent', object: 'document:doc-rfc' },
  { user: folderRef('f-eng'), relation: 'parent', object: 'document:doc-onboarding' },
  { user: folderRef('f-design'), relation: 'parent', object: 'document:doc-logo' },
  { user: folderRef('f-private'), relation: 'parent', object: 'document:doc-roadmap' },

  // Documents: direct grants
  { user: user('bob'), relation: 'editor', object: 'document:doc-rfc' },
  { user: groupMember('contractors'), relation: 'viewer', object: 'document:doc-rfc' },
  { user: user('carol'), relation: 'viewer', object: 'document:doc-onboarding' },

  // Groups (including nested groups)
  { user: user('alice'), relation: 'member', object: 'group:eng' },
  { user: user('bob'), relation: 'member', object: 'group:eng' },
  { user: user('carol'), relation: 'member', object: 'group:design' },
  { user: user('eve'), relation: 'member', object: 'group:design' },
  { user: user('dave'), relation: 'member', object: 'group:contractors' },
  { user: groupMember('eng'), relation: 'member', object: 'group:staff' },
  { user: groupMember('design'), relation: 'member', object: 'group:staff' },
];

export async function seed(db: PrismaClient): Promise<void> {
  await db.user.createMany({ data: USERS });
  await db.group.createMany({ data: GROUPS });
  await db.folder.createMany({ data: FOLDERS });
  await db.document.createMany({
    data: DOCUMENTS.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      folderId: d.folderId,
    })),
  });
}
