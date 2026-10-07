/**
 * Core model of the FGA engine (Zanzibar-lite).
 *
 * Everything is a relation tuple: (namespace:object, relation, subject).
 * Subjects can be a user, a group (with a subject relation, e.g. group:eng#member),
 * or another object (used for parent links in the hierarchy).
 */

export type SubjectType = 'user' | 'group' | 'object';

/** DI token for the repository implementation, since TupleRepository is an interface. */
export const TUPLE_REPOSITORY = 'TupleRepository';

export interface TupleSubject {
  type: SubjectType;
  /** User or group id, or the target object id for 'object' subjects. */
  id: string;
  /** Namespace of the referenced object, for 'object' subjects (e.g. 'folder'). */
  namespace?: string;
  /** Relation to evaluate on the group subject, e.g. 'member'. */
  relation?: string;
}

export interface RelationTuple {
  id?: number;
  namespace: string;
  objectId: string;
  relation: string;
  subject: TupleSubject;
}

export interface TupleRepository {
  /** All tuples matching (namespace, objectId, relation). */
  findTuples(namespace: string, objectId: string, relation: string): Promise<RelationTuple[]>;
  listTuples(namespace?: string, objectId?: string): Promise<RelationTuple[]>;
  insert(tuple: RelationTuple): Promise<RelationTuple>;
  delete(id: number): Promise<void>;
}

/** A permission rule: either a direct relation name, or a rewrite through a relation. */
export type PermissionRule = string | { relation: string; permission: string };

export interface NamespaceDefinition {
  /** Relations that can be granted on this namespace. */
  relations: string[];
  /**
   * Permission definitions: each permission is a union of rules.
   * A string rule means "any subject holding this relation has the permission".
   * An object rule follows tuples of `relation` (e.g. 'parent') and evaluates
   * `permission` on the referenced object.
   */
  permissions: Record<string, PermissionRule[]>;
}

export type NamespaceConfig = Record<string, NamespaceDefinition>;

export interface CheckResult {
  allowed: boolean;
  trace: string[];
  userId: string;
  permission: string;
  namespace: string;
  objectId: string;
}
