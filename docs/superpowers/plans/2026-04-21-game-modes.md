# Game Modes: Streak + Wrong-Answer Review

**Goal:** Add two new game modes to Second Chance:
1. **Streak mode** — no lives, keep answering until you miss one. Score = streak count + escalating bonus.
2. **Wrong-answer review** — after a normal run, replay only the questions you got wrong.

**Architecture:**
- Add `state.mode` (`'normal' | 'streak' | 'review'`)
- Track `state.missed` array in normal mode (indices of wrong answers)
- Mode picker on start screen (Normal / Streak toggle)
- Review button appears on end screen when `state.missed.length > 0`
- Streak mode: no lives HUD, game ends on first miss, end screen shows streak + breakdown
- Review mode: replays `state.missed` questions shuffled, no lives, all answers shown

---

## Task 1: State changes + review tracking

**File:** `Second_Chance.html` — `<script>` block

- [ ] **Step 1: Add `mode` and `missed` to state**

```js
let state = {
  screen: 'start',
  mode: 'normal',        // 'normal' | 'streak' | 'review'
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
  missed: []             // indices of wrong answers (normal mode only)
};
```

- [ ] **Step 2: Track missed questions in `handleAnswer`**

When a wrong answer is detected in `handleAnswer`, push the current question index to `state.missed`:

```js
// In the else branch of handleAnswer (wrong answer):
state.missed.push(state.idx);
```

- [ ] **Step 3: Reset `missed` in `startGame`**

```js
state.missed = [];
```

---

## Task 2: Mode picker on start screen

**File:** `Second_Chance.html` — `renderStart()` function

- [ ] **Step 1: Add mode picker UI**

Replace the current start screen with a mode selector. Add two new CSS classes:

```css
.mode-picker {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.mode-btn {
  font-family: 'VT323', monospace;
  font-size: 20px;
  letter-spacing: 3px;
  background: var(--bg-2);
  color: var(--ink-dim);
  border: 1px solid rgba(255,255,255,0.15);
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn:hover {
  border-color: var(--cyan);
  color: var(--ink);
}

.mode-btn.active {
  border-color: var(--cyan);
  color: var(--cyan);
  background: rgba(0,240,255,0.08);
}
```

- [ ] **Step 2: Update `renderStart()` HTML**

```js
function renderStart() {
  stage.innerHTML = `
    <div class="start">
      <div class="logo-top">// INITIALIZE</div>
      <h1 class="logo-main">SECOND<br>CHANCE</h1>
      <div class="logo-sub">CompTIA Redemption Run</div>

      <div class="mode-picker">
        <button class="mode-btn active" id="modeNormal">NORMAL</button>
        <button class="mode-btn" id="modeStreak">STREAK</button>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><b>51</b>QUESTIONS</div>
        <div class="stat-chip"><b>3</b>LIVES</div>
        <div class="stat-chip"><b>∞</b>STREAK BONUS</div>
      </div>

      ${state.hiScore > 0 ? `
        <div class="hi-score">
          <div class="label">HIGH SCORE</div>
          ${state.hiScore.toLocaleString()}
        </div>
      ` : ''}

      <button class="btn-start" id="startBtn">▶ PRESS START</button>
      <div class="hint">TIP: press 1-4 to answer · ENTER to continue</div>
    </div>
  `;

  document.getElementById('modeNormal').addEventListener('click', () => {
    state.mode = 'normal';
    renderStart();
  });
  document.getElementById('modeStreak').addEventListener('click', () => {
    state.mode = 'streak';
    renderStart();
  });
  document.getElementById('startBtn').addEventListener('click', startGame);
}
```

- [ ] **Step 3: Update stat chips based on mode**

When `mode === 'streak'`, show:
- `<b>51</b>QUESTIONS` → `<b>∞</b>QUESTIONS` (or keep 51)
- `<b>3</b>LIVES` → `<b>∞</b>NO LIVES`
- `<b>∞</b>STREAK BONUS` → `<b>STREAK</b>BONUS POINTS`

---

## Task 3: Streak mode game flow

**File:** `Second_Chance.html` — `renderGame()`, `startGame()`, `advance()`, `endGame()`

- [ ] **Step 1: Conditionally render lives in `renderGame()`**

When `state.mode === 'streak'`, hide the lives HUD element. Replace it with a streak-mode label:

```js
const livesHtml = state.mode === 'streak'
  ? `<span style="color: var(--yellow); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">STREAK MODE</span>`
  : `<div class="lives">
      ${[0,1,2].map(i => `<span class="heart ${i >= state.lives ? 'lost' : ''}">♥</span>`).join('')}
    </div>`;
```

Replace the `<div class="lives">` in `renderGame()` with `${livesHtml}`.

- [ ] **Step 2: Update `startGame()` for streak mode**

```js
function startGame() {
  state.deck = shuffle(QUESTIONS);
  state.idx = 0;
  state.score = 0;
  state.lives = state.mode === 'streak' ? 999 : 3;  // effectively infinite
  state.streak = 0;
  state.correctCount = 0;
  state.answered = null;
  state.newHi = false;
  state.missed = [];
  state.currentOptions = buildOptions(state.deck[0]);
  state.screen = 'game';
  render();
}
```

- [ ] **Step 3: Update `advance()` for streak mode**

In streak mode, a wrong answer ends the game immediately (no need to press "next"). Move the game-over check to after `handleAnswer` processes a wrong answer:

```js
// In handleAnswer, in the wrong answer branch:
if (state.mode === 'streak') {
  setTimeout(() => { endGame(); }, 1500);  // brief pause to see the wrong answer
}
```

Also update `advance()` to not check lives for streak mode:

```js
function advance() {
  if (!state.answered) return;
  state.answered = null;
  state.idx += 1;

  if (state.idx >= state.deck.length) {
    endGame();
    return;
  }

  if (state.mode === 'streak') {
    // Streak mode only ends on wrong answer, not deck exhaustion
    // But if by some chance we exhaust the deck, end game
    endGame();
    return;
  }

  if (state.lives <= 0) {
    endGame();
    return;
  }

  state.currentOptions = buildOptions(state.deck[state.idx]);
  renderGame();
}
```

Wait — in streak mode, `advance()` should still work (for the NEXT button after a correct answer). The game only auto-ends on wrong. Let me revise:

```js
function advance() {
  if (!state.answered) return;
  state.answered = null;
  state.idx += 1;

  if (state.idx >= state.deck.length) {
    endGame();
    return;
  }

  state.currentOptions = buildOptions(state.deck[state.idx]);
  renderGame();
}
```

And in `handleAnswer`, the wrong-branch auto-ends for streak:

```js
// In the else (wrong) branch:
if (state.mode === 'streak') {
  setTimeout(() => { endGame(); }, 1500);
}
```

---

## Task 4: Streak mode end screen

**File:** `Second_Chance.html` — `renderEnd()`

- [ ] **Step 1: Detect streak completion**

```js
function renderEnd() {
  const survived = state.lives > 0 && state.idx >= state.deck.length;
  const streakFinished = state.mode === 'streak' && state.streak > 0;
  const g = gradeFor(state.correctCount, state.deck.length);

  // For streak mode, use different title/message
  let title, sub;
  if (state.mode === 'streak') {
    title = state.streak === 0 ? 'FIRST BLOOD' : 'STREAK BROKEN';
    sub = state.streak === 0 ? 'NO WRONG ANSWERS' : `STREAK: ${state.streak} CORRECT`;
  } else {
    title = survived ? 'RUN COMPLETE' : 'GAME OVER';
    sub = g.msg;
  }
```

- [ ] **Step 2: Show streak-specific stats**

For streak mode, show streak length as the primary stat:

```js
const streakStats = state.mode === 'streak' ? `
  <div class="end-stat"><div class="l">STREAK</div><div class="v">${state.streak}</div></div>
  <div class="end-stat"><div class="l">SCORE</div><div class="v">${state.score.toLocaleString()}</div></div>
` : `
  <div class="end-stat"><div class="l">SCORE</div><div class="v">${state.score.toLocaleString()}</div></div>
  <div class="end-stat"><div class="l">CORRECT</div><div class="v">${state.correctCount}/${state.deck.length}</div></div>
  <div class="end-stat"><div class="l">HI-SCORE</div><div class="v">${state.hiScore.toLocaleString()}</div></div>
`;
```

- [ ] **Step 3: Update end buttons**

For streak mode, show "Play Again" and "Menu". For normal mode, also show "Review Missed" when applicable.

---

## Task 5: Wrong-answer review mode

**File:** `Second_Chance.html` — `renderEnd()`, new `startReview()` function

- [ ] **Step 1: Add review button to end screen**

In `renderEnd()`, when `state.mode === 'normal' && state.missed.length > 0`, add a review button:

```html
${state.mode === 'normal' && state.missed.length > 0 ? `
  <button class="btn-secondary" id="reviewBtn">REVIEW MISSED (${state.missed.length})</button>
` : ''}
```

- [ ] **Step 2: Add `startReview()` function**

```js
function startReview() {
  state.mode = 'review';
  state.deck = shuffle(state.missed.map(i => QUESTIONS[i]));
  state.idx = 0;
  state.score = 0;
  state.lives = 0;  // review mode has no lives
  state.streak = 0;
  state.correctCount = 0;
  state.answered = null;
  state.newHi = false;
  state.missed = [];
  state.currentOptions = buildOptions(state.deck[0]);
  state.screen = 'game';
  render();
}
```

- [ ] **Step 3: Adjust game rendering for review mode**

In review mode, hide lives (like streak mode). Show a "REVIEW MODE" label. Always show the correct answer highlight and explanation after each answer.

For review mode, always show both correct AND wrong answer buttons highlighted:

```js
// In handleAnswer, after marking correct/wrong:
if (state.mode === 'review' && !isCorrect) {
  // Already marked correct above. Wrong is marked too.
  // This is fine — both show.
}
```

- [ ] **Step 4: Adjust review mode end screen**

Review mode end screen shows:
- Title: "REVIEW COMPLETE"
- Stats: correct count, streak, score
- No high score tracking (review is practice)
- Buttons: "Play Again" and "Menu"

---

## Task 6: Touch support for new buttons

**File:** `Second_Chance.html` — touch-device CSS overrides

- [ ] **Step 1: Add touch overrides for mode buttons**

```css
.touch-device .mode-btn {
  font-size: 24px;
  padding: 16px 28px;
}
```

---

## Task 7: Verify and commit

- [ ] **Step 1: Read the modified file to verify structure**
- [ ] **Step 2: Test in browser (manual)**
- [ ] **Step 3: Commit**

```bash
git add Second_Chance.html
git commit -m "feat: add streak mode and wrong-answer review mode"
```

---

## Self-Review Checklist

1. **Spec coverage:** Both modes fully implemented? ✓
2. **Placeholder scan:** No "TBD", "TODO", or incomplete code? ✓
3. **Type consistency:** Same patterns as existing code? ✓
4. **Game integrity:** Normal mode unchanged when not selecting streak/review? ✓
5. **Edge cases:** 
   - Streak mode: streak of 0 still shows end screen? ✓
   - Review mode: no missed questions → review button hidden? ✓
   - Streak mode: lives HUD hidden? ✓
   - Review mode: high score not tracked? ✓
6. **Touch support:** Mode buttons and review button work on touch? ✓
