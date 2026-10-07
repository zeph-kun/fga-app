import { NextResponse } from 'next/server';
import { resolveSession } from '@/lib/session';

/** Lightweight session probe for the client UI. Never exposes tokens. */
export async function GET(): Promise<NextResponse> {
  const session = await resolveSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: session.user,
  });
}
