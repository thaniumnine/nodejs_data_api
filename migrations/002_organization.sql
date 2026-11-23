CREATE TABLE organisations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (prefix ~ '^[A-Z][A-Z0-9_]*$')
);

-- TODO
-- constraints
-- organisations_name_key (1 == UNIQUE)
-- organisations_pkey (primary key)
-- organisations_prefix_check (green tick)
-- organisations_prefix_key (1 == UNIQUE)