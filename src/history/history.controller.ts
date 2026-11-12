import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoryService } from './history.service'
import { DeviceHistoryData, QueryDeviceHistoryPrefixRecords, QueryDeviceHistoryPrefixSchema, QueryDeviceHistoryRecords, QueryDeviceHistorySchema } from './history.dto';

type HistoryDeviceParams = {
    organisation: string,
    building: string,
    level: string,
}

@UseGuards(JwtAuthGuard)
@Controller()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }


  @Get('organisations/:organisation/buildings/:building/levels/:level/devices/')
  getDeviceNames(
    @Param() params: HistoryDeviceParams,
    @Query('devicePrefix') prefix?: string,
  ) {
    return this.historyService.getDeviceNames(params.organisation, params.building, params.level, prefix);
  }


  @Get('organisations/:organisation/buildings/:building/levels/:level/devices/history')
  queryHistoryDataPrefix(
    @Param() params: HistoryDeviceParams,
    @Query(new ZodValidationPipe(QueryDeviceHistoryPrefixSchema)) query: QueryDeviceHistoryPrefixRecords
  ) {
    return this.historyService.queryDeviceHistoryWithPrefix(params.organisation, params.building, params.level, query);
  }

  @Get('organisations/:organisation/buildings/:building/levels/:level/devices/:device_id/history')
  queryHistoryData(
    @Param() params: HistoryDeviceParams,
    @Param('device_id') deviceId: string,
    @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
  ) {

    return this.historyService.queryDeviceHistory(params.organisation, params.building, params.level, deviceId, query);
  }

  @Post('organisations/:organisation/buildings/:building/levels/:level/devices/:device_id/history')
  async createHistoryData(
    @Param() params: HistoryDeviceParams,
    @Param('device_id') deviceId: string,
    @Body() deviceHistoryData: DeviceHistoryData,
  ) {
    return this.historyService.createDeviceHistoryDataEvent(
      deviceHistoryData,
      params.organisation,
      params.building,
      params.level,
      deviceId
    );
  }




  @Delete("organisations/:organisation/buildings/:building/levels/:level/history")
  @HttpCode(204)
  deleteHistoryData(
    @Param() params: HistoryDeviceParams,
    @Body('ids') ids: string[],
    @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
  ) {
    return this.historyService.deleteDeviceHistoryDataEvent(params.organisation, params.building, params.level, ids, query);
  }

}
