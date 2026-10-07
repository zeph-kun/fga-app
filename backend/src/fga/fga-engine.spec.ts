import { FgaEngine } from './engine';
import { FGA_CONFIG } from './config';
import { InMemoryTupleRepository } from './in-memory-repository';
import { RelationTuple } from './model';

const user = (id: string): RelationTuple['subject'] => ({ type: 'user', id });
const groupMember = (id: string): RelationTuple['subject'] => ({ type: 'group', id, relation: 'member' });
const folderRef = (id: string): RelationTuple['subject'] => ({ type: 'object', id, namespace: 'folder' });

function buildEngine(tuples: RelationTuple[]): FgaEngine {
  return new FgaEngine(new InMemoryTupleRepository(tuples), FGA_CONFIG);
}

describe('FgaEngine', () => {
  it('grants a permission through a direct tuple', async () => {
    const engine = buildEngine([
      { namespace: 'document', objectId: 'doc-1', relation: 'owner', subject: user('alice') },
    ]);

    const result = await engine.check('alice', 'share', 'document', 'doc-1');
    expect(result.allowed).toBe(true);
  });

  it('denies when the user holds no matching relation', async () => {
    const engine = buildEngine([
      { namespace: 'document', objectId: 'doc-1', relation: 'viewer', subject: user('bob') },
    ]);

    const result = await engine.check('bob', 'edit', 'document', 'doc-1');
    expect(result.allowed).toBe(false);
  });

  it('evaluates permission unions: viewer gets view but not edit', async () => {
    const engine = buildEngine([
      { namespace: 'document', objectId: 'doc-1', relation: 'viewer', subject: user('bob') },
    ]);

    expect((await engine.check('bob', 'view', 'document', 'doc-1')).allowed).toBe(true);
    expect((await engine.check('bob', 'edit', 'document', 'doc-1')).allowed).toBe(false);
  });

  it('resolves group members as usersets', async () => {
    const engine = buildEngine([
      { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('bob') },
      { namespace: 'document', objectId: 'doc-1', relation: 'viewer', subject: groupMember('eng') },
    ]);

    expect((await engine.check('bob', 'view', 'document', 'doc-1')).allowed).toBe(true);
    expect((await engine.check('carol', 'view', 'document', 'doc-1')).allowed).toBe(false);
  });

  it('resolves nested groups recursively', async () => {
    const engine = buildEngine([
      { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('bob') },
      { namespace: 'group', objectId: 'staff', relation: 'member', subject: groupMember('eng') },
      { namespace: 'folder', objectId: 'f-1', relation: 'viewer', subject: groupMember('staff') },
    ]);

    expect((await engine.check('bob', 'view', 'folder', 'f-1')).allowed).toBe(true);
  });

  it('follows parent links so a document inherits folder permissions', async () => {
    const engine = buildEngine([
      { namespace: 'folder', objectId: 'f-eng', relation: 'viewer', subject: user('bob') },
      { namespace: 'folder', objectId: 'f-proj', relation: 'parent', subject: folderRef('f-eng') },
      { namespace: 'document', objectId: 'doc-1', relation: 'parent', subject: folderRef('f-proj') },
    ]);

    expect((await engine.check('bob', 'view', 'document', 'doc-1')).allowed).toBe(true);
    expect((await engine.check('bob', 'edit', 'document', 'doc-1')).allowed).toBe(false);
  });

  it('inherits owner-only permissions through the parent chain', async () => {
    const engine = buildEngine([
      { namespace: 'folder', objectId: 'f-1', relation: 'owner', subject: user('alice') },
      { namespace: 'document', objectId: 'doc-1', relation: 'parent', subject: folderRef('f-1') },
    ]);

    expect((await engine.check('alice', 'share', 'document', 'doc-1')).allowed).toBe(true);
    // Deliberate design choice: delete is NOT inherited from the parent,
    // only a direct owner tuple on the document itself grants it.
    expect((await engine.check('alice', 'delete', 'document', 'doc-1')).allowed).toBe(false);
    expect((await engine.check('bob', 'delete', 'document', 'doc-1')).allowed).toBe(false);
  });

  it('grants delete only to the direct owner of the document', async () => {
    const engine = buildEngine([
      { namespace: 'document', objectId: 'doc-1', relation: 'owner', subject: user('alice') },
    ]);

    expect((await engine.check('alice', 'delete', 'document', 'doc-1')).allowed).toBe(true);
    expect((await engine.check('bob', 'delete', 'document', 'doc-1')).allowed).toBe(false);
  });

  it('combines direct grants with inherited ones', async () => {
    const engine = buildEngine([
      { namespace: 'folder', objectId: 'f-1', relation: 'viewer', subject: groupMember('eng') },
      { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('bob') },
      { namespace: 'document', objectId: 'doc-1', relation: 'parent', subject: folderRef('f-1') },
      { namespace: 'document', objectId: 'doc-1', relation: 'editor', subject: user('bob') },
    ]);

    expect((await engine.check('bob', 'edit', 'document', 'doc-1')).allowed).toBe(true);
  });

  it('returns a human-readable trace on success', async () => {
    const engine = buildEngine([
      { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('bob') },
      { namespace: 'folder', objectId: 'f-1', relation: 'viewer', subject: groupMember('eng') },
      { namespace: 'document', objectId: 'doc-1', relation: 'parent', subject: folderRef('f-1') },
    ]);

    const result = await engine.check('bob', 'view', 'document', 'doc-1');
    expect(result.allowed).toBe(true);
    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.trace.some((line) => line.includes('MATCH'))).toBe(true);
  });

  it('terminates on cyclic parent links', async () => {
    const engine = buildEngine([
      { namespace: 'folder', objectId: 'f-1', relation: 'parent', subject: folderRef('f-2') },
      { namespace: 'folder', objectId: 'f-2', relation: 'parent', subject: folderRef('f-1') },
    ]);

    const result = await engine.check('bob', 'view', 'folder', 'f-1');
    expect(result.allowed).toBe(false);
  });

  it('rejects unknown namespaces and permissions', async () => {
    const engine = buildEngine([]);

    expect((await engine.check('bob', 'view', 'spacecraft', 'x-wing')).allowed).toBe(false);
    expect((await engine.check('bob', 'teleport', 'document', 'doc-1')).allowed).toBe(false);
  });

  it('treats a relation name as an implicit permission', async () => {
    const engine = buildEngine([
      { namespace: 'group', objectId: 'eng', relation: 'member', subject: user('bob') },
    ]);

    expect((await engine.check('bob', 'member', 'group', 'eng')).allowed).toBe(true);
  });
});
