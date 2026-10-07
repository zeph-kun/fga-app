"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryTupleRepository = void 0;
class InMemoryTupleRepository {
    tuples = [];
    nextId = 1;
    constructor(tuples = []) {
        for (const tuple of tuples) {
            this.insert(tuple);
        }
    }
    async findTuples(namespace, objectId, relation) {
        return this.tuples.filter((t) => t.namespace === namespace && t.objectId === objectId && t.relation === relation);
    }
    async listTuples(namespace, objectId) {
        return this.tuples.filter((t) => (namespace === undefined || t.namespace === namespace) &&
            (objectId === undefined || t.objectId === objectId));
    }
    async insert(tuple) {
        const stored = { ...tuple, id: this.nextId++ };
        this.tuples.push(stored);
        return stored;
    }
    async delete(id) {
        this.tuples = this.tuples.filter((t) => t.id !== id);
    }
}
exports.InMemoryTupleRepository = InMemoryTupleRepository;
//# sourceMappingURL=in-memory-repository.js.map