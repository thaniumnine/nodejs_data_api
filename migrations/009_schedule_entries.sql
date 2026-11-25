BEGIN;

CREATE TYPE public.schedule_entry_status AS ENUM (
    'Planned',
    'Completed',
    'Cancelled'
);

CREATE TABLE public.schedule_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id BIGINT NOT NULL,

    scheduled_time TIMESTAMPTZ NOT NULL,

    status public.schedule_entry_status
        NOT NULL DEFAULT 'Planned',

    is_locked BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_entries_task_time
ON public.schedule_entries (
    task_id,
    scheduled_time
);

CREATE INDEX idx_schedule_entries_scheduled_time
ON public.schedule_entries (scheduled_time);

CREATE FUNCTION public.set_schedule_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schedule_entries_updated_at
BEFORE UPDATE ON public.schedule_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_schedule_entries_updated_at();

COMMIT;