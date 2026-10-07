'use client';

interface Props {
  reason?: string | null;
}

const DEMO_ACCOUNTS = [
  ['alice', 'alice123'],
  ['bob', 'bob123'],
  ['carol', 'carol123'],
  ['dave', 'dave123'],
  ['eve', 'eve123'],
];

export default function LoginScreen({ reason }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="animate-rise w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 shadow-lg shadow-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-slate-950" aria-hidden>
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
          <div>
            <h1 className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              FGA Playground
            </h1>
            <p className="text-xs text-slate-500">Fine-Grained Authorization</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-400">
          Démonstration d&apos;autorisation fine-grain inspirée de Zanzibar : tuples de
          relations, groupes imbriqués, héritage par dossiers. Authentification OAuth/OIDC
          via Keycloak.
        </p>

        {reason && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
            {reason}
          </p>
        )}

        <a
          href="/api/auth/login"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:brightness-95"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M12 4a4 4 0 00-4 4v3H7a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1v-7a1 1 0 00-1-1h-1V8a4 4 0 00-4-4zm-2 7V8a2 2 0 114 0v3h-4z"
              fill="currentColor"
            />
          </svg>
          Se connecter avec Keycloak
        </a>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Comptes de démonstration
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map(([username, password]) => (
              <span
                key={username}
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 font-mono text-xs text-slate-400"
              >
                {username}
                <span className="text-slate-600"> / </span>
                {password}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
