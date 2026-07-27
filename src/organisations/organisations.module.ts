import { Module } from '@nestjs/common';
import { OrganisationService } from './organisations.service';


@Module({
  providers: [OrganisationService],
  exports: [OrganisationService]
})
export class OrganisationModule { }
