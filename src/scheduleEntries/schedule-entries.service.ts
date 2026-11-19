import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OrganisationService } from '../organisations/organisations.service';
import type { ScheduleEntryStatus } from '../database/db.types';

const SCHEDULE_ENTRIES_TABLE_NAME = 'schedule_entries';

export type ScheduleEntryRecord = {
    id: string;
    task_id: string;
    scheduled_time: Date;
    status: ScheduleEntryStatus;
    is_locked: boolean;
    created_at: Date;
    updated_at: Date;
};

export type OrganisationScheduleEntryRecord = ScheduleEntryRecord & {
    assignments: {
        assignment_id: string;
        fdd_history_id: string;
        firebase_user_id: string;
        rule_id: string;
        room: string;
        building: string;
        level: string;
        device_id: string;
    }[];
};

export type CreateScheduleEntryInput = {
    scheduled_time: string;
    status?: ScheduleEntryStatus;
    is_locked?: boolean;
};

export type UpdateScheduleEntryInput =
    Partial<CreateScheduleEntryInput>

//return scheduled_date consistently as YYYY-MM-DD
const scheduleEntrySelect = `
  SELECT
    s.id,
    s.task_id::text AS task_id,
    s.scheduled_time,
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


    private async requireTask(
        organisation: string,
        taskId: string,
    ) {
        const metadata =
            await this.organisationService.queryOrganisationMetadata(
                organisation,
            );

        const result = await this.database.query<{ task_id: string }>(
            `SELECT te.task_id::text AS task_id
     FROM public.task_entries te
     JOIN public.sim_fdd_assignment a
       ON te.assignment_id = a.id
     JOIN public.sim_fdd_history h
       ON a.fdd_history_id = h.id
     JOIN public.sim_device_identifier di
       ON h.device_ref_id = di.id
     WHERE te.task_id = $1
     GROUP BY te.task_id
     HAVING BOOL_AND(di.org_ref_id = $2)`,
            [taskId, metadata.id],
        );

        if (!result.rows[0]) {
            throw new NotFoundException(
                `Task '${taskId}' not found in this organisation`,
            );
        }
    }

    private async getTaskOriginalTime(
        taskId: string,
    ): Promise<Date> {
        const result = await this.database.query<{ original_time: Date | string | null }>(

            `SELECT MIN(h.timestamp) AS original_time
                FROM public.task_entries te
                JOIN public.sim_fdd_assignment a
                    ON a.id = te.assignment_id
                JOIN public.sim_fdd_history h
                    ON h.id = a.fdd_history_id
                WHERE te.task_id = $1`,
            [taskId]

        );

        const originalTime = result.rows[0]?.original_time;

        if (originalTime == null) {
            throw new NotFoundException(
                `No FDD timestamp found for task '${taskId}'`
            );
        }

        return new Date(originalTime);
    }


    private async getOlderTaskId(
        taskId: string,
        conflictingTaskId: string,
    ): Promise<string | null> {

        // Get the original dates of both tasks.
        const currentTaskTime = await this.getTaskOriginalTime(taskId);
        const conflictingTaskTime = await this.getTaskOriginalTime(conflictingTaskId);

        // Compare which task was created earlier.
        if (currentTaskTime.getTime() < conflictingTaskTime.getTime()) {
            return taskId;
        }

        if (conflictingTaskTime.getTime() < currentTaskTime.getTime()) {
            return conflictingTaskId;
        }

        // Both tasks have the same original timestamp.
        return null;
    }


    private getNextWorkingDay(scheduledTime: string): string {
        const nextDate = new Date(scheduledTime);

        do {
            // Move forward one day.
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);

        } while (
            nextDate.getUTCDay() === 0 ||
            nextDate.getUTCDay() === 6
        );

        return nextDate.toISOString();
    }




    // retrieve a specific schedule entry
    private async getScheduleEntry(
        taskId: string,
        entryId: string,
    ): Promise<ScheduleEntryRecord> {
        const result = await this.database.query<ScheduleEntryRecord>(
            `${scheduleEntrySelect}
            WHERE s.id = $1
                AND s.task_id = $2`,
            [entryId, taskId],
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
        taskId: string,
        input: CreateScheduleEntryInput,
    ): Promise<ScheduleEntryRecord> {
        await this.requireTask(
            organisation,
            taskId,
        );

        const created = await this.database.db.insertInto(SCHEDULE_ENTRIES_TABLE_NAME).values({
            task_id: taskId,
            scheduled_time: input.scheduled_time,
            status: input.status ?? 'Planned',
            is_locked: input.is_locked ?? false,
        })
            .returning('id').executeTakeFirstOrThrow();

        return this.getScheduleEntry(taskId, created.id,);
    }

    // retrieve all bookings for one fdd assignment
    async listScheduleEntries(
        organisation: string,
        taskId: string,
    ) {
        await this.requireTask(organisation, taskId);

        const result = await this.database.query<ScheduleEntryRecord>(
            `${scheduleEntrySelect}
            WHERE s.task_id = $1
            ORDER BY s.scheduled_time ASC, s.created_at ASC`,
            [taskId],
        );

        return {
            records: result.rows,
            count: result.rowCount,
        };
    }


    // Retrieve all scheduled FDD work for an organisation
    // within a selected date range.
    async listOrganisationScheduleEntries(
        organisation: string,
        from: string,
        to: string,
    ) {
        const metadata =
            await this.organisationService.queryOrganisationMetadata(
                organisation,
            );

        const result =
            await this.database.query<OrganisationScheduleEntryRecord>(
                `SELECT
          s.id,
          s.task_id::text AS task_id,
          s.scheduled_time,
          s.status,
          s.is_locked,
          s.created_at,
          s.updated_at,

          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'assignment_id', a.id::text,
              'fdd_history_id', a.fdd_history_id::text,
              'firebase_user_id', a.firebase_user_id,
              'rule_id', h.rule_id,
              'room', h.room,
              'building', di.building,
              'level', di.level,
              'device_id', di.device_id
            )
            ORDER BY a.id
          ) AS assignments

       FROM public.schedule_entries s
       JOIN public.task_entries te
         ON s.task_id = te.task_id
       JOIN public.sim_fdd_assignment a
         ON te.assignment_id = a.id
       JOIN public.sim_fdd_history h
         ON a.fdd_history_id = h.id
       JOIN public.sim_device_identifier di
         ON h.device_ref_id = di.id

       WHERE s.scheduled_time >=
         ($2::date::timestamp AT TIME ZONE 'Europe/London')
         AND s.scheduled_time <
         (($3::date + 1)::timestamp AT TIME ZONE 'Europe/London')

       GROUP BY s.id
       HAVING BOOL_AND(di.org_ref_id = $1)

       ORDER BY s.scheduled_time ASC, s.id ASC`,
                [metadata.id, from, to],
            );

        return {
            records: result.rows,
            count: result.rows.length,
        };
    }

    // check if there is a conflict with 2 schedules
    private async findScheduleConflict(
        organisation: string,
        taskId: string,
        entryId: string,
        scheduledTime: string,
    ): Promise<ScheduleEntryRecord | null> {

        const metadata = await this.organisationService.queryOrganisationMetadata(organisation,);

        const result = await this.database.query<ScheduleEntryRecord>(
            `
        SELECT DISTINCT
            s.id,
            s.task_id::text AS task_id,
            s.scheduled_time,
            s.status,
            s.is_locked,
            s.created_at,
            s.updated_at

        FROM public.schedule_entries s

        JOIN public.task_entries te
            ON te.task_id = s.task_id

        JOIN public.sim_fdd_assignment a
            ON a.id = te.assignment_id

        JOIN public.sim_fdd_history h
            ON h.id = a.fdd_history_id

        JOIN public.sim_device_identifier di
            ON di.id = h.device_ref_id

        
        WHERE (s.scheduled_time AT TIME ZONE 'Europe/London')::date =
            ($3::timestamptz AT TIME ZONE 'Europe/London')::date
            AND s.id <> $2::uuid
            AND s.status <> 'Cancelled'
            AND di.org_ref_id = $4

            AND a.firebase_user_id IN (
                SELECT current_a.firebase_user_id

                FROM public.task_entries current_te

                JOIN public.sim_fdd_assignment current_a
                    ON current_a.id = current_te.assignment_id

                WHERE current_te.task_id = $1
            )

        ORDER BY s.created_at ASC, s.id ASC
        LIMIT 1
        `,
            [taskId, entryId, scheduledTime, metadata.id],
        );

        return result.rows[0] ?? null;

    }

    // Change an existing booking.
    async updateScheduleEntry(
        organisation: string,
        taskId: string,
        entryId: string,
        input: UpdateScheduleEntryInput,
    ): Promise<ScheduleEntryRecord> {
        await this.requireTask(
            organisation,
            taskId,
        );

        const scheduledTime = input.scheduled_time;

        if (scheduledTime !== undefined) {

            const conflict = await this.findScheduleConflict(
                organisation,
                taskId,
                entryId,
                scheduledTime,
            );

            if (conflict) {
                const olderTaskId = await this.getOlderTaskId(
                    taskId,
                    conflict.task_id
                );

                if (olderTaskId === null) {
                    throw new ConflictException(
                        "Unable to determine task priority."
                    );
                }

                const delayedTaskId =
                    olderTaskId === taskId
                        ? conflict.task_id
                        : taskId;

                const delayedEntryId =
                    delayedTaskId === taskId
                        ? entryId
                        : conflict.id;

                const delayedTime =
                    delayedEntryId === entryId
                        ? scheduledTime
                        : new Date(conflict.scheduled_time).toISOString();

                const nextWorkingDay = this.getNextWorkingDay(delayedTime);

                console.log({
                    olderTaskId,
                    delayedTaskId,
                    delayedEntryId,
                    nextWorkingDay,
                });


                console.log({
                    olderTaskId,
                    delayedTaskId,
                    delayedEntryId
                });

                console.log("Current task:", taskId);
                console.log("Conflicting task:", conflict.task_id);
                console.log("Older task:", olderTaskId);

                throw new ConflictException(
                    `Conflict detected. Older task: ${olderTaskId ?? "Undetermined"}`
                );
            }
        }

        const updated = await this.database.db
            .updateTable(SCHEDULE_ENTRIES_TABLE_NAME)
            .set(input)
            .where('id', '=', entryId)
            .where('task_id', '=', taskId)
            .where('is_locked', '=', false)
            .where('status', '=', 'Planned')
            .returning('id')
            .executeTakeFirst();

        if (!updated) {
            throw new NotFoundException(
                `Schedule entry '${entryId}' not found`,
            );
        }

        return this.getScheduleEntry(
            taskId,
            entryId,
        );
    }
}