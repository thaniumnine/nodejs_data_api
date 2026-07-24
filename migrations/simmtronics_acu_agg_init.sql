DROP TABLE IF EXISTS device_simmtronics_acu_agg_events;

CREATE TABLE device_simmtronics_acu_agg_events (
  id BIGSERIAL PRIMARY KEY,

  device_id TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  agg_type TEXT NOT NULL,

  room_temperature NUMERIC NULL,
  room_temperature_setpoint NUMERIC NULL,

   UNIQUE (device_id,agg_type, event_timestamp),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_simmtronics_acu_agg_events_device_id
  ON device_simmtronics_acu_agg_events (device_id);

CREATE INDEX idx_device_simmtronics_acu_agg_events_timestamp
  ON device_simmtronics_acu_agg_events (event_timestamp);

CREATE INDEX idx_device_simmtronics_acu_agg_events_agg_type
  ON device_simmtronics_acu_agg_events (agg_type);

CREATE INDEX idx_device_simmtronics_acu_agg_events_device_time
  ON device_simmtronics_acu_agg_events (device_id, event_timestamp DESC);

CREATE INDEX idx_device_simmtronics_acu_agg_events_device_time_type
  ON device_simmtronics_acu_agg_events (device_id, agg_type, event_timestamp DESC);








