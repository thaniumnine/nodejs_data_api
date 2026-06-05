import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { number, string } from 'zod';
import { DeviceHistoryData, HistoryService, QueryDeviceHistoryRecords, QueryDeviceHistorySchema} from './history.service.js'

// the api will return for history
// {
// number_of_records:2
// records:[{poinset,json},{poinset.json}]
// }

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(   private readonly historyService: HistoryService) {}

@Get('data')
queryAggregationData(
 // @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
  @Query() query: QueryDeviceHistoryRecords
) {

   return this.historyService.queryDeviceHistory(query);
}



@Post('data')
createAggregationData(
  @Body() deviceHistoryData: DeviceHistoryData,
) {
    return this.historyService.createDeviceHistoryDataEvent(deviceHistoryData)
    }    



  }