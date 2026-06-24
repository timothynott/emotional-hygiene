import { migrateAll, type CheckInRecord, type Draft } from '../domain/check-in.js'

const K = {
  records:    'eh:records',
  draft:      'eh:draft',
  settings:   'eh:settings',
  quarantine: 'eh:quarantine',
} as const

export interface Settings {
  discardConfirm: boolean
  stride: 'day' | 'week'
}

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v != null ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function loadRecords(): CheckInRecord[] {
  const raw = read<unknown[]>(K.records, [])
  const { live, quarantined, changed } = migrateAll(raw)
  if (changed) {
    write(K.records, live)
    write(K.quarantine, [...read<unknown[]>(K.quarantine, []), ...quarantined])
  }
  return live.sort((a, b) => a.ts.localeCompare(b.ts))
}

export function saveRecords(records: CheckInRecord[]): void {
  write(K.records, records)
}

export function loadDraft(): Draft | null {
  return read<Draft | null>(K.draft, null)
}

export function saveDraft(draft: Draft): void {
  write(K.draft, draft)
}

export function clearDraft(): void {
  localStorage.removeItem(K.draft)
}

export function loadSettings(): Settings {
  return { discardConfirm: true, stride: 'day', ...read<Partial<Settings>>(K.settings, {}) }
}

export function saveSettings(settings: Settings): void {
  write(K.settings, settings)
}
