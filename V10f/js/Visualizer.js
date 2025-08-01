// VISUALIZER.js

class Visualizer {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.mode = "waves";
    this.animationId = null;
    this.particles = [];
  }

  init() {
    this.canvas = document.getElementById('visualizer');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.updateStyle();
    this.initParticles();
    this.resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const width = this.canvas ? this.canvas.width : 800;
    const height = this.canvas ? this.canvas.height : 300;
    
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.draw();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateStyle() {
    const select = document.getElementById("visualStyleSelect");
    if (!select) return;
    
    const value = select.value.toLowerCase();
    if (value.includes("wave")) this.mode = "waves";
    else if (value.includes("bar")) this.mode = "bars";
    else if (value.includes("brainwave")) this.mode = "brainwaves";
    else if (value.includes("neural")) this.mode = "neural";
    else if (value.includes("pulse")) this.mode = "pulses";
    else this.mode = "waves";
  }

  getThemeColor() {
    const bodyClass = document.body.className;
    if (bodyClass.includes("theme-light")) return "#2E8B57";
    if (bodyClass.includes("theme-warm")) return "#f4a261";
    if (bodyClass.includes("theme-neural")) return "#6495ed";
    return "#00ff88";
  }

  draw() {
    const analyser = this.app.audioEngine.getAnalyser();
    if (!analyser || !this.canvas || !this.ctx || !this.app.audioEngine.isPlaying) return;

    this.animationId = requestAnimationFrame(() => this.draw());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.mode) {
      case 'waves': this.drawWaves(analyser); break;
      case 'bars': this.drawBars(analyser); break;
      case 'brainwaves': this.drawBrainwaves(analyser); break;
      case 'neural': this.drawNeuralField(analyser); break;
      case 'pulses': this.drawPulses(analyser); break;
    }
  }

  drawWaves(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.getThemeColor();
    this.ctx.beginPath();

    const sliceWidth = this.canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * this.canvas.height / 2;

      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
      x += sliceWidth;
    }
    this.ctx.stroke();
  }

  drawBars(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (this.canvas.width / bufferLength) * 2.5;
    let x = 0;
    const color = this.getThemeColor();

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  
  drawBrainwaves(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const beatFreq = this.app.audioEngine.beatFrequency;
    
    // Draw concentric circles representing brainwave frequencies
    const maxRadius = Math.min(centerX, centerY) - 20;
    const numRings = 5;
    
    this.ctx.strokeStyle = this.getThemeColor();
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < numRings; i++) {
      const amplitude = dataArray[i * 20] / 255;
      const radius = (maxRadius / numRings) * (i + 1) * (0.5 + amplitude);
      const alpha = 0.3 + amplitude * 0.7;
      
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Add pulsing center based on beat frequency
    const pulseSize = 10 + Math.sin(Date.now() * beatFreq * 0.01) * 5;
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = this.getThemeColor();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawNeuralField(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const color = this.getThemeColor();
    
    // Update and draw neural network particles
    this.particles.forEach((particle, index) => {
      const amplitude = dataArray[index % bufferLength] / 255;
      
      // Update particle position with neural-like movement
      particle.x += Math.cos(particle.angle) * particle.speed * (0.5 + amplitude);
      particle.y += Math.sin(particle.angle) * particle.speed * (0.5 + amplitude);
      particle.angle += 0.02 * amplitude;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Draw particle
      const alpha = 0.5 + amplitude * 0.5;
      this.ctx.fillStyle = this.hexToRgba(color, alpha);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * (1 + amplitude), 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw connections to nearby particles
      this.particles.forEach((other, otherIndex) => {
        if (index !== otherIndex) {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const connectionAlpha = (1 - distance / 100) * amplitude * 0.3;
            this.ctx.strokeStyle = this.hexToRgba(color, connectionAlpha);
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(other.x, other.y);
            this.ctx.stroke();
          }
        }
      });
    });
  }

  drawPulses(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const beatFreq = this.app.audioEngine.beatFrequency;
    const color = this.getThemeColor();
    
    // Create pulsing rings based on beat frequency
    const time = Date.now() * 0.001;
    const pulsePhase = Math.sin(time * beatFreq * 2 * Math.PI);
    
    for (let i = 0; i < 3; i++) {
      const amplitude = dataArray[i * 50] / 255;
      const radius = 50 + i * 30 + pulsePhase * 20 * amplitude;
      const alpha = 0.2 + amplitude * 0.6 * Math.abs(pulsePhase);
      
      this.ctx.strokeStyle = this.hexToRgba(color, alpha);
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  hexToRgba(hex, alpha) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}