import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FddAssignmentName, FddHistoryName } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';
import { quoteIdentifier } from '../common/sql/identifiers';

const FDD_ASSIGNMENT_TABLE_NAME = 'sim_fdd_assignment';
const FDD_HISTORY_TABLE_NAME = 'sim_fdd_history';

export type FddAssignmentRecord = {
  id: string;
  fdd_history_id: string;
  timestamp: Date;
  firebase_user_id: string;
};

@Injectable()
export class FddAssignmentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
  ) { }


  async createAssignment(
    organisation: string,
    fddHistoryId: string,
    firebaseUserId: string
  ) {
    const metadata =
      await this.organisationService.queryOrganisationMetadata(organisation);

    const historyTableName = FDD_HISTORY_TABLE_NAME;
    const assignmentTableName = FDD_ASSIGNMENT_TABLE_NAME;

    // Check the FDD history record belongs to this organisation
    const historyRecord = await this.database.query<{ id: string }>(
      `SELECT dc.id
     FROM ${quoteIdentifier(historyTableName)} dc
     JOIN sim_device_identifier di
       ON dc.device_ref_id = di.id
     WHERE di.org_ref_id = $2
       AND dc.id = $1`,
      [fddHistoryId, metadata.id],
    );

    if (!historyRecord.rows[0]) {
      throw new NotFoundException(
        `FDD record '${fddHistoryId}' not found`
      );
    }

    // Create assignment linked to the history record
    return this.database.db
      .insertInto(assignmentTableName)
      .values({
        fdd_history_id: fddHistoryId,
        firebase_user_id: firebaseUserId
      })
      .returning([
        'id',
        'fdd_history_id',
        'timestamp',
        'firebase_user_id'
      ])
      .executeTakeFirstOrThrow();
  }



  async listAssignments(
    organisation: string,
    fddHistoryId: string
  ) {
    const metadata =
      await this.organisationService.queryOrganisationMetadata(organisation);

    const historyTableName = FDD_HISTORY_TABLE_NAME;
    const assignmentTableName = FDD_ASSIGNMENT_TABLE_NAME;

    // Confirm the history record belongs to the organisation
    const exists = await this.database.query<{ id: string }>(
      `SELECT dc.id
     FROM ${quoteIdentifier(historyTableName)} dc
     JOIN sim_device_identifier di
       ON dc.device_ref_id = di.id
     WHERE di.org_ref_id = $2
       AND dc.id = $1`,
      [fddHistoryId, metadata.id],
    );

    if (!exists.rows[0]) {
      throw new NotFoundException(
        `FDD record '${fddHistoryId}' not found`
      );
    }

    // Retrieve assignments for this history record
    const result = await this.database.query<FddAssignmentRecord>(
      `SELECT id, fdd_history_id, timestamp, firebase_user_id
     FROM ${quoteIdentifier(assignmentTableName)}
     WHERE fdd_history_id = $1
     ORDER BY timestamp DESC, id DESC`,
      [fddHistoryId],
    );

    return {
      records: result.rows,
      count: result.rowCount
    };
  }


async listUnscheduledAssignments(
    organisation: string,
    firebaseUserId: string,
) {
    const metadata =
        await this.organisationService.queryOrganisationMetadata(organisation);

    const result = await this.database.query<{
        fdd_history_id: string;
        assignment_id: string;
        firebase_user_id: string;
        rule_id: string;
        room: string;
        building: string;
        level: string;
        device_id: string;
    }>(
        `
        WITH latest_assignments AS (
            SELECT DISTINCT ON (fdd_history_id)
                id,
                fdd_history_id,
                firebase_user_id
            FROM public.sim_fdd_assignment
            ORDER BY fdd_history_id, timestamp DESC, id DESC
        )
        SELECT
            h.id::text AS fdd_history_id,
            a.id::text AS assignment_id,
            a.firebase_user_id,
            h.rule_id,
            h.room,
            di.building,
            di.level,
            di.device_id
        FROM public.sim_fdd_history h
        JOIN public.sim_device_identifier di
            ON di.id = h.device_ref_id
        JOIN latest_assignments a
            ON a.fdd_history_id = h.id
        WHERE di.org_ref_id = $1
          AND a.firebase_user_id = $2
          AND h.closed = FALSE
          AND NOT EXISTS (
              SELECT 1
              FROM public.sim_fdd_assignment previous_a
              JOIN public.task_entries te
                  ON te.assignment_id = previous_a.id
              JOIN public.schedule_entries s
                  ON s.task_id = te.task_id
              WHERE previous_a.fdd_history_id = h.id
                AND s.status != 'Cancelled'
          )
        ORDER BY h.id DESC
        `,
        [metadata.id, firebaseUserId],
    );

    return {
        records: result.rows,
        count: result.rows.length,
    };
}



}
