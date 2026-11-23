import {  Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { JsonValue } from "../database/db.types";
import z from "zod";
import { OrganisationService } from "../organisations/organisations.service";
import { quoteIdentifier, quoteQualifiedIdentifier } from "src/common/sql/identifiers";
export type AggregationDeviceTypeColumnRecord = {
  name: string
  type: string

}

export type AggregationDeviceTypeRecord= {
    device_type:string
    columns:AggregationDeviceTypeColumnRecord[]

}

  const AGGREGATIONS_DEVICE_TYPE_TABLE_NAME   = "device_type_aggregation"

  @Injectable()
  export class AggregationService {
    private readonly logger = new Logger(AggregationService.name);
    constructor(
      private readonly database: DatabaseService,
      private readonly organisationService: OrganisationService
    ) { }

    async createDeviceType(organisation:string,input: AggregationDeviceTypeRecord) {
      const table_name = await this.fetchTableName(organisation)
      const event = await this.database.db
        .insertInto(table_name)
        .values( {device_type: input.device_type,
        columns: JSON.stringify(input.columns),
      
    })
        .executeTakeFirstOrThrow();
  
  }


async list(organisation:string) {
  const table_name = await this.fetchTableName(organisation)
  return this.database.db
    .selectFrom(table_name)
    .select([
      'device_type',
      'columns'
    ])
    .orderBy('device_type', 'asc')
    .execute();
}


  async getType(organisation:string,device_type: string) {
     const table_name = await this.fetchTableName(organisation)

    return this.database.db.selectFrom(table_name).select([
      'device_type',
      'columns'
    ]).where('device_type', '=', device_type).executeTakeFirst();
  }

  async getRequiredType(organisation:string,name: string) {
    const deviceTypeData = await this.getType(organisation,name);
    if (!deviceTypeData) {
      throw new NotFoundException(`device name not found: ${name}`);
    }
    return deviceTypeData;
  }


      

  async deleteAggregationMetadataEvent(organisation: string, ids: string[]) {
    const table_name = await this.fetchTableName(organisation)
    const result = await this.database.query(
      `
    DELETE FROM ${table_name}
    WHERE device_type = ANY($1)
    `,
      [ids],
    );
  }


    createDeviceTypesTableName(OrgPrefix: string) {
    return this.organisationService.createTableName(OrgPrefix, AGGREGATIONS_DEVICE_TYPE_TABLE_NAME)

  }

  async fetchTableName(organisation:string) {
    const orgData = await this.organisationService.queryOrganisationMetadata(organisation);
    if (orgData === undefined){
      throw new NotFoundException(`Organisation not found: ${organisation}`)
    }
    const table_name = this.createDeviceTypesTableName(orgData.prefix);
    //const safe_table_name = quoteIdentifier(table_name) 
    return table_name
  }
}
