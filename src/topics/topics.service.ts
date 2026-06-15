import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JsonValue, Topic } from '../database/db.types';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly database: DatabaseService) { }

  async create(input: CreateTopicDto): Promise<Topic> {
    try {
      return await this.database.db
        .insertInto('topics')
        .values({
          name: input.name,
          description: input.description ?? null,
          storage_type: input.storage_type,
          table_name: input.table_name,
          timestamp_column: input.timestamp_column,
          device_id_column: input.device_id_column,
          json_schema: (input.json_schema ?? null) as JsonValue | null,
          allowed_select_columns: (input.allowed_select_columns ?? []) as JsonValue,
          allowed_filter_columns: (input.allowed_filter_columns ?? []) as JsonValue,
          allowed_insert_columns: (input.allowed_insert_columns ?? []) as JsonValue,
          is_active: input.is_active ?? true
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new ConflictException('A topic with that name already exists');
      }
      throw error;
    }
  }

  async list(): Promise<Topic[]> {
    return this.database.db
      .selectFrom('topics')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  }

  async getByName(name: string): Promise<Topic | undefined> {
    return this.database.db.selectFrom('topics').selectAll().where('name', '=', name).executeTakeFirst();
  }

  async getRequiredByName(name: string): Promise<Topic> {
    const topic = await this.getByName(name);
    if (!topic || !topic.is_active) {
      throw new NotFoundException(`Topic not found: ${name}`);
    }
    return topic;
  }

  async update(name: string, input: UpdateTopicDto): Promise<Topic> {
    const patch: Record<string, unknown> = {
      updated_at: new Date()
    };

    if (input.description !== undefined) patch.description = input.description;
    if (input.storage_type !== undefined) patch.storage_type = input.storage_type;
    if (input.table_name !== undefined) patch.table_name = input.table_name;
    if (input.timestamp_column !== undefined) patch.timestamp_column = input.timestamp_column;
    if (input.device_id_column !== undefined) patch.device_id_column = input.device_id_column;
    if (input.json_schema !== undefined) patch.json_schema = input.json_schema;
    if (input.allowed_select_columns !== undefined) patch.allowed_select_columns = input.allowed_select_columns;
    if (input.allowed_filter_columns !== undefined) patch.allowed_filter_columns = input.allowed_filter_columns;
    if (input.allowed_insert_columns !== undefined) patch.allowed_insert_columns = input.allowed_insert_columns;
    if (input.is_active !== undefined) patch.is_active = input.is_active;

    const topic = await this.database.db
      .updateTable('topics')
      .set(patch as any)
      .where('name', '=', name)
      .returningAll()
      .executeTakeFirst();

    if (!topic) throw new NotFoundException(`Topic not found: ${name}`);
    return topic;
  }
}
