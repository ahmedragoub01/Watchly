CREATE TABLE friend_watchlist_items (
    id              BIGSERIAL PRIMARY KEY,
    friendship_id   BIGINT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
    added_by_id     TEXT NOT NULL REFERENCES users(id),
    video_url       TEXT NOT NULL,
    video_provider  TEXT NOT NULL,
    video_title     TEXT NOT NULL,
    thumbnail_url   TEXT,
    status          TEXT NOT NULL DEFAULT 'unwatched',  -- 'unwatched' | 'watched'
    watched_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_friend_watchlist ON friend_watchlist_items (friendship_id, status);
