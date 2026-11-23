
create table if not exists sim_device_type_aggregation(
  id uuid primary key default gen_random_uuid(),
  device_type text not null unique,
  columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()

);

-- TODO
-- aggregation_device_type_key (1 == UNIQUE)
-- aggregation_pkey (primary key)
-- aggregation_table_name_key (1 == UNIQUE)