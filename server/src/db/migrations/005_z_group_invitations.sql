CREATE TABLE group_invitations (
    id          BIGSERIAL PRIMARY KEY,
    group_id    TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id  TEXT NOT NULL REFERENCES users(id),
    invitee_id  TEXT NOT NULL REFERENCES users(id),
    status      TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_invitations_invitee ON group_invitations(invitee_id, status);
