import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SessionsService } from '../sessions/sessions.service';
import { AuthService } from './auth.service';
import { LoginDto, LoginSchema, RefreshDto, RefreshSchema, RegisterDto, RegisterSchema } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

type RequestInfo = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

function getClientIp(request: RequestInfo): string | undefined {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') return forwardedFor.split(',')[0]?.trim();
  if (Array.isArray(forwardedFor)) return forwardedFor[0];
  return request.ip;
}

function getUserAgent(request: RequestInfo): string | undefined {
  const userAgent = request.headers['user-agent'];
  return Array.isArray(userAgent) ? userAgent[0] : userAgent;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService
  ) {}

  @Post('register')
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: RegisterDto) {
    return this.authService.register({
      email: body.email,
      password: body.password,
      displayName: body.display_name
    });
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginDto, @Req() request: RequestInfo) {
    return this.authService.login({
      email: body.email,
      password: body.password,
      userAgent: getUserAgent(request),
      ipAddress: getClientIp(request)
    }); 
  }

  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(RefreshSchema)) body: RefreshDto, @Req() request: RequestInfo) {
    return this.authService.refresh({
      refreshToken: body.refresh_token,
      userAgent: getUserAgent(request),
      ipAddress: getClientIp(request)
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.sessionsService.revokeSession(user.sessionId, user.id);
    return { status: 'logged_out' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
