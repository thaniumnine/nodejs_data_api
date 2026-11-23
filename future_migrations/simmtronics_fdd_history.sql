-- DROP TABLE IF EXISTS sim_fdd_history;
CREATE TABLE sim_fdd_history (
    id BIGSERIAL PRIMARY KEY,
    device_ref_id BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    room  TEXT NOT NULL,
    closed BOOLEAN NOT NULL,
    rule_id  TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_devices_identity
        FOREIGN KEY(device_ref_id)
            REFERENCES sim_device_identifier(id)
    -- ON DELETE CASCADE if want to delete this whenever devices id is delted
);
