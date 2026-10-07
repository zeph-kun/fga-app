'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, DocumentItem, Group, Tuple, User } from '@/lib/api';

interface Props {
  document: DocumentItem;
  users: User[];
  groups: Group[];
  onChanged: () => void;
}

const GRANTABLE_RELATIONS = ['viewer', 'editor', 'owner'] as const;

export default function SharePanel({ document, users, groups, onChanged }: Props) {
  const [tuples, setTuples] = useState<Tuple[]>([]);
  const [relation, setRelation] = useState<string>('viewer');
  const [subjectValue, setSubjectValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTuples = useCallback(async () => {
    try {
      setTuples(await api.tuples('document', document.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    }
  }, [document.id]);

  useEffect(() => {
    void loadTuples();
  }, [loadTuples]);

  async function grant(): Promise<void> {
    if (!subjectValue) {
      setError('Choisissez un utilisateur ou un groupe.');
      return;
    }
    const [type, id] = subjectValue.split(':');
    setBusy(true);
    setError(null);
    try {
      await api.createTuple({
        namespace: 'document',
        objectId: document.id,
        relation,
        subject:
          type === 'user'
            ? { type: 'user', id }
            : { type: 'group', id, relation: 'member' },
      });
      await loadTuples();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(tuple: Tuple): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await api.deleteTuple({
        namespace: tuple.namespace,
        objectId: tuple.objectId,
        relation: tuple.relation,
        subject: tuple.subject,
      });
      await loadTuples();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setBusy(false);
    }
  }

  function subjectLabel(tuple: Tuple): string {
    switch (tuple.subject.type) {
      case 'user': {
        const user = users.find((u) => u.id === tuple.subject.id);
        return `user:${user?.name ?? tuple.subject.id}`;
      }
      case 'group': {
        const group = groups.find((g) => g.id === tuple.subject.id);
        return `group:${group?.name ?? tuple.subject.id}#${tuple.subject.relation ?? 'member'}`;
      }
      case 'object':
        return `${tuple.subject.namespace}:${tuple.subject.id}`;
    }
  }

  const canShare = document.permissions.share;
  const directTuples = tuples.filter((tuple) => tuple.relation !== 'parent');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Partages
        </h2>
        <span className="truncate text-xs text-slate-500">{document.title}</span>
      </div>

      {!canShare && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Vous n&apos;avez pas la permission <span className="font-mono">share</span> sur ce document.
          L&apos;API refuserait toute modification.
        </p>
      )}

      <ul className="mb-4 space-y-1.5">
        {tuples
          .filter((tuple) => tuple.relation === 'parent')
          .map((tuple) => (
            <li
              key={`${tuple.relation}:${tuple.subject.namespace}:${tuple.subject.id}`}
              className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400"
            >
              parent : {tuple.subject.namespace}:{tuple.subject.id} (héritage des permissions)
            </li>
          ))}
        {directTuples.map((tuple) => (
          <li
            key={`${tuple.relation}:${subjectLabel(tuple)}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
          >
            <span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">
                {tuple.relation}
              </span>{' '}
              <span className="text-slate-400">{subjectLabel(tuple)}</span>
            </span>
            <button
              type="button"
              disabled={!canShare || busy}
              onClick={() => void revoke(tuple)}
              className="rounded px-2 py-0.5 text-rose-400 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              révoquer
            </button>
          </li>
        ))}
        {tuples.length === 0 && (
          <li className="text-xs text-slate-500">Aucune relation directe sur ce document.</li>
        )}
      </ul>

      <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
        <div className="flex gap-2">
          <select
            value={relation}
            onChange={(event) => setRelation(event.target.value)}
            disabled={!canShare || busy}
            className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:border-slate-400 focus:outline-none disabled:opacity-50"
          >
            {GRANTABLE_RELATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={subjectValue}
            onChange={(event) => setSubjectValue(event.target.value)}
            disabled={!canShare || busy}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:border-slate-400 focus:outline-none disabled:opacity-50"
          >
            <option value="">Accorder à...</option>
            <optgroup label="Utilisateurs">
              {users.map((user) => (
                <option key={`user-${user.id}`} value={`user:${user.id}`}>
                  {user.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Groupes">
              {groups.map((group) => (
                <option key={`group-${group.id}`} value={`group:${group.id}`}>
                  {group.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void grant()}
          disabled={!canShare || busy || !subjectValue}
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-violet-950 transition hover:bg-violet-400 disabled:opacity-40"
        >
          Accorder
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
