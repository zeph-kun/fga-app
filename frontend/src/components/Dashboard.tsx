'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, DocumentItem, Folder, Group, UnauthorizedError, User } from '@/lib/api';
import DocumentTable from './DocumentTable';
import PermissionChecker from './PermissionChecker';
import SharePanel from './SharePanel';
import GroupsOverview from './GroupsOverview';
import LoginScreen from './LoginScreen';

const AUTH_ERRORS: Record<string, string> = {
  missing_code: 'Réponse OAuth incomplète, réessayez.',
  state_mismatch: 'State OAuth invalide (session de navigation trop ancienne ?), réessayez.',
  token_exchange: "Échec de l'échange du code contre les tokens.",
  no_username: "Le token ne contient pas d'identifiant utilisateur.",
  bad_flow_state: 'État de flux OAuth illisible, réessayez.',
};

export default function Dashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .session()
      .then((info) => {
        setAuthenticated(info.authenticated);
        setSessionUser(info.user ?? null);
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthenticated(false);
        setAuthChecked(true);
      });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [loadedUsers, loadedGroups, loadedFolders, docs] = await Promise.all([
        api.users(),
        api.groups(),
        api.folders(),
        api.documents(),
      ]);
      setUsers(loadedUsers);
      setGroups(loadedGroups);
      setFolders(loadedFolders);
      setDocuments(docs);
      setError(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        setAuthenticated(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadData();
    }
  }, [authenticated, loadData]);

  const visibleDocuments = documents.filter((doc) => doc.permissions.view);
  const selectedDoc = documents.find((doc) => doc.id === selectedDocId) ?? null;
  const me = sessionUser ? (users.find((u) => u.id === sessionUser.id) ?? null) : null;

  if (!authChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
        Chargement...
      </div>
    );
  }

  if (!authenticated) {
    const rawError =
      typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('error');
    return <LoginScreen reason={rawError ? (AUTH_ERRORS[rawError] ?? rawError) : null} />;
  }

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10">
      <header className="animate-rise mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 shadow-lg shadow-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-950" aria-hidden>
              <path
                d="M12 3l7 3v5c0 4.4-3 8.2-7 9.5C8 19.2 5 15.4 5 11V6l7-3z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M9.5 12l1.8 1.8L15 10"
                stroke="rgb(15 23 42)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              FGA Playground
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Fine-Grained Authorization inspiré de Zanzibar : tuples de relations, groupes
              imbriqués, héritage par dossiers. Identité OAuth/OIDC via Keycloak.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {me && (
            <span className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 py-1.5 pl-1.5 pr-3 text-sm shadow-sm">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-inner"
                style={{ backgroundColor: me.color }}
              >
                {me.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span className="max-w-32 truncate">{me.name}</span>
            </span>
          )}
          <a
            href="/api/auth/logout"
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            Se déconnecter
          </a>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
            <path
              d="M12 8v5m0 3h.01M10.3 3.9L2.5 17.5A1 1 0 003.4 19h17.2a1 1 0 00.9-1.5L13.7 3.9a1 1 0 00-1.7 0z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="min-w-0 xl:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <span className="h-4 w-1 rounded-full bg-emerald-400" aria-hidden />
            Documents visibles
          </h2>
          <DocumentTable
            documents={visibleDocuments}
            selectedId={selectedDocId}
            onSelect={setSelectedDocId}
          />
          {visibleDocuments.length === 0 && !error && (
            <p className="mt-4 text-sm text-slate-500">
              Aucun document visible pour votre compte.
            </p>
          )}
          <div className="mt-6">
            <GroupsOverview groups={groups} users={users} />
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-6">
          <PermissionChecker
            users={users}
            documents={documents}
            folders={folders}
            defaultUserId={me?.id ?? null}
          />
          {selectedDoc ? (
            <SharePanel
              document={selectedDoc}
              users={users}
              groups={groups}
              onChanged={() => void loadData()}
            />
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                <path
                  d="M4 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Sélectionnez un document pour gérer ses partages.
            </div>
          )}
        </section>
      </div>

      <footer className="mt-10 border-t border-slate-800/80 pt-4 text-xs leading-relaxed text-slate-600">
        Stack : Next.js (Tailwind) - NestJS - PostgreSQL - Keycloak - Docker Compose. Modèle :{' '}
        <span className="font-mono text-slate-500">view = viewer | editor | owner | parent.view</span>.
      </footer>
    </div>
  );
}
