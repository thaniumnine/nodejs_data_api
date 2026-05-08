create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  roles jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null unique,
  refresh_token_family uuid not null,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  replaced_by_session_id uuid references user_sessions(id)
);


create table if not exists aggregation(
  id uuid primary key default gen_random_uuid(),
  device_type text not null unique,
  table_name text not null unique,
  columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()

);

create index if not exists idx_user_sessions_user_id on user_sessions(user_id);
create index if not exists idx_user_sessions_family on user_sessions(refresh_token_family);
create index if not exists idx_user_sessions_active on user_sessions(user_id, expires_at) where revoked_at is null;

create table if not exists devices (
  id text primary key,
  name text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  storage_type text not null check (storage_type in ('jsonb_event_log', 'native_table')),
  table_name text not null,
  timestamp_column text not null default 'event_timestamp',
  device_id_column text not null default 'device_id',
  json_schema jsonb,
  allowed_select_columns jsonb not null default '[]'::jsonb,
  allowed_filter_columns jsonb not null default '[]'::jsonb,
  allowed_insert_columns jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_topics_name_active on topics(name, is_active);

create table if not exists topic_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  device_id text,
  can_read boolean not null default false,
  can_write boolean not null default false,
  can_admin boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, topic_id, device_id)
);

create table if not exists topic_events (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete set null,
  topic_name text not null,
  device_id text not null,
  event_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb not null,
  source text,
  created_by uuid references users(id) on delete set null
);

create index if not exists idx_topic_events_topic_time
  on topic_events(topic_name, event_timestamp desc);

create index if not exists idx_topic_events_topic_device_time
  on topic_events(topic_name, device_id, event_timestamp desc);

create index if not exists idx_topic_events_payload_gin
  on topic_events using gin(payload);

create table if not exists device_status (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  status text not null,
  firmware_version text,
  battery_percent numeric(5,2),
  event_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_device_status_device_time
  on device_status(device_id, event_timestamp desc);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into topics (
  name,
  description,
  storage_type,
  table_name,
  timestamp_column,
  device_id_column,
  json_schema,
  allowed_select_columns,
  allowed_filter_columns,
  allowed_insert_columns
)
values
(
  'sensor_readings',
  'Flexible JSONB sensor readings. Payload shape can evolve by topic schema.',
  'jsonb_event_log',
  'topic_events',
  'event_timestamp',
  'device_id',
  '{"type":"object","properties":{"temperature":{"type":"number"},"humidity":{"type":"number"},"battery":{"type":"number"}}}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  'device_status',
  'Native SQL table example for structured device status data.',
  'native_table',
  'device_status',
  'event_timestamp',
  'device_id',
  null,
  '["id","device_id","status","firmware_version","battery_percent","event_timestamp","received_at","raw_payload"]'::jsonb,
  '["device_id","status"]'::jsonb,
  '["device_id","status","firmware_version","battery_percent","event_timestamp","raw_payload"]'::jsonb
)
on conflict (name) do nothing;
