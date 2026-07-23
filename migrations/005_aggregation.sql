
create table if not exists aggregation(
  id uuid primary key default gen_random_uuid(),
  device_type text not null unique,
  table_name text not null unique,
  columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()

);
