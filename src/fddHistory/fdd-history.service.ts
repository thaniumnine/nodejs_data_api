import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { FddHistoryName } from "../database/db.types";
import { OrganisationService } from "../organisations/organisations.service";
import { DeviceIdentifierService, IDENTIFIER_TABLE_NAME } from "../deviceIdentifier/device-identifier.service";

export type FddHistoryRecord = {
  timestamp: string;
  room: string;
  ruleId: string;
}
export type FddHistoryData = {
  items: FddHistoryRecord[]
}

const FDD_HISTORY_TABLE_NAME = "sim_fdd_history"

@Injectable()
export class FddHistoryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
    private readonly identifierService: DeviceIdentifierService

  ) { }
  async createFddHistoryData(inputs: FddHistoryData, organisation: string, building: string, level: string, deviceId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const FddhistoryTableName =FDD_HISTORY_TABLE_NAME

    let deviceIdentifier = await this.identifierService.createDeviceIdentifier(organisation, building, level, deviceId);
    if (!deviceIdentifier) {
      deviceIdentifier = await this.identifierService.findDeviceIdentifier(organisation, building, level, deviceId)
      if (!deviceIdentifier) return;
    }
  if (!inputs.items.length) return;
    await this.database.db
      .insertInto(FddhistoryTableName as FddHistoryName)
      .values(
        inputs.items.map((input) => ({
          device_ref_id: deviceIdentifier.id,
          timestamp: new Date(input.timestamp),
          closed: false,
          room: input.room,
          rule_id: input.ruleId,
        }))
      )
      .execute();
  }


  async queryAllFddHistoryData(organisation: string, branding: string) {
    const requestedBranding = branding?.trim().toLowerCase();
    if (!requestedBranding) throw new BadRequestException('Branding is required');

    const organisationNames = [requestedBranding];
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const identifierTableName = IDENTIFIER_TABLE_NAME
    const historyTableName = FDD_HISTORY_TABLE_NAME
    const result = await this.database.query(
      `SELECT dh.id AS fdd_out_id, di.id AS device_ref_id, dh.rule_id, dh.closed, di.building,di.level,di.device_id, dh.room, dh.timestamp,dh.created_at
    FROM ${historyTableName} dh JOIN ${identifierTableName} di 
      ON dh.device_ref_id = di.id
      WHERE  di.org_ref_id = $1
    ORDER BY device_id ASC, timestamp ASC`,
    [metadata.id]
  );
    return { records: result.rows, count: result.rowCount };
  };



}
