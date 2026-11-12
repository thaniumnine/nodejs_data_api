-- BEGIN;

-- ALTER TABLE sim_aggregations_inv
-- ADD COLUMN device_ref_id BIGINT
--     CONSTRAINT fk_device_identity
--     REFERENCES sim_device_identifier(id);

-- UPDATE sim_aggregations_inv AS acu
-- SET device_ref_id = sdi.id
-- FROM sim_device_identifier AS sdi
-- WHERE acu.device_id = sdi.device_id;

-- ALTER TABLE sim_aggregations_inv
-- ALTER COLUMN device_ref_id SET NOT NULL;

-- COMMIT;


-- BEGIN;

-- ALTER TABLE sim_aggregations_inv
-- ADD COLUMN device_ref_id BIGINT
--     CONSTRAINT fk_device_identity
--     REFERENCES sim_device_identifier(id);

-- UPDATE sim_aggregations_inv AS acu
-- SET device_ref_id = sdi.id
-- FROM sim_device_identifier AS sdi
-- WHERE acu.device_id = sdi.device_id;



-- COMMIT;
-- BEGIN;

-- ALTER TABLE sim_aggregations_acu
-- DROP COLUMN IF EXISTS device_ref_id;

-- COMMIT;

-- ALTER TABLE sim_aggregations_acu
-- DROP CONSTRAINT device_simmtronics_acu_agg_ev_device_id_agg_type_event_time_key;

-- ALTER TABLE sim_aggregations_acu
-- ADD CONSTRAINT device_simmtronics_acu_agg_ev_device_ref_id_agg_type_event_time_key
-- UNIQUE (device_ref_id, agg_type, event_timestamp); 