// AudioEngine.js - Fixed Version

class AudioEngine {
  constructor(app) {
    this.app = app;
    this.audioCtx = null;
    this.isPlaying = false;
    this.mode = 'binaural'; // binaural, isochronic, monaural
    this.volume = 0.3;
    this.isMuted = false;
    this.lastVolume = 0.3;
    this.beatFrequency = 10; // Hz
    this.baseFrequency = 200; // Base carrier frequency

    // Audio nodes
    this.leftOsc = null;
    this.rightOsc = null;
    this.isoOsc = null;
    this.isoGain = null;
    this.isoLFO = null;
    this.gainNodeL = null;
    this.gainNodeR = null;
    this.mainGain = null;
    this.analyser = null;
    this.mixerNode = null;
    this.panner = null;

    // Anti-pop constants
    this.RAMP_TIME = 0.05; // 50ms ramp for smooth transitions
    this.CROSSFADE_TIME = 0.1; // 100ms for mode switching
  }

  async start() {
    console.log('🔊 AudioEngine.start() called');
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // Graceful stop before restart
    await this.stop(false);
    await this.setupAudioGraph();
    this.isPlaying = true;
    this.app.visualizer.start();
  }

  async setupAudioGraph() {
    const now = this.audioCtx.currentTime;
    
    // Create core nodes
    this.mainGain = this.audioCtx.createGain();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    
    // Start with zero volume and ramp up to prevent pop
    this.mainGain.gain.setValueAtTime(0, now);
    const targetVolume = this.isMuted ? 0 : this.volume;
    this.mainGain.gain.linearRampToValueAtTime(targetVolume, now + this.RAMP_TIME);

    // Mode-specific graph
    switch (this.mode) {
      case 'binaural':
        this.setupBinauralMode();
        break;
      case 'isochronic':
        this.setupIsochronicMode();
        break;
      case 'monaural':
        this.setupMonauralMode();
        break;
    }

    // EQ chain → mixer
    const outputNode = this.app.equalizer.connectToChain(this.mainGain);
    this.mixerNode = this.audioCtx.createGain();
    this.mixerNode.gain.value = 1.0;
    outputNode.connect(this.mixerNode);

    // Ambient noise injection
    if (this.app.noiseEngine.isEnabled()) {
      await this.app.noiseEngine.start();
      this.app.noiseEngine.connectToMixer(this.mixerNode);
      console.log('🔁 Ambient noise re-applied after graph reset');
    }

    // Route through analyser → global panner → destination
    this.mixerNode.connect(this.analyser);
    this.panner = this.audioCtx.createStereoPanner();
    this.panner.pan.value = 0; // Initialize to center
    this.analyser.connect(this.panner);
    this.panner.connect(this.audioCtx.destination);
  }

  setupBinauralMode() {
    const now = this.audioCtx.currentTime;
    
    // Left ear gets base frequency
    this.leftOsc = this.audioCtx.createOscillator();
    this.leftOsc.type = 'sine';
    this.leftOsc.frequency.setValueAtTime(this.baseFrequency, now);

    // Right ear gets base + beat frequency
    this.rightOsc = this.audioCtx.createOscillator();
    this.rightOsc.type = 'sine';
    this.rightOsc.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, now);

    // Per-ear panners for binaural effect
    const pL = this.audioCtx.createStereoPanner(); 
    pL.pan.setValueAtTime(-1, now);
    const pR = this.audioCtx.createStereoPanner(); 
    pR.pan.setValueAtTime(1, now);

    // Equal-power gains with smooth start
    this.gainNodeL = this.audioCtx.createGain(); 
    this.gainNodeL.gain.setValueAtTime(0, now);
    this.gainNodeL.gain.linearRampToValueAtTime(0.5, now + this.RAMP_TIME);
    
    this.gainNodeR = this.audioCtx.createGain(); 
    this.gainNodeR.gain.setValueAtTime(0, now);
    this.gainNodeR.gain.linearRampToValueAtTime(0.5, now + this.RAMP_TIME);

    // Connect graph
    this.leftOsc.connect(this.gainNodeL).connect(pL).connect(this.mainGain);
    this.rightOsc.connect(this.gainNodeR).connect(pR).connect(this.mainGain);

    this.leftOsc.start(now);
    this.rightOsc.start(now);
  }

  setupIsochronicMode() {
    const now = this.audioCtx.currentTime;
    
    // Single tone modulated by LFO
    this.isoOsc = this.audioCtx.createOscillator();
    this.isoOsc.type = 'sine';
    this.isoOsc.frequency.setValueAtTime(this.baseFrequency, now);

    this.isoGain = this.audioCtx.createGain();
    this.isoGain.gain.setValueAtTime(0, now);
    this.isoGain.gain.linearRampToValueAtTime(0.5, now + this.RAMP_TIME);

    this.isoLFO = this.audioCtx.createOscillator();
    this.isoLFO.type = 'square';
    this.isoLFO.frequency.setValueAtTime(this.beatFrequency, now);

    const lfoGain = this.audioCtx.createGain(); 
    lfoGain.gain.setValueAtTime(0.5, now);
    this.isoLFO.connect(lfoGain).connect(this.isoGain.gain);

    this.isoOsc.connect(this.isoGain).connect(this.mainGain);
    this.isoOsc.start(now); 
    this.isoLFO.start(now);
  }

  setupMonauralMode() {
    const now = this.audioCtx.currentTime;
    
    // Two tones mixed before mono output
    this.leftOsc = this.audioCtx.createOscillator();
    this.leftOsc.type = 'sine';
    this.leftOsc.frequency.setValueAtTime(this.baseFrequency, now);
    
    this.rightOsc = this.audioCtx.createOscillator();
    this.rightOsc.type = 'sine';
    this.rightOsc.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, now);

    this.gainNodeL = this.audioCtx.createGain(); 
    this.gainNodeL.gain.setValueAtTime(0, now);
    this.gainNodeL.gain.linearRampToValueAtTime(0.25, now + this.RAMP_TIME);
    
    this.gainNodeR = this.audioCtx.createGain(); 
    this.gainNodeR.gain.setValueAtTime(0, now);
    this.gainNodeR.gain.linearRampToValueAtTime(0.25, now + this.RAMP_TIME);

    this.leftOsc.connect(this.gainNodeL).connect(this.mainGain);
    this.rightOsc.connect(this.gainNodeR).connect(this.mainGain);

    this.leftOsc.start(now); 
    this.rightOsc.start(now);
  }

  /**
   * value: -1 (full left) → +1 (full right)
   */
  setPan(value) {
    const v = Math.max(-1, Math.min(1, parseFloat(value)));
    if (this.panner && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.panner.pan.cancelScheduledValues(now);
      this.panner.pan.setValueAtTime(this.panner.pan.value, now);
      this.panner.pan.linearRampToValueAtTime(v, now + this.RAMP_TIME);
    }
    this.app.uiManager.syncSliders('pan', v);
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, parseFloat(value) / 100));
    if (this.mainGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      const targetVolume = this.isMuted ? 0 : this.volume;
      this.mainGain.gain.cancelScheduledValues(now);
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
      this.mainGain.gain.linearRampToValueAtTime(targetVolume, now + this.RAMP_TIME);
    }
    this.app.uiManager.updateVolumeDisplay();
  }

  setBeatFrequency(value) {
    this.beatFrequency = Math.max(0.1, Math.min(100, parseFloat(value)));
    this.updateFrequencies();
    this.app.frequencyManager.updateDisplay();
    this.app.uiManager.syncSliders('beat', this.beatFrequency);
  }

  setBaseFrequency(value) {
    this.baseFrequency = Math.max(20, Math.min(2000, parseFloat(value)));
    this.updateFrequencies();
    this.app.frequencyManager.updateDisplay();
  }

  toggleMute() {
    if (!this.mainGain || !this.audioCtx) return;
    
    this.isMuted = !this.isMuted;
    const now = this.audioCtx.currentTime;
    const targetVolume = this.isMuted ? 0 : this.volume;
    
    this.mainGain.gain.cancelScheduledValues(now);
    this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
    this.mainGain.gain.linearRampToValueAtTime(targetVolume, now + this.RAMP_TIME);
  }

  async stop(updateTimer = true) {
    if (!this.isPlaying) return;
    
    this.app.visualizer.stop();
    await this.gracefulDisconnect();
    this.isPlaying = false;
    if (updateTimer) this.app.timer.reset();
  }

  async gracefulDisconnect() {
    if (!this.audioCtx) return;
    
    const now = this.audioCtx.currentTime;
    const fadeTime = this.RAMP_TIME;

    // Fade out main gain first
    if (this.mainGain) {
      this.mainGain.gain.cancelScheduledValues(now);
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
      this.mainGain.gain.linearRampToValueAtTime(0, now + fadeTime);
    }

    // Wait for fade to complete
    await new Promise(resolve => setTimeout(resolve, fadeTime * 1000 + 10));

    // Now safely disconnect and stop oscillators
    this.disconnectAllNodes();
  }

  disconnectAllNodes() {
    // Stop oscillators gracefully
    const now = this.audioCtx ? this.audioCtx.currentTime : 0;
    
    if (this.leftOsc) {
      try { this.leftOsc.stop(now); } catch (e) { /* already stopped */ }
      this.leftOsc.disconnect();
    }
    if (this.rightOsc) {
      try { this.rightOsc.stop(now); } catch (e) { /* already stopped */ }
      this.rightOsc.disconnect();
    }
    if (this.isoOsc) {
      try { this.isoOsc.stop(now); } catch (e) { /* already stopped */ }
      this.isoOsc.disconnect();
    }
    if (this.isoLFO) {
      try { this.isoLFO.stop(now); } catch (e) { /* already stopped */ }
      this.isoLFO.disconnect();
    }

    // Disconnect other nodes
    const nodes = [
      this.gainNodeL, this.gainNodeR, this.isoGain, this.mainGain,
      this.analyser, this.panner, this.mixerNode
    ];
    nodes.forEach(n => {
      if (n && n.disconnect) {
        try { n.disconnect(); } catch (e) { /* already disconnected */ }
      }
    });

    this.app.equalizer?.disconnect();
    this.app.noiseEngine?.stop();
    this.resetNodeReferences();
  }

  resetNodeReferences() {
    this.leftOsc = this.rightOsc = this.isoOsc = this.isoLFO =
    this.gainNodeL = this.gainNodeR = this.isoGain = this.mainGain =
    this.analyser = this.panner = this.mixerNode = null;
  }

  async setMode(mode) {
    if (this.mode === mode) return;
    
    this.mode = mode;
    if (this.isPlaying) {
      // Crossfade to new mode
      await this.stop(false);
      await new Promise(resolve => setTimeout(resolve, 50)); // Brief pause
      await this.start();
    }
  }

  updateFrequencies() {
    if (!this.isPlaying || !this.audioCtx) return;
    
    const now = this.audioCtx.currentTime;
    const rampTime = this.RAMP_TIME;

    switch (this.mode) {
      case 'binaural':
        if (this.leftOsc) {
          this.leftOsc.frequency.cancelScheduledValues(now);
          this.leftOsc.frequency.setValueAtTime(this.leftOsc.frequency.value, now);
          this.leftOsc.frequency.linearRampToValueAtTime(this.baseFrequency, now + rampTime);
        }
        if (this.rightOsc) {
          this.rightOsc.frequency.cancelScheduledValues(now);
          this.rightOsc.frequency.setValueAtTime(this.rightOsc.frequency.value, now);
          this.rightOsc.frequency.linearRampToValueAtTime(this.baseFrequency + this.beatFrequency, now + rampTime);
        }
        break;
      case 'isochronic':
        if (this.isoOsc) {
          this.isoOsc.frequency.cancelScheduledValues(now);
          this.isoOsc.frequency.setValueAtTime(this.isoOsc.frequency.value, now);
          this.isoOsc.frequency.linearRampToValueAtTime(this.baseFrequency, now + rampTime);
        }
        if (this.isoLFO) {
          this.isoLFO.frequency.cancelScheduledValues(now);
          this.isoLFO.frequency.setValueAtTime(this.isoLFO.frequency.value, now);
          this.isoLFO.frequency.linearRampToValueAtTime(this.beatFrequency, now + rampTime);
        }
        break;
      case 'monaural':
        if (this.leftOsc) {
          this.leftOsc.frequency.cancelScheduledValues(now);
          this.leftOsc.frequency.setValueAtTime(this.leftOsc.frequency.value, now);
          this.leftOsc.frequency.linearRampToValueAtTime(this.baseFrequency, now + rampTime);
        }
        if (this.rightOsc) {
          this.rightOsc.frequency.cancelScheduledValues(now);
          this.rightOsc.frequency.setValueAtTime(this.rightOsc.frequency.value, now);
          this.rightOsc.frequency.linearRampToValueAtTime(this.baseFrequency + this.beatFrequency, now + rampTime);
        }
        break;
    }
  }

  // Utility methods
  getAnalyser() { return this.analyser; }
  getAudioContext() { return this.audioCtx; }
  
  // Additional helper for smooth parameter transitions
  smoothParamChange(param, targetValue, rampTime = this.RAMP_TIME) {
    if (!this.audioCtx || !param) return;
    const now = this.audioCtx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(targetValue, now + rampTime);
  }
}

// Expose AudioEngine globally
window.AudioEngine = AudioEngine;