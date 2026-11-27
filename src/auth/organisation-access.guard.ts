import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';

import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AuthService } from './auth.service';

@Injectable()
export class OrganisationAccessGuard
  implements CanActivate {

  constructor(
    private readonly authService: AuthService
  ) {}

  async canActivate(
    context: ExecutionContext
  ): Promise<boolean> {

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params?: { organisation?: string };
      method: string;
    }>();

    const user = request.user;
    const organisation = request.params?.organisation;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required'
      );
    }

    if (!organisation) {
      throw new ForbiddenException(
        'Organisation is required'
      );
    }

    // Check organisation membership
    await this.authService.requireOrganisationAccess(
      user,
      organisation
    );

    // Administrators can perform read and write operations
    if (user.roles.includes('admin')) {
      return true;
    }

    // Normal users have read-only access
    if (
      user.roles.includes('user') &&
      request.method === 'GET'
    ) {
      return true;
    }

    throw new ForbiddenException(
      'Insufficient permissions to perform this action'
    );
  }
}