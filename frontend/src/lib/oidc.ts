/**
 * Server-side Keycloak/OIDC configuration.
 *
 * Split-horizon URLs: browsers talk to the public URL (host-published port),
 * server-to-server requests use the internal Docker URL.
 */
export const oidcConfig = {
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  publicUrl: process.env.KEYCLOAK_PUBLIC_URL ?? 'http://localhost:8180',
  internalUrl: process.env.KEYCLOAK_INTERNAL_URL ?? 'http://keycloak:8080',
  realm: process.env.KEYCLOAK_REALM ?? 'fga',
  clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'fga-web',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? 'fga-web-secret',
};

export function realmBase(base: string): string {
  return `${base}/realms/${oidcConfig.realm}`;
}

export function authorizeEndpoint(): string {
  return `${realmBase(oidcConfig.publicUrl)}/protocol/openid-connect/auth`;
}

/** Server-to-server: token endpoint over the internal Docker network. */
export function tokenEndpoint(): string {
  return `${realmBase(oidcConfig.internalUrl)}/protocol/openid-connect/token`;
}

export function endSessionEndpoint(): string {
  return `${realmBase(oidcConfig.publicUrl)}/protocol/openid-connect/logout`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export async function tokenRequest(grant: Record<string, string>): Promise<TokenResponse | null> {
  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oidcConfig.clientId,
      client_secret: oidcConfig.clientSecret,
      ...grant,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as TokenResponse;
}

/** Decodes the id_token payload; the token comes from the token endpoint over TLS. */
export function idTokenClaims(idToken: string): { preferred_username?: string; given_name?: string; family_name?: string; email?: string } {
  const [, payload] = idToken.split('.');
  if (!payload) {
    return {};
  }
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}
