import { useState } from 'react'

interface Props {
  onDiscard: (dontAsk: boolean) => void
  onSave: () => void
  onCancel: () => void
}

export default function DiscardDialog({ onDiscard, onSave, onCancel }: Props) {
  const [dontAsk, setDontAsk] = useState(false)

  return (
    <div role="dialog" aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.56)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 50 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#141a23', border: '1.5px solid #232a36', borderRadius: 14, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Discard this entry?</h3>
        <p style={{ fontSize: 13, color: '#8b95a5', margin: '0 0 18px', lineHeight: 1.45 }}>
          You don't have to lose it. Save keeps it as a record you can finish later from History.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={onSave}
            style={{ padding: '12px', borderRadius: 9, border: 'none', background: '#8aa78f', color: '#0c1016', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Save &amp; finish later
          </button>
          <button onClick={() => onDiscard(dontAsk)}
            style={{ padding: '12px', borderRadius: 9, border: '1.5px solid #6b3b3b', background: 'transparent', color: '#dd9999', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Discard
          </button>
          <button onClick={onCancel}
            style={{ padding: '12px', borderRadius: 9, border: 'none', background: 'transparent', color: '#717c8c', fontSize: 13, cursor: 'pointer' }}>
            Keep editing
          </button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12.5, color: '#8b95a5', cursor: 'pointer' }}>
          <input type="checkbox" checked={dontAsk} onChange={e => setDontAsk(e.target.checked)} />
          Don't ask again — discard immediately next time
        </label>
        <p style={{ fontSize: 11, color: '#5b6472', margin: '8px 0 0' }}>Reversible later from Settings.</p>
      </div>
    </div>
  )
}
