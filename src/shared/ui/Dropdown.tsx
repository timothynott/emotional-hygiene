import { useState, useEffect, useRef } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  value: string
  options: Option[]
  onChange: (v: string) => void
  ariaLabel: string
}

export default function Dropdown({ value, options, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc) }
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#141a23', color: '#e7ecf3', border: '1.5px solid #232a36', borderRadius: 7, padding: '5px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        {current?.label ?? value}
        <span style={{ fontSize: 9, color: '#8b95a5' }}>▼</span>
      </button>
      {open && (
        <div role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: '100%', background: '#161b24', border: '1.5px solid #2a3340', borderRadius: 9, boxShadow: '0 8px 28px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 70 }}>
          {options.map((o) => (
            <button key={o.value} role="option" aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left', padding: '10px 14px', background: o.value === value ? '#1f2630' : 'transparent', border: 'none', color: o.value === value ? '#caa24e' : '#cdd5e0', fontSize: 13.5, fontWeight: o.value === value ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {o.label}
              {o.value === value && <span style={{ fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
