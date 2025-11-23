// KeyboardShortcuts.js
// Keyboard shortcut manager for hands-free control

export class KeyboardShortcuts {
  constructor(engine, timer) {
    this.engine = engine;
    this.timer = timer;
    this.enabled = true;
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      // Ignore if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      const key = e.key.toLowerCase();
      
      // Space: Play/Pause
      if (key === ' ') {
        e.preventDefault();
        if (this.engine.isPlaying) {
          this.engine.stop();
        } else {
          this.engine.start();
        }
        return;
      }

      // M: Mute/Unmute
      if (key === 'm') {
        e.preventDefault();
        this.engine.isMuted = !this.engine.isMuted;
        this.engine.setVolume(document.getElementById('masterRange')?.value || 70);
        return;
      }

      // Arrow Up/Down: Adjust Beat Frequency
      if (key === 'arrowup') {
        e.preventDefault();
        const beatInput = document.getElementById('beatInput');
        if (beatInput) {
          const newVal = Math.min(100, parseFloat(beatInput.value) + 0.5);
          beatInput.value = newVal;
          beatInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      if (key === 'arrowdown') {
        e.preventDefault();
        const beatInput = document.getElementById('beatInput');
        if (beatInput) {
          const newVal = Math.max(0.1, parseFloat(beatInput.value) - 0.5);
          beatInput.value = newVal;
          beatInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      // Arrow Left/Right: Adjust Base Frequency
      if (key === 'arrowleft') {
        e.preventDefault();
        const baseInput = document.getElementById('baseInput');
        if (baseInput) {
          const newVal = Math.max(20, parseFloat(baseInput.value) - 10);
          baseInput.value = newVal;
          baseInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      if (key === 'arrowright') {
        e.preventDefault();
        const baseInput = document.getElementById('baseInput');
        if (baseInput) {
          const newVal = Math.min(2000, parseFloat(baseInput.value) + 10);
          baseInput.value = newVal;
          baseInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      // T: Start/Stop Timer
      if (key === 't') {
        e.preventDefault();
        if (this.timer) {
          if (this.timer.running) {
            this.timer.pause();
          } else {
            this.timer.start();
          }
        }
        return;
      }

      // R: Reset Timer
      if (key === 'r') {
        e.preventDefault();
        if (this.timer) {
          this.timer.reset();
        }
        return;
      }

      // F: Fullscreen
      if (key === 'f') {
        e.preventDefault();
        const wrapper = document.getElementById('visualWrapper');
        if (!document.fullscreenElement) {
          wrapper?.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        return;
      }

      // Number keys 1-9: Quick preset selection
      const numMatch = key.match(/^[1-9]$/);
      if (numMatch) {
        e.preventDefault();
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect && presetSelect.options.length > parseInt(key)) {
          presetSelect.selectedIndex = parseInt(key);
          presetSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }

      // N: Toggle Noise
      if (key === 'n') {
        e.preventDefault();
        this.engine.noiseEngine.toggle();
        return;
      }

      // +/-: Volume control
      if (key === '+' || key === '=') {
        e.preventDefault();
        const masterRange = document.getElementById('masterRange');
        if (masterRange) {
          const newVal = Math.min(100, parseInt(masterRange.value) + 5);
          masterRange.value = newVal;
          masterRange.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      if (key === '-' || key === '_') {
        e.preventDefault();
        const masterRange = document.getElementById('masterRange');
        if (masterRange) {
          const newVal = Math.max(0, parseInt(masterRange.value) - 5);
          masterRange.value = newVal;
          masterRange.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      // ?: Show help
      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        document.getElementById('featureGuide')?.style.setProperty('display', 'flex');
        return;
      }
    });

    console.log('⌨️ Keyboard shortcuts initialized');
    console.log('💡 Press ? to see all shortcuts');
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}