// audiomodeselect.js

function handleAudioModeChange() {
  const mode = document.getElementById('audioModeSelect').value;
  app.audioEngine.setMode(mode);

  // Update label text
  const modeNames = {
    pure: "Pure Tone",
    harmonic: "Harmonic",
    pulsed: "Pulsed"
  };
  document.getElementById('currentMode').textContent = modeNames[mode] || mode;

  // Show/hide controls based on selected mode
  const pulseControl = document.getElementById('pulseRateControl');
  const harmonicControl = document.getElementById('harmonicMixControl');

  if (pulseControl && harmonicControl) {
    pulseControl.style.display = (mode === 'pulsed') ? 'block' : 'none';
    harmonicControl.style.display = (mode === 'harmonic') ? 'block' : 'none';
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  handleAudioModeChange(); // Ensures UI matches initial dropdown state
});