import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {AggregationData, AggregationRecordsService, QueryAggregationRecords, QueryAggregationRecordsSchema} from './aggregation-records.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@UseGuards(JwtAuthGuard)
@Controller()
export class AggregationRecordsController {
  constructor(   private readonly aggregationService: AggregationRecordsService) {}


  @Get('organisations/:organisation/buildings/:building/levels/:level/devices/aggregations')
  queryAggregationData(
    @Param('organisation') organisation: string,
    @Param('building') building: string,
    @Param('level') level: string,
    // @Query() query: QueryAggregationRecords
    @Query(new ZodValidationPipe(QueryAggregationRecordsSchema)) query: QueryAggregationRecords
  ) {
    return this.aggregationService.queryAggregationRecords(organisation, building, level, query);
  }


  @Post('records')
  createAggregationData(
    @Param('organisation') organisation: string,
    @Param('device_type') deviceType: string,
    @Body() aggregationData: AggregationData,
  ) {
    return this.aggregationService.createAggregationDataEvent(organisation, deviceType, aggregationData)
  }  
    
    
  @Delete("records")
  @HttpCode(204)
  deleteAggregationData(
    @Param('organisation') organisation: string,
    @Param('device_type') deviceType: string,
    @Body('ids') ids: string[]) {
    return this.aggregationService.deleteAggregationDataEvent(organisation, deviceType, ids);
  }


}


