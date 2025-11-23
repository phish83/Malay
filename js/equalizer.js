export class Equalizer{ constructor(ctx){ this.ctx=ctx; this.filters=[]; this.freqs=[60,250,1000,4000,12000]; this.gains=[0,0,0,0,0]; }
  createFilters(){ this.disconnect(); this.filters=[]; if(!this.ctx) return;
    this.freqs.forEach((f,i)=>{ const fil=this.ctx.createBiquadFilter(); fil.type=i===0?'lowshelf':i===4?'highshelf':'peaking'; fil.frequency.value=f; fil.Q.value=(fil.type==='peaking'?1.6:0.707); fil.gain.value=this.gains[i]; this.filters.push(fil); });
    this.filters.forEach((f,i)=>{ if(i<this.filters.length-1) f.connect(this.filters[i+1]); }); }
  connectTo(node){ this.createFilters(); if(this.filters.length){ node.connect(this.filters[0]); return this.filters[this.filters.length-1]; } return node; }
  updateBand(i,v){ this.gains[i]=parseFloat(v); if(this.filters[i]) this.filters[i].gain.value=this.gains[i]; }
  disconnect(){ this.filters.forEach(f=>{ try{f.disconnect();}catch{} }); this.filters=[]; }
}
