DROP TABLE IF EXISTS device_simmtronics_qse_events;

CREATE TABLE device_simmtronics_qse_events (
  id BIGSERIAL PRIMARY KEY,

  device_id TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,

  air_quality_index INTEGER NULL,
  co2_level NUMERIC NULL,
  co2_reading_valid BOOLEAN NULL,
  humidity NUMERIC NULL,
  illuminance_sensor NUMERIC NULL,
  is_consequence BOOLEAN NULL,
  minute_sound_level NUMERIC NULL,
  operational_status TEXT NULL,
  operational_status_details TEXT NULL,
  operational_status_due_to TEXT NULL,
  other_assets_affected TEXT NULL,
  pressure NUMERIC NULL,
  remedy TEXT NULL,
  remedy_details TEXT NULL,
  temp_rh_readings_valid BOOLEAN NULL,
  temperature NUMERIC NULL,
  total_volatile_organic_compounds NUMERIC NULL,
  tvoc_aq_readings_valid BOOLEAN NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_simmtronics_qse_events_device_id
  ON device_simmtronics_qse_events (device_id);

CREATE INDEX idx_device_simmtronics_qse_events_timestamp
  ON device_simmtronics_qse_events (event_timestamp);

CREATE INDEX idx_device_simmtronics_qse_events_device_time
  ON device_simmtronics_qse_events (device_id, event_timestamp DESC);

