  import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
  import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
  import { JwtAuthGuard } from  '../auth/jwt-auth.guard';
  import { number, string } from 'zod';
  import {  DeviceHistoryData, HistoryService, QueryDeviceHistoryPrefixRecords, QueryDeviceHistoryRecords, QueryDeviceHistorySchema} from './history.service'


  @UseGuards(JwtAuthGuard)
  @Controller()
  export class HistoryController {
    constructor(   private readonly historyService: HistoryService) {}


  @Get('buildings/:building/levels/:level/devices/')
  getDeviceNames(
      @Param('building') building: string,
      @Param('level') level: string,
      @Query('devicePrefix') prefix?: string,
  ) {
    return this.historyService.getDeviceNames(building,level,prefix);
  }


    @Get('buildings/:building/levels/:level/devices/history')
    queryHistoryDataPrefix(
      @Param('building') building: string,
      @Param('level') level: string,
      //@Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
      @Query() query: QueryDeviceHistoryPrefixRecords
    ) {

      return this.historyService.queryDeviceHistoryWithPrefix(query, building, level);
    }

  @Get('buildings/:building/levels/:level/devices/:device_id/history')
  queryHistoryData(
        @Param('building') building: string,
      @Param('level') level: string,
      @Param('device_id') deviceId: string,
    
  //@Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
     @Query() query: QueryDeviceHistoryRecords
  ) {

    return this.historyService.queryDeviceHistory(query,building,level,deviceId);
  }

    @Post('buildings/:building/levels/:level/devices/:device_id/history')
    async createHistoryData(
      @Param('building') building: string,
      @Param('level') level: string,
      @Param('device_id') deviceId: string,
      @Body() deviceHistoryData: DeviceHistoryData,
    ) {
      return this.historyService.createDeviceHistoryDataEvent(deviceHistoryData,building,level,deviceId);
  }




    @Delete("buildings/:building/levels/:level/history")
    @HttpCode(204)
    deleteHistoryData(  
        @Param('building') building: string,
      @Param('level') level: string,
      @Body('ids') ids: string[],
      @Query() query: QueryDeviceHistoryRecords) {

      return this.historyService.deleteDeviceHistoryDataEvent(building,level,ids, query);
    }

  }
