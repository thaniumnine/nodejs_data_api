import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {  AggregationRecordsService } from './aggregation-records.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AggregationData, QueryAggregationRecords, QueryAggregationRecordsSchema } from './aggregation-records.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AggregationRecordsController {
  constructor(private readonly aggregationService: AggregationRecordsService) { }


  @Get('organisations/:organisation/buildings/:building/levels/:level/devices/types/:device_type/aggregations')
  queryAggregationData(
    @Param('organisation') organisation: string,
    @Param('building') building: string,
    @Param('level') level: string,
    @Param('device_type') deviceType: string,
    @Query(new ZodValidationPipe(QueryAggregationRecordsSchema)) query: QueryAggregationRecords
  ) {
    return this.aggregationService.queryAggregationRecords(organisation, building, level, deviceType, query);
  }


  @Post('organisations/:organisation/buildings/:building/levels/:level/devices/types/:device_type/aggregations')
  createAggregationData(
    @Param('organisation') organisation: string,
    @Param('building') building: string,
    @Param('level') level: string,
    @Param('device_type') deviceType: string,
    @Body() aggregationData: AggregationData,
  ) {
    return this.aggregationService.createAggregationDataEvent(organisation, building, level, deviceType, aggregationData)
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


