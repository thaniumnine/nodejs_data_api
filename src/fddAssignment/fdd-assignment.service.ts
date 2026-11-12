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


}
