import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateTopicDto, CreateTopicSchema, UpdateTopicDto, UpdateTopicSchema } from './dto/topic.dto';
import { TopicsService } from './topics.service';

@UseGuards(JwtAuthGuard)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  createTopic(@Body(new ZodValidationPipe(CreateTopicSchema)) body: CreateTopicDto) {
    return this.topicsService.create(body);
  }

  @Get()
  listTopics() {
    return this.topicsService.list();
  }

  @Get(':topic')
  getTopic(@Param('topic') topicName: string) {
    return this.topicsService.getRequiredByName(topicName);
  }

  @Patch(':topic')
  updateTopic(
    @Param('topic') topicName: string,
    @Body(new ZodValidationPipe(UpdateTopicSchema)) body: UpdateTopicDto
  ) {
    return this.topicsService.update(topicName, body);
  }
}
