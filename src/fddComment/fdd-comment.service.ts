import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FddAssignmentName, FddCommentName } from '../database/db.types';
import { OrganisationService } from '../organisations/organisations.service';
import { quoteIdentifier } from '../common/sql/identifiers';

const FDD_ASSIGNMENT_TABLE_NAME = 'fdd_assignment';
const FDD_COMMENT_TABLE_NAME = 'fdd_comment';

export type FddCommentRecord = {
  id: string;
  ticket_ref_id: string;
  timestamp: Date;
  comment: string;
};

@Injectable()
export class FddCommentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly organisationService: OrganisationService,
  ) {}

  async createComment(organisation: string, ticketRefId: string, comment: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const assignmentTableName = this.createFddAssignmentTableName(metadata.prefix);
    const commentTableName = this.createFddCommentTableName(metadata.prefix);

    await this.requireAssignment(assignmentTableName, ticketRefId);

    return this.database.db
      .insertInto(commentTableName)
      .values({
        ticket_ref_id: ticketRefId,
        comment,
      })
      .returning(['id', 'ticket_ref_id', 'timestamp', 'comment'])
      .executeTakeFirstOrThrow();
  }

  async listComments(organisation: string, ticketRefId: string) {
    const metadata = await this.organisationService.queryOrganisationMetadata(organisation);
    const assignmentTableName = this.createFddAssignmentTableName(metadata.prefix);
    const commentTableName = this.createFddCommentTableName(metadata.prefix);

    await this.requireAssignment(assignmentTableName, ticketRefId);

    const result = await this.database.query<FddCommentRecord>(
      `SELECT id, ticket_ref_id, timestamp, comment
       FROM ${quoteIdentifier(commentTableName)}
       WHERE ticket_ref_id = $1
       ORDER BY timestamp ASC, id ASC`,
      [ticketRefId],
    );

    return { records: result.rows, count: result.rowCount };
  }

  private async requireAssignment(assignmentTableName: FddAssignmentName, ticketRefId: string) {
    const result = await this.database.query<{ id: string }>(
      `SELECT id FROM ${quoteIdentifier(assignmentTableName)} WHERE id = $1`,
      [ticketRefId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException(`Assignment '${ticketRefId}' not found`);
    }
  }

  createFddAssignmentTableName(prefix: string): FddAssignmentName {
    return this.organisationService.createTableName(prefix, FDD_ASSIGNMENT_TABLE_NAME);
  }

  createFddCommentTableName(prefix: string): FddCommentName {
    return this.organisationService.createTableName(prefix, FDD_COMMENT_TABLE_NAME);
  }
}

// node -e 'require("dotenv").config(); const fs=require("fs"); const {Pool}=require("pg"); const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); (async()=>{const client=await pool.connect(); try{await client.query("BEGIN"); await client.query(fs.readFileSync("migrations/simmtronics_comment.sql","utf8")); await client.query("COMMIT"); console.log("Created sim_fdd_comment");}catch(error){await client.query("ROLLBACK"); console.error(error.message); process.exitCode=1;}finally{client.release(); await pool.end();}})();'