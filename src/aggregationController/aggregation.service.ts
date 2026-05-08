import {  Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { JsonValue } from "src/database/db.types";
import z from "zod";


export type AggregationTypeRecord= {
    device_type:string
    columns:{
        name:string
        type:string
        }[]

}

@Injectable()
export class AggregationService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async createDeviceType( input: AggregationTypeRecord) {
    const event = await this.database.db
      .insertInto("aggregation")
      .values( {device_type: input.device_type,
      columns: JSON.stringify(input.columns),
    
  })
      .returningAll()
      .executeTakeFirstOrThrow();
    return {
      event
    };
  }


   async list(){
      return this.database.db
        .selectFrom('aggregation')
        .selectAll()
        .orderBy('device_type', 'asc')
        .execute();
    }
  


      async getByName(device_type: string){
        return this.database.db.selectFrom('aggregation').selectAll().where('device_type', '=', device_type).executeTakeFirst();
      }
    
      async getRequiredByName(name: string) {
        const deviceTypeData = await this.getByName(name);
        if (!deviceTypeData ) {
          throw new NotFoundException(`device name not found: ${name}`);
        }
        return deviceTypeData;
      }
}
