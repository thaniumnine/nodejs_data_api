import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AggregationRecordsService } from './aggregation-records.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AggregationData, QueryAggregationRecords, QueryAggregationRecordsSchema } from './aggregation-records.dto';

type AggregationDeviceParams = {
  organisation: string,
  building: string,
  level: string,
  deviceType: string,
}
type AggregationDeviceParamsNoLevels = Omit<AggregationDeviceParams, 'level'>;


@UseGuards(JwtAuthGuard)
@Controller('organisations/:organisation/buildings/:building/')
export class AggregationRecordsController {
  constructor(private readonly aggregationService: AggregationRecordsService) { }

  @Get('levels/:level/devices/types/:deviceType/aggregations')
  queryAggregationData(
    @Param() params: AggregationDeviceParams,
    @Query(new ZodValidationPipe(QueryAggregationRecordsSchema)) query: QueryAggregationRecords
  ) {
    return this.aggregationService.queryAggregationRecords(
      params.organisation,
      params.building,
      params.level,
      params.deviceType,
      query
    );
  }



  @Get('devices/types/:deviceType/aggregations')
  queryAggregationDataFromAllLevels(
    @Param() params: AggregationDeviceParamsNoLevels,
    @Query(new ZodValidationPipe(QueryAggregationRecordsSchema)) query: QueryAggregationRecords
  ) {
    return this.aggregationService.queryAggregationRecordsFromAllLevels(
      params.organisation,
      params.building,
      params.deviceType,
      query
    );
  }



  @Post('/levels/:level/devices/types/:deviceType/aggregations')
  createAggregationData(
    @Param() params: AggregationDeviceParams,
    @Body() aggregationData: AggregationData,
  ) {
    return this.aggregationService.createAggregationDataEvent(
      params.organisation,
      params.building,
      params.level,
      params.deviceType,
      aggregationData
    )
  }

  @Delete('/levels/:level/devices/types/:deviceType/aggregations')
  @HttpCode(204)
  deleteAggregationData(
    @Param() params: AggregationDeviceParams,
    @Body('ids') ids: string[]) {
    return this.aggregationService.deleteAggregationDataEvent(
      params.organisation,
      params.building,
      params.level,
      params.deviceType,
      ids
    );
  }

}


