CREATE TABLE IF NOT EXISTS reactions (
    id              BIGSERIAL PRIMARY KEY,
    room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_name     TEXT NOT NULL,
    sender_session  TEXT,
    sender_user_id  TEXT,
    emoji           TEXT NOT NULL,
    video_timestamp REAL NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_room_ts ON reactions (room_id, video_timestamp);
