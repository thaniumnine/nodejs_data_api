import { Injectable, Logger } from "@nestjs/common";
import { AggregationDeviceTypeColumnRecord, AggregationService } from "../aggregation-type/aggregation.service";
import { DatabaseService } from "../database/database.service";
import z from "zod";
import { quoteIdentifier, quoteQualifiedIdentifier } from "../common/sql/identifiers";
import { OrganisationService } from "../organisations/organisations.service";
import { DeviceIdentifierService } from "../deviceIdentifier/device-identifier.service";
import { AggregationData, AggregationRecord, QueryAggregationRecords } from "./aggregation-records.dto";

const DEVICE_TABLE_NAME = "aggregations"


@Injectable()
export class AggregationRecordsService {
  private readonly logger = new Logger(AggregationService.name);
  constructor(
    private readonly database: DatabaseService,
    private readonly aggregationService: AggregationService,
    private readonly organisationService: OrganisationService,
    private readonly identifierService: DeviceIdentifierService
  ) { }


  async createAggregationDataEvent(organisation: string, building: string, level: string, deviceType: string, inputs: AggregationData) {
    const { tableName, columns } = await this.getDynamicTableMetadata(organisation, deviceType);
    let deviceIdentifiers = await this.getAllDeviceIdentifiers(organisation, building, level, inputs.items)

    const event = await this.database.db
      .insertInto(tableName)
      .values(inputs.items.map((input, idx) => {

        const payload = columns.map(column => (
          [column.name, input.payload[column.name] ?? null]
        ));

        return {
          device_ref_id: deviceIdentifiers[idx],
          device_id: input.device_id,
          agg_type: input.agg_type,
          event_timestamp: new Date(input.event_timestamp),
          ...Object.fromEntries(payload)
        }
      })).onConflict((oc) => oc
        .columns(['event_timestamp', 'agg_type', 'device_id', 'device_ref_id'])
        //TODO - keeping device_id for now as need it to determine which devices were flipped. but once removed also remove its constraint and remove it from here
        // replace the constraint with device_ref_id, agg_type and event_timestamp
        .doUpdateSet((eb) =>
          Object.fromEntries(
            columns.map((column) => [
              column.name,
              eb.ref(`excluded.${column.name}`)
            ])))
      )
      .execute();
  }

  async queryAggregationRecords(organisation: string, building: string, level: string, deviceType: string, query: QueryAggregationRecords) {
    const { safeTableName, columns } = await this.getDynamicTableMetadata(organisation, deviceType);
    
    function createSafeColumnNames(columns: AggregationDeviceTypeColumnRecord[]) {
      return columns.map((column) => {
        const safeColumnName = quoteIdentifier(column.name)
        return `${safeColumnName}::double precision AS ${safeColumnName}`
      }).join(', ');
    }

    const column_names = createSafeColumnNames(columns);

    const result = await this.database.query(
      `SELECT 
            di.device_id,
            da.event_timestamp,
            ${column_names}
            FROM ${safeTableName} da JOIN sim_device_identifier di 
             ON da.device_ref_id = di.id
            WHERE event_timestamp >= $1
            AND event_timestamp < $2
            AND agg_type = $3
            AND di.building = $4
            AND di.level = $5
            ORDER BY device_id ASC,event_timestamp ASC
            `,
      [query.from, query.to, query.aggType, building, level]
    );
    return {
      records: result.rows.map(({ device_id, event_timestamp, ...payload }) => ({
        payload,
        device_id,
        event_timestamp

      }))
    }
  };


  async deleteAggregationDataEvent(organisation: string, building: string, level: string, deviceType: string, ids: string[]) {
    const { safeTableName } = await this.getDynamicTableMetadata(organisation, deviceType);
    const result = await this.database.query(
      `
      DELETE FROM ${safeTableName} da 
      USING sim_device_identifier di 
      WHERE di.device_id = ANY($1)
        AND di.building = $2
        AND di.level  = $3
        AND  da.device_ref_id = di.id
    `,
      [ids, building, level],
    );
  }


  createDeviceTypeTableName(OrgPrefix: string, deviceType: string) {
    return this.organisationService.create3PartTableName(OrgPrefix, DEVICE_TABLE_NAME, deviceType)

  }

  async getDynamicTableMetadata(organisation: string, deviceType: string) {
    const orgData = await this.organisationService.queryOrganisationMetadata(organisation);
    const deviceTypeData = await this.aggregationService.getRequiredType(organisation, deviceType)
    const tableName = this.createDeviceTypeTableName(orgData.prefix, deviceTypeData.device_type);
    return {
      tableName,
      safeTableName: quoteQualifiedIdentifier(tableName),
      columns: deviceTypeData.columns
    }
  }

  async getAllDeviceIdentifiers(organisation: string, building: string, level: string, items: AggregationRecord[]) {
    return Promise.all(items.map(async item => {
      let deviceIdentifier = await this.identifierService.getDeviceIndentifier(
        organisation,
        building,
        level,
        item.device_id
      )
      if (!deviceIdentifier) throw new Error("Error getting device identifier");
      return deviceIdentifier.id
    }))
  }

}

