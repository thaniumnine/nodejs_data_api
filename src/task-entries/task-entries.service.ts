import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { sql, type Transaction } from 'kysely';
import { DatabaseService } from '../database/database.service';
import type { DB } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';

// A task groups one or more FDD assignments.
export type TaskRecord = {
  task_id: string;
  assignment_ids: string[];
};

const validId = (id: string) =>
  /^[1-9]\d*$/.test(id) &&
  BigInt(id) <= 9223372036854775807n;

@Injectable()
export class TaskEntriesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
  ) {}

  // Check that all requested assignments belong to the organisation.
  private async requireAssignments(
    trx: Transaction<DB>,
    organisationId: number,
    assignmentIds: string[],
  ) {
    const result = await sql<{ id: string }>`
      SELECT a.id::text AS id
      FROM public.sim_fdd_assignment a
      JOIN public.sim_fdd_history h
        ON a.fdd_history_id = h.id
      JOIN public.sim_device_identifier di
        ON h.device_ref_id = di.id
      WHERE di.org_ref_id = ${organisationId}
        AND a.id IN (
          ${sql.join(assignmentIds.map(id => sql`${id}::bigint`))}
        )
    `.execute(trx);

    const foundIds = new Set(result.rows.map(row => row.id));

    if (assignmentIds.some(id => !foundIds.has(id))) {
      throw new NotFoundException(
        'One or more FDD assignments were not found in this organisation.',
      );
    }
  }

  // Create a task containing one or more assignments.
  async createTask(
    organisation: string,
    assignmentIds: string[],
  ): Promise<TaskRecord> {
    if (
      !assignmentIds.length ||
      assignmentIds.some(id => !validId(id)) ||
      new Set(assignmentIds).size !== assignmentIds.length
    ) {
      throw new BadRequestException(
        'Provide unique, valid assignment IDs.',
      );
    }

    const metadata =
      await this.organisationService.queryOrganisationMetadata(organisation);

    return this.database.db.transaction().execute(async trx => {
      // Validate assignments before inserting.
      await this.requireAssignments(
        trx,
        metadata.id,
        assignmentIds,
      );

      // Generate one ID for the whole task.
      const sequenceResult = await sql<{ task_id: string }>`
        SELECT nextval('public.task_id_seq')::text AS task_id
      `.execute(trx);

      const taskId = sequenceResult.rows[0].task_id;

      // Link each assignment to the same task.
      await trx
        .insertInto('task_entries')
        .values(
          assignmentIds.map(assignmentId => ({
            task_id: taskId,
            assignment_id: assignmentId,
          })),
        )
        .execute();

      return {
        task_id: taskId,
        assignment_ids: assignmentIds,
      };
    });
  }

  // Retrieve all tasks belonging to an organisation.
  async listTasks(organisation: string) {
    const metadata =
      await this.organisationService.queryOrganisationMetadata(organisation);

    const result = await sql<TaskRecord>`
      SELECT
        te.task_id::text AS task_id,
        ARRAY_AGG(
          te.assignment_id::text ORDER BY te.assignment_id
        ) AS assignment_ids
      FROM public.task_entries te
      JOIN public.sim_fdd_assignment a
        ON te.assignment_id = a.id
      JOIN public.sim_fdd_history h
        ON a.fdd_history_id = h.id
      JOIN public.sim_device_identifier di
        ON h.device_ref_id = di.id
      WHERE di.org_ref_id = ${metadata.id}
      GROUP BY te.task_id
      ORDER BY te.task_id DESC
    `.execute(this.database.db);

    return {
      records: result.rows,
      count: result.rows.length,
    };
  }

  // Retrieve one task and its assignment IDs.
  async getTask(
    organisation: string,
    taskId: string,
  ): Promise<TaskRecord> {
    if (!validId(taskId)) {
      throw new BadRequestException('Invalid task ID.');
    }

    const metadata =
      await this.organisationService.queryOrganisationMetadata(organisation);

    const result = await sql<TaskRecord>`
      SELECT
        te.task_id::text AS task_id,
        ARRAY_AGG(
          te.assignment_id::text ORDER BY te.assignment_id
        ) AS assignment_ids
      FROM public.task_entries te
      JOIN public.sim_fdd_assignment a
        ON te.assignment_id = a.id
      JOIN public.sim_fdd_history h
        ON a.fdd_history_id = h.id
      JOIN public.sim_device_identifier di
        ON h.device_ref_id = di.id
      WHERE te.task_id = ${taskId}::bigint
        AND di.org_ref_id = ${metadata.id}
      GROUP BY te.task_id
    `.execute(this.database.db);

    if (!result.rows[0]) {
      throw new NotFoundException(
        `Task '${taskId}' not found.`,
      );
    }

    return result.rows[0];
  }

  // Add another FDD assignment to an existing task.
  async addAssignmentToTask(
    organisation: string,
    taskId: string,
    assignmentId: string,
  ): Promise<TaskRecord> {
    if (!validId(taskId) || !validId(assignmentId)) {
      throw new BadRequestException('Invalid task or assignment ID.');
    }

    const metadata =
      await this.organisationService.queryOrganisationMetadata(organisation);

    await this.database.db.transaction().execute(async trx => {
      // Verify the task exists and every existing assignment
      // belongs to the requested organisation.
      const owners = await sql<{ org_id: string }>`
        SELECT DISTINCT di.org_ref_id::text AS org_id
        FROM public.task_entries te
        JOIN public.sim_fdd_assignment a
          ON te.assignment_id = a.id
        JOIN public.sim_fdd_history h
          ON a.fdd_history_id = h.id
        JOIN public.sim_device_identifier di
          ON h.device_ref_id = di.id
        WHERE te.task_id = ${taskId}::bigint
      `.execute(trx);

      if (
        owners.rows.length !== 1 ||
        owners.rows[0].org_id !== String(metadata.id)
      ) {
        throw new NotFoundException(
          `Task '${taskId}' not found.`,
        );
      }

      // Check the new assignment belongs to the same organisation.
      await this.requireAssignments(
        trx,
        metadata.id,
        [assignmentId],
      );

      // Prevent duplicate links to the same task.
      const inserted = await trx
        .insertInto('task_entries')
        .values({
          task_id: taskId,
          assignment_id: assignmentId,
        })
        .onConflict(oc =>
          oc.columns(['task_id', 'assignment_id']).doNothing(),
        )
        .returning('task_id')
        .executeTakeFirst();

      if (!inserted) {
        throw new ConflictException(
          'Assignment is already linked to this task.',
        );
      }
    });

    return this.getTask(organisation, taskId);
  }
}
