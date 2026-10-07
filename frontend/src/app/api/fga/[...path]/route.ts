import { NextRequest, NextResponse } from 'next/server';
import { resolveSession } from '@/lib/session';

const API_URL = process.env.API_INTERNAL_URL ?? 'http://api:3000';

/**
 * Server-side proxy to the NestJS API. The Keycloak access token never
 * reaches the browser: it lives in the encrypted httpOnly session cookie
 * and is attached here, server-side.
 */
async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const session = await resolveSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const incoming = new URL(request.url);
  const target = `${API_URL}/${path.join('/')}${incoming.search}`;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const upstream = await fetch(target, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
}

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}
