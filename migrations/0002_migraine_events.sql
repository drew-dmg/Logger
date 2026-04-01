PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS migraine_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_checkin_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10),
    duration_minutes INTEGER,
    aura_present INTEGER NOT NULL DEFAULT 0 CHECK (aura_present IN (0, 1)),
    medication_taken TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(daily_checkin_id),
    FOREIGN KEY (daily_checkin_id) REFERENCES daily_checkins(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_migraine_events_daily_checkin_id ON migraine_events(daily_checkin_id);
CREATE INDEX IF NOT EXISTS idx_migraine_events_date ON migraine_events(date);
