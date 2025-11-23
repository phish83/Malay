// VisualPulse.js
// Adds pulsing glow effect to visualizer synced with beat frequency

export class VisualPulse {
  constructor(engine, visualizer) {
    this.engine = engine;
    this.visualizer = visualizer;
    this.pulsePhase = 0;
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    console.log('💫 Visual pulse activated');
  }

  stop() {
    this.isActive = false;
    this.removePulse();
  }

  update() {
    if (!this.isActive || !this.engine.isPlaying) {
      this.removePulse();
      return;
    }

    const beatFreq = this.engine.beatFrequency || 10;
    const cycleTime = 1000 / beatFreq;
    this.pulsePhase = (Date.now() % cycleTime) / cycleTime;
    
    this.applyPulse();
  }

  applyPulse() {
    const canvas = document.getElementById('visualWrapper');
    if (!canvas) return;

    // Sine wave pulse (0 to 1 and back)
    const intensity = Math.sin(this.pulsePhase * Math.PI) * 0.5;
    
    // Get brainwave color
    const color = this.getBrainwaveColor(this.engine.beatFrequency);
    
    // Apply glow
    const glowSize = 15 + (intensity * 20);
    const opacity = 0.3 + (intensity * 0.4);
    
    canvas.style.boxShadow = `
      0 0 ${glowSize}px rgba(${color.r}, ${color.g}, ${color.b}, ${opacity}),
      inset 0 0 ${glowSize * 2}px rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})
    `;
    canvas.style.borderColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 + intensity * 0.5})`;
  }

  removePulse() {
    const canvas = document.getElementById('visualWrapper');
    if (canvas) {
      canvas.style.boxShadow = '';
      canvas.style.borderColor = '';
    }
  }

  getBrainwaveColor(beatFreq) {
    if (beatFreq <= 1) return { r: 138, g: 43, b: 226 }; // Epsilon
    if (beatFreq <= 4) return { r: 59, g: 130, b: 246 }; // Delta
    if (beatFreq <= 8) return { r: 34, g: 197, b: 94 }; // Theta
    if (beatFreq <= 12) return { r: 251, g: 191, b: 36 }; // Alpha
    if (beatFreq <= 15) return { r: 251, g: 146, b: 60 }; // SMR
    if (beatFreq <= 30) return { r: 239, g: 68, b: 68 }; // Beta
    return { r: 236, g: 72, b: 153 }; // Gamma
  }
}