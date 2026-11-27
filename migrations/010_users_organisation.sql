ALTER TABLE public.users
ADD COLUMN org_ref_ids BIGINT[] NOT NULL DEFAULT '{}';