// samplePlayerUI.js
// UI initialization and tab switching for sample player

export function initSamplePlayerUI(samplePlayer) {
  const container = document.getElementById('samplePlayerContainer');
  if (!container) return;

  const sampleDefs = samplePlayer.getSampleDefs();

  // Create UI for each sample
  sampleDefs.forEach(def => {
    const row = createSampleRow(def, samplePlayer);
    container.appendChild(row);
  });
}

function createSampleRow(sampleDef, samplePlayer) {
  const row = document.createElement('div');
  row.className = 'sample-row';
  row.setAttribute('data-sample-id', sampleDef.id);

  // Sample name with emoji
  const nameSpan = document.createElement('span');
  nameSpan.className = 'sample-name';
  nameSpan.textContent = `${sampleDef.emoji} ${sampleDef.name}`;
  nameSpan.setAttribute('data-tip', `${sampleDef.name} ambient sound`);

  // Play/pause button
  const playBtn = document.createElement('button');
  playBtn.className = 'btn sample-play-btn';
  playBtn.textContent = '▶';
  playBtn.setAttribute('data-tip', `Play/pause ${sampleDef.name}`);
  playBtn.addEventListener('click', () => {
    const isNowPlaying = samplePlayer.toggle(sampleDef.id);
    
    // Update button state
    playBtn.classList.toggle('active', isNowPlaying);
    playBtn.textContent = isNowPlaying ? '⏸' : '▶';
    
    // Update tooltip
    playBtn.setAttribute('data-tip', 
      isNowPlaying ? `Pause ${sampleDef.name}` : `Play ${sampleDef.name}`
    );
  });

  // Interval/continuous toggle button 
  const intervalBtn = document.createElement('button');
  intervalBtn.className = 'btn sample-interval-btn';
  intervalBtn.textContent = sampleDef.defaultMode === 'interval' ? '⚡' : '∞';
  intervalBtn.classList.toggle('active', sampleDef.defaultMode === 'continuous');
  intervalBtn.setAttribute('data-tip', 
    sampleDef.defaultMode === 'interval' 
      ? 'Interval mode (plays randomly)' 
      : 'Continuous mode (loops)'
  );
  
  intervalBtn.addEventListener('click', () => {
    const newMode = samplePlayer.toggleMode(sampleDef.id);
    intervalBtn.textContent = newMode === 'interval' ? '⚡' : '∞';
    intervalBtn.classList.toggle('active', newMode === 'continuous');
    intervalBtn.setAttribute('data-tip', 
      newMode === 'interval' 
        ? 'Interval mode (plays randomly)' 
        : 'Continuous mode (loops)'
    );
  });

  // Volume icon
  const volIcon = document.createElement('span');
  volIcon.className = 'volume-icon';
  volIcon.textContent = '🔊';

  // Volume slider
  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.className = 'sample-slider';
  volSlider.min = '0';
  volSlider.max = '100';
  volSlider.value = sampleDef.defaultVol;
  volSlider.setAttribute('data-tip', `${sampleDef.name} volume`);
  volSlider.setAttribute('data-default', sampleDef.defaultVol); // Store default
  
  volSlider.addEventListener('input', (e) => {
    const vol = parseInt(e.target.value);
    samplePlayer.setVolume(sampleDef.id, vol);
    volInput.value = vol;
  });

  // Double-click to reset slider
  volSlider.addEventListener('dblclick', () => {
    const defaultVol = parseInt(volSlider.getAttribute('data-default'));
    volSlider.value = defaultVol;
    volInput.value = defaultVol;
    samplePlayer.setVolume(sampleDef.id, defaultVol);
  });

  // Volume input (number)
  const volInput = document.createElement('input');
  volInput.type = 'number';
  volInput.className = 'sample-vol-input';
  volInput.min = '0';
  volInput.max = '100';
  volInput.value = sampleDef.defaultVol;
  volInput.setAttribute('data-tip', `${sampleDef.name} volume %`);
  volInput.setAttribute('data-default', sampleDef.defaultVol); // Store default
  
  volInput.addEventListener('input', (e) => {
    let vol = parseInt(e.target.value) || 0;
    vol = Math.max(0, Math.min(100, vol));
    samplePlayer.setVolume(sampleDef.id, vol);
    volSlider.value = vol;
    volInput.value = vol;
  });

  // Double-click to reset input
  volInput.addEventListener('dblclick', () => {
    const defaultVol = parseInt(volInput.getAttribute('data-default'));
    volSlider.value = defaultVol;
    volInput.value = defaultVol;
    samplePlayer.setVolume(sampleDef.id, defaultVol);
  });

  // Assemble the row
  row.appendChild(nameSpan);
  row.appendChild(playBtn);
  row.appendChild(intervalBtn);
  row.appendChild(volIcon);
  row.appendChild(volSlider);
  row.appendChild(volInput);

  return row;
}

export function initSampleTabs() {
  const filtersTab = document.getElementById('filtersTab');
  const samplesTab = document.getElementById('samplesTab');
  const filtersContent = document.getElementById('filtersContent');
  const samplesContent = document.getElementById('samplesContent');

  if (!filtersTab || !samplesTab || !filtersContent || !samplesContent) return;

  filtersTab.addEventListener('click', () => {
    filtersTab.classList.add('active');
    samplesTab.classList.remove('active');
    filtersContent.style.display = 'block';
    samplesContent.style.display = 'none';
  });

  samplesTab.addEventListener('click', () => {
    samplesTab.classList.add('active');
    filtersTab.classList.remove('active');
    samplesContent.style.display = 'block';
    filtersContent.style.display = 'none';
  });

  // Initialize with filters tab active
  filtersContent.style.display = 'block';
  samplesContent.style.display = 'none';
}