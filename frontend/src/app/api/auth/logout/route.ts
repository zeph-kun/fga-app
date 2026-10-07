import { NextRequest, NextResponse } from 'next/server';
import { endSessionEndpoint, oidcConfig } from '@/lib/oidc';
import { clearSession, decryptSession, SESSION_COOKIE } from '@/lib/session';

/** Logout: clears the local session, then ends the Keycloak SSO session. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const session = cookieValue ? await decryptSession(cookieValue) : null;

  const params = new URLSearchParams({
    client_id: oidcConfig.clientId,
    'post_logout_redirect_uri': oidcConfig.appUrl,
  });
  if (session?.idToken) {
    params.set('id_token_hint', session.idToken);
  }

  const response = NextResponse.redirect(`${endSessionEndpoint()}?${params}`);
  clearSession(response);
  return response;
}
