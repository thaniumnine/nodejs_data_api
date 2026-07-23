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


// export interface TopicPermissionsTable {
//   id: Generated<string>;
//   user_id: string | null;
//   topic_id: string;
//   device_id: string | null;
//   can_read: ColumnType<boolean, boolean | undefined, boolean | undefined>;
//   can_write: ColumnType<boolean, boolean | undefined, boolean | undefined>;
//   can_admin: ColumnType<boolean, boolean | undefined, boolean | undefined>;
//   created_at: TimestampColumn;
// }

// export interface AuditEventsTable {
//   id: Generated<string>;
//   actor_user_id: string | null;
//   action: string;
//   entity_type: string;
//   entity_id: string | null;
//   metadata: JsonValue;
//   created_at: TimestampColumn;
// }

type BaseAggregationTable = {
    id: Generated<number>;
    device_id: string;
    event_timestamp: TimestampColumn;
    agg_type:string;
     created_at: Generated<Date>;
}
type ColumnAggregationMetrics = {
  [columnName: string]: number
}
export type AggregationTable = BaseAggregationTable & ColumnAggregationMetrics

export interface AggregationDeviceTypeTable {
    id: Generated<number>;
    device_type:string
    columns:JsonValue
    table_name:string
     created_at: Generated<Date>;
}


export type DeviceIdentifierTypeTable = {
    id: Generated<number>;
  building: string;
  level: string;
  device_id: string;
   created_at: Generated<Date>;
}
export type DeviceHistoryTypeTable = {
  id: Generated<number>;
  timestamp: TimestampColumn;
  json_type: string;
  version: string;
  points: {
    [pointtype: string]: any
  }
   created_at: Generated<Date>;
}

export type DeviceMetadataTypeTable = {
  device_id: string;
  version: string;
  timestamp: TimestampColumn;
  "system.location.site": string;
  "system.location.section": string;
  "system.location.room": string;
  "system.location.floor": string;
  "system.location.floor_seq": number;

  "system.location.position.x": number;
  "system.location.position.y": number;
  "system.location.position.z": number;

  "system.physical_tag.asset.guid": string;
  "system.physical_tag.asset.site": string;
  "system.physical_tag.asset.name": string;

  "gateway.gateway_id"?: string;

  pointset: {
    [pointtype: string]: JsonValue;
  };
};

export type OrganisationsTable = {
    id: Generated<number>;
    name:string;
    prefix:string;
    created_at: Generated<Date>;
}


export type DB = {
  users: UsersTable;
  user_sessions: UserSessionsTable;
  aggregation:AggregationDeviceTypeTable;
  device_metadata:DeviceMetadataTypeTable;
  organisations:OrganisationsTable;
} & AggregationTables & DeviceHistoryTables  & DeviceIdentifierTables



export type DeviceHistoryName =  `${string}_device_history`; 
export type DeviceIdentifierName =  `${string}_device_identifier`
export type DeviceHistoryTables = {
  [k in DeviceHistoryName] : DeviceHistoryTypeTable
}

export type DeviceIdentifierTables = {
  [k in DeviceIdentifierName] : DeviceIdentifierTypeTable
}
interface AggregationTables {
  [tableName: string]: AggregationTable
}


export type Organisation = Selectable<OrganisationsTable>;

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UpdateUser = Updateable<UsersTable>;
export type UserSession = Selectable<UserSessionsTable>;
