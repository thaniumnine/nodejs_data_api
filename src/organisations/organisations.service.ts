import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { Organisation } from "src/database/db.types";

@Injectable()
export class OrganisationService {
    private readonly logger = new Logger(OrganisationService.name);
    constructor(
        private readonly database: DatabaseService,

    ) { }

    async queryOrganisationMetadata(
        organisation: string,
    ): Promise<Organisation> {
        const result = await this.database.query<Organisation>(
            `
      SELECT id, prefix
      FROM organisations
      WHERE name = $1
      LIMIT 1
      `,
            [organisation],
        );

        if (!result) {
            throw new Error(`Organisation '${organisation}' not found`);
        }

        return result.rows[0];
    }


    createTableName<S extends string>(prefix: string, suffix: S): `${string}_${S}` {
        return `${prefix.toLowerCase()}_${suffix}` as `${string}_${S}`;
    }

    
  create3PartTableName<S extends string>(prefix: string, main: S,suffix:string): `${string}_${S}_${string}` {
        return `${prefix.toLowerCase()}_${main}_${suffix.toLowerCase()}` as `${string}_${S}_${string}`;
    }




}