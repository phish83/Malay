// INIT.js

let app;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🧠 Initializing Binaural Beat Generator...');
  app = new BinauralApp();
  console.log('✅ Application initialized successfully');
});

// Handle page visibility changes to pause/resume audio
document.addEventListener('visibilitychange', () => {
  if (app && app.audioEngine) {
    if (document.hidden && app.audioEngine.isPlaying) {
      // Optionally pause when tab becomes hidden
      // app.audioEngine.stop();
    }
  }
});