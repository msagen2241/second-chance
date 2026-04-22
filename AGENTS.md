# Second Chance — CompTIA Redemption Run

## Project Overview

A single-page, retro-horizonal arcade-style quiz game for studying CompTIA exam material (Test 1 review). The game presents 51 randomly shuffled multiple-choice questions with a pixel-art aesthetic (VT323 + JetBrains Mono fonts, cyan/pink/green/yellow palette on a dark grid background).

### Features

- **3 game modes** — Normal (3 lives), Streak (no lives, ends on first miss), Review (replay missed questions)
- **Mode picker** — toggle between Normal and Streak on the start screen
- **Lives system** — 3 hearts; lose one per wrong answer (Normal mode only)
- **Streak bonus** — consecutive correct answers earn escalating bonus points (up to +100)
- **Randomized deck** — questions and answer order shuffle each run
- **Persistent high score** — saved via IndexedDB (`hiscore_v1`)
- **End-of-run grading** — S/A/B/C/D/F based on accuracy
- **Touch support** — Hammer.js CDN, swipe to advance, adaptive touch targets
- **Keyboard support** — press `1-4` to answer, `Enter` to continue

### Game Data

The quiz questions are embedded directly in the `<script>` block as the `QUESTIONS` constant (51 questions covering IT change management, wireless security, Linux commands, Windows troubleshooting, networking, password attacks, and more).

## How to Play

Open `Second_Chance.html` in any modern browser. No server or build step required.

### Normal Mode
1. Click **▶ PRESS START** (or press `Enter`/`Space`)
2. Answer each question by clicking an option or pressing `1-4`
3. Read the feedback, then press `Enter` to advance
4. Lose all 3 hearts → Game Over; survive all 51 → Victory
5. Beat your high score to appear on the leaderboard
6. After a run, click "Review Missed (N)" to replay only wrong answers

### Streak Mode
1. Toggle **STREAK** on the start screen
2. Answer questions — no lives, keep going until you miss one
3. Score = streak count + escalating bonus (same as Normal mode)
4. End screen shows your streak length and score

## File Structure

```
Second Chance/
├── Second_Chance.html          # Complete game (HTML + CSS + JS)
├── AGENTS.md                   # This file
└── Second_Chance_files/        # Browser cache (favicon, fonts, etc.)
```

## Development Notes

- **Single-file architecture** — everything lives in `Second_Chance.html`. No bundlers, no dependencies.
- **Fonts** — loaded from Google Fonts (`VT323` for headers, `JetBrains Mono` for body). Requires internet connection.
- **Storage** — high score uses the `window.storage` wrapper (IndexedDB-backed). Gracefully degrades if unavailable.
- **Responsive** — single-column layout on screens < 560px.

## Adding New Questions

1. Open `Second_Chance.html`
2. Find the `QUESTIONS` array in the `<script>` block
3. Add a new object matching the existing shape:

```js
{
  q: "Your question here?",
  correct: "Correct answer",
  distractors: ["Wrong A", "Wrong B", "Wrong C"],
  explain: "Why the correct answer is right."
}
```

4. Update the stat chip on the start screen from `51` to the new count.

## Building & Running

No build step. Just open the HTML file in a browser.
