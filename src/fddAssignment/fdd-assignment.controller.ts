import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FddAssignmentService } from './fdd-assignment.service';

const fddOutIdSchema = z.string().refine(
  (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 9223372036854775807n,
  'FDD record ID must be a positive BIGINT',
);
const createAssignmentSchema = z.object({
  firebase_user_id: z.string().trim().min(1),
}).strict();

type CreateAssignmentBody = z.infer<typeof createAssignmentSchema>;

@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/fdd/:fdd_out_id/assignments')
export class FddAssignmentController {
  constructor(private readonly assignmentService: FddAssignmentService) {}

  @Post()
  createAssignment(
    @Param('organisation') organisation: string,
    @Param('fdd_out_id', new ZodValidationPipe(fddOutIdSchema)) fddOutId: string,
    @Body(new ZodValidationPipe(createAssignmentSchema)) body: CreateAssignmentBody,
  ) {
    return this.assignmentService.createAssignment(organisation, fddOutId, body.firebase_user_id);
  }

  @Get()
  listAssignments(
    @Param('organisation') organisation: string,
    @Param('fdd_out_id', new ZodValidationPipe(fddOutIdSchema)) fddOutId: string,
  ) {
    return this.assignmentService.listAssignments(organisation, fddOutId);
  }
}
