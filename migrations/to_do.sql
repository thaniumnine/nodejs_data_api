-- interesting to implement

-- create table if not exists topic_permissions (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references users(id) on delete cascade,
--   topic_id uuid not null references topics(id) on delete cascade,
--   device_id text,
--   can_read boolean not null default false,
--   can_write boolean not null default false,
--   can_admin boolean not null default false,
--   created_at timestamptz not null default now(),
--   unique(user_id, topic_id, device_id)
-- );




-- create table if not exists audit_events (
--   id uuid primary key default gen_random_uuid(),
--   actor_user_id uuid references users(id) on delete set null,
--   action text not null,
--   entity_type text not null,
--   entity_id text,
--   metadata jsonb not null default '{}'::jsonb,
--   created_at timestamptz not null default now()
-- );
