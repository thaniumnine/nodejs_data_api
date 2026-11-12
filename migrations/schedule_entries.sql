BEGIN;

CREATE TYPE public.schedule_entry_status AS ENUM (
    'Planned',
    'Completed',
    'Cancelled'
);

CREATE TABLE public.schedule_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fdd_assignment_id BIGINT NOT NULL,

    scheduled_date DATE NOT NULL,

    scheduled_minutes INTEGER NOT NULL
        CHECK (scheduled_minutes > 0),

    status public.schedule_entry_status
        NOT NULL DEFAULT 'Planned',

    is_locked BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_schedule_entries_fdd_assignment
        FOREIGN KEY (fdd_assignment_id)
        REFERENCES public.sim_fdd_assignment(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_schedule_entries_assignment_date
ON public.schedule_entries (
    fdd_assignment_id,
    scheduled_date
);

-- Automatically update updated_at whenever a row changes.
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
