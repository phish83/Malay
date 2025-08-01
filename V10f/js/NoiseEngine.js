// NOISEENGINE.js

class NoiseEngine {
  constructor(app) {
    this.app = app;
    this.enabled = false;
    this.noiseType = 'brown';
    this.level = 0.15;
    this.highPassFreq = 80;
    this.lowPassFreq = 6000;
    this.bufferSource = null;
    this.gainNode = null;
    this.highPassFilter = null;
    this.lowPassFilter = null;
    this.noiseBuffer = null;
    this.isConnected = false;
  }

  init() {
    this.app.uiManager.updateNoiseDisplay();
  }

  async generateNoiseBuffer() {
    const audioCtx = this.app.audioEngine.audioCtx;
    if (!audioCtx) return null;
    
    try {
      const sampleRate = audioCtx.sampleRate;
      const bufferSize = sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      this.generateNoise(output, this.noiseType);
      return noiseBuffer;
    } catch (error) {
      console.error('Error generating noise buffer:', error);
      return null;
    }
  }

  generateNoise(output, type) {
    switch (type) {
      case 'white':
        for (let i = 0; i < output.length; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.3;
        }
        break;
      case 'pink':
        this.generatePinkNoise(output);
        break;
      case 'brown':
        this.generateBrownNoise(output);
        break;
      case 'rain':
        this.generateRainNoise(output);
        break;
      case 'ocean':
        this.generateOceanNoise(output);
        break;
    }
  }

  generatePinkNoise(output) {
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < output.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11;
      b6 = white * 0.115926;
    }
  }

  generateBrownNoise(output) {
    let lastOut = 0.0;
    for (let i = 0; i < output.length; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
    }
  }
  
  generateRainNoise(output) {
    // Simulate rain with filtered noise and occasional droplets
    for (let i = 0; i < output.length; i++) {
      let sample = (Math.random() * 2 - 1) * 0.2;
      // Add occasional droplet sounds
      if (Math.random() < 0.001) {
        sample += (Math.random() * 2 - 1) * 0.5;
      }
      output[i] = sample;
    }
  }
  
  generateOceanNoise(output) {
    // Simulate ocean waves with low-frequency modulation
    for (let i = 0; i < output.length; i++) {
      const white = (Math.random() * 2 - 1) * 0.3;
      const wave = Math.sin(i * 0.001) * 0.2;
      output[i] = white * (0.5 + wave);
    }
  }

  async start() {
    this.stop(); // Clean up existing sources before replaying
    if (!this.enabled) return;
    
    const audioCtx = this.app.audioEngine.audioCtx;
    if (!audioCtx) return;
    
    try {
      this.noiseBuffer = await this.generateNoiseBuffer();
      if (!this.noiseBuffer) {
        console.error("❌ Failed to generate noise buffer.");
        return;
      } else {
        console.log("✅ Noise buffer created successfully.");
      }

      this.bufferSource = audioCtx.createBufferSource();
      this.gainNode = audioCtx.createGain();
      this.highPassFilter = audioCtx.createBiquadFilter();
      this.lowPassFilter = audioCtx.createBiquadFilter();

      this.bufferSource.buffer = this.noiseBuffer;
      this.bufferSource.loop = true;

      this.gainNode.gain.value = this.level;

      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.value = this.highPassFreq;

      this.lowPassFilter.type = 'lowpass';
      this.lowPassFilter.frequency.value = this.lowPassFreq;

      this.bufferSource.connect(this.highPassFilter);
      this.highPassFilter.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.gainNode);

      this.bufferSource.start();

      // Connect to output directly if main audio is not playing
      if (!this.app.audioEngine.isPlaying && this.gainNode) {
        try {
          this.gainNode.connect(this.app.audioEngine.audioCtx.destination);
          console.log("🔊 Noise connected directly to output.");
        } catch (err) {
          console.error("❌ Failed to connect noise to output:", err);
        }
      }
    } catch (error) {
      console.error('Error starting noise engine:', error);
      this.cleanupNodes();
    }
  }

  stop() {
    if (this.bufferSource) {
      try { this.bufferSource.stop(); } catch(e) { /* ignore */ }
    }
    this.cleanupNodes();
    this.isConnected = false;
  }

  cleanupNodes() {
    [this.bufferSource, this.gainNode, this.highPassFilter, this.lowPassFilter]
      .forEach(node => { if (node) try { node.disconnect(); } catch(e) { /* ignore */ } });
    this.bufferSource = this.gainNode = this.highPassFilter = this.lowPassFilter = null;
  }

  connectToMixer(mixerNode) {
    if (!this.gainNode || !mixerNode || this.isConnected) return;
    try {
      this.gainNode.connect(mixerNode);
      this.isConnected = true;
    } catch (error) {
      console.error('Error connecting noise to mixer:', error);
    }
  }

  toggleNoise() {
    this.enabled = !this.enabled;
    const toggleEl = document.getElementById('noiseToggle');
    if (toggleEl) {
      toggleEl.textContent = this.enabled ? 'Disable Background' : 'Enable Background';
    }
    
    if (this.enabled) {
      this.start().then(() => {
        if (this.app.audioEngine.isPlaying) {
          this.connectToMixer(this.app.audioEngine.mixerNode);
        } else if (this.gainNode) {
          this.gainNode.connect(this.app.audioEngine.audioCtx.destination);
        }
      });
    } else {
      this.stop();
    }
  }

  setNoiseType(type) {
    this.noiseType = type;
    if (this.enabled) {
      this.start().then(() => {
        if (this.app.audioEngine.isPlaying) {
          this.connectToMixer(this.app.audioEngine.mixerNode);
        } else if (this.gainNode) {
          this.gainNode.connect(this.app.audioEngine.audioCtx.destination);
        }
      });
    }
  }

  setNoiseLevel(value) {
    this.level = parseFloat(value) / 100;
    if (this.gainNode) this.gainNode.gain.value = this.level;
  }

  setHighPass(value) {
    this.highPassFreq = parseFloat(value);
    if (this.highPassFilter) this.highPassFilter.frequency.value = this.highPassFreq;
  }

  setLowPass(value) {
    this.lowPassFreq = parseFloat(value);
    if (this.lowPassFilter) this.lowPassFilter.frequency.value = this.lowPassFreq;
  }

  isEnabled() {
    return this.enabled;
  }
}