export const DOCUMENT_PERMISSIONS = ['view', 'edit', 'share', 'delete'] as const;
export type DocumentPermission = (typeof DOCUMENT_PERMISSIONS)[number];
