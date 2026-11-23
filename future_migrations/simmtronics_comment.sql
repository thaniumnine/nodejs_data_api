CREATE TABLE sim_fdd_comment (
    id BIGSERIAL PRIMARY KEY,
    ticket_ref_id BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    comment TEXT NOT NULL,

    CONSTRAINT fk_sim_fdd_comment_ticket
        FOREIGN KEY (ticket_ref_id)
        REFERENCES sim_fdd_assignment(id)
);

CREATE INDEX idx_sim_fdd_comment_ticket_ref_id
    ON sim_fdd_comment (ticket_ref_id);
