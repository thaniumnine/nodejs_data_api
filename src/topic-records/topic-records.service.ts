import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import {
  parseStringArray,
  quoteIdentifier,
  quoteQualifiedIdentifier
} from '../common/sql/identifiers';
import { DatabaseService } from '../database/database.service';
import { JsonValue, Topic } from '../database/db.types';
import { TopicsService } from '../topics/topics.service';
import { CreateTopicEventDto, QueryTopicRecordsDto } from './dto/topic-record.dto';

@Injectable()
export class TopicRecordsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly topicsService: TopicsService
  ) { }

  async createJsonbEvent(topicName: string, input: CreateTopicEventDto, user: AuthenticatedUser) {
    const topic = await this.topicsService.getRequiredByName(topicName);

    if (topic.storage_type !== 'jsonb_event_log') {
      throw new BadRequestException('This topic is backed by a native table. Use POST /topics/:topic/rows.');
    }

    const event = await this.database.db
      .insertInto('topic_events')
      .values({
        topic_id: topic.id,
        topic_name: topic.name,
        device_id: input.device_id,
        event_timestamp: input.event_timestamp ? new Date(input.event_timestamp) : new Date(),
        payload: input.payload as JsonValue,
        source: input.source ?? null,
        created_by: user.id
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      storage_type: topic.storage_type,
      event
    };
  }

  async queryTopicRecords(topicName: string, query: QueryTopicRecordsDto) {
    const topic = await this.topicsService.getRequiredByName(topicName);

    if (topic.storage_type === 'jsonb_event_log') {
      return this.queryJsonbEvents(topic, query);
    }

    return this.queryNativeRows(topic, query);
  }

  async latestByDevice(topicName: string, deviceId: string) {
    const result = await this.queryTopicRecords(topicName, {
      device_id: deviceId,
      limit: 1,
      offset: 0
    });

    return {
      topic: result.topic,
      storage_type: result.storage_type,
      record: result.records[0] ?? null
    };
  }

  async createNativeRow(topicName: string, row: Record<string, unknown>) {
    const topic = await this.topicsService.getRequiredByName(topicName);

    if (topic.storage_type !== 'native_table') {
      throw new BadRequestException('This topic uses JSONB event storage. Use POST /topics/:topic/events.');
    }

    const allowedInsertColumns = parseStringArray(topic.allowed_insert_columns);
    if (allowedInsertColumns.length === 0) {
      throw new BadRequestException('This native table topic has no allowed_insert_columns configured.');
    }

    const rowKeys = Object.keys(row);
    const rejectedColumns = rowKeys.filter((column) => !allowedInsertColumns.includes(column));

    if (rejectedColumns.length > 0) {
      throw new BadRequestException({
        message: 'One or more columns are not allowed for insert',
        rejected_columns: rejectedColumns
      });
    }

    if (rowKeys.length === 0) {
      throw new BadRequestException('Row must contain at least one allowed column.');
    }

    const tableSql = quoteQualifiedIdentifier(topic.table_name);
    const columnSql = rowKeys.map(quoteIdentifier).join(', ');
    const placeholders = rowKeys.map((_, index) => `$${index + 1}`).join(', ');
    const values = rowKeys.map((key) => row[key]);

    const sql = `insert into ${tableSql} (${columnSql}) values (${placeholders}) returning *`;
    const result = await this.database.query(sql, values);

    return {
      topic: topic.name,
      storage_type: topic.storage_type,
      row: result.rows[0]
    };
  }

  private async queryJsonbEvents(topic: Topic, query: QueryTopicRecordsDto) {
    const values: unknown[] = [topic.name];
    const where: string[] = ['topic_name = $1'];

    if (query.device_id) {
      values.push(query.device_id);
      where.push(`device_id = $${values.length}`);
    }

    if (query.from) {
      values.push(query.from);
      where.push(`event_timestamp >= $${values.length}`);
    }

    if (query.to) {
      values.push(query.to);
      where.push(`event_timestamp < $${values.length}`);
    }

    values.push(query.limit);
    const limitParam = `$${values.length}`;
    values.push(query.offset);
    const offsetParam = `$${values.length}`;

    const result = await this.database.query(
      `select id,
              topic_name,
              device_id,
              event_timestamp,
              received_at,
              payload,
              source
         from topic_events
        where ${where.join(' and ')}
        order by event_timestamp desc
        limit ${limitParam}
       offset ${offsetParam}`,
      values
    );

    return {
      topic: topic.name,
      storage_type: topic.storage_type,
      records: result.rows
    };
  }

  private async queryNativeRows(topic: Topic, query: QueryTopicRecordsDto) {
    const tableSql = quoteQualifiedIdentifier(topic.table_name);
    const timestampColumnSql = quoteIdentifier(topic.timestamp_column);
    const deviceIdColumnSql = quoteIdentifier(topic.device_id_column);
    const selectColumns = parseStringArray(topic.allowed_select_columns);
    const selectSql = selectColumns.length > 0
      ? selectColumns.map(quoteIdentifier).join(', ')
      : '*';

    const values: unknown[] = [];
    const where: string[] = [];

    if (query.device_id) {
      values.push(query.device_id);
      where.push(`${deviceIdColumnSql} = $${values.length}`);
    }

    if (query.from) {
      values.push(query.from);
      where.push(`${timestampColumnSql} >= $${values.length}`);
    }

    if (query.to) {
      values.push(query.to);
      where.push(`${timestampColumnSql} < $${values.length}`);
    }

    values.push(query.limit);
    const limitParam = `$${values.length}`;
    values.push(query.offset);
    const offsetParam = `$${values.length}`;

    const whereSql = where.length > 0 ? `where ${where.join(' and ')}` : '';

    const result = await this.database.query(
      `select ${selectSql}
         from ${tableSql}
         ${whereSql}
        order by ${timestampColumnSql} desc
        limit ${limitParam}
       offset ${offsetParam}`,
      values
    );

    return {
      topic: topic.name,
      storage_type: topic.storage_type,
      records: result.rows
    };
  }
}
