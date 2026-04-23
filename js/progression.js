// ============================================================
// PROGRESSION — XP, levels, skill tree, achievements, study streak
// ============================================================
const Progression = {
  data: null,
  courseData: null,

  // Load progression data
  async load() {
    this.data = await Storage.get('progression', 'global');
    if (!this.data) {
      this.data = Storage.defaultProgression();
      await Storage.put('progression', this.data);
    }

    // Load per-course data
    if (Core.state.courseId) {
      this.courseData = await Storage.get('perCourse', Core.state.courseId);
      if (!this.courseData) {
        this.courseData = {
          courseId: Core.state.courseId,
          questionsAnswered: 0,
          questionsCorrect: 0,
          bestScore: 0,
          bestGrade: null,
          runsCompleted: 0
        };
        await Storage.put('perCourse', this.courseData);
      }
    }

    // Update study streak
    this.updateStudyStreak();

    // Migrate legacy data on first run
    await Storage.migrateLegacy();

    return this.data;
  },

  // Save progression data
  async save() {
    if (this.data) {
      await Storage.put('progression', this.data);
    }
    if (this.courseData) {
      await Storage.put('perCourse', this.courseData);
    }
  },

  // Award XP
  awardXP(amount) {
    if (!this.data) return;

    // Apply category skill multiplier
    const category = Core.state.currentOptions ? Core.state.currentOptions.category : null;
    if (category && this.data.categorySkills[category]) {
      const skillLevel = this.data.categorySkills[category];
      amount = Math.round(amount * (1 + skillLevel * 0.1));
    }

    this.data.totalXP += amount;
    this.checkLevelUp();
    this.save(); // Persist immediately so XP survives browser close
  },

  // Check for level up (handles multiple level-ups)
  checkLevelUp() {
    if (!this.data) return;

    while (this.data.level < 50) {
      const nextLevelCost = 100 * (this.data.level + 1) + 200;
      if (this.data.totalXP >= nextLevelCost) {
        this.data.level++;
        this.data.skillPoints++;
        console.log(`[progression] Level up! Now level ${this.data.level}, +1 skill point`);
      } else {
        break;
      }
    }
  },

  // Spend skill point on category
  spendSkillPoint(category) {
    if (!this.data || this.data.skillPoints <= 0) return false;

    const currentLevel = this.data.categorySkills[category] || 0;
    if (currentLevel >= 10) return false; // Max level

    this.data.skillPoints--;
    this.data.categorySkills[category] = currentLevel + 1;
    this.save();
    return true;
  },

  // Update study streak
  updateStudyStreak() {
    if (!this.data) return;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (this.data.lastActiveDate === today) {
      // Already played today, no change
    } else if (this.data.lastActiveDate === yesterday) {
      this.data.studyStreak++;
    } else {
      this.data.studyStreak = 1;
    }

    this.data.lastActiveDate = today;
    this.save();
  },

  // Record run completion
  recordRun(score, correct, total, grade) {
    if (!this.courseData) return;

    this.courseData.questionsAnswered += total;
    this.courseData.questionsCorrect += correct;
    this.courseData.runsCompleted++;

    if (score > this.courseData.bestScore) {
      this.courseData.bestScore = score;
    }

    // Update best grade
    if (grade) {
      const gradeOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
      const currentBest = this.courseData.bestGrade ? gradeOrder.indexOf(this.courseData.bestGrade) : 6;
      const newBest = gradeOrder.indexOf(grade);
      if (newBest < currentBest) {
        this.courseData.bestGrade = grade;
      }
    }

    this.save();
  },

  // Check and unlock achievements
  checkAchievements(condition) {
    if (!this.data) return [];

    const unlocked = [];
    const achievements = [
      { id: 'first_blood', name: 'First Blood', desc: 'First correct answer', condition: () => Core.state.correctCount === 1, xp: 50 },
      { id: 'unstoppable', name: 'Unstoppable', desc: '10-streak in one run', condition: () => Core.state.streak >= 10, xp: 200 },
      { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat 10 boss questions', condition: () => Gameplay.bossDefeats >= 10, xp: 300 },
      { id: 'marathon', name: 'Marathon', desc: 'Answer 50 questions in one run', condition: () => Core.state.correctCount >= 50, xp: 250 },
      { id: 'perfect_run', name: 'Perfect Run', desc: 'Clear a course with no wrong answers', condition: () => Core.state.correctCount > 0 && Core.state.missed.length === 0 && Core.state.screen === 'end', xp: 500 },
      { id: 'comeback', name: 'Comeback', desc: 'Win Normal mode after losing 2+ lives', condition: () => Core.state.mode === 'normal' && Core.state.lives <= 1 && Core.state.screen === 'end', xp: 150 },
      { id: 'speed_demon', name: 'Speed Demon', desc: '5-combo chain', condition: () => Gameplay.comboCount >= 5, xp: 100 },
      { id: 'daily_grind', name: 'Daily Grind', desc: '7-day study streak', condition: () => this.data.studyStreak >= 7, xp: 400 }
    ];

    achievements.forEach(ach => {
      if (!this.data.achievements.includes(ach.id) && ach.condition()) {
        this.data.achievements.push(ach.id);
        this.awardXP(ach.xp);
        unlocked.push(ach);
      }
    });

    if (unlocked.length > 0) {
      this.save();
      // Show notifications for each unlocked achievement
      unlocked.forEach((ach, i) => {
        setTimeout(() => this.showAchievementNotification(ach), i * 4000);
      });
    }

    return unlocked;
  },

  // Show achievement notification
  showAchievementNotification(ach) {
    const notif = document.createElement('div');
    notif.className = 'achievement-notification';
    notif.innerHTML = `
      <div class="ach-title">★ ACHIEVEMENT UNLOCKED ★</div>
      <div class="ach-name">${ach.name}</div>
      <div class="ach-desc">${ach.desc}</div>
    `;
    document.body.appendChild(notif);
    Audio.sfx('streak', 3);

    // Auto-remove after animation
    setTimeout(() => notif.remove(), 4000);
  },

  // Get XP needed for next level
  xpToNextLevel() {
    if (!this.data) return 0;
    return 100 * (this.data.level + 1) + 200 - this.data.totalXP;
  },

  // Get category skill level
  getCategorySkill(category) {
    if (!this.data || !this.data.categorySkills) return 0;
    return this.data.categorySkills[category] || 0;
  },

  // Get XP multiplier for category
  categoryMultiplier(category) {
    const skillLevel = this.getCategorySkill(category);
    return 1 + skillLevel * 0.1;
  },

  // Render skill tree panel
  renderSkillTree(onClose) {
    const categories = Courses.getCategories();
    const stage = document.getElementById('stage');

    stage.innerHTML = `
      <div class="skill-tree-screen">
        <div class="skill-tree-title">SKILL TREE</div>
        <div class="skill-tree-sub">Spend skill points to boost XP in categories</div>
        <div class="skill-tree-points">Skill Points: ${this.data.skillPoints}</div>
        <div class="skill-tree-categories">
          ${categories.map(cat => {
            const level = this.getCategorySkill(cat);
            const maxed = level >= 10;
            const canSpend = this.data.skillPoints > 0 && !maxed;
            return `
              <div class="skill-tree-row">
                <span class="skill-tree-cat">${cat}</span>
                <div class="skill-tree-bar">
                  ${Array(10).fill(0).map((_, i) => `
                    <span class="skill-tree-pip ${i < level ? 'filled' : ''}"></span>
                  `).join('')}
                </div>
                <span class="skill-tree-level">${level}/10</span>
                ${canSpend ? `<button class="btn-skill-up" data-cat="${cat}">+</button>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <button class="btn-secondary skill-tree-close">CLOSE</button>
      </div>
    `;

    stage.querySelectorAll('.btn-skill-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        if (this.spendSkillPoint(cat)) {
          this.renderSkillTree(onClose);
        }
      });
    });

    stage.querySelector('.skill-tree-close').addEventListener('click', onClose);
  }
};
