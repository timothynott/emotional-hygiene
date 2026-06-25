# Milestones

## Milestone 0 — Web MVP: measurement on the phone ✓

**Status:** Complete — 2026-06-24  
**Goal:** A deployable PWA the user can install on their phone and immediately start recording data.

**Scope:**
- Morning, midday, evening check-ins and the reset ritual
- 0–6 capacity scale (observable anchors, score always required and always first)
- Midday auto-expansion: score ≤ 2 reveals reset fields inline, no toggle
- Draft system: one draft at a time, owns the whole UI, aggressive autosave
- Discard three-way fork: Save & finish later / Discard / Don't ask again
- Edit mode: saved records are editable with full revision history
- History view: day-grouped, stride navigation (day/week), calendar month popup
- Deployed to Cloudflare Pages via GitHub; installable as PWA

**Deferred to later milestones:**
- Clinical instruments (PHQ-9 / GAD-7)
- Therapist report
- Scheduled push notifications

---

## Milestone 1 - Coping mechanism quick reference

**Goal:** An editable list of quick reference coping mechanisms that is accessible from the home page
**Scope:**
- CRUD the list comprising of coping mechanisms defined as
  - Title
  - Description
- Static footer on the home page to bring up the list and click through to the description.

## Milestone 2 — Clinical instruments

**Goal:** Add validated screening tools for periodic severity tracking.

**Scope:**
- PHQ-9 (depression) and GAD-7 (anxiety), weekly/biweekly cadence
- Scores displayed as validated severity bands only — no interpretation beyond the band
- PHQ-9 item 9 (self-harm): recorded, never interpreted, no intervention text
- Trend chart of band scores over time
- Therapist report: date-range export of mood curve + PHQ-9/GAD-7 + check-in notes
- "Remember this date" marker for anchoring the next report

---

## Milestone 3 — Native: notifications and reliability

**Goal:** Port to React Native (or equivalent cross-platform framework) for dependable scheduled notifications and deep links — the load-bearing features the web app cannot provide.

**Scope:**
- Midday check-in notification (the core trigger)
- Morning and evening reminders
- Bi-weekly reminder for clinical instruments or during an export?
- Deep links from notification into the correct check-in form
- Data migration path from the web PWA (export → import)
- iOS + Android distribution

---

## Milestone 4 — AI-driven personalization

**Goal:** Let the user direct what the instrument tracks, at what granularity, and how.

**Scope (directional — details TBD):**
- User-defined tracking dimensions beyond capacity (energy, focus, pain, etc.)
- Custom scale anchors: user describes their own observable markers per level
- Custom schemas: user adds, removes, or renames check-in fields
- AI-assisted anchor calibration: conversation-based help defining what each score level means *for this person*
- Schema versioning and migration (extending the existing versioned record model)
