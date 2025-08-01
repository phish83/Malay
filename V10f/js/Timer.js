// TIMER.js

class Timer {
  constructor(app) {
    this.app = app;
    this.intervalId = null;
    this.isRunning = false;
  }
  
  start() {
    const timerInput = document.getElementById('timerMinutes');
    const mins = parseInt(timerInput ? timerInput.value : 20) || 20;
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
  
  updateDisplay(remaining) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const display = `${mins}:${secs.toString().padStart(2, '0')}`;
    const displayEl = document.getElementById('timerDisplay');
    if (displayEl) displayEl.textContent = display;
  }
  
  complete() {
    this.reset();
    this.app.audioEngine.stop();
    alert('🎉 Session Complete! Great work on your brainwave training.');
  }
  
  reset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    const displayEl = document.getElementById('timerDisplay');
    if (displayEl) displayEl.textContent = '';
  }
}