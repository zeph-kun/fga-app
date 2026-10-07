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
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">FGA Playground</h1>
        <p className="mt-2 text-sm text-slate-400">
          Fine-Grained Authorization avec authentification OAuth/OIDC (Keycloak).
          Connectez-vous pour voir vos documents et permissions.
        </p>

        {reason && (
          <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{reason}</p>
        )}

        <a
          href="/api/auth/login"
          className="mt-6 block rounded-lg bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Se connecter avec Keycloak
        </a>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Comptes de démonstration
          </p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs text-slate-400">
            {DEMO_ACCOUNTS.map(([username, password]) => (
              <span key={username}>
                {username} / {password}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
