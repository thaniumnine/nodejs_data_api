import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FddAssignmentName, FddHistoryName } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';
import { quoteIdentifier } from '../common/sql/identifiers';

const FDD_ASSIGNMENT_TABLE_NAME = 'fdd_assignment';
const FDD_HISTORY_TABLE_NAME = 'fdd_history';

export type FddAssignmentRecord = {
  id: string;
  fdd_out_id: string;
  timestamp: Date;
  firebase_user_id: string;
};

@Injectable()
export class FddAssignmentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
  ) {}

  async createAssignment(organisation: string, fddOutId: string, firebaseUserId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const historyTableName = this.createFddHistoryTableName(metadata.prefix);
    const assignmentTableName = this.createFddAssignmentTableName(metadata.prefix);
    const historyRecord = await this.database.query<{ id: string }>(
      `SELECT id FROM ${quoteIdentifier(historyTableName)} WHERE id = $1`,
      [fddOutId],
    );
    if (!historyRecord.rows[0]) {
      throw new NotFoundException(`FDD record '${fddOutId}' not found`);
    }

    return this.database.db
      .insertInto(assignmentTableName)
      .values({ fdd_out_id: fddOutId, firebase_user_id: firebaseUserId })
      .returning(['id', 'fdd_out_id', 'timestamp', 'firebase_user_id'])
      .executeTakeFirstOrThrow();
  }

  async listAssignments(organisation: string, fddOutId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const historyTableName = this.createFddHistoryTableName(metadata.prefix);
    const assignmentTableName = this.createFddAssignmentTableName(metadata.prefix);
    const exists = await this.database.query<{ id: string }>(
      `SELECT id FROM ${quoteIdentifier(historyTableName)} WHERE id = $1`,
      [fddOutId],
    );
    if (!exists.rows[0]) {
      throw new NotFoundException(`FDD record '${fddOutId}' not found`);
    }

    const result = await this.database.query<FddAssignmentRecord>(
      `SELECT id, fdd_out_id, timestamp, firebase_user_id
       FROM ${quoteIdentifier(assignmentTableName)}
       WHERE fdd_out_id = $1
       ORDER BY timestamp DESC, id DESC`,
      [fddOutId],
    );
    return { records: result.rows, count: result.rowCount };
  }

  createFddAssignmentTableName(prefix: string): FddAssignmentName {
    return this.organisationService.createTableName(prefix, FDD_ASSIGNMENT_TABLE_NAME);
  }

  createFddHistoryTableName(prefix: string): FddHistoryName {
    return this.organisationService.createTableName(prefix, FDD_HISTORY_TABLE_NAME);
  }
}
