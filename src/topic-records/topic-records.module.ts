import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TopicsModule } from '../topics/topics.module';
import { TopicRecordsController } from './topic-records.controller';
import { TopicRecordsService } from './topic-records.service';

@Module({
  imports: [AuthModule, TopicsModule],
  controllers: [TopicRecordsController],
  providers: [TopicRecordsService]
})
export class TopicRecordsModule {}
