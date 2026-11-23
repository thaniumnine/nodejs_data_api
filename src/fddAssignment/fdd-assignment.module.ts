import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { FddAssignmentController, FddUnscheduledController } from './fdd-assignment.controller';
import { FddAssignmentService } from './fdd-assignment.service';

@Module({
  imports: [AuthModule, OrganisationModule],
  controllers: [FddAssignmentController, FddUnscheduledController],
  providers: [FddAssignmentService],
})
export class FddAssignmentModule {}
