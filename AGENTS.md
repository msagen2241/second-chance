# Second Chance — CompTIA Redemption Run

## Project Overview

A single-page, retro-horizonal arcade-style quiz game for studying CompTIA exam material (Test 1 review). The game presents 51 randomly shuffled multiple-choice questions with a pixel-art aesthetic (VT323 + JetBrains Mono fonts, cyan/pink/green/yellow palette on a dark grid background).

### Features

- **3 game modes** — Normal (3 lives with missed-question recycling until correct), Streak (no lives, ends on first miss), Review (replay unresolved missed questions)
- **Mode picker** — toggle between Normal and Streak on the start screen
- **Lives system** — 3 hearts; lose one per wrong answer (Normal mode only)
- **Second-chance retry loop** — in Normal mode, a missed question is appended back into the deck as a `RETRY` item and stays in circulation until answered correctly
- **Streak bonus** — consecutive correct answers earn escalating bonus points (up to +100)
- **Question categories** — all 51 questions tagged with CompTIA exam domains (Operating Systems, Security, Software Troubleshooting, Operational Procedures)
- **Category breakdown** — end screen shows colored bar chart sorted by lowest accuracy first
- **Randomized deck** — questions and answer order shuffle each run
- **Persistent high score** — saved via IndexedDB (`hiscore_v1`)
- **End-of-run grading** — S/A/B/C/D/F based on accuracy (normal mode only)
- **Touch support** — Hammer.js CDN, swipe to advance, adaptive touch targets
- **Keyboard support** — press `1-4` to answer, `Enter` to continue
- **GitHub Pages ready** — root `index.html` redirects to `Second_Chance.html` so the game works at the Pages site root

### Game Data

The quiz questions are embedded directly in the `<script>` block as the `QUESTIONS` constant (51 questions covering IT change management, wireless security, Linux commands, Windows troubleshooting, networking, password attacks, and more). Each question has a `category` field for the CompTIA domain breakdown.

**Category distribution:**
| Category | Count | Color |
|----------|-------|-------|
| Operating Systems | 19 | cyan |
| Security | 16 | pink |
| Software Troubleshooting | 9 | green |
| Operational Procedures | 7 | yellow |

## How to Play

Open `Second_Chance.html` locally in any modern browser, or use the GitHub Pages deployment. No server or build step required.

**Live site:**
`https://msagen2241.github.io/second-chance/`

### Normal Mode
1. Click **▶ PRESS START** (or press `Enter`/`Space`)
2. Answer each question by clicking an option or pressing `1-4`
3. Read the feedback, then press `Enter` to advance
4. If you miss a question, it loses a heart and is queued to return later as `RETRY`
5. Once you answer that repeated question correctly, it leaves the missed pool
6. Lose all 3 hearts → Game Over; clear the deck and all queued retries → Victory
7. Beat your high score to appear on the leaderboard
8. After a run, click "Review Missed (N)" to replay only unresolved missed questions

### Streak Mode
1. Toggle **STREAK** on the start screen
2. Answer questions — no lives, keep going until you miss one
3. Score = streak count + escalating bonus (same as Normal mode)
4. End screen shows your streak length and score

## File Structure

```
Second Chance/
├── Second_Chance.html                # Complete game (HTML + CSS + JS)
├── index.html                        # GitHub Pages entrypoint; redirects to Second_Chance.html
├── GitHub_Pages_Upload_Workflow.md   # Beginner guide for the GitHub/GitHub Pages workflow used here
├── AGENTS.md                         # This file
└── .qwen/PROJECT_SUMMARY.md          # Running project summary for agent handoff/context
```

## Development Notes

- **Single-file architecture** — everything lives in `Second_Chance.html`. No bundlers, no dependencies.
- **Fonts** — loaded from Google Fonts (`VT323` for headers, `JetBrains Mono` for body). Requires internet connection.
- **Storage** — high score uses the `window.storage` wrapper (IndexedDB-backed). Gracefully degrades if unavailable.
- **Responsive** — single-column layout on screens < 560px.
- **Deck model** — the runtime deck now uses `{ id, question, isRetry }` entries so missed questions can be recycled until correct in Normal mode
- **Review semantics** — `state.missed` now tracks unresolved question IDs; once a question is answered correctly later, it is removed from the review pool
- **Publishing** — pushing `master` to `origin` rebuilds GitHub Pages at `https://msagen2241.github.io/second-chance/`

## Adding New Questions

1. Open `Second_Chance.html`
2. Find the `QUESTIONS` array in the `<script>` block
3. Add a new object matching the existing shape (category must be one of the four CompTIA domains):

```js
{
  q: "Your question here?",
  category: "Operating Systems",  // Operating Systems | Security | Software Troubleshooting | Operational Procedures
  correct: "Correct answer",
  distractors: ["Wrong A", "Wrong B", "Wrong C"],
  explain: "Why the correct answer is right."
}
```

4. Update the stat chip on the start screen from `51` to the new count.

## Building & Running

No build step. Just open the HTML file in a browser.

For GitHub Pages, push committed changes on `master` to `origin`.
