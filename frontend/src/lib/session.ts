import { jwtDecrypt, EncryptJWT } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TokenResponse, idTokenClaims, tokenRequest } from './oidc';

export const SESSION_COOKIE = 'fga_session';
const REFRESH_MARGIN_MS = 30_000;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
  user: SessionUser;
}

const key = Buffer.from(
  process.env.AUTH_SECRET ?? 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
  'base64',
);

export function sessionFromTokens(tokens: TokenResponse): SessionData {
  const claims = idTokenClaims(tokens.id_token);
  const id = claims.preferred_username ?? '';
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    user: {
      id,
      name: `${claims.given_name ?? ''} ${claims.family_name ?? ''}`.trim() || id,
      email: claims.email ?? '',
    },
  };
}

export async function encryptSession(session: SessionData): Promise<string> {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .encrypt(key);
}

export async function decryptSession(cookieValue: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtDecrypt(cookieValue, key);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: false,
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function attachSession(response: NextResponse, encrypted: string): void {
  response.cookies.set(SESSION_COOKIE, encrypted, sessionCookieOptions());
}

export function clearSession(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
}

/**
 * Resolves the current session, refreshing the access token if it is about to
 * expire (persisting the refreshed cookie). Null when anonymous or when the
 * refresh failed.
 */
export async function resolveSession(): Promise<SessionData | null> {
  const store = await cookies();
  const cookieValue = store.get(SESSION_COOKIE)?.value;
  if (!cookieValue) {
    return null;
  }
  const session = await decryptSession(cookieValue);
  if (!session) {
    return null;
  }
  if (session.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return session;
  }

  const tokens = await tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: session.refreshToken,
  });
  if (!tokens) {
    return null;
  }
  const refreshed = sessionFromTokens(tokens);
  store.set(SESSION_COOKIE, await encryptSession(refreshed), sessionCookieOptions());
  return refreshed;
}
