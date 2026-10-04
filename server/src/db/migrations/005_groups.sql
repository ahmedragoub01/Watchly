CREATE TABLE groups (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    owner_id    TEXT NOT NULL REFERENCES users(id),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    group_id    TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id),
    role        TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE group_watchlist_items (
    id              BIGSERIAL PRIMARY KEY,
    group_id        TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    added_by_id     TEXT NOT NULL REFERENCES users(id),
    video_url       TEXT NOT NULL,
    video_provider  TEXT NOT NULL,
    video_title     TEXT NOT NULL,
    thumbnail_url   TEXT,
    status          TEXT NOT NULL DEFAULT 'unwatched',
    watched_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_watchlist_votes (
    item_id     BIGINT NOT NULL REFERENCES group_watchlist_items(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id),
    vote        SMALLINT NOT NULL, -- 1 for upvote, -1 for downvote
    PRIMARY KEY (item_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_watchlist_group ON group_watchlist_items(group_id, status);
