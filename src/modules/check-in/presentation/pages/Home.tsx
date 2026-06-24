import { type CheckInRecord, type Kind, suggestedKind } from '../../domain/check-in.js'
import { KINDS, SCALE_COLOR, dayKey, summarize } from '../constants.js'
import Curve from '../components/Curve.js'

const SLOTS = ['morning', 'midday', 'evening'] as const

interface Props {
  records: CheckInRecord[]
  flashSlot: Kind | null
  onOpenSlot: (kind: Kind) => void
  onStartReset: () => void
  onEditRecord: (r: CheckInRecord) => void
  onGoHistory: () => void
  onSeedData: () => void
  onClearData: () => void
}

export default function Home({ records, flashSlot, onOpenSlot, onStartReset, onEditRecord, onGoHistory, onSeedData, onClearData }: Props) {
  const today = dayKey()
  const todays = records.filter(r => r.date === today)
  const suggested = suggestedKind(new Date().getHours())
  const beforeToday = records.filter(r => r.date < today).sort((a, b) => b.ts.localeCompare(a.ts))
  const recent = beforeToday.slice(0, 5)

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8b95a5', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Last 14 days</div>
        <Curve records={records} />
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {SLOTS.map(key => {
          const c = KINDS[key]
          const e = todays.filter(x => x.kind === key).slice(-1)[0]
          const done = !!e
          const isNow = key === suggested && !done
          return (
            <button key={key} onClick={() => onOpenSlot(key)}
              style={{
                textAlign: 'left', padding: '16px', borderRadius: 12, cursor: 'pointer',
                border: isNow ? '1.5px solid #caa24e' : '1.5px solid #1d232e',
                background: done ? '#0f141b' : '#141a23',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                animation: flashSlot === key ? 'slotFlash 1.4s ease' : 'none',
              }}>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: done ? '#cdd5e0' : '#e7ecf3' }}>{c.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#717c8c', textTransform: 'uppercase', letterSpacing: '.06em' }}>{c.fn}</span>
              </span>
              {done
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#5b6472', textTransform: 'uppercase', letterSpacing: '.06em' }}>edit</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 600, color: SCALE_COLOR[e.score] }}>{e.score}</span>
                  </span>
                : isNow
                  ? <span style={{ fontSize: 11, color: '#caa24e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>now</span>
                  : <span style={{ fontSize: 11, color: '#717c8c' }}>{c.window}</span>
              }
            </button>
          )
        })}
      </div>

      <button onClick={onStartReset}
        style={{ width: '100%', marginTop: 16, textAlign: 'left', padding: '16px', borderRadius: 12, cursor: 'pointer', border: '1.5px solid #4a3a2a', background: '#1a1510', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#e7c98a' }}>I need to reset</span>
        <span style={{ fontSize: 11, color: '#a98a52' }}>any time</span>
      </button>

      {recent.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8b95a5', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Recent</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {recent.map(r => (
              <button key={r.id} onClick={() => onEditRecord(r)}
                style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #1d232e', background: '#141a23', cursor: 'pointer', display: 'grid', gridTemplateColumns: '30px 1fr auto', gap: 11, alignItems: 'center' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 600, color: SCALE_COLOR[r.score], textAlign: 'center' }}>{r.score}</span>
                <span style={{ display: 'grid', gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e7ecf3' }}>
                    {KINDS[r.kind].label}{' '}
                    <span style={{ color: '#5b6472', fontWeight: 400, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{r.date.slice(5)}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: '#8b95a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summarize(r)}</span>
                </span>
                {r.revisions.length > 0 && <span style={{ fontSize: 10, color: '#717c8c' }}>edited</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={onGoHistory}
        style={{ width: '100%', marginTop: 18, padding: '12px', borderRadius: 10, border: '1.5px solid #1d232e', background: 'transparent', color: '#8b95a5', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
        {beforeToday.length > 5 ? 'View more history' : 'See & edit history'}
      </button>

      {import.meta.env.DEV && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onSeedData} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px dashed #3a4452', background: 'transparent', color: '#717c8c', fontSize: 12, cursor: 'pointer' }}>Seed 3mo test data</button>
          <button onClick={onClearData} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px dashed #3a4452', background: 'transparent', color: '#717c8c', fontSize: 12, cursor: 'pointer' }}>Clear all</button>
        </div>
      )}
    </>
  )
}
