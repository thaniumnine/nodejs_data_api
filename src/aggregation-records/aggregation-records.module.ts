import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AggregationRecordsController } from './aggregation-records.controller';
import { AggregationRecordsService } from './aggregation-records.service';
import { AggregationModule } from '../aggregation-type/aggregation.module';
import { OrganisationModule } from '../organisations/organisations.module';
import { DeviceIdentifierModule } from 'src/deviceIdentifier/device-identifier.module';


@Module({
  imports: [AuthModule, AggregationModule,OrganisationModule,DeviceIdentifierModule],
  controllers: [AggregationRecordsController],
  providers: [AggregationRecordsService]
})
export class AggregationRecordsModule { }
