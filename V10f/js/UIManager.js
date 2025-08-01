// UIMANAGER.js

class UIManager {
  constructor(app) {
    this.app = app;
  }
  
  init() {
    this.updateVolumeDisplay();
    this.updateNoiseDisplay();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Add any additional event listeners here if needed
    window.addEventListener('resize', () => {
      if (this.app.visualizer) {
        this.app.visualizer.resizeCanvas();
      }
    });
  }
  
  updateVolumeDisplay() {
    // Volume display is handled by the HTML sliders directly
  }
  
  updateNoiseDisplay() {
    const toggleEl = document.getElementById('noiseToggle');
    if (toggleEl) {
      toggleEl.textContent = this.app.noiseEngine.enabled ? 'Disable Background' : 'Enable Background';
    }
  }
  
  syncSliders(type, value) {
    if (type === 'beat') {
      const slider1 = document.getElementById('beatFreq');
      const input1 = document.getElementById('beatFreqInput');
      const slider2 = document.getElementById('customBeatFreq');
      const input2 = document.getElementById('customBeatFreqInput');
      
      if (slider1) slider1.value = value;
      if (input1) input1.value = value;
      if (slider2) slider2.value = value;
      if (input2) input2.value = value;
    } else if (type === 'pan') {
      const slider = document.getElementById('panControl');
      const input = document.getElementById('panInput');
      if (slider) slider.value = value;
      if (input) input.value = value;
    }
  }
}