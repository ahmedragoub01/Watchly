CREATE TABLE friendships (
    id              BIGSERIAL PRIMARY KEY,
    requester_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_addressee ON friendships (addressee_id, status);
