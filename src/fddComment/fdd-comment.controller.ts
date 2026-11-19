import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FddCommentService } from './fdd-comment.service';

const fddAssignmentIdSchema = z.string().refine(
  (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 9223372036854775807n,
  'Assignment ID must be a positive BIGINT',
);

const createCommentSchema = z.object({
  comment: z.string().trim().min(1),
  firebase_user_id: z.string().trim().min(1),
  remaining_minutes: z.number().int().min(0).optional(),
  minutes_worked: z.number().int().min(0).optional(),
}).strict();

type CreateCommentBody = z.infer<typeof createCommentSchema>;

@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/fdd/assignments/:fdd_assignment_id/comments')
export class FddCommentController {
  constructor(private readonly commentService: FddCommentService) { }


  @Post()
  createComment(
    @Param('organisation') organisation: string,
    @Param('fdd_assignment_id', new ZodValidationPipe(fddAssignmentIdSchema))
    fddAssignmentId: string,
    @Body(new ZodValidationPipe(createCommentSchema))
    body: CreateCommentBody,
  ) {
    return this.commentService.createComment(
      organisation,
      fddAssignmentId,
      body.comment,
      body.firebase_user_id,
      body.remaining_minutes,
      body.minutes_worked,
    );
  }

  @Get()
  listComments(
    @Param('organisation') organisation: string,
    @Param('fdd_assignment_id', new ZodValidationPipe(fddAssignmentIdSchema))
    fddAssignmentId: string,
  ) {
    return this.commentService.listComments(
      organisation,
      fddAssignmentId
    );
  }
}
