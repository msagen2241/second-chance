# Project Summary

## Overall Goal
Build a retro arcade-style CompTIA exam study quiz game called "Second Chance" with multiple game modes, touch support, and category-based performance tracking.

## Key Knowledge

**Project:** `G:\MidTier\AI-Projects\Document-Memory\Games\Second Chance`

**Tech:** Single HTML file (`Second_Chance.html`) with supporting root docs — vanilla HTML/CSS/JS, no build step. Hammer.js 2.0.8 via CDN for touch gestures.

**Game mechanics:**
- 51 questions tagged with CompTIA domains: Operating Systems (19), Security (16), Software Troubleshooting (9), Operational Procedures (7)
- 3 game modes: Normal (3 lives, missed questions recycle until correct), Streak (no lives, ends on first miss), Review (replay unresolved missed questions)
- Normal mode uses a retry queue: a missed question is re-added to the deck as a `RETRY` entry and removed from the missed/review pool once answered correctly
- Streak bonus: escalating bonus points (up to +100) for consecutive correct answers
- End-of-run grading: S/A/B/C/D/F based on accuracy
- High score persisted via IndexedDB (`hiscore_v1`)
- Touch support: Hammer.js swipe to advance, adaptive touch targets
- Keyboard support: `1-4` to answer, `Enter` to continue
- GitHub Pages deployment live at `https://msagen2241.github.io/second-chance/`
- Root `index.html` redirects to `Second_Chance.html` for Pages compatibility

**Question format:** `{q, category, correct, distractors[], explain}`

**Key files:**
- `Second_Chance.html` — main app
- `index.html` — Pages redirect entrypoint
- `AGENTS.md` — project instructions
- `.qwen/PROJECT_SUMMARY.md` — this summary
- `GitHub_Pages_Upload_Workflow.md` — beginner-friendly deployment guide

**Git:** `master` branch, remote `origin` is `https://github.com/msagen2241/second-chance.git`, Pages publishes from branch `master` root, worktrees managed via `.worktrees/` (ignored in `.gitignore`)

**User preferences:**
- Simple, straightforward commands
- Clean up stale artifacts immediately
- Use worktrees for feature isolation
- Official CompTIA domain categories preferred over ad-hoc categorization

## Recent Actions

1. **Initialized git repo** — created `.git/`, committed initial files
2. **Created worktree** — `.worktrees/more-questions` on `feature/more-questions` branch
3. **Executed more-questions plan** — added 34 new questions (51 total), merged to master
4. **Implemented touch support** — Hammer.js CDN, swipe gestures, adaptive touch targets, merged to master
5. **Implemented game modes** — Streak mode and Wrong-answer review mode, merged to master
6. **Implemented question categories** — Tagged all 51 questions with CompTIA domains, added categoryStats tracking, rendered category breakdown bar chart on end screen, fixed 2 bugs (review mode crash, streak bonus display)
7. **Published to GitHub Pages** — created repo `msagen2241/second-chance`, added `index.html`, enabled Pages from `master` root
8. **Fixed touch answer handling** — corrected tap target/index behavior so answer selection and `NEXT` work properly on the live site
9. **Added until-correct retry loop** — in Normal mode, missed questions now recycle back into the deck until answered correctly; resolved questions are removed from `state.missed`
10. **Documented deployment workflow** — added `GitHub_Pages_Upload_Workflow.md`
11. **Updated AGENTS.md and project summary** — reflected current features and deployment state

## Current Plan

[ACTIVE BASELINE] The current shipped baseline includes:
- local browser play via `Second_Chance.html`
- live play via GitHub Pages
- Normal/Streak/Review flows
- retry-until-correct behavior in Normal mode

Possible next steps:
- Adding more question decks (Test 2, different exam)
- Sound effects (Web Audio API beeps/boops)
- Progress tracker (accuracy over time per category)
- Any other feature the user wants to build

---

## Summary Metadata
**Update date**: 2026-04-22
