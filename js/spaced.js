// ============================================================
// SPACED — Spaced repetition (simplified SM-2 algorithm)
// ============================================================
const Spaced = {
  // Default strength record for a new question
  defaultRecord(courseId, qId) {
    return {
      key: `${courseId}_${qId}`,
      courseId,
      qId,
      strength: 0,       // 0-100, higher = better retained
      interval: 0,       // days until next review (0 = due now)
      nextReview: 0,     // timestamp (0 = due now)
      timesCorrect: 0,
      timesMissed: 0,
      ease: 2.5          // SM-2 ease factor, starts at 2.5
    };
  },

  // Get or create strength record for a question
  async getRecord(courseId, qId) {
    let rec = await Storage.get('questionStrength', `${courseId}_${qId}`);
    if (!rec) {
      rec = this.defaultRecord(courseId, qId);
      await Storage.put('questionStrength', rec);
    }
    return rec;
  },

  // Record an answer and update strength/interval (SM-2)
  async recordAnswer(courseId, qId, isCorrect) {
    const rec = await this.getRecord(courseId, qId);

    if (isCorrect) {
      rec.timesCorrect++;
      // Increase interval based on ease factor
      if (rec.interval === 0) {
        rec.interval = 1;
      } else if (rec.interval === 1) {
        rec.interval = 2;
      } else {
        rec.interval = Math.round(rec.interval * rec.ease);
      }
      // Increase strength
      rec.strength = Math.min(100, rec.strength + 10);
      // Slightly increase ease
      rec.ease = Math.min(3.0, rec.ease + 0.1);
    } else {
      rec.timesMissed++;
      // Reset interval — review tomorrow
      rec.interval = 1;
      // Decrease strength
      rec.strength = Math.max(0, rec.strength - 20);
      // Decrease ease (harder question)
      rec.ease = Math.max(1.3, rec.ease - 0.2);
    }

    // Set next review timestamp
    rec.nextReview = Date.now() + rec.interval * 86400000;

    await Storage.put('questionStrength', rec);
    return rec;
  },

  // Get all questions due for review (nextReview <= now)
  async getDueQuestions(courseId) {
    const all = await Storage.getAll('questionStrength');
    const now = Date.now();
    return all
      .filter(r => r.courseId === courseId && r.nextReview > 0 && r.nextReview <= now)
      .map(r => r.qId);
  },

  // Get all questions that have been seen at least once and are due
  async getDueCount(courseId) {
    const due = await this.getDueQuestions(courseId);
    return due.length;
  },

  // Get strength for a question (0-100)
  async getStrength(courseId, qId) {
    const rec = await this.getRecord(courseId, qId);
    return rec.strength;
  },

  // Get XP multiplier based on question strength (older/weaker = more XP)
  async getStrengthMultiplier(courseId, qId) {
    const strength = await this.getStrength(courseId, qId);
    // Weaker questions give more XP: 0 strength = 2x, 100 strength = 1x
    return 1 + (1 - strength / 100);
  },

  // Initialize all questions in a course with default records (if not exists)
  async initCourse(courseId) {
    const questions = Courses.getQuestions();
    for (let i = 0; i < questions.length; i++) {
      await this.getRecord(courseId, i); // Creates if not exists
    }
  }
};
