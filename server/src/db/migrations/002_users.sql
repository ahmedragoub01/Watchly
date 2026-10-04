CREATE TABLE users (
    id              TEXT PRIMARY KEY,          -- nanoid
    email           TEXT UNIQUE,
    display_name    TEXT NOT NULL,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
