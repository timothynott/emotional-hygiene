import { useState } from 'react'
import {
  STRIDE, type Stride, type CheckInRecord,
  entryDates, recordsForDate, weekStart, addDays, windowDates, stepAnchor,
} from '../../domain/check-in.js'
import { KINDS, SCALE_COLOR, summarize } from '../constants.js'
import Dropdown from '../../../../shared/ui/Dropdown.js'
import CalendarPopup from '../components/CalendarPopup.js'

interface Props {
  records: CheckInRecord[]
  anchor: string
  stride: Stride
  onEdit: (r: CheckInRecord) => void
  onAnchor: (date: string) => void
  onStride: (s: Stride) => void
  back: () => void
}

export default function History({ records, anchor, stride, onEdit, onAnchor, onStride, back }: Props) {
  const [calOpen, setCalOpen] = useState(false)
  const [monthAnchor, setMonthAnchor] = useState(anchor)

  const dates = windowDates(records, anchor, stride)
  const hasOlder = stepAnchor(records, anchor, stride, -1) != null
  const hasNewer = stepAnchor(records, anchor, stride, 1) != null

  const go = (dir: 1 | -1) => {
    const next = stepAnchor(records, anchor, stride, dir)
    if (next) onAnchor(next)
  }

  const ws = weekStart(anchor)
  const windowLabel = stride === STRIDE.DAY
    ? anchor
    : `${ws} – ${addDays(ws, 6)}`

  return (
    <div>
      <button onClick={back}
        style={{ background: 'none', border: 'none', color: '#717c8c', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
        ← back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>History</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { setMonthAnchor(anchor); setCalOpen(true) }}
            style={{ background: '#141a23', border: '1.5px solid #232a36', borderRadius: 7, padding: '5px 10px', fontSize: 12.5, color: '#cdd5e0', cursor: 'pointer', fontWeight: 600 }}>
            📅 Calendar
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b95a5' }}>
            by
            <Dropdown ariaLabel="Group history by" value={stride}
              options={[{ value: STRIDE.DAY, label: 'day' }, { value: STRIDE.WEEK, label: 'week' }]}
              onChange={v => onStride(v as Stride)} />
          </label>
        </div>
      </div>

      {entryDates(records).length === 0 && (
        <p style={{ fontSize: 13, color: '#717c8c' }}>Nothing logged yet.</p>
      )}

      {entryDates(records).length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={() => go(-1)} disabled={!hasOlder}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #232a36', background: 'transparent',
                color: hasOlder ? '#cdd5e0' : '#3a4452', fontSize: 13, fontWeight: 600, cursor: hasOlder ? 'pointer' : 'not-allowed' }}>
              ← older
            </button>
            <span style={{ fontSize: 11.5, color: '#717c8c', fontFamily: "'IBM Plex Mono', monospace" }}>{windowLabel}</span>
            <button onClick={() => go(1)} disabled={!hasNewer}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #232a36', background: 'transparent',
                color: hasNewer ? '#cdd5e0' : '#3a4452', fontSize: 13, fontWeight: 600, cursor: hasNewer ? 'pointer' : 'not-allowed' }}>
              newer →
            </button>
          </div>

          {dates.length === 0 && (
            <p style={{ fontSize: 13, color: '#717c8c' }}>No entries in this {stride}.</p>
          )}

          {dates.map(d => (
            <div key={d} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#8b95a5', marginBottom: 8, fontWeight: 600 }}>{d}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {recordsForDate(records, d).map(r => (
                  <button key={r.id} onClick={() => onEdit(r)}
                    style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #1d232e', background: '#141a23', cursor: 'pointer',
                      display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600,
                      color: r.score != null ? SCALE_COLOR[r.score] : '#39424f', textAlign: 'center' }}>
                      {r.score ?? '–'}
                    </span>
                    <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e7ecf3' }}>{KINDS[r.kind].label}</span>
                      <span style={{ fontSize: 12, color: '#8b95a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summarize(r)}</span>
                    </span>
                    {(r.revisions?.length ?? 0) > 0 && <span style={{ fontSize: 11, color: '#717c8c' }}>edited</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {calOpen && (
        <CalendarPopup
          records={records}
          monthAnchor={monthAnchor}
          onMonth={dir => {
            const d = new Date(monthAnchor + 'T00:00:00')
            d.setMonth(d.getMonth() + dir)
            setMonthAnchor(d.toISOString().slice(0, 10))
          }}
          onPickDay={ds => { onAnchor(ds); setCalOpen(false) }}
          onClose={() => setCalOpen(false)}
        />
      )}
    </div>
  )
}
