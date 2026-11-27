
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TaskEntriesService } from './task-entries.service';
import { OrganisationAccessGuard } from 'src/auth/organisation-access.guard';

// Validate PostgreSQL BIGINT IDs.
const idSchema = z.string().refine(
  (id) =>
    /^[1-9]\d*$/.test(id) &&
    BigInt(id) <= 9223372036854775807n,
  'ID must be a positive BIGINT',
);

// Require at least one unique assignment ID.
const createTaskSchema = z.object({
  assignment_ids: z.array(idSchema).min(1),
}).strict().refine(
  (data) =>
    new Set(data.assignment_ids).size === data.assignment_ids.length,
  'Assignment IDs must be unique',
);

const addAssignmentSchema = z.object({
  assignment_id: idSchema,
}).strict();

type CreateTaskBody = z.infer<typeof createTaskSchema>;
type AddAssignmentBody = z.infer<typeof addAssignmentSchema>;

@UseGuards(JwtAuthGuard, OrganisationAccessGuard)
@Controller('organisations/:organisation/tasks')
export class TaskEntriesController {
  constructor(
    private readonly taskEntriesService: TaskEntriesService,
  ) {}

  // Create a task containing multiple FDD assignments.
  @Post()
  createTask(
    @Param('organisation') organisation: string,
    @Body(new ZodValidationPipe(createTaskSchema))
    body: CreateTaskBody,
  ) {
    return this.taskEntriesService.createTask(
      organisation,
      body.assignment_ids,
    );
  }

  // Retrieve all tasks for an organisation.
  @Get()
  listTasks(
    @Param('organisation') organisation: string,
  ) {
    return this.taskEntriesService.listTasks(organisation);
  }

  // Retrieve one task and its assignments.
  @Get(':task_id')
  getTask(
    @Param('organisation') organisation: string,
    @Param('task_id', new ZodValidationPipe(idSchema))
    taskId: string,
  ) {
    return this.taskEntriesService.getTask(
      organisation,
      taskId,
    );
  }

  // Add an FDD assignment to an existing task.
  @Post(':task_id/assignments')
  addAssignmentToTask(
    @Param('organisation') organisation: string,
    @Param('task_id', new ZodValidationPipe(idSchema))
    taskId: string,
    @Body(new ZodValidationPipe(addAssignmentSchema))
    body: AddAssignmentBody,
  ) {
    return this.taskEntriesService.addAssignmentToTask(
      organisation,
      taskId,
      body.assignment_id,
    );
  }
}
