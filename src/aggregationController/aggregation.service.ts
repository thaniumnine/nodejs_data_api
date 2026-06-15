import {  Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { JsonValue } from "../database/db.types";
import z from "zod";
export type AggregationDeviceTypeColumnRecord = {
  name: string
  type: string

}

export type AggregationDeviceTypeRecord= {
    device_type:string
    table_name:string
    columns:AggregationDeviceTypeColumnRecord[]

}

@Injectable()
export class AggregationService {
  constructor(
    private readonly database: DatabaseService,
  ) { }

  async createDeviceType(input: AggregationDeviceTypeRecord) {
    const event = await this.database.db
      .insertInto("aggregation")
      .values({
        device_type: input.device_type,
        table_name: input.table_name,
        columns: JSON.stringify(input.columns),

      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return {
      event
    };
  }

  async list() {
    return this.database.db
      .selectFrom('aggregation')
      .selectAll()
      .orderBy('device_type', 'asc')
      .execute();
  }

  async getByName(device_type: string) {
    return this.database.db.selectFrom('aggregation').selectAll().where('device_type', '=', device_type).executeTakeFirst();
  }

  async getRequiredByName(name: string) {
    const deviceTypeData = await this.getByName(name);
    if (!deviceTypeData) {
      throw new NotFoundException(`device name not found: ${name}`);
    }
    return deviceTypeData;
  }
}
