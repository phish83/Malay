// =============================================================================
// UI MANAGER MODULE
// =============================================================================
class UIManager {
  constructor(app) {
    this.app = app;
  }
  
  init() {
    this.updateVolumeDisplay();
    this.updateNoiseDisplay();
  }
  
  updateVolumeDisplay() {
    const engine = this.app.audioEngine;
    const vol = Math.round(engine.volume * 100);
    // Update the number‐input next to your slider
    const num = document.getElementById("volumeInput");
    if (num) num.value = engine.isMuted ? 0 : vol;
    // Keep the slider itself in sync
    const slider = document.getElementById("volume");
    if (slider && !engine.isMuted) slider.value = vol;
  }
  
  updateNoiseDisplay() {
    const noise = this.app.noiseEngine;
    // Sync number-inputs with the engine’s state
    const lvl = document.getElementById("noiseLevelInput");
    if (lvl) lvl.value = Math.round(noise.level * 100);
    const hp = document.getElementById("noiseHighPassInput");
    if (hp) hp.value = noise.highPassFreq;
    const lp = document.getElementById("noiseLowPassInput");
    if (lp) lp.value = noise.lowPassFreq;
    // Update toggle label
    const tog = document.getElementById("noiseToggle");
    if (tog) tog.textContent = noise.enabled ? "Disable Noise" : "Enable Noise";
  }
}

// Expose globally
window.UIManager = UIManager;
