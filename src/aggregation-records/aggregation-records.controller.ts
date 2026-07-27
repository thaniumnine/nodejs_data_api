import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { number, string } from 'zod';
import {AggregationData, AggregationRecordsService, QueryAggregationRecords, QueryAggregationRecordsSchema} from './aggregation-records.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@UseGuards(JwtAuthGuard)
@Controller('aggregation/organisations/:organisation/device_types/:device_type')
export class AggregationRecordsController {
  constructor(   private readonly aggregationService: AggregationRecordsService) {}

@Get('records')
queryAggregationData(
   @Param('organisation') organisation: string,
  @Param('device_type') deviceType: string,
  @Query(new ZodValidationPipe(QueryAggregationRecordsSchema)) query: QueryAggregationRecords
 // @Query("from") from:string , @Query("to") to:string
) {

   return this.aggregationService.queryAggregationRecords(organisation,deviceType,query);
}



@Post('records')
createAggregationData(
   @Param('organisation') organisation: string,
  @Param('device_type') deviceType: string,
  @Body() aggregationData: AggregationData,
) {
    return this.aggregationService.createAggregationDataEvent(organisation,deviceType,aggregationData)
    }  
    
    
  @Delete("records")
  @HttpCode(204)
  deleteAggregationData(
    @Param('organisation') organisation: string,
   @Param('device_type') deviceType: string,
    @Body('ids') ids: string[]) {
    return this.aggregationService.deleteAggregationDataEvent(organisation,deviceType,ids);
  }


}


