CREATE TABLE public.task_entries (
    task_id BIGINT NOT NULL
        REFERENCES public.tasks(id) ON DELETE CASCADE,

    assignment_id BIGINT NOT NULL
        REFERENCES public.sim_fdd_assignment(id) ON DELETE RESTRICT,

    PRIMARY KEY (task_id, assignment_id)
);