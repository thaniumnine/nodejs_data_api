import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '../config/env';
import { User } from '../database/db.types';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { hashPassword, verifyPassword } from './password';
import { AccessTokenPayload } from './types/access-token-payload';
import { Logger } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';

type CreateUserInput = {
  email: string;
  password: string;
  displayName?: string;
};

type CreatedUser = {
  id: string;
  email: string;
  display_name: string | null;
};


@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService
  ) { }

  async register(input: CreateUserInput): Promise<CreatedUser> {
    if (!env.AUTH_ALLOW_REGISTRATION) {
      throw new ForbiddenException('Registration is disabled');
    }

    return this.createStandardUser(input);
  }

  async createUserByAdmin(
    admin: AuthenticatedUser,
    organisationName: string,
    input: CreateUserInput
  ): Promise<CreatedUser> {
    if (!admin.roles.includes('admin')) {
      throw new ForbiddenException(
        'Only administrators can create users'
      );
    }

    const orgRefId =
      await this.usersService.findOrganisationIdByName(
        organisationName
      );

    if (!orgRefId || !admin.orgRefIds.includes(orgRefId)) {
      throw new ForbiddenException(
        'You do not have access to this organisation'
      );
    }

    return this.createStandardUser(input, [orgRefId]);
  }

  private async createStandardUser(
    input: CreateUserInput,
    orgRefIds: string[] = []
  ): Promise<CreatedUser> {
    const passwordHash = await hashPassword(input.password);

    const user = await this.usersService.createUser({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      roles: ['user'],
      orgRefIds
    });

    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name
    };
  }

  async login(input: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await verifyPassword(input.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { session, refreshToken } = await this.sessionsService.createSession({
      userId: user.id,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress
    });

    return {
      access_token: await this.signAccessToken(user, session.id),
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: env.ACCESS_TOKEN_TTL_SECONDS
    };
  }

  async refresh(input: { refreshToken: string; userAgent?: string; ipAddress?: string }) {
    const { session, refreshToken } = await this.sessionsService.rotateRefreshToken({
      refreshToken: input.refreshToken,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress
    });

    const user = await this.usersService.findActiveById(session.user_id);
    if (!user) {
      throw new UnauthorizedException('User is not active');
    }

    return {
      access_token: await this.signAccessToken(user, session.id),
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: env.ACCESS_TOKEN_TTL_SECONDS
    };
  }

  private signAccessToken(user: User, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      sid: sessionId,
      roles: Array.isArray(user.roles) ? (user.roles as string[]) : []
    };

    return this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS
    });
  }
}
