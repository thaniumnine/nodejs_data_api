import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { number, string } from 'zod';
import {AggregationData, AggregationRecordsService, QueryAggregationRecords, QueryAggregationRecordsSchema} from './aggregation-records.service.js'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@UseGuards(JwtAuthGuard)
@Controller('aggregation/:device_type')
export class AggregationRecordsController {
  constructor(   private readonly aggregationService: AggregationRecordsService) {}

@Get('data')
queryAggregationData(
  @Param('device_type') deviceType: string,
  @Query(new ZodValidationPipe(QueryAggregationRecordsSchema)) query: QueryAggregationRecords
 // @Query("from") from:string , @Query("to") to:string
) {

   return this.aggregationService.queryAggregationRecords(deviceType,query);
}



@Post('data')
createAggregationData(
  @Param('device_type') deviceType: string,
  @Body() aggregationData: AggregationData,
) {
    return this.aggregationService.createAggregationDataEvent(deviceType,aggregationData)
    }    
}


