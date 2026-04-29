import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import {
  CreateNativeRowDto,
  CreateNativeRowSchema,
  CreateTopicEventDto,
  CreateTopicEventSchema,
  QueryTopicRecordsDto,
  QueryTopicRecordsSchema
} from './dto/topic-record.dto';
import { TopicRecordsService } from './topic-records.service';

@UseGuards(JwtAuthGuard)
@Controller('topics/:topic')
export class TopicRecordsController {
  constructor(private readonly topicRecordsService: TopicRecordsService) {}

  @Post('events')
  createTopicEvent(
    @Param('topic') topicName: string,
    @Body(new ZodValidationPipe(CreateTopicEventSchema)) body: CreateTopicEventDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.topicRecordsService.createJsonbEvent(topicName, body, user);
  }

  @Get('events')
  queryTopicEvents(
    @Param('topic') topicName: string,
    @Query(new ZodValidationPipe(QueryTopicRecordsSchema)) query: QueryTopicRecordsDto
  ) {
    return this.topicRecordsService.queryTopicRecords(topicName, query);
  }

  @Get('devices/:deviceId/latest')
  latestByDevice(@Param('topic') topicName: string, @Param('deviceId') deviceId: string) {
    return this.topicRecordsService.latestByDevice(topicName, deviceId);
  }

  @Post('rows')
  createNativeRow(
    @Param('topic') topicName: string,
    @Body(new ZodValidationPipe(CreateNativeRowSchema)) body: CreateNativeRowDto
  ) {
    return this.topicRecordsService.createNativeRow(topicName, body.row);
  }
}
