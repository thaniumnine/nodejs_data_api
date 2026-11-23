import {  Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DeviceHistoryName} from "../database/db.types";
import { OrganisationService } from "../organisations/organisations.service";
import { DeviceIdentifierService, IDENTIFIER_TABLE_NAME } from "../deviceIdentifier/device-identifier.service";
import { DeviceHistoryData, QueryDeviceHistoryPrefixRecords, QueryDeviceHistoryRecords } from "./history.dto";

const HISTORY_TABLE_NAME  = "sim_device_history"

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
    private readonly identifierService: DeviceIdentifierService

  ) { }
  async createDeviceHistoryDataEvent(inputs: DeviceHistoryData,organisation:string,building: string, level: string, deviceId: string) {
    // const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    let deviceIdentifier = await this.identifierService.getDeviceIndentifier(organisation,building, level,deviceId)
    if (!deviceIdentifier) throw new Error("Error getting device identifier");
    if (!inputs.items.length) return;

    await this.database.db
      .insertInto(HISTORY_TABLE_NAME)
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
  const result = await this.database.query(
     `  SELECT DISTINCT device_id
        FROM ${IDENTIFIER_TABLE_NAME}
        where 
        org_ref_id = $4
        and building = $1
        and level = $2
        and device_id LIKE $3
    `,[building,level,`${prefix}%`,metadata.id]);
  return {records:result.rows.map(row => row.device_id),count: result.rowCount  }

}

async queryDeviceHistoryWithPrefix(organisation:string,building:string,level:string,query: QueryDeviceHistoryPrefixRecords){
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const result = await this.database.query(
    `SELECT di.device_id, dh.points, dh.timestamp, dh.version
    FROM ${HISTORY_TABLE_NAME} dh JOIN ${IDENTIFIER_TABLE_NAME} di
    ON dh.device_ref_id = di.id
      WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.org_ref_id = $6
      AND di.building = $3
      AND di.level = $4
      AND di.device_id LIKE $5
      ORDER BY device_id ASC, timestamp ASC`,
      [query.from, query.to,building,level,`${query.devicePrefix}%`,metadata.id]
  )
    return { records: result.rows, count: result.rowCount };

}

 

async queryDeviceHistory(organisation:string,building:string,level:string,deviceId:string,query: QueryDeviceHistoryRecords) {
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const result = await this.database.query(
      `SELECT dh.points, dh.timestamp
    FROM ${HISTORY_TABLE_NAME} dh JOIN ${IDENTIFIER_TABLE_NAME} di 
      ON dh.device_ref_id = di.id
    WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
        AND di.org_ref_id = $6
      AND di.building = $3
      AND di.level = $4
      AND di.device_id = $5
    ORDER BY device_id ASC, timestamp ASC`,
      [query.from, query.to,building,level,deviceId,metadata.id]
    );   
    return { records: result.rows, count: result.rowCount };
  };


  

async deleteDeviceHistoryDataEvent(organisation:string,building:string,level:string,ids: string[],query:QueryDeviceHistoryRecords) {
  const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
  const result = await this.database.query(
    `
    DELETE FROM ${HISTORY_TABLE_NAME} dh
    USING ${IDENTIFIER_TABLE_NAME} di
    WHERE dh.device_ref_id = di.id
      AND di.device_id = ANY($1)
      AND dh.timestamp >= $2
      AND dh.timestamp < $3
      AND di.org_ref_id = $6
      AND di.building = $4 
      AND di.level = $5
      
    `,
    [ids,query.from,query.to,building,level,metadata.id],
  );



}


}