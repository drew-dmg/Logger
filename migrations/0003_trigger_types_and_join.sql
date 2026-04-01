PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS trigger_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS migraine_event_triggers (
    migraine_event_id INTEGER NOT NULL,
    trigger_type_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (migraine_event_id, trigger_type_id),
    FOREIGN KEY (migraine_event_id) REFERENCES migraine_events(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    FOREIGN KEY (trigger_type_id) REFERENCES trigger_types(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_migraine_event_triggers_event_id ON migraine_event_triggers(migraine_event_id);
CREATE INDEX IF NOT EXISTS idx_migraine_event_triggers_trigger_id ON migraine_event_triggers(trigger_type_id);
