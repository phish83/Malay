import { updateLED } from './utils.js';
export class Timer{ constructor(minEl, secEl, displayEl, engine){ this.minEl=minEl; this.secEl=secEl; this.displayEl=displayEl; this.engine=engine; this.running=false; this.remaining=0; this.interval=null; this.updateFromInputs(); }
  readInputs(){ const m=Math.max(0,parseInt(this.minEl.value||0,10)); const sRaw=this.secEl.value.toString().padStart(2,'0'); const s=Math.max(0,Math.min(59,parseInt(sRaw,10))); return {m,s}; }
  updateFromInputs(){ const {m,s}=this.readInputs(); this.remaining=m*60+s; this.render(m,s); }
  render(m,s){ this.displayEl.textContent=`${m}:${s.toString().padStart(2,'0')}`; }
  start(){ if(this.running) return; const {m,s}=this.readInputs(); this.remaining=m*60+s; if(!this.engine.isPlaying) this.engine.start(); this.running=true; updateLED('timerLed',true); this.tick(); this.interval=setInterval(()=>this.tick(),1000); }
  tick(){ const m=Math.floor(this.remaining/60), s=this.remaining%60; this.render(m,s); if(this.remaining<=0){ this.complete(); return; } this.remaining--; }
  pause(){ if(this.interval) clearInterval(this.interval); this.interval=null; this.running=false; updateLED('timerLed',false); }
  reset(){ this.pause(); this.updateFromInputs(); }
  complete(){ this.pause(); this.engine.stop(); alert('✓ Session complete!'); }
}
