import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';

export interface AuthenticatedUser {
  /** FGA user id — Keycloak preferred_username. */
  id: string;
  name: string;
  email: string;
}

export type RequestWithUser = Request & { user: AuthenticatedUser };

const AVATAR_COLORS = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#ec4899', '#14b8a6'];

/**
 * Global guard: validates Keycloak access tokens (signature via JWKS, issuer,
 * expiry, allowed clients) and derives the request identity from the token
 * claims instead of trusting any client-supplied user parameter.
 *
 * Unknown users are auto-provisioned into the directory so a Keycloak user
 * that is not part of the seed still maps to a first-class FGA user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;
  private readonly allowedClients: Set<string>;

  constructor(private readonly db: DatabaseService) {
    this.issuer = process.env.KEYCLOAK_ISSUER ?? 'http://localhost:8180/realms/fga';
    const jwksUrl =
      process.env.KEYCLOAK_JWKS_URL ?? 'http://keycloak:8080/realms/fga/protocol/openid-connect/certs';
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
    this.allowedClients = new Set(
      (process.env.KEYCLOAK_ALLOWED_CLIENTS ?? 'fga-web').split(',').map((c) => c.trim()),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: Record<string, unknown>;
    try {
      const verified = await jwtVerify(header.slice('Bearer '.length), this.jwks, {
        issuer: this.issuer,
        clockTolerance: 5,
      });
      payload = verified.payload as Record<string, unknown>;
    } catch (error) {
      throw new UnauthorizedException(
        `Invalid access token: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    const clientId = String(payload.azp ?? '');
    if (!this.allowedClients.has(clientId)) {
      throw new UnauthorizedException(`Client "${clientId}" is not allowed`);
    }

    const id = String(payload.preferred_username ?? '');
    if (!id) {
      throw new UnauthorizedException('Token has no preferred_username claim');
    }

    const user: AuthenticatedUser = {
      id,
      name: `${payload.given_name ?? ''} ${payload.family_name ?? ''}`.trim() || id,
      email: String(payload.email ?? ''),
    };
    request.user = user;

    await this.ensureDirectoryEntry(user);
    return true;
  }

  private async ensureDirectoryEntry(user: AuthenticatedUser): Promise<void> {
    const color = AVATAR_COLORS[[...user.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
    try {
      await this.db.query(
        `INSERT INTO users (id, name, email, color) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.name, user.email, color],
      );
    } catch {
      // The id already exists, or the email collides with another row: the
      // directory entry is a convenience, never a security boundary.
    }
  }
}
