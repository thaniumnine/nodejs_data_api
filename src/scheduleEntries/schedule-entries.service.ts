import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OrganisationService } from '../organisations/organisations.service';
import type { ScheduleEntryStatus } from '../database/db.types';

const SCHEDULE_ENTRIES_TABLE_NAME = 'schedule_entries';

export type ScheduleEntryRecord = {
    id: string;
    fdd_assignment_id: string;
    scheduled_date: string;
    scheduled_minutes: number;
    status: ScheduleEntryStatus;
    is_locked: boolean;
    created_at: Date;
    updated_at: Date;
};

export type CreateScheduleEntryInput = {
    scheduled_date: string;
    scheduled_minutes: number;
    status?: ScheduleEntryStatus;
    is_locked?: boolean;
}

export type UpdateScheduleEntryInput =
    Partial<CreateScheduleEntryInput>;

//return scheduled_date consistently as YYYY-MM-DD
const scheduleEntrySelect = `
  SELECT
    s.id,
    s.fdd_assignment_id,
    s.scheduled_date::text AS scheduled_date,
    s.scheduled_minutes,
    s.status,
    s.is_locked,
    s.created_at,
    s.updated_at
  FROM public.schedule_entries s
`;

@Injectable()
export class ScheduleEntriesService {
    constructor(
        private readonly database: DatabaseService,
        private readonly organisationService: OrganisationService,
    ) { }

    // check that the fdd assignment belongs to this organisation
    private async requireFddAssignment(
        organisation: string,
        fddAssignmentId: string,
    ) {
        const metadata =
            await this.organisationService.queryOrganisationMetadata(organisation);

        const result = await this.database.query<{ id: string }>(
            `SELECT a.id
            FROM public.sim_fdd_assignment a
            JOIN public.sim_fdd_history h
                ON a.fdd_history_id = h.id
            JOIN public.sim_device_identifier di
                ON h.device_ref_id = di.id
            WHERE a.id = $1
                AND di.org_ref_id = $2`,
            [fddAssignmentId, metadata.id],
        );

        if (!result.rows[0]) {
            throw new NotFoundException(
                `FDD assignment '${fddAssignmentId}' not found`,
            );
        }
    }

    // retrieve a specific schedule entry
    private async getScheduleEntry(
        fddAssignmentId: string,
        entryId: string,
    ): Promise<ScheduleEntryRecord> {
        const result = await this.database.query<ScheduleEntryRecord>(
            `${scheduleEntrySelect}
            WHERE s.id = $1
                AND s.fdd_assignment_id = $2`,
            [entryId, fddAssignmentId],
        );

        if (!result.rows[0]) {
            throw new NotFoundException(
                `Schedule entry '${entryId}' not found`,
            );
        }

        return result.rows[0];
    }

    // create a new booking
    async createScheduleEntry(
        organisation: string,
        fddAssignmentId: string,
        input: CreateScheduleEntryInput,
    ): Promise<ScheduleEntryRecord> {
        await this.requireFddAssignment(
            organisation,
            fddAssignmentId,
        );

        const created = await this.database.db.insertInto(SCHEDULE_ENTRIES_TABLE_NAME).values({
            fdd_assignment_id: fddAssignmentId,
            scheduled_date: input.scheduled_date,
            scheduled_minutes: input.scheduled_minutes,
            status: input.status ?? 'Planned',
            is_locked: input.is_locked ?? false,
        })
            .returning('id').executeTakeFirstOrThrow();

        return this.getScheduleEntry(fddAssignmentId, created.id,);
    }

    // retrieve all bookings for one fdd assignment
    async listScheduleEntries(
        organisation: string,
        fddAssignmentId: string,
    ) {
        await this.requireFddAssignment(organisation, fddAssignmentId);

        const result = await this.database.query<ScheduleEntryRecord>(
            `${scheduleEntrySelect}
            WHERE s.fdd_assignment_id = $1
            ORDER BY s.scheduled_date ASC, s.created_at ASC`,
            [fddAssignmentId],
        );

        return {
            records: result.rows,
            count: result.rowCount,
        };
    }

    // Change an existing booking.
    async updateScheduleEntry(
        organisation: string,
        fddAssignmentId: string,
        entryId: string,
        input: UpdateScheduleEntryInput,
    ): Promise<ScheduleEntryRecord> {
        await this.requireFddAssignment(
            organisation,
            fddAssignmentId,
        );

        const updated = await this.database.db
            .updateTable(SCHEDULE_ENTRIES_TABLE_NAME)
            .set(input)
            .where('id', '=', entryId)
            .where('fdd_assignment_id', '=', fddAssignmentId)
            .returning('id')
            .executeTakeFirst();

        if (!updated) {
            throw new NotFoundException(
                `Schedule entry '${entryId}' not found`,
            );
        }

        return this.getScheduleEntry(
            fddAssignmentId,
            entryId,
        );
    }
}