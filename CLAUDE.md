# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Second Chance** is a retro arcade-style CompTIA A+ quiz game (130 questions). It runs as a static single-page app — no build step, no server, no dependencies to install. Open `game.html` in any browser.

**Live site:** https://msagen2241.github.io/second-chance/
**Deploy:** push `master` → GitHub Pages auto-deploys.

## Adding Questions

1. Edit `courses/comptia.json` — add to the `questions[]` array using the schema:
   ```json
   { "id": "q131", "q": "...", "category": "Security", "correct": 0,
     "distractors": ["...", "...", "..."], "explain": "..." }
   ```
   `correct` is the index into the shuffled answers; `distractors` are the wrong answers.

2. Mirror the change in `js/course-data.js` — this bundled copy is used when `game.html` is opened via `file://` (fetch is blocked in that context). The file exports `window.COURSE_DATA`. Regeneration command is in `AGENTS.md`.

3. Commit and push.

## Architecture

**Entry point:** `game.html` inline script opens IndexedDB, loads courses, and calls `Core.renderStart()`.

**Script load order matters** (no bundler). `game.html` loads them in dependency order:
`storage.js` → `spaced.js` → `errorlog.js` → `gameplay.js` → `audio.js` → `analytics.js` → `progression.js` → `juice.js` → `touch.js` → `courses.js` → `course-data.js` → `core.js`

**Key modules:**

| File | Responsibility |
|------|---------------|
| `js/core.js` | Game loop, all screen rendering, `handleAnswer()`, deck building for every mode |
| `js/storage.js` | IndexedDB wrapper (database: `second_chance_v2` v5, 6 object stores) |
| `js/spaced.js` | SM-2 spaced repetition — `questionStrength` records keyed `courseId_qId` |
| `js/errorlog.js` | Answer history; drives Weakness/Cram/Red Flag study modes |
| `js/analytics.js` | Per-session logging; powers the stats modal and 7-day history |
| `js/audio.js` | Web Audio API SFX; music is intentionally disabled (`playTrack` is a no-op) |
| `js/juice.js` | Particles, screen shake, flash overlays, floating text |
| `js/touch.js` | Hammer.js gesture handling (swipe to advance, tap for answers) |
| `js/progression.js` | XP/level/skill tree — **disabled** (`Progression.enabled = false`); code kept but gated |

**Styling:** `css/base.css` (all visuals, ~1,600 lines) + `css/touch.css` (responsive overrides for small screens).

**Data:** `courses/comptia.json` — 130 questions across 4 CompTIA domains (OS 60, Security 34, Software Troubleshooting 20, Operational Procedures 16). Boss questions have `"isBoss": true`.

## Modes & Retry Logic

The second-chance retry loop is the central mechanic: a missed question is **reinserted a few positions later** (not at deck end) and stays in circulation as a `RETRY` item until answered correctly. All non-streak modes use this. Streak mode ends on the first miss with no retry.

Study tools (Category, Weakness, Cram, Review Due, etc.) build filtered decks in `core.js` before starting the same game loop.

## IndexedDB Schema (v5)

| Store | Key | Notes |
|-------|-----|-------|
| `settings` | `id` | Includes `saved_session_v1` (manual save/resume state) and music/SFX toggles |
| `perCourse` | `courseId` | High scores |
| `questionStrength` | `courseId_qId` | SM-2 fields: `strength`, `interval`, `ease`, `nextReview`, `timesCorrect`, `timesMissed` |
| `questionLog` | auto-increment | Every answer attempt; indexed by `courseId`, `qId`, `timestamp` |
| `sessionLog` | auto-increment | Session summaries with category breakdown |
| `progression` | `id` | XP/levels (unused while disabled) |

Schema upgrades wipe user data — bump the version constant carefully.

## Non-Obvious Details

- **`courses.js` dual-load:** detects `window.location.protocol === 'file:'` and falls back to `window.COURSE_DATA` (from `course-data.js`) if `fetch()` fails.
- **Progression gate:** re-enable by setting `Progression.enabled = true` in `progression.js`; the UI hooks are already wired.
- **Music slider:** visible in settings UI but non-functional (music disabled by design).
- **Boss questions:** 6 questions with `"isBoss": true`; trigger particle burst + banner via `juice.js`.
- **Pretest mode:** hides explanations during the first (preview) pass, then auto-starts a full study pass on the same deck.

## Git Policy

Commit `game.html`, `index.html`, `css/`, `js/`, `courses/`, `AGENTS.md`, `CLAUDE.md`, `docs/`.
Do not commit `repomix-output.xml`, `handoff.md`, `.qwen/`, `.agents/`, or `.codex`.
