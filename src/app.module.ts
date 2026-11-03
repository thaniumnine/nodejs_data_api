import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { AggregationRecordsModule } from './aggregation-records/aggregation-records.module';
import { AggregationModule } from './aggregation-type/aggregation.module';
import { HomeController } from './home.controller';
import { HistoryModule } from './history/history.module';
import { DeviceMetadataModule } from './deviceMetadata/deviceMetadata.module';
import { FddHistoryModule } from './fddHistory/fdd-history.module';
import { FddAssignmentModule } from './fddAssignment/fdd-assignment.module';
import { FddCommentModule } from './fddComment/fdd-comment.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, AggregationRecordsModule, AggregationModule, HistoryModule, DeviceMetadataModule, FddHistoryModule, FddAssignmentModule, FddCommentModule],
  controllers: [HealthController, HomeController]
})
export class AppModule { }
