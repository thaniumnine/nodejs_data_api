CREATE TABLE sim_device_identifier (
    id BIGSERIAL PRIMARY KEY,
    building TEXT NOT NULL,
    level TEXT NOT NULL,
    device_id TEXT NOT NULL,
    UNIQUE (org_ref_id, building, level, device_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    org_ref_id BIGINT NOT NULL DEFAULT 1, 
    CONSTRAINT fk_org_identity 
        FOREIGN KEY(org_ref_id)
            REFERENCES organisations(id)
);

-- TODO
-- device_identifier_pkey (primary key)
-- fk_org_identity (foreign key)
-- sim_device_identifier_org_ref_id_building_level_device_id_key (1 == UNIQUE)


CREATE TABLE sim_device_history (
    id BIGSERIAL PRIMARY KEY,
    device_ref_id BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    json_type TEXT NOT NULL,
    version TEXT,
    points JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_devices_identity
        FOREIGN KEY(device_ref_id)
            REFERENCES sim_device_identifier(id)
);

CREATE INDEX idx_device_history_timestamp ON sim_device_history (timestamp);
CREATE INDEX idx_device_history_device_ref_timestamp ON sim_device_history (device_ref_id, timestamp);
