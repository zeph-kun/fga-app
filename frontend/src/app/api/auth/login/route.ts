import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeEndpoint, oidcConfig } from '@/lib/oidc';

/**
 * Starts the OAuth 2.0 authorization code flow with PKCE (S256).
 * The verifier is kept in a short-lived httpOnly cookie until the callback.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(16).toString('base64url');

  const requestedReturnTo = new URL(request.url).searchParams.get('returnTo') ?? '/';
  const returnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: oidcConfig.clientId,
    redirect_uri: `${oidcConfig.appUrl}/api/auth/callback`,
    scope: 'openid profile email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(`${authorizeEndpoint()}?${params}`);
  response.cookies.set('fga_oidc', JSON.stringify({ verifier, state, returnTo }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
