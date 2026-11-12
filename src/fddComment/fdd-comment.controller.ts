import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FddCommentService } from './fdd-comment.service';

const assignmentIdSchema = z.string().refine(
  (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 9223372036854775807n,
  'Assignment ID must be a positive BIGINT',
);

const createCommentSchema = z.object({
  comment: z.string().trim().min(1),
  firebase_user_id: z.string().trim().min(1),
}).strict();

type CreateCommentBody = z.infer<typeof createCommentSchema>;

@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/fdd/assignments/:assignment_id/comments')
export class FddCommentController {
  constructor(private readonly commentService: FddCommentService) { }


  @Post()
  createComment(
    @Param('organisation') organisation: string,
    @Param('assignment_id', new ZodValidationPipe(assignmentIdSchema))
    assignmentId: string,
    @Body(new ZodValidationPipe(createCommentSchema))
    body: CreateCommentBody,
  ) {
    return this.commentService.createComment(
      organisation,
      assignmentId,
      body.comment,
      body.firebase_user_id
    );
  }

  @Get()
  listComments(
    @Param('organisation') organisation: string,
    @Param('assignment_id', new ZodValidationPipe(assignmentIdSchema))
    assignmentId: string,
  ) {
    return this.commentService.listComments(
      organisation,
      assignmentId
    );
  }
}
