import { clamp } from 'https://cdn.jsdelivr.net/gh/phish83/Malay@main/Sound_Healing/js/utils.js';

export class NoiseEngine{ constructor(engine){ this.engine=engine; this.enabled=false; this.type='brown'; this.source=null; this.buffer=null; }
  async generateBuffer(){ if(!this.engine.audioCtx) return null; const sr=this.engine.audioCtx.sampleRate; const buf=this.engine.audioCtx.createBuffer(1,sr*2,sr); const d=buf.getChannelData(0);
    if(this.type==='brown'){ let v=0; for(let i=0;i<d.length;i++){ v=(v+(Math.random()-0.5)*6)/2; d[i]=v*0.3; } }
    else if(this.type==='white'){ for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3; }
    else if(this.type==='pink'){ let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0; for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980; d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926; } }
    else if(this.type==='rain'){ for(let i=0;i<d.length;i++){ let s=(Math.random()*2-1)*0.2; if(Math.random()<0.001) s+=(Math.random()*2-1)*0.5; d[i]=s; } }
    else if(this.type==='ocean'){ for(let i=0;i<d.length;i++){ const w=(Math.random()*2-1)*0.3; const wave=Math.sin(i*0.001)*0.2; d[i]=w*(0.5+wave); } }
    return buf; }
  async start(){ this.stop(); if(!this.enabled || !this.engine.audioCtx) return; this.buffer = await this.generateBuffer(); const ctx=this.engine.audioCtx; this.source = ctx.createBufferSource(); this.source.buffer = this.buffer; this.source.loop = true; if (this.engine.filtersEnabled && this.engine.noiseHP && this.engine.noiseLP) this.source.connect(this.engine.noiseHP); else this.source.connect(this.engine.noiseGain); try{ this.source.start(); }catch{} }
  stop(){ if(this.source){ try{this.source.stop();}catch{} try{this.source.disconnect();}catch{} } this.source=null; }
  toggle(){ this.enabled=!this.enabled; document.getElementById('noiseToggle')?.classList.toggle('active', this.enabled); this.start(); }
  setType(t){ this.type=t; this.start(); }
}
