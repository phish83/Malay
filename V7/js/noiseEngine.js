// =============================================================================
// NOISE ENGINE MODULE
// =============================================================================
class NoiseEngine {
  constructor(app) {
    this.app = app;
    this.enabled = false;
    this.noiseType = 'brown';
    this.level = 0.2;
    this.highPassFreq = 100;
    this.lowPassFreq = 8000;
    this.bufferSource = null;
    this.gainNode = null;
    this.highPassFilter = null;
    this.lowPassFilter = null;
    this.noiseBuffer = null;
    this.isConnected = false;
  }

  init() {
    // Initialize display values for noise controls
    this.app.uiManager.updateNoiseDisplay();
  }

  async generateNoiseBuffer() {
    const audioCtx = this.app.audioEngine.audioCtx;
    if (!audioCtx) {
      console.error('No AudioContext for noise generation');
      return null;
    }
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

  async start() {
    if (!this.enabled) {
      console.log('Noise engine disabled');
      return;
    }
    const audioCtx = this.app.audioEngine.audioCtx;
    if (!audioCtx) {
      console.error('No AudioContext for noise engine');
      return;
    }
    this.stop();
    try {
      this.noiseBuffer = await this.generateNoiseBuffer();
      if (!this.noiseBuffer) return;
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
      // Chain: source -> HP -> LP -> gain -> mixer
      this.bufferSource.connect(this.highPassFilter);
      this.highPassFilter.connect(this.lowPassFilter);
      this.lowPassFilter.connect(this.gainNode);
      this.gainNode.connect(this.app.audioEngine.mixerNode);
      this.bufferSource.start();
      console.log('Noise engine started');
    } catch (error) {
      console.error('Error starting noise engine:', error);
      this.cleanupNodes();
    }
  }

  stop() {
    if (this.bufferSource) {
      try { this.bufferSource.stop(); } catch {};
    }
    this.cleanupNodes();
    this.isConnected = false;
  }

  cleanupNodes() {
    [this.bufferSource, this.gainNode, this.highPassFilter, this.lowPassFilter]
      .forEach(node => { if (node) try { node.disconnect(); } catch {} });
    this.bufferSource = this.gainNode = this.highPassFilter = this.lowPassFilter = null;
  }

  connectToMixer(mixerNode) {
    if (!this.gainNode || !mixerNode || this.isConnected) return;
    try {
      this.gainNode.connect(mixerNode);
      this.isConnected = true;
      console.log('Noise connected to mixer');
    } catch (error) {
      console.error('Error connecting noise to mixer:', error);
    }
  }

  toggleNoise() {
    this.enabled = !this.enabled;
    document.getElementById('noiseToggle').textContent =
      this.enabled ? 'Disable Noise' : 'Enable Noise';
    console.log('Noise toggled:', this.enabled);
    if (this.enabled && this.app.audioEngine.isPlaying) {
      this.start();
    } else {
      this.stop();
    }
  }

  setNoiseType(type) {
    this.noiseType = type;
    console.log('Noise type set to:', type);
    if (this.enabled && this.app.audioEngine.isPlaying) {
      this.start();
    }
  }

  setNoiseLevel(value) {
    this.level = parseFloat(value) / 100;
    console.log('Noise level set to:', this.level);
    if (this.gainNode) this.gainNode.gain.value = this.level;
  }

  setHighPass(value) {
    this.highPassFreq = parseFloat(value);
    console.log('High-pass freq set to:', this.highPassFreq);
    if (this.highPassFilter) this.highPassFilter.frequency.value = this.highPassFreq;
  }

  setLowPass(value) {
    this.lowPassFreq = parseFloat(value);
    console.log('Low-pass freq set to:', this.lowPassFreq);
    if (this.lowPassFilter) this.lowPassFilter.frequency.value = this.lowPassFreq;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Expose globally
window.NoiseEngine = NoiseEngine;
