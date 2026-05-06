import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TopicsModule } from '../topics/topics.module';
import { AggregationController } from './aggregation.controller';
import { AggregationService } from './aggregation.service';


@Module({
  imports: [AuthModule],
  controllers: [AggregationController],
  providers: [AggregationService]
})
export class AggregationModule {}
