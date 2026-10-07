import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DeviceHistoryName, DeviceIdentifierName, FddHistoryName, JsonValue } from "../database/db.types";
import z, { string } from "zod";
import { OrganisationService } from "../organisations/organisations.service";
import { DeviceIdentifierService } from "src/deviceIdentifier/device-identifier.service";

export type FddHistoryRecord = {
  timestamp: string;
  room: string;
  ruleId: string;
}
export type DeviceHistoryData = {
  items: FddHistoryRecord[]
}

const FDD_HISTORY_TABLE_NAME = "fdd_history"

@Injectable()
export class FddHistoryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
    private readonly identifierService: DeviceIdentifierService

  ) { }
  async createFddHistoryData(inputs: DeviceHistoryData, organisation: string, building: string, level: string, deviceId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const FddhistoryTableName = this.createFddHistoryTableName(metadata.prefix)

    let deviceIdentifier = await this.identifierService.createDeviceIdentifier(organisation, building, level, deviceId);
    if (!deviceIdentifier) {
      deviceIdentifier = await this.identifierService.findDeviceIdentifier(organisation, building, level, deviceId)
      if (!deviceIdentifier) return;
    }
    await this.database.db
      .insertInto(FddhistoryTableName as FddHistoryName)
      .values(
        inputs.items.map((input) => ({
          device_ref_id: deviceIdentifier.id,
          timestamp: new Date(input.timestamp),
          closed: false,
          room: input.room,
          ruleId: input.ruleId,
        }))
      )
      .execute();
  }


  async queryAllFddHistoryData(organisation: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const identifierTableName = this.identifierService.createIdentifierTableName(metadata.prefix)
    const historyTableName = this.createFddHistoryTableName(metadata.prefix)
    const result = await this.database.query(
      `SELECT dh.points, dh.timestamp
    FROM ${historyTableName} dh JOIN ${identifierTableName} di 
      ON dh.device_ref_id = di.id
    ORDER BY device_id ASC, timestamp ASC`,
    );
    return { records: result.rows, count: result.rowCount };
  };




  createFddHistoryTableName(prefix: string): FddHistoryName {
    return this.organisationService.createTableName(prefix, FDD_HISTORY_TABLE_NAME)

  }
}