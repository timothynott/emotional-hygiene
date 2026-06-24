// ════════════════════════════════════════════════════════════════════════
//  check-in.test.ts — run: npm test
//  Plain assertions, no test framework needed. Exits non-zero on failure.
// ════════════════════════════════════════════════════════════════════════
import assert from 'node:assert/strict'
import {
  RESET_THRESHOLD, KIND, makeDraft, canCommit, showsResetFields,
  applyChange, commitDraft, applyEdit, isEdited, suggestedKind,
  CURRENT_SCHEMA, MIGRATIONS, stampSchema, recordVersion, migrateRecord, migrateAll,
  STRIDE, entryDates, recordsForDate, weekStart, addDays, windowDates, stepAnchor, defaultAnchor,
} from './check-in.js'

let passed = 0
const test = (name: string, fn: () => void) => { fn(); passed++; console.log('  ✓', name) }

console.log('check-in')

// ── the invariant: no score → cannot commit (this is THE bug being chased) ──
test('a fresh draft cannot be committed (no score)', () => {
  const d = makeDraft({ id: '1', kind: KIND.MORNING, date: '2026-06-22' })
  assert.equal(canCommit(d), false)
})

test('a draft with score 0 CAN be committed (0 is valid, not falsy-blocked)', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MORNING, date: '2026-06-22' }), { score: 0 })
  assert.equal(canCommit(d), true) // regression guard: 0 must not read as "no score"
})

test('a draft with a mid score can be committed', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.EVENING, date: '2026-06-22' }), { score: 4 })
  assert.equal(canCommit(d), true)
})

test('null entry cannot be committed', () => {
  assert.equal(canCommit(null), false)
})

// ── applyChange immutability + score flow ──
test('applyChange returns a new object and sets the score', () => {
  const d = makeDraft({ id: '1', kind: KIND.MORNING, date: '2026-06-22' })
  const d2 = applyChange(d, { score: 3 })
  assert.equal(d.score, null)   // original untouched
  assert.equal(d2.score, 3)     // new one has the score
  assert.notEqual(d, d2)
})

// ── commitDraft ──
test('commitDraft throws without a score', () => {
  const d = makeDraft({ id: '1', kind: KIND.MIDDAY, date: '2026-06-22' })
  assert.throws(() => commitDraft(d, 'TS'), /without a score/)
})

test('commitDraft produces a record with ts and empty revisions', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MIDDAY, date: '2026-06-22' }), { score: 5, note: 'fine' })
  const rec = commitDraft(d, '2026-06-22T12:00:00Z')
  assert.equal(rec.score, 5)
  assert.equal(rec.note, 'fine')
  assert.equal(rec.ts, '2026-06-22T12:00:00Z')
  assert.deepEqual(rec.revisions, [])
})

test('commitDraft with score 0 succeeds', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MORNING, date: '2026-06-22' }), { score: 0 })
  const rec = commitDraft(d, 'TS')
  assert.equal(rec.score, 0)
})

// ── reset expansion threshold ──
test('midday at score 2 shows reset fields (≤ threshold)', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MIDDAY, date: 'd' }), { score: 2 })
  assert.equal(showsResetFields(d), true)
})

test('midday at score 3 stays light (above threshold)', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MIDDAY, date: 'd' }), { score: 3 })
  assert.equal(showsResetFields(d), false)
})

test('midday with no score yet does not show reset fields', () => {
  const d = makeDraft({ id: '1', kind: KIND.MIDDAY, date: 'd' })
  assert.equal(showsResetFields(d), false)
})

test('reset kind always shows reset fields', () => {
  const d = makeDraft({ id: '1', kind: KIND.RESET, date: 'd' })
  assert.equal(showsResetFields(d), true)
})

test('morning never shows reset fields even at low score', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MORNING, date: 'd' }), { score: 0 })
  assert.equal(showsResetFields(d), false)
})

test('threshold constant is 2', () => assert.equal(RESET_THRESHOLD, 2))

// ── edit versioning ──
test('applyEdit stores prior state and marks edited', () => {
  const rec = commitDraft(applyChange(makeDraft({ id: '1', kind: KIND.EVENING, date: 'd' }), { score: 4, went: 'ok' }), 'T1')
  const edited = applyEdit(rec, { score: 5 }, 'T2')
  assert.equal(edited.score, 5)
  assert.equal(edited.ts, 'T1')          // creation time preserved
  assert.equal(edited.editedTs, 'T2')
  assert.equal(edited.revisions.length, 1)
  assert.equal(edited.revisions[0].prior.score, 4) // old score retained
  assert.equal(isEdited(edited), true)
  assert.equal(isEdited(rec), false)
})

test('a second edit appends another revision (full history, not overwrite)', () => {
  const rec = commitDraft(applyChange(makeDraft({ id: '1', kind: KIND.EVENING, date: 'd' }), { score: 4 }), 'T1')
  const e1 = applyEdit(rec, { score: 5 }, 'T2')
  const e2 = applyEdit(e1, { score: 6 }, 'T3')
  assert.equal(e2.revisions.length, 2)
  assert.equal(e2.revisions[0].prior.score, 4)
  assert.equal(e2.revisions[1].prior.score, 5)
  assert.equal(e2.score, 6)
})

test('revision prior does not nest revisions inside itself', () => {
  const rec = commitDraft(applyChange(makeDraft({ id: '1', kind: KIND.MORNING, date: 'd' }), { score: 3 }), 'T1')
  const e1 = applyEdit(rec, { first: 'walk' }, 'T2')
  assert.equal('revisions' in e1.revisions[0].prior, false)
})

// ── clock suggestion ──
test('suggestedKind maps hours to check-ins', () => {
  assert.equal(suggestedKind(8), KIND.MORNING)
  assert.equal(suggestedKind(10), KIND.MORNING)
  assert.equal(suggestedKind(11), KIND.MIDDAY)
  assert.equal(suggestedKind(16), KIND.MIDDAY)
  assert.equal(suggestedKind(17), KIND.EVENING)
  assert.equal(suggestedKind(22), KIND.EVENING)
})

// ── schema versioning & migration ──
test('commitDraft stamps the current schema version', () => {
  const d = applyChange(makeDraft({ id: '1', kind: KIND.MORNING, date: 'd' }), { score: 3 })
  const rec = commitDraft(d, 'T1')
  assert.equal(rec.v, CURRENT_SCHEMA)
})

test('a record with no v is treated as v1', () => {
  assert.equal(recordVersion({ id: 'x', score: 3 }), 1)
})

test('a current-version record migrates to itself (status ok)', () => {
  const rec = stampSchema({ id: '1', kind: KIND.MORNING, date: 'd', score: 3, ts: 'T', revisions: [], v: 1 })
  const res = migrateRecord(rec)
  assert.equal(res.status, 'ok')
  assert.equal(res.record.v, CURRENT_SCHEMA)
})

test('a future-version record is quarantined, never altered', () => {
  const future = { id: '1', score: 3, v: CURRENT_SCHEMA + 5 }
  const res = migrateRecord(future)
  assert.equal(res.status, 'quarantine')
  assert.equal(res.record, future) // untouched
  assert.match(res.reason, /newer than app/)
})

test('a v1 record with no migration path available is quarantined (not dropped)', () => {
  const rec = { id: '1', score: 3, v: 1 }
  // With CURRENT_SCHEMA === 1 this is already current:
  assert.equal(migrateRecord(rec).status, 'ok')
})

test('migrateAll separates live and quarantined, flags changed', () => {
  const good = stampSchema({ id: '1', kind: KIND.MORNING, date: 'd', score: 3, ts: 'T', revisions: [], v: 1 })
  const future = { id: '2', score: 4, v: 99 }
  const { live, quarantined, changed } = migrateAll([good, future])
  assert.equal(live.length, 1)
  assert.equal(quarantined.length, 1)
  assert.equal(quarantined[0].record.id, '2')
  assert.equal(changed, true)
})

test('migrateAll on all-current data reports no change', () => {
  const a = stampSchema({ id: '1', kind: KIND.MORNING, date: 'd', score: 3, ts: 'T', revisions: [], v: 1 })
  const b = stampSchema({ id: '2', kind: KIND.EVENING, date: 'd', score: 5, ts: 'T', revisions: [], v: 1 })
  const { live, quarantined, changed } = migrateAll([a, b])
  assert.equal(live.length, 2)
  assert.equal(quarantined.length, 0)
  assert.equal(changed, false)
})

test('a registered migration chain advances an old record [simulated]', () => {
  const v1rec = { id: '1', kind: KIND.MORNING, date: 'd', score: 3, v: 1 }
  const localMigrations: Record<number, (r: unknown) => unknown> = { 1: (r) => ({ ...(r as object), note: '', v: 2 }) }
  const target = 2
  let v = 1, cur: unknown = { ...v1rec }
  while (v < target) { cur = localMigrations[v](cur); v = (cur as { v: number }).v }
  assert.equal((cur as { v: number }).v, 2)
  assert.equal('note' in (cur as object), true)
  assert.equal((cur as { score: number }).score, 3)
})

void MIGRATIONS

// ── history navigation ──
const navRecs = [
  { id: 'a', date: '2026-06-01', kind: KIND.MORNING, score: 3, ts: '2026-06-01T08:00:00Z', revisions: [], v: 1 },
  { id: 'b', date: '2026-06-01', kind: KIND.EVENING, score: 4, ts: '2026-06-01T20:00:00Z', revisions: [], v: 1 },
  { id: 'c', date: '2026-06-10', kind: KIND.MIDDAY,  score: 5, ts: '2026-06-10T12:00:00Z', revisions: [], v: 1 },
  { id: 'd', date: '2026-06-22', kind: KIND.MORNING, score: 2, ts: '2026-06-22T08:00:00Z', revisions: [], v: 1 },
]

test('entryDates returns distinct dates newest-first', () => {
  assert.deepEqual(entryDates(navRecs), ['2026-06-22', '2026-06-10', '2026-06-01'])
})

test('recordsForDate returns that day\'s entries oldest-first', () => {
  const r = recordsForDate(navRecs, '2026-06-01')
  assert.deepEqual(r.map((x) => x.id), ['a', 'b'])
})

test('weekStart is the Sunday of the week', () => {
  assert.equal(weekStart('2026-06-22'), '2026-06-21')
  assert.equal(weekStart('2026-06-10'), '2026-06-07')
  assert.equal(weekStart('2026-06-21'), '2026-06-21')
})

test('windowDates DAY returns just the anchor if it has entries', () => {
  assert.deepEqual(windowDates(navRecs, '2026-06-10', STRIDE.DAY), ['2026-06-10'])
  assert.deepEqual(windowDates(navRecs, '2026-06-11', STRIDE.DAY), [])
})

test('windowDates WEEK returns entry-dates in the anchor\'s week', () => {
  assert.deepEqual(windowDates(navRecs, '2026-06-01', STRIDE.WEEK), ['2026-06-01'])
})

test('stepAnchor DAY moves to adjacent entry-date', () => {
  assert.equal(stepAnchor(navRecs, '2026-06-22', STRIDE.DAY, -1), '2026-06-10')
  assert.equal(stepAnchor(navRecs, '2026-06-10', STRIDE.DAY, -1), '2026-06-01')
  assert.equal(stepAnchor(navRecs, '2026-06-01', STRIDE.DAY, -1), null)
  assert.equal(stepAnchor(navRecs, '2026-06-01', STRIDE.DAY, +1), '2026-06-10')
  assert.equal(stepAnchor(navRecs, '2026-06-22', STRIDE.DAY, +1), null)
})

test('stepAnchor WEEK moves to the nearest week containing entries', () => {
  const older = stepAnchor(navRecs, '2026-06-22', STRIDE.WEEK, -1)!
  assert.equal(weekStart(older), '2026-06-07')
  const older2 = stepAnchor(navRecs, older, STRIDE.WEEK, -1)!
  assert.equal(weekStart(older2), '2026-05-31')
  assert.equal(stepAnchor(navRecs, older2, STRIDE.WEEK, -1), null)
})

test('defaultAnchor is the most recent entry date', () => {
  assert.equal(defaultAnchor(navRecs, '2026-06-25'), '2026-06-22')
  assert.equal(defaultAnchor([], '2026-06-25'), '2026-06-25')
})

// ── also verify addDays is exported and works ──
test('addDays advances a date by n days', () => {
  assert.equal(addDays('2026-06-01', 6), '2026-06-07')
  assert.equal(addDays('2026-06-28', 3), '2026-07-01')
})

console.log(`\n${passed} passed`)
