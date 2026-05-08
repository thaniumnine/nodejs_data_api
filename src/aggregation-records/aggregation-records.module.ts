import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TopicsModule } from '../topics/topics.module';
import { AggregationRecordsController } from './aggregation-records.controller';
import { AggregationRecordsService } from './aggregation-records.service';
import { AggregationModule } from 'src/aggregationController/aggregation.module';


@Module({
  imports: [AuthModule,AggregationModule],
  controllers: [AggregationRecordsController],
  providers: [AggregationRecordsService]
})
export class AggregationRecordsModule {}
