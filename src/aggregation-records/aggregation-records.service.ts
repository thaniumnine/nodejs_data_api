import {  Injectable } from "@nestjs/common";
import { AggregationDeviceTypeColumnRecord, AggregationService } from "src/aggregationController/aggregation.service";
import { DatabaseService } from "src/database/database.service";
import z from "zod";


export type AggregationRecord= {
    device_id: string;
    event_timestamp: string;
    agg_type:string;
    payload: {
        [columnType:string]:number
    }
}
export type AggregationData = AggregationRecord[];

export const QueryAggregationRecordsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
});

export type QueryAggregationRecords = z.infer<typeof QueryAggregationRecordsSchema>;

@Injectable()
export class AggregationRecordsService {
  constructor(
    private readonly database: DatabaseService,
     private readonly aggregationService: AggregationService
  ) {}

  async createAggregationDataEvent(deviceType:string,inputs: AggregationData) {

    const deviceTypeData =  await this.aggregationService.getRequiredByName(deviceType)
    //TODO check it is right type first 
     if (!deviceTypeData) return;
    const table_name = deviceTypeData.table_name
    const columns = deviceTypeData.columns as AggregationDeviceTypeColumnRecord[]

    const event = await this.database.db
      .insertInto(table_name)
      .values(inputs.map((input)=>{

          const payload = columns.map(column =>(
            [column.name,input.payload[column.name] ?? 0]
          ));
        
        return{
          device_id: input.device_id,
          agg_type: input.agg_type,
          event_timestamp: new Date(input.event_timestamp),
          ...Object.fromEntries(payload)
        }
      }))
      .returningAll()
      .execute();

    return {
      event
    };
  }




    async queryAggregationRecords(deviceType:string, query: QueryAggregationRecords) {
       console.log("overherehrehrhehrehrehrhe-------------------------------------");
        const deviceTypeData =  await this.aggregationService.getRequiredByName(deviceType)
        if (!deviceTypeData) return;
        const columns = deviceTypeData.columns as AggregationDeviceTypeColumnRecord[]
        const table_name = deviceTypeData.table_name
        console.log("talbe name",table_name)
        let column_names = columns.map((column)=>column.name).join(', ');
        const result = await this.database.query(
            `SELECT 
            device_id,
            agg_type,
            event_timestamp,
            ${column_names}
            FROM ${table_name}
            WHERE event_timestamp >= $1
            AND event_timestamp < $2
            ORDER BY device_id,agg_type,event_timestamp DESC
            `,
        [query.from, query.to]
    );
    
        return {

          records: result.rows
        };
      }
}
