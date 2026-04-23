# Second Chance — Context Handoff

## Project name & one‑line goal

**Second Chance** — A retro arcade-style quiz game for studying CompTIA exam material. Modular v2 with spaced repetition, error analysis, focused study modes, progression system, and session analytics.

## Tech stack & key tools

- **Modular vanilla JS** — separate files in `js/`, loaded via `<script>` tags in `game.html`. No bundlers, no frameworks.
- **Google Fonts** — VT323 (headers), JetBrains Mono (body) — requires internet
- **Hammer.js 2.0.8** — CDN for swipe/tap gesture support
- **Tone.js** — 16-bit SFX only (music disabled, `playTrack()` is no-op)
- **IndexedDB v4** — `second_chance_v2` database. Stores: `progression`, `perCourse`, `settings`, `questionStrength`, `questionLog`, `sessionLog`
- **Git** — `master` branch (live), conventional commits
- **Qwen Code** — project managed via Qwen with superpowers skills

## Live site

`https://msagen2241.github.io/second-chance/`

## Current state of the project

### What works (all features live on master)

| Feature | Details |
|---------|---------|
| **Game modes** | Normal (3 lives, retry loop), Streak (no lives, ends on first miss), Review (replay missed) |
| **Study modes** | Category (pick one), Weakness (auto bottom 2), Cram (30 most-missed), Review Due (spaced repetition queue) |
| **Spaced repetition** | SM-2 algorithm in `spaced.js` — tracks per-question strength (0-100), interval (days), ease factor (1.3-3.0) |
| **Error log** | `errorlog.js` — logs every answer; powers Category/Weakness/Cram study modes via `getMistakes`, `getMostMissed`, `getCategoryAccuracy` |
| **Session analytics** | `analytics.js` — start/end session per run, 7-day history, category accuracy trends, stats modal on start screen |
| **Progression** | XP, levels (cap 50), skill tree (0-10 per category), achievements (7 defined), study streaks, level-up toast notification |
| **Power-ups** | Every 5th correct answer or boss defeat → reward screen with 2-3 options (Freeze, Double or Nothing, Quick XP) |
| **Boss questions** | 6 flagged in `courses/comptia.json`, visual banner, extra XP, particle effects on defeat |
| **Juice effects** | `juice.js` — particles, screen shake, flash overlays, floating text, animated UI |
| **Touch + keyboard** | Hammer.js swipe/tap, `1-4` to answer, `Enter` to continue |
| **Category breakdown** | End screen bar chart sorted by lowest accuracy first |
| **MENU button** | "MENU" button on every question screen returns to start |

### Question data

- **51 questions** in `courses/comptia.json`, tagged with CompTIA domains
- Categories: Operating Systems (19), Security (16), Software Troubleshooting (9), Operational Procedures (7)
- Question format: `{ q, category, correct, distractors[], explain, isBoss? }`

### Dead code (safe to remove later)

- `Gameplay.renderReward()` — duplicate of `Core.renderRewardScreen()`, never called
- `Gameplay.comboBonus()` / `Gameplay.getComboTimerHTML()` — always return 0/`''` (combo timer removed per "no anxiety timers" preference)
- `Gameplay.onBossDefeat()` — called but empty function body
- `Progression.categoryMultiplier()` — `awardXP()` does the math inline

## Important design decisions

- **Modular architecture** — separate JS files, no imports (global objects: `Core`, `Audio`, `Storage`, `Courses`, `Progression`, `Gameplay`, `Juice`, `ErrorLog`, `Spaced`, `Analytics`)
- **`renderStart()` and `render()` are async** — must be awaited (renderStart fetches spaced repetition due count from IndexedDB)
- **SFX only** — music disabled, `Audio.playTrack()` is no-op. `Audio.sfx()` handles correct/wrong/click/streak sounds
- **DB v4 upgrade clears progression** — prevents old XP/level from v1 carrying over to new schema
- **No anxiety timers** — combo timer removed entirely per user preference
- **Level-up notification** — centered toast, 2.5s duration, streak SFX, auto-dismiss
- **Deck model** — `{ id, question, isRetry }` entries for missed-question recycling in Normal mode
- **Review semantics** — `state.missed` tracks unresolved question IDs; correctly answered retries are removed from pool

## File map

### Main files

| File | Summary |
|------|---------|
| `game.html` | Entry point — loads all CSS/JS, initializes game |
| `index.html` | GitHub Pages redirect to `game.html` |
| `courses/comptia.json` | 51 CompTIA questions with categories and boss flags |

### CSS

| File | Summary |
|------|---------|
| `css/base.css` | Main styles — includes study tools grid, category picker, session summary, stats modal, skill tree, level-up notification, juice effects |
| `css/touch.css` | Touch-specific responsive overrides |

### JavaScript

| File | Summary |
|------|---------|
| `js/core.js` | Game loop, screen rendering, `handleAnswer`, all study mode starters (`startCategory`, `startWeakness`, `startCram`, `startReviewDue`), `renderStatsModal`, `renderRewardScreen` |
| `js/audio.js` | Tone.js SFX (music disabled) |
| `js/storage.js` | IndexedDB v4 wrapper with `getAll`/`getByIndex` helpers |
| `js/courses.js` | Course loader, `getCategories()`, available courses registry |
| `js/progression.js` | XP, levels, skill tree, achievements, study streaks, level-up toast |
| `js/gameplay.js` | Power-ups (Freeze, Double or Nothing), boss logic, reward options generation |
| `js/juice.js` | Particles, screen shake, flash, floating text |
| `js/touch.js` | Hammer.js touch handling |
| `js/errorlog.js` | Answer logging, `getMistakes`, `getMostMissed`, `getCategoryAccuracy` |
| `js/spaced.js` | SM-2 spaced repetition: `getDueQuestions`, `recordAnswer`, `strengthMultiplier`, `initCourse` |
| `js/analytics.js` | `startSession`, `endSession`, `recordAnswer`, `getSessionHistory`, `getTrend`, `getSessionSummary` |

### Docs

| File | Summary |
|------|---------|
| `AGENTS.md` | Full project docs — features, file structure, how to add questions/courses, dev notes |
| `.qwen/PROJECT_SUMMARY.md` | Agent handoff — feature status table, key knowledge, next steps |
| `handoff.md` | This file |

## Run instructions

**No server needed.** Open `game.html` in any modern browser.

For local dev with live reload: `python -m http.server 8080` in project root, then `http://localhost:8080/game.html`.

## Constraints & preferences

- **No bundlers, no npm** — pure vanilla JS loaded via `<script>` tags
- **No anxiety-inducing timers** — removed combo timer
- **Simple commands** — no unnecessary shell tricks
- **Worktrees for feature isolation** — preferred workflow
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:` types
- **English output only** — hard requirement
- **Caveman mode available** — terse communication for token efficiency

## Adding content

### New questions
Edit `courses/comptia.json`, add object matching existing shape. Add `"isBoss": true` for boss questions.

### New courses
1. Create `courses/newcourse.json` with same format
2. Add entry to `Courses.available` in `js/courses.js`:
   ```js
   { id: 'newcourse', name: 'Course Name', file: 'courses/newcourse.json' }
   ```
3. Course selector auto-discovers it

## Next 5 concrete actions

1. **Add a second course** — validates multi-course selector and cross-course study modes
2. **Clean up dead code** — remove `Gameplay.renderReward()`, dead combo timer functions, empty `onBossDefeat()`
3. **Mobile PWA manifest** — add `manifest.json` + service worker for install-on-home-screen
4. **Real device testing** — verify touch gestures, study modes, and stats modal on actual mobile
5. **Consider inlining Hammer.js** if offline support is desired

## Resume prompt

> I'm working on "Second Chance", a modular vanilla JS arcade quiz game for CompTIA exam study. All study-tools features are live on master: spaced repetition (SM-2), error log, 4 study modes (Category/Weakness/Cram/Review Due), session analytics, progression (XP/levels/skill tree/achievements), power-up reward screen, boss questions, juice effects. The project uses separate JS files (no bundlers), IndexedDB v4, SFX only (no music). Entry point is `game.html`. I need to continue working on it — here's the full handoff document.
