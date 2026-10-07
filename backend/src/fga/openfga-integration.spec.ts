import { OpenFgaClient } from './openfga.client';

/**
 * Integration tests against the real OpenFGA server (runs inside the api
 * container where OPENFGA_URL points at the openfga service). Each suite
 * gets a throw-away store, so the main store is never touched.
 */

describe('OpenFGA integration (authorization model semantics)', () => {
  let client: OpenFgaClient;
  let storeName: string;

  beforeAll(async () => {
    storeName = `test-${process.env.JEST_WORKER_ID ?? '0'}-${Date.now()}`;
    client = new OpenFgaClient({ storeName });
    await client.onModuleInit();
  }, 30000);

  afterAll(async () => {
    await client.deleteStore();
  }, 30000);

  const check = (user: string, relation: string, object: string) =>
    client.check(`user:${user}`, relation, object);

  it('grants a permission through a direct tuple', async () => {
    expect(await check('bob', 'view', 'document:doc-rfc')).toBe(true);
  });

  it('denies when the user holds no matching relation', async () => {
    expect(await check('bob', 'edit', 'document:doc-onboarding')).toBe(false);
  });

  it('evaluates permission unions: viewer gets view but not edit', async () => {
    expect(await check('dave', 'view', 'document:doc-rfc')).toBe(true);
    expect(await check('dave', 'edit', 'document:doc-rfc')).toBe(false);
  });

  it('resolves group members as usersets', async () => {
    expect(await check('dave', 'view', 'document:doc-rfc')).toBe(true);
    expect(await check('carol', 'view', 'document:doc-rfc')).toBe(false);
  });

  it('resolves nested groups recursively', async () => {
    // bob is in eng; eng and design are members of staff.
    expect(await check('bob', 'member', 'group:staff')).toBe(true);
  });

  it('follows parent links so a document inherits folder permissions', async () => {
    // bob is viewer of f-eng (via group eng); doc-onboarding's parent chain
    // passes through f-eng.
    expect(await check('bob', 'view', 'document:doc-onboarding')).toBe(true);
    expect(await check('bob', 'edit', 'document:doc-onboarding')).toBe(false);
  });

  it('inherits owner-only permissions through the parent chain', async () => {
    expect(await check('alice', 'share', 'document:doc-rfc')).toBe(true);
    expect(await check('bob', 'share', 'document:doc-rfc')).toBe(false);
  });

  it('keeps delete non-inherited: only a direct owner can delete', async () => {
    // Alice owns the parent folders, but no document has a direct owner tuple.
    expect(await check('alice', 'delete', 'document:doc-rfc')).toBe(false);
    expect(await check('alice', 'share', 'folder:f-private')).toBe(true);
  });

  it('rejects users outside all relations on private folders', async () => {
    expect(await check('bob', 'view', 'document:doc-roadmap')).toBe(false);
  });

  it('writes and deletes tuples (grant then revoke)', async () => {
    await client.writeTuples([
      { user: 'user:eve', relation: 'viewer', object: 'document:doc-rfc' },
    ]);
    expect(await check('eve', 'view', 'document:doc-rfc')).toBe(true);

    await client.deleteTuples([
      { user: 'user:eve', relation: 'viewer', object: 'document:doc-rfc' },
    ]);
    expect(await check('eve', 'view', 'document:doc-rfc')).toBe(false);
  });

  it('is idempotent on duplicate tuple writes', async () => {
    await client.writeTuples([{ user: 'user:carol', relation: 'viewer', object: 'document:doc-rfc' }]);
    await client.writeTuples([{ user: 'user:carol', relation: 'viewer', object: 'document:doc-rfc' }]);
    await client.deleteTuples([{ user: 'user:carol', relation: 'viewer', object: 'document:doc-rfc' }]);
  });

  it('reads tuples by object filter', async () => {
    const { tuples } = await client.read({ object: 'document:doc-rfc' });
    expect(tuples.length).toBeGreaterThan(0);
    expect(tuples.some((t) => t.key.user === 'user:bob' && t.key.relation === 'editor')).toBe(true);
  });
});
