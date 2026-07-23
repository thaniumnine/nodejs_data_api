DROP TABLE IF EXISTS device_metadata;

CREATE TABLE device_metadata (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    version TEXT,
    timestamp TIMESTAMPTZ,
    "system.location.site" TEXT,
    "system.location.section" TEXT,
    "system.location.room" TEXT,
    "system.location.floor" TEXT,
    "system.location.floor_seq" INTEGER,
    "system.location.position.x" INTEGER,
    "system.location.position.y" INTEGER,
    "system.location.position.z" INTEGER,
    "system.physical_tag.asset.guid" TEXT,
    "system.physical_tag.asset.site" TEXT,
    "system.physical_tag.asset.name" TEXT,
    "gateway.gateway_id" TEXT,
    "pointset" JSONB
);


CREATE INDEX idx_device_metadata_location ON device_metadata ("system.location.site", "system.location.floor");
CREATE INDEX idx_device_metadata_timestamp ON device_metadata ("timestamp");



