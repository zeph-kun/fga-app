"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENT_PERMISSIONS = exports.FGA_CONFIG = void 0;
exports.FGA_CONFIG = {
    document: {
        relations: ['owner', 'editor', 'viewer', 'parent'],
        permissions: {
            view: ['viewer', 'editor', 'owner', { relation: 'parent', permission: 'view' }],
            edit: ['editor', 'owner', { relation: 'parent', permission: 'edit' }],
            share: ['owner', { relation: 'parent', permission: 'share' }],
            delete: ['owner'],
        },
    },
    folder: {
        relations: ['owner', 'editor', 'viewer', 'parent'],
        permissions: {
            view: ['viewer', 'editor', 'owner', { relation: 'parent', permission: 'view' }],
            edit: ['editor', 'owner', { relation: 'parent', permission: 'edit' }],
            share: ['owner', { relation: 'parent', permission: 'share' }],
            delete: ['owner'],
        },
    },
    group: {
        relations: ['member', 'parent'],
        permissions: {
            member: ['member', { relation: 'parent', permission: 'member' }],
        },
    },
};
exports.DOCUMENT_PERMISSIONS = ['view', 'edit', 'share', 'delete'];
//# sourceMappingURL=config.js.map