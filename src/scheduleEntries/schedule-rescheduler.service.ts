
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../database/database.service';
import type { ScheduleEntryStatus } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';
import type { UpdateScheduleEntryInput } from './schedule-entries.service';
import { dayKey } from './schedule-date.utils';
import { planScheduleMoves, type ScheduleMove } from './schedule-planner';
import { ForbiddenException } from '@nestjs/common';
import { calculateEstimatedMinutes } from './schedule-duration.utils';

const SCHEDULE_ENTRIES_TABLE_NAME = 'schedule_entries';

type BookingRow = {
    entry_id: string;
    task_id: string;
    scheduled_time: Date | string;
    status: ScheduleEntryStatus;
    is_locked: boolean;
    original_time: Date | string | null;
    owner_count: number;
    in_organisation: boolean;
    estimated_minutes: number | null;
};

type RescheduleInput = UpdateScheduleEntryInput & {
    scheduled_time: string;
};

export type ScheduleTransfer = {
    sourceUserId: string;
    targetUserId: string;
};

@Injectable()
export class ScheduleReschedulerService {
    constructor(
        private readonly database: DatabaseService,
        private readonly organisationService: OrganisationService,
    ) { }

    async reschedule(
        organisation: string,
        taskId: string,
        entryId: string,
        input: RescheduleInput,
        transfer?: ScheduleTransfer,
    ): Promise<void> {
        await this.schedule(
            organisation,
            taskId,
            entryId,
            input,
            transfer,
        );
    }

    async create(
        organisation: string,
        taskId: string,
        input: RescheduleInput,
        implementationCostGbp?: number,
    ): Promise<string> {
        return this.schedule(
            organisation,
            taskId,
            null,
            input,
            undefined,
            implementationCostGbp,
        );
    }

    private async schedule(
        organisation: string,
        taskId: string,
        existingEntryId: string | null,
        input: RescheduleInput,
        transfer?: ScheduleTransfer,
        implementationCostGbp?: number,
    ): Promise<string> {
        const scheduledTime = input.scheduled_time;
        const metadata =
            await this.organisationService.queryOrganisationMetadata(organisation);

        // Read, calculate and save all changes in one transaction. if 
        return this.database.db.transaction().execute(async trx => {
            await sql`
                SELECT pg_advisory_xact_lock(
                    hashtext('schedule-rescheduling'),
                    hashtext(${String(metadata.id)})
                )
            `.execute(trx);
            let entryId = existingEntryId;

            if (entryId === null) {
                const isCancelled = input.status === 'Cancelled';

                const created = await trx
                    .insertInto(SCHEDULE_ENTRIES_TABLE_NAME)
                    .values({
                        task_id: taskId,
                        scheduled_time: input.scheduled_time,
                        status: isCancelled ? 'Cancelled' : 'Planned',
                        is_locked: isCancelled
                            ? input.is_locked ?? false
                            : false,
                    })
                    .returning('id')
                    .executeTakeFirstOrThrow();

                entryId = created.id;

                if (isCancelled) return entryId;
            }
            const source = await trx
                .selectFrom(SCHEDULE_ENTRIES_TABLE_NAME)
                .select(['id', 'status', 'is_locked'])
                .where('id', '=', entryId)
                .where('task_id', '=', taskId)
                .executeTakeFirst();

            if (!source) {
                throw new NotFoundException('Schedule entry not found.');
            }

            if (source.is_locked || source.status !== 'Planned') {
                throw new ConflictException('This booking cannot be moved.');
            }

            // Only the latest linked assignment for each finding counts
            // as its current owner; old reassignments remain in history.
            const owners = await sql<{
                firebase_user_id: string;
                original_time: Date | string | null;
            }>`
                SELECT a.firebase_user_id,
                       MIN(h.timestamp) AS original_time
                FROM public.task_entries te
                JOIN public.sim_fdd_assignment a
                    ON a.id = te.assignment_id
                JOIN public.sim_fdd_history h
                    ON h.id = a.fdd_history_id
                WHERE te.task_id = ${taskId}
                  AND a.id = (
                      SELECT latest.id
                      FROM public.sim_fdd_assignment latest
                      JOIN public.task_entries te_latest
                          ON te_latest.assignment_id = latest.id
                      WHERE te_latest.task_id = te.task_id
                        AND latest.fdd_history_id = a.fdd_history_id
                      ORDER BY latest.timestamp DESC, latest.id DESC
                      LIMIT 1
                  )
                GROUP BY a.firebase_user_id
            `.execute(trx);

            if (
                owners.rows.length !== 1 ||
                owners.rows[0].original_time == null
            ) {
                throw new ConflictException(
                    'This scheduler requires one engineer per task.',
                );
            }


            if (
                existingEntryId === null &&
                implementationCostGbp !== undefined
            ) {
                const estimatedMinutes =
                    calculateEstimatedMinutes(implementationCostGbp);

                const findings = await sql<{
                    fdd_history_id: string;
                }>`
                    SELECT DISTINCT h.id::text AS fdd_history_id
                    FROM public.task_entries te
                    JOIN public.sim_fdd_assignment a
                        ON a.id = te.assignment_id
                    JOIN public.sim_fdd_history h
                        ON h.id = a.fdd_history_id
                    JOIN public.sim_device_identifier di
                        ON di.id = h.device_ref_id
                    WHERE te.task_id = ${taskId}
                    AND di.org_ref_id = ${metadata.id}
                `.execute(trx);

                if (findings.rows.length !== 1) {
                    throw new ConflictException(
                        'Expected one FDD finding for this estimate.'
                    );
                }

                // Save the original estimated duration.
                await sql`
                UPDATE public.sim_fdd_history
                SET estimated_minutes = ${estimatedMinutes}
                WHERE id = ${findings.rows[0].fdd_history_id}::bigint
                AND estimated_minutes IS NULL
            `.execute(trx);
            }
            const currentEngineerId = owners.rows[0].firebase_user_id;

            let engineerId = currentEngineerId;

            if (transfer) {
                if (transfer.sourceUserId !== currentEngineerId) {
                    throw new ForbiddenException(
                        'You cannot transfer another engineer\'s booking.'
                    );
                }

                if (transfer.targetUserId !== currentEngineerId) {

                    // Find the FDD associated with this task.
                    const findings = await sql<{
                        fdd_history_id: string;
                        closed: boolean;
                    }>`
                    SELECT DISTINCT
                        h.id::text AS fdd_history_id,
                        h.closed
                    FROM public.task_entries te
                    JOIN public.sim_fdd_assignment a
                        ON a.id = te.assignment_id
                    JOIN public.sim_fdd_history h
                        ON h.id = a.fdd_history_id
                    JOIN public.sim_device_identifier di
                        ON di.id = h.device_ref_id
                    WHERE te.task_id = ${taskId}
                    AND di.org_ref_id = ${metadata.id}
                `.execute(trx);

                    if (findings.rows.length !== 1 || findings.rows[0].closed) {
                        throw new ConflictException(
                            'Only tasks containing one open FDD can be transferred.'
                        );
                    }

                    const findingId = findings.rows[0].fdd_history_id;

                    // Avoid changing ownership of other bookings belonging to the same task.
                    const bookings = await trx
                        .selectFrom(SCHEDULE_ENTRIES_TABLE_NAME)
                        .select('id')
                        .where('task_id', '=', taskId)
                        .execute();

                    if (bookings.length !== 1) {
                        throw new ConflictException(
                            'This task has multiple schedule entries.'
                        );
                    }

                    // Confirm the linked assignment is still the latest one.
                    const latest = await sql<{
                        id: string;
                        firebase_user_id: string;
                        linked: boolean;
                    }>`
                    SELECT
                        a.id::text AS id,
                        a.firebase_user_id,
                        EXISTS (
                            SELECT 1
                            FROM public.task_entries te
                            WHERE te.task_id = ${taskId}
                            AND te.assignment_id = a.id
                        ) AS linked
                    FROM public.sim_fdd_assignment a
                    WHERE a.fdd_history_id = ${findingId}
                    ORDER BY a.timestamp DESC, a.id DESC
                    LIMIT 1
                `.execute(trx);

                    if (
                        !latest.rows[0]?.linked ||
                        latest.rows[0].firebase_user_id !== currentEngineerId
                    ) {
                        throw new ConflictException(
                            'The FDD assignment has changed. Refresh the calendar.'
                        );
                    }

                    // Reject findings already booked through another active task.
                    const otherTasks = await sql`
                    SELECT 1
                    FROM public.sim_fdd_assignment a
                    JOIN public.task_entries te
                        ON te.assignment_id = a.id
                    JOIN public.schedule_entries s
                        ON s.task_id = te.task_id
                    WHERE a.fdd_history_id = ${findingId}
                    AND te.task_id <> ${taskId}
                    AND s.status <> 'Cancelled'
                    LIMIT 1
                `.execute(trx);

                    if (otherTasks.rows.length) {
                        throw new ConflictException(
                            'This FDD has another active task.'
                        );
                    }

                    // Create a new assignment, preserving the old history.
                    const assignment = await trx
                        .insertInto('sim_fdd_assignment')
                        .values({
                            fdd_history_id: findingId,
                            firebase_user_id: transfer.targetUserId,
                        })
                        .returning('id')
                        .executeTakeFirstOrThrow();

                    // Link the new assignment to the existing task.
                    await trx
                        .insertInto('task_entries')
                        .values({
                            task_id: taskId,
                            assignment_id: assignment.id,
                        })
                        .execute();

                    // The conflict planner now checks the destination engineer.
                    engineerId = transfer.targetUserId;
                }
            }

            const originalTime =
                new Date(owners.rows[0].original_time).getTime();

            // Retrieve the total estimated duration of the task.
            const duration = await sql<{
                estimated_minutes: number | null;
            }>`
                SELECT
                    CASE
                        WHEN COUNT(*) = COUNT(h.estimated_minutes)
                        THEN SUM(h.estimated_minutes)::double precision
                        ELSE NULL
                    END AS estimated_minutes
                FROM public.sim_fdd_history h
                WHERE EXISTS (
                    SELECT 1
                    FROM public.task_entries te
                    JOIN public.sim_fdd_assignment a
                        ON a.id = te.assignment_id
                    WHERE te.task_id = ${taskId}
                    AND a.fdd_history_id = h.id
                )
            `.execute(trx);

            const estimatedMinutes =
                duration.rows[0]?.estimated_minutes ?? null;

            // Serialise cooperating reschedules for this engineer.
            await sql`
                SELECT pg_advisory_xact_lock(
                    hashtext(${organisation}),
                    hashtext(${engineerId})
                )
            `.execute(trx);

            // Read the engineer's active bookings near the requested date.
            const existing = await sql<BookingRow>`
                SELECT
                    s.id AS entry_id,
                    s.task_id::text AS task_id,
                    s.scheduled_time,
                    s.status,
                    s.is_locked,
                    MIN(h.timestamp) AS original_time,
                    CASE
                        WHEN COUNT(*) = COUNT(h.estimated_minutes)
                        THEN SUM(h.estimated_minutes)::double precision
                        ELSE NULL
                    END AS estimated_minutes,
                    COUNT(DISTINCT a.firebase_user_id)::int AS owner_count,
                    BOOL_AND(di.org_ref_id = ${metadata.id}) AS in_organisation
                FROM public.schedule_entries s
                JOIN public.task_entries te
                    ON te.task_id = s.task_id
                JOIN public.sim_fdd_assignment a
                    ON a.id = te.assignment_id
                JOIN public.sim_fdd_history h
                    ON h.id = a.fdd_history_id
                JOIN public.sim_device_identifier di
                    ON di.id = h.device_ref_id
                WHERE s.status <> 'Cancelled'
                  AND s.scheduled_time >=
                      (${scheduledTime}::timestamptz - INTERVAL '1 day')
                  AND s.scheduled_time <
                      (${scheduledTime}::timestamptz + INTERVAL '45 days')
                  AND a.id = (
                      SELECT latest.id
                      FROM public.sim_fdd_assignment latest
                      JOIN public.task_entries te_latest
                          ON te_latest.assignment_id = latest.id
                      WHERE te_latest.task_id = te.task_id
                        AND latest.fdd_history_id = a.fdd_history_id
                      ORDER BY latest.timestamp DESC, latest.id DESC
                      LIMIT 1
                  )
                GROUP BY s.id
                HAVING BOOL_OR(a.firebase_user_id = ${engineerId})
            `.execute(trx);

            // Day -> booking, excluding the entry being dragged.
            const occupied = new Map<string, ScheduleMove[]>();

            for (const row of existing.rows) {
                if (row.entry_id === entryId) continue;

                if (
                    row.owner_count !== 1 ||
                    !row.in_organisation ||
                    row.original_time == null
                ) {
                    throw new ConflictException(
                        'An existing booking cannot be automatically moved.',
                    );
                }

                const booking: ScheduleMove = {
                    entryId: row.entry_id,
                    taskId: row.task_id,
                    scheduledTime: new Date(row.scheduled_time).toISOString(),
                    originalTime: new Date(row.original_time).getTime(),
                    status: row.status,
                    isLocked: row.is_locked,
                    estimatedMinutes: row.estimated_minutes,
                };

                const day = dayKey(booking.scheduledTime);

                const dayBookings = occupied.get(day) ?? [];

                occupied.set(day, [...dayBookings, booking]);
            }

            // Calculate all moves before writing anything.
            const proposedMoves = planScheduleMoves(
                {
                    entryId,
                    taskId,
                    scheduledTime,
                    originalTime,
                    status: 'Planned',
                    isLocked: false,
                    estimatedMinutes,
                },
                occupied,
            );

            // Commit all moves together (or roll all of them back). Uses transaction to do this
            for (const move of proposedMoves) {
                const updated = await trx
                    .updateTable(SCHEDULE_ENTRIES_TABLE_NAME)
                    .set(
                        move.entryId === entryId
                            ? { ...input, scheduled_time: move.scheduledTime }
                            : { scheduled_time: move.scheduledTime },
                    )
                    .where('id', '=', move.entryId)
                    .where('task_id', '=', move.taskId)
                    .where('status', '=', 'Planned')
                    .where('is_locked', '=', false)
                    .returning('id')
                    .executeTakeFirst();

                if (!updated) {
                    throw new ConflictException(
                        `Unable to update schedule entry ${move.entryId}`,
                    );
                }
            }
            return entryId;
        });
    }
}
