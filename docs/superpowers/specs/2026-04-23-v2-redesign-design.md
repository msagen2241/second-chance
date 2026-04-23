# Second Chance v2 — Full Redesign

**Date:** 2026-04-23
**Status:** Approved

## Overview

Second Chance v2 transforms the single-file quiz game into a modular, multi-course study platform with arcade-style progression, power-ups, and polished feedback — while keeping the zero-build-step, open-in-browser deployment model.

**Guiding principles:**
- Deep gameplay/progression systems first, polish second
- Modular files for maintainability, no build tooling
- One course at a time, shared progression across courses
- Power-ups earned through gameplay, not spent or pre-selected

## Architecture

### File Structure

```
Second_Chance/
├── index.html                    # Entry point (redirects to game.html)
├── game.html                     # Main page — loads scripts/styles
├── css/
│   ├── base.css                  # Retro aesthetic, grid, colors, fonts
│   ├── components.css            # Buttons, cards, progress bar, lives
│   ├── screens.css               # Start, game, end, reward screens
│   └── touch.css                 # .touch-device overrides
├── js/
│   ├── core.js                   # state object, startGame(), endGame(), handleAnswer()
│   ├── courses.js                # Course loading, switching, metadata
│   ├── progression.js            # XP, levels, skill tree, achievements
│   ├── gameplay.js               # Power-ups, combo chain, boss questions
│   ├── audio.js                  # Web Audio API (extracted from current HTML)
│   ├── touch.js                  # Hammer.js TouchManager (extracted)
│   ├── juice.js                  # Screen shake, particles, animations
│   └── storage.js                # IndexedDB wrapper (extracted)
├── courses/
│   ├── comptia.json              # Current 51 questions
│   └── ...future courses
└── assets/
    └── sfx/                      # Optional: pre-rendered SFX later
```

No build step. `game.html` loads CSS and JS via `<link>` and `<script>` tags. Each JS file exposes functions on a namespaced global (e.g., `Core.startGame()`, `Progression.awardXP()`).

### Course Data Format

```json
{
  "id": "comptia",
  "name": "CompTIA A+",
  "categories": ["Operating Systems", "Security", "Software Troubleshooting", "Operational Procedures"],
  "questions": [
    {
      "id": 1,
      "q": "What is the first step...",
      "category": "Operating Systems",
      "correct": "Check the event log",
      "distractors": ["Reboot", "Reinstall", "Scan"],
      "explain": "The event log shows...",
      "isBoss": false
    }
  ]
}
```

Courses are loaded via `fetch()` from the `courses/` directory. The current `comptia.json` is extracted from the existing `QUESTIONS` array in `Second_Chance.html`.

## Progression System

### XP and Levels

- **Base XP:** 100 per correct answer, scaled by streak bonus (same multiplier as current point system)
- **Global level:** Accumulates across all courses. Level cost formula: `XP needed = 100 * level + 200`. Level 1 costs 300 XP, level 2 costs 500 XP, etc. Capped at level 50.
- **Skill points:** Earned 1 per global level-up. Spent to raise category skill levels.

### Category Skill Tree

Each category has a skill level from 0 to 10. Spending a skill point on a category raises its level by 1.

- **XP multiplier:** `1.0 + (skillLevel * 0.1)`. At max level (10), answering questions in that category grants 2.0x XP.
- **Strategic use:** Invest in weak categories to accelerate improvement. The UI shows current accuracy per category alongside skill levels.

### Achievements

Persistently unlocked, each grants a one-time XP bonus:

| Achievement | Condition | XP Bonus |
|-------------|-----------|----------|
| First Blood | First correct answer | 50 |
| Unstoppable | 10-streak in one run | 200 |
| Boss Slayer | Defeat 10 boss questions (cumulative) | 300 |
| Marathon | Answer 50 questions in one run | 250 |
| Perfect Run | Clear a course with no wrong answers | 500 |
| Comeback | Win Normal mode after losing 2+ lives | 150 |
| Speed Demon | 5-combo chain | 100 |
| Daily Grind | 7-day study streak | 400 |

### Study Streak

Tracks consecutive days played. On game start:
- If `lastActiveDate` was yesterday → increment streak
- If `lastActiveDate` was today → no change
- If `lastActiveDate` was older → reset to 1

Update `lastActiveDate` to today on game start. Weekly milestone (7 days) triggers the Daily Grind achievement.

## Gameplay Mechanics

### Combo Chain

- Answer within 5 seconds of the previous correct answer → combo counter increments
- Each combo level adds +50 bonus points (stacks with streak bonus)
- Timer resets on wrong answer or >5s delay
- Visual: shrinking timer bar under the question, combo counter in the HUD

### Freeze

- Unlocked when reaching a 3-streak milestone during gameplay
- When activated, the next wrong answer in Normal mode does not cost a life — only breaks the combo
- One-time use per unlock. Re-earns when you next reach 3 consecutive correct answers after consuming it
- Visual: frozen border around the question card when active

### Double or Nothing

- Unlocked when reaching a 5-streak milestone during gameplay
- Activates on the next question: correct = 2x points/XP, wrong = lose 2 lives (Normal) or instant Game Over (Streak)
- One-time use per unlock
- Visual: glowing red border around the question card when active

### Boss Questions

- Every 10th question in the deck is a boss (pre-marked with `isBoss: true` in course data)
- Boss questions use a larger card with different border color
- Worth 3x points/XP
- If missed in Normal mode, costs 2 lives instead of 1
- Defeating a boss triggers the reward screen

### Reward Screen

- Appears after every 5 questions. Boss defeat (every 10 questions) replaces the normal reward at that point — only one reward screen triggers
- Shows 2 power-ups to choose from: Freeze, Double or Nothing, or +50 XP instant bonus
- Player taps one → added to active inventory (or XP awarded) → game resumes
- Skippable via button or 3-second auto-timer
- Does not appear in Review mode

## Polish and Juice

### Screen Feedback

- **Wrong answer:** Screen shake (CSS `transform: translate()`, 300ms, 3 oscillations)
- **Correct answer:** Green flash overlay (full-screen div, 150ms opacity fade)
- **Wrong answer:** Red flash overlay (same as above, red)

### Particles

- Canvas overlay (`pointer-events: none`) positioned over the game area
- Burst on: streak milestones (3, 5, 10), boss defeat, reward screen picks
- Simple squares/circles that fade out over 500ms
- Colors: green (correct streak), gold (boss), pink (reward pick)

### Audio Reactivity

- **Border pulse:** Subtle `box-shadow` glow on the game card, synced to music beat (updates every beat interval)
- **Floating notes:** Small colored squares rise from correct answers (spawn at answer button position, drift up 100px over 600ms, fade out)

### Transitions

- **Question entry:** Slide in from right (200ms ease-out)
- **Question exit:** Slide out to left on answer (150ms ease-in)
- **Score counter:** Animates from old to new value over 300ms (linear count-up)

## Data and Persistence

### IndexedDB Schema

Single database `second_chance_v2`, three object stores:

**`progression`** (keyPath: 'id', single record):
```json
{
  "id": "global",
  "totalXP": 0,
  "level": 0,
  "skillPoints": 0,
  "categorySkills": { "Operating Systems": 0, "Security": 0, ... },
  "achievements": [],
  "studyStreak": 0,
  "lastActiveDate": null
}
```

**`perCourse`** (keyPath: 'courseId'):
```json
{
  "courseId": "comptia",
  "questionsAnswered": 0,
  "questionsCorrect": 0,
  "bestScore": 0,
  "bestGrade": null,
  "runsCompleted": 0
}
```

**`settings`** (keyPath: 'id', single record):
```json
{
  "id": "settings",
  "muted": false,
  "musicVolume": 0.5,
  "sfxVolume": 0.7
}
```

### Backward Compatibility

The existing `hiscore_v1` IndexedDB store is read on first launch and migrated into the new `perCourse` store. Old high scores are preserved as `bestScore`.

## Game Flow Changes

### Start Screen

1. Course selector (dropdown or list of available courses)
2. Mode picker (Normal / Streak / Review) — unchanged
3. Current level, XP bar, study streak display
4. Skill tree button (opens skill allocation panel)
5. Start button

### During Gameplay

- HUD shows: lives, score, streak, combo counter (if active), active power-ups (Freeze, Double or Nothing indicators)
- Combo timer bar under question card (only visible when combo is active)
- Question counter (e.g., "7/51")
- Boss questions: visual distinction (larger card, gold border, "BOSS" label)

### End Screen

- All current stats (score, grade, category breakdown) — unchanged
- XP earned this run, new level (if leveled up)
- Achievements unlocked this run
- Study streak updated
- Buttons: Play Again, Review Missed, Skill Tree, Course Selector

## Out of Scope

- Multiplayer or leaderboards
- Question editor UI (courses edited as JSON files directly)
- Offline support (still requires internet for fonts)
- Mobile app packaging (PWA considered future work)
- Question difficulty tiers (nice-to-have, not in v2)
