# Project Summary

## Overall Goal
Second Chance — modular arcade quiz game for studying CompTIA exam material. All study-tools features (spaced repetition, error analysis, focused study modes, analytics) are built, wired, and live on master.

## Key Knowledge
- **Project root:** `D:\AI\Projects\Document-Memory\Games\Second Chance`
- **Branch:** `master` (live); `feature/study-tools` exists but is merged and no longer needed
- **Live URL:** `https://msagen2241.github.io/second-chance`
- **Tech:** Vanilla HTML/CSS/JS, IndexedDB v5, Google Fonts + Hammer.js via CDN. No bundlers.
- **Entry point:** `game.html` (not `Second_Chance.html`)
- **IndexedDB:** `second_chance_v2`, **DB_VERSION 5**
  - Stores: `progression`, `perCourse`, `settings`, `questionStrength` (with `nextReview` index), `questionLog` (with `courseId`/`qId`/`timestamp` indexes), `sessionLog`
  - v5 upgrade clears old progression/profile data to prevent stale XP/level carryover
- **Modules:** `core.js`, `audio.js`, `storage.js`, `courses.js`, `progression.js`, `gameplay.js`, `juice.js`, `touch.js`, `errorlog.js`, `spaced.js`, `analytics.js`
- **Audio:** Music **disabled** (`playTrack` is no-op). SFX only via `Audio.sfx()`.
- **Main modes:** Normal, Study, Streak, Review
- **9 study tools:** Category, Weakness, Cram, Review Due, Interleave Weakness, Confidence, Red Flag, Pretest, Quickfire
- **Question count:** 130 total
- **Retry loop:** missed questions are requeued a few questions later until answered correctly; visible as `RETRY`
- **Progression:** disabled at runtime via `Progression.enabled = false`, code retained
- **`renderStart()` and `render()` are async** — must be awaited
- **User preferences:** No anxiety-inducing timers, simple commands, worktrees for feature isolation

## All Features Status
| Feature | Status |
|---------|--------|
| Normal/Study/Streak/Review modes | ✅ wired |
| Category/Weakness/Cram/Review Due study tools | ✅ wired |
| Interleave Weakness / Confidence / Red Flag / Pretest / Quickfire | ✅ wired |
| Lives system + second-chance retry loop | ✅ wired |
| Spaced repetition (SM-2) | ✅ wired |
| Error log + mistake queries | ✅ wired |
| Session analytics + stats modal | ✅ wired |
| XP/levels/achievements/study streaks | ⏸ disabled |
| Level-up toast notification | ⏸ disabled |
| Power-up reward screen | ❌ removed from runtime |
| Boss questions (6 flagged) | ✅ wired |
| Juice effects (particles, shake, flash) | ✅ wired |
| Touch + keyboard support | ✅ wired |
| MENU button on every question | ✅ wired |
| SFX only (no music) | ✅ wired |

## Dead Code (safe to remove later)
- `Gameplay.comboBonus()` — always returns 0 (combo timer removed per user preference)
- `Gameplay.getComboTimerHTML()` — always returns `''`
- `Gameplay.onBossDefeat()` — called but empty function body
- `Progression.categoryMultiplier()` — `awardXP()` does the math inline

## Current Plan
Current working set:
- Question bank now contains 130 CompTIA questions and the bundled fallback matches it
- Review Due now falls back to next-up scheduled cards instead of dead-clicking when nothing is overdue
- Quickfire mode now auto-advances after right/wrong feedback and keeps retry recycling
- Save/resume is available from the in-run HUD and start screen

---

## Summary Metadata
**Update time**: 2026-05-06T00:00:00.000Z
