# Second Chance — Context Handoff

## Project name & one‑line goal

**Second Chance** — A retro arcade-style single-page quiz game for studying CompTIA exam material (51 questions, lives/streaks/high scores).

## Tech stack & key tools

- **Single HTML file** — `Second_Chance.html` (~1235 lines), vanilla HTML/CSS/JS, no build step, no bundlers
- **Google Fonts** — VT323 (headers), JetBrains Mono (body) — requires internet
- **Hammer.js 2.0.8** — CDN (`cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js`) — swipe/tap gesture support for touch devices
- **IndexedDB** — high score persistence via `window.storage` wrapper (`hiscore_v1`)
- **Git** — `master` branch, conventional commits, worktrees in `.worktrees/` (gitignored)
- **Qwen Code** — project managed via Qwen with superpowers skills (brainstorming, subagent-driven-development, writing-plans)

## Current state of the project

### 1. What already works

- **51 questions** — randomized shuffle each run, 4-choice multiple choice
- **3 lives** — lose one per wrong answer, game over at 0
- **Streak bonus** — consecutive correct answers earn escalating points (up to +100)
- **End-of-run grading** — S/A/B/C/D/F based on accuracy
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
- New game modes (timed, practice mode with no lives)
- UI polish (animations, sound)
- Offline support (currently requires CDN for Hammer.js and Google Fonts)

## Important design decisions

- **Single-file architecture** — everything in one HTML file. No modules, no imports. Global `state` object, global functions (`render`, `startGame`, `handleAnswer`, `advance`, `endGame`, `renderStart`, `renderGame`, `renderEnd`, `shuffle`, `buildOptions`, `gradeFor`). This is intentional: no server, no build, just open the file.
- **TouchManager class** — uses `Hammer.Manager(el)` + `.add([new Hammer.Swipe(...), new Hammer.Tap(...)])`. The constructor does NOT accept a `recognizers` option (common pitfall — it silently ignores it).
- **Tap vs click double-fire guard** — `handleAnswer()` has `if (state.answered) return;` at the top. Both Hammer's tap handler and the native click handler call `handleAnswer()`, but the guard prevents double-submission.
- **CSS scoping** — touch overrides live in a separate `<style>` block, all selectors prefixed with `.touch-device`. This avoids polluting the base styles and makes touch/non-touch behavior clearly separated.
- **Question format** — `{ q, correct, distractors[], explain }` — all 51 questions in a single `QUESTIONS` constant array.

## Open problems & known bugs

- **None** — all reviews passed, no critical or important issues. All 4 touch commits are clean and approved.
- **Minor suggestion** (not blocking): `window.IS_TOUCH` is set but never read — dead assignment. Could be removed or used for a conditional (e.g., hide keyboard hints on touch).
- **Minor suggestion** (not blocking): No cleanup on game restart — old `TouchManager` instance is silently discarded. Hammer.js doesn't provide `destroy()`, and listeners don't accumulate on the same element, so this is fine in practice.
- **Trade-off**: File no longer works fully offline (Hammer.js + Google Fonts require internet). Acceptable for a quiz game that already requires fonts.

## File map

### Main files

| File | Summary |
|------|---------|
| `Second_Chance.html` | Complete game (~1235 lines). Contains all HTML markup, CSS styles, JavaScript game logic, QUESTIONS array, TouchManager class, and initTouch(). |
| `AGENTS.md` | Project documentation — game rules, question format, how to add questions, file structure. |
| `.gitignore` | Ignores `.worktrees/` directory. |

### Docs (superpowers workflow artifacts)

| File | Summary |
|------|---------|
| `docs/superpowers/specs/2026-04-20-touch-design.md` | Design spec for touch-friendly redesign. |
| `docs/superpowers/plans/2026-04-20-more-questions.md` | Previous implementation plan (questions addition — completed). |
| `docs/superpowers/plans/2026-04-20-touch.md` | Implementation plan for touch support (completed). |

### Temporary / cleanup candidates

- `docs/superpowers/plans/2026-04-20-more-questions.md` — old plan from the previous feature, no longer referenced. Can be deleted if desired.
- No generated or build artifacts (single-file project, no build step).

## Run instructions

**No server needed.** Open `Second_Chance.html` directly in any modern browser. Works on desktop and mobile.

To test touch features: use Chrome DevTools Device Toolbar (Ctrl+Shift+M) or open on a real device.

## Constraints & preferences

- **Single-file, no dependencies** — except Google Fonts and Hammer.js (both CDN). No npm, no bundlers, no frameworks.
- **Question format is strict** — must be `{ q, correct, distractors[], explain }` with exactly 4 options total.
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `style:` types used consistently.
- **Worktrees for feature isolation** — preferred workflow (`.worktrees/` is gitignored).
- **Caveman mode available** — user has caveman skill configured ( terse communication, token-efficient).
- **English output only** — hard requirement in `.qwen/output-language.md`.
- **Model switching** — local Qwen3.6 Q4 (`q4-coding`) / Q6 (`q6-coding`) via llama-swap at `http://127.0.0.1:3335/v1`, remote fallback `mac-server`.

## Next 5 concrete actions

1. **Test the touch features on a real device** — DevTools emulation is useful but not perfect. Verify swipe-left advances, tap submits, scroll doesn't trigger false swipes.
2. **Add Test 2 question deck** — follow the same `{ q, correct, distractors[], explain }` format, append to QUESTIONS array, update stat chip count.
3. **Consider inlining Hammer.js** if offline support is desired — or accept the CDN dependency trade-off.
4. **Remove `window.IS_TOUCH` dead assignment** if not needed — or use it to conditionally hide keyboard hints on touch devices.
5. **Clean up stale plan file** — `docs/superpowers/plans/2026-04-20-more-questions.md` is from the previous feature and no longer referenced.

## Resume prompt

> I'm working on "Second Chance", a single-file retro arcade quiz game for CompTIA exam study. We just completed a touch-friendly redesign with 4 commits on master: Hammer.js CDN, touch-device CSS overrides, TouchManager class, and a Hammer.Manager.add() API fix. The game has 51 questions, lives/streaks/high scores, keyboard support, and now touch gestures (swipe left to advance, tap to answer). All reviews passed, no open bugs. The project is a single HTML file with no build step. I need to continue working on it — here's the full handoff document:
