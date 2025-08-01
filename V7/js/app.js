// =============================================================================
// CORE APPLICATION CLASS
// =============================================================================
class SolfeggioApp {
  constructor() {
    this.audioEngine = new AudioEngine(this);
    this.noiseEngine = new NoiseEngine(this);
    this.visualizer = new Visualizer(this);
    this.equalizer = new Equalizer(this);
    this.frequencyManager = new FrequencyManager(this);
    this.presetManager = new PresetManager(this);
    this.timer = new Timer(this);
    this.themeManager = new ThemeManager(this);
    this.uiManager = new UIManager(this);
    
    this.init();
  }
  
  init() {
    this.themeManager.init();
    this.visualizer.init();
    this.frequencyManager.init();
    this.uiManager.init();
    this.equalizer.init();
    this.noiseEngine.init();
  }
  
  emit(event, data) {
    console.log(`Event: ${event}`, data);
  }
}