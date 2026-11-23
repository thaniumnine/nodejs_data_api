CREATE TABLE sim_fdd_assignment (
    id BIGSERIAL PRIMARY KEY,
    fdd_out_id BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    firebase_user_id TEXT NOT NULL,

    CONSTRAINT fk_sim_fdd_assignment_fdd_out
        FOREIGN KEY (fdd_out_id)
        REFERENCES sim_fdd_history(id)
);

CREATE INDEX idx_sim_fdd_assignment_fdd_out_id
    ON sim_fdd_assignment (fdd_out_id);
