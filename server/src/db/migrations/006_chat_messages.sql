CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_name     TEXT NOT NULL,
    sender_session  TEXT,
    sender_user_id  TEXT,
    content         TEXT NOT NULL,
    video_timestamp REAL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_room_created ON chat_messages (room_id, created_at);
