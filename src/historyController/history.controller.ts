import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from  '../auth/jwt-auth.guard';
import { number, string } from 'zod';
import { DeviceHistoryData, HistoryService, QueryDeviceHistoryRecords, QueryDeviceHistorySchema} from './history.service'


@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

@Get('data')
queryHistoryData(
 // @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
  @Query() query: QueryDeviceHistoryRecords
) {

    return this.historyService.queryDeviceHistory(query);
  }



@Post('data')
createHistoryData(
  @Body() deviceHistoryData: DeviceHistoryData,
) {
    return this.historyService.createDeviceHistoryDataEvent(deviceHistoryData)
  }



}