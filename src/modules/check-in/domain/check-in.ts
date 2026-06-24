// ════════════════════════════════════════════════════════════════════════
//  check-in.ts
//  Pure domain logic for the mood instrument. No React, no storage, no
//  clock reads — all passed in from outside. Deterministic and side-effect
//  free; unit-tested in check-in.test.ts.
// ════════════════════════════════════════════════════════════════════════

export const RESET_THRESHOLD = 2 // score <= this expands the reset fields

export const KIND = {
  MORNING: 'morning',
  MIDDAY:  'midday',
  EVENING: 'evening',
  RESET:   'reset',
} as const

export type Kind = typeof KIND[keyof typeof KIND]

// ── core domain types ────────────────────────────────────────────────────

export interface Draft {
  id: string
  kind: Kind
  date: string
  score: number | null
  // kind-specific fields, populated as the form is filled
  first?: string    // morning: first action
  note?: string     // midday: light note
  what?: string     // midday (expanded) | reset: what happened
  body?: string     // midday (expanded) | reset: body sensation
  step?: string     // midday (expanded) | reset: reframe / next step
  went?: string     // evening: how the day went
  tomorrow?: string // evening | morning: tomorrow's first action
}

export interface Revision {
  at: string
  prior: Omit<CheckInRecord, 'revisions'>
}

export interface CheckInRecord {
  id: string
  kind: Kind
  date: string
  score: number
  ts: string         // original creation timestamp; never overwritten on edit
  editedTs?: string
  revisions: Revision[]
  v: number
  first?: string
  note?: string
  what?: string
  body?: string
  step?: string
  went?: string
  tomorrow?: string
}

// ── draft lifecycle ──────────────────────────────────────────────────────

export function makeDraft(args: { id: string; kind: Kind; date: string }): Draft {
  return { ...args, score: null }
}

// The one invariant: a check-in cannot be logged without a score.
export function canCommit(entry: Draft | CheckInRecord | null | undefined): boolean {
  return entry != null && entry.score != null
}

// Whether the midday scan should expand into the reset fields.
export function showsResetFields(entry: Draft | CheckInRecord | null | undefined): boolean {
  if (entry == null) return false
  if (entry.kind === KIND.RESET) return true
  return entry.kind === KIND.MIDDAY && entry.score != null && entry.score <= RESET_THRESHOLD
}

// Apply a field change to an entry, returning a NEW entry (immutability).
export function applyChange<T extends Draft>(entry: T, patch: Partial<T>): T {
  return { ...entry, ...patch }
}

// Commit a draft into a record. Pure: caller supplies the timestamp.
// Throws if the invariant is unmet.
export function commitDraft(draft: Draft, ts: string): CheckInRecord {
  if (!canCommit(draft)) {
    throw new Error('A check-in cannot be logged without a score.')
  }
  return { ...(draft as Draft & { score: number }), ts, revisions: [], v: CURRENT_SCHEMA }
}

// Produce an edited record: stores the prior state as a revision.
export function applyEdit(
  record: CheckInRecord,
  patch: Partial<Omit<CheckInRecord, 'id' | 'ts' | 'revisions' | 'v'>>,
  ts: string,
): CheckInRecord {
  const { revisions: _, ...prior } = record
  return {
    ...record,
    ...patch,
    ts: record.ts,
    editedTs: ts,
    revisions: [...(record.revisions ?? []), { at: ts, prior }],
  }
}

export function isEdited(record: CheckInRecord): boolean {
  return Array.isArray(record.revisions) && record.revisions.length > 0
}

// Which check-in the clock suggests. Hour passed in — no internal Date read.
export function suggestedKind(hour: number): Kind {
  if (hour < 11) return KIND.MORNING
  if (hour < 17) return KIND.MIDDAY
  return KIND.EVENING
}

// ════════════════════════════════════════════════════════════════════════
//  SCHEMA VERSIONING & MIGRATION
// ════════════════════════════════════════════════════════════════════════

export const CURRENT_SCHEMA = 1

export type MigrationFn = (record: CheckInRecord) => CheckInRecord
export const MIGRATIONS: Record<number, MigrationFn> = {
  // 1: (rec) => ({ ...rec, /* shape change */, v: 2 }),
}

export function stampSchema(record: CheckInRecord): CheckInRecord {
  return { ...record, v: CURRENT_SCHEMA }
}

export function recordVersion(record: unknown): number {
  const r = record as { v?: unknown }
  return typeof r?.v === 'number' ? r.v : 1
}

export type MigrateResult =
  | { status: 'ok'; record: CheckInRecord }
  | { status: 'quarantine'; record: unknown; reason: string }

export function migrateRecord(record: unknown): MigrateResult {
  let v = recordVersion(record)

  if (v > CURRENT_SCHEMA) {
    return { status: 'quarantine', record, reason: `version ${v} newer than app (${CURRENT_SCHEMA})` }
  }

  let cur = { ...(record as CheckInRecord), v }
  while (v < CURRENT_SCHEMA) {
    const step = MIGRATIONS[v]
    if (typeof step !== 'function') {
      return { status: 'quarantine', record, reason: `no migration from v${v}` }
    }
    try {
      cur = step(cur)
      if (recordVersion(cur) !== v + 1) {
        return { status: 'quarantine', record, reason: `migration v${v} did not advance version` }
      }
      v = recordVersion(cur)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { status: 'quarantine', record, reason: `migration v${v} threw: ${msg}` }
    }
  }
  return { status: 'ok', record: cur }
}

export interface MigrateAllResult {
  live: CheckInRecord[]
  quarantined: Array<{ record: unknown; reason: string; at: null }>
  changed: boolean
}

export function migrateAll(records: unknown[]): MigrateAllResult {
  const live: CheckInRecord[] = []
  const quarantined: Array<{ record: unknown; reason: string; at: null }> = []
  let changed = false
  for (const r of records ?? []) {
    const res = migrateRecord(r)
    if (res.status === 'ok') {
      live.push(res.record)
      if (res.record !== r && recordVersion(r) !== CURRENT_SCHEMA) changed = true
    } else {
      quarantined.push({ record: res.record, reason: res.reason, at: null })
      changed = true
    }
  }
  return { live, quarantined, changed }
}

// ════════════════════════════════════════════════════════════════════════
//  STORAGE MODE DECISION (kept for test coverage; web app always uses
//  localStorage and never calls these at runtime)
// ════════════════════════════════════════════════════════════════════════

export const STORAGE_MODE = { PERSISTENT: 'persistent', EPHEMERAL: 'ephemeral' } as const
export type StorageMode = typeof STORAGE_MODE[keyof typeof STORAGE_MODE]

export function decideStorageMode(sentinelWritten: string, valueReadBack: unknown): StorageMode {
  return valueReadBack === sentinelWritten ? STORAGE_MODE.PERSISTENT : STORAGE_MODE.EPHEMERAL
}

// ════════════════════════════════════════════════════════════════════════
//  HISTORY NAVIGATION (pure, date-string based: "YYYY-MM-DD")
// ════════════════════════════════════════════════════════════════════════

export const STRIDE = { DAY: 'day', WEEK: 'week' } as const
export type Stride = typeof STRIDE[keyof typeof STRIDE]

export function entryDates(records: CheckInRecord[]): string[] {
  const set = new Set((records ?? []).map((r) => r.date))
  return [...set].sort().reverse()
}

export function recordsForDate(records: CheckInRecord[], date: string): CheckInRecord[] {
  return (records ?? []).filter((r) => r.date === date).sort((a, b) => a.ts.localeCompare(b.ts))
}

export function weekStart(date: string): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function windowDates(records: CheckInRecord[], anchor: string, stride: Stride): string[] {
  const all = entryDates(records)
  if (stride === STRIDE.DAY) return all.filter((d) => d === anchor)
  const ws = weekStart(anchor)
  const we = addDays(ws, 6)
  return all.filter((d) => d >= ws && d <= we)
}

export function stepAnchor(
  records: CheckInRecord[],
  anchor: string,
  stride: Stride,
  dir: -1 | 1,
): string | null {
  const all = entryDates(records)
  if (!all.length) return null
  if (stride === STRIDE.DAY) {
    const idx = all.indexOf(anchor)
    if (idx === -1) {
      if (dir < 0) return all.find((d) => d < anchor) ?? null
      const newer = all.filter((d) => d > anchor)
      return newer.length ? newer[newer.length - 1] : null
    }
    const ni = dir < 0 ? idx + 1 : idx - 1
    return ni >= 0 && ni < all.length ? all[ni] : null
  }
  const curWs = weekStart(anchor)
  const candidates = dir < 0
    ? all.filter((d) => weekStart(d) < curWs)
    : all.filter((d) => weekStart(d) > curWs)
  if (!candidates.length) return null
  return dir < 0 ? candidates[0] : candidates[candidates.length - 1]
}

export function defaultAnchor(records: CheckInRecord[], todayStr: string): string {
  return entryDates(records)[0] ?? todayStr
}
