// =============================================================================
// VISUALIZER MODULE - Theme Adaptive + Fit Enhancements
// =============================================================================
class Visualizer {
  constructor(app) {
    this.app = app;
    this.canvas = null;
    this.ctx = null;
    this.mode = "wave";
    this.animationId = null;
    this.particles = [];
  }

  init() {
    this.canvas = document.getElementById('visualizer');
    this.ctx = this.canvas.getContext('2d');
    this.updateStyle();
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        angle: Math.random() * Math.PI * 2
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
    const value = document.getElementById("visualStyleSelect").value.toLowerCase();
    if (value.includes("wave")) this.mode = "wave";
    else if (value.includes("bar")) this.mode = "bar";
    else if (value.includes("mandala")) this.mode = "mandala";
    else if (value.includes("energy")) this.mode = "energy";
    else if (value.includes("crystal")) this.mode = "crystal";
  }

  getThemeColor() {
    const bodyClass = document.body.className;
    if (bodyClass.includes("theme-light")) return "#2E8B57";
    if (bodyClass.includes("theme-warm")) return "#f4a261";
    if (bodyClass.includes("theme-sacred")) return "#b366d9";
    return "#00ff88"; // default for dark
  }

  draw() {
    const analyser = this.app.audioEngine.getAnalyser();
    if (!analyser || !this.canvas || !this.app.audioEngine.isPlaying) return;

    this.animationId = requestAnimationFrame(() => this.draw());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.mode) {
      case 'wave': this.drawWaves(analyser); break;
      case 'bar': this.drawBars(analyser); break;
      case 'mandala': this.drawMandala(analyser); break;
      case 'energy': this.drawEnergy(analyser); break;
      case 'crystal': this.drawCrystal(analyser); break;
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

  drawMandala(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    this.ctx.strokeStyle = this.getThemeColor();
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const amplitude = dataArray[i * 4] / 255;
      const radius = maxRadius * amplitude;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      for (let j = 0; j < 6; j++) {
        const petalAngle = angle + (j / 6) * Math.PI * 2;
        const petalX = centerX + Math.cos(petalAngle) * radius;
        const petalY = centerY + Math.sin(petalAngle) * radius;

        this.ctx.beginPath();
        this.ctx.arc(petalX, petalY, radius * 0.3, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  drawEnergy(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const color = this.getThemeColor();

    this.particles.forEach((particle, index) => {
      const amplitude = dataArray[index % bufferLength] / 255;
      particle.x += Math.cos(particle.angle) * particle.speed * (1 + amplitude);
      particle.y += Math.sin(particle.angle) * particle.speed * (1 + amplitude);
      particle.angle += 0.02;

      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      const alpha = amplitude * 0.8 + 0.2;
      this.ctx.fillStyle = this.hexToRgba(color, alpha);
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * (1 + amplitude), 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawCrystal(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const color = this.getThemeColor();

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const amplitude = dataArray[i * 8] / 255;
      const length = 40 + 100 * amplitude;

      const x1 = centerX + Math.cos(angle) * 20;
      const y1 = centerY + Math.sin(angle) * 20;
      const x2 = centerX + Math.cos(angle) * length;
      const y2 = centerY + Math.sin(angle) * length;

      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x2, y2, 3 * (1 + amplitude), 0, Math.PI * 2);
      this.ctx.fill();
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
