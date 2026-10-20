import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FddAssignmentName, FddHistoryName } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';
import { quoteIdentifier } from '../common/sql/identifiers';

const FDD_ASSIGNMENT_TABLE_NAME = 'sim_fdd_assignment';
const FDD_HISTORY_TABLE_NAME = 'sim_fdd_history';

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
        const historyTableName = FDD_HISTORY_TABLE_NAME
    const assignmentTableName = FDD_ASSIGNMENT_TABLE_NAME;
    const historyRecord = await this.database.query<{ id: string }>(
      `SELECT dc.id FROM ${quoteIdentifier(historyTableName)} dc JOIN sim_device_identifier di
        ON dc.device_ref_id = di.id
        WHERE 
             di.org_ref_id = $2
             AND dc.id = $1`,
      [fddOutId,metadata.id],
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
    const historyTableName = FDD_HISTORY_TABLE_NAME
    const assignmentTableName = FDD_ASSIGNMENT_TABLE_NAME
    const exists = await this.database.query<{ id: string }>(
      `SELECT dc.id   
        FROM ${quoteIdentifier(historyTableName)} dc JOIN sim_device_identifier di
        ON dc.device_ref_id = di.id
        WHERE 
             di.org_ref_id = $2
             AND dc.id = $1`,
      [fddOutId,metadata.id],
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

}
