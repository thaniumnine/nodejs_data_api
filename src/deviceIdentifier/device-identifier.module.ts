import { Module } from '@nestjs/common';
import { DeviceIdentifierService } from './device-identifier.service';
import { OrganisationModule } from '../organisations/organisations.module';



@Module({
imports: [OrganisationModule],
  providers: [DeviceIdentifierService],
  exports: [DeviceIdentifierService]
})
export class DeviceIdentifierModule { }
