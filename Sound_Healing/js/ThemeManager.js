// ThemeManager.js
// Provides a small theme catalog and a helper to apply CSS variables to :root.
// Usage:
//   import { themes, applyTheme, initSavedTheme } from './ThemeManager.js';
//   applyTheme('neural');
//   initSavedTheme(); // restore saved choice on load

const LS_KEY = 'BW_THEME_V1';

export const themes = [
  {
    id: 'neural',
    name: '🧠 Neural',
    vars: {
      '--bg':'#0f1419','--panel':'#1a1f2e','--card':'#232938','--text':'#d4dae4',
      '--muted':'#5a6b7d','--accent':'#4a9eff','--accent-glow':'#4a9eff40',
      '--border':'#2a3441','--input-bg':'#151a23'
    }
  },
  {
    id: 'night-drive',
    name: '🌌 Night Drive',
    vars: {
      '--bg':'#0b0f14','--panel':'#121826','--card':'#141b2e','--text':'#d7e2f1',
      '--muted':'#6b7a8c','--accent':'#7aa2ff','--accent-glow':'#7aa2ff40',
      '--border':'#223046','--input-bg':'#0e1422'
    }
  },
  {
    id: 'deep-ocean',
    name: '🌊 Deep Ocean',
    vars: {
      '--bg':'#0a1628','--panel':'#0f1f3a','--card':'#132844','--text':'#c5d9ed',
      '--muted':'#5a7a9d','--accent':'#00d4ff','--accent-glow':'#00d4ff40',
      '--border':'#1a3356','--input-bg':'#0c1a2f'
    }
  },
  {
    id: 'forest',
    name: '🌲 Forest',
    vars: {
      '--bg':'#0d1f12','--panel':'#162d1a','--card':'#1a3820','--text':'#d4e8d8',
      '--muted':'#5a8065','--accent':'#4ade80','--accent-glow':'#4ade8040',
      '--border':'#243d2a','--input-bg':'#111f15'
    }
  },
  {
    id: 'sunset',
    name: '🌅 Sunset',
    vars: {
      '--bg':'#1a0f0a','--panel':'#2a1d15','--card':'#342416','--text':'#f5e6d3',
      '--muted':'#9d7a5a','--accent':'#ff6b35','--accent-glow':'#ff6b3540',
      '--border':'#3d2a1a','--input-bg':'#221710'
    }
  },
  {
    id: 'midnight',
    name: '🌃 Midnight',
    vars: {
      '--bg':'#000000','--panel':'#0a0a0f','--card':'#151520','--text':'#e0e0ff',
      '--muted':'#6060a0','--accent':'#8b5cf6','--accent-glow':'#8b5cf640',
      '--border':'#1a1a2e','--input-bg':'#0f0f1a'
    }
  },
  {
    id: 'aurora',
    name: '🌌 Aurora',
    vars: {
      '--bg':'#0a0e1a','--panel':'#141a2e','--card':'#1a2442','--text':'#d0e0f0',
      '--muted':'#6080b0','--accent':'#a78bfa','--accent-glow':'#a78bfa40',
      '--border':'#243555','--input-bg':'#10162a'
    }
  },
  {
    id: 'cyber',
    name: '🤖 Cyber',
    vars: {
      '--bg':'#0d0208','--panel':'#1a0f1a','--card':'#2a1a2a','--text':'#00ff41',
      '--muted':'#00aa2e','--accent':'#39ff14','--accent-glow':'#39ff1440',
      '--border':'#1a3322','--input-bg':'#0f0f0f'
    }
  },
  {
    id: 'daylight',
    name: '☀️ Daylight',
    vars: {
      '--bg':'#f5f7fb','--panel':'#ffffff','--card':'#f5f7fb','--text':'#1b1f29',
      '--muted':'#5b687a','--accent':'#2b78ff','--accent-glow':'#2b78ff33',
      '--border':'#d9e0ea','--input-bg':'#eef2f8'
    }
  },
  {
    id: 'warm-light',
    name: '🔆 Warm Light',
    vars: {
      '--bg':'#faf8f3','--panel':'#ffffff','--card':'#f8f5f0','--text':'#2d2416',
      '--muted':'#857a68','--accent':'#f97316','--accent-glow':'#f9731633',
      '--border':'#e8dcc8','--input-bg':'#f5f0e8'
    }
  },
  {
    id: 'soft-blue',
    name: '💠 Soft Blue',
    vars: {
      '--bg':'#f0f4f8','--panel':'#ffffff','--card':'#f8fafc','--text':'#1e293b',
      '--muted':'#64748b','--accent':'#3b82f6','--accent-glow':'#3b82f633',
      '--border':'#cbd5e1','--input-bg':'#f1f5f9'
    }
  },
  {
    id: 'rose',
    name: '🌹 Rose',
    vars: {
      '--bg':'#1a0e14','--panel':'#2a1822','--card':'#3a2230','--text':'#f8d7e8',
      '--muted':'#a06080','--accent':'#f472b6','--accent-glow':'#f472b640',
      '--border':'#4a2c3e','--input-bg':'#22121c'
    }
  }
];

export function applyTheme(id){
  const t = themes.find(x=>x.id===id) || themes[0];
  if(!t) return;
  const root = document.documentElement;
  Object.entries(t.vars||{}).forEach(([k,v])=> root.style.setProperty(k, v));
  // Save selection
  try{ localStorage.setItem(LS_KEY, id); }catch(e){}
  // Optional class hook if you add theme-specific CSS later
  root.setAttribute('data-theme', t.id);
}

export function initSavedTheme(){
  try{
    const id = localStorage.getItem(LS_KEY);
    if(id) applyTheme(id);
    else applyTheme(themes[0].id);
  }catch(e){
    applyTheme(themes[0].id);
  }
}

// Default export for convenience
export default { themes, applyTheme, initSavedTheme };