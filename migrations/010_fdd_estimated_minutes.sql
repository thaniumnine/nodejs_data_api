ALTER TABLE public.sim_fdd_history
ADD COLUMN estimated_minutes INTEGER
CHECK (estimated_minutes >= 0);