// ============================================================
// ERRORLOG — Track every wrong answer for mistake analysis
// ============================================================
const ErrorLog = {
  // Log a single answer (correct or wrong)
  async logAnswer(qId, isCorrect, pickedIdx, category, totalOptions) {
    const questions = Courses.getQuestions();
    const q = questions[qId];
    if (!q) return;

    await Storage.put('questionLog', {
      courseId: Core.state.courseId,
      qId,
      isCorrect,
      pickedIdx,
      category: q.category,
      timestamp: Date.now()
    });
  },

  // Get all wrong answers for a course, sorted by most recent
  async getMistakes(courseId) {
    const all = await Storage.getByIndex('questionLog', 'courseId', courseId);
    return all
      .filter(r => !r.isCorrect)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  // Get top N most-missed question IDs for a course
  async getMostMissed(courseId, limit = 10) {
    const mistakes = await this.getMistakes(courseId);
    const counts = {};
    mistakes.forEach(r => {
      counts[r.qId] = (counts[r.qId] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => parseInt(id));
  },

  // Get per-category accuracy for a course: { category: { correct, missed, total } }
  async getCategoryAccuracy(courseId) {
    const all = await Storage.getByIndex('questionLog', 'courseId', courseId);
    const stats = {};
    all.forEach(r => {
      if (!stats[r.category]) stats[r.category] = { correct: 0, missed: 0, total: 0 };
      stats[r.category].total++;
      if (r.isCorrect) stats[r.category].correct++;
      else stats[r.category].missed++;
    });
    return stats;
  },

  // Get all-time accuracy for a course
  async getOverallAccuracy(courseId) {
    const all = await Storage.getByIndex('questionLog', 'courseId', courseId);
    if (all.length === 0) return { correct: 0, total: 0, pct: 0 };
    const correct = all.filter(r => r.isCorrect).length;
    return { correct, total: all.length, pct: Math.round(correct / all.length * 100) };
  },

  // Get recent mistakes (last N wrong answers)
  async getRecentMistakes(courseId, limit = 5) {
    const mistakes = await this.getMistakes(courseId);
    return mistakes.slice(0, limit);
  }
};
