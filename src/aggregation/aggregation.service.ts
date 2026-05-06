import {  Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import z from "zod";


export type AggregationData= {
    device_id: string
    event_timestamp: string
    payload: {
        illuminance_sensor :number,
        last_week_total_occupancy :number,
        motion_event:number,
        this_week_cumulative_occupancy: number 
    }
}


export const QueryAggregationRecordsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
});

export type QueryAggregationRecords = z.infer<typeof QueryAggregationRecordsSchema>;

@Injectable()
export class AggregationService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async createAggregationDataEvent(input: AggregationData) {
    const event = await this.database.db
      .insertInto("device_simmtronics_mts_agg_events")
      .values({
        device_id: input.device_id,
        agg_type:"mean",
        event_timestamp: new Date(input.event_timestamp),
        illuminance_sensor: input.payload.illuminance_sensor,
        last_week_total_occupancy:  input.payload.last_week_total_occupancy,
        motion_event:input.payload.motion_event,
        this_week_cumulative_occupancy:input.payload.this_week_cumulative_occupancy
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      event
    };
  }




    async queryAggregationRecords( query: QueryAggregationRecords) {

        const result = await this.database.query(
            `SELECT 
            illuminance_sensor,
            last_week_total_occupancy,
            motion_event,
            this_week_cumulative_occupancy,
            event_timestamp,
            device_id
            FROM device_simmtronics_mts_agg_events
            WHERE event_timestamp >= $1
            AND event_timestamp < $2
            ORDER BY device_id,event_timestamp DESC
            `,
        [query.from, query.to]
    );
    
        return {

          records: result.rows
        };
      }
}
