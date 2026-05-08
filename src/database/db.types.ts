import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type TimestampColumn = ColumnType<Date, Date | string | undefined, Date | string | undefined>;
export type NullableTimestampColumn = ColumnType<Date | null, Date | string | null | undefined, Date | string | null | undefined>;

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  display_name: string | null;
  roles: JsonValue;
  is_active: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface UserSessionsTable {
  id: Generated<string>;
  user_id: string;
  refresh_token_hash: string;
  refresh_token_family: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: TimestampColumn;
  expires_at: TimestampColumn;
  last_used_at: NullableTimestampColumn;
  revoked_at: NullableTimestampColumn;
  replaced_by_session_id: string | null;
}

export interface TopicsTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  storage_type: 'jsonb_event_log' | 'native_table';
  table_name: string;
  timestamp_column: string;
  device_id_column: string;
  json_schema: JsonValue | null;
  allowed_select_columns: JsonValue;
  allowed_filter_columns: JsonValue;
  allowed_insert_columns: JsonValue;
  is_active: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface TopicEventsTable {
  id: Generated<string>;
  topic_id: string | null;
  topic_name: string;
  device_id: string;
  event_timestamp: TimestampColumn;
  received_at: TimestampColumn;
  payload: JsonValue;
  source: string | null;
  created_by: string | null;
}

export interface TopicPermissionsTable {
  id: Generated<string>;
  user_id: string | null;
  topic_id: string;
  device_id: string | null;
  can_read: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  can_write: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  can_admin: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  created_at: TimestampColumn;
}

export interface DevicesTable {
  id: string;
  name: string | null;
  description: string | null;
  metadata: JsonValue;
  is_active: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  created_at: TimestampColumn;
  updated_at: TimestampColumn;
}

export interface AuditEventsTable {
  id: Generated<string>;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: JsonValue;
  created_at: TimestampColumn;
}

type BaseAggregationTable = {
    device_id: string;
    event_timestamp: TimestampColumn;
    agg_type:string;
}
type ColumnAggregationMetrics = {
  [columnName:string] :number
}
export type AggregationTable = BaseAggregationTable & ColumnAggregationMetrics

export interface AggregationDeviceTypeTable {
    device_type:string
    columns:JsonValue
    table_name:string
}


export type DB = {
  users: UsersTable;
  user_sessions: UserSessionsTable;
  topics: TopicsTable;
  topic_events: TopicEventsTable;
  topic_permissions: TopicPermissionsTable;
  devices: DevicesTable;
  audit_events: AuditEventsTable;
  aggregation:AggregationDeviceTypeTable;
} & AggregationTables

interface AggregationTables {
[tableName:string] :AggregationTable
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UpdateUser = Updateable<UsersTable>;
export type UserSession = Selectable<UserSessionsTable>;
export type Topic = Selectable<TopicsTable>;
export type NewTopic = Insertable<TopicsTable>;
export type TopicEvent = Selectable<TopicEventsTable>;
