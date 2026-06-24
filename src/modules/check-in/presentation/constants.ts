import type { Kind, CheckInRecord } from '../domain/check-in.js'

export interface ScaleEntry {
  v: number
  name: string
  note: string
}

export const SCALE: ScaleEntry[] = [
  { v: 0, name: 'Shut down',          note: "Can't function; can't initiate even basic tasks." },
  { v: 1, name: 'Barely holding',     note: 'Going through motions, everything is effort, withdrawing.' },
  { v: 2, name: 'Depleted but moving', note: 'Functioning but running on empty, low initiation.' },
  { v: 3, name: 'Neutral / stable',   note: 'Not struggling, not energized; baseline.' },
  { v: 4, name: 'Engaged',            note: 'Initiating, focused, handling normal load without strain.' },
  { v: 5, name: 'Strong',             note: 'Energized, clear, ahead of things, present with people.' },
  { v: 6, name: 'Peak',               note: 'Fully on, creative, expansive capacity.' },
]

export const SCALE_COLOR: Record<number, string> = {
  0: '#5b6472',
  1: '#6d6f86',
  2: '#6f7d99',
  3: '#7d93a6',
  4: '#8aa78f',
  5: '#b3a866',
  6: '#caa24e',
}

export interface KindMeta {
  label: string
  fn: string
  blurb: string
  window: string
}

export const KINDS: Record<Kind, KindMeta> = {
  morning: { label: 'Morning',         fn: 'Activation', blurb: 'Set the day up well: a score and one small action to start strong.',                  window: 'until ~11am' },
  midday:  { label: 'Midday',          fn: 'Scan',       blurb: "A check: did anything get to you? Score, plus a light note. Expands if you're low.", window: 'midday'      },
  evening: { label: 'Evening',         fn: 'Reflection', blurb: "The real entry. Score, open reflection, and tomorrow's first action.",                window: 'evening'     },
  reset:   { label: 'I need to reset', fn: 'Reset',      blurb: 'Spun up right now. Name it, locate it in the body, find one next step.',             window: 'any time'    },
}

export const dayKey = (d: Date = new Date()): string => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}

export const stamp = (): string => new Date().toISOString()

export const uid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function summarize(r: CheckInRecord): string {
  const bits = [r.first, r.note, r.what, r.body, r.step, r.went, r.tomorrow].filter(Boolean)
  if (!bits.length) return 'score only'
  const s = bits.join(' · ')
  return s.length > 64 ? s.slice(0, 63) + '…' : s
}
