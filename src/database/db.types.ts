import { ColumnType, Generated, Insertable, JSONColumnType, Selectable, Updateable } from 'kysely';
import { AggregationDeviceTypeColumnRecord } from 'src/aggregation-type/aggregation.service';

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
  daily_capacity_minutes: Generated<number>;
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


export type DeviceIdentifierTypeTable = {
  id: Generated<number>;
  org_ref_id: number;
  building: string;
  level: string;
  device_id: string;
  created_at: Generated<Date>;
}
export type DeviceHistoryTypeTable = {
  id: Generated<number>;
  device_ref_id: number;
  timestamp: TimestampColumn;
  json_type: string;
  version: string;
  points: {
    [pointtype: string]: any
  }
  created_at: Generated<Date>;
}


export type FddHistoryTypeTable = {
  id: Generated<number>;
  device_ref_id: number;
  timestamp: TimestampColumn;
  room: string;
  closed: boolean;
  rule_id: string;
  created_at: Generated<Date>;
  estimated_minutes: Generated<number | null>;
}

export type FddAssignmentTypeTable = {
  id: Generated<string>;
  fdd_history_id: string;
  timestamp: Generated<Date>;
  firebase_user_id: string;
}

export type FddCommentTypeTable = {
  id: Generated<string>;
  fdd_assignment_id: string;
  timestamp: Generated<Date>;
  comment: string;
  firebase_user_id: string | null;

  remaining_minutes: ColumnType<
    number | null,
    number | null | undefined,
    number | null
  >;

  minutes_worked: ColumnType<
    number | null,
    number | null | undefined,
    number | null
  >;
}

export type ScheduleEntryStatus =
  | 'Planned'
  | 'Completed'
  | 'Cancelled';

export type ScheduleEntriesTypeTable = {
  id: Generated<string>;
  task_id: string;
  scheduled_time: ColumnType<Date, Date | string, Date | string>;
  status: Generated<ScheduleEntryStatus>;
  is_locked: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

export type TaskEntriesTypeTable = {
  task_id: string;
  assignment_id: string;
};


type BaseAggregationTable = {
    id: Generated<number>;
    device_ref_id:number;
    device_id: string;
    event_timestamp: TimestampColumn;
    agg_type:string;
    created_at: Generated<Date>;
}
type ColumnAggregationMetrics = {
  [columnName: string]: number
}
export type AggregationTypeTable = BaseAggregationTable & ColumnAggregationMetrics



export interface AggregationDeviceTypeTable {
    id: Generated<number>;
    device_type:string;
    columns:JSONColumnType<AggregationDeviceTypeColumnRecord[]>;
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
  name: string;
  prefix: string;
  created_at: Generated<Date>;
}


export type DB = {
  users: UsersTable;
  user_sessions: UserSessionsTable;
  device_metadata: DeviceMetadataTypeTable;
  organisations: OrganisationsTable;
} & AggregationsDeviceTypeTable & AggregationsTable & DeviceHistoryTables & FddHistoryTables & FddAssignmentTables & FddCommentTables & DeviceIdentifierTables & ScheduleEntriesTables & TaskEntriesTables;



export type DeviceHistoryName = `${string}_device_history`;
export type DeviceHistoryTables = {
  [k in DeviceHistoryName | `"${DeviceHistoryName}"`]: DeviceHistoryTypeTable
}

export type FddHistoryName = `${string}_fdd_history`;
export type FddHistoryTables = {
  [k in FddHistoryName | `"${FddHistoryName}"`]: FddHistoryTypeTable
}

export type FddAssignmentName = `${string}_fdd_assignment`;
export type FddAssignmentTables = {
  [k in FddAssignmentName | `"${FddAssignmentName}"`]: FddAssignmentTypeTable
}

export type FddCommentName = `${string}_fdd_comment`;
export type FddCommentTables = {
  [k in FddCommentName | `"${FddCommentName}"`]: FddCommentTypeTable
}

export type ScheduleEntriesTables = {
  schedule_entries: ScheduleEntriesTypeTable;
};

export type TaskEntriesTables = {
  task_entries: TaskEntriesTypeTable;
};

export type DeviceIdentifierName = `${string}_device_identifier`
export type DeviceIdentifierTables = {
  [k in DeviceIdentifierName | `"${DeviceIdentifierName}"`]: DeviceIdentifierTypeTable
}


export type AggregationsName = `${string}_aggregations_${string}`
export type AggregationsTable = {
  [k in AggregationsName | `"${AggregationsName}"`]: AggregationTypeTable
}


export type AggregationsDeviceTypeName = `${string}_device_type_aggregation`
export type AggregationsDeviceTypeTable = {
  [k in AggregationsDeviceTypeName | `"${AggregationsDeviceTypeName}"`]: AggregationDeviceTypeTable
}




export type Organisation = Selectable<OrganisationsTable>;

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UpdateUser = Updateable<UsersTable>;
export type UserSession = Selectable<UserSessionsTable>;
