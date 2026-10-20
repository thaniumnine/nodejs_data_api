import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { FddCommentController } from './fdd-comment.controller';
import { FddCommentService } from './fdd-comment.service';

@Module({
  imports: [AuthModule, OrganisationModule],
  controllers: [FddCommentController],
  providers: [FddCommentService],
})
export class FddCommentModule {}
