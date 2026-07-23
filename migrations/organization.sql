DROP TABLE IF EXISTS organisations;


CREATE TABLE organisations (
    id BIGSERIAL PRIMARY KEY,
    organisation_name TEXT NOT NULL,
    history_table_name TEXT,
    aggregation_table_name TEXT,
    organization_prefix TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);