import {  Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { JsonValue } from "../database/db.types";
import z from "zod";

export type DeviceMetadataRecord = {
    "version": string;
    "timestamp": string;
    "system": {
        "location": {
            "site": string
            "section": string
            "room": string
            "floor": string
            "floor_seq": string,
            "position": {
                "x": string,
                "y": string,
                "z": string
            }
        },
        "physical_tag": {
            "asset": {
                "guid": string,
                "site": string,
                "name": string
            }
        }
    },
   "pointset": {
        "points": {
             [pointtype: string]: JsonValue;
        };
 
    }
}
export type DeviceMetadataData = DeviceMetadataRecord[];

export const QueryDeviceMetadataSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type QueryDeviceMetadataRecords = z.infer<typeof QueryDeviceMetadataSchema>;

@Injectable()
export class DeviceMetadataService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

async createDeviceMetadataDataEvent(inputs: DeviceMetadataData) {

    const event = await this.database.db
      .insertInto("device_metadata")
      .values(inputs.map((input)=>{
        return{
          device_id: input.system.physical_tag.asset.name, // should it repeat
          version: input.version,
          timestamp: new Date(input.timestamp),
          "system.location.site": input.system.location.site,
          "system.location.section": input.system.location.section,
          "system.location.room": input.system.location.room,
          "system.location.floor": input.system.location.floor,
          "system.location.floor_seq": parseInt(input.system.location.floor_seq, 10),

          "system.location.position.x":  parseInt(input.system.location.position.x, 10),
          "system.location.position.y": parseInt(input.system.location.position.y, 10),
          "system.location.position.z": parseInt(input.system.location.position.z, 10),

          "system.physical_tag.asset.guid": input.system.physical_tag.asset.guid,
          "system.physical_tag.asset.site": input.system.physical_tag.asset.site,
          "system.physical_tag.asset.name": input.system.physical_tag.asset.name,

         // "gateway.gateway_id": input.gateway.gateway_id,
          pointset: input.pointset

        }
        }))
      .returningAll()
      .execute();

    return {
      event
    };
  }
  async queryDeviceMetadata(query: QueryDeviceMetadataRecords) {
    const result = await this.database.query(
      `SELECT * FROM device_metadata
    WHERE timestamp >= $1
      AND timestamp < $2
    ORDER BY device_id ASC, timestamp ASC`,
      [query.from, query.to]
    );

    return { records: result.rows, count: result.rowCount };


  };

}
