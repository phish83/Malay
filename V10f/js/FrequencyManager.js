// FREQUENCYMANAGER.js

class FrequencyManager {
  constructor(app) {
    this.app = app;
  }
  
  init() {
    this.updateDisplay();
  }
  
  updateDisplay() {
    const beatFreq = this.app.audioEngine.beatFrequency;
    const baseFreq = this.app.audioEngine.baseFrequency;
    const info = this.getBrainwaveInfo(beatFreq);
    
    const currentBeatEl = document.getElementById("currentBeat");
    const brainwaveStateEl = document.getElementById("brainwaveState");
    const freqInfoEl = document.getElementById("freqInfo");
    
    if (currentBeatEl) currentBeatEl.textContent = `${beatFreq} Hz – ${info.range}`;
    if (brainwaveStateEl) brainwaveStateEl.textContent = info.state;
    
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq;
    if (freqInfoEl) freqInfoEl.textContent = `${leftFreq} Hz / ${rightFreq} Hz`;
  }
  
  getBrainwaveInfo(freq) {
    const f = parseFloat(freq);
    
    if (f >= 0.5 && f <= 4) {
      return { range: 'Delta Range', state: 'Deep sleep, healing, regeneration' };
    } else if (f > 4 && f <= 8) {
      return { range: 'Theta Range', state: 'Deep meditation, creativity, memory' };
    } else if (f > 8 && f <= 14) {
      return { range: 'Alpha Range', state: 'Relaxed awareness, learning, flow' };
    } else if (f > 14 && f <= 30) {
      return { range: 'Beta Range', state: 'Focus, alertness, problem solving' };
    } else if (f > 30) {
      return { range: 'Gamma Range', state: 'Higher cognition, consciousness' };
    } else {
      return { range: 'Custom Range', state: 'Custom brainwave entrainment' };
    }
  }
}