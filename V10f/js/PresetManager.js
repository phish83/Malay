// PRESETMANAGER.js

class PresetManager {
  constructor(app) {
    this.app = app;
    this.presets = {
      // Delta Wave presets (0.5-4 Hz)
      'deep-sleep': { beat: 1, base: 200, name: 'Deep Sleep' },
      'healing': { beat: 2, base: 150, name: 'Healing' },
      'regeneration': { beat: 3, base: 180, name: 'Regeneration' },
      
      // Theta Wave presets (4-8 Hz)
      'meditation': { beat: 6, base: 200, name: 'Deep Meditation' },
      'creativity': { beat: 7, base: 220, name: 'Creativity' },
      'memory': { beat: 5, base: 180, name: 'Memory Enhancement' },
      'rem-sleep': { beat: 4.5, base: 160, name: 'REM Sleep' },
      
      // Alpha Wave presets (8-14 Hz)
      'relaxation': { beat: 10, base: 200, name: 'Relaxation' },
      'learning': { beat: 12, base: 240, name: 'Learning' },
      'visualization': { beat: 8, base: 180, name: 'Visualization' },
      'flow-state': { beat: 9, base: 210, name: 'Flow State' },
      
      // Beta Wave presets (14-30 Hz)
      'focus': { beat: 16, base: 250, name: 'Focus' },
      'alertness': { beat: 20, base: 280, name: 'Alertness' },
      'problem-solving': { beat: 18, base: 260, name: 'Problem Solving' },
      'energy': { beat: 25, base: 300, name: 'Energy Boost' },
      
      // Gamma Wave presets (30+ Hz)
      'cognition': { beat: 40, base: 200, name: 'Enhanced Cognition' },
      'awareness': { beat: 60, base: 180, name: 'Higher Awareness' },
      'binding': { beat: 35, base: 220, name: 'Neural Binding' }
    };
  }
  
  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (preset) {
      this.app.audioEngine.setBeatFrequency(preset.beat);
      this.app.audioEngine.setBaseFrequency(preset.base);
      
      // Keep the preset selected in the dropdown
      const selector = document.getElementById('presetSelect');
      if (selector) selector.value = presetName;

    // Update the human-readable state label
    const stateLabel = document.getElementById('brainwaveState');
    if (stateLabel) stateLabel.textContent = preset.name;
    }
  }
}