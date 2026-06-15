import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '../config/env';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AccessTokenPayload } from './types/access-token-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();

    const token = this.extractBearerToken(request.headers.authorization);

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: env.JWT_ACCESS_SECRET
      });

      const user = await this.usersService.findActiveById(payload.sub);
      if (!user) throw new UnauthorizedException('User is not active');

      const sessionActive = await this.sessionsService.isSessionActive(payload.sid, user.id);
      if (!sessionActive) throw new UnauthorizedException('Session is not active');

      request.user = {
        id: user.id,
        email: user.email,
        roles: Array.isArray(user.roles) ? (user.roles as string[]) : [],
        sessionId: payload.sid
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractBearerToken(authorizationHeader?: string): string {
    const [scheme, token] = authorizationHeader?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return token;
  }
}
