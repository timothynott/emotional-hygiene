import { entryDates, type CheckInRecord } from '../../domain/check-in.js'

interface Props {
  records: CheckInRecord[]
  monthAnchor: string
  onMonth: (dir: number) => void
  onPickDay: (date: string) => void
  onClose: () => void
}

export default function CalendarPopup({ records, monthAnchor, onMonth, onPickDay, onClose }: Props) {
  const entrySet = new Set(entryDates(records))
  const base = new Date(monthAnchor + 'T00:00:00')
  const year = base.getFullYear(), month = base.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const monthLabel = first.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const dateStr = (d: number) => `${year}-${pad2(month + 1)}-${pad2(d)}`

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: '#0009', display: 'grid', placeItems: 'center', padding: 20, zIndex: 55 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 360, background: '#141a23', border: '1.5px solid #232a36', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => onMonth(-1)} style={{ background: 'none', border: 'none', color: '#cdd5e0', fontSize: 18, cursor: 'pointer', padding: '0 8px' }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{monthLabel}</span>
          <button onClick={() => onMonth(1)} style={{ background: 'none', border: 'none', color: '#cdd5e0', fontSize: 18, cursor: 'pointer', padding: '0 8px' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} style={{ textAlign: 'center', fontSize: 10, color: '#5b6472', fontWeight: 600 }}>{d}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (d == null) return <span key={i} />
            const ds = dateStr(d)
            const has = entrySet.has(ds)
            return (
              <button key={i} disabled={!has} onClick={() => has && onPickDay(ds)}
                style={{ aspectRatio: '1', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: has ? 700 : 400,
                  background: has ? '#caa24e' : 'transparent', color: has ? '#0c1016' : '#3a4452',
                  cursor: has ? 'pointer' : 'default' }}>
                {d}
              </button>
            )
          })}
        </div>
        <button onClick={onClose}
          style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 9, border: '1.5px solid #232a36', background: 'transparent', color: '#8b95a5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  )
}
