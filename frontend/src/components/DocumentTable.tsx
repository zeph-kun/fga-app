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
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
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
              className={`cursor-pointer border-b border-slate-800/60 transition ${
                doc.id === selectedId ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-100">{doc.title}</div>
                <div className="text-xs text-slate-500">{doc.id}</div>
              </td>
              <td className="px-4 py-3 text-slate-400">{doc.folder?.name ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(PERMISSION_LABELS) as PermissionName[]).map((permission) =>
                    doc.permissions[permission] ? (
                      <span
                        key={permission}
                        className={`rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PERMISSION_LABELS[permission].classes}`}
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
