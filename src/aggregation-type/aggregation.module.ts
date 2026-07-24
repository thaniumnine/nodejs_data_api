import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AggregationController } from './aggregation.controller';
import { AggregationService } from './aggregation.service';
import { OrganisationModule } from '../organisations/organisations.module';

@Module({
  imports: [AuthModule,OrganisationModule],
  controllers: [AggregationController],
  providers: [AggregationService],
  exports: [AggregationService]
})
export class AggregationModule { }
