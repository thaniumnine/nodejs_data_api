import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ScheduleEntriesService } from './schedule-entries.service';

// Validate task IDs as positive PostgreSQL BIGINTs.
const taskIdSchema = z.string().refine(
  id =>
    /^[1-9]\d*$/.test(id) &&
    BigInt(id) <= 9223372036854775807n,
  'Task ID must be a positive BIGINT',
);

const entryIdSchema = z.string().uuid();

// Require an ISO timestamp with timezone information.
const scheduleTimeSchema = z.string().datetime({
  offset: true,
});

const createScheduleEntrySchema = z.object({
  scheduled_time: scheduleTimeSchema,
  status: z.enum(['Planned', 'Completed', 'Cancelled']).optional(),
  is_locked: z.boolean().optional(),
}).strict();

const updateScheduleEntrySchema =
  createScheduleEntrySchema.partial().refine(
    body => Object.keys(body).length > 0,
    'At least one field must be provided',
  );

type CreateScheduleEntryBody =
  z.infer<typeof createScheduleEntrySchema>;

type UpdateScheduleEntryBody =
  z.infer<typeof updateScheduleEntrySchema>;

@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/tasks/:task_id/schedule-entries')
export class ScheduleEntriesController {
  constructor(
    private readonly scheduleEntriesService: ScheduleEntriesService,
  ) { }

  // Create a booking for a task.
  @Post()
  createScheduleEntry(
    @Param('organisation') organisation: string,
    @Param('task_id', new ZodValidationPipe(taskIdSchema))
    taskId: string,
    @Body(new ZodValidationPipe(createScheduleEntrySchema))
    body: CreateScheduleEntryBody,
  ) {
    return this.scheduleEntriesService.createScheduleEntry(
      organisation,
      taskId,
      body,
    );
  }

  // Retrieve all bookings for a task.
  @Get()
  listScheduleEntries(
    @Param('organisation') organisation: string,
    @Param('task_id', new ZodValidationPipe(taskIdSchema))
    taskId: string,
  ) {
    return this.scheduleEntriesService.listScheduleEntries(
      organisation,
      taskId,
    );
  }

  // Update a booking.
  @Patch(':entry_id')
  updateScheduleEntry(
    @Param('organisation') organisation: string,
    @Param('task_id', new ZodValidationPipe(taskIdSchema))
    taskId: string,
    @Param('entry_id', new ZodValidationPipe(entryIdSchema))
    entryId: string,
    @Body(new ZodValidationPipe(updateScheduleEntrySchema))
    body: UpdateScheduleEntryBody,
  ) {
    return this.scheduleEntriesService.updateScheduleEntry(
      organisation,
      taskId,
      entryId,
      body,
    );
  }
}
