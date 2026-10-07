'use client';

import { DocumentItem, PermissionName } from '@/lib/api';

interface Props {
  documents: DocumentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PERMISSION_LABELS: Record<PermissionName, { label: string; classes: string }> = {
  view: { label: 'view', classes: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  edit: { label: 'edit', classes: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  share: { label: 'share', classes: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  delete: { label: 'delete', classes: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
};

export default function DocumentTable({ documents, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/60 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-slate-800/80 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Dossier</th>
            <th className="px-4 py-3 font-medium">Vos permissions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`cursor-pointer border-b border-slate-800/50 transition last:border-b-0 ${
                doc.id === selectedId
                  ? 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30'
                  : 'hover:bg-slate-800/40'
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      doc.id === selectedId
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                      <path
                        d="M6 4h5l2 2h5a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-100">{doc.title}</div>
                    <div className="truncate font-mono text-xs text-slate-500">{doc.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {doc.folder ? (
                  <span className="inline-flex max-w-40 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0" aria-hidden>
                      <path
                        d="M4 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="truncate">{doc.folder.name}</span>
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(PERMISSION_LABELS) as PermissionName[]).map((permission) =>
                    doc.permissions[permission] ? (
                      <span
                        key={permission}
                        className={`rounded px-2 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset ${PERMISSION_LABELS[permission].classes}`}
                      >
                        {PERMISSION_LABELS[permission].label}
                      </span>
                    ) : null,
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
