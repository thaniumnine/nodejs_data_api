import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JsonValue, User } from '../database/db.types';
import { sql } from 'kysely';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) { }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.database.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();
  }

  async findActiveById(id: string): Promise<User | undefined> {
    return this.database.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('is_active', '=', true)
      .executeTakeFirst();
  }

  async findOrganisationIdByName(
    name: string
  ): Promise<string | undefined> {
    const organisations = await this.database.db
      .selectFrom('organisations')
      .select(sql<string>`id::text`.as('id'))
      .where('name', '=', name)
      .execute();

    if (organisations.length !== 1) {
      return undefined;
    }

    return organisations[0].id;
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    displayName?: string;
    roles?: string[];
    orgRefIds?: string[];
  }): Promise<User> {
    try {
      return await this.database.db
        .insertInto('users')
        .values({
          email: input.email.toLowerCase(),
          password_hash: input.passwordHash,
          display_name: input.displayName ?? null,
          roles: sql<JsonValue>`${JSON.stringify(input.roles ?? [])}::jsonb`,
          org_ref_ids: input.orgRefIds ?? []
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new ConflictException('A user with that email already exists');
      }
      throw error;
    }
  }
}
