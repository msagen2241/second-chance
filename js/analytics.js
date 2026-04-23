// ============================================================
// ANALYTICS — Session tracking, trends, metacognition
// ============================================================
const Analytics = {
  sessionStart: null,

  // Start a new study session
  startSession(courseId) {
    this.sessionStart = {
      time: Date.now(),
      courseId,
      correct: 0,
      wrong: 0,
      categories: {}
    };
  },

  // Record an answer during the current session
  recordAnswer(isCorrect, category) {
    if (!this.sessionStart) return;
    if (isCorrect) this.sessionStart.correct++;
    else this.sessionStart.wrong++;
    if (!this.sessionStart.categories[category]) {
      this.sessionStart.categories[category] = { correct: 0, missed: 0 };
    }
    if (isCorrect) this.sessionStart.categories[category].correct++;
    else this.sessionStart.categories[category].missed++;
  },

  // End the current session and log it
  async endSession() {
    if (!this.sessionStart) return;
    const duration = Date.now() - this.sessionStart.time;
    const total = this.sessionStart.correct + this.sessionStart.wrong;

    await Storage.put('sessionLog', {
      date: new Date().toISOString(),
      courseId: this.sessionStart.courseId,
      questionsAnswered: total,
      correct: this.sessionStart.correct,
      wrong: this.sessionStart.wrong,
      accuracy: total > 0 ? Math.round(this.sessionStart.correct / total * 100) : 0,
      durationMs: duration,
      categories: this.sessionStart.categories
    });

    this.sessionStart = null;
  },

  // Get session history for the last N days
  async getSessionHistory(days = 7) {
    const all = await Storage.getAll('sessionLog');
    const cutoff = Date.now() - days * 86400000;
    return all
      .filter(s => new Date(s.date).getTime() >= cutoff)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Get accuracy trend for a category over N days
  async getTrend(category, days = 7) {
    const sessions = await this.getSessionHistory(days);
    const trend = [];
    sessions.forEach(s => {
      const cat = s.categories[category];
      if (cat) {
        const total = cat.correct + cat.missed;
        trend.push({
          date: s.date,
          accuracy: total > 0 ? Math.round(cat.correct / total * 100) : 0,
          answered: total
        });
      }
    });
    return trend.reverse();
  },

  // Get total questions answered all-time for a course
  async getTotalAnswered(courseId) {
    const all = await Storage.getByIndex('questionLog', 'courseId', courseId);
    return all.length;
  },

  // Get total sessions completed
  async getTotalSessions() {
    const all = await Storage.getAll('sessionLog');
    return all.length;
  },

  // Get session summary for end screen
  getSessionSummary() {
    if (!this.sessionStart) return null;
    const total = this.sessionStart.correct + this.sessionStart.wrong;
    const duration = Date.now() - this.sessionStart.time;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return {
      total,
      correct: this.sessionStart.correct,
      wrong: this.sessionStart.wrong,
      accuracy: total > 0 ? Math.round(this.sessionStart.correct / total * 100) : 0,
      duration: `${minutes}m ${seconds}s`,
      categories: this.sessionStart.categories
    };
  },

  // Get bottom N categories by accuracy
  getWeakestCategories(count = 2) {
    if (!this.sessionStart || !this.sessionStart.categories) return [];
    const cats = Object.entries(this.sessionStart.categories).map(([name, data]) => {
      const total = data.correct + data.missed;
      return { name, accuracy: total > 0 ? data.correct / total : 0, total };
    });
    return cats
      .filter(c => c.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, count)
      .map(c => c.name);
  }
};
