// ============================================================
// STORAGE — IndexedDB wrapper for v2
// ============================================================
const Storage = window.storage = {
  db: null,
  DB_NAME: 'second_chance_v2',
  DB_VERSION: 1,

  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('progression')) {
          db.createObjectStore('progression', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('perCourse')) {
          db.createObjectStore('perCourse', { keyPath: 'courseId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  },

  async get(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Legacy v1 migration
  async migrateLegacy() {
    try {
      const r = await window.storage.get('hiscore_v1');
      if (r && r.value) {
        const hiScore = parseInt(r.value) || 0;
        const existing = await this.get('perCourse', 'comptia');
        const courseData = existing || { courseId: 'comptia', questionsAnswered: 0, questionsCorrect: 0, bestScore: 0, bestGrade: null, runsCompleted: 0 };
        courseData.bestScore = Math.max(courseData.bestScore || 0, hiScore);
        await this.put('perCourse', courseData);
        console.log('[storage] Migrated legacy high score:', hiScore);
      }
    } catch (e) {
      console.warn('[storage] Legacy migration failed:', e);
    }
  },

  // Default progression record
  defaultProgression() {
    return {
      id: 'global',
      totalXP: 0,
      level: 0,
      skillPoints: 0,
      categorySkills: {},
      achievements: [],
      studyStreak: 0,
      lastActiveDate: null
    };
  },

  // Default settings record
  defaultSettings() {
    return {
      id: 'settings',
      muted: false,
      musicVolume: 1,
      sfxVolume: 1
    };
  }
};
