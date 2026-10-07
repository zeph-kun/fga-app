'use client';

import { useEffect, useState } from 'react';
import { api, CheckResponse, DocumentItem, Folder, User } from '@/lib/api';

interface Props {
  users: User[];
  documents: DocumentItem[];
  folders: Folder[];
  defaultUserId: string | null;
}

const PERMISSIONS = ['view', 'edit', 'share', 'delete'] as const;

export default function PermissionChecker({ users, documents, folders, defaultUserId }: Props) {
  const [userId, setUserId] = useState<string>(defaultUserId ?? users[0]?.id ?? '');
  const [permission, setPermission] = useState<string>('view');
  const [target, setTarget] = useState<string>(documents[0] ? `document:${documents[0].id}` : '');
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultUserId) {
      setUserId(defaultUserId);
    }
  }, [defaultUserId]);

  async function runCheck(): Promise<void> {
    const [namespace, objectId] = target.split(':');
    if (!userId || !namespace || !objectId) {
      setError('Sélectionnez un utilisateur, une permission et un objet.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.check({ userId, permission, namespace, objectId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Permission checker
      </h2>

      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Utilisateur
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-400 focus:outline-none"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.id})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Permission
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-400 focus:outline-none"
          >
            {PERMISSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Objet
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-400 focus:outline-none"
          >
            <optgroup label="Documents">
              {documents.map((doc) => (
                <option key={doc.id} value={`document:${doc.id}`}>
                  {doc.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Dossiers">
              {folders.map((folder) => (
                <option key={folder.id} value={`folder:${folder.id}`}>
                  {folder.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? 'Evaluation...' : 'check()'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {result && (
        <div className="mt-4">
          <div
            className={`rounded-lg px-4 py-2 text-center text-sm font-bold uppercase tracking-wide ${
              result.allowed
                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/40'
                : 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/40'
            }`}
          >
            {result.allowed ? 'Autorisé' : 'Refusé'}
          </div>
          <div className="mt-3 rounded-lg bg-slate-950 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Trace d&apos;évaluation
            </p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
              {result.trace.join('\n')}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
