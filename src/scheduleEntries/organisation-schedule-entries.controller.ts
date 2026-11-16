
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ScheduleEntriesService } from './schedule-entries.service';

// Validate YYYY-MM-DD dates.
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date');

const scheduleRangeSchema = z.object({
  from: dateSchema,
  to: dateSchema,
}).strict().refine(
  (range) => range.from <= range.to,
  { message: 'From date must not be after to date', path: ['to'] },
);

type ScheduleRange = z.infer<typeof scheduleRangeSchema>;

@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/schedule-entries')
export class OrganisationScheduleEntriesController {
  constructor(
    private readonly scheduleEntriesService: ScheduleEntriesService,
  ) {}

  @Get()
  listOrganisationScheduleEntries(
    @Param('organisation') organisation: string,
    @Query(new ZodValidationPipe(scheduleRangeSchema))
    range: ScheduleRange,
  ) {
    return this.scheduleEntriesService.listOrganisationScheduleEntries(
      organisation,
      range.from,
      range.to,
    );
  }
}
