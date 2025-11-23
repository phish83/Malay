// PresetManager.js
// Lightweight preset registry with Brainwave + Solfeggio categories
// Solfeggio presets automatically switch to monaural mode

const LS_KEY = 'BW_PRESETS_V1';

const BRAINWAVE_PRESETS = {
  epsilon:   { name: "Epsilon (0.5 Hz)",    beat: 0.5, base: 120, mode: 'binaural' },
  deltaDeep: { name: "Delta Deep (2 Hz)",    beat: 2.0, base: 120, mode: 'binaural' },
  theta:     { name: "Theta Meditate (6 Hz)",beat: 6.0, base: 180, mode: 'binaural' },
  alphaRelax:{ name: "Alpha Relax (10 Hz)",  beat: 10.0, base: 220, mode: 'binaural' },
  smr:       { name: "SMR Calm Focus (13 Hz)", beat: 13.0, base: 250, mode: 'binaural' },
  alphaFocus:{ name: "Alpha/Low Beta (12 Hz)", beat: 12.0, base: 260, mode: 'binaural' },
  betaFocus: { name: "Beta Focus (18 Hz)",   beat: 18.0, base: 300, mode: 'binaural' },
  highBeta:  { name: "High Beta (22 Hz)",    beat: 22.0, base: 320, mode: 'binaural' },
  gamma:     { name: "Gamma Peak (40 Hz)",   beat: 40.0, base: 400, mode: 'binaural' },
  pomodoro:  { name: "Study 25m (10 Hz)",    beat: 10.0, base: 210, mode: 'binaural' },
  deepRelax: { name: "Deep Relax (7.5 Hz)",  beat: 7.5, base: 200, mode: 'binaural' },
  powerNap:  { name: "Power Nap (3 Hz)",     beat: 3.0, base: 180, mode: 'binaural' }
};

const SOLFEGGIO_PRESETS = {
  solf174:   { name: "174 Hz — Pain Relief",      beat: 0, base: 174, mode: 'monaural', category: 'solfeggio' },
  solf285:   { name: "285 Hz — Energy & Vitality", beat: 0, base: 285, mode: 'monaural', category: 'solfeggio' },
  solf396:   { name: "396 Hz — Liberation from Fear", beat: 0, base: 396, mode: 'monaural', category: 'solfeggio' },
  solf417:   { name: "417 Hz — Facilitating Change", beat: 0, base: 417, mode: 'monaural', category: 'solfeggio' },
  solf528:   { name: "528 Hz — DNA Repair & Love",  beat: 0, base: 528, mode: 'monaural', category: 'solfeggio' },
  solf639:   { name: "639 Hz — Relationships",     beat: 0, base: 639, mode: 'monaural', category: 'solfeggio' },
  solf741:   { name: "741 Hz — Expression & Solutions", beat: 0, base: 741, mode: 'monaural', category: 'solfeggio' },
  solf852:   { name: "852 Hz — Intuition & Awareness", beat: 0, base: 852, mode: 'monaural', category: 'solfeggio' },
  solf963:   { name: "963 Hz — Divine Connection",  beat: 0, base: 963, mode: 'monaural', category: 'solfeggio' }
};

function loadUserPresets(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return {};
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') return obj;
  }catch(e){ /* ignore */ }
  return {};
}

function saveUserPresets(obj){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  }catch(e){ /* ignore */ }
}

let userPresets = loadUserPresets();

export function getPresets(){
  return Object.assign({}, BRAINWAVE_PRESETS, SOLFEGGIO_PRESETS, userPresets);
}

export function getBrainwavePresets(){
  return Object.assign({}, BRAINWAVE_PRESETS);
}

export function getSolfeggioPresets(){
  return Object.assign({}, SOLFEGGIO_PRESETS);
}

export function list(){
  return Object.entries(getPresets()).map(([key, p]) => ({ key, ...p }));
}

export function addPreset(key, preset){
  if(!key || !preset || !preset.name) return false;
  userPresets[key] = { 
    name: preset.name, 
    beat: Number(preset.beat||10), 
    base: Number(preset.base||220),
    mode: preset.mode || 'binaural',
    category: preset.category || 'custom'
  };
  saveUserPresets(userPresets);
  return true;
}

export function removePreset(key){
  if(!userPresets[key]) return false;
  delete userPresets[key];
  saveUserPresets(userPresets);
  return true;
}

export const presets = getPresets();
export default { getPresets, getBrainwavePresets, getSolfeggioPresets, addPreset, removePreset, list, presets };