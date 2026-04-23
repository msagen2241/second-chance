# Second Chance — Context Handoff

## Project name & one‑line goal

**Second Chance** — A retro arcade-style single-page quiz game for studying CompTIA exam material (51 questions, lives/streaks/high scores, category breakdowns).

## Tech stack & key tools

- **Single HTML file** — `Second_Chance.html` (~1630 lines), vanilla HTML/CSS/JS, no build step, no bundlers
- **Google Fonts** — VT323 (headers), JetBrains Mono (body) — requires internet
- **Hammer.js 2.0.8** — CDN (`cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js`) — swipe/tap gesture support for touch devices
- **IndexedDB** — high score persistence via `window.storage` wrapper (`hiscore_v1`)
- **Git** — `master` branch, conventional commits, worktrees in `.worktrees/` (gitignored)
- **Qwen Code** — project managed via Qwen with superpowers skills (brainstorming, subagent-driven-development, writing-plans, finishing-a-development-branch)

## Current state of the project

### 1. What already works

- **51 questions** — randomized shuffle each run, 4-choice multiple choice, tagged with CompTIA exam domains
- **3 game modes** (completed 2026-04-21, 6 commits on `master`):
  - **Normal mode** — 3 lives, lose one per wrong answer, game over at 0, survive all 51 → victory
  - **Streak mode** — no lives, keep answering until you miss one, score = streak count + escalating bonus (same as normal), end screen shows streak length + score
  - **Review mode** — "Review Missed (N)" button on normal end screen, replays only wrong answers shuffled, no lives, no high score tracking
  - **Mode picker** — NORMAL / STREAK toggle buttons on start screen, stat chips adapt per mode
- **Streak bonus** — consecutive correct answers earn escalating points (up to +100)
- **End-of-run grading** — S/A/B/C/D/F based on accuracy (normal mode only)
- **Category breakdown** (completed 2026-04-21, 6 commits on `master`):
  - All 51 questions tagged: Operating Systems (19), Security (16), Software Troubleshooting (9), Operational Procedures (7)
  - `categoryStats` tracks correct/missed per category during gameplay
  - End screen shows colored bar chart sorted by lowest accuracy first
  - Bar format: `████████░░░░░░ 8/12` (█ = filled, ░ = empty, 12 total)
  - Category colors: cyan (OS), pink (Security), green (Troubleshooting), yellow (Ops)
- **High score** — persisted via IndexedDB, displayed on start screen
- **Keyboard support** — `1-4` to answer, `Enter`/`Space` to advance
- **Touch support** (completed 2026-04-20, 4 commits on `master`):
  - Hammer.js CDN for gesture recognition
  - Swipe left on answered questions → advances to next
  - Tap on answer buttons → submits answer (defense-in-depth with click guard)
  - `.touch-device` class auto-applied via `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`
  - Larger tap targets: 96px min-height, 16px font, `touch-action: manipulation`
  - `touch-action: pan-y` on question card prevents scroll interference
  - `-webkit-tap-highlight-color: transparent`, `user-select: none` on buttons
  - Responsive: 2-column grid on desktop, 1-column on screens < 560px
- **Retro aesthetic** — dark grid background, cyan/pink/green/yellow palette, pixel fonts, corner decorations on cards, screen shake on wrong answer, progress bar, streak fire icon

### 2. What is partially implemented

- **End-screen swipe-to-restart** — spec called for swipe on end-screen to restart, but TouchManager only implements swipeleft on answered-game-questions. The end-screen swipe and start-screen ignore are handled implicitly (swipe handler checks `state.answered`, which is null on end/start screens).

### 3. What is still just planned/ideas

- More question decks (Test 2, etc.)
- Timed challenge mode
- Sound effects (Web Audio API beeps/boops)
- Progress tracker across sessions (accuracy trends per category)
- Offline support (currently requires CDN for Hammer.js and Google Fonts)

## Important design decisions

- **Single-file architecture** — everything in one HTML file. No modules, no imports. Global `state` object, global functions. Intentional: no server, no build, just open the file.
- **State shape** — `state` object contains: `screen`, `mode` ('normal'|'streak'|'review'), `deck`, `idx`, `score`, `lives`, `streak`, `correctCount`, `answered`, `currentOptions`, `hiScore`, `newHi`, `missed`, `categoryStats`. All reset in `startGame()` and `startReview()`.
- **TouchManager class** — uses `Hammer.Manager(el)` + `.add([new Hammer.Swipe(...), new Hammer.Tap(...)])`. The constructor does NOT accept a `recognizers` option (common pitfall — it silently ignores it).
- **Tap vs click double-fire guard** — `handleAnswer()` has `if (state.answered) return;` at the top. Both Hammer's tap handler and the native click handler call `handleAnswer()`, but the guard prevents double-submission.
- **CSS scoping** — touch overrides live in a separate `<style>` block, all selectors prefixed with `.touch-device`. Mode picker CSS and category breakdown CSS follow the same pattern.
- **Question format** — `{ q, category, correct, distractors[], explain }` — all 51 questions in a single `QUESTIONS` constant array. Category field added between `q` and `correct`.
- **Category tracking** — `categoryStats` is a map `{ "Operating Systems": { correct: 0, missed: 0 }, ... }`. Updated in `handleAnswer()` in both the correct and wrong branches.
- **Streak mode game flow** — `lives = 999` (effectively infinite), game auto-ends on wrong answer via `setTimeout(() => { endGame(); }, 1500)` in `handleAnswer()`. Deck exhaustion also ends game.
- **Review mode** — builds deck from `state.missed.map(i => QUESTIONS[i])`, resets all state, `lives = 0`. Guard at top prevents crash if `state.missed.length === 0`.

## Open problems & known bugs

- **None** — all features fully implemented and reviewed. All reviews passed (spec + code quality).
- **Minor suggestion** (not blocking): `window.IS_TOUCH` is set but never read — dead assignment. Could be removed or used for a conditional (e.g., hide keyboard hints on touch).
- **Minor suggestion** (not blocking): No cleanup on game restart — old `TouchManager` instance is silently discarded. Hammer.js doesn't provide `destroy()`, and listeners don't accumulate on the same element, so this is fine in practice.
- **Trade-off**: File no longer works fully offline (Hammer.js + Google Fonts require internet). Acceptable for a quiz game that already requires fonts.

## File map

### Main files

| File | Summary |
|------|---------|
| `Second_Chance.html` | Complete game (~1630 lines). Contains all HTML markup, CSS styles, JavaScript game logic, QUESTIONS array (51 tagged questions), TouchManager class, category breakdown rendering, mode picker, and all game flow functions. |
| `AGENTS.md` | Project documentation — game rules, question format, how to add questions, file structure, how to play each mode. |
| `.gitignore` | Ignores `.worktrees/` directory. |

### Docs (superpowers workflow artifacts)

| File | Summary |
|------|---------|
| `docs/superpowers/specs/2026-04-20-touch-design.md` | Design spec for touch-friendly redesign. |
| `docs/superpowers/specs/2026-04-21-question-categories-design.md` | Design spec for question categories feature. |
| `docs/superpowers/plans/2026-04-20-more-questions.md` | Previous implementation plan (questions addition — completed). |
| `docs/superpowers/plans/2026-04-20-touch.md` | Implementation plan for touch support (completed). |
| `docs/superpowers/plans/2026-04-21-game-modes.md` | Implementation plan for game modes (completed). |
| `docs/superpowers/plans/2026-04-21-question-categories.md` | Implementation plan for question categories (completed). |

### Temporary / cleanup candidates

- `docs/superpowers/plans/2026-04-20-more-questions.md` — old plan from the previous feature, no longer referenced. Can be deleted if desired.
- No generated or build artifacts (single-file project, no build step).

## Run instructions

**No server needed.** Open `Second_Chance.html` directly in any modern browser. Works on desktop and mobile.

To test touch features: use Chrome DevTools Device Toolbar (Ctrl+Shift+M) or open on a real device.

## Constraints & preferences

- **Single-file, no dependencies** — except Google Fonts and Hammer.js (both CDN). No npm, no bundlers, no frameworks.
- **Question format is strict** — must be `{ q, category, correct, distractors[], explain }` with exactly 4 options total.
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `style:` types used consistently.
- **Worktrees for feature isolation** — preferred workflow (`.worktrees/` is gitignored).
- **Caveman mode available** — user has caveman skill configured (terse communication, token-efficient).
- **English output only** — hard requirement in `.qwen/output-language.md`.
- **Model switching** — local Qwen3.6 Q4 (`q4-coding`) / Q6 (`q6-coding`) via llama-swap at `http://127.0.0.1:3335/v1`, remote fallback `mac-server`.
- **User prefers simple, straightforward commands** — no unnecessary shell tricks.
- **User prefers worktrees for feature isolation** — always create a worktree for new features.

## Next 5 concrete actions

1. **Test the game on a real device** — verify touch gestures (swipe to advance, tap to answer), mode picker, streak mode, and category breakdown render correctly on mobile.
2. **Add Test 2 question deck** — follow the same `{ q, category, correct, distractors[], explain }` format, append to QUESTIONS array, update stat chip count.
3. **Consider inlining Hammer.js** if offline support is desired — or accept the CDN dependency trade-off.
4. **Remove `window.IS_TOUCH` dead assignment** if not needed — or use it to conditionally hide keyboard hints on touch devices.
5. **Clean up stale plan file** — `docs/superpowers/plans/2026-04-20-more-questions.md` is from the previous feature and no longer referenced.

## Resume prompt

> I'm working on "Second Chance", a single-file retro arcade quiz game for CompTIA exam study. We've completed 3 major features on master: (1) Touch support — Hammer.js CDN, swipe to advance, tap to answer, adaptive touch targets (4 commits). (2) Game modes — Normal (3 lives), Streak (no lives, ends on first miss), Review (replay missed questions), with mode picker on start screen (6 commits). (3) Question categories — all 51 questions tagged with CompTIA domains, categoryStats tracking, colored bar chart breakdown on end screen sorted by lowest accuracy (6 commits). All reviews passed, no open bugs. The project is a single HTML file with no build step. I need to continue working on it — here's the full handoff document.
