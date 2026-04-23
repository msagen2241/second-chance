# Second Chance — CompTIA Redemption Run

## Project Overview

A single-page, retro-horizonal arcade-style quiz game for studying CompTIA exam material (Test 1 review). The game presents 51 randomly shuffled multiple-choice questions with a pixel-art aesthetic (VT323 + JetBrains Mono fonts, cyan/pink/green/yellow palette on a dark grid background).

### Features

- **3 game modes** — Normal (3 lives with missed-question recycling until correct), Streak (no lives, ends on first miss), Review (replay unresolved missed questions)
- **4 study modes** — Category (pick one), Weakness (auto bottom 2 categories), Cram (30 most-missed), Review Due (spaced repetition queue)
- **Mode picker** — toggle between Normal and Streak on the start screen
- **Lives system** — 3 hearts; lose one per wrong answer (Normal mode only)
- **Second-chance retry loop** — in Normal mode, a missed question is appended back into the deck as a `RETRY` item and stays in circulation until answered correctly
- **Streak bonus** — consecutive correct answers earn escalating bonus points (up to +100)
- **Question categories** — all 51 questions tagged with CompTIA exam domains (Operating Systems, Security, Software Troubleshooting, Operational Procedures)
- **Category breakdown** — end screen shows colored bar chart sorted by lowest accuracy first
- **Randomized deck** — questions and answer order shuffle each run
- **Persistent high score** — saved via IndexedDB (`hiscore_v1`)
- **End-of-run grading** — S/A/B/C/D/F based on accuracy (normal mode only)
- **Progression system** — XP, levels (cap 50), skill tree (0-10 per category), achievements, study streaks
- **Power-up reward screen** — every 5th correct answer or boss defeat pauses for player to pick from 2-3 power-ups (Freeze, Double or Nothing, Quick XP)
- **Boss questions** — 6 flagged questions with visual banner, extra XP, particle effects on defeat
- **Juice effects** — screen shake, particles, flash overlays, floating text, animated UI
- **Touch support** — Hammer.js CDN, swipe to advance, adaptive touch targets
- **Keyboard support** — press `1-4` to answer, `Enter` to continue
- **Study analytics** — session tracking, 7-day history, category accuracy trends, stats modal
- **Spaced repetition** — SM-2 algorithm tracks per-question strength (0-100), interval, ease factor; "Review Due" mode queues overdue questions
- **Error log** — every answer logged; powers Category/Weakness/Cram study modes
- **Level-up notification** — centered toast with level + skill point indicator
- **SFX only** — music disabled, sound effects (Tone.js 16-bit) remain
- **GitHub Pages ready** — root `index.html` redirects to `game.html`

### Game Data

Questions live in `courses/comptia.json` (51 questions covering IT change management, wireless security, Linux commands, Windows troubleshooting, networking, password attacks, and more). Each question has a `category` field for the CompTIA domain breakdown.

**Category distribution:**
| Category | Count | Color |
|----------|-------|-------|
| Operating Systems | 19 | cyan |
| Security | 16 | pink |
| Software Troubleshooting | 9 | green |
| Operational Procedures | 7 | yellow |

## How to Play

Open `game.html` locally in any modern browser, or use the GitHub Pages deployment. No server or build step required.

**Live site:**
`https://msagen2241.github.io/second-chance/`

### Normal Mode
1. Click **▶ PRESS START** (or press `Enter`/`Space`)
2. Answer each question by clicking an option or pressing `1-4`
3. Read the feedback, then press `Enter` to advance
4. If you miss a question, it loses a heart and is queued to return later as `RETRY`
5. Once you answer that repeated question correctly, it leaves the missed pool
6. Every 5th correct answer → power-up reward screen (pick from 2-3 options)
7. Lose all 3 hearts → Game Over; clear the deck and all queued retries → Victory
8. Beat your high score to appear on the leaderboard
9. After a run, click "Review Missed (N)" to replay only unresolved missed questions

### Streak Mode
1. Toggle **STREAK** on the start screen
2. Answer questions — no lives, keep going until you miss one
3. Score = streak count + escalating bonus (same as Normal mode)
4. End screen shows your streak length and score

### Study Modes
- **Category** — pick a specific CompTIA domain, drill only those questions
- **Weakness** — auto-selects your bottom 2 categories by accuracy
- **Cram** — pulls the 30 most-missed questions from your error log
- **Review Due** — spaced repetition queue; shows only questions where `nextReview <= now`

## File Structure

```
Second Chance/
├── game.html                       # Main entry point (modular v2)
├── index.html                      # GitHub Pages entrypoint; redirects to game.html
├── GitHub_Pages_Upload_Workflow.md # Beginner guide for the GitHub/GitHub Pages workflow
├── AGENTS.md                       # This file
├── .qwen/PROJECT_SUMMARY.md        # Running project summary for agent handoff/context
├── courses/
│   └── comptia.json                # 51 CompTIA questions (categories, boss flags)
├── css/
│   ├── base.css                    # Main styles (includes study tools, juice, progression)
│   └── touch.css                   # Touch-specific responsive overrides
└── js/
    ├── core.js                     # Game loop, screen rendering, handleAnswer
    ├── audio.js                    # Tone.js SFX (music disabled, playTrack is no-op)
    ├── storage.js                  # IndexedDB v4 wrapper (progression, perCourse, settings, questionStrength, questionLog, sessionLog)
    ├── courses.js                  # Course loader, category queries
    ├── progression.js              # XP, levels, skill tree, achievements, study streaks
    ├── gameplay.js                 # Power-ups (freeze, double-or-nothing), boss logic, combo timer (dead)
    ├── juice.js                    # Particles, screen shake, flash, floating text
    ├── touch.js                    # Hammer.js touch handling
    ├── errorlog.js                 # Answer logging, mistake queries, category accuracy
    ├── spaced.js                   # SM-2 spaced repetition algorithm
    └── analytics.js                # Session tracking, trends, stats queries
```

## Development Notes

- **Modular architecture** — separate JS/CSS files loaded via `<script>` tags in `game.html`. No bundlers.
- **Fonts** — loaded from Google Fonts (`VT323` for headers, `JetBrains Mono` for body). Requires internet connection.
- **IndexedDB v4** — `second_chance_v2` database. Schema upgrade clears old progression data. Stores: `progression`, `perCourse`, `settings`, `questionStrength` (with `nextReview` index), `questionLog` (with `courseId`/`qId`/`timestamp` indexes), `sessionLog`.
- **`renderStart()` is async** — must be awaited (fetches spaced repetition due count). Has try/catch fallback.
- **`render()` is async** — properly awaits `renderStart()`.
- **Responsive** — single-column layout on screens < 560px.
- **Deck model** — runtime deck uses `{ id, question, isRetry }` entries for missed-question recycling.
- **Review semantics** — `state.missed` tracks unresolved question IDs; correctly answered retries are removed from the pool.
- **SFX only** — `Audio.playTrack()` is a no-op. `Audio.sfx()` handles correct/wrong/click/streak sounds.
- **Level-up notification** — centered toast, 2.5s duration, streak SFX, auto-dismiss.
- **Publishing** — pushing `master` to `origin` rebuilds GitHub Pages at `https://msagen2241.github.io/second-chance/`

## Adding New Questions

1. Open `courses/comptia.json`
2. Add a new object to the array matching the existing shape:

```js
{
  q: "Your question here?",
  category: "Operating Systems",  // Operating Systems | Security | Software Troubleshooting | Operational Procedures
  correct: "Correct answer",
  distractors: ["Wrong A", "Wrong B", "Wrong C"],
  explain: "Why the correct answer is right."
}
```

3. To make a question a boss, add `"isBoss": true`.

## Adding New Courses

1. Create `courses/newcourse.json` with the same format as `comptia.json`
2. Add an entry to `Courses.available` in `js/courses.js`:

```js
{ id: 'newcourse', name: 'Course Name', file: 'courses/newcourse.json' }
```

3. The course selector on the start screen will auto-discover it.

## Building & Running

No build step. Open `game.html` in any modern browser.

For GitHub Pages, push committed changes on `master` to `origin`.
