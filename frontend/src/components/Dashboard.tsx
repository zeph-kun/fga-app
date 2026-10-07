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
      <div className="flex min-h-screen items-center justify-center text-slate-400">
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
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FGA Playground</h1>
          <p className="mt-1 text-sm text-slate-400">
            Fine-Grained Authorization inspiré de Zanzibar : tuples de relations, groupes imbriqués,
            héritage par dossiers. Identité OAuth/OIDC via Keycloak.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {me && (
            <span className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: me.color }}
              >
                {me.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              {me.name}
            </span>
          )}
          <a
            href="/api/auth/logout"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500"
          >
            Se déconnecter
          </a>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
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

        <section className="flex flex-col gap-6">
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-500">
              Sélectionnez un document pour gérer ses partages.
            </div>
          )}
        </section>
      </div>

      <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-600">
        Stack : Next.js (Tailwind) - NestJS - PostgreSQL - Keycloak - Docker Compose. Modèle :
        view = viewer | editor | owner | parent.view.
      </footer>
    </div>
  );
}
