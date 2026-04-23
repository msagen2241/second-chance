// ============================================================
// TOUCH — Hammer.js gesture management
// ============================================================
const Touch = {
  hammer: null,

  init() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    document.body.classList.add('touch-device');
    window.IS_TOUCH = true;

    this.hammer = new Hammer.Manager(document.getElementById('stage'));
    this.hammer.add([
      new Hammer.Swipe({ direction: Hammer.DIRECTION_LEFT, velocity: 0.3 }),
      new Hammer.Tap({ event: 'tap', taps: 1 }),
    ]);

    this.hammer.on('swipeleft', (ev) => {
      if (Core.state.screen === 'game' && Core.state.answered) {
        ev.srcEvent.preventDefault();
        Core.advance();
      }
    });

    this.hammer.on('tap', (ev) => {
      const target = ev.srcEvent.target;
      const answerBtn = target.closest('.answer-btn');
      if (answerBtn && !answerBtn.disabled) {
        const idx = Number(answerBtn.dataset.idx);
        if (Number.isInteger(idx)) Core.handleAnswer(idx);
        return;
      }

      const nextBtn = target.closest('#nextBtn');
      if (nextBtn) {
        Core.advance();
      }
    });
  }
};
