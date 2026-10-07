import { NextRequest, NextResponse } from 'next/server';
import { oidcConfig, tokenRequest } from '@/lib/oidc';
import { attachSession, encryptSession, sessionFromTokens } from '@/lib/session';

interface OidcState {
  verifier: string;
  state: string;
  returnTo: string;
}

/** OAuth callback: verifies state, exchanges the code with PKCE, stores the session. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const rawCookie = request.cookies.get('fga_oidc')?.value;

  if (!code || !rawCookie) {
    return NextResponse.redirect(`${oidcConfig.appUrl}/?error=missing_code`);
  }

  let flow: OidcState;
  try {
    flow = JSON.parse(rawCookie) as OidcState;
  } catch {
    return NextResponse.redirect(`${oidcConfig.appUrl}/?error=bad_flow_state`);
  }

  if (!state || state !== flow.state) {
    return NextResponse.redirect(`${oidcConfig.appUrl}/?error=state_mismatch`);
  }

  const tokens = await tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${oidcConfig.appUrl}/api/auth/callback`,
    code_verifier: flow.verifier,
  });
  if (!tokens) {
    return NextResponse.redirect(`${oidcConfig.appUrl}/?error=token_exchange`);
  }

  const session = sessionFromTokens(tokens);
  if (!session.user.id) {
    return NextResponse.redirect(`${oidcConfig.appUrl}/?error=no_username`);
  }

  const response = NextResponse.redirect(`${oidcConfig.appUrl}${flow.returnTo}`);
  attachSession(response, await encryptSession(session));
  response.cookies.delete('fga_oidc');
  return response;
}
