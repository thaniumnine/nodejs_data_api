import { Injectable } from '@nestjs/common';
import { sql, type Transaction } from 'kysely';
import type { DB, JsonValue } from '../database/db.types';

type AuditLogInput = {
  userId: string;
  orgRefId: string;
  action: string;
  actionInfo: Record<string, JsonValue>;
};

@Injectable()
export class AuditLogService {
  async record(
    trx: Transaction<DB>,
    input: AuditLogInput
  ): Promise<void> {
    await trx
      .insertInto('api_audit_logs')
      .values({
        user_id: input.userId,
        org_ref_id: input.orgRefId,
        action: input.action,
        action_info: sql<JsonValue>`${JSON.stringify(input.actionInfo)}::jsonb`
      })
      .execute();
  }
}