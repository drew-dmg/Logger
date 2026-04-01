import { useEffect, useMemo, useState } from 'react';
import DailyCheckinForm, {
  DailyCheckinValues,
  emptyDailyCheckinValues,
  MigraineDetails,
} from '../components/checkin/DailyCheckinForm';

type DailyCheckinRow = {
  id: string;
  checkin_date: string;
  mood: number;
  stress: number;
  energy: number;
  has_migraine: boolean;
  caffeine: string;
  water: string;
  movement: string;
  medication_taken: boolean;
  short_note: string;
  migraine_event_id: string | null;
};

type MigraineEventRow = {
  id: string;
  checkin_date: string;
  start: string;
  end: string;
  severity: number;
  symptoms: string;
  triggers: string;
  medication_text: string;
  relief: string;
  note: string;
  archived_at: string | null;
};

type DataClient = {
  getDailyCheckinByDate: (date: string) => Promise<DailyCheckinRow | null>;
  getMigraineEventById: (id: string) => Promise<MigraineEventRow | null>;
  upsertDailyCheckin: (payload: Omit<DailyCheckinRow, 'id'> & { id?: string }) => Promise<DailyCheckinRow>;
  upsertMigraineEvent: (payload: Omit<MigraineEventRow, 'id'> & { id?: string }) => Promise<MigraineEventRow>;
  archiveMigraineEvent: (id: string) => Promise<void>;
};

const DAILY_KEY = 'daily_checkins';
const MIGRAINE_KEY = 'migraine_events';

const localDataClient: DataClient = {
  async getDailyCheckinByDate(date) {
    const rows = loadRows<DailyCheckinRow>(DAILY_KEY);
    return rows.find((row) => row.checkin_date === date) ?? null;
  },
  async getMigraineEventById(id) {
    const rows = loadRows<MigraineEventRow>(MIGRAINE_KEY);
    return rows.find((row) => row.id === id) ?? null;
  },
  async upsertDailyCheckin(payload) {
    const rows = loadRows<DailyCheckinRow>(DAILY_KEY);
    const id = payload.id ?? crypto.randomUUID();
    const next: DailyCheckinRow = { ...payload, id };
    const index = rows.findIndex((row) => row.id === id || row.checkin_date === payload.checkin_date);
    if (index >= 0) rows[index] = next;
    else rows.push(next);
    saveRows(DAILY_KEY, rows);
    return next;
  },
  async upsertMigraineEvent(payload) {
    const rows = loadRows<MigraineEventRow>(MIGRAINE_KEY);
    const id = payload.id ?? crypto.randomUUID();
    const next: MigraineEventRow = { ...payload, id };
    const index = rows.findIndex((row) => row.id === id || row.checkin_date === payload.checkin_date);
    if (index >= 0) rows[index] = next;
    else rows.push(next);
    saveRows(MIGRAINE_KEY, rows);
    return next;
  },
  async archiveMigraineEvent(id) {
    const rows = loadRows<MigraineEventRow>(MIGRAINE_KEY);
    const index = rows.findIndex((row) => row.id === id);
    if (index >= 0) {
      rows[index] = { ...rows[index], archived_at: new Date().toISOString() };
      saveRows(MIGRAINE_KEY, rows);
    }
  },
};

function loadRows<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function saveRows<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

function mapMigraineRowToDetails(row: MigraineEventRow | null): MigraineDetails {
  if (!row) return emptyDailyCheckinValues.migraineDetails;
  return {
    start: row.start,
    end: row.end,
    severity: row.severity,
    symptoms: row.symptoms,
    triggers: row.triggers,
    medicationText: row.medication_text,
    relief: row.relief,
    note: row.note,
  };
}

function mapCheckinToValues(checkin: DailyCheckinRow, migraine: MigraineEventRow | null): DailyCheckinValues {
  return {
    mood: checkin.mood,
    stress: checkin.stress,
    energy: checkin.energy,
    hasMigraine: checkin.has_migraine,
    caffeine: checkin.caffeine,
    water: checkin.water,
    movement: checkin.movement,
    medicationTaken: checkin.medication_taken,
    shortNote: checkin.short_note,
    migraineDetails: mapMigraineRowToDetails(migraine),
  };
}

export default function TodayPage({ dataClient = localDataClient }: { dataClient?: DataClient }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [migraineEventId, setMigraineEventId] = useState<string | null>(null);
  const [values, setValues] = useState<DailyCheckinValues>(emptyDailyCheckinValues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      const checkin = await dataClient.getDailyCheckinByDate(today);
      if (!mounted) return;

      if (!checkin) {
        setValues(emptyDailyCheckinValues);
        setCheckinId(null);
        setMigraineEventId(null);
        setIsLoading(false);
        return;
      }

      const migraine = checkin.migraine_event_id
        ? await dataClient.getMigraineEventById(checkin.migraine_event_id)
        : null;

      if (!mounted) return;
      setValues(mapCheckinToValues(checkin, migraine));
      setCheckinId(checkin.id);
      setMigraineEventId(checkin.migraine_event_id);
      setIsLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [dataClient, today]);

  const handleSave = async (next: DailyCheckinValues) => {
    setIsSaving(true);
    setStatus('');

    try {
      let nextMigraineEventId = migraineEventId;

      if (next.hasMigraine) {
        const migraine = await dataClient.upsertMigraineEvent({
          id: migraineEventId ?? undefined,
          checkin_date: today,
          start: next.migraineDetails.start,
          end: next.migraineDetails.end,
          severity: next.migraineDetails.severity,
          symptoms: next.migraineDetails.symptoms,
          triggers: next.migraineDetails.triggers,
          medication_text: next.migraineDetails.medicationText,
          relief: next.migraineDetails.relief,
          note: next.migraineDetails.note,
          archived_at: null,
        });
        nextMigraineEventId = migraine.id;
        setMigraineEventId(migraine.id);
      } else if (migraineEventId) {
        // Archive policy for disabled migraine toggle.
        await dataClient.archiveMigraineEvent(migraineEventId);
        nextMigraineEventId = null;
        setMigraineEventId(null);
      }

      const checkin = await dataClient.upsertDailyCheckin({
        id: checkinId ?? undefined,
        checkin_date: today,
        mood: next.mood,
        stress: next.stress,
        energy: next.energy,
        has_migraine: next.hasMigraine,
        caffeine: next.caffeine,
        water: next.water,
        movement: next.movement,
        medication_taken: next.medicationTaken,
        short_note: next.shortNote,
        migraine_event_id: nextMigraineEventId,
      });

      setCheckinId(checkin.id);
      setValues(next);
      setStatus('Saved');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 860, margin: '0 auto', display: 'grid', gap: 16 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <article style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Activity summary</h3>
          <p style={{ marginBottom: 0 }}>No activity data yet.</p>
        </article>
        <article style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Calendar summary</h3>
          <p style={{ marginBottom: 0 }}>No calendar events synced.</p>
        </article>
        <article style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Weather summary</h3>
          <p style={{ marginBottom: 0 }}>Weather unavailable.</p>
        </article>
      </section>

      {isLoading ? (
        <p>Loading today&apos;s check-in…</p>
      ) : (
        <DailyCheckinForm
          dateLabel={today}
          initialValues={values}
          isSaving={isSaving}
          onSave={handleSave}
        />
      )}

      {status ? <p aria-live="polite">{status}</p> : null}
    </main>
  );
}
