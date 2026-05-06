# Second Chance — Context Handoff

## Project name & one-line goal

**Second Chance** — A retro arcade-style CompTIA quiz game built to improve retention through retries, spaced repetition, mistake targeting, and focused study modes.

## Current state

- **Tech:** Vanilla HTML/CSS/JS, no bundlers
- **Entry point:** `game.html`
- **Live URL:** `https://msagen2241.github.io/second-chance/`
- **Database:** IndexedDB `second_chance_v2`, schema version 5
- **Question count:** 130
- **Course file:** `courses/comptia.json`
- **Bundled fallback:** `js/course-data.js`
- **Manual resume:** saved study/run state is stored in `settings.saved_session_v1`

## Active gameplay model

- **Normal** — 3 lives, missed questions requeue as `RETRY`
- **Study** — infinite lives, missed questions requeue
- **Streak** — one miss ends run
- **Review** — replay unresolved missed questions

## Study tools

- **Review Due** — overdue questions first, then next-up scheduled review cards
- **Weakness** — bottom 2 categories by accuracy
- **Cram** — most-missed questions
- **By Category** — one domain only
- **Interleave Weakness** — mixes weak categories together
- **Confidence** — asks `GUESSED / SURE`; guessed correct answers get requeued
- **Red Flag** — combines most-missed and weakest-retention questions
- **Pretest** — preview pass without explanations, then automatic study pass
- **Quickfire** — instant right/wrong response with auto-advance and no `NEXT` step

## Important implementation notes

- **Retry loop:** wrong answers are reinserted a few questions later, not just at the end of the deck
- **Retry visibility:** queued retries are labeled `RETRY` in the HUD and wrong-answer feedback explicitly says the question was requeued
- **Progression:** intentionally disabled via `Progression.enabled = false`; keep code, but it should stay inert unless explicitly re-enabled
- **Power-ups:** removed from runtime
- **Pretest:** preview phase intentionally hides explanations and disables back-navigation during that phase
- **Confidence mode:** answer flow is gated by `awaitingConfidence` so `advance()` cannot skip the prompt
- **Review Due:** now opens overdue cards first, then next-up scheduled review cards if nothing is overdue, and falls back to a useful starter drill when there is no review history yet
- **Saved sessions:** `SAVE & EXIT` stores the current run and start screen shows a `RESUME SAVED SESSION` button when one exists
- **Quickfire:** auto-advance is timer-driven and cleared on manual navigation/save/end so it does not double-skip questions
- **Replay behavior:** `PLAY AGAIN` uses mode-aware restart logic, not a generic normal restart
- **Direct file play:** `game.html` loads `js/course-data.js` before `js/courses.js` so the game works under `file://`

## Main files

- `game.html` — bootstraps the app and keyboard handlers
- `css/base.css` — all main visuals, including study-tool cards and quick guide
- `css/touch.css` — touch layout adjustments
- `js/core.js` — game flow, render logic, mode starters, retry system, end screens
- `js/gameplay.js` — boss tracking and lightweight run-state helpers
- `js/spaced.js` — spaced repetition records and weakest-question queries
- `js/errorlog.js` — answer history and most-missed logic
- `js/analytics.js` — session tracking and stats modal
- `js/progression.js` — disabled progression system retained for later
- `js/storage.js` — IndexedDB wrapper

## Known user preferences

- No anxiety-inducing timers
- Keep commands simple
- Prefer practical study features over gamified fluff

## Suggested next checks

1. Browser-test `Confidence` mode with keyboard and touch input
2. Browser-test `Pretest` rollover from preview pass to study pass
3. Verify the start screen remains readable on mobile with the expanded study-tool descriptions
4. Commit and push only the intended files because the worktree may contain unrelated edits
