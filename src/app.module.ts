import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { TopicRecordsModule } from './topic-records/topic-records.module';
import { TopicsModule } from './topics/topics.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, TopicsModule, TopicRecordsModule],
  controllers: [HealthController]
})
export class AppModule {}
