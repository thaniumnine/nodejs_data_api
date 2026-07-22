import {  Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { JsonValue } from "../database/db.types";
import z, { string } from "zod";

export type DeviceHistoryRecord= {
    timestamp: string;
  //  json_type:string;
  version: string;
  points: {
    [pointtype: string]: JsonValue
  }
}
export type DeviceHistoryData = {
  items:DeviceHistoryRecord[]
}

type deviceIdentifierType = {
    id: number;
} | undefined


export const QueryDeviceHistorySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type QueryDeviceHistoryRecords = z.infer<typeof QueryDeviceHistorySchema>;


export const QueryDeviceHistoryPrefixSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  devicePrefix:z.string()
});

export type QueryDeviceHistoryPrefixRecords = z.infer<typeof QueryDeviceHistoryPrefixSchema>;


@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  constructor(
    private readonly database: DatabaseService,

  ) { }
  async createDeviceHistoryDataEvent(inputs: DeviceHistoryData,building: string, level: string, deviceId: string) {
    let deviceIdentifier = await this.createDeviceIdentifier(building, level, deviceId);
    if (!deviceIdentifier) {
      deviceIdentifier = await this.findDeviceIdentifier(building, level, deviceId)
      if (!deviceIdentifier) return;
    }
    await this.database.db
      .insertInto("device_history")
      .values(
        inputs.items.map((input) => ({
          device_ref_id: deviceIdentifier.id,
          timestamp: new Date(input.timestamp),
          json_type: "pointset",
          version: input.version,
          points: input.points,
        }))
      )
      .execute();

  }


async getDeviceNames(building:string,level:string, prefix = ""){

  const result = await this.database.query(
     `  SELECT DISTINCT device_id
        FROM device_identifier
        where building = $1
        and level = $2
        and device_id LIKE $3
    `,[building,level,`${prefix}%`]);
  return {records:result.rows.map(row => row.device_id),count: result.rowCount  }

}

async queryDeviceHistoryWithPrefix(query: QueryDeviceHistoryPrefixRecords,building:string,level:string){
  const result = await this.database.query(
    `SELECT di.device_id, dh.points, dh.timestamp, dh.version
    FROM device_history dh JOIN device_identifier di
    ON dh.device_ref_id = di.id
      WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id LIKE $5
      ORDER BY device_id ASC, timestamp ASC`,
      [query.from, query.to,building,level,`${query.devicePrefix}%`]
  )
    return { records: result.rows, count: result.rowCount };

}


async queryDeviceHistory(query: QueryDeviceHistoryRecords,building:string,level:string,deviceId:string) {
    const result = await this.database.query(
      `SELECT dh.points, dh.timestamp
    FROM device_history dh JOIN device_identifier di 
      ON dh.device_ref_id = di.id
    WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id = $5
    ORDER BY device_id ASC, timestamp ASC`,
      [query.from, query.to,building,level,deviceId]
    );
   
    return { records: result.rows, count: result.rowCount };


  };

// /http://kysely-org.github.io/kysely-apidoc/classes/OnConflictBuilder.html
  async createDeviceIdentifier(building: string, level: string, deviceId: string) {
    return await this.database.db 
      .insertInto("device_identifier")
      .values({
        building,
        level,
        device_id: deviceId,
      })
      .onConflict((oc) =>
        oc.columns(["building", "level", "device_id"]).doNothing()
      )
      .returning("id")
      .executeTakeFirst();

  }

  async findDeviceIdentifier(building:string,level:string,deviceId:string):Promise<deviceIdentifierType>{ 
   let result =   await this.database.db
    .selectFrom("device_identifier")
    .select("id")
    .where("building", "=", building)
    .where("level", "=", level)
    .where("device_id", "=", deviceId)
    .executeTakeFirstOrThrow();

    return result
  }

  


async deleteDeviceHistoryDataEvent(building:string,level:string,ids: string[],query:QueryDeviceHistoryRecords) {
  const result = await this.database.query(
    `
    DELETE FROM device_history dh
    USING device_identifier di
    WHERE dh.device_ref_id = di.id
      AND di.device_id = ANY($1)
      AND dh.timestamp >= $2
      AND dh.timestamp < $3
      AND di.building = $4 
      AND di.level = $5
      
    `,
    [ids,query.from,query.to,building,level],
  );



}

}