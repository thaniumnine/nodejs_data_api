import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DeviceIdentifierName, Organisation } from "../database/db.types";
import { OrganisationService } from "../organisations/organisations.service";


type deviceIdentifierType = {
    id: number;
} | undefined
const IDENTIFIER_TABLE_NAME = "device_identifier"


@Injectable()
export class DeviceIdentifierService {
    constructor(
        private readonly database: DatabaseService,
        private readonly organisationService: OrganisationService

    ) { }

    async createDeviceIdentifier(organisation: string, building: string, level: string, deviceId: string) {
        const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
        const identifierTableName = this.createIdentifierTableName(metadata.prefix)
        return await this.database.db
            .insertInto(identifierTableName)
            .values({
                building,
                org_ref_id:metadata.id,
                level,
                device_id: deviceId,
            })
            .onConflict((oc) =>
                oc.columns(["org_ref_id","building", "level", "device_id"]).doNothing()
            )
            .returning("id")
            .executeTakeFirst();

    }

    

    async findDeviceIdentifier(organisation: string, building: string, level: string, deviceId: string): Promise<deviceIdentifierType> {
        const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
        const identifierTableName = this.createIdentifierTableName(metadata.prefix)
        let result = await this.database.db
            .selectFrom(identifierTableName)
            .select("id")
            .where("building", "=", building)
            .where("level", "=", level)
            .where("device_id", "=", deviceId)
            .where("org_ref_id","=",metadata.id)
            .executeTakeFirst();

        return result
    }



    createIdentifierTableName(prefix: string): DeviceIdentifierName {
        return "sim_device_identifier"
        // return this.organisationService.createTableName(prefix, IDENTIFIER_TABLE_NAME)

    }
}