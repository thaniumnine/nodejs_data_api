import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool, QueryResult } from 'pg';
import { env } from '../config/env';
import { DB } from './db.types';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly db: Kysely<DB>;

  constructor() {
    this.pool = new Pool({ connectionString: env.DATABASE_URL });
    this.db = new Kysely<DB>({
      dialect: new PostgresDialect({ pool: this.pool })
    });
  }

  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}
