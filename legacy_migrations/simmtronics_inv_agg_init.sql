-- DROP TABLE IF EXISTS sim_aggregations_inv;

CREATE TABLE sim_aggregations_inv (
  id BIGSERIAL PRIMARY KEY,

  device_id TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  agg_type TEXT NOT NULL,

  --total_imported_energy NUMERIC NULL,
  --today_imported_energy NUMERIC NULL,
  grid_power NUMERIC NULL,
  alternating_current_phase_1_power  NUMERIC NULL,
  alternating_current_phase_2_power  NUMERIC NULL,
  alternating_current_phase_3_power  NUMERIC NULL,
  UNIQUE (device_id,agg_type, event_timestamp),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sim_aggregations_inv_device_id
  ON sim_aggregations_inv (device_id);

CREATE INDEX idx_sim_aggregations_inv_timestamp
  ON sim_aggregations_inv (event_timestamp);

CREATE INDEX idx_sim_aggregations_inv_agg_type
  ON sim_aggregations_inv (agg_type);

CREATE INDEX idx_sim_aggregations_inv_device_time
  ON sim_aggregations_inv (device_id, event_timestamp DESC);

CREATE INDEX idx_sim_aggregations_inv_device_time_type
  ON sim_aggregations_inv (device_id, agg_type, event_timestamp DESC);








