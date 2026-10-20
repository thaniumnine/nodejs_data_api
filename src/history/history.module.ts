import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { OrganisationModule } from '../organisations/organisations.module';
import { DeviceIdentifierModule } from '../deviceIdentifier/device-identifier.module';


@Module({
  imports: [AuthModule,OrganisationModule,DeviceIdentifierModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService]
})
export class HistoryModule { }
