import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FddAssignmentName, FddCommentName } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';
import { quoteIdentifier } from '../common/sql/identifiers';

const FDD_ASSIGNMENT_TABLE_NAME = 'sim_fdd_assignment';
const FDD_COMMENT_TABLE_NAME = 'sim_fdd_comment';

export type FddCommentRecord = {
  id: string;
  ticket_ref_id: string;
  timestamp: Date;
  comment: string;
  firebase_user_id: string | null;
};

@Injectable()
export class FddCommentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
  ) {}

  async createComment(organisation: string, ticketRefId: string, comment: string, firebaseUserId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const assignmentTableName = FDD_ASSIGNMENT_TABLE_NAME
    const commentTableName = FDD_COMMENT_TABLE_NAME

    await this.requireAssignment(assignmentTableName, ticketRefId,metadata.id);

    return this.database.db
      .insertInto(commentTableName)
      .values({ ticket_ref_id: ticketRefId, comment, firebase_user_id: firebaseUserId })
      .returning(['id', 'ticket_ref_id', 'timestamp', 'comment', 'firebase_user_id'])
      .executeTakeFirstOrThrow();
  }

  async listComments(organisation: string, ticketRefId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const assignmentTableName =FDD_ASSIGNMENT_TABLE_NAME
    const commentTableName = FDD_COMMENT_TABLE_NAME

    await this.requireAssignment(assignmentTableName, ticketRefId,metadata.id);

    const result = await this.database.query<FddCommentRecord>(
      `SELECT id, ticket_ref_id, timestamp, comment, firebase_user_id
   FROM ${quoteIdentifier(commentTableName)}
   WHERE ticket_ref_id = $1
   ORDER BY timestamp ASC, id ASC`,
      [ticketRefId],
    );

    return { records: result.rows, count: result.rowCount };

  }

  private async requireAssignment(assignmentTableName: FddAssignmentName, ticketRefId: string, metadataId: number) {
    const result = await this.database.query<{ id: string }>(
      `SELECT a.id
     FROM ${quoteIdentifier(assignmentTableName)} a
     JOIN sim_fdd_history h
       ON a.fdd_out_id = h.id
     JOIN sim_device_identifier di
       ON h.device_ref_id = di.id
     WHERE a.id = $1
       AND di.org_ref_id = $2`,
      [ticketRefId, metadataId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException(`Assignment '${ticketRefId}' not found`);
    }
  }


}

// node -e "require('dotenv').config(); const fs=require('fs'); const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); (async()=>{const client=await pool.connect(); try { await client.query('BEGIN'); await client.query(fs.readFileSync('migrations/simmtronics_comment.sql','utf8')); await client.query('COMMIT'); console.log('Created sim_fdd_comment'); } catch(error) { await client.query('ROLLBACK'); console.error(error.message); process.exitCode=1; } finally { client.release(); await pool.end(); } })();"