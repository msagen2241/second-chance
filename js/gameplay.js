// ============================================================
// GAMEPLAY — Power-ups, combo chain, boss questions, reward screen
// ============================================================
const Gameplay = {
  // Power-up state
  freezeActive: false,
  doubleActive: false,
  comboCount: 0,
  comboTimer: null,
  comboTimerRemaining: 0,
  lastAnswerTime: 0,

  // Track questions answered in current run for reward screen
  questionsAnswered: 0,
  bossDefeats: 0,

  // Initialize gameplay state for new run
  init() {
    this.freezeActive = false;
    this.doubleActive = false;
    this.comboCount = 0;
    this.questionsAnswered = 0;
    this.bossDefeats = 0;
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
  },

  // Check if current question is a boss
  isBoss(entry) {
    return entry && entry.question && entry.question.isBoss;
  },

  // Handle correct answer — check combo, streak milestones
  onCorrect(entry) {
    this.questionsAnswered++;
    if (this.isBoss(entry)) this.bossDefeats++;

    // Track questions answered (no combo timer)
    this.lastAnswerTime = Date.now();

    // Check for reward screen
    if (this.questionsAnswered % 5 === 0) {
      return 'reward';
    }
    if (this.isBoss(entry)) {
      return 'reward';
    }
    return null;
  },

  // Handle wrong answer
  onWrong(entry) {
    // Freeze protection
    if (this.freezeActive && Core.state.mode === 'normal') {
      this.freezeActive = false;
      // Don't lose life, just break combo
      this.comboCount = 0;
      if (this.comboTimer) {
        clearTimeout(this.comboTimer);
        this.comboTimer = null;
      }
      return 'freeze_used';
    }

    // Double or nothing penalty
    if (this.doubleActive) {
      this.doubleActive = false;
      if (Core.state.mode === 'normal') {
        Core.state.lives -= 1; // Extra life loss
      } else if (Core.state.mode === 'streak') {
        // Instant game over handled in Core.handleAnswer
      }
      return 'double_penalty';
    }

    return null;
  },

  // Get combo bonus (always 0, timer removed)
  comboBonus() {
    return 0;
  },

  // Get score multiplier
  scoreMultiplier() {
    let mult = 1;
    if (this.doubleActive) mult *= 2;
    // Add progression multiplier later
    return mult;
  },

  // Render reward screen
  renderReward(onPick) {
    const powerUps = this.generateRewardOptions();
    const stage = document.getElementById('stage');

    stage.innerHTML = `
      <div class="reward-screen">
        <div class="reward-title">⚡ POWER-UP SELECTED ⚡</div>
        <div class="reward-sub">Choose wisely...</div>
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
        const idx = parseInt(btn.dataset.idx);
        onPick(powerUps[idx]);
      });
    });

    stage.querySelector('.reward-skip').addEventListener('click', () => {
      onPick(null);
    });

    // Auto-skip after 3 seconds
    setTimeout(() => {
      if (document.querySelector('.reward-screen')) {
        onPick(null);
      }
    }, 3000);
  },

  // Generate reward options
  generateRewardOptions() {
    const allOptions = [
      { id: 'freeze', name: 'Freeze', icon: '❄️', desc: 'Block next life loss', action: () => { this.freezeActive = true; } },
      { id: 'double', name: 'Double or Nothing', icon: '🎲', desc: '2x points, 2x risk', action: () => { this.doubleActive = true; } },
      { id: 'xp_bonus', name: 'Quick XP', icon: '⚡', desc: '+50 XP now', action: () => { Progression.awardXP(50); } }
    ];

    // Shuffle and pick 2
    const shuffled = Core.shuffle(allOptions);
    return shuffled.slice(0, 2);
  },

  // Apply power-up selection
  applyPick(pick) {
    if (pick && pick.action) {
      pick.action();
    }
  },

  // Get active power-up indicators for HUD
  getPowerUpIndicators() {
    const indicators = [];
    if (this.freezeActive) indicators.push({ icon: '❄️', label: 'Freeze' });
    if (this.doubleActive) indicators.push({ icon: '🎲', label: '2x' });
    return indicators;
  },

  // Handle boss defeat (called from core.js after Juice effects)
  onBossDefeat() {
    // Already tracked bossDefeats in onCorrect, this is just for side effects
  },

  // Get combo timer HTML (always empty, timer removed)
  getComboTimerHTML() {
    return '';
  }
};
