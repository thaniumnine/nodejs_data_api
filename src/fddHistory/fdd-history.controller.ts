  import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
  import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
  import { JwtAuthGuard } from  '../auth/jwt-auth.guard';
  import { number, string } from 'zod';
  import {  FddHistoryData, FddHistoryService} from './fdd-history.service'
import { OrganisationAccessGuard } from 'src/auth/organisation-access.guard';


  @UseGuards(JwtAuthGuard, OrganisationAccessGuard)
  @Controller()
  export class FddHistoryController {
    constructor(   private readonly historyService: FddHistoryService) {}

    //ruleid , created_at, closed, building,level ,room, device

  @Get('organisations/:organisation/fdd')
  queryAllFddHistoryData(
      @Param('organisation') organisation: string,
  ) {

    return this.historyService.queryAllFddHistoryData(organisation);
  }

    @Post('organisations/:organisation/buildings/:building/levels/:level/devices/:device_id/fdd')
    async createFddHistoryData(
      @Param('organisation') organisation: string,
      @Param('building') building: string,
      @Param('level') level: string,
      @Param('device_id') deviceId: string,
      @Body() deviceHistoryData: FddHistoryData,
    ) {
      return this.historyService.createFddHistoryData(deviceHistoryData,organisation,building,level,deviceId);
  }

  }
