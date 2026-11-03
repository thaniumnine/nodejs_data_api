import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { FddAssignmentController } from './fdd-assignment.controller';
import { FddAssignmentService } from './fdd-assignment.service';

@Module({
  imports: [AuthModule, OrganisationModule],
  controllers: [FddAssignmentController],
  providers: [FddAssignmentService],
})
export class FddAssignmentModule {}
