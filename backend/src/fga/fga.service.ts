import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { FgaTupleKey, OpenFgaClient } from './openfga.client';

export interface TupleSubject {
  type: 'user' | 'group' | 'object';
  id: string;
  namespace?: string;
  relation?: string;
}

export interface TupleDto {
  namespace: string;
  objectId: string;
  relation: string;
  subject: TupleSubject;
}

export interface CheckResult {
  allowed: boolean;
  explanation: string[];
  userId: string;
  permission: string;
  namespace: string;
  objectId: string;
}

/** Composition of each permission, used to build human explanations. */
const PERMISSION_RULES: Record<string, { direct: string[]; parent: boolean }> = {
  view: { direct: ['viewer', 'editor', 'owner'], parent: true },
  edit: { direct: ['editor', 'owner'], parent: true },
  share: { direct: ['owner'], parent: true },
  delete: { direct: ['owner'], parent: false },
  member: { direct: ['member'], parent: false },
};

function subjectToUser(subject: TupleSubject): string {
  switch (subject.type) {
    case 'user':
      return `user:${subject.id}`;
    case 'group':
      return `group:${subject.id}#${subject.relation ?? 'member'}`;
    case 'object':
      if (!subject.namespace) {
        throw new BadRequestException('object subject requires a namespace');
      }
      return `${subject.namespace}:${subject.id}`;
  }
}

function tupleToKey(tuple: TupleDto): FgaTupleKey {
  return {
    user: subjectToUser(tuple.subject),
    relation: tuple.relation,
    object: `${tuple.namespace}:${tuple.objectId}`,
  };
}

function userFromTupleUser(user: string): { type: 'user' | 'group' | 'object'; id: string; namespace?: string; relation?: string } {
  if (user.startsWith('user:')) {
    return { type: 'user', id: user.slice('user:'.length) };
  }
  if (user.includes('#')) {
    const [group, relation] = user.split('#');
    return { type: 'group', id: group.slice('group:'.length), relation };
  }
  const separator = user.indexOf(':');
  return { type: 'object', namespace: user.slice(0, separator), id: user.slice(separator + 1) };
}

@Injectable()
export class FgaService {
  constructor(private readonly client: OpenFgaClient) {}

  async check(userId: string, permission: string, namespace: string, objectId: string): Promise<CheckResult> {
    const object = `${namespace}:${objectId}`;
    const allowed = await this.client.check(`user:${userId}`, permission, object);
    const explanation = allowed
      ? await this.explain(userId, namespace, objectId, permission, 0)
      : [];
    return { allowed, explanation, userId, permission, namespace, objectId };
  }

  /** Fast boolean check without explanation (used for permission maps). */
  async checkAllowed(userId: string, permission: string, namespace: string, objectId: string): Promise<boolean> {
    return this.client.check(`user:${userId}`, permission, `${namespace}:${objectId}`);
  }

  async listTuples(namespace?: string, objectId?: string): Promise<TupleDto[]> {
    // OpenFGA's read filter needs a full "type:id" object; partial filters are
    // applied in memory after the read.
    const filter: Partial<FgaTupleKey> = {};
    if (namespace && objectId) {
      filter.object = `${namespace}:${objectId}`;
    }
    const { tuples } = await this.client.read(filter);
    return tuples
      .map((tuple) => {
        const separator = tuple.key.object.indexOf(':');
        return {
          namespace: tuple.key.object.slice(0, separator),
          objectId: tuple.key.object.slice(separator + 1),
          relation: tuple.key.relation,
          subject: userFromTupleUser(tuple.key.user),
        };
      })
      .filter(
        (tuple) =>
          (namespace === undefined || tuple.namespace === namespace) &&
          (objectId === undefined || tuple.objectId === objectId),
      );
  }

  async createTuple(actingUser: string, tuple: TupleDto): Promise<TupleDto> {
    await this.assertCanShare(actingUser, tuple.namespace, tuple.objectId);
    await this.client.writeTuples([tupleToKey(tuple)]);
    return tuple;
  }

  async deleteTuple(actingUser: string, tuple: TupleDto): Promise<void> {
    await this.assertCanShare(actingUser, tuple.namespace, tuple.objectId);
    await this.client.deleteTuples([tupleToKey(tuple)]);
  }

  private async assertCanShare(userId: string, namespace: string, objectId: string): Promise<void> {
    const allowed = await this.client.check(`user:${userId}`, 'share', `${namespace}:${objectId}`);
    if (!allowed) {
      throw new ForbiddenException(
        `User "${userId}" is not allowed to share ${namespace}:${objectId}`,
      );
    }
  }

  /**
   * Builds a human-readable explanation of why the user has the permission:
   * walks direct relations (naming the tuple or group involved) and follows
   * parent links recursively. Decisions always come from OpenFGA checks;
   * this only explains them.
   */
  private async explain(
    userId: string,
    namespace: string,
    objectId: string,
    permission: string,
    depth: number,
  ): Promise<string[]> {
    if (depth > 4) {
      return [];
    }
    const object = `${namespace}:${objectId}`;
    const rules = PERMISSION_RULES[permission];

    if (rules) {
      for (const relation of rules.direct) {
        if (!(await this.client.check(`user:${userId}`, relation, object))) {
          continue;
        }
        const { tuples } = await this.client.read({ object, relation });
        for (const tuple of tuples) {
          if (tuple.key.user === `user:${userId}`) {
            return [`${userId} est ${relation} de ${object} (tuple direct)`];
          }
          if (tuple.key.user.includes('#')) {
            const [group, groupRelation] = tuple.key.user.split('#');
            const inGroup = await this.client.check(`user:${userId}`, groupRelation, group);
            if (inGroup) {
              return [
                `${userId} est ${groupRelation} de ${group}`,
                `${group} est ${relation} de ${object}`,
              ];
            }
          }
        }
      }
      if (rules.parent) {
        const { tuples } = await this.client.read({ object, relation: 'parent' });
        for (const tuple of tuples) {
          const [parentNamespace, parentId] = tuple.key.user.split(':');
          const nested = await this.explain(userId, parentNamespace, parentId, permission, depth + 1);
          if (nested.length > 0) {
            return [`${object} herite de ${tuple.key.user}`, ...nested];
          }
        }
      }
    } else {
      // Unknown permission: treat it as a direct relation name.
      if (await this.client.check(`user:${userId}`, permission, object)) {
        return [`${userId} a la relation ${permission} sur ${object}`];
      }
    }
    return [];
  }
}
