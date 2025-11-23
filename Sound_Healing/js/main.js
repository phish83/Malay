import { clamp, updateLED, byId } from './utils.js';
import { AudioEngine } from './AudioEngine.js';
import { Visualizer } from './Visualizer.js';
import { initKnobs, syncNeedleForInput } from './initKnobs.js';
import { Timer } from './Timer.js';
import { initTooltips } from './tooltip.js';
import { SamplePlayer } from './SamplePlayer.js';
import { initSamplePlayerUI, initSampleTabs } from './samplePlayerUI.js';
import * as PresetMgr from './PresetManager.js';
import * as ThemeMgr from './ThemeManager.js';
import { KeyboardShortcuts } from './KeyboardShortcuts.js';
import { VisualPulse } from './VisualPulse.js';

const FALLBACK_THEMES=[
  {id:'neural',name:'🧠 Neural',vars:{}},
  {id:'light',name:'☀️ Light',vars:{'--bg':'#f5f7fb','--panel':'#ffffff','--card':'#f5f7fb','--text':'#1b1f29','--muted':'#5b687a','--border':'#d9e0ea'}},
  {id:'dark',name:'🌙 Dark',vars:{}}
];

function applyThemeVars(vars){ 
  const root=document.documentElement; 
  Object.entries(vars||{}).forEach(([k,v])=> root.style.setProperty(k,v)); 
}

function populateThemes(){ 
  const themes=ThemeMgr?.themes?.length?ThemeMgr.themes:FALLBACK_THEMES; 
  const sel=byId('themeSelect'); 
  sel.innerHTML=''; 
  themes.forEach(t=>{ 
    const o=document.createElement('option'); 
    o.value=t.id; 
    o.textContent=t.name; 
    sel.appendChild(o); 
  }); 
  sel.addEventListener('change', e=>{ 
    const id=e.target.value; 
    if(ThemeMgr?.applyTheme) ThemeMgr.applyTheme(id); 
    const chosen=themes.find(t=>t.id===id); 
    if(chosen?.vars) applyThemeVars(chosen.vars); 
  }); 
  sel.value=themes[0].id; 
  if(ThemeMgr?.applyTheme) ThemeMgr.applyTheme(themes[0].id); 
  if(themes[0]?.vars) applyThemeVars(themes[0].vars); 
}

const engine=new AudioEngine(); 
const visualizer=new Visualizer(engine);
const samplePlayer=new SamplePlayer(engine);
let timer=null; 
let keyboardShortcuts=null;
let visualPulse=null;

engine.onStart=()=> visualizer.start(); 
engine.onStop=()=> visualizer.stop(); 

engine.updatePanWidthVisibility=()=>{ 
  const showWidth=engine.mode==='binaural'; 
  byId('widthGroup').classList.toggle('hide',!showWidth); 
  byId('panGroup').classList.toggle('hide',showWidth); 
};

function updateFrequencyDisplay(){ 
  const beat=engine.beatFrequency, base=engine.baseFrequency; 
  const leftBase=!engine.swapLR; 
  const l=leftBase?base:base+beat; 
  const r=leftBase?base+beat:base; 
  byId('beatLabel').textContent=beat.toFixed(1); 
  byId('leftFreqVal').textContent=l.toFixed(1); 
  byId('rightFreqVal').textContent=r.toFixed(1); 
  let state=''; 
  if(beat===0) state='Pure tone (Solfeggio)';
  else if(beat>=0.5&&beat<=4) state='Deep sleep & healing'; 
  else if(beat>4&&beat<=8) state='Meditation & creativity'; 
  else if(beat>8&&beat<=14) state='Relaxed awareness'; 
  else if(beat>14&&beat<=30) state='Focus & alertness'; 
  else if(beat>30) state='Higher cognition'; 
  byId('brainwaveState').textContent=state; 
}

function updateNoiseInfo(){ 
  const desc={brown:'Deep rumble', white:'Bright hiss', pink:'Balanced noise', rain:'Rainfall', ocean:'Ocean waves'}; 
  const status=engine.noiseEngine.enabled?'enabled':'muted'; 
  const t=(engine.noiseEngine.type||'').toLowerCase(); 
  const label=t.charAt(0).toUpperCase()+t.slice(1); 
  const el=byId('noiseInfo'); 
  if(el) el.textContent=`${label} — ${desc[t]||''} (${status})`; 
}

function attachResets(){ 
  const resettable=document.querySelectorAll('input[type="number"], input[type="range"]'); 
  resettable.forEach(el=>{ 
    const def=el.getAttribute('data-default'); 
    if(def==null) return; 
    el.addEventListener('dblclick', ()=>{ 
      el.value=def; 
      el.dispatchEvent(new Event('input',{bubbles:true})); 
      if(el.classList.contains('knob-input')) syncNeedleForInput(el); 
    }); 
  }); 
  document.querySelector('.master-inline')?.addEventListener('dblclick', ()=>{ 
    const r=byId('masterRange'); 
    const n=byId('masterNum'); 
    const def=r.getAttribute('data-default')||'70'; 
    r.value=n.value=def; 
    r.dispatchEvent(new Event('input',{bubbles:true})); 
  }); 
}

function setupEQ(){ 
  for(let i=0;i<5;i++){ 
    const slider=byId('eq'+i), num=byId('eq'+i+'Input'); 
    const sync=v=>{ 
      slider.value=v; 
      num.value=v; 
      engine.equalizer?.updateBand(i,v); 
    }; 
    slider.addEventListener('input', e=> sync(e.target.value)); 
    num.addEventListener('input', e=> sync(e.target.value)); 
  } 
}

function populatePresets(){ 
  const categorySelect = byId('presetCategorySelect');
  const presetSelect = byId('presetSelect');
  
  if(!categorySelect || !presetSelect) return;
  
  const updatePresetDropdown = (category) => {
    const presets = category === 'solfeggio' 
      ? PresetMgr.getSolfeggioPresets() 
      : PresetMgr.getBrainwavePresets();
    
    presetSelect.innerHTML = 'Select Preset';
    
    Object.entries(presets).forEach(([key, p]) => {
      const o = document.createElement('option');
      o.value = key;
      o.textContent = p.name;
      presetSelect.appendChild(o);
    });
  };
  
  updatePresetDropdown('brainwave');
  
  categorySelect.addEventListener('change', e => {
    updatePresetDropdown(e.target.value);
    presetSelect.value = '';
  });
  
  presetSelect.addEventListener('change', e => {
    const key = e.target.value;
    if (!key) return;
    
    const allPresets = PresetMgr.getPresets();
    const p = allPresets[key];
    
    if(!p) return;
    
    const beat = byId('beatInput');
    const base = byId('baseInput');
    const modeSelect = byId('modeSelect');
    
    beat.value = p.beat;
    base.value = p.base;
    
    if (p.mode) {
      modeSelect.value = p.mode;
      engine.setMode(p.mode);
    }
    
    beat.dispatchEvent(new Event('input', { bubbles: true }));
    base.dispatchEvent(new Event('input', { bubbles: true }));
    
    engine.updatePanWidthVisibility();
    
    document.querySelectorAll('.knob-container[data-knob-for]').forEach(k => {
      const id = k.getAttribute('data-knob-for');
      const i = byId(id);
      if (i) syncNeedleForInput(i);
    });
  });
}

function setupAbout(){ 
  const infoBtn = byId('infoBtn');
  const categorySelect = byId('presetCategorySelect');
  const brainwaveModal = byId('brainwaveModal');
  const solfeggioModal = byId('solfeggioModal');
  const brainwaveClose = byId('brainwaveClose');
  const solfeggioClose = byId('solfeggioClose');
  
  if(!infoBtn || !categorySelect) return;
  
  infoBtn.addEventListener('click', () => {
    const category = categorySelect.value;
    if(category === 'solfeggio' && solfeggioModal){
      solfeggioModal.style.display = 'flex';
    } else if(brainwaveModal){
      brainwaveModal.style.display = 'flex';
    }
  });
  
  if(brainwaveModal && brainwaveClose){
    brainwaveClose.addEventListener('click', () => {
      brainwaveModal.style.display = 'none';
    });
    brainwaveModal.addEventListener('click', (e) => {
      if(e.target === brainwaveModal) brainwaveModal.style.display = 'none';
    });
  }
  
  if(solfeggioModal && solfeggioClose){
    solfeggioClose.addEventListener('click', () => {
      solfeggioModal.style.display = 'none';
    });
    solfeggioModal.addEventListener('click', (e) => {
      if(e.target === solfeggioModal) solfeggioModal.style.display = 'none';
    });
  }
}

function setupControls(){ 
  byId('playBtn').addEventListener('click', ()=> engine.start()); 
  byId('pauseBtn').addEventListener('click', ()=> engine.stop()); 
  byId('muteBtn').addEventListener('click', ()=> { 
    engine.isMuted=!engine.isMuted; 
    engine.setVolume(byId('masterRange').value); 
  }); 
  byId('modeSelect').addEventListener('change', e=>{ 
    engine.setMode(e.target.value); 
  }); 
  const swapBtn=byId('swapLR'); 
  swapBtn.addEventListener('click', ()=>{ 
    swapBtn.classList.toggle('active'); 
    engine.toggleSwap(); 
    updateFrequencyDisplay(); 
  }); 
  function syncMaster(v){ 
    v=clamp(parseInt(v||0),0,100); 
    byId('masterRange').value=v; 
    byId('masterNum').value=v; 
    engine.setVolume(v); 
  } 
  byId('masterRange').addEventListener('input', e=> syncMaster(e.target.value)); 
  byId('masterNum').addEventListener('input', e=> syncMaster(e.target.value)); 
  syncMaster(byId('masterRange').value); 
  
  byId('toneVolInput').addEventListener('input', e=> {
    engine.setFreqVolume(e.target.value);
    syncNeedleForInput(e.target);
  });
  
  byId('beatInput').addEventListener('input', e=>{ 
    engine.setBeat(e.target.value); 
    updateFrequencyDisplay(); 
  }); 
  byId('baseInput').addEventListener('input', e=>{ 
    engine.setBase(e.target.value); 
    updateFrequencyDisplay(); 
  }); 
  byId('widthInput').addEventListener('input', e=> engine.setWidth(e.target.value)); 
  byId('panInput').addEventListener('input', e=> engine.setTonePan(e.target.value)); 
  byId('visualModeSelect').addEventListener('change', e=> visualizer.setMode(e.target.value)); 
  byId('filtersToggle').addEventListener('click', ()=>{ 
    const el=byId('filtersToggle'); 
    const on=!el.classList.contains('active'); 
    el.classList.toggle('active', on); 
    engine.setFilters(on); 
    if(engine.noiseEngine.enabled) engine.noiseEngine.start(); 
  }); 
  byId('hpInput').addEventListener('input', e=> engine.setNoiseHP(e.target.value)); 
  byId('lpInput').addEventListener('input', e=> engine.setNoiseLP(e.target.value)); 
  byId('noiseToggle').addEventListener('click', ()=> { 
    engine.noiseEngine.toggle(); 
    updateNoiseInfo(); 
  }); 
  byId('noiseTypeSelect').addEventListener('change', e=> { 
    engine.noiseEngine.setType(e.target.value.toLowerCase()); 
    updateNoiseInfo(); 
  }); 
  byId('noiseVolInput').addEventListener('input', e=> { 
    if(engine.noiseGain&&engine.audioCtx){ 
      engine.noiseGain.gain.setTargetAtTime(parseFloat(e.target.value)/100, engine.audioCtx.currentTime, 0.05);
    } 
  }); 
}

function setupTimer(engine){ 
  const timerMinEl=byId('timerMin'); 
  const timerSecEl=byId('timerSec'); 
  const timerDisplayEl=byId('timerDisplay'); 
  const t=new Timer(timerMinEl, timerSecEl, timerDisplayEl, engine); 
  const updateTimerFromInputs=()=> t.updateFromInputs(); 
  timerMinEl.addEventListener('input', updateTimerFromInputs); 
  timerSecEl.addEventListener('input', updateTimerFromInputs); 
  byId('timerPlayBtn').addEventListener('click', ()=> t.start()); 
  byId('timerPauseBtn').addEventListener('click', ()=> t.pause()); 
  byId('timerResetBtn').addEventListener('click', ()=> t.reset()); 
  return t; 
}

document.addEventListener('DOMContentLoaded', ()=>{ 
  console.log('🚀 Initializing app...');
  
  try {
    visualizer.init(); 
    console.log('✓ Visualizer initialized');
  } catch(e) {
    console.error('✗ Visualizer init failed:', e);
  }
  
  try {
    initKnobs(); 
    console.log('✓ Knobs initialized');
  } catch(e) {
    console.error('✗ Knobs init failed:', e);
  }
  
  try {
    initTooltips();
    console.log('✓ Tooltips initialized');
  } catch(e) {
    console.error('✗ Tooltips init failed:', e);
  }
  
  try {
    setupControls(); 
    console.log('✓ Controls initialized');
  } catch(e) {
    console.error('✗ Controls init failed:', e);
  }
  
  try {
    setupEQ(); 
    console.log('✓ EQ initialized');
  } catch(e) {
    console.error('✗ EQ init failed:', e);
  }
  
  try {
    attachResets(); 
    console.log('✓ Resets initialized');
  } catch(e) {
    console.error('✗ Resets init failed:', e);
  }
  
  try {
    populatePresets(); 
    console.log('✓ Presets initialized');
  } catch(e) {
    console.error('✗ Presets init failed:', e);
  }
  
  try {
    populateThemes(); 
    console.log('✓ Themes initialized');
  } catch(e) {
    console.error('✗ Themes init failed:', e);
  }
  
  try {
    setupAbout();
    console.log('✓ About modal initialized');
  } catch(e) {
    console.error('✗ About init failed:', e);
  }
  
  try {
    updateFrequencyDisplay(); 
    updateNoiseInfo(); 
    engine.updatePanWidthVisibility(); 
    console.log('✓ UI state initialized');
  } catch(e) {
    console.error('✗ UI state init failed:', e);
  }
  
  // Initialize sample player
  samplePlayer.loadSamples().then(() => {
    try {
      initSamplePlayerUI(samplePlayer);
      initSampleTabs();
      console.log('✓ Sample player initialized');
    } catch(e) {
      console.error('✗ Sample player init failed:', e);
    }
  }).catch(e => {
    console.error('✗ Sample loading failed:', e);
  });
  
  // Initialize tone volume knob needle
  const toneVolInput = byId('toneVolInput');
  if(toneVolInput) syncNeedleForInput(toneVolInput);
  
  // Initialize timer
  try {
    timer = setupTimer(engine);
    engine.onTimerReset = () => timer?.reset();
    console.log('✓ Timer initialized');
  } catch(e) {
    console.error('✗ Timer init failed:', e);
  }

  // Initialize keyboard shortcuts
  try {
    keyboardShortcuts = new KeyboardShortcuts(engine, timer);
    console.log('✓ Keyboard shortcuts initialized');
    console.log('💡 Press ? to see all shortcuts and features');
  } catch(e) {
    console.error('✗ Keyboard shortcuts init failed:', e);
  }

  // Initialize visual pulse
  try {
    visualPulse = new VisualPulse(engine, visualizer);
    visualPulse.start();
    
    // Update pulse in animation loop
    const originalVisualizerStart = visualizer.start.bind(visualizer);
    visualizer.start = function() {
      originalVisualizerStart();
      const updatePulse = () => {
        if (engine.isPlaying) {
          visualPulse.update();
          requestAnimationFrame(updatePulse);
        }
      };
      updatePulse();
    };
    
    console.log('✓ Visual pulse initialized');
  } catch(e) {
    console.error('✗ Visual pulse init failed:', e);
  }
  
  // Export for global access
  window.engine=engine; 
  window.visualizer=visualizer;
  window.samplePlayer=samplePlayer;
  window.timer=timer;
  window.syncNeedleForInput=syncNeedleForInput;
  window.keyboardShortcuts=keyboardShortcuts;
  window.visualPulse=visualPulse;
  
  console.log('✅ App initialization complete');
});