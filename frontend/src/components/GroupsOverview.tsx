'use client';

import { Group, User } from '@/lib/api';

interface Props {
  groups: Group[];
  users: User[];
}

export default function GroupsOverview({ groups, users }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-4 w-1 rounded-full bg-violet-400" aria-hidden />
        Groupes et membres
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition hover:border-slate-700"
          >
            <div className="mb-2 min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{group.name}</p>
              <p className="truncate font-mono text-[10px] text-slate-500">group:{group.id}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {group.members.map((member, index) => {
                const user =
                  member.type === 'user' ? users.find((u) => u.id === member.id) : undefined;
                const label =
                  member.type === 'user'
                    ? (user?.name.split(' ')[0] ?? member.id)
                    : `group:${member.id}`;
                return (
                  <span
                    key={`${member.id}-${index}`}
                    className={`inline-flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      member.type === 'user'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-violet-500/15 text-violet-300'
                    }`}
                  >
                    {member.type === 'user' && user && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: user.color }}
                        aria-hidden
                      />
                    )}
                    <span className="truncate">{label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
