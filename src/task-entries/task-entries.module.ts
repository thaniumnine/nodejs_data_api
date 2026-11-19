import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { TaskEntriesController } from './task-entries.controller';
import { TaskEntriesService } from './task-entries.service';

@Module({
  imports: [AuthModule, OrganisationModule],
  controllers: [TaskEntriesController],
  providers: [TaskEntriesService],
  exports: [TaskEntriesService],
})
export class TaskEntriesModule {}