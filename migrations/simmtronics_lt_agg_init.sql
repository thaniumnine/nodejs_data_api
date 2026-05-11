DROP TABLE IF EXISTS device_simmtronics_lt_agg_events;

CREATE TABLE device_simmtronics_lt_agg_events (
    id BIGSERIAL PRIMARY KEY,

    device_id TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    agg_type TEXT NOT NULL,

    --initial_brightness_percentage_command NUMERIC(5,2)
    --    CHECK (initial_brightness_percentage_command BETWEEN 0 AND 100),

   -- max_limit_brightness_percentage_command NUMERIC(5,2)
     --   CHECK (max_limit_brightness_percentage_command BETWEEN 0 AND 100),

    brightness_percentage_command NUMERIC(5,2)
        CHECK (brightness_percentage_command BETWEEN 0 AND 100),

    -- colour_temperature NUMERIC,
    electrical_power_sensor NUMERIC,
    full_power_output NUMERIC,
    run_time_accumulator NUMERIC,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX idx_device_simmtronics_lt_agg_events_device_id
    ON device_simmtronics_lt_agg_events (device_id);

CREATE INDEX idx_device_simmtronics_lt_agg_events_timestamp
    ON device_simmtronics_lt_agg_events (event_timestamp);

CREATE INDEX idx_device_simmtronics_lt_agg_events_agg_type
    ON device_simmtronics_lt_agg_events (agg_type);

CREATE INDEX idx_device_simmtronics_lt_agg_events_device_time
    ON device_simmtronics_lt_agg_events (device_id, event_timestamp DESC);

CREATE INDEX idx_device_simmtronics_lt_agg_events_device_time_type
    ON device_simmtronics_lt_agg_events (device_id, agg_type, event_timestamp DESC);

