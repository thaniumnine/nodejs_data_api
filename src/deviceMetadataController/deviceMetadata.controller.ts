import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { number, string } from 'zod';
import { DeviceMetadataData, DeviceMetadataService, QueryDeviceMetadataRecords } from './deviceMetadata.service';



@UseGuards(JwtAuthGuard)
@Controller('device_metadata')
export class DeviceMetadataController {
  constructor(   private readonly historyService: DeviceMetadataService) {}

@Get('data')
queryAggregationData(
 // @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
  @Query() query: QueryDeviceMetadataRecords
) {

   return this.historyService.queryDeviceMetadata(query);
}



@Post('data')
createAggregationData(
  @Body() deviceHistoryData: DeviceMetadataData,
) {
    return this.historyService.createDeviceMetadataDataEvent(deviceHistoryData)
    }    



  }