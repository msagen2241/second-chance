# Question Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tag all 51 questions with CompTIA exam domains and show a category breakdown bar chart on the end screen.

**Architecture:** Add `category` field to each question. Track per-category correct/missed in state. Render a sorted bar chart on the end screen.

**Tech Stack:** Vanilla HTML/CSS/JS, single file `Second_Chance.html`.

---

## File Structure

**Files modified:**
- `Second_Chance.html` — all changes in one file: data, state, rendering, CSS

---

## Task 1: Tag all 51 questions with categories

**Files:**
- Modify: `Second_Chance.html` — the `QUESTIONS` array

- [ ] **Step 1: Add `category` field to each question**

Add a `category` property to every question object, right after the `q` field. The four categories are:

- `Operating Systems` — Windows, Linux, macOS, virtualization, scripting, networking OS
- `Security` — wireless, password attacks, policies, physical security, encryption, social engineering, malware, PII
- `Software Troubleshooting` — app/OS repair, browser issues, mobile app issues
- `Operational Procedures` — change management, backups, IT ops, training, documentation

Here is the exact mapping for all 51 questions. Apply these changes to the `QUESTIONS` array:

```js
{ q: "...", category: "Operational Procedures", correct: "Identifying the change type", ... },     // 1
{ q: "...", category: "Security", correct: "WPA2 + Multifactor Authentication", ... },             // 2
{ q: "...", category: "Software Troubleshooting", correct: "Developer mode", ... },                // 3
{ q: "...", category: "Operating Systems", correct: "chmod", ... },                                // 4
{ q: "...", category: "Software Troubleshooting", correct: "Attempt to open the document in Safe Mode", ... },  // 5
{ q: "...", category: "Operational Procedures", correct: "Attempt to restore to a test server...", ... },  // 6
{ q: "...", category: "Software Troubleshooting", correct: "Mail", ... },                          // 7
{ q: "...", category: "Software Troubleshooting", correct: "Restart the Windows Explorer process...", ... },  // 8
{ q: "...", category: "Operational Procedures", correct: "Accidental static discharge", ... },      // 9
{ q: "...", category: "Operating Systems", correct: "Branch", ... },                               // 10
{ q: "...", category: "Security", correct: "Password policy", ... },                               // 11
{ q: "...", category: "Security", correct: "Rainbow table attack", ... },                          // 12
{ q: "...", category: "Operating Systems", correct: "Repair installation", ... },                  // 13
{ q: "...", category: "Operating Systems", correct: "The workstation couldn't reach the DHCP server", ... },  // 14
{ q: "...", category: "Security", correct: "BIOS password required", ... },                        // 15
{ q: "...", category: "Operational Procedures", correct: "Rollback plan", ... },                   // 16
{ q: "...", category: "Operating Systems", correct: "The network file share's permission...", ... }, // 17
{ q: "...", category: "Operating Systems", correct: "Network discovery", ... },                    // 18
{ q: "...", category: "Operational Procedures", correct: "An uninterruptible power supply (UPS)", ... },  // 19
{ q: "...", category: "Operating Systems", correct: "passwd", ... },                               // 20
{ q: "...", category: "Operating Systems", correct: "Migrate the FTP server...", ... },            // 21
{ q: "...", category: "Operating Systems", correct: ".py", ... },                                  // 22
{ q: "...", category: "Security", correct: "TACACS+", ... },                                       // 23
{ q: "...", category: "Security", correct: "Use social engineering...", ... },                     // 24
{ q: "...", category: "Operating Systems", correct: "Task scheduler", ... },                       // 25
{ q: "...", category: "Operating Systems", correct: "GPO", ... },                                  // 26
{ q: "...", category: "Operating Systems", correct: "yum", ... },                                  // 27
{ q: "...", category: "Operating Systems", correct: "nano", ... },                                 // 28
{ q: "...", category: "Software Troubleshooting", correct: "Use dedicated channels...", ... },      // 29
{ q: "...", category: "Software Troubleshooting", correct: "Investigate for malware...", ... },     // 30
{ q: "...", category: "Security", correct: "Administrator", ... },                                 // 31
{ q: "...", category: "Software Troubleshooting", correct: "Remove any proxy servers...", ... },    // 32
{ q: "...", category: "Operating Systems", correct: "Reboot the computer", ... },                  // 33
{ q: "...", category: "Operating Systems", correct: "bootrec /rebuildbcd", ... },                  // 34
{ q: "...", category: "Security", correct: "Patch management", ... },                              // 35
{ q: "...", category: "Operating Systems", correct: "Reboot the workstation into safe mode...", ... },  // 36
{ q: "...", category: "Operational Procedures", correct: "Server lock", ... },                     // 37
{ q: "...", category: "Security", correct: "User training and awareness", ... },                   // 38
{ q: "...", category: "Operational Procedures", correct: "A virtual machine has less downtime...", ... },  // 39
{ q: "...", category: "Security", correct: "Install the latest security updates...", ... },         // 40
{ q: "...", category: "Software Troubleshooting", correct: "Inaccuracies", ... },                  // 41
{ q: "...", category: "Security", correct: "Configure the ability to perform a remote wipe...", ... },  // 42
{ q: "...", category: "Software Troubleshooting", correct: "Clear the application's cache...", ... },  // 43
{ q: "...", category: "Security", correct: "WPS enabled, Router with outdated firmware", ... },     // 44
{ q: "...", category: "Operating Systems", correct: "Pro for Workstations", ... },                 // 45
{ q: "...", category: "Security", correct: "Lockout the account after 3 failed login attempts...", ... },  // 46
{ q: "...", category: "Security", correct: "PII", ... },                                           // 47
{ q: "...", category: "Security", correct: "Dictionary", ... },                                    // 48
{ q: "...", category: "Operating Systems", correct: "Public", ... },                               // 49
{ q: "...", category: "Security", correct: "MAC filtering", ... },                                 // 50
{ q: "...", category: "Operating Systems", correct: "sfc", ... },                                  // 51
```

**Category counts:** Operating Systems: 19, Security: 16, Software Troubleshooting: 9, Operational Procedures: 7

- [ ] **Step 2: Verify the tagging**

Check that:
- All 51 questions have a `category` field
- No trailing commas after the last field in any object
- The `correct` field still follows `category` (not before it)

- [ ] **Step 3: Commit**

```bash
git add Second_Chance.html
git commit -m "feat: tag all 51 questions with CompTIA domain categories"
```

---

## Task 2: Add categoryStats to state

**Files:**
- Modify: `Second_Chance.html` — state initialization, `startGame()`, `startReview()`, `handleAnswer()`

- [ ] **Step 1: Add `categoryStats` to state object**

```js
let state = {
  screen: 'start',
  mode: 'normal',
  deck: [],
  idx: 0,
  score: 0,
  lives: 3,
  streak: 0,
  correctCount: 0,
  answered: null,
  currentOptions: null,
  hiScore: 0,
  newHi: false,
  missed: [],
  categoryStats: {}  // { "Operating Systems": { correct: 0, missed: 0 }, ... }
};
```

- [ ] **Step 2: Initialize `categoryStats` in `startGame()`**

Add this line to `startGame()` (after `state.missed = []`):

```js
state.categoryStats = {
  "Operating Systems": { correct: 0, missed: 0 },
  "Security": { correct: 0, missed: 0 },
  "Software Troubleshooting": { correct: 0, missed: 0 },
  "Operational Procedures": { correct: 0, missed: 0 }
};
```

- [ ] **Step 3: Initialize `categoryStats` in `startReview()`**

Add the same initialization to `startReview()` (after `state.missed = []`):

```js
state.categoryStats = {
  "Operating Systems": { correct: 0, missed: 0 },
  "Security": { correct: 0, missed: 0 },
  "Software Troubleshooting": { correct: 0, missed: 0 },
  "Operational Procedures": { correct: 0, missed: 0 }
};
```

- [ ] **Step 4: Update `categoryStats` in `handleAnswer()`**

Add this right after the existing correct/wrong logic in `handleAnswer()`, inside the `if (isCorrect)` branch (before the score animation) and the `else` branch:

```js
// In the if (isCorrect) branch, add before animateScore:
state.categoryStats[q.category].correct += 1;

// In the else branch, add after state.missed.push(state.idx):
state.categoryStats[q.category].missed += 1;
```

- [ ] **Step 5: Verify the state changes**

Check that:
- `categoryStats` is initialized in both `startGame()` and `startReview()`
- It's incremented correctly in both branches of `handleAnswer()`
- The question object `q` is still accessible in both branches (it's `state.deck[state.idx]`)

- [ ] **Step 6: Commit**

```bash
git add Second_Chance.html
git commit -m "feat: add categoryStats tracking to game state"
```

---

## Task 3: Category breakdown CSS

**Files:**
- Modify: `Second_Chance.html` — the `<style>` block

- [ ] **Step 1: Add category breakdown styles**

Add these styles right before the closing `</style>` of the main `<style>` block (before the touch-device `<style>`):

```css
  /* ============ CATEGORY BREAKDOWN ============ */
  .category-breakdown {
    margin-top: 20px;
    margin-bottom: 28px;
    text-align: left;
  }

  .category-breakdown .cat-title {
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--ink-dim);
    margin-bottom: 12px;
    text-align: center;
  }

  .category-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .category-name {
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--ink-dim);
    min-width: 200px;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .category-bar {
    font-size: 14px;
    line-height: 1;
    letter-spacing: 0;
    user-select: none;
  }

  .category-count {
    font-family: 'VT323', monospace;
    font-size: 16px;
    color: var(--ink);
    min-width: 50px;
  }
```

- [ ] **Step 2: Add responsive rule**

Add this media query (inside the existing `@media (max-width: 560px)` block):

```css
  @media (max-width: 560px) {
    .answers { grid-template-columns: 1fr; }
    .hud { grid-template-columns: 1fr 1fr; gap: 12px; }
    .streak-box { grid-column: 1 / -1; text-align: center; }
    .category-name { min-width: 120px; font-size: 10px; }
  }
```

- [ ] **Step 3: Commit**

```bash
git add Second_Chance.html
git commit -m "style: add category breakdown CSS for end screen"
```

---

## Task 4: Render category breakdown on end screen

**Files:**
- Modify: `Second_Chance.html` — `renderEnd()` function

- [ ] **Step 1: Add category bar colors**

Add this helper function right before `renderEnd()`:

```js
const CATEGORY_COLORS = {
  "Operating Systems": "var(--cyan)",
  "Security": "var(--pink)",
  "Software Troubleshooting": "var(--green)",
  "Operational Procedures": "var(--yellow)"
};

function barFor(correct, total) {
  if (total === 0) return '░░░░░░░░░░░░';
  const filled = Math.round((correct / total) * 12);
  const empty = 12 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
```

- [ ] **Step 2: Build the category breakdown HTML**

Inside `renderEnd()`, after the `reviewBtn` variable and before `stage.innerHTML`, add:

```js
  // Build category breakdown rows, sorted by lowest accuracy first
  const catRows = Object.entries(state.categoryStats || {})
    .sort((a, b) => {
      const pctA = a[1].correct / (a[1].correct + a[1].missed) || 0;
      const pctB = b[1].correct / (b[1].correct + b[1].missed) || 0;
      return pctA - pctB;
    })
    .map(([name, stats]) => {
      const total = stats.correct + stats.missed;
      const color = CATEGORY_COLORS[name] || 'var(--ink)';
      const bar = barFor(stats.correct, total);
      return `
        <div class="category-row">
          <span class="category-name">${name}</span>
          <span class="category-bar" style="color: ${color}">${bar}</span>
          <span class="category-count">${stats.correct}/${total}</span>
        </div>
      `;
    }).join('');

  const catBreakdown = Object.keys(state.categoryStats || {}).length > 0 ? `
      <div class="category-breakdown">
        <div class="cat-title">CATEGORY BREAKDOWN</div>
        ${catRows}
      </div>
    ` : '';
```

- [ ] **Step 3: Insert into end screen HTML**

In the `stage.innerHTML` template for `renderEnd()`, insert `${catBreakdown}` right after the grade card and before the end-stats:

```html
      ${gradeHtml}

      ${catBreakdown}

      <div class="end-stats">
        ${statsHtml}
      </div>
```

- [ ] **Step 4: Verify**

Check that:
- Categories are sorted by lowest accuracy first
- Bars display correctly (█ and ░ characters)
- Zero-attempt categories show `░░░░░░░░░░░░ 0/0`
- The breakdown appears between grade card and stats

- [ ] **Step 5: Commit**

```bash
git add Second_Chance.html
git commit -m "feat: render category breakdown bar chart on end screen"
```

---

## Self-Review Checklist

1. **Spec coverage:** All requirements implemented? ✓ (data tagging, state tracking, bar chart, sorting, mode handling)
2. **Placeholder scan:** No "TBD", "TODO", or incomplete code? ✓
3. **Type consistency:** `categoryStats` key names match across all files? ✓
4. **Game integrity:** Normal mode unchanged when categories not used? ✓ (categories always available)
5. **Edge cases:** Zero attempts, streak mode, review mode all handled? ✓
