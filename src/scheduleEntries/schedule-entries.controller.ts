
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ScheduleEntriesService } from './schedule-entries.service';

// FDD assignment IDs are positive BIGINT values.
const fddAssignmentIdSchema = z.string().refine(
  (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 9223372036854775807n,
  'FDD assignment ID must be a positive BIGINT',
);

// Schedule entry IDs are UUIDs.
const scheduleEntryIdSchema = z.string().uuid();

// Validate a calendar date in YYYY-MM-DD format.
const scheduledDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date');

// Body for creating a schedule entry.
const createScheduleEntrySchema = z.object({
  scheduled_date: scheduledDateSchema,
  scheduled_minutes: z.number().int().positive(),
  status: z.enum(['Planned', 'Completed', 'Cancelled']).optional(),
  is_locked: z.boolean().optional(),
}).strict();

// Body for updating an existing entry.
const updateScheduleEntrySchema = createScheduleEntrySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided',
  );

type CreateScheduleEntryBody = z.infer<typeof createScheduleEntrySchema>;
type UpdateScheduleEntryBody = z.infer<typeof updateScheduleEntrySchema>;

@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/fdd/assignments/:fdd_assignment_id/schedule-entries')
export class ScheduleEntriesController {
  constructor(
    private readonly scheduleEntriesService: ScheduleEntriesService,
  ) {}

  // Create a new schedule entry.
  @Post()
  createScheduleEntry(
    @Param('organisation') organisation: string,
    @Param('fdd_assignment_id', new ZodValidationPipe(fddAssignmentIdSchema))
    fddAssignmentId: string,
    @Body(new ZodValidationPipe(createScheduleEntrySchema))
    body: CreateScheduleEntryBody,
  ) {
    return this.scheduleEntriesService.createScheduleEntry(
      organisation,
      fddAssignmentId,
      body,
    );
  }

  // Get all schedule entries for an FDD assignment.
  @Get()
  listScheduleEntries(
    @Param('organisation') organisation: string,
    @Param('fdd_assignment_id', new ZodValidationPipe(fddAssignmentIdSchema))
    fddAssignmentId: string,
  ) {
    return this.scheduleEntriesService.listScheduleEntries(
      organisation,
      fddAssignmentId,
    );
  }

  // Update a specific schedule entry.
  @Patch(':entry_id')
  updateScheduleEntry(
    @Param('organisation') organisation: string,
    @Param('fdd_assignment_id', new ZodValidationPipe(fddAssignmentIdSchema))
    fddAssignmentId: string,
    @Param('entry_id', new ZodValidationPipe(scheduleEntryIdSchema))
    entryId: string,
    @Body(new ZodValidationPipe(updateScheduleEntrySchema))
    body: UpdateScheduleEntryBody,
  ) {
    return this.scheduleEntriesService.updateScheduleEntry(
      organisation,
      fddAssignmentId,
      entryId,
      body,
    );
  }
}
