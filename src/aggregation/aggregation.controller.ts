import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { number, string } from 'zod';
import {AggregationData, AggregationService} from './aggregation.service.js'

@UseGuards(JwtAuthGuard)
@Controller('aggregation/:device_type')
export class AggregationController {
  constructor(   private readonly aggregationService: AggregationService) {}

@Get('data')
queryAggregationData(
  @Param('device_type') deviceType: string,
  @Query('from') from: string,
  @Query('to') to: string,
  @Query('type') type: string,
) {
}


@Post('data')
createAggregationData(
  @Body() aggregationData: AggregationData,
) {
    return this.aggregationService.createAggregationDataEvent(aggregationData)
    }    
}