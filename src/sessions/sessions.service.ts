import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { DatabaseService } from '../database/database.service';
import { UserSession } from '../database/db.types';
import { createOpaqueToken, hashToken } from './token.util';

@Injectable()
export class SessionsService {
  constructor(private readonly database: DatabaseService) { }

  async createSession(input: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    refreshTokenFamily?: string;
  }): Promise<{ session: UserSession; refreshToken: string }> {
    const refreshToken = createOpaqueToken();
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

    const session = await this.database.db
      .insertInto('user_sessions')
      .values({
        user_id: input.userId,
        refresh_token_hash: refreshTokenHash,
        refresh_token_family: input.refreshTokenFamily ?? randomUUID(),
        user_agent: input.userAgent ?? null,
        ip_address: input.ipAddress ?? null,
        expires_at: expiresAt
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return { session, refreshToken };
  }

  async rotateRefreshToken(input: {
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ session: UserSession; refreshToken: string }> {
    const tokenHash = hashToken(input.refreshToken);
    const existingSession = await this.database.db
      .selectFrom('user_sessions')
      .selectAll()
      .where('refresh_token_hash', '=', tokenHash)
      .executeTakeFirst();

    if (!existingSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existingSession.revoked_at) {
      await this.revokeRefreshTokenFamily(existingSession.refresh_token_family);
      throw new UnauthorizedException('Refresh token has already been used');
    }

    if (new Date(existingSession.expires_at) <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const next = await this.database.db.transaction().execute(async (trx) => {
      const refreshToken = createOpaqueToken();
      const refreshTokenHash = hashToken(refreshToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

      const session = await trx
        .insertInto('user_sessions')
        .values({
          user_id: existingSession.user_id,
          refresh_token_hash: refreshTokenHash,
          refresh_token_family: existingSession.refresh_token_family,
          user_agent: input.userAgent ?? existingSession.user_agent,
          ip_address: input.ipAddress ?? existingSession.ip_address,
          expires_at: expiresAt
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('user_sessions')
        .set({
          revoked_at: new Date(),
          last_used_at: new Date(),
          replaced_by_session_id: session.id
        })
        .where('id', '=', existingSession.id)
        .execute();

      return { session, refreshToken };
    });

    return next;
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.database.db
      .updateTable('user_sessions')
      .set({ revoked_at: new Date() })
      .where('id', '=', sessionId)
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute();
  }

  async isSessionActive(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.database.db
      .selectFrom('user_sessions')
      .select(['id', 'expires_at', 'revoked_at'])
      .where('id', '=', sessionId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!session || session.revoked_at) return false;
    return new Date(session.expires_at) > new Date();
  }

  private async revokeRefreshTokenFamily(refreshTokenFamily: string): Promise<void> {
    await this.database.db
      .updateTable('user_sessions')
      .set({ revoked_at: new Date() })
      .where('refresh_token_family', '=', refreshTokenFamily)
      .where('revoked_at', 'is', null)
      .execute();
  }
}
