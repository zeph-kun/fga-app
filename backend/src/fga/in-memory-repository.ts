import { RelationTuple, TupleRepository } from './model';

/** In-memory repository, used by unit tests. */
export class InMemoryTupleRepository implements TupleRepository {
  private tuples: RelationTuple[] = [];
  private nextId = 1;

  constructor(tuples: RelationTuple[] = []) {
    for (const tuple of tuples) {
      this.insert(tuple);
    }
  }

  async findTuples(namespace: string, objectId: string, relation: string): Promise<RelationTuple[]> {
    return this.tuples.filter(
      (t) => t.namespace === namespace && t.objectId === objectId && t.relation === relation,
    );
  }

  async listTuples(namespace?: string, objectId?: string): Promise<RelationTuple[]> {
    return this.tuples.filter(
      (t) =>
        (namespace === undefined || t.namespace === namespace) &&
        (objectId === undefined || t.objectId === objectId),
    );
  }

  async insert(tuple: RelationTuple): Promise<RelationTuple> {
    const stored: RelationTuple = { ...tuple, id: this.nextId++ };
    this.tuples.push(stored);
    return stored;
  }

  async delete(id: number): Promise<void> {
    this.tuples = this.tuples.filter((t) => t.id !== id);
  }
}
