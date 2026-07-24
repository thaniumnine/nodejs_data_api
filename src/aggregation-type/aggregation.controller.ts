import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { number, string } from 'zod';

import { AggregationService, AggregationDeviceTypeRecord} from './aggregation.service'
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe.js';


@UseGuards(JwtAuthGuard)
@Controller('aggregation/organisations/:organisation/device_types')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) { }

  @Post()
  createAggregationDeviceType(
     @Param('organisation') organisation: string,
    @Body('items') aggregationTypedata: AggregationDeviceTypeRecord,
  ) {
    return this.aggregationService.createDeviceType(organisation,aggregationTypedata)
  }

  @Get("/:device_type")
  getDeviceType( 
    @Param('organisation') organisation: string,
    @Param('device_type') deviceName: string) {
    return this.aggregationService.getRequiredType(organisation,deviceName)
  }

  @Get()
  getAllDeviceTypes( 
    @Param('organisation') organisation: string,
  
  ) {
    return this.aggregationService.list(organisation)
  }


  @Delete()
  @HttpCode(204)
  deleteAggregationData( @Param('organisation') organisation: string,@Body('ids') ids: string[]) {
    return this.aggregationService.deleteAggregationMetadataEvent(organisation,ids);
  }





  }
