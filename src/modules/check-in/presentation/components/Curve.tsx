import { type CheckInRecord } from '../../domain/check-in.js'
import { KINDS, dayKey } from '../constants.js'

const COL = { morning: '#7d93a6', midday: '#caa24e', evening: '#8aa78f' } as const
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const SERIES = ['morning', 'midday', 'evening'] as const
type Series = typeof SERIES[number]

export default function Curve({ records }: { records: CheckInRecord[] }) {
  const N = 14
  const dates: string[] = []
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(dayKey(d))
  }

  const days: Record<string, Partial<Record<Series, number>>> = {}
  const resetDays = new Set<string>()
  for (const r of records) {
    if (r.kind === 'reset') { resetDays.add(r.date); continue }
    if (!days[r.date]) days[r.date] = {}
    if (r.kind === 'morning' || r.kind === 'midday' || r.kind === 'evening') {
      days[r.date][r.kind] = r.score
    }
  }

  const W = 320, H = 132
  const padL = 8, padR = 8, padTop = 8, padBot = 18
  const xPos = (i: number) => padL + (i * (W - padL - padR)) / (N - 1)
  const yPos = (s: number) => padTop + (1 - s / 6) * (H - padTop - padBot)
  const colWidth = (W - padL - padR) / (N - 1)
  const R = 3.2

  const totalPoints = dates.reduce(
    (n, d) => n + (days[d] ? SERIES.filter(s => days[d][s] != null).length : 0),
    0,
  )
  if (totalPoints === 0 && resetDays.size === 0) {
    return <p style={{ fontSize: 13, color: '#717c8c' }}>No entries yet. Your curve builds as you log.</p>
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', aspectRatio: `${W} / ${H}`, display: 'block' }} preserveAspectRatio="xMidYMid meet">
        {dates.map((d, i) => resetDays.has(d) ? (
          <rect key={`r${d}`} x={xPos(i) - colWidth / 2} y={padTop} width={colWidth} height={H - padTop - padBot} fill="#a83a3a" opacity="0.16" />
        ) : null)}

        {[0, 1, 2, 3, 4, 5, 6].map(g => (
          <g key={`y${g}`}>
            <line x1={padL} x2={W - padR} y1={yPos(g)} y2={yPos(g)} stroke="#232a36" strokeWidth={g % 3 === 0 ? '1' : '0.6'} />
            <line x1={padL - 4} x2={padL} y1={yPos(g)} y2={yPos(g)} stroke="#3a4554" strokeWidth="1" />
          </g>
        ))}
        {dates.map((d, i) => (
          <line key={`x${d}`} x1={xPos(i)} x2={xPos(i)} y1={padTop} y2={H - padBot} stroke="#1b212b" strokeWidth="0.6" />
        ))}

        {SERIES.map(s => {
          const pts = dates
            .map((d, i) => (days[d]?.[s] != null ? `${xPos(i)},${yPos(days[d][s]!)}` : null))
            .filter(Boolean)
          return pts.length >= 2
            ? <polyline key={s} points={pts.join(' ')} fill="none" stroke={COL[s]} strokeWidth="2" strokeLinejoin="round" />
            : null
        })}

        {SERIES.flatMap(s => dates.map((d, i) => {
          const v = days[d]?.[s]
          return v != null
            ? <circle key={`${s}${d}`} cx={xPos(i)} cy={yPos(v)} r={R} fill={COL[s]} stroke="#0c1016" strokeWidth="0.8" />
            : null
        }))}

        {dates.map((d, i) => (
          <text key={`dow${d}`} x={xPos(i)} y={H - 4} textAnchor="middle"
            fontSize="7.5" fill="#3a4452" fontFamily="'IBM Plex Mono', monospace">
            {DOW[new Date(d + 'T00:00:00').getDay()]}
          </text>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#5b6472', marginTop: 4 }}>
        <span>{dates[0].slice(5)}</span>
        <span>today</span>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
        {SERIES.map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8b95a5' }}>
            <span style={{ width: 10, height: 2, background: COL[s], display: 'inline-block' }} />
            {KINDS[s].label}
          </span>
        ))}
        {resetDays.size > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8b95a5' }}>
            <span style={{ width: 10, height: 10, background: '#a83a3a', opacity: 0.4, display: 'inline-block', borderRadius: 2 }} />
            reset day
          </span>
        )}
      </div>
    </div>
  )
}
