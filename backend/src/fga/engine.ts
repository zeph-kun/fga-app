import { CheckResult, NamespaceConfig, PermissionRule, RelationTuple, TupleRepository } from './model';

/**
 * Zanzibar-lite evaluation engine.
 *
 * check(user, permission, object) walks the permission definition as a union
 * of rules. String rules look up tuples directly; rewrite rules follow a
 * relation (e.g. 'parent') and re-evaluate the target permission on the
 * referenced object. Group subjects recurse into group membership, which
 * makes nested groups work naturally.
 *
 * A visited set guards against cycles in parent links. Every step appends a
 * human-readable line to the trace so the UI can explain why a decision was
 * reached.
 */
export class FgaEngine {
  constructor(
    private readonly repo: TupleRepository,
    private readonly config: NamespaceConfig,
  ) {}

  async check(userId: string, permission: string, namespace: string, objectId: string): Promise<CheckResult> {
    const trace: string[] = [];
    const allowed = await this.evalPermission(userId, namespace, objectId, permission, trace, new Set());
    return { allowed, trace, userId, permission, namespace, objectId };
  }

  private async evalPermission(
    userId: string,
    namespace: string,
    objectId: string,
    permission: string,
    trace: string[],
    visited: Set<string>,
  ): Promise<boolean> {
    const definition = this.config[namespace];
    if (!definition) {
      trace.push(`unknown namespace "${namespace}"`);
      return false;
    }

    const key = `${namespace}:${objectId}#${permission}`;
    if (visited.has(key)) {
      trace.push(`${key} -> already evaluated (cycle protection)`);
      return false;
    }
    visited.add(key);

    const rules =
      definition.permissions[permission] ??
      (definition.relations.includes(permission) ? ([permission] as PermissionRule[]) : null);

    if (!rules) {
      trace.push(`${key} -> unknown permission "${permission}"`);
      return false;
    }

    trace.push(`${key} = ${rules.map((r) => (typeof r === 'string' ? r : `${r.relation}#${r.permission}`)).join(' | ')}`);

    for (const rule of rules) {
      if (await this.evalRule(userId, namespace, objectId, rule, trace, visited)) {
        return true;
      }
    }
    return false;
  }

  private async evalRule(
    userId: string,
    namespace: string,
    objectId: string,
    rule: PermissionRule,
    trace: string[],
    visited: Set<string>,
  ): Promise<boolean> {
    if (typeof rule === 'string') {
      const tuples = await this.repo.findTuples(namespace, objectId, rule);
      if (tuples.length > 0) {
        trace.push(`${namespace}:${objectId}#${rule} -> ${tuples.length} tuple(s): ${tuples.map((t) => this.describeSubject(t)).join(', ')}`);
      }
      for (const tuple of tuples) {
        if (tuple.subject.type === 'user') {
          if (tuple.subject.id === userId) {
            trace.push(`MATCH: user "${userId}" is ${rule} of ${namespace}:${objectId}`);
            return true;
          }
        } else if (tuple.subject.type === 'group') {
          const groupRelation = tuple.subject.relation ?? 'member';
          const ok = await this.evalPermission(userId, 'group', tuple.subject.id, groupRelation, trace, visited);
          if (ok) {
            trace.push(`MATCH: user "${userId}" reached via group:${tuple.subject.id}#${groupRelation}`);
            return true;
          }
        }
      }
      return false;
    }

    // Rewrite rule: follow the relation (e.g. 'parent') and evaluate the
    // target permission on the referenced object.
    const links = await this.repo.findTuples(namespace, objectId, rule.relation);
    for (const link of links) {
      if (link.subject.type === 'object' && link.subject.namespace) {
        trace.push(`${namespace}:${objectId}#${rule.relation} -> ${link.subject.namespace}:${link.subject.id}#${rule.permission}`);
        const ok = await this.evalPermission(
          userId,
          link.subject.namespace,
          link.subject.id,
          rule.permission,
          trace,
          visited,
        );
        if (ok) {
          return true;
        }
      }
    }
    return false;
  }

  private describeSubject(tuple: RelationTuple): string {
    switch (tuple.subject.type) {
      case 'user':
        return `user:${tuple.subject.id}`;
      case 'group':
        return `group:${tuple.subject.id}#${tuple.subject.relation ?? 'member'}`;
      case 'object':
        return `${tuple.subject.namespace}:${tuple.subject.id}`;
    }
  }
}
