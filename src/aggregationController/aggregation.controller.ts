import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { number, string } from 'zod';

import { AggregationService, AggregationDeviceTypeRecord} from './aggregation.service'
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';


@UseGuards(JwtAuthGuard)
@Controller('aggregation')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) { }

  @Post()
  createAggregationDeviceType(
    @Body() aggregationTypedata: AggregationDeviceTypeRecord,
  ) {
    return this.aggregationService.createDeviceType(aggregationTypedata)
  }

  @Get(":device_name")
  getDeviceType(@Param('device_name') deviceName: string) {
    return this.aggregationService.getRequiredByName(deviceName)
  }

  @Get()
  getAllDeviceTypes() {
    return this.aggregationService.list()
  }


  @Delete()
  @HttpCode(204)
  deleteAggregationData(@Body('ids') ids: string[]) {
    return this.aggregationService.deleteAggregationMetadataEvent(ids);
  }





  }
