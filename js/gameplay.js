// ============================================================
// GAMEPLAY — Boss tracking and lightweight run state
// ============================================================
const Gameplay = {
  comboCount: 0,
  comboTimer: null,
  comboTimerRemaining: 0,
  lastAnswerTime: 0,

  // Track questions answered in current run
  questionsAnswered: 0,
  bossDefeats: 0,

  // Initialize gameplay state for new run
  init() {
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

  // Handle correct answer
  onCorrect(entry) {
    this.questionsAnswered++;
    if (this.isBoss(entry)) this.bossDefeats++;

    this.lastAnswerTime = Date.now();
    return null;
  },

  // Handle wrong answer
  onWrong(entry) {
    return null;
  },

  // Get combo bonus (always 0, timer removed)
  comboBonus() {
    return 0;
  },

  // Get score multiplier
  scoreMultiplier() {
    return 1;
  },

  // No power-up indicators remain in the runtime
  getPowerUpIndicators() {
    return [];
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
