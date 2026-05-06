DROP TABLE IF EXISTS device_simmtronics_lt_events;

CREATE TABLE device_simmtronics_lt_events (
    id BIGSERIAL PRIMARY KEY,

    device_id TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    agg_type TEXT NOT NULL,

    brightness_percentage_command NUMERIC(5,2)
        CHECK (brightness_percentage_command BETWEEN 0 AND 100),

    colour_temperature INTEGER,

    electrical_power_sensor NUMERIC,

    emergency_remedy TEXT,
    emergency_remedy_details TEXT,
    emergency_status TEXT,
    emergency_status_details TEXT,

    full_power_output NUMERIC,

    initial_brightness_percentage_command NUMERIC(5,2)
        CHECK (initial_brightness_percentage_command BETWEEN 0 AND 100),

    is_consequence BOOLEAN,

    last_duration_test_date DATE,
    last_function_test_date DATE,

    lighting_lamp_status TEXT,

    max_limit_brightness_percentage_command NUMERIC(5,2)
        CHECK (max_limit_brightness_percentage_command BETWEEN 0 AND 100),

    on_off_status BOOLEAN,

    operational_status TEXT,
    operational_status_details TEXT,
    operational_status_due_to TEXT,

    other_assets_affected JSONB,

    remedy TEXT,
    remedy_details TEXT,

    run_time_accumulator NUMERIC,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_simmtronics_lt_events_device_id
    ON device_simmtronics_lt_events (device_id);

CREATE INDEX idx_device_simmtronics_lt_events_timestamp
    ON device_simmtronics_lt_events (event_timestamp);

CREATE INDEX idx_device_simmtronics_lt_events_agg_type
    ON device_simmtronics_lt_events (agg_type);

CREATE INDEX idx_device_simmtronics_lt_events_device_time
    ON device_simmtronics_lt_events (device_id, event_timestamp DESC);

    CREATE INDEX idx_device_simmtronics_lt_events_device_time_type
    ON device_simmtronics_lt_events (device_id, agg_type, event_timestamp DESC);