-- DROP TABLE IF EXISTS device_history;
-- DROP TABLE IF EXISTS device_identifier;


CREATE TABLE device_identifier (
    id BIGSERIAL PRIMARY KEY,
    building TEXT NOT NULL,
    level TEXT NOT NULL,
    device_id TEXT NOT NULL,
    UNIQUE (building, level, device_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE device_history (
    id BIGSERIAL PRIMARY KEY,
    device_ref_id BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    json_type TEXT NOT NULL,
    version TEXT,
    points JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_devices_identity
        FOREIGN KEY(device_ref_id)
            REFERENCES device_identifier(id)
    -- ON DELETE CASCADE if want to delete this whenever devices id is delted
);

CREATE INDEX idx_device_history_timestamp ON device_history (timestamp);

