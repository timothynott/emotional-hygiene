interface Props {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  rows?: number
  optional?: boolean
}

export default function Field({ label, hint, value, onChange, rows = 1, optional }: Props) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd5e0' }}>{label}</span>
        {optional && <span style={{ fontSize: 11, color: '#717c8c', textTransform: 'uppercase', letterSpacing: '.06em' }}>optional</span>}
      </span>
      {hint && <span style={{ fontSize: 12, color: '#717c8c', marginTop: -2 }}>{hint}</span>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14, color: '#e7ecf3', background: '#11161e', border: '1.5px solid #232a36', borderRadius: 8, padding: '10px 12px', lineHeight: 1.4, outline: 'none' }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3a4760'
          const el = e.target
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
        }}
        onBlur={(e) => { e.target.style.borderColor = '#232a36' }} />
    </label>
  )
}
