#[derive(Debug, Clone)]
pub struct DailyCheckin {
    pub id: i64,
    pub date: String,
    pub mood_score: Option<i64>,
    pub stress_score: Option<i64>,
    pub sleep_score: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MigraineEvent {
    pub id: i64,
    pub daily_checkin_id: i64,
    pub date: String,
    pub pain_level: Option<i64>,
    pub duration_minutes: Option<i64>,
    pub aura_present: bool,
    pub medication_taken: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CalendarSummary {
    pub date: String,
    pub summary_json: String,
    pub source: Option<String>,
}

#[derive(Debug, Clone)]
pub struct WeatherDaily {
    pub date: String,
    pub summary_json: String,
    pub source: Option<String>,
}

#[derive(Debug, Clone)]
pub struct UpsertCheckinInput {
    pub mood_score: Option<i64>,
    pub stress_score: Option<i64>,
    pub sleep_score: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct UpsertMigraineEventInput {
    pub pain_level: Option<i64>,
    pub duration_minutes: Option<i64>,
    pub aura_present: bool,
    pub medication_taken: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CheckinWithMigraine {
    pub checkin: DailyCheckin,
    pub migraine_event: Option<MigraineEvent>,
}
