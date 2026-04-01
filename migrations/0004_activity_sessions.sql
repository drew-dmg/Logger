PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS activity_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    app_name TEXT NOT NULL,
    session_minutes INTEGER NOT NULL CHECK (session_minutes >= 0),
    started_at TEXT,
    ended_at TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_sessions_date_app_name ON activity_sessions(date, app_name);
