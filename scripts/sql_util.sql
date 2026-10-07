

-- SELECT *
-- FROM public.device_history dh
-- JOIN public.device_identifier di
--     ON dh.device_ref_id = di.id
-- WHERE dh.timestamp > '2025-06-01T00:00:00Z'::timestamptz
--   AND di.device_id LIKE 'MTS-%'
-- ORDER BY dh.id DESC
-- LIMIT 100




-- SELECT * FROM public.device_identifier
-- where device_id like 'MTS-%'
-- and level = 'Level-01'
-- ;


-- SELECT * FROM public.device_history dh
-- JOIN public.device_identifier di
--     ON dh.device_ref_id = di.id
-- WHERE dh.timestamp BETWEEN
--     '2026-05-11 14:24:37+00'
-- AND
--     '2026-05-11 15:00:37+00'
--   AND di.device_id LIKE 'LAC-%'
-- ORDER BY dh.timestamp DESC



-- DELETE FROM public.device_history dh
-- USING public.device_identifier di
-- WHERE dh.device_ref_id = di.id
--   AND di.device_id LIKE 'LCM-%';


-- ALTER TABLE IF EXISTS  device_history  RENAME TO sim_device_history
-- ALTER TABLE IF EXISTS  device_identifier  RENAME TO sim_device_identifier


-- ALTER TABLE IF EXISTS  aggregation  RENAME TO sim_device_type_aggregation
-- ALTER TABLE IF EXISTS  device_simmtronics_acu_agg_events  RENAME TO sim_aggregations_acu
-- ALTER TABLE IF EXISTS  device_simmtronics_mts_agg_events  RENAME TO sim_aggregations_mts
ALTER TABLE IF EXISTS  device_simmtronics_lt_agg_events  RENAME TO sim_aggregations_lt
ALTER TABLE IF EXISTS  device_simmtronics_qse_agg_events  RENAME TO sim_aggregations_qse
ALTER TABLE IF EXISTS  device_simmtronics_inv_agg_events  RENAME TO sim_aggregations_inv