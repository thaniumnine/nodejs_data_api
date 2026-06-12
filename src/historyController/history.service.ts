import {  Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { JsonValue } from "../database/db.types";
import z, { string } from "zod";

export type DeviceHistoryRecord= {
    device_id: string;
    timestamp: string;
  //  json_type:string;
    version:string;
    points: {
        [pointtype:string]:JsonValue
    }
}
export type DeviceHistoryData = {
  items:DeviceHistoryRecord[]
}


export const QueryDeviceHistorySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type QueryDeviceHistoryRecords = z.infer<typeof QueryDeviceHistorySchema>;


@Injectable()
export class HistoryService {
  constructor(
    private readonly database: DatabaseService,
  ) {}
async createDeviceHistoryDataEvent(inputs: DeviceHistoryData) {

    const event = await this.database.db
      .insertInto("device_history")
      .values(inputs.items.map((input)=>{
        return{
          device_id: input.device_id,
          timestamp: new Date(input.timestamp),
          json_type:"pointset",
          version:input.version,
          points:input.points
        }
        }))
      .returningAll()
      .execute();

    return {
      event
    };
  }
  async queryDeviceHistory(query: QueryDeviceHistoryRecords) {
    const result = await this.database.query(
      `SELECT device_id, points, timestamp
    FROM device_history
    WHERE timestamp >= $1
      AND timestamp < $2
    ORDER BY device_id ASC, timestamp ASC`,
      [query.from, query.to]
    );

    return { records: result.rows, count: result.rowCount };


  };


async deleteDeviceHistoryDataEvent(ids: string[]) {
  const result = await this.database.query(
    `
    DELETE FROM device_history
    WHERE device_id = ANY($1)
    `,
    [ids],
  );



}

}