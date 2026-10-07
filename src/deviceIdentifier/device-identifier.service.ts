import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { DeviceIdentifierName, Organisation } from "../database/db.types";
import { OrganisationService } from "src/organisations/organisations.service";


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
                level,
                device_id: deviceId,
            })
            .onConflict((oc) =>
                oc.columns(["building", "level", "device_id"]).doNothing()
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
            .executeTakeFirstOrThrow();

        return result
    }



    createIdentifierTableName(prefix: string): DeviceIdentifierName {
        return this.organisationService.createTableName(prefix, IDENTIFIER_TABLE_NAME)

    }
}