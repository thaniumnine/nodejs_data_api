import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OrganisationUsersController } from './organisation-users.controller';

@Module({
  imports: [JwtModule.register({}), UsersModule, SessionsModule],
  controllers: [AuthController, OrganisationUsersController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, AuthService, JwtModule, UsersModule, SessionsModule]
})
export class AuthModule { }
