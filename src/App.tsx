import { useState, useRef, useEffect, type ReactNode } from 'react'
import {
  makeDraft, commitDraft as domainCommitDraft, applyEdit,
  type CheckInRecord, type Draft, type Kind, type Stride,
  CURRENT_SCHEMA, defaultAnchor,
} from './modules/check-in/domain/check-in.js'
import {
  loadRecords, saveRecords, loadDraft, saveDraft, clearDraft,
  loadSettings, saveSettings, type Settings,
} from './modules/check-in/infrastructure/storage.js'
import { KINDS, dayKey, stamp, uid } from './modules/check-in/presentation/constants.js'
import Home from './modules/check-in/presentation/pages/Home.js'
import History from './modules/check-in/presentation/pages/History.js'
import Editor from './modules/check-in/presentation/components/Editor.js'
import DiscardDialog from './modules/check-in/presentation/components/DiscardDialog.js'

const VIEW = { HOME: 'home', DRAFT: 'draft', EDIT: 'edit', HISTORY: 'history' } as const
type View = typeof VIEW[keyof typeof VIEW]

// ── dev seed data ────────────────────────────────────────────────────────
function makeSeedRecords(): CheckInRecord[] {
  const recs: CheckInRecord[] = []
  const today = new Date()
  const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
  const multiDay = new Date(today); multiDay.setDate(multiDay.getDate() - 21)
  const multiDate = dayKey(multiDay)

  for (let back = 92; back >= 1; back--) {
    const d = new Date(today); d.setDate(d.getDate() - back)
    const date = dayKey(d)
    if (date === multiDate || Math.random() < 0.35) continue
    const tsAt = (h: number, m: number) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x.toISOString() }
    if (Math.random() < 0.80) recs.push({ id: uid(), date, kind: 'morning', score: rand(1, 6), first: 'Start with the hardest thing.', ts: tsAt(8, rand(0, 59)), revisions: [], v: CURRENT_SCHEMA })
    if (Math.random() < 0.85) {
      const sc = rand(0, 6)
      const r: CheckInRecord = { id: uid(), date, kind: 'midday', score: sc, note: sc >= 4 ? 'Solid stretch of focus.' : '', ts: tsAt(13, rand(0, 59)), revisions: [], v: CURRENT_SCHEMA }
      if (sc <= 2) { r.what = 'Meeting ran sideways.'; r.body = 'Tight chest.'; r.step = 'Walk, then reply.' }
      recs.push(r)
    }
    if (Math.random() < 0.70) recs.push({ id: uid(), date, kind: 'evening', score: rand(1, 6), went: 'Uneven but okay day overall.', tomorrow: 'Protect the morning block.', ts: tsAt(21, rand(0, 59)), revisions: [], v: CURRENT_SCHEMA })
    const numResets = Math.random() < 0.18 ? rand(1, 2) : 0
    for (let i = 0; i < numResets; i++) recs.push({ id: uid(), date, kind: 'reset', score: rand(0, 3), what: 'Sudden spike.', body: 'Jaw, shoulders.', step: 'Box breathing.', ts: tsAt(rand(10, 18), rand(0, 59)), revisions: [], v: CURRENT_SCHEMA })
  }

  const mdTs = (h: number, m: number) => { const x = new Date(multiDay); x.setHours(h, m, 0, 0); return x.toISOString() }
  recs.push({ id: uid(), date: multiDate, kind: 'morning', score: 2, first: 'Ease in.', ts: mdTs(8, 12), revisions: [], v: CURRENT_SCHEMA })
  recs.push({ id: uid(), date: multiDate, kind: 'reset', score: 1, what: 'Bad email first thing.', body: 'Stomach.', step: 'Step outside.', ts: mdTs(9, 40), revisions: [], v: CURRENT_SCHEMA })
  recs.push({ id: uid(), date: multiDate, kind: 'reset', score: 2, what: 'Back-to-back calls.', body: 'Shoulders up.', step: 'Two slow breaths.', ts: mdTs(14, 5), revisions: [], v: CURRENT_SCHEMA })
  recs.push({ id: uid(), date: multiDate, kind: 'reset', score: 0, what: 'News notification.', body: 'Jaw clenched.', step: 'Put phone away.', ts: mdTs(16, 30), revisions: [], v: CURRENT_SCHEMA })
  recs.push({ id: uid(), date: multiDate, kind: 'evening', score: 3, went: 'Rough middle, recovered.', tomorrow: 'Mute notifications until noon.', ts: mdTs(21, 15), revisions: [], v: CURRENT_SCHEMA })
  return recs
}

// ── app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [settings, setSettings] = useState<Settings>({ discardConfirm: true, stride: 'day' })
  const [view, setView] = useState<View>(VIEW.HOME)
  const [editing, setEditing] = useState<CheckInRecord | null>(null)
  const [editDraft, setEditDraft] = useState<Draft | null>(null)
  const [editFrom, setEditFrom] = useState<View>(VIEW.HISTORY)
  const [showDiscard, setShowDiscard] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [flashSlot, setFlashSlot] = useState<Kind | null>(null)
  const [historyAnchor, setHistoryAnchor] = useState<string>(dayKey())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Defined before effects so they can safely reference it.
  const navigate = (v: View) => {
    setView(v)
    history.pushState({ view: v }, '')
  }

  // Seed the initial history entry and wire popstate so the browser back button works.
  useEffect(() => {
    history.replaceState({ view: VIEW.HOME }, '')
    const onPop = (e: PopStateEvent) => {
      const v = (e.state as { view?: View } | null)?.view
      setView(v ?? VIEW.HOME)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const r = loadRecords()
    const d = loadDraft()
    const s = loadSettings()
    setRecords(r); setDraft(d); setSettings(s)
    setHistoryAnchor(defaultAnchor(r, dayKey()))
    if (d) navigate(VIEW.DRAFT)
    setLoading(false)
  }, []) // navigate is stable on mount; intentionally omitted from deps

  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch { /* noop */ }
  }, [view])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const flash = (kind: Kind, date: string) => {
    if (date === dayKey() && kind !== 'reset') {
      setFlashSlot(kind)
      setTimeout(() => setFlashSlot(null), 1400)
    }
  }

  const startDraft = (kind: Kind) => {
    const d = makeDraft({ id: uid(), kind, date: dayKey() })
    setDraft(d); saveDraft(d); navigate(VIEW.DRAFT)
  }

  const enterEdit = (record: CheckInRecord, from: View) => {
    setEditFrom(from)
    setEditing(record)
    setEditDraft({ id: record.id, kind: record.kind, date: record.date, score: record.score,
      first: record.first, note: record.note, what: record.what, body: record.body,
      step: record.step, went: record.went, tomorrow: record.tomorrow })
    navigate(VIEW.EDIT)
  }

  const openSlot = (kind: Kind) => {
    const existing = records.filter(r => r.date === dayKey() && r.kind === kind).slice(-1)[0]
    if (existing) enterEdit(existing, VIEW.HOME)
    else startDraft(kind)
  }

  const onDraftChange = (next: Draft) => {
    setDraft(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(next), 250)
  }

  const commitDraft = (f: Draft) => {
    if (f.score == null) return
    if (f.kind !== 'reset' && records.some(r => r.date === f.date && r.kind === f.kind)) {
      setErr(`A ${KINDS[f.kind].label} entry for ${f.date} already exists — edit it instead of logging a new one.`)
      return
    }
    try {
      const rec = domainCommitDraft(f, stamp())
      const next = [...records, rec].sort((a, b) => a.ts.localeCompare(b.ts))
      saveRecords(next); clearDraft()
      setRecords(next); setDraft(null); setErr(null); navigate(VIEW.HOME)
      showToast(`${KINDS[rec.kind].label} logged`)
      flash(rec.kind, rec.date)
    } catch (e) {
      setErr(`Couldn't save: ${e instanceof Error ? e.message : String(e)}. Your draft is kept.`)
    }
  }

  const doDiscard = () => { clearDraft(); setDraft(null); setShowDiscard(false); navigate(VIEW.HOME) }

  const requestDiscard = () => { settings.discardConfirm ? setShowDiscard(true) : doDiscard() }

  const doDiscardWithPref = (dontAsk: boolean) => {
    if (dontAsk) { const s = { ...settings, discardConfirm: false }; setSettings(s); saveSettings(s) }
    doDiscard()
  }

  const saveFromFork = () => { if (draft) commitDraft(draft); setShowDiscard(false) }

  const setStride = (s: Stride) => {
    const ns = { ...settings, stride: s }
    setSettings(ns); saveSettings(ns)
  }

  const saveEdit = (f: Draft) => {
    if (!editing || f.score == null) return
    const updated = applyEdit(editing, { ...f, score: f.score }, stamp())
    const next = records.map(r => r.id === updated.id ? updated : r).sort((a, b) => a.ts.localeCompare(b.ts))
    saveRecords(next); setRecords(next); navigate(editFrom)
    showToast(`${KINDS[updated.kind].label} updated`)
    flash(updated.kind, updated.date)
  }

  const seedData = () => {
    const seeded = makeSeedRecords()
    const next = [...records, ...seeded].sort((a, b) => a.ts.localeCompare(b.ts))
    saveRecords(next); setRecords(next)
    showToast(`Seeded ${seeded.length} entries`)
  }

  const clearData = () => {
    saveRecords([]); setRecords([])
    showToast('Cleared all entries')
  }

  const wrap = (children: ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#0c1016', color: '#e7ecf3', fontFamily: "'Inter', system-ui, sans-serif", padding: '28px 18px 60px' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>{children}</div>
      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', background: '#caa24e', color: '#0c1016', fontSize: 14, fontWeight: 600, padding: '11px 20px', borderRadius: 999, boxShadow: '0 6px 24px rgba(0,0,0,0.4)', animation: 'toastIn .22s ease', zIndex: 60, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )

  if (loading) return wrap(<p style={{ fontSize: 13, color: '#717c8c' }}>Loading…</p>)

  if (view === VIEW.DRAFT && draft) {
    return wrap(
      <>
        {err && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: '#3a1f1f', border: '1.5px solid #6b3b3b', color: '#e7b3b3', fontSize: 13 }}>{err}</div>}
        <Editor key={draft.id} kind={draft.kind} value={draft} mode="draft"
          onChange={onDraftChange} onCommit={commitDraft}
          onDiscardRequest={requestDiscard} onCancelEdit={() => {}} />
        {showDiscard && <DiscardDialog onDiscard={doDiscardWithPref} onSave={saveFromFork} onCancel={() => setShowDiscard(false)} />}
      </>
    )
  }

  if (view === VIEW.EDIT && editing && editDraft) {
    return wrap(
      <Editor key={editing.id} kind={editing.kind} value={editDraft} mode="edit"
        onChange={v => setEditDraft(v)} onCommit={saveEdit}
        onDiscardRequest={() => {}} onCancelEdit={() => history.back()} />
    )
  }

  if (view === VIEW.HISTORY) {
    return wrap(
      <History
        records={records}
        anchor={historyAnchor}
        stride={settings.stride}
        onEdit={r => enterEdit(r, VIEW.HISTORY)}
        onAnchor={setHistoryAnchor}
        onStride={setStride}
        back={() => history.back()}
      />
    )
  }

  return wrap(
    <Home
      records={records}
      flashSlot={flashSlot}
      onOpenSlot={openSlot}
      onStartReset={() => startDraft('reset')}
      onEditRecord={r => enterEdit(r, VIEW.HOME)}
      onGoHistory={() => navigate(VIEW.HISTORY)}
      onSeedData={seedData}
      onClearData={clearData}
    />
  )
}
