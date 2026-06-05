-- //auto_idx device_id   timestamp     json_type               json   
-- //    1       acu_01       23/05/2026    metadata          metadata.json 
-- //   2       acu_01       23/05/2026    pointset          pointset.json 

DROP TABLE IF EXISTS device_history;

CREATE TABLE device_history (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    json_type TEXT NOT NULL,
    version TEXT,
    points JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_history_timestamp ON device_metadata ("timestamp");

