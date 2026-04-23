# More Questions — Additional Test 1 Content

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 24 new questions from the Test 1 incorrect-answers review to the quiz game.

**Architecture:** Append new question objects to the existing `QUESTIONS` array in `Second_Chance.html`. Update the stat chip on the start screen to reflect the new total. No structural changes to the game logic needed.

**Tech Stack:** Vanilla HTML/CSS/JS — no dependencies.

---

## Task 1: Add all 24 questions to the QUESTIONS array

**Files:**
- Modify: `Second_Chance.html:590-610` (the `QUESTIONS` array)

The existing questions use this shape:
```js
{
  q: "Question text here?",
  correct: "Correct answer",
  distractors: ["Wrong A", "Wrong B", "Wrong C"],
  explain: "Why the correct answer is right."
}
```

Convert each of the 24 questions from `C:\Users\matth\OneDrive\Desktop\Tests\Test1_4.14.26_Incorrect.md` into this format. The question text comes from the "Topic" line (e.g., "Shared inbox folders" → rephrase into a question). The correct answer is the "Correct answer" field. The distractors are the other options from the original test (you'll need to infer reasonable wrong answers or use the "Your answer" + other plausible options).

**Important:** The original HTML file has 17 questions (lines 590-610 roughly). Append the new 24 after the existing ones, before the closing `];` of the array.

- [ ] **Step 1: Read the existing QUESTIONS array to find the exact insertion point**

Open `Second_Chance.html` and find where the `QUESTIONS` array ends (the `];` closing line).

- [ ] **Step 2: Convert all 24 questions from the markdown file**

For each question, extract:
- `q`: The question text (rephrase the topic into a question if needed)
- `correct`: The "Correct answer" value
- `distractors`: Pick 3 plausible wrong answers (use "Your answer" and infer the others)
- `explain`: The "Explanation" text

- [ ] **Step 3: Append the new question objects to the array**

Insert after the last existing question object, before `];`.

- [ ] **Step 4: Update the stat chip on the start screen**

Change `16` to `41` in the stat chip that shows question count:
```html
<div class="stat-chip"><b>41</b>QUESTIONS</div>
```
(Line ~780 in the file)

- [ ] **Step 5: Verify the HTML is valid**

Check that all quotes are properly closed, no trailing commas before `]`, and the `</script>` tag is intact.

- [ ] **Step 6: Commit**

```bash
git add Second_Chance.html
git commit -m "feat: add 24 more questions from Test 1 incorrect review"
```

---

## Task 2: Verify the game loads correctly

**Files:**
- `Second_Chance.html` (read-only verification)

- [ ] **Step 1: Read the modified file to verify structure**

Check that:
- The `QUESTIONS` array has 41 entries (17 original + 24 new)
- No syntax errors (matching braces, quotes)
- The `shuffle(QUESTIONS)` call at the bottom still references the correct array
- The stat chip shows "41 QUESTIONS"

- [ ] **Step 2: Commit**

```bash
git add Second_Chance.html
git commit -m "chore: verify question count and game structure"
```

---

## Self-Review Checklist

1. **Spec coverage:** All 24 questions from the markdown file are included? ✓
2. **Placeholder scan:** No "TBD", "TODO", or incomplete question objects? ✓
3. **Type consistency:** All new questions use the same `{q, correct, distractors, explain}` shape? ✓
4. **Game integrity:** The `shuffle()` call, stat chip, and end-screen grade logic all still work? ✓
