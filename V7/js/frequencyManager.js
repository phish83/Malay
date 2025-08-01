// =============================================================================
// FREQUENCY MANAGER MODULE
// =============================================================================
class FrequencyManager {
  constructor(app) {
    this.app = app;
    this.primaryFreq = 528;
    this.tuningFreq = 440;
  }
  
  init() {
    this.updateDisplay();
  }
  
  setPrimary(value) {
    this.primaryFreq = parseFloat(value);
    this.syncInputs('primary', value);
    this.updateDisplay();
    this.restartIfPlaying();
  }
  
  setTuning(value) {
    this.tuningFreq = parseFloat(value);
    this.syncInputs('tuning', value);
    this.updateDisplay();
    this.restartIfPlaying();
  }
  
  syncInputs(type, value) {
    if (type === 'primary') {
      document.getElementById("primaryFreq").value = value;
      document.getElementById("primaryFreqInput").value = value;
    } else {
      document.getElementById("tuningFreq").value = value;
      document.getElementById("tuningFreqInput").value = value;
    }
  }
  
  updateDisplay() {
    const info = this.getFrequencyInfo(this.primaryFreq);
    document.getElementById("currentFrequency").textContent = `${this.primaryFreq} Hz - ${info.name}`;
    document.getElementById("chakraInfo").textContent = info.chakra;
    document.getElementById("musicalNote").textContent = this.getMusicalNote(this.primaryFreq);
  }
  
  getFrequencyInfo(freq) {
    const f = parseFloat(freq);
    
    // Solfeggio frequencies
    if (Math.abs(f - 174) < 5) return { name: 'Foundation', chakra: 'Root - Grounding and security' };
    if (Math.abs(f - 285) < 5) return { name: 'Healing', chakra: 'Sacral - Tissue healing and regeneration' };
    if (Math.abs(f - 396) < 5) return { name: 'Liberation', chakra: 'Root - Release fear and guilt' };
    if (Math.abs(f - 417) < 5) return { name: 'Change', chakra: 'Sacral - Facilitate positive change' };
    if (Math.abs(f - 528) < 5) return { name: 'Love Frequency', chakra: 'Heart - DNA repair and transformation' };
    if (Math.abs(f - 639) < 5) return { name: 'Connection', chakra: 'Heart - Harmonious relationships' };
    if (Math.abs(f - 741) < 5) return { name: 'Intuition', chakra: 'Throat - Awakening intuition' };
    if (Math.abs(f - 852) < 5) return { name: 'Spiritual Order', chakra: 'Third Eye - Spiritual awareness' };
    if (Math.abs(f - 963) < 5) return { name: 'Divine Consciousness', chakra: 'Crown - Pineal gland activation' };
    
    // Other healing frequencies
    if (Math.abs(f - 7.83) < 0.5) return { name: 'Schumann Resonance', chakra: 'All - Earth\'s frequency' };
    if (Math.abs(f - 136.1) < 2) return { name: 'OM Frequency', chakra: 'All - Universal vibration' };
    if (Math.abs(f - 432) < 5) return { name: 'Natural Tuning', chakra: 'Heart - Natural harmonic resonance' };
    
    return { name: 'Custom Frequency', chakra: 'Personal resonance frequency' };
  }
  
  getMusicalNote(freq) {
    const A4 = this.tuningFreq;
    const C0 = A4 * Math.pow(2, -4.75);
    
    if (freq > 0) {
      const h = Math.round(12 * Math.log2(freq / C0));
      const octave = Math.floor(h / 12);
      const n = h % 12;
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return `${notes[n]}${octave} (at ${this.tuningFreq}Hz tuning)`;
    }
    return 'Unknown';
  }
  
  restartIfPlaying() {
    if (this.app.audioEngine.isPlaying) {
      this.app.audioEngine.stop(false);
      this.app.audioEngine.start();
    }
  }
  
  getPrimary() { return this.primaryFreq; }
  getTuning() { return this.tuningFreq; }
}