CREATE TABLE public.api_audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    user_id UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE RESTRICT,

    org_ref_id BIGINT NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE RESTRICT,

    action TEXT NOT NULL,

    action_info JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_api_audit_logs_user_id
ON public.api_audit_logs(user_id);

CREATE INDEX idx_api_audit_logs_org_timestamp
ON public.api_audit_logs(org_ref_id, timestamp);