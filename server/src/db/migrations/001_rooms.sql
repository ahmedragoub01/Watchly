CREATE TABLE IF NOT EXISTS rooms (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    host_session_id TEXT NOT NULL,
    video_url       TEXT,
    video_provider  TEXT,
    video_title     TEXT,
    status          TEXT NOT NULL DEFAULT 'waiting',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms (status);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms (created_at);
