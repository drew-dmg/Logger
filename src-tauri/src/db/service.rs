use rusqlite::{params, Connection, OptionalExtension};

use super::{
    error::{DbError, DbResult},
    models::{
        CalendarSummary, CheckinWithMigraine, DailyCheckin, MigraineEvent, UpsertCheckinInput,
        UpsertMigraineEventInput, WeatherDaily,
    },
};

/// Centralized SQLite service for Tauri command handlers.
///
/// This uses Rust-side SQLite access so command handlers can keep working even when
/// external integrations fail (via explicit non-blocking `DbError` variants).
pub struct DatabaseService {
    conn: Connection,
}

impl DatabaseService {
    pub fn new(db_path: &str) -> DbResult<Self> {
        let conn = Connection::open(db_path).map_err(|err| DbError::Storage {
            message: format!("Failed to open SQLite DB: {err}"),
        })?;

        conn.pragma_update(None, "foreign_keys", "ON")
            .map_err(|err| DbError::Storage {
                message: format!("Failed to enable foreign keys: {err}"),
            })?;

        Ok(Self { conn })
    }

    pub fn upsert_today_checkin_by_date(
        &self,
        date: &str,
        input: UpsertCheckinInput,
    ) -> DbResult<DailyCheckin> {
        self.validate_score(input.mood_score, "mood_score")?;
        self.validate_score(input.stress_score, "stress_score")?;
        self.validate_score(input.sleep_score, "sleep_score")?;

        self.conn
            .execute(
                "
                INSERT INTO daily_checkins (date, mood_score, stress_score, sleep_score, notes)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ON CONFLICT(date) DO UPDATE SET
                    mood_score = excluded.mood_score,
                    stress_score = excluded.stress_score,
                    sleep_score = excluded.sleep_score,
                    notes = excluded.notes,
                    updated_at = datetime('now')
                ",
                params![
                    date,
                    input.mood_score,
                    input.stress_score,
                    input.sleep_score,
                    input.notes
                ],
            )
            .map_err(|err| DbError::Storage {
                message: format!("Failed to upsert daily check-in: {err}"),
            })?;

        self.get_checkin_by_date(date)?.ok_or(DbError::Storage {
            message: format!("Check-in for date {date} was not found after upsert"),
        })
    }

    pub fn create_or_update_linked_migraine_event(
        &self,
        daily_checkin_id: i64,
        date: &str,
        input: UpsertMigraineEventInput,
    ) -> DbResult<MigraineEvent> {
        self.validate_score(input.pain_level, "pain_level")?;

        self.conn
            .execute(
                "
                INSERT INTO migraine_events (
                    daily_checkin_id, date, pain_level, duration_minutes, aura_present, medication_taken, notes
                )
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                ON CONFLICT(daily_checkin_id) DO UPDATE SET
                    date = excluded.date,
                    pain_level = excluded.pain_level,
                    duration_minutes = excluded.duration_minutes,
                    aura_present = excluded.aura_present,
                    medication_taken = excluded.medication_taken,
                    notes = excluded.notes,
                    updated_at = datetime('now')
                ",
                params![
                    daily_checkin_id,
                    date,
                    input.pain_level,
                    input.duration_minutes,
                    input.aura_present,
                    input.medication_taken,
                    input.notes
                ],
            )
            .map_err(|err| DbError::Storage {
                message: format!("Failed to upsert migraine event: {err}"),
            })?;

        self.get_migraine_event_by_checkin_id(daily_checkin_id)?
            .ok_or(DbError::Storage {
                message: format!(
                    "Migraine event for daily_checkin_id {daily_checkin_id} was not found after upsert"
                ),
            })
    }

    pub fn fetch_recent_checkins_and_migraine_events(
        &self,
        limit: usize,
    ) -> DbResult<Vec<CheckinWithMigraine>> {
        let mut stmt = self
            .conn
            .prepare(
                "
                SELECT
                    dc.id,
                    dc.date,
                    dc.mood_score,
                    dc.stress_score,
                    dc.sleep_score,
                    dc.notes,
                    me.id,
                    me.date,
                    me.pain_level,
                    me.duration_minutes,
                    me.aura_present,
                    me.medication_taken,
                    me.notes
                FROM daily_checkins dc
                LEFT JOIN migraine_events me ON me.daily_checkin_id = dc.id
                ORDER BY dc.date DESC
                LIMIT ?1
                ",
            )
            .map_err(|err| DbError::Storage {
                message: format!("Failed to prepare recent check-ins query: {err}"),
            })?;

        let rows = stmt
            .query_map(params![limit as i64], |row| {
                let checkin = DailyCheckin {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    mood_score: row.get(2)?,
                    stress_score: row.get(3)?,
                    sleep_score: row.get(4)?,
                    notes: row.get(5)?,
                };

                let migraine_event = match row.get::<_, Option<i64>>(6)? {
                    Some(event_id) => Some(MigraineEvent {
                        id: event_id,
                        daily_checkin_id: checkin.id,
                        date: row.get(7)?,
                        pain_level: row.get(8)?,
                        duration_minutes: row.get(9)?,
                        aura_present: row.get::<_, i64>(10)? == 1,
                        medication_taken: row.get(11)?,
                        notes: row.get(12)?,
                    }),
                    None => None,
                };

                Ok(CheckinWithMigraine {
                    checkin,
                    migraine_event,
                })
            })
            .map_err(|err| DbError::Storage {
                message: format!("Failed to execute recent check-ins query: {err}"),
            })?;

        rows.collect::<Result<Vec<_>, _>>().map_err(|err| DbError::Storage {
            message: format!("Failed to map recent check-ins query rows: {err}"),
        })
    }

    pub fn save_calendar_summary(&self, item: CalendarSummary) -> DbResult<()> {
        self.conn
            .execute(
                "
                INSERT INTO calendar_summaries (date, summary_json, source)
                VALUES (?1, ?2, ?3)
                ON CONFLICT(date) DO UPDATE SET
                    summary_json = excluded.summary_json,
                    source = excluded.source,
                    updated_at = datetime('now')
                ",
                params![item.date, item.summary_json, item.source],
            )
            .map_err(|err| DbError::Storage {
                message: format!("Failed to save calendar summary: {err}"),
            })?;

        Ok(())
    }

    pub fn get_calendar_summary(&self, date: &str) -> DbResult<Option<CalendarSummary>> {
        self.conn
            .query_row(
                "SELECT date, summary_json, source FROM calendar_summaries WHERE date = ?1",
                params![date],
                |row| {
                    Ok(CalendarSummary {
                        date: row.get(0)?,
                        summary_json: row.get(1)?,
                        source: row.get(2)?,
                    })
                },
            )
            .optional()
            .map_err(|err| DbError::Storage {
                message: format!("Failed to get calendar summary: {err}"),
            })
    }

    pub fn save_weather_daily(&self, item: WeatherDaily) -> DbResult<()> {
        self.conn
            .execute(
                "
                INSERT INTO weather_daily (date, summary_json, source)
                VALUES (?1, ?2, ?3)
                ON CONFLICT(date) DO UPDATE SET
                    summary_json = excluded.summary_json,
                    source = excluded.source,
                    updated_at = datetime('now')
                ",
                params![item.date, item.summary_json, item.source],
            )
            .map_err(|err| DbError::Storage {
                message: format!("Failed to save weather summary: {err}"),
            })?;

        Ok(())
    }

    pub fn get_weather_daily(&self, date: &str) -> DbResult<Option<WeatherDaily>> {
        self.conn
            .query_row(
                "SELECT date, summary_json, source FROM weather_daily WHERE date = ?1",
                params![date],
                |row| {
                    Ok(WeatherDaily {
                        date: row.get(0)?,
                        summary_json: row.get(1)?,
                        source: row.get(2)?,
                    })
                },
            )
            .optional()
            .map_err(|err| DbError::Storage {
                message: format!("Failed to get weather summary: {err}"),
            })
    }

    fn get_checkin_by_date(&self, date: &str) -> DbResult<Option<DailyCheckin>> {
        self.conn
            .query_row(
                "
                SELECT id, date, mood_score, stress_score, sleep_score, notes
                FROM daily_checkins
                WHERE date = ?1
                ",
                params![date],
                |row| {
                    Ok(DailyCheckin {
                        id: row.get(0)?,
                        date: row.get(1)?,
                        mood_score: row.get(2)?,
                        stress_score: row.get(3)?,
                        sleep_score: row.get(4)?,
                        notes: row.get(5)?,
                    })
                },
            )
            .optional()
            .map_err(|err| DbError::Storage {
                message: format!("Failed to get check-in by date: {err}"),
            })
    }

    fn get_migraine_event_by_checkin_id(&self, daily_checkin_id: i64) -> DbResult<Option<MigraineEvent>> {
        self.conn
            .query_row(
                "
                SELECT id, daily_checkin_id, date, pain_level, duration_minutes, aura_present, medication_taken, notes
                FROM migraine_events
                WHERE daily_checkin_id = ?1
                ",
                params![daily_checkin_id],
                |row| {
                    Ok(MigraineEvent {
                        id: row.get(0)?,
                        daily_checkin_id: row.get(1)?,
                        date: row.get(2)?,
                        pain_level: row.get(3)?,
                        duration_minutes: row.get(4)?,
                        aura_present: row.get::<_, i64>(5)? == 1,
                        medication_taken: row.get(6)?,
                        notes: row.get(7)?,
                    })
                },
            )
            .optional()
            .map_err(|err| DbError::Storage {
                message: format!("Failed to get migraine event by daily_checkin_id: {err}"),
            })
    }

    fn validate_score(&self, score: Option<i64>, field: &str) -> DbResult<()> {
        if let Some(score) = score {
            if !(1..=10).contains(&score) {
                return Err(DbError::Validation {
                    message: format!("{field} must be between 1 and 10"),
                });
            }
        }

        Ok(())
    }
}
