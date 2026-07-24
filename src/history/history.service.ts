import {  Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DeviceHistoryName, DeviceIdentifierName, JsonValue } from "../database/db.types";
import z, { string } from "zod";
import { OrganisationService } from "../organisations/organisations.service";


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

const HISTORY_TABLE_NAME  = "device_history"
const IDENTIFIER_TABLE_NAME = "device_identifier"


@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService

  ) { }
  async createDeviceHistoryDataEvent(inputs: DeviceHistoryData,organisation:string,building: string, level: string, deviceId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const historyTableName = this.createHistoryTableName(metadata.prefix)
    
    let deviceIdentifier = await this.createDeviceIdentifier(organisation,building, level, deviceId);
    if (!deviceIdentifier) {
      deviceIdentifier = await this.findDeviceIdentifier(organisation,building, level, deviceId)
      if (!deviceIdentifier) return;
    }
    await this.database.db
      .insertInto(historyTableName as DeviceHistoryName)
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


async getDeviceNames(organisation:string,building:string,level:string, prefix = ""){
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const identifierTableName = this.createIdentifierTableName(metadata.prefix)

  const result = await this.database.query(
     `  SELECT DISTINCT device_id
        FROM ${identifierTableName}
        where building = $1
        and level = $2
        and device_id LIKE $3
    `,[building,level,`${prefix}%`]);
  return {records:result.rows.map(row => row.device_id),count: result.rowCount  }

}

async queryDeviceHistoryWithPrefix(organisation:string,building:string,level:string,query: QueryDeviceHistoryPrefixRecords){
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const identifierTableName = this.createIdentifierTableName(metadata.prefix)
  const historyTableName = this.createHistoryTableName(metadata.prefix)

  const result = await this.database.query(
    `SELECT di.device_id, dh.points, dh.timestamp, dh.version
    FROM ${historyTableName} dh JOIN ${identifierTableName} di
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

 

async queryDeviceHistory(organisation:string,building:string,level:string,deviceId:string,query: QueryDeviceHistoryRecords) {
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const identifierTableName = this.createIdentifierTableName(metadata.prefix)
  const historyTableName = this.createHistoryTableName(metadata.prefix)  

  const result = await this.database.query(
      `SELECT dh.points, dh.timestamp
    FROM ${historyTableName} dh JOIN ${identifierTableName} di 
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
  async createDeviceIdentifier(organisation:string,building: string, level: string, deviceId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const identifierTableName = this.createIdentifierTableName(metadata.prefix)
    return await this.database.db 
      .insertInto(identifierTableName)
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

  async findDeviceIdentifier(organisation:string,building:string,level:string,deviceId:string):Promise<deviceIdentifierType>{ 
   const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
   const identifierTableName = this.createIdentifierTableName(metadata.prefix)
   let result =   await this.database.db
    .selectFrom(identifierTableName)
    .select("id")
    .where("building", "=", building)
    .where("level", "=", level)
    .where("device_id", "=", deviceId)
    .executeTakeFirstOrThrow();

    return result
  }

  


async deleteDeviceHistoryDataEvent(organisation:string,building:string,level:string,ids: string[],query:QueryDeviceHistoryRecords) {
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const historyTableName = this.createHistoryTableName(metadata.prefix) 
  const identifierTableName = this.createIdentifierTableName(metadata.prefix)
  const result = await this.database.query(
    `
    DELETE FROM ${historyTableName} dh
    USING ${identifierTableName} di
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

  createIdentifierTableName(prefix: string): DeviceIdentifierName {
    return this.organisationService.createTableName(prefix, IDENTIFIER_TABLE_NAME)

  }

  createHistoryTableName(prefix: string) :DeviceHistoryName {
    return this.organisationService.createTableName(prefix, HISTORY_TABLE_NAME)

  }
}