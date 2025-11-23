// SamplePlayer.js
// Manages ambient sample playback with individual volume control and interval modes

export class SamplePlayer {
  constructor(audioEngine) {
    this.engine = audioEngine;
    this.samples = new Map();
    this.intervalTimers = new Map();
    this.audioBuffers = new Map();
    
    // Independent audio context for samples
    this.audioCtx = null;
    this.masterGain = null;
    
    // Sample definitions
    this.sampleDefs = [
      { id: 'rain', name: 'Rain', emoji: '🌧️', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/rain.mp3', defaultMode: 'continuous', defaultVol: 70 },
      { id: 'ocean', name: 'Ocean', emoji: '🌊', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/ocean.mp3', defaultMode: 'continuous', defaultVol: 50 },
      { id: 'fire', name: 'Fire', emoji: '🔥', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/fire.mp3', defaultMode: 'continuous', defaultVol: 60 },
      { id: 'chimes', name: 'Chimes', emoji: '🎐', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/chimes.mp3', defaultMode: 'interval', defaultVol: 45 },
      { id: 'forest', name: 'Forest', emoji: '🌲', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/forest.mp3', defaultMode: 'continuous', defaultVol: 40 },
      { id: 'thunder', name: 'Thunder', emoji: '⛈️', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/thunder.mp3', defaultMode: 'interval', defaultVol: 55 },
      { id: 'birds', name: 'Birds', emoji: '🦜', file: 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/samples/birds.mp3', defaultMode: 'interval', defaultVol: 35 }
    ];
  }

  async ensureAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);
      console.log('✓ Sample player audio context initialized');
    }
    
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  initSample(sampleDef) {
    const sample = {
      id: sampleDef.id,
      name: sampleDef.name,
      emoji: sampleDef.emoji,
      file: sampleDef.file,
      isPlaying: false,
      mode: sampleDef.defaultMode,
      volume: sampleDef.defaultVol / 100,
      source: null,
      gainNode: null,
      buffer: null
    };
    this.samples.set(sampleDef.id, sample);
  }

  async loadSamples() {
    await this.ensureAudioContext();
    
    this.sampleDefs.forEach(def => this.initSample(def));
    
    for (const def of this.sampleDefs) {
      try {
        await this.loadAudioFile(def.id, def.file);
      } catch (error) {
        console.warn(`Could not load sample: ${def.file}`, error);
        this.createPlaceholderBuffer(def.id);
      }
    }
  }

  async loadAudioFile(sampleId, filepath) {
    if (!this.audioCtx) return;
    
    try {
      const response = await fetch(filepath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(sampleId, audioBuffer);
      console.log(`✓ Loaded: ${filepath}`);
    } catch (error) {
      throw new Error(`Failed to load ${filepath}: ${error.message}`);
    }
  }

  createPlaceholderBuffer(sampleId) {
    if (!this.audioCtx) return;
    const buffer = this.audioCtx.createBuffer(2, this.audioCtx.sampleRate * 2, this.audioCtx.sampleRate);
    this.audioBuffers.set(sampleId, buffer);
  }

  async play(sampleId) {
    const sample = this.samples.get(sampleId);
    if (!sample || sample.isPlaying) return;

    await this.ensureAudioContext();
    sample.isPlaying = true;

    if (sample.mode === 'continuous') {
      this.playContinuous(sampleId);
    } else {
      this.playInterval(sampleId);
    }
  }

  playContinuous(sampleId) {
    const sample = this.samples.get(sampleId);
    
    if (!this.audioCtx || !this.masterGain) {
      console.error('Audio context not initialized');
      sample.isPlaying = false;
      return;
    }
    
    this.stopSource(sampleId);

    sample.source = this.audioCtx.createBufferSource();
    sample.gainNode = this.audioCtx.createGain();
    
    const buffer = this.audioBuffers.get(sampleId);
    if (!buffer) {
      console.error(`No audio buffer for ${sampleId}`);
      sample.isPlaying = false;
      return;
    }
    
    sample.source.buffer = buffer;
    sample.source.loop = true;
    sample.gainNode.gain.setValueAtTime(sample.volume, this.audioCtx.currentTime);

    sample.source.connect(sample.gainNode);
    sample.gainNode.connect(this.masterGain);

    try {
      sample.source.start();
      console.log(`▶ Playing: ${sample.name}`);
    } catch (error) {
      console.error(`Failed to start ${sample.name}:`, error);
      sample.isPlaying = false;
    }
  }

  playInterval(sampleId) {
    const sample = this.samples.get(sampleId);
    
    const playOnce = () => {
      if (!sample.isPlaying) return;
      
      if (!this.audioCtx || !this.masterGain) {
        console.error('Audio context not initialized');
        sample.isPlaying = false;
        return;
      }
      
      this.stopSource(sampleId);

      sample.source = this.audioCtx.createBufferSource();
      sample.gainNode = this.audioCtx.createGain();
      
      const buffer = this.audioBuffers.get(sampleId);
      if (!buffer) {
        console.error(`No audio buffer for ${sampleId}`);
        return;
      }
      
      sample.source.buffer = buffer;
      sample.source.loop = false;
      sample.gainNode.gain.setValueAtTime(sample.volume, this.audioCtx.currentTime);

      sample.source.connect(sample.gainNode);
      sample.gainNode.connect(this.masterGain);

      try {
        sample.source.start();
        console.log(`▶ Playing: ${sample.name} (interval mode)`);
      } catch (error) {
        console.error(`Failed to start ${sample.name}:`, error);
      }

      const delay = 30000 + Math.random() * 30000;
      const timer = setTimeout(playOnce, delay);
      this.intervalTimers.set(sampleId, timer);
    };

    playOnce();
  }

  stop(sampleId) {
    const sample = this.samples.get(sampleId);
    if (!sample) return;

    sample.isPlaying = false;
    this.stopSource(sampleId);
    
    const timer = this.intervalTimers.get(sampleId);
    if (timer) {
      clearTimeout(timer);
      this.intervalTimers.delete(sampleId);
    }
  }

  stopSource(sampleId) {
    const sample = this.samples.get(sampleId);
    if (!sample) return;

    if (sample.source) {
      try { sample.source.stop(); } catch (e) {}
      try { sample.source.disconnect(); } catch (e) {}
      sample.source = null;
    }

    if (sample.gainNode) {
      try { sample.gainNode.disconnect(); } catch (e) {}
      sample.gainNode = null;
    }
  }

  toggle(sampleId) {
    const sample = this.samples.get(sampleId);
    if (!sample) return;

    if (sample.isPlaying) {
      this.stop(sampleId);
    } else {
      this.play(sampleId);
    }
  }

  toggleMode(sampleId) {
    const sample = this.samples.get(sampleId);
    if (!sample) return;

    const wasPlaying = sample.isPlaying;
    
    if (wasPlaying) {
      this.stop(sampleId);
    }

    sample.mode = sample.mode === 'continuous' ? 'interval' : 'continuous';

    if (wasPlaying) {
      this.play(sampleId);
    }

    return sample.mode;
  }

  setVolume(sampleId, volume) {
    const sample = this.samples.get(sampleId);
    if (!sample) return;

    sample.volume = volume / 100;

    if (sample.gainNode && this.audioCtx) {
      sample.gainNode.gain.setTargetAtTime(
        sample.volume,
        this.audioCtx.currentTime,
        0.05
      );
    }
  }

  getSample(sampleId) {
    return this.samples.get(sampleId);
  }

  getSampleDefs() {
    return this.sampleDefs;
  }

  stopAll() {
    this.samples.forEach((sample, id) => {
      if (sample.isPlaying) {
        this.stop(id);
      }
    });
  }

}
