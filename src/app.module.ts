import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { TopicRecordsModule } from './topic-records/topic-records.module';
import { TopicsModule } from './topics/topics.module';
import { UsersModule } from './users/users.module';
import { AggregationRecordsModule } from './aggregation-records/aggregation-records.module';
import { AggregationModule } from './aggregationController/aggregation.module';
import { HomeController } from './home.controller';
import { HistoryModule } from './historyController/history.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, TopicsModule, TopicRecordsModule,AggregationRecordsModule,AggregationModule,HistoryModule],
  controllers: [HealthController,HomeController]
})
export class AppModule {}
