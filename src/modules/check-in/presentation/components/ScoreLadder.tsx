import { SCALE, SCALE_COLOR } from '../constants'

interface Props {
  value: number | null
  onChange: (v: number) => void
  idPrefix: string
}

export default function ScoreLadder({ value, onChange, idPrefix }: Props) {
  return (
    <div role="radiogroup" aria-label="Capacity score" style={{ display: 'grid', gap: 4 }}>
      {[...SCALE].reverse().map((s) => {
        const active = value === s.v
        return (
          <button key={s.v} role="radio" aria-checked={active} id={`${idPrefix}-${s.v}`}
            onClick={() => onChange(s.v)}
            style={{
              display: 'grid', gridTemplateColumns: '34px 1fr', alignItems: 'center', gap: 12,
              textAlign: 'left', padding: '10px 12px', borderRadius: 8,
              border: active ? `1.5px solid ${SCALE_COLOR[s.v]}` : '1.5px solid #232a36',
              background: active ? `${SCALE_COLOR[s.v]}1a` : '#161b24',
              cursor: 'pointer', transition: 'border-color .12s, background .12s',
            }}>
            <span aria-hidden style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, color: SCALE_COLOR[s.v], textAlign: 'center' }}>{s.v}</span>
            <span style={{ display: 'grid', gap: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e7ecf3' }}>{s.name}</span>
              <span style={{ fontSize: 12, color: '#8b95a5', lineHeight: 1.35 }}>{s.note}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
