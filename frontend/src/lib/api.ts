/**
 * Typed client for the FGA API, routed through the Next.js server-side
 * proxy (/api/fga/*) which attaches the Keycloak access token.
 */

const API_BASE = '/api/fga';

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface GroupMember {
  type: 'user' | 'group';
  id: string;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

export interface Folder {
  id: string;
  name: string;
}

export type PermissionName = 'view' | 'edit' | 'share' | 'delete';

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  folder: { id: string; name: string } | null;
  permissions: Record<PermissionName, boolean>;
}

export interface CheckResponse {
  allowed: boolean;
  trace: string[];
  userId: string;
  permission: string;
  namespace: string;
  objectId: string;
}

export interface TupleSubject {
  type: 'user' | 'group' | 'object';
  id: string;
  namespace?: string;
  relation?: string;
}

export interface Tuple {
  id: number;
  namespace: string;
  objectId: string;
  relation: string;
  subject: TupleSubject;
}

export interface SessionInfo {
  authenticated: boolean;
  user?: { id: string; name: string; email: string };
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Session expirée ou absente');
    this.name = 'UnauthorizedError';
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new UnauthorizedError();
  }
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

function get<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`).then(handle<T>);
}

function post<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handle<T>);
}

function del<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then(handle<T>);
}

export const api = {
  session: () => fetch('/api/auth/session').then(handle<SessionInfo>),
  users: () => get<User[]>('/users'),
  groups: () => get<Group[]>('/groups'),
  folders: () => get<Folder[]>('/folders'),
  documents: () => get<DocumentItem[]>('/documents'),
  check: (request: { userId: string; permission: string; namespace: string; objectId: string }) =>
    post<CheckResponse>('/check', request),
  tuples: (namespace: string, objectId: string) =>
    get<Tuple[]>(`/tuples?namespace=${encodeURIComponent(namespace)}&objectId=${encodeURIComponent(objectId)}`),
  createTuple: (tuple: { namespace: string; objectId: string; relation: string; subject: TupleSubject }) =>
    post<Tuple>('/tuples', tuple),
  deleteTuple: (id: number) => del<void>(`/tuples/${id}`),
};
