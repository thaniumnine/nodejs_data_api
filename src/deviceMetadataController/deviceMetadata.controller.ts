import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { number, string } from 'zod';
import { DeviceMetadataData, DeviceMetadataService, QueryDeviceMetadataRecords } from './deviceMetadata.service';



@UseGuards(JwtAuthGuard)
@Controller('device_metadata')
export class DeviceMetadataController {
  constructor(private readonly historyService: DeviceMetadataService) { }

@Get('data')
queryHistoryMetadata(
 // @Query(new ZodValidationPipe(QueryDeviceHistorySchema)) query: QueryDeviceHistoryRecords
  @Query() query: QueryDeviceMetadataRecords
) {

    return this.historyService.queryDeviceMetadata(query);
  }



  @Post('data')
  @HttpCode(201)
  createHistoryMetadata(
    @Body() deviceHistoryData: DeviceMetadataData,
) {
    return this.historyService.createDeviceMetadataDataEvent(deviceHistoryData)
  }


  @Delete('data')
  @HttpCode(204)
  deleteHistoryData(@Body('ids') ids: string[]) {
    return this.historyService.deleteDeviceHistoryMetadataEvent(ids);

  }

}