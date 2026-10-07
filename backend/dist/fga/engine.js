"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FgaEngine = void 0;
class FgaEngine {
    repo;
    config;
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
    }
    async check(userId, permission, namespace, objectId) {
        const trace = [];
        const allowed = await this.evalPermission(userId, namespace, objectId, permission, trace, new Set());
        return { allowed, trace, userId, permission, namespace, objectId };
    }
    async evalPermission(userId, namespace, objectId, permission, trace, visited) {
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
        const rules = definition.permissions[permission] ??
            (definition.relations.includes(permission) ? [permission] : null);
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
    async evalRule(userId, namespace, objectId, rule, trace, visited) {
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
                }
                else if (tuple.subject.type === 'group') {
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
        const links = await this.repo.findTuples(namespace, objectId, rule.relation);
        for (const link of links) {
            if (link.subject.type === 'object' && link.subject.namespace) {
                trace.push(`${namespace}:${objectId}#${rule.relation} -> ${link.subject.namespace}:${link.subject.id}#${rule.permission}`);
                const ok = await this.evalPermission(userId, link.subject.namespace, link.subject.id, rule.permission, trace, visited);
                if (ok) {
                    return true;
                }
            }
        }
        return false;
    }
    describeSubject(tuple) {
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
exports.FgaEngine = FgaEngine;
//# sourceMappingURL=engine.js.map