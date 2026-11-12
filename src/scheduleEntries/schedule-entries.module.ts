import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { ScheduleEntriesController } from './schedule-entries.controller';
import { ScheduleEntriesService } from './schedule-entries.service';

@Module({
  imports: [AuthModule, OrganisationModule],
  controllers: [ScheduleEntriesController],
  providers: [ScheduleEntriesService],
  exports: [ScheduleEntriesService],
})
export class ScheduleEntriesModule {}