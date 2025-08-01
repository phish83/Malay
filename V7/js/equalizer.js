// =============================================================================
// EQUALIZER MODULE
// =============================================================================
class Equalizer {
  constructor(app) {
    this.app = app;
    this.filters = [];
    this.frequencies = [60, 170, 350, 1000, 3500];
    this.gains = [0, 0, 0, 0, 0];
  }

  // Initialize the number-inputs
  init() {
    for (let i = 0; i < 5; i++) {
      const num = document.getElementById(`eq${i}Input`);
      if (num) num.value = 0;
    }
  }

  // Build a fresh set of BiquadFilters
  createFilters(audioCtx) {
    this.disconnect();
    this.filters = [];

    for (let i = 0; i < 5; i++) {
      const filter = audioCtx.createBiquadFilter();
      filter.type = i === 0
        ? 'lowshelf'
        : i === 4
          ? 'highshelf'
          : 'peaking';
      filter.frequency.value = this.frequencies[i];
      filter.Q.value = 1;
      filter.gain.value = this.gains[i];
      this.filters.push(filter);
    }

    // Chain them together
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
  }

  // Connect filters into the audio chain
  connectToChain(inputNode) {
    const audioCtx = this.app.audioEngine.audioCtx;
    this.createFilters(audioCtx);

    if (this.filters.length > 0) {
      inputNode.connect(this.filters[0]);
      return this.filters[this.filters.length - 1];
    }
    return inputNode;
  }

  // Update a single band’s gain
  updateBand(index, value) {
    const val = parseFloat(value);
    this.gains[index] = val;
    // Sync number-input
    const num = document.getElementById(`eq${index}Input`);
    if (num) num.value = val;
    // Apply to filter
    if (this.filters[index]) {
      this.filters[index].gain.value = val;
    }
    // If already playing, re-run graph
    if (this.app.audioEngine.isPlaying) {
      this.app.audioEngine.stop(false);
      setTimeout(() => this.app.audioEngine.start(), 50);
    }
  }

  // Reset a band to zero
  resetBand(index) {
    this.updateBand(index, 0);
    const slider = document.getElementById(`eq${index}`);
    if (slider) slider.value = 0;
  }

  // Disconnect and clear filters
  disconnect() {
    this.filters.forEach(f => {
      try { f.disconnect(); } catch (e) {}
    });
    this.filters = [];
  }

  // Check if any band is non-zero
  isActive() {
    return this.gains.some(g => g !== 0);
  }
}

// Expose globally
window.Equalizer = Equalizer;