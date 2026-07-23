

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