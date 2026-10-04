CREATE TABLE party_replays (
    id              BIGSERIAL PRIMARY KEY,
    room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    duration_secs   INTEGER,
    participant_names TEXT[] NOT NULL DEFAULT '{}',
    reaction_count  INTEGER NOT NULL DEFAULT 0,
    message_count   INTEGER NOT NULL DEFAULT 0,
    peak_moment_ts  REAL,
    peak_moment_emoji TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (room_id)
);
