import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FddHistoryService } from './fdd-history.service';
import { FddHistoryController } from './fdd-history.controller';
import { OrganisationModule } from 'src/organisations/organisations.module';
import { DeviceIdentifierModule } from 'src/deviceIdentifier/device-identifier.module';


@Module({
  imports: [AuthModule,OrganisationModule,DeviceIdentifierModule],
  controllers: [FddHistoryController],
  providers: [FddHistoryService],
  exports: [FddHistoryService]
})
export class FddHistoryModule { }
