# Glossary

Ubiquitous language for the Emotional Hygiene domain. Use these terms consistently in code, commits, and conversation.

---

## Core concepts

**check-in**
Any of the four entry types: morning, midday, evening, or reset. The general term when the specific kind doesn't matter.

**kind**
The type of a check-in. One of `morning | midday | evening | reset`. Stored on every record; drives field rendering and slot logic.

**capacity score**
A 0–6 integer measuring observable functional capacity — what you can do, not how you feel. Required on every check-in; always entered first. The same scale applies at every kind so the daily curve is comparable.

**slot**
A once-per-day check-in position: morning, midday, or evening. Tapping a filled slot opens it in edit mode; it does not create a second entry. Enforced at commit time.

**event**
A check-in that can occur multiple times per day. Only the reset is an event. Resets accumulate; they are never treated as a slot.

**draft**
An in-progress check-in that has not been committed. Autosaved aggressively. Owns the whole UI — nothing else is accessible while a draft is open. There is never more than one draft at a time.

**record**
A committed check-in. Immutable except through `applyEdit`, which appends the prior state to `revisions` before writing changes.

**revision**
A prior snapshot of a record, stored in `record.revisions[]` each time the record is edited. The original creation timestamp is always preserved; only field values and score change.

---

## Check-in kinds

**morning** *(activation)*
Sets the day up. Score + one forward-pointing first action. No open reflection.

**midday** *(scan)*
A lightweight check for whether anything has gotten to you. Score + optional note. Expands inline into reset fields if score ≤ 2 — the number drives expansion automatically, no toggle.

**evening** *(reflection)*
The primary narrative entry. Score + open reflection on the day + tomorrow's first action.

**reset** *(reset ritual)*
For when you're triggered or dysregulated. Score + what happened + body sensation + one reframe or next step. Reachable from the home screen; not accessible while a draft is open.

---

## History navigation

**anchor**
The date string (`YYYY-MM-DD`) currently in view in History. In day stride it is the selected date; in week stride it is any date within the selected week (the week is derived from it).

**stride**
The navigation unit in History: `day` or `week`. Persisted in settings. Determines how the older/newer buttons step and how the window label is displayed.

**window**
The set of dates visible for a given anchor and stride. A day window is one date; a week window is a Sunday-through-Saturday range. Only dates that have at least one entry appear in the list.

---

## Data model

**schema version (`v`)**
An integer stored on every record. Incremented when the record shape changes. Records with an unknown future version are quarantined rather than dropped or silently corrupted.

**quarantine**
Records whose schema version is newer than the app's `CURRENT_SCHEMA` are set aside in localStorage under a separate key. They are never modified and can be recovered after an app update.

**migration**
A pure function `(record) => record` that advances a record from schema version `n` to `n+1`. Migrations are composed in order; the chain runs automatically on load.
