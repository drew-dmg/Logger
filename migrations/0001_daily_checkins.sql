PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS daily_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    stress_score INTEGER CHECK (stress_score BETWEEN 1 AND 10),
    sleep_score INTEGER CHECK (sleep_score BETWEEN 1 AND 10),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);
