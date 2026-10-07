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
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-4 w-1 rounded-full bg-emerald-400" aria-hidden />
        Permission checker
      </h2>

      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
          Utilisateur
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-400/60 focus:outline-none"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.id})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
          Permission
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 transition focus:border-emerald-400/60 focus:outline-none"
          >
            {PERMISSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-400">
          Objet
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition focus:border-emerald-400/60 focus:outline-none"
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
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-950/30 border-t-emerald-950" />
              Évaluation...
            </>
          ) : (
            'check()'
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 break-words text-sm text-rose-400">{error}</p>
      )}

      {result && (
        <div className="animate-rise mt-4">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-center text-sm font-bold uppercase tracking-wide ${
              result.allowed
                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/40'
                : 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/40'
            }`}
          >
            {result.allowed && (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {!result.allowed && (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <span className="flex-1">{result.allowed ? 'Autorisé' : 'Refusé'}</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80">
            <p className="border-b border-slate-800/80 bg-slate-900/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Explication
            </p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-300">
              {result.explanation.length > 0 ? result.explanation.join('\n') : '(aucun chemin trouvé)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
