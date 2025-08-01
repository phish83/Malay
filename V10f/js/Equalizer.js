// EQUALIZER.js

class Equalizer {
  constructor(app) {
    this.app = app;
    this.filters = [];
    this.frequencies = [60, 170, 350, 1000, 3500];
    this.gains = [0, 0, 0, 0, 0];
  }

  init() {
    for (let i = 0; i < 5; i++) {
      const numInput = document.getElementById(`eq${i}Input`);
      const slider = document.getElementById(`eq${i}`);
      if (numInput) numInput.value = 0;
      if (slider) slider.value = 0;
    }
  }

  createFilters(audioCtx) {
    this.disconnect();
    this.filters = [];

    for (let i = 0; i < 5; i++) {
      const filter = audioCtx.createBiquadFilter();
      filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
      filter.frequency.value = this.frequencies[i];
      filter.Q.value = 1;
      filter.gain.value = this.gains[i];
      this.filters.push(filter);
    }

    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
  }

  connectToChain(inputNode) {
    const audioCtx = this.app.audioEngine.audioCtx;
    this.createFilters(audioCtx);

    if (this.filters.length > 0) {
      inputNode.connect(this.filters[0]);
      return this.filters[this.filters.length - 1];
    }
    return inputNode;
  }

  updateBand(index, value) {
    const val = parseFloat(value);
    this.gains[index] = val;
    const numInput = document.getElementById(`eq${index}Input`);
    const slider = document.getElementById(`eq${index}`);
    if (numInput) numInput.value = val;
    if (slider) slider.value = val;
    if (this.filters[index]) {
      this.filters[index].gain.value = val;
    }
  }

  resetBand(index) {
    this.updateBand(index, 0);
  }

  disconnect() {
    this.filters.forEach(f => {
      try { f.disconnect(); } catch (e) { /* ignore */ }
    });
    this.filters = [];
  }
}