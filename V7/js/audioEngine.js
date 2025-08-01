// =============================================================================
// AUDIO ENGINE MODULE
// =============================================================================
class AudioEngine {
  constructor(app) {
    this.app = app;
    this.audioCtx = null;
    this.isPlaying = false;
    this.mode = 'pure'; // pure, harmonic, pulsed
    this.isStereo = false;
    this.volume = 0.3;
    this.isMuted = false;
    this.lastVolume = 0.3;
    this.pulseRate = 2;
    this.harmonicMix = 0.3;
    
    // Audio nodes
    this.primaryOsc = null;
    this.harmonicOscs = [];
    this.pulseOsc = null;
    this.gainNode = null;
    this.pulseGain = null;
    this.analyser = null;
    this.pannerL = null;
    this.pannerR = null;
    this.mixerNode = null;
  }
  
  async start() {
   try {
     console.log('🔊 AudioEngine.start() called, audioCtx before:', this.audioCtx);
     // Create AudioContext if needed
     if (!this.audioCtx) {
       this.audioCtx = new AudioContext();
     }
     // Resume if suspended
     if (this.audioCtx.state === 'suspended') {
       console.log('🔄 Resuming AudioContext from state:', this.audioCtx.state);
       await this.audioCtx.resume();
       console.log('▶️ AudioContext state after resume:', this.audioCtx.state);
     }  // <-- Make sure this brace is here to close the 'if 
     // Tear down any existing graph
     this.stop(false);
     // Build new graph at the selected frequency
     const primaryFreq = this.app.frequencyManager.getPrimary();
     await this.setupAudioGraph(primaryFreq);
     this.isPlaying = true;      // <-- Fixed typo: set to true
     // Start the visualizer loop
     this.app.visualizer.start();
   } catch (error) {
     console.error('Error starting audio:', error);
     alert('Error starting audio. Please check your browser audio permissions.');
   }
 }
  
  async setupAudioGraph(primaryFreq) {
    this.gainNode = this.audioCtx.createGain();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    
    this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    
    switch (this.mode) {
      case 'pure':
        this.setupPureMode(primaryFreq);
        break;
      case 'harmonic':
        this.setupHarmonicMode(primaryFreq);
        break;
      case 'pulsed':
        this.setupPulsedMode(primaryFreq);
        break;
    }
    
    // Always connect through EQ chain
    let outputNode = this.app.equalizer.connectToChain(this.gainNode);
    
    // Create mixer for combining main audio and noise
    this.mixerNode = this.audioCtx.createGain();
    this.mixerNode.gain.value = 1.0;
    
    // Connect main audio to mixer
    outputNode.connect(this.mixerNode);
    
    // Start and connect noise if enabled
    if (this.app.noiseEngine.isEnabled()) {
      await this.app.noiseEngine.start();
      this.app.noiseEngine.connectToMixer(this.mixerNode);
    }
    
    // Connect mixer to analyser and destination
    this.mixerNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }
  
  setupPureMode(freq) {
    this.primaryOsc = this.audioCtx.createOscillator();
    this.primaryOsc.type = "sine";
    this.primaryOsc.frequency.value = freq;
    
    if (this.isStereo) {
      this.setupStereoOutput(this.primaryOsc);
    } else {
      this.primaryOsc.connect(this.gainNode);
    }
    
    this.primaryOsc.start();
  }
  
  setupHarmonicMode(freq) {
    // Primary frequency
    this.primaryOsc = this.audioCtx.createOscillator();
    this.primaryOsc.type = "sine";
    this.primaryOsc.frequency.value = freq;
    
    const primaryGain = this.audioCtx.createGain();
    primaryGain.gain.value = 1 - this.harmonicMix;
    this.primaryOsc.connect(primaryGain);
    
    // Harmonics (2nd, 3rd, 5th)
    const harmonics = [2, 3, 5];
    const harmonicGain = this.audioCtx.createGain();
    harmonicGain.gain.value = this.harmonicMix / harmonics.length;
    
    harmonics.forEach(ratio => {
      const harmOsc = this.audioCtx.createOscillator();
      harmOsc.type = "sine";
      harmOsc.frequency.value = freq * ratio;
      harmOsc.connect(harmonicGain);
      harmOsc.start();
      this.harmonicOscs.push(harmOsc);
    });
    
    if (this.isStereo) {
      this.setupStereoOutput(primaryGain, harmonicGain);
    } else {
      primaryGain.connect(this.gainNode);
      harmonicGain.connect(this.gainNode);
    }
    
    this.primaryOsc.start();
  }
  
  setupPulsedMode(freq) {
    this.primaryOsc = this.audioCtx.createOscillator();
    this.primaryOsc.type = "sine";
    this.primaryOsc.frequency.value = freq;
    
    this.pulseOsc = this.audioCtx.createOscillator();
    this.pulseGain = this.audioCtx.createGain();
    this.pulseGain.gain.value = 0.5;
    
    this.pulseOsc.type = "sine";
    this.pulseOsc.frequency.value = this.pulseRate;
    
    // Create tremolo effect
    const tremoloGain = this.audioCtx.createGain();
    tremoloGain.gain.value = 0.3;
    this.pulseOsc.connect(tremoloGain);
    tremoloGain.connect(this.pulseGain.gain);
    
    this.primaryOsc.connect(this.pulseGain);
    
    if (this.isStereo) {
      this.setupStereoOutput(this.pulseGain);
    } else {
      this.pulseGain.connect(this.gainNode);
    }
    
    this.primaryOsc.start();
    this.pulseOsc.start();
  }
  
  setupStereoOutput(...sources) {
    this.pannerL = this.audioCtx.createStereoPanner();
    this.pannerR = this.audioCtx.createStereoPanner();
    this.pannerL.pan.value = -0.7;
    this.pannerR.pan.value = 0.7;
    
    sources.forEach((source, index) => {
      if (index % 2 === 0) {
        source.connect(this.pannerL).connect(this.gainNode);
      } else {
        source.connect(this.pannerR).connect(this.gainNode);
      }
    });
  }
  
  stop(updateUI = true) {
    this.disconnectAllNodes();
    this.isPlaying = false;
    
    if (updateUI) {
      this.app.timer.reset();
    }
  }
  
  disconnectAllNodes() {
    const nodes = [this.primaryOsc, this.pulseOsc, this.pulseGain, 
                   this.gainNode, this.analyser, this.pannerL, this.pannerR, 
                   this.mixerNode, ...this.harmonicOscs];
    
    nodes.forEach(node => {
      if (node) {
        try { node.stop && node.stop(); } catch (e) {}
        try { node.disconnect(); } catch (e) {}
      }
    });
    
    this.app.equalizer.disconnect();
    this.app.noiseEngine.stop();
    this.resetNodeReferences();
  }
  
  resetNodeReferences() {
    this.primaryOsc = this.pulseOsc = this.pulseGain = null;
    this.gainNode = this.analyser = this.pannerL = this.pannerR = null;
    this.mixerNode = null;
    this.harmonicOscs = [];
  }
  
  setMode(mode) {
    this.mode = mode;
    if (this.isPlaying) {
    this.stop(false);
    this.start();
    }
 }

  
  setVolume(value) {
    this.volume = parseFloat(value) / 100;
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
      if (!this.isMuted) this.lastVolume = this.volume;
    }
    this.app.uiManager.updateVolumeDisplay();
  }
  
  toggleMute() {
    if (!this.gainNode) return;
    
    if (!this.isMuted) {
      this.lastVolume = this.gainNode.gain.value;
      this.gainNode.gain.value = 0;
      this.isMuted = true;
    } else {
      this.gainNode.gain.value = this.lastVolume || 0.3;
      this.isMuted = false;
    }
    
    this.app.uiManager.updateVolumeDisplay();
  }
  
  toggleStereo() {
    this.isStereo = !this.isStereo;
    document.getElementById('stereoMode').textContent = this.isStereo ? 'Stereo' : 'Mono';
    
    if (this.isPlaying) {
      this.stop(false);
      this.start();
    }
  }
  
   setPulseRate(value) {
    this.pulseRate = parseFloat(value);
    // Sync manual number‐input and slider
    const num = document.getElementById('pulseRateInput');
    if (num) num.value = value;
    const slider = document.getElementById('pulseRate');
    if (slider) slider.value = value;
    // If pulsed oscillator already exists, update its frequency
    if (this.pulseOsc) {
      this.pulseOsc.frequency.value = this.pulseRate;
    }
  }
  
  setHarmonicMix(value) {
    this.harmonicMix = parseFloat(value) / 100;
    // Sync manual number‐input and slider
    const num = document.getElementById('harmonicMixInput');
    if (num) num.value = value;
    const slider = document.getElementById('harmonicMix');
    if (slider) slider.value = value;
    // If already playing in Harmonic mode, rebuild the graph with new mix
    if (this.isPlaying && this.mode === 'harmonic') {
      this.stop(false);
      this.start();
    }
  }
  
  getAnalyser() {
    return this.analyser;
  }
  
  getAudioContext() {
    return this.audioCtx;
  }
}