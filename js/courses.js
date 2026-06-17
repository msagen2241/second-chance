// ============================================================
// COURSES — Load and manage course data
// ============================================================
const Courses = {
  current: null,
  available: [],

  // Load a course by ID
  async load(id) {
    const fallback = window.COURSE_DATA && window.COURSE_DATA[id];
    if (window.location.protocol === 'file:' && fallback) {
      this.current = fallback;
      console.log(`[courses] Loaded bundled ${fallback.name} (${fallback.questions.length} questions)`);
      return this.current;
    }

    try {
      const response = await fetch(`courses/${id}.json`);
      if (!response.ok) throw new Error(`Course ${id} not found`);
      this.current = await response.json();
      console.log(`[courses] Loaded ${this.current.name} (${this.current.questions.length} questions)`);
      return this.current;
    } catch (e) {
      if (fallback) {
        this.current = fallback;
        console.warn(`[courses] Fetch failed; using bundled ${fallback.name} (${fallback.questions.length} questions)`, e);
        return this.current;
      }
      console.error('[courses] Failed to load course:', e);
      return null;
    }
  },

  // Discover available courses by scanning known IDs
  // In future: could use a manifest.json or directory listing
  async discover() {
    const knownCourses = ['itil4']; // Add more as they're created
    this.available = [];
    for (const id of knownCourses) {
      const fallback = window.COURSE_DATA && window.COURSE_DATA[id];
      if (window.location.protocol === 'file:' && fallback) {
        this.available.push({ id: fallback.id, name: fallback.name, questionCount: fallback.questions.length });
        continue;
      }

      try {
        const response = await fetch(`courses/${id}.json`, { method: 'HEAD' });
        if (response.ok) {
          const data = await fetch(`courses/${id}.json`).then(r => r.json());
          this.available.push({ id: data.id, name: data.name, questionCount: data.questions.length });
        }
      } catch (e) {
        if (fallback) {
          this.available.push({ id: fallback.id, name: fallback.name, questionCount: fallback.questions.length });
        }
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
