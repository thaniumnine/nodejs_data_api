DROP TABLE IF EXISTS organisations;


CREATE TABLE organisations (
    id BIGSERIAL PRIMARY KEY,
    organisation_name TEXT NOT NULL,
    organization_prefix TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (organization_prefix ~ '^[A-Z][A-Z0-9_]*$')
);

INSERT INTO organisations (
    organisation_name,
    organization_prefix
)
VALUES (
    'Simtronics',
    'SIM'
);