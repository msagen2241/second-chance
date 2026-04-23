// ============================================================
// JUICE — Visual effects: screen shake, particles, animations
// ============================================================
const Juice = {
  canvas: null,
  ctx: null,
  particles: [],
  animFrame: null,

  // Initialize particle canvas
  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'particle-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.loop();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  // Animation loop
  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= 0.02;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    this.ctx.globalAlpha = 1;
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  // Emit particles
  emit(x, y, count, color, opts = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * (opts.spread || 50),
        y: y + (Math.random() - 0.5) * (opts.spread || 50),
        vx: (Math.random() - 0.5) * (opts.speed || 4),
        vy: (Math.random() - 0.5) * (opts.speed || 4) - (opts.upward || 0),
        size: opts.size || (Math.random() * 6 + 2),
        color: color,
        life: 1,
        gravity: opts.gravity || 0
      });
    }
  },

  // Screen shake
  shake(intensity = 10, duration = 300) {
    const body = document.body;
    body.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;

    const steps = 5;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        clearInterval(interval);
        body.style.transform = '';
      } else {
        const remaining = (steps - step) / steps;
        body.style.transform = `translate(${(Math.random() - 0.5) * intensity * remaining}px, ${(Math.random() - 0.5) * intensity * remaining}px)`;
      }
    }, stepTime);
  },

  // Flash overlay
  flash(color, duration = 300) {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = color;
    flash.style.opacity = '0.3';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '9998';
    flash.style.transition = `opacity ${duration}ms ease-out`;
    document.body.appendChild(flash);

    requestAnimationFrame(() => {
      flash.style.opacity = '0';
    });

    setTimeout(() => flash.remove(), duration);
  },

  // Correct answer effects
  onCorrect(buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    this.emit(x, y, 15, '#b8ff2e', { spread: 100, speed: 6, upward: 2 });
    this.flash('rgba(184, 255, 46, 0.1)', 300);
  },

  // Wrong answer effects
  onWrong(buttonEl) {
    this.shake(15, 300);
    this.flash('rgba(255, 59, 59, 0.1)', 300);
  },

  // Streak milestone effects
  onStreakMilestone(level) {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    const colors = ['#ffd60a', '#ff2e8a', '#00f0ff', '#b8ff2e', '#ff3b3b'];
    this.emit(x, y, 30, colors[level % colors.length], { spread: 200, speed: 8, upward: 4 });
  },

  // Boss defeat effects
  onBossDefeat() {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    this.emit(x, y, 50, '#ffd60a', { spread: 300, speed: 10, upward: 5, size: 8 });
    this.flash('rgba(255, 214, 10, 0.15)', 500);
  },

  // Power-up pick effects
  onPowerUpPick(buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    this.emit(x, y, 20, '#ff2e8a', { spread: 150, speed: 6, upward: 3 });
  },

  // Floating text
  floatingText(x, y, text, color = '#fff', duration = 1000) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    el.style.fontSize = '24px';
    el.style.fontWeight = 'bold';
    el.style.fontFamily = "'VT323', monospace";
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.transition = `all ${duration}ms ease-out`;
    el.style.textShadow = `0 0 10px ${color}`;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.top = `${y - 100}px`;
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), duration);
  }
};
