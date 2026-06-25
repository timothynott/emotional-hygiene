import { useRef } from 'react'
import { type Draft, type Kind, canCommit, showsResetFields } from '../../domain/check-in.js'
import { KINDS } from '../constants.js'
import ScoreLadder from './ScoreLadder.js'
import Field from '../../../../shared/ui/Field.js'

interface Props {
  kind: Kind
  value: Draft
  mode: 'draft' | 'edit'
  onChange: (v: Draft) => void
  onCommit: (v: Draft) => void
  onDiscardRequest: () => void
  onCancelEdit: () => void
}

export default function Editor({ kind, value, mode, onChange, onCommit, onDiscardRequest, onCancelEdit }: Props) {
  const f = value
  const set = (patch: Partial<Draft>) => onChange({ ...f, ...patch })
  const k = KINDS[kind]
  const showReset = showsResetFields(f)
  const ok = canCommit(f)
  const afterScoreRef = useRef<HTMLDivElement>(null)

  const pickScore = (v: number) => {
    const firstPick = f.score == null
    set({ score: v })
    if (firstPick) {
      requestAnimationFrame(() => {
        const region = afterScoreRef.current
        if (!region) return
        const target = region.querySelector<HTMLElement>('textarea, button')
        if (target) {
          target.focus({ preventScroll: true })
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{k.label}</h2>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#717c8c', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {k.fn}{mode === 'edit' ? ' · editing' : ''}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: '#8b95a5', margin: '6px 0 0', lineHeight: 1.4 }}>{k.blurb}</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#cdd5e0', marginBottom: 8 }}>
          Capacity now <span style={{ color: '#caa24e' }}>·</span>{' '}
          <span style={{ color: '#717c8c', fontWeight: 400 }}>required</span>
        </div>
        <ScoreLadder value={f.score} onChange={pickScore} idPrefix={kind} />
      </div>

      <div ref={afterScoreRef}>
        {kind === 'morning' && (
          <Field label="First action" hint="One concrete thing to get going. Not a reflection." rows={2}
            value={f.first ?? ''} onChange={v => set({ first: v })} />
        )}

        {kind === 'midday' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Anything worth noting?" hint="A line if something's there. Fine to leave blank." optional rows={2}
              value={f.note ?? ''} onChange={v => set({ note: v })} />
            {showReset && (
              <div style={{ display: 'grid', gap: 14, paddingTop: 4, borderTop: '1px dashed #2a3340' }}>
                <p style={{ fontSize: 12, color: '#caa24e', margin: '8px 0 -2px', fontWeight: 600 }}>Low score — opening the reset.</p>
                <Field label="What happened" hint="One line — just the trigger." optional
                  value={f.what ?? ''} onChange={v => set({ what: v })} />
                <Field label="Body right now" hint="Where you feel it — jaw, chest, gut, shoulders." optional
                  value={f.body ?? ''} onChange={v => set({ body: v })} />
                <Field label="One reframe or next step" optional rows={2}
                  value={f.step ?? ''} onChange={v => set({ step: v })} />
              </div>
            )}
          </div>
        )}

        {kind === 'reset' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="What happened" hint="One line — just the trigger."
              value={f.what ?? ''} onChange={v => set({ what: v })} />
            <Field label="Body right now" hint="Where you feel it — jaw, chest, gut, shoulders."
              value={f.body ?? ''} onChange={v => set({ body: v })} />
            <Field label="One reframe or next step" rows={2}
              value={f.step ?? ''} onChange={v => set({ step: v })} />
          </div>
        )}

        {kind === 'evening' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="How the day actually went" rows={4}
              value={f.went ?? ''} onChange={v => set({ went: v })} />
            <Field label="Tomorrow's first action" hint="Becomes the check against tomorrow's morning entry." rows={2}
              value={f.tomorrow ?? ''} onChange={v => set({ tomorrow: v })} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button onClick={() => onCommit(f)} disabled={!ok}
          style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600,
            cursor: ok ? 'pointer' : 'not-allowed',
            background: ok ? '#caa24e' : '#252b34', color: ok ? '#0c1016' : '#566072', opacity: ok ? 1 : 0.6 }}>
          {mode === 'edit' ? 'Save changes' : ok ? 'Log it' : 'Pick a score to log'}
        </button>
        {mode === 'edit'
          ? <button onClick={onCancelEdit} style={{ padding: '14px 16px', borderRadius: 10, border: '1.5px solid #232a36', background: 'transparent', color: '#8b95a5', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          : <button onClick={onDiscardRequest} style={{ padding: '14px 16px', borderRadius: 10, border: '1.5px solid #232a36', background: 'transparent', color: '#8b95a5', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Discard</button>
        }
      </div>
    </div>
  )
}
