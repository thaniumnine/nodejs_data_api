import {  Injectable } from "@nestjs/common";
import { AggregationDeviceTypeColumnRecord, AggregationService } from "../aggregationController/aggregation.service";
import { DatabaseService } from "../database/database.service";
import z from "zod";

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
  constructor(
    private readonly database: DatabaseService,
    private readonly aggregationService: AggregationService
  ) { }

  async createAggregationDataEvent(deviceType: string, inputs: AggregationData) {

    const deviceTypeData = await this.aggregationService.getRequiredByName(deviceType)
    //TODO check it is right type first 
    if (!deviceTypeData) return;
    const table_name = deviceTypeData.table_name
    const columns = deviceTypeData.columns as AggregationDeviceTypeColumnRecord[]

    const event = await this.database.db
      .insertInto(table_name)
      .values(inputs.items.map((input)=>{

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

  async queryAggregationRecords(deviceType: string, query: QueryAggregationRecords) {
    const deviceTypeData = await this.aggregationService.getRequiredByName(deviceType)
    if (!deviceTypeData) return;
    const columns = deviceTypeData.columns as AggregationDeviceTypeColumnRecord[]
    const table_name = deviceTypeData.table_name
    const column_names = columns.map((column) => `${column.name}::double precision AS ${column.name}`)
      .join(', ');
    const result = await this.database.query(
      `SELECT 
            device_id,
            event_timestamp,
            ${column_names}
            FROM ${table_name}
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


      
  async deleteAggregationDataEvent(deviceType:string,ids: string[]) {
    const deviceTypeData =  await this.aggregationService.getRequiredByName(deviceType)
    if (!deviceTypeData) return;
    const table_name = deviceTypeData.table_name
    const result = await this.database.query(
      `
    DELETE FROM ${table_name}
    WHERE device_id = ANY($1)
    `,
      [ids],
    );
  }


  
}
