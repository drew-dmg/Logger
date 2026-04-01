import { FormEvent, useEffect, useMemo, useState } from 'react';

export type MigraineDetails = {
  start: string;
  end: string;
  severity: number;
  symptoms: string;
  triggers: string;
  medicationText: string;
  relief: string;
  note: string;
};

export type DailyCheckinValues = {
  mood: number;
  stress: number;
  energy: number;
  hasMigraine: boolean;
  caffeine: string;
  water: string;
  movement: string;
  medicationTaken: boolean;
  shortNote: string;
  migraineDetails: MigraineDetails;
};

type Props = {
  dateLabel: string;
  initialValues: DailyCheckinValues;
  isSaving?: boolean;
  onSave: (values: DailyCheckinValues) => Promise<void> | void;
};

const defaultMigraineDetails: MigraineDetails = {
  start: '',
  end: '',
  severity: 5,
  symptoms: '',
  triggers: '',
  medicationText: '',
  relief: '',
  note: '',
};

function SliderField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label htmlFor={id} style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontWeight: 600 }}>{label}: {value}</span>
      <input
        id={id}
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend style={{ fontWeight: 600, marginBottom: 8 }}>{label}</legend>
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={() => onChange(true)} aria-pressed={value}>
          Yes
        </button>
        <button type="button" onClick={() => onChange(false)} aria-pressed={!value}>
          No
        </button>
      </div>
    </fieldset>
  );
}

function MigraineDetailsSection({
  value,
  onChange,
}: {
  value: MigraineDetails;
  onChange: (next: MigraineDetails) => void;
}) {
  const set = (patch: Partial<MigraineDetails>) => onChange({ ...value, ...patch });

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Migraine details</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <label>
          Start
          <input type="datetime-local" value={value.start} onChange={(e) => set({ start: e.target.value })} />
        </label>
        <label>
          End
          <input type="datetime-local" value={value.end} onChange={(e) => set({ end: e.target.value })} />
        </label>
        <label>
          Severity: {value.severity}
          <input
            type="range"
            min={1}
            max={10}
            value={value.severity}
            onChange={(e) => set({ severity: Number(e.target.value) })}
          />
        </label>
        <label>
          Symptoms
          <input value={value.symptoms} onChange={(e) => set({ symptoms: e.target.value })} placeholder="e.g., aura, nausea" />
        </label>
        <label>
          Triggers
          <input value={value.triggers} onChange={(e) => set({ triggers: e.target.value })} placeholder="e.g., sleep loss" />
        </label>
        <label>
          Medication
          <input
            value={value.medicationText}
            onChange={(e) => set({ medicationText: e.target.value })}
            placeholder="what and when"
          />
        </label>
        <label>
          Relief
          <input value={value.relief} onChange={(e) => set({ relief: e.target.value })} placeholder="how much relief" />
        </label>
        <label>
          Migraine note
          <textarea value={value.note} onChange={(e) => set({ note: e.target.value })} rows={2} />
        </label>
      </div>
    </section>
  );
}

export const emptyDailyCheckinValues: DailyCheckinValues = {
  mood: 5,
  stress: 5,
  energy: 5,
  hasMigraine: false,
  caffeine: '',
  water: '',
  movement: '',
  medicationTaken: false,
  shortNote: '',
  migraineDetails: defaultMigraineDetails,
};

export default function DailyCheckinForm({ dateLabel, initialValues, isSaving = false, onSave }: Props) {
  const [values, setValues] = useState<DailyCheckinValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const canSave = useMemo(() => !isSaving, [isSaving]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(values);
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Today check-in ({dateLabel})</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <SliderField id="mood" label="Mood" value={values.mood} onChange={(mood) => setValues((v) => ({ ...v, mood }))} />
        <SliderField id="stress" label="Stress" value={values.stress} onChange={(stress) => setValues((v) => ({ ...v, stress }))} />
        <SliderField id="energy" label="Energy" value={values.energy} onChange={(energy) => setValues((v) => ({ ...v, energy }))} />

        <ToggleField
          label="Headache / Migraine"
          value={values.hasMigraine}
          onChange={(hasMigraine) => setValues((v) => ({ ...v, hasMigraine }))}
        />

        {values.hasMigraine ? (
          <MigraineDetailsSection
            value={values.migraineDetails}
            onChange={(migraineDetails) => setValues((v) => ({ ...v, migraineDetails }))}
          />
        ) : null}

        <label>
          Caffeine
          <input value={values.caffeine} onChange={(e) => setValues((v) => ({ ...v, caffeine: e.target.value }))} placeholder="e.g., 1 coffee" />
        </label>
        <label>
          Water
          <input value={values.water} onChange={(e) => setValues((v) => ({ ...v, water: e.target.value }))} placeholder="e.g., 2L" />
        </label>
        <label>
          Movement
          <input value={values.movement} onChange={(e) => setValues((v) => ({ ...v, movement: e.target.value }))} placeholder="walk, gym, stretch" />
        </label>

        <ToggleField
          label="Medication taken"
          value={values.medicationTaken}
          onChange={(medicationTaken) => setValues((v) => ({ ...v, medicationTaken }))}
        />

        <label>
          Short note
          <textarea value={values.shortNote} onChange={(e) => setValues((v) => ({ ...v, shortNote: e.target.value }))} rows={3} />
        </label>
      </div>

      <button
        type="submit"
        disabled={!canSave}
        style={{ fontSize: 16, fontWeight: 700, padding: '12px 16px', justifySelf: 'start' }}
      >
        {isSaving ? 'Saving…' : 'Save today\'s check-in'}
      </button>
    </form>
  );
}
