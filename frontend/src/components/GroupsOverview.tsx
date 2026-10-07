'use client';

import { Group, User } from '@/lib/api';

interface Props {
  groups: Group[];
  users: User[];
}

export default function GroupsOverview({ groups, users }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Groupes et membres
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-sm font-medium text-slate-200">
              {group.name}
              <span className="ml-1 font-mono text-[10px] text-slate-500">group:{group.id}</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {group.members.map((member, index) => {
                const label =
                  member.type === 'user'
                    ? (users.find((u) => u.id === member.id)?.name.split(' ')[0] ?? member.id)
                    : `group:${member.id}`;
                return (
                  <span
                    key={`${member.id}-${index}`}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      member.type === 'user'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-violet-500/15 text-violet-300'
                    }`}
                  >
                    {label}
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
