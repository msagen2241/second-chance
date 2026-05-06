# Second Chance — CompTIA Redemption Run

## Project Overview

A single-page, retro-horizonal arcade-style quiz game for studying CompTIA exam material (Test 1 review). The game presents 130 randomly shuffled multiple-choice questions with a pixel-art aesthetic (VT323 + JetBrains Mono fonts, cyan/pink/green/yellow palette on a dark grid background).

### Features

- **4 main game modes** — Normal (3 lives with missed-question recycling until correct), Study (infinite lives, no power-ups), Streak (no lives, ends on first miss), Review (replay unresolved missed questions)
- **9 study tools** — Category (pick one), Weakness (auto bottom 2 categories), Cram (30 most-missed), Review Due (spaced repetition queue), Interleave Weakness, Confidence, Red Flag, Pretest, Quickfire
- **Mode picker** — toggle between Normal, Study, and Streak on the start screen
- **Lives system** — 3 hearts; lose one per wrong answer (Normal mode only)
- **Second-chance retry loop** — in all non-streak quiz flows, a missed question is requeued a few questions later as a `RETRY` item and stays in circulation until answered correctly
- **Streak bonus** — consecutive correct answers earn escalating bonus points (up to +100)
- **Question categories** — all 130 questions tagged with CompTIA exam domains (Operating Systems, Security, Software Troubleshooting, Operational Procedures)
- **Category breakdown** — end screen shows colored bar chart sorted by lowest accuracy first
- **Randomized deck** — questions and answer order shuffle each run
- **Manual save/resume** — save an in-progress run from the game HUD and resume it later from the start screen
- **Persistent high score** — saved via IndexedDB (`hiscore_v1`)
- **End-of-run grading** — S/A/B/C/D/F based on accuracy (normal mode only)
- **Progression system disabled** — XP, levels, skill tree, achievements, and study streak tracking remain in code/storage but are hidden and inactive for now
- **Boss questions** — 6 flagged questions with visual banner, extra XP, particle effects on defeat
- **Juice effects** — screen shake, particles, flash overlays, floating text, animated UI
- **Touch support** — Hammer.js CDN, swipe to advance, adaptive touch targets
- **Keyboard support** — press `1-4` to answer, `Enter` to continue
- **Study analytics** — session tracking, 7-day history, category accuracy trends, stats modal
- **Spaced repetition** — SM-2 algorithm tracks per-question strength (0-100), interval, ease factor; "Review Due" mode prioritizes overdue questions, then falls back to next-up scheduled review cards
- **Error log** — every answer logged; powers Category/Weakness/Cram study modes
- **Level-up notification** — centered toast with level + skill point indicator
- **SFX only** — music disabled, sound effects (Tone.js 16-bit) remain
- **GitHub Pages ready** — root `index.html` redirects to `game.html`

### Game Data

Questions live in `courses/comptia.json` (130 questions covering IT change management, wireless security, Linux commands, Windows troubleshooting, networking, password attacks, missed practice-test questions, and more). Each question has a `category` field for the CompTIA domain breakdown. `js/course-data.js` contains the same course data as a bundled fallback so `game.html` works when opened directly via `file://`, where browsers block `fetch('courses/comptia.json')`.

**Category distribution:**
| Category | Count | Color |
|----------|-------|-------|
| Operating Systems | 60 | cyan |
| Security | 34 | pink |
| Software Troubleshooting | 20 | green |
| Operational Procedures | 16 | yellow |

## How to Play

Open `game.html` locally in any modern browser, or use the GitHub Pages deployment. No server or build step required.

**Live site:**
`https://msagen2241.github.io/second-chance/`

### Normal Mode
1. Click **▶ PRESS START** (or press `Enter`/`Space`)
2. Answer each question by clicking an option or pressing `1-4`
3. Read the feedback, then press `Enter` to advance
4. If you miss a question, it loses a heart and is queued to return soon as `RETRY`
5. Once you answer that repeated question correctly, it leaves the missed pool
6. Lose all 3 hearts → Game Over; clear the deck and all queued retries → Victory
7. Beat your high score to appear on the leaderboard
8. After a run, click "Review Missed (N)" to replay only unresolved missed questions

### Study Mode
1. Toggle **STUDY** on the start screen
2. Answer questions with infinite lives
3. Missed questions are requeued as `RETRY` items until you answer them correctly
4. The run ends only after the deck and all queued retries are cleared

### Streak Mode
1. Toggle **STREAK** on the start screen
2. Answer questions — no lives, keep going until you miss one
3. Score = streak count + escalating bonus (same as Normal mode)
4. End screen shows your streak length and score

### Study Modes
- **Category** — pick a specific CompTIA domain, drill only those questions
- **Weakness** — auto-selects your bottom 2 categories by accuracy
- **Cram** — pulls the 30 most-missed questions from your error log
- **Review Due** — spaced repetition queue; shows overdue questions first, then next-up scheduled review cards
- **Interleave Weakness** — mixes your weakest categories in an infinite-lives study run
- **Confidence** — after each answer, you rate `GUESSED` or `SURE`; guessed correct answers are requeued for reinforcement
- **Red Flag** — focuses on most-missed and lowest-strength spaced-repetition questions
- **Pretest** — runs a no-explanation preview pass first, then automatically starts a full study pass on the same deck
- **Quickfire** — instant right/wrong feedback, then auto-advances to the next question without a `NEXT` click

## File Structure

```
Second Chance/
├── game.html                       # Main entry point (modular v2)
├── index.html                      # GitHub Pages entrypoint; redirects to game.html
├── GitHub_Pages_Upload_Workflow.md # Beginner guide for the GitHub/GitHub Pages workflow
├── AGENTS.md                       # This file
├── .qwen/PROJECT_SUMMARY.md        # Running project summary for agent handoff/context
├── courses/
│   └── comptia.json                # 130 CompTIA questions (categories, boss flags)
├── css/
│   ├── base.css                    # Main styles (includes study tools, juice, progression)
│   └── touch.css                   # Touch-specific responsive overrides
└── js/
    ├── core.js                     # Game loop, screen rendering, handleAnswer
    ├── audio.js                    # Tone.js SFX (music disabled, playTrack is no-op)
    ├── storage.js                  # IndexedDB v5 wrapper (progression, perCourse, settings, questionStrength, questionLog, sessionLog)
    ├── course-data.js              # Bundled comptia course fallback for direct file:// play
    ├── courses.js                  # Course loader, category queries, bundled fallback
    ├── progression.js              # Progression system (currently disabled at runtime)
    ├── gameplay.js                 # Boss tracking and lightweight run-state helpers
    ├── juice.js                    # Particles, screen shake, flash, floating text
    ├── touch.js                    # Hammer.js touch handling
    ├── errorlog.js                 # Answer logging, mistake queries, category accuracy
    ├── spaced.js                   # SM-2 spaced repetition algorithm
    └── analytics.js                # Session tracking, trends, stats queries
```

## Development Notes

- **Modular architecture** — separate JS/CSS files loaded via `<script>` tags in `game.html`. No bundlers.
- **Fonts** — loaded from Google Fonts (`VT323` for headers, `JetBrains Mono` for body). Requires internet connection.
- **IndexedDB v5** — `second_chance_v2` database. Schema upgrade clears profile/progression data so existing users restart at level 1 after the v5 reset. Stores: `progression`, `perCourse`, `settings`, `questionStrength` (with `nextReview` index), `questionLog` (with `courseId`/`qId`/`timestamp` indexes), `sessionLog`.
- **Saved session record** — manual run resume is stored in `settings` under `saved_session_v1`
- **Review Due behavior** — if nothing is overdue yet, it uses the next scheduled review cards instead of silently doing nothing
- **Progression disabled** — `progression.js` still loads data, but XP, levels, skill tree, achievements, and related notifications are gated behind `Progression.enabled = false`
- **No power-ups** — reward screens, freeze, and double-or-nothing are removed from the runtime
- **Direct local play** — `game.html` loads `js/course-data.js` before `js/courses.js`; `Courses.load()` uses bundled data automatically under `file://` and falls back to it if JSON fetch fails.
- **`renderStart()` is async** — must be awaited (fetches spaced repetition due count). Has try/catch fallback.
- **`render()` is async** — properly awaits `renderStart()`.
- **Responsive** — single-column layout on screens < 560px.
- **Deck model** — runtime deck uses `{ id, question, isRetry }` entries for missed-question recycling.
- **Save semantics** — `SAVE & EXIT` stores the current run state and resumes on the current unanswered card; if the current card was already answered, resume starts on the next question boundary instead.
- **Quickfire semantics** — Quickfire is an infinite-lives study mode with retry recycling and auto-advance after the answer effect/sound.
- **Review semantics** — `state.missed` tracks unresolved question IDs; correctly answered retries are removed from the pool. Retries are reinserted a few questions later instead of being buried at the end of the deck.
- **SFX only** — `Audio.playTrack()` is a no-op. `Audio.sfx()` handles correct/wrong/click/streak sounds.
- **Publishing** — pushing `master` to `origin` rebuilds GitHub Pages at `https://msagen2241.github.io/second-chance/`

## Verification Rule

After any question-bank update, bundled fallback regeneration, or GitHub Pages deploy, explicitly verify question counts in all three places:

1. `courses/comptia.json`
2. `js/course-data.js`
3. the full-deck mode starters in `js/core.js`

For this project, these modes/tools should use the full CompTIA bank:
- `Normal`
- `Study`
- `Streak`
- `Confidence`
- `Pretest`
- `Quickfire`

These study tools intentionally use subsets and should **not** be treated as full-bank modes:
- `Category`
- `Weakness`
- `Interleave Weakness`
- `Cram`
- `Review Due`
- `Red Flag`
- `Review Missed`

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
4. Regenerate `js/course-data.js` from `courses/comptia.json` so direct `file://` play sees the same questions as GitHub Pages:

```bash
node - <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('courses/comptia.json', 'utf8'));
const out = `// Generated fallback course data for direct file:// play.\nwindow.COURSE_DATA = window.COURSE_DATA || {};\nwindow.COURSE_DATA.${data.id} = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync('js/course-data.js', out);
NODE
```

## Adding New Courses

1. Create `courses/newcourse.json` with the same format as `comptia.json`
2. Add the course ID to `knownCourses` in `js/courses.js`:

```js
const knownCourses = ['comptia', 'newcourse'];
```

3. If the new course should work under direct `file://` play, add it to `js/course-data.js` as another `window.COURSE_DATA.<id>` entry.
4. The course selector/start screen course queries will discover it from JSON when served over HTTP, or from bundled data when opened directly.

## Building & Running

No build step. Open `game.html` in any modern browser. Direct file opening works because course data is bundled in `js/course-data.js`.

For GitHub Pages, push committed changes on `master` to `origin`.
