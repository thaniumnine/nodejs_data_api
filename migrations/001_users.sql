create extension if not exists pgcrypto; 
-- for gen_random_uuid()

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


create index if not exists idx_user_sessions_user_id on user_sessions(user_id);
create index if not exists idx_user_sessions_family on user_sessions(refresh_token_family);
create index if not exists idx_user_sessions_active on user_sessions(user_id, expires_at) where revoked_at is null;