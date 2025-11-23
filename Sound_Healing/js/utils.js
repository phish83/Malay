export function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
export function updateLED(id,a){ document.getElementById(id)?.classList.toggle('active',a); }
export function byId(id){ return document.getElementById(id); }
