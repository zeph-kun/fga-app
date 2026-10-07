import { DatabaseService } from './database.service';
import { TupleSubject } from '../fga/model';

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
  {
    id: 'doc-rfc',
    title: 'Architecture RFC',
    content: 'Proposal for the new event-driven architecture.',
  },
  { id: 'doc-onboarding', title: 'Onboarding Guide', content: 'Welcome! Here is how to get started.' },
  { id: 'doc-logo', title: 'Logo Proposal', content: 'Three variants for the new logo.' },
  { id: 'doc-roadmap', title: 'Secret Roadmap', content: 'Confidential Q4 roadmap.' },
];

const user = (id: string): TupleSubject => ({ type: 'user', id });
const groupMember = (id: string): TupleSubject => ({ type: 'group', id, relation: 'member' });
const folderRef = (id: string): TupleSubject => ({ type: 'object', id, namespace: 'folder' });

const TUPLES = [
  // Folders
  { namespace: 'folder', objectId: 'f-eng', relation: 'owner', subject: user('alice') },
  { namespace: 'folder', objectId: 'f-eng', relation: 'viewer', subject: groupMember('eng') },
  { namespace: 'folder', objectId: 'f-proj', relation: 'parent', subject: folderRef('f-eng') },
  { namespace: 'folder', objectId: 'f-proj', relation: 'viewer', subject: groupMember('contractors') },
  { namespace: 'folder', objectId: 'f-design', relation: 'owner', subject: user('eve') },
  { namespace: 'folder', objectId: 'f-design', relation: 'editor', subject: groupMember('design') },
  { namespace: 'folder', objectId: 'f-private', relation: 'owner', subject: user('alice') },

  // Documents: parent links
  { namespace: 'document', objectId: 'doc-rfc', relation: 'parent', subject: folderRef('f-proj') },
  { namespace: 'document', objectId: 'doc-onboarding', relation: 'parent', subject: folderRef('f-eng') },
  { namespace: 'document', objectId: 'doc-logo', relation: 'parent', subject: folderRef('f-design') },
  { namespace: 'document', objectId: 'doc-roadmap', relation: 'parent', subject: folderRef('f-private') },

  // Documents: direct grants
  { namespace: 'document', objectId: 'doc-rfc', relation: 'editor', subject: user('bob') },
  { namespace: 'document', objectId: 'doc-rfc', relation: 'viewer', subject: groupMember('contractors') },
  { namespace: 'document', objectId: 'doc-onboarding', relation: 'viewer', subject: user('carol') },
];

const GROUP_MEMBERS = [
  { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('alice') },
  { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('bob') },
  { namespace: 'group', objectId: 'design', relation: 'member', subject: user('carol') },
  { namespace: 'group', objectId: 'design', relation: 'member', subject: user('eve') },
  { namespace: 'group', objectId: 'contractors', relation: 'member', subject: user('dave') },
  // Nested groups: eng and design are members of staff.
  { namespace: 'group', objectId: 'staff', relation: 'member', subject: groupMember('eng') },
  { namespace: 'group', objectId: 'staff', relation: 'member', subject: groupMember('design') },
];

export async function seed(db: DatabaseService): Promise<void> {
  for (const u of USERS) {
    await db.query('INSERT INTO users (id, name, email, color) VALUES ($1, $2, $3, $4)', [
      u.id,
      u.name,
      u.email,
      u.color,
    ]);
  }
  for (const g of GROUPS) {
    await db.query('INSERT INTO groups (id, name) VALUES ($1, $2)', [g.id, g.name]);
  }
  for (const f of FOLDERS) {
    await db.query('INSERT INTO folders (id, name) VALUES ($1, $2)', [f.id, f.name]);
  }
  for (const d of DOCUMENTS) {
    await db.query('INSERT INTO documents (id, title, content) VALUES ($1, $2, $3)', [
      d.id,
      d.title,
      d.content,
    ]);
  }
  for (const t of [...TUPLES, ...GROUP_MEMBERS]) {
    await db.query(
      `INSERT INTO relation_tuples (namespace, object_id, relation, subject_type, subject_id, subject_namespace, subject_relation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        t.namespace,
        t.objectId,
        t.relation,
        t.subject.type,
        t.subject.id,
        t.subject.namespace ?? '',
        t.subject.relation ?? '',
      ],
    );
  }
}
