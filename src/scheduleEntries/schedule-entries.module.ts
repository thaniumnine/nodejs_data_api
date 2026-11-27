import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { ScheduleEntriesController } from './schedule-entries.controller';
import { ScheduleEntriesService } from './schedule-entries.service';
import { OrganisationScheduleEntriesController } from './organisation-schedule-entries.controller';
import { ScheduleReschedulerService } from './schedule-rescheduler.service';
import { AuditLogModule } from '../auditLogs/audit-log.module';

@Module({
  imports: [AuthModule, OrganisationModule, AuditLogModule],
  controllers: [ScheduleEntriesController, OrganisationScheduleEntriesController],
  providers: [ScheduleEntriesService, ScheduleReschedulerService],
  exports: [ScheduleEntriesService],
})
export class ScheduleEntriesModule {}