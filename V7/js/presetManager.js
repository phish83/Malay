// =============================================================================
// PRESET MANAGER MODULE
// =============================================================================
class PresetManager {
  constructor(app) {
    this.app = app;
    this.presets = {
      // Core Solfeggio frequencies
      'foundation': { freq: 174, name: 'Foundation' },
      'healing': { freq: 285, name: 'Healing' },
      'liberation': { freq: 396, name: 'Liberation' },
      'change': { freq: 417, name: 'Change' },
      'love': { freq: 528, name: 'Love' },
      'connection': { freq: 639, name: 'Connection' },
      'intuition': { freq: 741, name: 'Intuition' },
      'spiritual': { freq: 852, name: 'Spiritual' },
      'divine': { freq: 963, name: 'Divine' },
      
      // Extended frequencies
      'ut-queant': { freq: 396, name: 'UT - Ut queant laxis' },
      're-sonare': { freq: 417, name: 'RE - Resonare fibris' },
      'mi-ra': { freq: 528, name: 'MI - Mira gestorum' },
      'fa-muli': { freq: 639, name: 'FA - Famuli tuorum' },
      'sol-ve': { freq: 741, name: 'SOL - Solve polluti' },
      'la-bii': { freq: 852, name: 'LA - Labii reatum' },
      'schumann': { freq: 7.83, name: 'Schumann Resonance' },
      'om': { freq: 136.1, name: 'OM Frequency' }
    };
  }
  
  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (preset) {
      this.app.frequencyManager.setPrimary(preset.freq);
    }
  }
  
  applyAdvancedPreset(selectElement) {
    const value = selectElement.value;
    if (value) {
      this.applyPreset(value);
      selectElement.value = "";
    }
  }
}