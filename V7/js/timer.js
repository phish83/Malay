// =============================================================================
// TIMER MODULE
// =============================================================================
class Timer {
  constructor(app) {
    this.app = app;
    this.intervalId = null;
    this.isRunning = false;
  }
  
  start() {
    const mins = parseInt(document.getElementById('timerMinutes').value) || 20;
    let remaining = mins * 60;
    
    if (!this.app.audioEngine.isPlaying) {
      this.app.audioEngine.start();
    }
    
    this.updateDisplay(remaining);
    this.reset();
    
    this.intervalId = setInterval(() => {
      remaining--;
      this.updateDisplay(remaining);
      
      if (remaining <= 0) {
        this.complete();
      }
    }, 1000);
    
    this.isRunning = true;
  }
  
  complete() {
    this.reset();
    this.app.audioEngine.stop();
    document.getElementById('timerDisplay').textContent = "Session Complete! 🧘";
  }
  
  reset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    document.getElementById('timerDisplay').textContent = "";
  }
  
  updateDisplay(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${m}:${s}`;
  }
}