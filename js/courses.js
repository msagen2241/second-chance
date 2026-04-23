// ============================================================
// COURSES — Load and manage course data
// ============================================================
const Courses = {
  current: null,
  available: [],

  // Load a course by ID
  async load(id) {
    try {
      const response = await fetch(`courses/${id}.json`);
      if (!response.ok) throw new Error(`Course ${id} not found`);
      this.current = await response.json();
      console.log(`[courses] Loaded ${this.current.name} (${this.current.questions.length} questions)`);
      return this.current;
    } catch (e) {
      console.error('[courses] Failed to load course:', e);
      return null;
    }
  },

  // Discover available courses by scanning known IDs
  // In future: could use a manifest.json or directory listing
  async discover() {
    const knownCourses = ['comptia']; // Add more as they're created
    this.available = [];
    for (const id of knownCourses) {
      try {
        const response = await fetch(`courses/${id}.json`, { method: 'HEAD' });
        if (response.ok) {
          const data = await fetch(`courses/${id}.json`).then(r => r.json());
          this.available.push({ id: data.id, name: data.name, questionCount: data.questions.length });
        }
      } catch (e) {
        // Course not available
      }
    }
    return this.available;
  },

  // Get questions for current course
  getQuestions() {
    return this.current ? this.current.questions : [];
  },

  // Get categories for current course
  getCategories() {
    return this.current ? this.current.categories : [];
  }
};
