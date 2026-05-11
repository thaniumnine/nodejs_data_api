DROP TABLE IF EXISTS device_simmtronics_mts_events;

CREATE TABLE device_simmtronics_mts_events (
    id BIGSERIAL PRIMARY KEY,

    device_id TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,

    heat_map_indication TEXT,
    illuminance_sensor INTEGER,
    is_consequence INTEGER,
    last_week_occupancy_spells INTEGER,
    last_week_total_occupancy INTEGER,
    motion_event INTEGER,
    operational_status TEXT,
    operational_status_details TEXT,
    operational_status_due_to TEXT,
    other_assets_affected TEXT,
    presence_indication TEXT,
    remedy TEXT,
    remedy_details TEXT,
    this_week_cumulative_occupancy INTEGER,
    this_week_occupancy_spells INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_simmtronics_mts_events_device_id
    ON device_simmtronics_mts_events (device_id);

CREATE INDEX idx_device_simmtronics_mts_events_timestamp
    ON device_simmtronics_mts_events (event_timestamp);

CREATE INDEX idx_device_simmtronics_mts_events_device_time
    ON device_simmtronics_mts_events (device_id, event_timestamp DESC);