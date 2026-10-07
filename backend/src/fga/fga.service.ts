import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { FgaEngine } from './engine';
import { CheckResult, RelationTuple, TUPLE_REPOSITORY, TupleRepository } from './model';

@Injectable()
export class FgaService {
  constructor(
    private readonly engine: FgaEngine,
    @Inject(TUPLE_REPOSITORY) private readonly repo: TupleRepository,
  ) {}

  async check(userId: string, permission: string, namespace: string, objectId: string): Promise<CheckResult> {
    return this.engine.check(userId, permission, namespace, objectId);
  }

  async listTuples(namespace?: string, objectId?: string): Promise<RelationTuple[]> {
    return this.repo.listTuples(namespace, objectId);
  }

  /** Creates a tuple after verifying the acting user may share the object. */
  async createTuple(actingUser: string, tuple: Omit<RelationTuple, 'id'>): Promise<RelationTuple> {
    await this.assertCanShare(actingUser, tuple.namespace, tuple.objectId);
    return this.repo.insert(tuple as RelationTuple);
  }

  /** Deletes a tuple after verifying the acting user may share the object. */
  async deleteTuple(actingUser: string, tupleId: number): Promise<void> {
    const tuples = await this.repo.listTuples();
    const tuple = tuples.find((t) => t.id === tupleId);
    if (!tuple) {
      return;
    }
    await this.assertCanShare(actingUser, tuple.namespace, tuple.objectId);
    await this.repo.delete(tupleId);
  }

  private async assertCanShare(userId: string, namespace: string, objectId: string): Promise<void> {
    const result = await this.engine.check(userId, 'share', namespace, objectId);
    if (!result.allowed) {
      throw new ForbiddenException(
        `User "${userId}" is not allowed to share ${namespace}:${objectId}`,
      );
    }
  }
}
