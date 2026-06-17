// ============================================================
// CORE — Game state, rendering, and core game flow
// ============================================================
const Core = {
  SAVED_SESSION_KEY: 'saved_session_v1',
  autoAdvanceTimer: null,
  state: {
    screen: 'start',
    mode: 'normal',   // 'normal' | 'study' | 'streak' | 'review' | 'interleave' | 'redflag' | 'confidence' | 'pretest' | 'quickfire' | 'shortmix' | 'glossary' | 'instructor'
    courseId: 'itil4',
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
    categoryStats: {},  // { "Operating Systems": { correct: 0, missed: 0 }, ... }
    studyCategory: null,
    instructorFocus: null,
    awaitingConfidence: false,
    confidenceChoice: null,
    pretestPhase: null,
    pretestSourceIds: null
  },

  stage: null,

  init() {
    this.stage = document.getElementById('stage');
  },

  isInfiniteMode(mode = this.state.mode) {
    return ['study', 'review', 'confidence', 'interleave', 'redflag', 'pretest', 'quickfire', 'shortmix', 'glossary', 'instructor'].includes(mode);
  },

  modeBanner(mode = this.state.mode) {
    if (mode === 'streak') {
      return `<span style="color: var(--yellow); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">STREAK MODE</span>`;
    }
    if (mode === 'study') {
      return `<span style="color: var(--green); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">STUDY MODE</span>`;
    }
    if (mode === 'interleave') {
      return `<span style="color: var(--cyan); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">INTERLEAVE MODE</span>`;
    }
    if (mode === 'redflag') {
      return `<span style="color: var(--red); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">RED FLAG MODE</span>`;
    }
    if (mode === 'confidence') {
      return `<span style="color: var(--pink); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">CONFIDENCE MODE</span>`;
    }
    if (mode === 'pretest') {
      return `<span style="color: var(--yellow); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">PRETEST MODE</span>`;
    }
    if (mode === 'quickfire') {
      return `<span style="color: var(--red); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">QUICKFIRE MODE</span>`;
    }
    if (mode === 'shortmix') {
      return `<span style="color: var(--cyan); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">SHORT MIX</span>`;
    }
    if (mode === 'glossary') {
      return `<span style="color: var(--green); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">GLOSSARY DRILL</span>`;
    }
    if (mode === 'instructor') {
      return `<span style="color: var(--yellow); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">INSTRUCTOR FOCUS</span>`;
    }
    if (mode === 'review') {
      return `<span style="color: var(--cyan); font-family: 'VT323', monospace; font-size: 22px; letter-spacing: 2px;">REVIEW MODE</span>`;
    }
    return `<div class="lives">
      ${[0,1,2].map(i => `<span class="heart ${i >= this.state.lives ? 'lost' : ''}">♥</span>`).join('')}
    </div>`;
  },

  async buildWeaknessQuestionIds() {
    const accuracy = await ErrorLog.getCategoryAccuracy(this.state.courseId);
    const categories = Object.entries(accuracy)
      .map(([name, data]) => ({ name, pct: data.total > 0 ? data.correct / data.total : 1 }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 2)
      .map(c => c.name);
    const filterCats = categories.length > 0
      ? categories.filter(name => name !== 'Glossary Terms')
      : this.fullDeckCategories();
    const questions = Courses.getQuestions();
    return questions
      .map((q, i) => q.includeInFullDeck !== false && filterCats.includes(q.category) ? i : -1)
      .filter(i => i >= 0);
  },

  // Start a new game run
  async startGame() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    // Initialize gameplay state
    Gameplay.init();

    // Start analytics session
    Analytics.startSession(this.state.courseId);

    const questionIds = this.fullDeckQuestionIds();
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = this.isInfiniteMode() || this.state.mode === 'streak' ? 999 : 3;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  async startShortMix() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const pool = this.fullDeckQuestionIds();
    const size = Math.min(Courses.current?.shortStudySize || 25, pool.length);
    const questionIds = this.shuffle(pool).slice(0, size);

    this.state.mode = 'shortmix';
    this.state.studyCategory = 'Short Mix';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  // Start review mode
  async startReview() {
    await Audio.ensure();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();
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

  // Start category-focused study session
  async startCategory(category) {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    if (category === 'Glossary Terms') {
      await this.startGlossaryDrill();
      return;
    }

    const questions = Courses.getQuestions();
    const questionIds = questions.map((q, i) => q.category === category ? i : -1).filter(i => i >= 0);
    this.state.mode = 'category';
    this.state.studyCategory = category;
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 3;
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

  // Start weakness-focused study (auto-picks your bottom 2 categories)
  async startWeakness() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questionIds = await this.buildWeaknessQuestionIds();

    this.state.mode = 'weakness';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 3;
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

  async startInterleaveWeakness() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questionIds = await this.buildWeaknessQuestionIds();
    this.state.mode = 'interleave';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  async startRedFlag() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const mostMissed = await ErrorLog.getMostMissed(this.state.courseId, 20);
    const weakest = await Spaced.getWeakestQuestions(this.state.courseId, 20, 60);
    const questionIds = [...new Set([...mostMissed, ...weakest])];
    const fallback = questionIds.length > 0 ? questionIds : await this.buildWeaknessQuestionIds();

    this.state.mode = 'redflag';
    this.state.deck = this.buildDeck(fallback);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  async startConfidence() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questionIds = this.fullDeckQuestionIds();
    this.state.mode = 'confidence';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  async startPretest() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questionIds = this.fullDeckQuestionIds();
    this.state.mode = 'pretest';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = 'pretest';
    this.state.pretestSourceIds = questionIds.slice();
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  // Start cram mode (your most-missed questions)
  async startCram() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const mostMissed = await ErrorLog.getMostMissed(this.state.courseId, 30);
    const questionIds = mostMissed.length > 0 ? mostMissed : this.fullDeckQuestionIds();

    this.state.mode = 'cram';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 3;
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

  // Start spaced repetition review (due questions)
  async startReviewDue() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const due = await Spaced.getReviewQueue(this.state.courseId);
    const fallback = due.length > 0
      ? due
      : (await this.buildWeaknessQuestionIds()).slice(0, 30);

    this.state.mode = 'review';
    this.state.deck = this.buildDeck(fallback);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999; // No lives in review mode
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

  async startQuickfire() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questionIds = this.fullDeckQuestionIds();
    this.state.mode = 'quickfire';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  async startGlossaryDrill() {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questions = Courses.getQuestions();
    const glossaryIds = questions
      .map((q, i) => q.category === 'Glossary Terms' ? i : -1)
      .filter(i => i >= 0);
    const size = Math.min(Courses.current?.glossaryDrillSize || 25, glossaryIds.length);
    const questionIds = this.shuffle(glossaryIds).slice(0, size);

    this.state.mode = 'glossary';
    this.state.studyCategory = 'Glossary Terms';
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  async startInstructorFocus(focusId) {
    await Audio.ensure();
    Audio.sfx('click');
    Audio.stopMusic();
    await this.clearSavedSession(true);
    this.clearAutoAdvance();

    Gameplay.init();
    Analytics.startSession(this.state.courseId);

    const questionIds = this.buildInstructorFocusIds(focusId);
    if (!questionIds.length) return;
    this.state.mode = 'instructor';
    this.state.instructorFocus = focusId;
    this.state.studyCategory = this.instructorFocusLabel(focusId);
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = null;
    this.state.pretestSourceIds = null;
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.render();
  },

  promptConfidence() {
    const slot = document.getElementById('feedbackSlot');
    if (!slot) return Promise.resolve('guessed');
    this.state.awaitingConfidence = true;

    return new Promise(resolve => {
      slot.innerHTML = `
        <div class="confidence-prompt">
          <div class="confidence-title">HOW SURE WERE YOU?</div>
          <div class="confidence-options">
            <button class="btn-secondary confidence-btn" data-confidence="guessed">GUESSED</button>
            <button class="btn-secondary confidence-btn" data-confidence="sure">SURE</button>
          </div>
        </div>
      `;
      slot.querySelectorAll('.confidence-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.state.awaitingConfidence = false;
          this.state.confidenceChoice = btn.dataset.confidence;
          resolve(btn.dataset.confidence);
        }, { once: true });
      });
    });
  },

  startPretestStudyPass() {
    this.clearAutoAdvance();
    const questionIds = this.state.pretestSourceIds || this.fullDeckQuestionIds();
    this.state.deck = this.buildDeck(questionIds);
    this.state.idx = 0;
    this.state.score = 0;
    this.state.lives = 999;
    this.state.streak = 0;
    this.state.correctCount = 0;
    this.state.answered = null;
    this.state.newHi = false;
    this.state.missed = [];
    this.state.categoryStats = this.emptyCategoryStats();
    this.state.awaitingConfidence = false;
    this.state.confidenceChoice = null;
    this.state.pretestPhase = 'study';
    this.state.currentOptions = this.buildOptions(this.state.deck[0].question);
    this.state.screen = 'game';
    this.renderGame();
  },

  modeLabel(mode) {
    const labels = {
      normal: 'Normal',
      study: 'Study',
      streak: 'Streak',
      review: 'Review',
      category: 'By Category',
      weakness: 'Weakness',
      cram: 'Cram',
      interleave: 'Interleave Weakness',
      confidence: 'Confidence',
      redflag: 'Red Flag',
      pretest: 'Pretest',
      quickfire: 'Quickfire',
      shortmix: 'Short Mix',
      glossary: 'Glossary Drill',
      instructor: this.state.instructorFocus ? `Instructor Focus: ${this.instructorFocusLabel(this.state.instructorFocus)}` : 'Instructor Focus'
    };
    return labels[mode] || 'Study';
  },

  clearAutoAdvance() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  },

  scheduleAutoAdvance(delay = 650) {
    this.clearAutoAdvance();
    this.autoAdvanceTimer = setTimeout(() => {
      this.autoAdvanceTimer = null;
      if (this.state.screen !== 'game' || this.state.mode !== 'quickfire' || !this.state.answered) return;
      this.advance();
    }, delay);
  },

  feedbackDetails(question) {
    const explanation = question.explain || 'Review why this answer best matches the ITIL concept being tested.';
    return `
      <div class="feedback-answer">
        <span>Correct answer</span>
        <b>${question.correct}</b>
      </div>
      <div class="feedback-explain">${explanation}</div>
    `;
  },

  getSavedSessionSummary(record) {
    const session = record && record.session;
    if (!session) return null;
    const current = Math.min((session.idx || 0) + 1, (session.deck || []).length || 1);
    const total = (session.deck || []).length || 0;
    const savedAt = record.savedAt ? new Date(record.savedAt).toLocaleString() : '';
    return {
      label: this.modeLabel(session.mode),
      progress: `Question ${current}/${total}`,
      savedAt
    };
  },

  normalizeStateForSave() {
    if (this.state.screen !== 'game' || !this.state.deck.length || this.state.awaitingConfidence) return null;
    const snapshot = {
      screen: 'game',
      mode: this.state.mode,
      courseId: this.state.courseId,
      deck: this.state.deck.map(entry => ({
        id: entry.id,
        isRetry: !!entry.isRetry,
        isBoss: !!entry.isBoss
      })),
      idx: this.state.idx,
      score: this.state.score,
      lives: this.state.lives,
      streak: this.state.streak,
      correctCount: this.state.correctCount,
      currentOptions: this.state.currentOptions ? {
        options: [...this.state.currentOptions.options],
        correctIdx: this.state.currentOptions.correctIdx,
        category: this.state.currentOptions.category
      } : null,
      hiScore: this.state.hiScore,
      newHi: false,
      missed: [...this.state.missed],
      categoryStats: JSON.parse(JSON.stringify(this.state.categoryStats || {})),
      studyCategory: this.state.studyCategory,
      instructorFocus: this.state.instructorFocus,
      confidenceChoice: null,
      pretestPhase: this.state.pretestPhase,
      pretestSourceIds: this.state.pretestSourceIds ? [...this.state.pretestSourceIds] : null
    };

    if (this.state.answered) {
      snapshot.idx += 1;
      if (snapshot.idx >= snapshot.deck.length) return null;
      const nextQuestion = Courses.getQuestions()[snapshot.deck[snapshot.idx].id];
      snapshot.currentOptions = this.buildOptions(nextQuestion);
      snapshot.streak = this.state.streak;
    }

    return snapshot;
  },

  async saveCurrentSession() {
    const session = this.normalizeStateForSave();
    if (!session) return false;
    try {
      await Storage.put('settings', {
        id: this.SAVED_SESSION_KEY,
        savedAt: Date.now(),
        session
      });
      return true;
    } catch (e) {
      console.warn('[core] saveCurrentSession failed:', e);
      return false;
    }
  },

  async loadSavedSessionRecord() {
    try {
      return await Storage.get('settings', this.SAVED_SESSION_KEY);
    } catch (e) {
      console.warn('[core] loadSavedSessionRecord failed:', e);
      return null;
    }
  },

  async clearSavedSession(silent = false) {
    try {
      await Storage.delete('settings', this.SAVED_SESSION_KEY);
    } catch (e) {
      if (!silent) console.warn('[core] clearSavedSession failed:', e);
    }
  },

  async saveAndExitToMenu() {
    const saved = await this.saveCurrentSession();
    if (!saved) return;
    this.clearAutoAdvance();
    Audio.stopMusic();
    this.state.screen = 'start';
    await this.renderStart();
  },

  async resumeSavedSession() {
    const record = await this.loadSavedSessionRecord();
    const session = record && record.session;
    if (!session || !Array.isArray(session.deck) || !session.deck.length) {
      await this.clearSavedSession(true);
      await this.renderStart();
      return;
    }

    const questions = Courses.getQuestions();
    const restoredDeck = [];
    for (const entry of session.deck) {
      if (!questions[entry.id]) {
        await this.clearSavedSession(true);
        await this.renderStart();
        return;
      }
      restoredDeck.push({
        id: entry.id,
        question: questions[entry.id],
        isRetry: !!entry.isRetry,
        isBoss: !!entry.isBoss
      });
    }

    if (!restoredDeck[session.idx]) {
      await this.clearSavedSession(true);
      await this.renderStart();
      return;
    }

    Gameplay.init();
    Analytics.startSession(session.courseId || this.state.courseId);
    this.clearAutoAdvance();
    this.state.screen = 'game';
    this.state.mode = session.mode || 'study';
    this.state.courseId = session.courseId || this.state.courseId;
    this.state.deck = restoredDeck;
    this.state.idx = session.idx || 0;
    this.state.score = session.score || 0;
    this.state.lives = session.lives || 0;
    this.state.streak = session.streak || 0;
    this.state.correctCount = session.correctCount || 0;
    this.state.answered = null;
    this.state.awaitingConfidence = false;
    this.state.currentOptions = session.currentOptions || this.buildOptions(restoredDeck[this.state.idx].question);
    this.state.hiScore = this.state.hiScore || 0;
    this.state.newHi = false;
    this.state.missed = Array.isArray(session.missed) ? [...session.missed] : [];
    this.state.categoryStats = session.categoryStats || this.emptyCategoryStats();
    this.state.studyCategory = session.studyCategory || null;
    this.state.instructorFocus = session.instructorFocus || null;
    this.state.confidenceChoice = session.confidenceChoice || null;
    this.state.pretestPhase = session.pretestPhase || null;
    this.state.pretestSourceIds = Array.isArray(session.pretestSourceIds) ? [...session.pretestSourceIds] : null;
    this.renderGame();
  },

  async restartCurrentMode() {
    switch (this.state.mode) {
      case 'study':
      case 'streak':
      case 'normal':
        await this.startGame();
        return;
      case 'category':
        await this.startCategory(this.state.studyCategory);
        return;
      case 'weakness':
        await this.startWeakness();
        return;
      case 'cram':
        await this.startCram();
        return;
      case 'review':
        await this.startReviewDue();
        return;
      case 'interleave':
        await this.startInterleaveWeakness();
        return;
      case 'redflag':
        await this.startRedFlag();
        return;
      case 'confidence':
        await this.startConfidence();
        return;
      case 'pretest':
        await this.startPretest();
        return;
      case 'quickfire':
        await this.startQuickfire();
        return;
      case 'shortmix':
        await this.startShortMix();
        return;
      case 'glossary':
        await this.startGlossaryDrill();
        return;
      case 'instructor':
        await this.startInstructorFocus(this.state.instructorFocus || 'sections-3-5');
        return;
      default:
        await this.startGame();
    }
  },

  // Handle answer selection
  async handleAnswer(pickedIdx) {
    if (this.state.answered || this.state.awaitingConfidence) return;
    await Audio.ensure();
    if (this.state.answered || this.state.awaitingConfidence) return;

    const entry = this.state.deck[this.state.idx];
    const q = entry.question;
    const { correctIdx } = this.state.currentOptions;
    const buttons = document.querySelectorAll('.answer-btn');
    if (pickedIdx < 0 || pickedIdx >= buttons.length) return;
    const isCorrect = pickedIdx === correctIdx;
    this.state.answered = { pickedIdx, correctIdx };
    let retryQueued = false;
    let confidence = null;

    if (!entry.isRetry) this._trackRecentId(entry.id);

    buttons.forEach(b => b.disabled = true);

    if (this.state.mode === 'confidence') {
      confidence = await this.promptConfidence();
    }

    // Mark correct answer always
    buttons[correctIdx].classList.add('correct');
    // Mark wrong pick if applicable
    if (!isCorrect) buttons[pickedIdx].classList.add('wrong');

    if (this.state.mode === 'pretest' && this.state.pretestPhase === 'pretest') {
      const fb = document.getElementById('feedbackSlot');
      fb.innerHTML = `
        <div class="feedback ${isCorrect ? 'correct-fb' : 'wrong-fb'}">
          <strong>${isCorrect ? '> PRETEST HIT' : '> PRETEST MISS'}</strong>
          <div style="margin-top: 8px;">No explanation yet. Full study pass starts after the preview run.</div>
          <div class="feedback-nav">
            <span></span>
            <button class="btn-next" id="nextBtn">NEXT ▸</button>
          </div>
        </div>
      `;
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn) nextBtn.addEventListener('click', () => this.advance());
      return;
    }

    if (isCorrect) {
      this.state.streak += 1;
      this.state.correctCount += 1;
      this.clearMissed(entry.id);
      if (this.state.mode === 'confidence' && !entry.isRetry && confidence !== 'sure') {
        retryQueued = this.queueRetry(entry);
      }
      this.state.categoryStats[q.category].correct += 1;

      // Track: error log + spaced repetition + analytics
      ErrorLog.logAnswer(entry.id, true, pickedIdx, q.category, this.state.currentOptions.options.length);
      Spaced.recordAnswer(this.state.courseId, entry.id, true);
      Analytics.recordAnswer(true, q.category);

      // Gameplay bookkeeping
      Gameplay.onCorrect(entry);

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

    } else {
      // Track: error log + spaced repetition + analytics
      ErrorLog.logAnswer(entry.id, false, pickedIdx, q.category, this.state.currentOptions.options.length);
      Spaced.recordAnswer(this.state.courseId, entry.id, false);
      Analytics.recordAnswer(false, q.category);

      // Juice
      const btn = buttons[pickedIdx];
      if (btn) Juice.onWrong(btn);

      // Gameplay side effects
      Gameplay.onWrong(entry);

      this.state.streak = 0;
      if (this.state.mode === 'normal') {
        this.state.lives -= 1;
      }
      this.trackMissed(entry.id);
      retryQueued = this.queueRetry(entry);
      this.state.categoryStats[q.category].missed += 1;
      Audio.sfx('wrong');
      if (this.state.mode === 'normal') {
        Audio.sfx('heartLoss');
      }
      document.body.classList.add('shake', 'flash-wrong');
      setTimeout(() => document.body.classList.remove('shake', 'flash-wrong'), 400);
      if (this.state.mode === 'streak') {
        setTimeout(() => { this.endGame(); }, 1500);
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
        ${this.feedbackDetails(q)}
        <div class="feedback-meta">
          ${isCorrect
            ? `+${100 + this.streakBonus(this.state.streak - 1)} PTS`
            : retryQueued
              ? 'QUESTION RE-QUEUED. IT WILL RETURN SOON.'
              : ''}
          ${isCorrect && this.state.mode === 'confidence' && confidence && confidence !== 'sure' && retryQueued
            ? '<br>LOW-CONFIDENCE CORRECT. QUEUED FOR REINFORCEMENT.'
            : ''}
        </div>
        <div class="feedback-nav">
          ${canBack ? '<button class="btn-prev" id="prevBtn">◂ BACK</button>' : '<span></span>'}
          <button class="btn-next" id="nextBtn">NEXT ▸</button>
        </div>
      </div>
    `;
    if (this.state.mode === 'quickfire') {
      fb.innerHTML = `
        <div class="feedback ${isCorrect ? 'correct-fb' : 'wrong-fb'} quickfire-fb">
          <strong>${isCorrect ? '> RIGHT' : '> WRONG'}</strong>
          ${this.feedbackDetails(q)}
          <div class="feedback-meta">
            ${isCorrect ? '+100' : retryQueued ? 'RETRY QUEUED' : ''}
          </div>
        </div>
      `;
      this.scheduleAutoAdvance(1200);
      return;
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => this.advance());
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.reviewPrevious());
  },

  // Review a previous question (read-only, no re-answering)
  reviewPrevious() {
    this.clearAutoAdvance();
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

    this.stage.innerHTML = `
      <div class="hud">
        ${this.modeBanner()}
        <div class="score-box">
          <div class="label">SCORE</div>
          <div class="value" id="scoreVal">${this.state.score.toLocaleString()}</div>
        </div>
        <div class="streak-box ${this.state.streak === 0 ? 'cold' : ''}">
          <span class="icon">${this.state.streak === 0 ? '·' : '⚡'}</span>
          <span>×${this.state.streak}</span>
        </div>
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
          ${this.feedbackDetails(q)}
          <div class="feedback-nav">
            ${this.state.idx > 0 ? '<button class="btn-prev" id="prevBtn">◂ BACK</button>' : '<span></span>'}
            <button class="btn-next" id="nextBtn">NEXT ▸</button>
          </div>
        </div>
      </div>

      <div class="game-menu-row">
        <button class="btn-menu" id="menuBtnGame" title="Return to menu">MENU</button>
      </div>
    `;

    document.getElementById('menuBtnGame').addEventListener('click', async () => {
      Audio.stopMusic();
      this.state.screen = 'start';
      this.state.mode = 'normal';
      await this.renderStart();
    });
    document.getElementById('nextBtn').addEventListener('click', () => this.advanceFromReview());
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.reviewPrevious());
  },

  // Advance from review mode back to current position
  advanceFromReview() {
    this.clearAutoAdvance();
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
    this.clearAutoAdvance();
    if (this.state.awaitingConfidence || !this.state.answered) return;
    this.state.answered = null;
    this.state.idx += 1;

    if (this.state.idx >= this.state.deck.length) {
      if (this.state.mode === 'pretest' && this.state.pretestPhase === 'pretest') {
        this.startPretestStudyPass();
        return;
      }
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
    this.clearAutoAdvance();
    this.clearSavedSession(true);
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

    // End analytics session
    Analytics.endSession();

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
  async render() {
    if (this.state.screen === 'start') await this.renderStart();
    else if (this.state.screen === 'game') this.renderGame();
    else if (this.state.screen === 'end') this.renderEnd();
  },

  // Render start screen
  async renderStart() {
    try {
      const isStreak = this.state.mode === 'streak';
      const isStudy = this.state.mode === 'study';
      const isConfidence = this.state.mode === 'confidence';
      const isInterleave = this.state.mode === 'interleave';
      const isRedFlag = this.state.mode === 'redflag';
      const isPretest = this.state.mode === 'pretest';
      const isCategory = this.state.mode === 'category';
      const isQuickfire = this.state.mode === 'quickfire';
      const isShortMix = this.state.mode === 'shortmix';
      const isGlossary = this.state.mode === 'glossary';
      const isInstructor = this.state.mode === 'instructor';

      // Get due count for spaced repetition
      const reviewStatus = await Spaced.getReviewStatus(this.state.courseId);
      const dueCount = reviewStatus.dueCount;
      const categories = this.fullDeckCategories();
      const categoryCounts = this.categoryCounts();
      const focusDecks = this.instructorFocusDecks();
      const focusCounts = this.instructorFocusCounts();
      const questionCount = this.fullDeckQuestionIds().length;
      const shortMixSize = Math.min(Courses.current?.shortStudySize || 25, questionCount);
      const glossaryCount = Courses.getQuestions().filter(q => q.category === 'Glossary Terms').length;
      const savedSession = await this.loadSavedSessionRecord();
      const savedSummary = this.getSavedSessionSummary(savedSession);

    this.stage.innerHTML = `
      <div class="start">
        <div class="logo-top">// INITIALIZE</div>
        <h1 class="logo-main">SECOND<br>CHANCE</h1>
        <div class="logo-sub">ITIL 4 Redemption Run</div>

        <div class="mode-picker">
          <button class="mode-btn ${!isStreak && !isStudy && !isCategory && !isConfidence && !isInterleave && !isRedFlag && !isPretest && !isQuickfire && !isShortMix && !isGlossary && !isInstructor ? 'active' : ''}" id="modeNormal">NORMAL</button>
          <button class="mode-btn ${isStudy ? 'active' : ''}" id="modeStudy">STUDY</button>
          <button class="mode-btn ${isStreak ? 'active' : ''}" id="modeStreak">STREAK</button>
        </div>

        <div class="stat-row">
          <div class="stat-chip"><b>${questionCount}</b>QUESTIONS</div>
          <div class="stat-chip"><b>${glossaryCount}</b>GLOSSARY</div>
          <div class="stat-chip">${(isStreak || isStudy || isConfidence || isInterleave || isRedFlag || isPretest || isQuickfire || isShortMix || isGlossary || isInstructor) ? '<b>∞</b>NO LIVES' : '<b>3</b>LIVES'}</div>
          <div class="stat-chip"><b>∞</b>STREAK BONUS</div>
        </div>

        ${this.state.hiScore > 0 ? `
          <div class="hi-score">
            <div class="label">HIGH SCORE</div>
            ${this.state.hiScore.toLocaleString()}
          </div>
        ` : ''}

        <button class="btn-start" id="startBtn">▶ PRESS START</button>
        ${savedSummary ? `
          <button class="btn-secondary" id="resumeBtn">RESUME SAVED SESSION</button>
          <div class="hint" style="margin-top: 8px;">${savedSummary.label} · ${savedSummary.progress}${savedSummary.savedAt ? ` · saved ${savedSummary.savedAt}` : ''}</div>
        ` : ''}

        <!-- Study Tools -->
        <div class="study-tools">
          <div class="tools-title">STUDY TOOLS</div>
          <div class="tools-grid">
            <button class="btn-tool" id="btnReviewDue">
              <span class="tool-icon">📅</span>
              <span class="tool-copy"><span class="tool-label">Review Due</span><span class="tool-hint">Overdue or next-up review cards</span></span>
              ${dueCount > 0 ? `<span class="tool-badge">${dueCount}</span>` : reviewStatus.upcomingCount > 0 ? '<span class="tool-muted">soon</span>' : '<span class="tool-muted">none</span>'}
            </button>
            <button class="btn-tool" id="btnWeakness">
              <span class="tool-icon">🎯</span>
              <span class="tool-copy"><span class="tool-label">Weakness</span><span class="tool-hint">Your lowest-accuracy categories</span></span>
            </button>
            <button class="btn-tool" id="btnCram">
              <span class="tool-icon">📚</span>
              <span class="tool-copy"><span class="tool-label">Cram</span><span class="tool-hint">Most-missed questions first</span></span>
            </button>
            <button class="btn-tool" id="btnCategory">
              <span class="tool-icon">📂</span>
              <span class="tool-copy"><span class="tool-label">Topic Tests</span><span class="tool-hint">Pick concepts, principles, dimensions, chain, or practices</span></span>
            </button>
            <button class="btn-tool" id="btnInstructor">
              <span class="tool-icon">▣</span>
              <span class="tool-copy"><span class="tool-label">Instructor Focus</span><span class="tool-hint">Lessons 1-5, Sections 3-5, 7 practices, or 40Q mock</span></span>
            </button>
            <button class="btn-tool" id="btnInterleave">
              <span class="tool-icon">🔀</span>
              <span class="tool-copy"><span class="tool-label">Interleave Weakness</span><span class="tool-hint">Mix weak categories together</span></span>
            </button>
            <button class="btn-tool" id="btnConfidence">
              <span class="tool-icon">🧠</span>
              <span class="tool-copy"><span class="tool-label">Confidence</span><span class="tool-hint">Rate how sure you were</span></span>
            </button>
            <button class="btn-tool" id="btnRedFlag">
              <span class="tool-icon">🚩</span>
              <span class="tool-copy"><span class="tool-label">Red Flag</span><span class="tool-hint">Weakest retention + most missed</span></span>
            </button>
            <button class="btn-tool" id="btnPretest">
              <span class="tool-icon">🧪</span>
              <span class="tool-copy"><span class="tool-label">Pretest</span><span class="tool-hint">Preview first, explanations later</span></span>
            </button>
            <button class="btn-tool" id="btnQuickfire">
              <span class="tool-icon">⚡</span>
              <span class="tool-copy"><span class="tool-label">Quickfire</span><span class="tool-hint">Instant right/wrong, auto next</span></span>
            </button>
            <button class="btn-tool" id="btnShortMix">
              <span class="tool-icon">25</span>
              <span class="tool-copy"><span class="tool-label">Short Mix</span><span class="tool-hint">${shortMixSize} random exam-pool questions</span></span>
            </button>
            <button class="btn-tool" id="btnGlossary">
              <span class="tool-icon">⌁</span>
              <span class="tool-copy"><span class="tool-label">Glossary Drill</span><span class="tool-hint">25 random terms from the full glossary</span></span>
              <span class="tool-muted">${glossaryCount}</span>
            </button>
          </div>
        </div>

        <div class="mode-guide">
          <div class="mode-guide-title">QUICK GUIDE</div>
          <div class="mode-guide-list">
            <div class="mode-guide-row"><span class="mode-guide-name">NORMAL</span><span class="mode-guide-desc">3 lives. Missed questions come back as retries. Best for a standard run.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">STUDY</span><span class="mode-guide-desc">Infinite lives. No power-ups. Questions repeat until you get them right.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">STREAK</span><span class="mode-guide-desc">No lives. One miss ends the run. Best for pressure-testing recall.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">WEAKNESS</span><span class="mode-guide-desc">Pulls from your lowest-accuracy categories.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">CRAM</span><span class="mode-guide-desc">Pulls your most-missed questions.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">REVIEW DUE</span><span class="mode-guide-desc">Uses the spaced-repetition queue for overdue questions.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">INTERLEAVE</span><span class="mode-guide-desc">Mixes your weakest categories together instead of blocking one topic.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">CONFIDENCE</span><span class="mode-guide-desc">After each answer, rate how sure you were. Low-confidence answers get reinforced.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">RED FLAG</span><span class="mode-guide-desc">Targets the questions you miss most and the ones with weakest retention.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">PRETEST</span><span class="mode-guide-desc">First pass without explanations, then an automatic full study pass on the same set.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">CATEGORY</span><span class="mode-guide-desc">Lets you drill one ITIL topic at a time.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">FOCUS</span><span class="mode-guide-desc">Uses the instructor note: Lessons 1-5, Sections 3-5, and the seven high-weight practices.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">QUICKFIRE</span><span class="mode-guide-desc">Instant right or wrong feedback, then auto-advance to the next question.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">SHORT MIX</span><span class="mode-guide-desc">Pulls ${shortMixSize} random questions from the full exam pool for a shorter study session.</span></div>
            <div class="mode-guide-row"><span class="mode-guide-name">GLOSSARY</span><span class="mode-guide-desc">Samples terms from the full glossary so terminology stays quick and focused.</span></div>
          </div>
        </div>

        <!-- Category Picker (hidden by default) -->
        <div class="category-picker" id="categoryPicker" style="display:none;">
          <div class="category-picker-title">CHOOSE EXAM TOPIC</div>
          ${categories.map(cat => `
            <button class="btn-category" data-cat="${cat}">
              <span class="cat-dot" style="background: ${this.categoryColor(cat)}"></span>
              <span class="cat-label">${cat}</span>
              <span class="cat-count">${cat === 'Glossary Terms' ? `${glossaryCount} TERMS` : `${categoryCounts[cat] || 0} Q`}</span>
            </button>
          `).join('')}
          <button class="btn-secondary btn-back-category">BACK</button>
        </div>

        <div class="category-picker" id="focusPicker" style="display:none;">
          <div class="category-picker-title">INSTRUCTOR FOCUS</div>
          ${focusDecks.map((deck, index) => `
            ${index === 0 || deck.group !== focusDecks[index - 1].group ? `<div class="focus-group-title">${deck.group || 'Focus Drills'}</div>` : ''}
            <button class="btn-category btn-focus" data-focus="${deck.id}">
              <span class="cat-dot" style="background: ${this.categoryColor(deck.id)}"></span>
              <span class="cat-label">${deck.label}<small>${deck.hint}</small></span>
              <span class="cat-count">${focusCounts[deck.id] || 0} Q</span>
            </button>
          `).join('')}
          <button class="btn-secondary btn-back-focus">BACK</button>
        </div>

        <button class="btn-secondary" id="statsBtn">📊 STATS</button>
        <div class="hint">TIP: press 1-4 to answer · ENTER to continue</div>
      </div>
    `;

    // Mode picker
    document.getElementById('modeNormal').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.state.mode = 'normal';
      this.renderStart();
    });
    document.getElementById('modeStudy').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.state.mode = 'study';
      this.renderStart();
    });
    document.getElementById('modeStreak').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.state.mode = 'streak';
      this.renderStart();
    });

    // Start button
    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', async () => {
        await Audio.ensure();
        Audio.sfx('click');
        Audio.stopMusic();
        await this.resumeSavedSession();
      });
    }

    // Study tools
    document.getElementById('btnReviewDue').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startReviewDue();
    });
    document.getElementById('btnWeakness').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startWeakness();
    });
    document.getElementById('btnCram').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startCram();
    });
    document.getElementById('btnCategory').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      document.getElementById('categoryPicker').style.display = 'block';
      document.getElementById('focusPicker').style.display = 'none';
      document.getElementById('startBtn').style.display = 'none';
      document.querySelector('.mode-picker').style.display = 'none';
      document.querySelector('.stat-row').style.display = 'none';
    });
    document.getElementById('btnInstructor').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      document.getElementById('focusPicker').style.display = 'block';
      document.getElementById('categoryPicker').style.display = 'none';
      document.getElementById('startBtn').style.display = 'none';
      document.querySelector('.mode-picker').style.display = 'none';
      document.querySelector('.stat-row').style.display = 'none';
    });
    document.getElementById('btnInterleave').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startInterleaveWeakness();
    });
    document.getElementById('btnConfidence').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startConfidence();
    });
    document.getElementById('btnRedFlag').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startRedFlag();
    });
    document.getElementById('btnPretest').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startPretest();
    });
    document.getElementById('btnQuickfire').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startQuickfire();
    });
    document.getElementById('btnShortMix').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startShortMix();
    });
    document.getElementById('btnGlossary').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.startGlossaryDrill();
    });

    // Category buttons
    document.querySelectorAll('.btn-category').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!btn.dataset.cat) return;
        await Audio.ensure();
        Audio.sfx('click');
        const cat = btn.dataset.cat;
        this.state.mode = 'category';
        this.state.studyCategory = cat;
        this.startCategory(cat);
      });
    });

    document.querySelectorAll('.btn-focus').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Audio.ensure();
        Audio.sfx('click');
        await this.startInstructorFocus(btn.dataset.focus);
      });
    });

    // Back from category picker
    document.querySelector('.btn-back-category').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.renderStart();
    });
    document.querySelector('.btn-back-focus').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      this.renderStart();
    });

    // Stats
    document.getElementById('statsBtn').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      Audio.stopMusic();
      this.renderStatsModal();
    });

    Audio.playTrack('start');
    } catch (e) {
      console.error('[core] renderStart error:', e);
      // Fallback: render basic start screen
      this.stage.innerHTML = `
        <div class="start">
          <h1 class="logo-main">SECOND<br>CHANCE</h1>
          <button class="btn-start" id="startBtn">▶ PRESS START</button>
        </div>
      `;
      document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    }
  },

  // Render stats modal
  async renderStatsModal(onClose) {
    const sessions = await Analytics.getSessionHistory(7);
    const totalAnswered = await Analytics.getTotalAnswered(this.state.courseId);
    const totalSessions = await Analytics.getTotalSessions();
    const accuracy = await ErrorLog.getOverallAccuracy(this.state.courseId);

    this.stage.innerHTML = `
      <div class="stats-screen">
        <div class="stats-title">STUDY STATS</div>
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-card-value">${totalAnswered}</div>
            <div class="stat-card-label">TOTAL ANSWERS</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${accuracy.pct}%</div>
            <div class="stat-card-label">ALL-TIME ACCURACY</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${totalSessions}</div>
            <div class="stat-card-label">SESSIONS</div>
          </div>
        </div>

        ${sessions.length > 0 ? `
          <div class="stats-history-title">LAST 7 DAYS</div>
          <div class="stats-history">
            ${sessions.map(s => `
              <div class="stats-session">
                <span class="stats-date">${new Date(s.date).toLocaleDateString()}</span>
                <span class="stats-accuracy ${s.accuracy >= 70 ? 'good' : s.accuracy >= 50 ? 'ok' : 'bad'}">${s.accuracy}%</span>
                <span class="stats-count">${s.questionsAnswered} Qs</span>
                <span class="stats-duration">${Math.round(s.durationMs / 60000)}m</span>
              </div>
            `).join('')}
          </div>
        ` : '<div class="stats-empty">No sessions yet. Complete a run to see your stats!</div>'}

        <button class="btn-secondary stats-close">CLOSE</button>
      </div>
    `;

    document.querySelector('.stats-close').addEventListener('click', () => {
      Audio.sfx('click');
      this.state.screen = 'start';
      this.renderStart();
      Audio.playTrack('start');
    });
  },

  // Render game screen
  renderGame() {
    const entry = this.state.deck[this.state.idx];
    const q = entry.question;
    const { options, correctIdx } = this.state.currentOptions;

    const progress = ((this.state.idx) / this.state.deck.length) * 100;
    this.stage.innerHTML = `
      <div class="hud">
        ${this.modeBanner()}
        <div class="score-box">
          <div class="label">SCORE</div>
          <div class="value" id="scoreVal">${this.state.score.toLocaleString()}</div>
        </div>
        <div class="streak-box ${this.state.streak === 0 ? 'cold' : ''}">
          <span class="icon">${this.state.streak === 0 ? '·' : '⚡'}</span>
          <span>×${this.state.streak}</span>
        </div>
      </div>

      <div class="q-header">
        <span>QUESTION <span class="q-num">${this.state.idx + 1}</span> / ${this.state.deck.length}${entry.isRetry ? ' · RETRY' : ''}${this.state.mode === 'pretest' && this.state.pretestPhase === 'pretest' ? ' · PREVIEW' : ''}</span>
        <span>${this.state.streak >= 3 ? `+${this.streakBonus(this.state.streak)} streak bonus` : '&nbsp;'}</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>

      <!-- Combo timer -->
      ${Gameplay.getComboTimerHTML()}

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

      <div class="game-menu-row">
        <button class="btn-menu" id="saveBtnGame" title="Save this session and return to menu">SAVE & EXIT</button>
        <button class="btn-menu" id="menuBtnGame" title="Return to menu">MENU</button>
      </div>
    `;

    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleAnswer(parseInt(btn.dataset.idx)));
    });
    document.getElementById('saveBtnGame').addEventListener('click', async () => {
      await Audio.ensure();
      Audio.sfx('click');
      await this.saveAndExitToMenu();
    });
    document.getElementById('menuBtnGame').addEventListener('click', async () => {
      Audio.stopMusic();
      this.state.screen = 'start';
      this.state.mode = 'normal';
      await this.renderStart();
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
    } else if (['study', 'interleave', 'redflag', 'confidence', 'quickfire', 'shortmix', 'glossary', 'instructor'].includes(this.state.mode)) {
      title = this.state.mode === 'instructor' ? 'FOCUS COMPLETE' : 'STUDY COMPLETE';
      sub = `${this.state.correctCount}/${this.state.deck.length} CORRECT`;
      showGrade = false;
    } else if (this.state.mode === 'pretest') {
      title = 'PRETEST REVIEW COMPLETE';
      sub = `${this.state.correctCount}/${this.state.deck.length} CORRECT`;
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
      : ['study', 'interleave', 'redflag', 'confidence', 'pretest', 'quickfire', 'shortmix', 'glossary', 'instructor'].includes(this.state.mode)
        ? `<div class="end-stat"><div class="l">CORRECT</div><div class="v">${this.state.correctCount}/${this.state.deck.length}</div></div>
           <div class="end-stat"><div class="l">STREAK</div><div class="v">${this.state.streak}</div></div>
           <div class="end-stat"><div class="l">SCORE</div><div class="v">${this.state.score.toLocaleString()}</div></div>`
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

    // Session summary from analytics
    const sessionSummary = Analytics.getSessionSummary();
    const sessionHtml = sessionSummary ? `
        <div class="session-summary">
          <div class="session-title">SESSION SUMMARY</div>
          <div class="session-row">
            <span class="session-item">⏱ ${sessionSummary.duration}</span>
            <span class="session-item">✓ ${sessionSummary.correct} correct</span>
            <span class="session-item">✗ ${sessionSummary.wrong} wrong</span>
            <span class="session-item">📊 ${sessionSummary.accuracy}%</span>
          </div>
        </div>
      ` : '';

    const reviewBtn = this.state.mode === 'normal' && this.state.missed.length > 0 ? `
        <button class="btn-secondary" id="reviewBtn">REVIEW MISSED (${this.state.missed.length})</button>
      ` : '';

    // Build category breakdown rows, sorted by lowest accuracy first
    const catRows = Object.entries(this.state.categoryStats || {})
      .filter(([, stats]) => stats.correct + stats.missed > 0)
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

    const catBreakdown = catRows ? `
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

        ${sessionHtml}
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
    document.getElementById('retryBtn').addEventListener('click', () => this.restartCurrentMode());
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

  // Helper: category color
  categoryColor(name) {
    const colors = {
      "Key Concepts": "var(--cyan)",
      "Guiding Principles": "var(--pink)",
      "Four Dimensions": "var(--green)",
      "Service Value System": "var(--yellow)",
      "Service Value Chain": "var(--cyan)",
      "Practice Purposes": "var(--pink)",
      "Detailed Practices": "var(--green)",
      "Glossary Terms": "var(--yellow)",
      "focus-key-concepts": "var(--cyan)",
      "focus-guiding-principles": "var(--pink)",
      "focus-four-dimensions": "var(--green)",
      "focus-svs": "var(--yellow)",
      "focus-svc": "var(--cyan)",
      "focus-practice-purposes": "var(--pink)",
      "focus-continual-improvement": "var(--yellow)",
      "focus-change-enablement": "var(--pink)",
      "focus-incident-management": "var(--cyan)",
      "focus-problem-management": "var(--green)",
      "focus-service-request-management": "var(--pink)",
      "focus-service-desk": "var(--cyan)",
      "focus-service-level-management": "var(--yellow)",
      "mock-40": "var(--yellow)"
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
    const recent = this._getRecentIds();
    // Push recently-answered questions toward the back so the deck feels fresh
    const front = shuffled.filter(id => !recent.has(id));
    const back = this.shuffle(shuffled.filter(id => recent.has(id)));
    const ordered = [...front, ...back];
    const questions = Courses.getQuestions();
    return ordered.map(id => ({
      id,
      question: questions[id],
      isRetry: false,
      isBoss: questions[id].isBoss || false
    }));
  },

  fullDeckQuestionIds() {
    const questions = Courses.getQuestions();
    return questions
      .map((question, i) => question.includeInFullDeck === false ? -1 : i)
      .filter(i => i >= 0);
  },

  fullDeckCategories() {
    if (Courses.current && Array.isArray(Courses.current.fullDeckCategories)) {
      return Courses.current.fullDeckCategories;
    }
    return Courses.getCategories().filter(name => name !== 'Glossary Terms');
  },

  categoryCounts() {
    const counts = {};
    Courses.getQuestions().forEach(question => {
      if (question.category === 'Glossary Terms') return;
      if (question.includeInFullDeck === false) return;
      counts[question.category] = (counts[question.category] || 0) + 1;
    });
    return counts;
  },

  instructorFocusDecks() {
    return Courses.current && Array.isArray(Courses.current.instructorFocusDecks)
      ? Courses.current.instructorFocusDecks
      : [];
  },

  instructorFocusLabel(focusId) {
    const deck = this.instructorFocusDecks().find(item => item.id === focusId);
    return deck ? deck.label : 'Instructor Focus';
  },

  idsByInstructorFocus(focusId) {
    return Courses.getQuestions()
      .map((question, i) => {
        if (question.includeInFullDeck === false) return -1;
        return Array.isArray(question.instructorFocus) && question.instructorFocus.includes(focusId) ? i : -1;
      })
      .filter(i => i >= 0);
  },

  buildInstructorFocusIds(focusId) {
    if (focusId !== 'mock-40') {
      return this.idsByInstructorFocus(focusId);
    }

    const seven = this.shuffle(this.idsByInstructorFocus('seven-practices'));
    const sectionSet = new Set(this.idsByInstructorFocus('sections-3-5'));
    const sevenSet = new Set(seven);
    const sections = this.shuffle([...sectionSet].filter(id => !sevenSet.has(id)));
    const fullSet = new Set(this.fullDeckQuestionIds());
    const foundations = this.shuffle([...fullSet].filter(id => !sectionSet.has(id)));
    const selected = [
      ...seven.slice(0, 17),
      ...sections.slice(0, 13),
      ...foundations.slice(0, 10)
    ];
    const selectedSet = new Set(selected);
    const fill = this.shuffle([...fullSet].filter(id => !selectedSet.has(id)));
    return [...selected, ...fill].slice(0, 40);
  },

  instructorFocusCounts() {
    const counts = {};
    for (const deck of this.instructorFocusDecks()) {
      counts[deck.id] = this.buildInstructorFocusIds(deck.id).length;
    }
    return counts;
  },

  _getRecentIds() {
    try { return new Set(JSON.parse(localStorage.getItem('sc_recent_ids') || '[]')); }
    catch { return new Set(); }
  },

  _trackRecentId(id) {
    try {
      const list = JSON.parse(localStorage.getItem('sc_recent_ids') || '[]');
      const updated = [id, ...list.filter(x => x !== id)].slice(0, 25);
      localStorage.setItem('sc_recent_ids', JSON.stringify(updated));
    } catch {}
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
    const retryEntry = {
      id: entry.id,
      question: entry.question,
      isRetry: true,
      isBoss: entry.isBoss || false
    };
    const insertAt = Math.min(this.state.deck.length, this.state.idx + 4);
    this.state.deck.splice(insertAt, 0, retryEntry);
    return true;
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
      const range = i + 1;
      const max = Math.floor(0x100000000 / range) * range;
      let r;
      do { r = crypto.getRandomValues(new Uint32Array(1))[0]; } while (r >= max);
      const j = r % range;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Save high score (legacy compatibility)
  async saveHi(score) {
    try {
      await Storage.put('settings', { id: 'hiscore_v1', value: String(score) });
    } catch (e) { /* silent */ }
  },

  // Load high score (legacy compatibility)
  async loadHi() {
    try {
      const r = await Storage.get('settings', 'hiscore_v1');
      if (r && r.value) this.state.hiScore = parseInt(r.value) || 0;
    } catch (e) { /* no saved score */ }
  }
};
