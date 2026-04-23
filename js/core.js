// ============================================================
// CORE — Game state, rendering, and core game flow
// ============================================================
const Core = {
  state: {
    screen: 'start',
    mode: 'normal',   // 'normal' | 'streak' | 'review'
    courseId: 'comptia',
    deck: [],         // [{ id, question, isRetry }]
    idx: 0,
    score: 0,
    lives: 3,
    streak: 0,
    correctCount: 0,
    answered: null,   // { pickedIdx, correctIdx, options }
    currentOptions: null,
    hiScore: 0,
    newHi: false,
    missed: [],
    categoryStats: {}  // { "Operating Systems": { correct: 0, missed: 0 }, ... }
  },

  stage: null,

  init() {
    this.stage = document.getElementById('stage');
  },

  // Start a new game run
  async startGame() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();

    // Initialize gameplay state
    Gameplay.init();

    const questions = Courses.getQuestions();
    const questionIds = questions.map((_, i) => i);
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = this.state.mode === 'streak' ? 999 : 3;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  // Start review mode
  async startReview() {
    await Audio.ensure();
    if (this.state.missed.length === 0) {
      this.state.screen = 'end';
      this.render();
      return;
    }
    Audio.stopMusic();
    Audio.sfx('review');
    this.state.mode = 'review';
    this.state.deck = this.buildDeck(this.state.missed);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 0;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  // Handle answer selection
  async handleAnswer(pickedIdx) {
    if (this.state.answered) return;
    await Audio.ensure();
    if (this.state.answered) return;

    const entry = this.state.deck[this.state.idx];
    const q = entry.question;
    const { correctIdx } = this.state.currentOptions;
    const buttons = document.querySelectorAll('.answer-btn');
    if (pickedIdx < 0 || pickedIdx >= buttons.length) return;
    const isCorrect = pickedIdx === correctIdx;
    this.state.answered = { pickedIdx, correctIdx };

    buttons.forEach(b => b.disabled = true);

    // Mark correct answer always
    buttons[correctIdx].classList.add('correct');
    // Mark wrong pick if applicable
    if (!isCorrect) buttons[pickedIdx].classList.add('wrong');

    if (isCorrect) {
      this.state.streak += 1;
      this.state.correctCount += 1;
      this.clearMissed(entry.id);
      this.state.categoryStats[q.category].correct += 1;

      // Gameplay: update combo, track boss, check reward
      const rewardResult = Gameplay.onCorrect(entry);

      // Juice
      const btn = buttons[pickedIdx];
      if (btn) Juice.onCorrect(btn);

      // Progression
      const mult = Gameplay.scoreMultiplier();
      const comboBonus = Gameplay.comboBonus();
      const base = 100 * mult;
      const bonus = this.streakBonus(this.state.streak) + comboBonus;
      const gained = base + bonus;
      this.state.score += gained;
      Progression.awardXP(gained);

      // Check achievements after each correct answer
      Progression.checkAchievements();

      Audio.sfx('correct');
      if (this.state.streak >= 3) Audio.sfx('streak', Math.min(this.state.streak, 5));
      document.body.classList.add('flash-correct');
      setTimeout(() => document.body.classList.remove('flash-correct'), 300);
      this.animateScore(this.state.score - gained, this.state.score);

      // Check for streak milestone
      if (this.state.streak % 5 === 0) Juice.onStreakMilestone(Math.floor(this.state.streak / 5));

      // Check for boss defeat
      if (entry.isBoss) {
        Juice.onBossDefeat();
        Gameplay.onBossDefeat();
      }

      // Check for reward screen
      if (rewardResult === 'reward') {
        this.renderRewardScreen(() => this.advance());
        return;
      }
    } else {
      // Juice
      const btn = buttons[pickedIdx];
      if (btn) Juice.onWrong(btn);

      // Check Gameplay effects (freeze, double-or-nothing)
      const wrongResult = Gameplay.onWrong(entry);

      if (wrongResult === 'freeze_used') {
        // Freeze absorbed the hit — don't lose life, just break streak
        this.state.streak = 0;
        Audio.sfx('wrong');
        Juice.floatingText(window.innerWidth / 2, window.innerHeight / 2, 'FROZEN', '#00f0ff');
      } else {
        this.state.streak = 0;
        this.state.lives -= 1;
        this.trackMissed(entry.id);
        this.queueRetry(entry);
        this.state.categoryStats[q.category].missed += 1;
        Audio.sfx('wrong');
        Audio.sfx('heartLoss');
        document.body.classList.add('shake', 'flash-wrong');
        setTimeout(() => document.body.classList.remove('shake', 'flash-wrong'), 400);
        if (this.state.mode === 'streak') {
          setTimeout(() => { this.endGame(); }, 1500);
        }
      }
    }

    // Update HUD live
    const streakBox = document.querySelector('.streak-box');
    if (streakBox) {
      streakBox.className = `streak-box ${this.state.streak === 0 ? 'cold' : ''}`;
      streakBox.innerHTML = `<span class="icon">${this.state.streak === 0 ? '·' : '⚡'}</span><span>×${this.state.streak}</span>`;
    }
    document.querySelectorAll('.heart').forEach((h, i) => {
      h.classList.toggle('lost', i >= this.state.lives);
    });

    // Show feedback + navigation
    const fb = document.getElementById('feedbackSlot');
    const canBack = this.state.idx > 0;
    fb.innerHTML = `
      <div class="feedback ${isCorrect ? 'correct-fb' : 'wrong-fb'}">
        <strong>${isCorrect ? '> ACCESS GRANTED' : '> SYSTEM ERROR'}</strong>
        ${q.explain}
        <div style="margin-top: 10px; font-size: 11px; color: var(--ink-dim); letter-spacing: 2px;">
          ${isCorrect ? `+${100 + this.streakBonus(this.state.streak - 1)} PTS` : ''}
        </div>
        <div class="feedback-nav">
          ${canBack ? '<button class="btn-prev" id="prevBtn">◂ BACK</button>' : '<span></span>'}
          <button class="btn-next" id="nextBtn">NEXT ▸</button>
        </div>
      </div>
    `;
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => this.advance());
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.reviewPrevious());
  },

  // Review a previous question (read-only, no re-answering)
  reviewPrevious() {
    if (this.state.idx <= 0) return;
    this.state.answered = null;
    this.state.idx -= 1;

    const entry = this.state.deck[this.state.idx];
    const q = entry.question;
    this.state.currentOptions = this.buildOptions(q);
    this.renderGameReview();
  },

  // Render a review view of an already-answered question
  renderGameReview() {
    const entry = this.state.deck[this.state.idx];
    const q = entry.question;
    const { options, correctIdx } = this.state.currentOptions;
    const progress = ((this.state.idx) / this.state.deck.length) * 100;

    const livesHtml = this.state.mode === 'streak'
      ? `<span style="color: var(--yellow); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">STREAK MODE</span>`
      : this.state.mode === 'review'
        ? `<span style="color: var(--cyan); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">REVIEW MODE</span>`
        : `<div class="lives">
            ${[0,1,2].map(i => `<span class="heart ${i >= this.state.lives ? 'lost' : ''}">♥</span>`).join('')}
          </div>`;

    this.stage.innerHTML = `
      <div class="hud">
        ${livesHtml}
        <div class="score-box">
          <div class="label">SCORE</div>
          <div class="value" id="scoreVal">${this.state.score.toLocaleString()}</div>
        </div>
        <div class="streak-box ${this.state.streak === 0 ? 'cold' : ''}">
          <span class="icon">${this.state.streak === 0 ? '·' : '⚡'}</span>
          <span>×${this.state.streak}</span>
        </div>
        <button class="btn-menu" id="menuBtnGame" title="Return to menu">✕</button>
      </div>

      <div class="q-header">
        <span>QUESTION <span class="q-num">${this.state.idx + 1}</span> / ${this.state.deck.length} · REVIEW</span>
        <span>&nbsp;</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>

      <div class="question-card ${entry.isBoss ? 'boss-card' : ''}">
        ${entry.isBoss ? '<div class="boss-banner">★ BOSS QUESTION ★</div>' : ''}
        <div class="question-text">${q.q}</div>
      </div>

      <div class="answers" id="answers">
        ${options.map((opt, i) => `
          <button class="answer-btn" data-idx="${i}" disabled ${i === correctIdx ? 'class="correct"' : ''}>
            <span class="key">${i + 1}</span>
            <span class="text">${opt}</span>
          </button>
        `).join('')}
      </div>

      <div id="feedbackSlot">
        <div class="feedback correct-fb">
          <strong>▶ REVIEW MODE</strong>
          ${q.explain}
          <div class="feedback-nav">
            ${this.state.idx > 0 ? '<button class="btn-prev" id="prevBtn">◂ BACK</button>' : '<span></span>'}
            <button class="btn-next" id="nextBtn">NEXT ▸</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('menuBtnGame').addEventListener('click', () => {
      Audio.stopMusic();
      this.state.screen = 'start';
      this.state.mode = 'normal';
      this.renderStart();
      Audio.playTrack('start');
    });
    document.getElementById('nextBtn').addEventListener('click', () => this.advanceFromReview());
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.reviewPrevious());
  },

  // Advance from review mode back to current position
  advanceFromReview() {
    this.state.idx += 1;
    if (this.state.idx >= this.state.deck.length) {
      this.endGame();
      return;
    }
    this.state.currentOptions = this.buildOptions(this.state.deck[this.state.idx].question);
    this.renderGame();
  },

  // Advance to next question
  advance() {
    if (!this.state.answered) return;
    this.state.answered = null;
    this.state.idx += 1;

    if (this.state.idx >= this.state.deck.length) {
      this.endGame();
      return;
    }

    if (this.state.mode === 'normal' && this.state.lives <= 0) {
      this.endGame();
      return;
    }

    this.state.currentOptions = this.buildOptions(this.state.deck[this.state.idx].question);
    this.renderGame();
  },

  // End the current game
  endGame() {
    this.state.screen = 'end';
    if (this.state.score > this.state.hiScore) {
      this.state.newHi = true;
      this.state.hiScore = this.state.score;
      this.saveHi(this.state.score);
    } else {
      this.state.newHi = false;
    }

    // Record run stats
    const g = this.gradeFor(this.state.correctCount, this.state.deck.length);
    Progression.recordRun(this.state.score, this.state.correctCount, this.state.deck.length, g.letter);

    // Check achievements
    Progression.checkAchievements();

    this.renderEnd();
    Audio.stopMusic();
    if (this.state.mode === 'streak') {
      Audio.playTrack('gameover');
      return;
    }
    if (this.state.mode === 'review') {
      Audio.playTrack('victory');
      return;
    }
    const survived = this.state.lives > 0 && this.state.idx >= this.state.deck.length;
    if (survived) {
      Audio.sfx('deckClear');
      Audio.playTrack('victory');
      return;
    }
    Audio.playTrack('gameover');
  },

  // Render the current screen
  render() {
    if (this.state.screen === 'start') this.renderStart();
    else if (this.state.screen === 'game') this.renderGame();
    else if (this.state.screen === 'end') this.renderEnd();
  },

  // Render start screen
  renderStart() {
    const isStreak = this.state.mode === 'streak';
    const prog = Progression.data || { level: 0, totalXP: 0, skillPoints: 0, studyStreak: 0, achievements: [] };
    const xpNeeded = Progression.xpToNextLevel();
    const xpPct = prog.level >= 50 ? 100 : Math.min(100, (prog.totalXP % (100 * (prog.level + 1) + 200)) / (100 * (prog.level + 1) + 200) * 100);

    this.stage.innerHTML = `
      <div class="start">
        <div class="logo-top">// INITIALIZE</div>
        <h1 class="logo-main">SECOND<br>CHANCE</h1>
        <div class="logo-sub">CompTIA Redemption Run</div>

        <!-- Progression -->
        <div class="progression-panel">
          <div class="level-badge">LVL ${prog.level}</div>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" style="width: ${xpPct}%"></div>
            <span class="xp-text">${prog.totalXP.toLocaleString()} / ${prog.level >= 50 ? 'MAX' : (prog.totalXP + xpNeeded).toLocaleString()}</span>
          </div>
          ${prog.skillPoints > 0 ? `<div class="skill-points-badge">+${prog.skillPoints} SKILL PTS</div>` : ''}
        </div>

        <!-- Streak + Achievements -->
        <div class="meta-stats">
          ${prog.studyStreak > 0 ? `
            <div class="meta-stat">
              <span class="meta-icon">🔥</span>
              <span class="meta-value">${prog.studyStreak} DAY STREAK</span>
            </div>
          ` : ''}
          ${prog.achievements.length > 0 ? `
            <div class="meta-stat">
              <span class="meta-icon">🏆</span>
              <span class="meta-value">${prog.achievements.length} ACHIEVEMENTS</span>
            </div>
          ` : ''}
        </div>

        <div class="mode-picker">
          <button class="mode-btn ${!isStreak ? 'active' : ''}" id="modeNormal">NORMAL</button>
          <button class="mode-btn ${isStreak ? 'active' : ''}" id="modeStreak">STREAK</button>
        </div>

        <div class="stat-row">
          <div class="stat-chip"><b>51</b>QUESTIONS</div>
          <div class="stat-chip">${isStreak ? '<b>∞</b>NO LIVES' : '<b>3</b>LIVES'}</div>
          <div class="stat-chip"><b>∞</b>STREAK BONUS</div>
        </div>

        ${this.state.hiScore > 0 ? `
          <div class="hi-score">
            <div class="label">HIGH SCORE</div>
            ${this.state.hiScore.toLocaleString()}
          </div>
        ` : ''}

        <button class="btn-start" id="startBtn">▶ PRESS START</button>
        <button class="btn-secondary" id="skillTreeBtn">⚡ SKILL TREE</button>
        <div class="hint">TIP: press 1-4 to answer · ENTER to continue</div>
      </div>
    `;
    document.getElementById('modeNormal').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.state.mode = 'normal';
      this.renderStart();
    });
    document.getElementById('modeStreak').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.state.mode = 'streak';
      this.renderStart();
    });
    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('skillTreeBtn').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      Audio.stopMusic();
      Progression.renderSkillTree(() => {
        this.state.screen = 'start';
        this.renderStart();
        Audio.playTrack('start');
      });
    });
    Audio.playTrack('start');
  },

  // Render game screen
  renderGame() {
    const entry = this.state.deck[this.state.idx];
    const q = entry.question;
    const { options, correctIdx } = this.state.currentOptions;

    const progress = ((this.state.idx) / this.state.deck.length) * 100;
    const livesHtml = this.state.mode === 'streak'
      ? `<span style="color: var(--yellow); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">STREAK MODE</span>`
      : this.state.mode === 'review'
        ? `<span style="color: var(--cyan); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">REVIEW MODE</span>`
        : `<div class="lives">
            ${[0,1,2].map(i => `<span class="heart ${i >= this.state.lives ? 'lost' : ''}">♥</span>`).join('')}
          </div>`;

    this.stage.innerHTML = `
      <div class="hud">
        ${livesHtml}
        <div class="score-box">
          <div class="label">SCORE</div>
          <div class="value" id="scoreVal">${this.state.score.toLocaleString()}</div>
        </div>
        <div class="streak-box ${this.state.streak === 0 ? 'cold' : ''}">
          <span class="icon">${this.state.streak === 0 ? '·' : '⚡'}</span>
          <span>×${this.state.streak}</span>
        </div>
        <button class="btn-menu" id="menuBtnGame" title="Return to menu">✕</button>
      </div>

      <div class="q-header">
        <span>QUESTION <span class="q-num">${this.state.idx + 1}</span> / ${this.state.deck.length}${entry.isRetry ? ' · RETRY' : ''}</span>
        <span>${this.state.streak >= 3 ? `+${this.streakBonus(this.state.streak)} streak bonus` : '&nbsp;'}</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>

      <!-- Combo timer -->
      ${Gameplay.getComboTimerHTML()}

      <!-- Power-up indicators -->
      ${Gameplay.getPowerUpIndicators().length > 0 ? `
        <div class="power-up-indicators">
          ${Gameplay.getPowerUpIndicators().map(ind => `
            <span class="power-up-indicator">${ind.icon} ${ind.label}</span>
          `).join('')}
        </div>
      ` : ''}

      <div class="question-card ${entry.isBoss ? 'boss-card' : ''}">
        ${entry.isBoss ? '<div class="boss-banner">★ BOSS QUESTION ★</div>' : ''}
        <div class="question-text">${q.q}</div>
      </div>

      <div class="answers" id="answers">
        ${options.map((opt, i) => `
          <button class="answer-btn" data-idx="${i}">
            <span class="key">${i + 1}</span>
            <span class="text">${opt}</span>
          </button>
        `).join('')}
      </div>

      <div id="feedbackSlot"></div>
    `;

    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleAnswer(parseInt(btn.dataset.idx)));
    });
    document.getElementById('menuBtnGame').addEventListener('click', () => {
      Audio.stopMusic();
      this.state.screen = 'start';
      this.state.mode = 'normal';
      this.renderStart();
      Audio.playTrack('start');
    });
  },

  // Render end screen
  renderEnd() {
    const survived = this.state.lives > 0 && this.state.idx >= this.state.deck.length;
    const g = this.gradeFor(this.state.correctCount, this.state.deck.length);

    // Mode overrides
    let title, sub, showGrade;
    if (this.state.mode === 'streak') {
      title = this.state.streak === 0 ? 'FIRST BLOOD' : 'STREAK BROKEN';
      sub = `STREAK: ${this.state.streak} CORRECT${this.state.streak > 0 ? ' · SCORE: ' + this.state.score.toLocaleString() : ''}`;
      showGrade = false;
    } else if (this.state.mode === 'review') {
      title = 'REVIEW COMPLETE';
      sub = `${this.state.correctCount}/${this.state.deck.length} CORRECT`;
      showGrade = false;
    } else {
      title = survived ? 'RUN COMPLETE' : 'GAME OVER';
      sub = g.msg;
      showGrade = true;
    }

    const statsHtml = this.state.mode === 'streak'
      ? `<div class="end-stat"><div class="l">STREAK</div><div class="v">${this.state.streak}</div></div>
         <div class="end-stat"><div class="l">SCORE</div><div class="v">${this.state.score.toLocaleString()}</div></div>
         <div class="end-stat"><div class="l">ATTEMPTED</div><div class="v">${this.state.correctCount + (this.state.mode === 'streak' ? 1 : 0)}</div></div>`
      : this.state.mode === 'review'
        ? `<div class="end-stat"><div class="l">CORRECT</div><div class="v">${this.state.correctCount}/${this.state.deck.length}</div></div>
           <div class="end-stat"><div class="l">STREAK</div><div class="v">${this.state.streak}</div></div>
           <div class="end-stat"><div class="l">SCORE</div><div class="v">${this.state.score.toLocaleString()}</div></div>`
        : `<div class="end-stat"><div class="l">SCORE</div><div class="v">${this.state.score.toLocaleString()}</div></div>
           <div class="end-stat"><div class="l">CORRECT</div><div class="v">${this.state.correctCount}/${this.state.deck.length}</div></div>
           <div class="end-stat"><div class="l">HI-SCORE</div><div class="v">${this.state.hiScore.toLocaleString()}</div></div>`;

    const gradeHtml = showGrade ? `
        <div class="grade-card">
          <div class="g-label">FINAL GRADE</div>
          <div class="grade" style="color: ${g.color};">${g.letter}</div>
        </div>
      ` : '';

    const reviewBtn = this.state.mode === 'normal' && this.state.missed.length > 0 ? `
        <button class="btn-secondary" id="reviewBtn">REVIEW MISSED (${this.state.missed.length})</button>
      ` : '';

    // Build category breakdown rows, sorted by lowest accuracy first
    const catRows = Object.entries(this.state.categoryStats || {})
      .sort((a, b) => {
        const pctA = a[1].correct / (a[1].correct + a[1].missed) || 0;
        const pctB = b[1].correct / (b[1].correct + b[1].missed) || 0;
        return pctA - pctB;
      })
      .map(([name, stats]) => {
        const total = stats.correct + stats.missed;
        const color = this.categoryColor(name);
        const bar = this.barFor(stats.correct, total);
        return `
          <div class="category-row">
            <span class="category-name">${name}</span>
            <span class="category-bar" style="color: ${color}">${bar}</span>
            <span class="category-count">${stats.correct}/${total}</span>
          </div>
        `;
      }).join('');

    const catBreakdown = Object.keys(this.state.categoryStats || {}).length > 0 ? `
        <div class="category-breakdown">
          <div class="cat-title">CATEGORY BREAKDOWN</div>
          ${catRows}
        </div>
      ` : '';

    this.stage.innerHTML = `
      <div class="end">
        <h1 class="end-title ${survived || (this.state.mode === 'streak' && this.state.streak > 0) ? 'win' : 'lose'}">${title}</h1>
        <div class="end-sub">${sub}</div>

        ${gradeHtml}

        ${catBreakdown}

        <div class="end-stats">
          ${statsHtml}
        </div>

        ${this.state.newHi ? `<div class="new-hi">★ NEW HIGH SCORE ★</div>` : ''}

        <div class="end-buttons">
          <button class="btn-retry" id="retryBtn">▶ PLAY AGAIN</button>
          ${reviewBtn}
          <button class="btn-secondary" id="menuBtn">MENU</button>
        </div>
      </div>
    `;
    document.getElementById('retryBtn').addEventListener('click', () => this.startGame());
    const menuBtn = document.getElementById('menuBtn');
    menuBtn.addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.state.screen = 'start';
      this.state.mode = 'normal';
      this.render();
    });
    const reviewBtnEl = document.getElementById('reviewBtn');
    if (reviewBtnEl) {
      reviewBtnEl.addEventListener('click', () => this.startReview());
    }
  },

  // Render reward screen (called from handleAnswer after every 5th correct or boss defeat)
  renderRewardScreen(onContinue) {
    const powerUps = Gameplay.generateRewardOptions();
    const stage = document.getElementById('stage');

    stage.innerHTML = `
      <div class="reward-screen">
        <div class="reward-title">⚡ POWER-UP SELECTED ⚡</div>
        <div class="reward-sub">Choose wisely... <span id="rewardTimer">(10s)</span></div>
        <div class="reward-options">
          ${powerUps.map((pu, i) => `
            <button class="reward-btn" data-idx="${i}">
              <span class="reward-icon">${pu.icon}</span>
              <span class="reward-name">${pu.name}</span>
              <span class="reward-desc">${pu.desc}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn-secondary reward-skip">SKIP</button>
      </div>
    `;

    stage.querySelectorAll('.reward-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        clearInterval(timerInterval);
        const idx = parseInt(btn.dataset.idx);
        Gameplay.applyPick(powerUps[idx]);
        Juice.onPowerUpPick(btn);
        Audio.sfx('click');
        onContinue();
      });
    });

    stage.querySelector('.reward-skip').addEventListener('click', () => {
      clearInterval(timerInterval);
      Audio.sfx('click');
      onContinue();
    });

    // Countdown timer
    let timeLeft = 10;
    const timerEl = document.getElementById('rewardTimer');
    const timerInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) timerEl.textContent = `(${timeLeft}s)`;
      if (timeLeft <= 0) clearInterval(timerInterval);
    }, 1000);

    // Auto-skip after 10 seconds
    setTimeout(() => {
      clearInterval(timerInterval);
      if (document.querySelector('.reward-screen')) {
        onContinue();
      }
    }, 10000);
  },

  // Helper: category color
  categoryColor(name) {
    const colors = {
      "Operating Systems": "var(--cyan)",
      "Security": "var(--pink)",
      "Software Troubleshooting": "var(--green)",
      "Operational Procedures": "var(--yellow)"
    };
    return colors[name] || 'var(--ink)';
  },

  // Helper: bar for category stats
  barFor(correct, total) {
    if (total === 0) return '\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591';
    const filled = Math.round((correct / total) * 12);
    const empty = 12 - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  },

  // Animate score counter
  animateScore(from, to) {
    const el = document.getElementById('scoreVal');
    if (!el) return;
    const steps = 20;
    const delta = (to - from) / steps;
    let cur = from;
    let i = 0;
    const iv = setInterval(() => {
      cur += delta;
      i++;
      el.textContent = Math.round(cur).toLocaleString();
      if (i >= steps) {
        clearInterval(iv);
        el.textContent = to.toLocaleString();
      }
    }, 20);
  },

  // Build shuffled deck
  buildDeck(questionIds) {
    const shuffled = this.shuffle(questionIds);
    const questions = Courses.getQuestions();
    return shuffled.map(id => ({
      id,
      question: questions[id],
      isRetry: false,
      isBoss: questions[id].isBoss || false
    }));
  },

  // Build shuffled options
  buildOptions(question) {
    const all = [question.correct, ...question.distractors];
    const shuffled = this.shuffle(all);
    const correctIdx = shuffled.indexOf(question.correct);
    return { options: shuffled, correctIdx, category: question.category };
  },

  // Empty category stats
  emptyCategoryStats() {
    const categories = Courses.getCategories();
    const stats = {};
    categories.forEach(cat => { stats[cat] = { correct: 0, missed: 0 }; });
    return stats;
  },

  // Track missed question
  trackMissed(questionId) {
    if (!this.state.missed.includes(questionId)) this.state.missed.push(questionId);
  },

  // Clear missed question
  clearMissed(questionId) {
    this.state.missed = this.state.missed.filter(id => id !== questionId);
  },

  // Check if question has future retry
  hasFutureRetry(questionId) {
    return this.state.deck.slice(this.state.idx + 1).some(entry => entry.id === questionId);
  },

  // Queue retry for missed question
  queueRetry(entry) {
    if (this.state.mode === 'streak' || this.hasFutureRetry(entry.id)) return;
    this.state.deck.push({
      id: entry.id,
      question: entry.question,
      isRetry: true
    });
  },

  // Streak bonus calculation
  streakBonus(streak) {
    return Math.min(streak * 20, 100);
  },

  // Grade calculation
  gradeFor(correct, total) {
    const pct = correct / total;
    if (pct >= 0.9) return { letter: 'S', color: 'var(--yellow)', msg: 'FLAWLESS VICTORY' };
    if (pct >= 0.8) return { letter: 'A', color: 'var(--green)', msg: 'CERT-READY' };
    if (pct >= 0.7) return { letter: 'B', color: 'var(--cyan)', msg: 'STRONG RUN' };
    if (pct >= 0.6) return { letter: 'C', color: 'var(--cyan)', msg: 'KEEP GRINDING' };
    if (pct >= 0.4) return { letter: 'D', color: 'var(--pink)', msg: 'BACK TO THE BOOKS' };
    return { letter: 'F', color: 'var(--red)', msg: 'RESPAWN REQUIRED' };
  },

  // Shuffle array
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Save high score (legacy compatibility)
  async saveHi(score) {
    try {
      await window.storage.set('hiscore_v1', String(score));
    } catch (e) { /* silent */ }
  },

  // Load high score (legacy compatibility)
  async loadHi() {
    try {
      const r = await window.storage.get('hiscore_v1');
      if (r && r.value) this.state.hiScore = parseInt(r.value) || 0;
    } catch (e) { /* no saved score */ }
  }
};
