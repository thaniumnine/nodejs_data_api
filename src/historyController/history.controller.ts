  import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
  import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
  import { JwtAuthGuard } from  '../auth/jwt-auth.guard';
  import { number, string } from 'zod';
  import {  DeviceHistoryData, HistoryService, QueryDeviceHistoryRecords, QueryDeviceHistorySchema} from './history.service'


  @UseGuards(JwtAuthGuard)
  @Controller('history')
  export class HistoryController {
    constructor(   private readonly historyService: HistoryService) {}

  @Get(':building/:level/:device_id')
  queryHistoryData(
        @Param('building') building: string,
      @Param('level') level: string,
      @Param('device_id') deviceId: string,
    
  // @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
    @Query() query: QueryDeviceHistoryRecords
  ) {

    return this.historyService.queryDeviceHistory(query,building,level,deviceId);
  }


    @Post(':building/:level/:device_id')
    async createHistoryData(
      @Param('building') building: string,
      @Param('level') level: string,
      @Param('device_id') deviceId: string,
      @Body() deviceHistoryData: DeviceHistoryData,
    ) {
      return this.historyService.createDeviceHistoryDataEvent(building,level,deviceId,deviceHistoryData);
  }




@Delete('data')
@HttpCode(204)
deleteHistoryData(@Body('ids') ids: string[]) {
  
  return this.historyService.deleteDeviceHistoryDataEvent(ids);
}

  }
