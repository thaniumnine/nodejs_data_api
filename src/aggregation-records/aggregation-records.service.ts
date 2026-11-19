import {  Injectable, Logger } from "@nestjs/common";
import { AggregationDeviceTypeColumnRecord, AggregationService } from "../aggregation-type/aggregation.service";
import { DatabaseService } from "../database/database.service";
import z from "zod";
import { quoteIdentifier, quoteQualifiedIdentifier } from "../common/sql/identifiers";
import { OrganisationService } from "../organisations/organisations.service";

const DEVICE_TABLE_NAME = "aggregations"

export type AggregationRecord = {
  device_id: string;
  event_timestamp: string;
  agg_type: string;
  payload: {
    [columnType: string]: number | null
  }
}
export type AggregationData = {
        items:  AggregationRecord[];
}

export const QueryAggregationRecordsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  aggType: z.string()
});

export type QueryAggregationRecords = z.infer<typeof QueryAggregationRecordsSchema>;

@Injectable()
export class AggregationRecordsService {
  private readonly logger = new Logger(AggregationService.name);
  constructor(
    private readonly database: DatabaseService,
    private readonly aggregationService: AggregationService,
    private readonly organisationService: OrganisationService
  ) { }

  async createAggregationDataEvent(organistaion:string,deviceType: string, inputs: AggregationData) {
    const orgData = await this.organisationService.queryOrganisationMetadata(organistaion);
    const deviceTypeData = await this.aggregationService.getRequiredType(organistaion,deviceType)
    
    const table_name = this.createDeviceTypeTableName(orgData.prefix,deviceTypeData.device_type);
  
    const columns = deviceTypeData.columns as AggregationDeviceTypeColumnRecord[];
    this.logger.log(columns);
    this.logger.log(inputs);
    const event = await this.database.db
      .insertInto(table_name)
      .values(inputs.items.map((input)=>{

          const payload = columns.map(column =>(
            [column.name,input.payload[column.name] ?? null ]
          ));
        

        return {
          device_id: input.device_id,
          agg_type: input.agg_type,
          event_timestamp: new Date(input.event_timestamp),
          ...Object.fromEntries(payload)
        }
      })).onConflict((oc) => oc
        .columns(['event_timestamp', 'agg_type', 'device_id'])
        .doUpdateSet((eb) =>
          Object.fromEntries(
            columns.map((column) => [
              column.name,
              eb.ref(`excluded.${column.name}`)
            ])))
      )
      .execute();
  }

  async queryAggregationRecords(organistaion:string,deviceType: string, query: QueryAggregationRecords) {
    const orgData = await this.organisationService.queryOrganisationMetadata(organistaion);
    const deviceTypeData = await this.aggregationService.getRequiredType(organistaion,deviceType)

    const table_name = this.createDeviceTypeTableName(orgData.prefix,deviceTypeData.device_type);
    const safe_table_name = quoteQualifiedIdentifier(table_name)    
    
    const columns = deviceTypeData.columns as AggregationDeviceTypeColumnRecord[];
    const column_names = columns.map((column) => {
      const safeColumnName = quoteIdentifier(column.name)
      return `${safeColumnName}::double precision AS ${safeColumnName}`
    }).join(', ');

    const result = await this.database.query(
      `SELECT 
            device_id,
            event_timestamp,
            ${column_names}
            FROM ${safe_table_name}
            WHERE event_timestamp >= $1
            AND event_timestamp < $2
            and agg_type = $3
            ORDER BY device_id ASC,event_timestamp ASC
            `,
      [query.from, query.to, query.aggType]
    );
        return {
          records: result.rows.map(({device_id,event_timestamp,...payload})=>({
            payload,
            device_id,
            event_timestamp

          }))
        }
      };


      
  async deleteAggregationDataEvent(organisation:string,deviceType:string,ids: string[]) {
    const orgData = await this.organisationService.queryOrganisationMetadata(organisation);
    const deviceTypeData =  await this.aggregationService.getRequiredType(organisation,deviceType)
    const table_name = this.createDeviceTypeTableName(orgData.prefix,deviceTypeData.device_type);
    const safe_table_name = quoteQualifiedIdentifier(table_name)  

    const result = await this.database.query(
      `
    DELETE FROM ${safe_table_name}
    WHERE device_id = ANY($1)
    `,
      [ids],
    );
  }


  createDeviceTypeTableName(OrgPrefix: string,deviceType :string) {
    return this.organisationService.create3PartTableName(OrgPrefix, DEVICE_TABLE_NAME,deviceType)

  }
  
}

