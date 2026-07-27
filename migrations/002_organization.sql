-- DROP TABLE IF EXISTS organisations;


CREATE TABLE organisations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (prefix ~ '^[A-Z][A-Z0-9_]*$')
);

INSERT INTO organisations (
    name,
    prefix
)
VALUES (
    'Simtronics',
    'SIM'
);