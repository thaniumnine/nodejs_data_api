import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto, RegisterSchema } from './dto/auth.dto';

@Controller('organisations/:organisation/users')
@UseGuards(JwtAuthGuard)
export class OrganisationUsersController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @Post()
  createUser(
    @Param('organisation') organisation: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RegisterSchema))
    body: RegisterDto
  ) {
    return this.authService.createUserByAdmin(
      user,
      organisation,
      {
        email: body.email,
        password: body.password,
        displayName: body.display_name
      }
    );
  }

  @Get()
  getUsers(
    @Param('organisation') organisation: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.authService.getOrganisationUsers(
      user,
      organisation
    );
  }
}