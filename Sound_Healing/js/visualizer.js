export class Visualizer{ 
  constructor(engine){ 
    this.engine=engine; 
    this.canvas=null; 
    this.wrapper=null; 
    this.ctx=null; 
    this.animationId=null; 
    this.mode='waveform'; 
    this.cssW=0; 
    this.cssH=0; 
    this.dpr=1;
    this.beatPulsePhase=0;
    this.particles=[];
  }
  
  init(){ 
    this.canvas=document.getElementById('visualCanvas'); 
    this.wrapper=document.getElementById('visualWrapper'); 
    this.ctx=this.canvas.getContext('2d'); 
    const resize=()=>{ 
      const r=this.canvas.getBoundingClientRect(); 
      this.cssW=Math.max(1,r.width); 
      this.cssH=Math.max(1,r.height); 
      this.dpr=window.devicePixelRatio||1; 
      this.canvas.width=Math.floor(this.cssW*this.dpr); 
      this.canvas.height=Math.floor(this.cssH*this.dpr); 
      this.ctx.setTransform(1,0,0,1,0,0); 
      this.ctx.scale(this.dpr,this.dpr); 
    }; 
    resize(); 
    window.addEventListener('resize',resize); 
    document.addEventListener('fullscreenchange',resize); 
    document.getElementById('fullscreenBtn').addEventListener('click',()=> this.toggleFS()); 
    document.addEventListener('keydown',e=>{ 
      if(e.key.toLowerCase()==='f') this.toggleFS(); 
    }); 
  }
  
  toggleFS(){ 
    if(!document.fullscreenElement) this.wrapper.requestFullscreen?.(); 
    else document.exitFullscreen?.(); 
  }
  
  getBrainwaveColor(beatFreq){
    if(beatFreq <= 1) return {r:138,g:43,b:226}; // Epsilon - Deep purple
    if(beatFreq <= 4) return {r:59,g:130,b:246}; // Delta - Blue
    if(beatFreq <= 8) return {r:34,g:197,b:94}; // Theta - Green
    if(beatFreq <= 12) return {r:251,g:191,b:36}; // Alpha - Yellow
    if(beatFreq <= 15) return {r:251,g:146,b:60}; // SMR - Orange
    if(beatFreq <= 30) return {r:239,g:68,b:68}; // Beta - Red
    return {r:236,g:72,b:153}; // Gamma - Pink
  }
  
  updateBeatPulse(){
    const beatFreq = this.engine.beatFrequency || 10;
    const cycleTime = 1000 / beatFreq;
    this.beatPulsePhase = (Date.now() % cycleTime) / cycleTime;
  }
  
  createParticle(){
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    return {
      x: this.cssW / 2,
      y: this.cssH / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      decay: 0.01 + Math.random() * 0.02,
      size: Math.random() * 3 + 1
    };
  }
  
  updateParticles(){
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    });
    if(this.beatPulsePhase < 0.1 && Math.random() < 0.3){
      this.particles.push(this.createParticle());
    }
  }
  
  drawParticles(){
    const color = this.getBrainwaveColor(this.engine.beatFrequency);
    this.particles.forEach(p => {
      this.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${p.life * 0.6})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  start(){ 
    cancelAnimationFrame(this.animationId); 
    const draw=()=>{ 
      if(!this.engine.isPlaying) return; 
      this.animationId=requestAnimationFrame(draw); 
      const an=this.engine.analyser; 
      if(!an) return; 
      const n=an.frequencyBinCount; 
      const data=new Uint8Array(n); 
      
      this.updateBeatPulse();
      this.updateParticles();
      
      const color = this.getBrainwaveColor(this.engine.beatFrequency);
      const pulseIntensity = Math.sin(this.beatPulsePhase * Math.PI) * 0.3;
      
      this.ctx.fillStyle=`rgba(15,20,25,${0.15 + pulseIntensity * 0.1})`; 
      this.ctx.fillRect(0,0,this.cssW,this.cssH); 
      
      if(this.mode === 'particles'){
        this.drawParticles();
      }
      
      if(this.mode==='waveform'){ 
        an.getByteTimeDomainData(data); 
        this.wave(data, color); 
      } else if(this.mode==='frequency'){ 
        an.getByteFrequencyData(data); 
        this.bars(data, color); 
      } else if(this.mode==='radial'){ 
        an.getByteFrequencyData(data); 
        this.radial(data, color); 
      } else if(this.mode==='spectrum'){ 
        an.getByteFrequencyData(data); 
        this.spectrum(data, color); 
      } else if(this.mode==='particles'){ 
        an.getByteFrequencyData(data); 
        this.particleViz(data, color); 
      } else if(this.mode==='tunnel'){ 
        an.getByteFrequencyData(data); 
        this.tunnel(data, color); 
      } else if(this.mode==='wave3d'){ 
        an.getByteFrequencyData(data); 
        this.wave3d(data, color); 
      } else if(this.mode==='spiral'){ 
        an.getByteFrequencyData(data); 
        this.spiral(data, color); 
      } else if(this.mode==='circle'){ 
        an.getByteFrequencyData(data); 
        this.circle(data, color); 
      } else if(this.mode==='dna'){ 
        an.getByteFrequencyData(data); 
        this.dna(data, color); 
      }
    }; 
    draw(); 
  }
  
  stop(){ 
    cancelAnimationFrame(this.animationId); 
    this.animationId=null; 
    this.particles = [];
    try{ this.ctx.clearRect(0,0,this.cssW,this.cssH);}catch{} 
  }
  
  setMode(m){ this.mode=m; }
  
  wave(d, color){ 
    this.ctx.strokeStyle=`rgb(${color.r},${color.g},${color.b})`; 
    this.ctx.lineWidth=2.5; 
    this.ctx.shadowBlur=10;
    this.ctx.shadowColor=`rgba(${color.r},${color.g},${color.b},0.5)`;
    this.ctx.beginPath(); 
    const sw=this.cssW/d.length; 
    let x=0; 
    for(let i=0;i<d.length;i++){ 
      const y=(d[i]/255)*this.cssH; 
      if(i===0) this.ctx.moveTo(x,y); 
      else this.ctx.lineTo(x,y); 
      x+=sw; 
    } 
    this.ctx.stroke(); 
    this.ctx.shadowBlur=0;
  }
  
  bars(d, color){ 
    const count=Math.min(d.length, 64);
    const barW=Math.max(2,(this.cssW/count)*0.8); 
    const gap=Math.max(1,(this.cssW/count)*0.2);
    const totalW=count*(barW+gap); 
    let x=(this.cssW-totalW)/2; 
    
    for(let i=0;i<count;i++){ 
      const h=(d[i]/255)*this.cssH*0.9;
      const intensity = d[i] / 255;
      
      const gradient = this.ctx.createLinearGradient(x, this.cssH, x, this.cssH - h);
      gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.8)`);
      gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},1)`);
      
      this.ctx.fillStyle=gradient;
      this.ctx.fillRect(x,this.cssH-h,barW,h); 
      
      if(h > 20){
        this.ctx.fillStyle=`rgba(${color.r},${color.g},${color.b},${intensity * 0.5})`;
        this.ctx.fillRect(x, this.cssH - h - 3, barW, 3);
      }
      
      x+=barW+gap; 
    } 
  }
  
  radial(d, color){ 
    const cx=this.cssW/2, cy=this.cssH/2, r=Math.min(cx,cy)*0.6; 
    this.ctx.strokeStyle=`rgb(${color.r},${color.g},${color.b})`; 
    this.ctx.lineWidth=2; 
    this.ctx.shadowBlur=8;
    this.ctx.shadowColor=`rgba(${color.r},${color.g},${color.b},0.6)`;
    
    for(let i=0;i<d.length;i+=3){ 
      const a=(i/d.length)*Math.PI*2; 
      const amp=(d[i]/255)*r*0.6; 
      const x1=cx+Math.cos(a)*r, y1=cy+Math.sin(a)*r; 
      const x2=cx+Math.cos(a)*(r+amp), y2=cy+Math.sin(a)*(r+amp); 
      this.ctx.beginPath(); 
      this.ctx.moveTo(x1,y1); 
      this.ctx.lineTo(x2,y2); 
      this.ctx.stroke(); 
    }
    this.ctx.shadowBlur=0;
  }
  
  spectrum(d, color){ 
    const cx=this.cssW/2, cy=this.cssH/2; 
    const count = Math.min(d.length, 64);
    
    this.ctx.shadowBlur=6;
    this.ctx.shadowColor=`rgba(${color.r},${color.g},${color.b},0.8)`;
    
    for(let i=0;i<count;i++){ 
      const s=(d[i]/255)*50; 
      const angle = (i / count) * Math.PI * 2;
      const radius = Math.min(cx,cy)*0.5+s;
      const x=cx+Math.cos(angle)*radius; 
      const y=cy+Math.sin(angle)*radius; 
      
      const intensity = d[i] / 255;
      this.ctx.fillStyle=`rgba(${color.r},${color.g},${color.b},${0.6 + intensity * 0.4})`; 
      this.ctx.strokeStyle=`rgba(${color.r},${color.g},${color.b},0.8)`; 
      this.ctx.lineWidth=1.5; 
      this.ctx.beginPath(); 
      this.ctx.arc(x,y,Math.max(2,s/4),0,Math.PI*2); 
      this.ctx.fill(); 
      this.ctx.stroke(); 
    }
    this.ctx.shadowBlur=0;
  }
  
  particleViz(d, color){
    const cx=this.cssW/2, cy=this.cssH/2;
    const count = Math.min(d.length, 128);
    
    for(let i=0;i<count;i++){
      const intensity = d[i] / 255;
      if(intensity < 0.1) continue;
      
      const angle = (i / count) * Math.PI * 2 + Date.now() * 0.0001;
      const radius = (this.cssH * 0.3) + (intensity * this.cssH * 0.2);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const size = 2 + intensity * 6;
      
      this.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${intensity * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.drawParticles();
  }
  
  tunnel(d, color){
    const cx=this.cssW/2, cy=this.cssH/2;
    const maxRings = 12;
    const count = Math.min(d.length, 64);
    const timeOffset = Date.now() * 0.001;
    
    for(let ring=0; ring<maxRings; ring++){
      const ringProgress = ring / maxRings;
      const ringRadius = (ring + 1) * (Math.min(cx, cy) / maxRings) * 1.2;
      const alpha = 1 - ringProgress;
      
      this.ctx.beginPath();
      for(let i=0; i<=count; i++){
        const dataIdx = Math.floor((i / count) * d.length);
        const intensity = d[dataIdx] / 255;
        const angle = (i / count) * Math.PI * 2 + timeOffset + ring * 0.3;
        const r = ringRadius + intensity * 20;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        if(i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.5})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }
  
  wave3d(d, color){
    const cols = 40;
    const cellW = this.cssW / cols;
    const baseY = this.cssH * 0.7;
    const timeOffset = Date.now() * 0.001;
    
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.8)`;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},0.5)`;
    
    for(let row=0; row<8; row++){
      this.ctx.beginPath();
      const rowDepth = row / 8;
      const scale = 1 - rowDepth * 0.5;
      const yOffset = rowDepth * this.cssH * 0.4;
      
      for(let col=0; col<=cols; col++){
        const dataIdx = Math.floor((col / cols) * d.length);
        const intensity = d[dataIdx] / 255;
        const wave = Math.sin(col * 0.5 + timeOffset + row * 0.5) * 10;
        const x = col * cellW;
        const y = baseY + yOffset - (intensity * 100 * scale) + wave;
        
        if(col === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.globalAlpha = 1 - rowDepth * 0.6;
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }
  
  spiral(d, color){
    const cx = this.cssW / 2;
    const cy = this.cssH / 2;
    const count = Math.min(d.length, 200);
    const timeOffset = Date.now() * 0.0005;
    
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.8)`;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},0.6)`;
    
    this.ctx.beginPath();
    
    for(let i=0; i<count; i++){
      const progress = i / count;
      const dataIdx = Math.floor(progress * d.length);
      const intensity = d[dataIdx] / 255;
      
      const angle = progress * Math.PI * 6 + timeOffset;
      const radius = progress * Math.min(cx, cy) * 0.8 + intensity * 30;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      if(i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
      
      if(intensity > 0.7){
        this.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${intensity})`;
        this.ctx.fillRect(x-2, y-2, 4, 4);
      }
    }
    
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }
  
  circle(d, color){
    const cx = this.cssW / 2;
    const cy = this.cssH / 2;
    const count = Math.min(d.length, 128);
    const baseRadius = Math.min(cx, cy) * 0.5;
    
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.8)`;
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},0.6)`;
    
    for(let ring=0; ring<3; ring++){
      this.ctx.beginPath();
      
      for(let i=0; i<=count; i++){
        const dataIdx = Math.floor((i / count) * d.length);
        const intensity = d[dataIdx] / 255;
        const angle = (i / count) * Math.PI * 2;
        
        const ringOffset = ring * 40;
        const radius = baseRadius + ringOffset + intensity * (30 - ring * 8);
        
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        if(i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.closePath();
      this.ctx.globalAlpha = 1 - ring * 0.25;
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
    
    const avgIntensity = d.reduce((sum, val) => sum + val, 0) / d.length / 255;
    const pulseRadius = 15 + avgIntensity * 25;
    
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
    gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${avgIntensity})`);
    gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  dna(d, color){
    const cx = this.cssW / 2;
    const count = Math.min(d.length, 128);
    const timeOffset = Date.now() * 0.0008;
    const helixWidth = Math.min(this.cssW, this.cssH) * 0.3;
    
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.8)`;
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},0.5)`;
    
    for(let strand=0; strand<2; strand++){
      this.ctx.beginPath();
      const strandOffset = strand * Math.PI;
      
      for(let i=0; i<count; i++){
        const progress = i / count;
        const y = this.cssH * 0.1 + progress * this.cssH * 0.8;
        const dataIdx = Math.floor(progress * d.length);
        const intensity = d[dataIdx] / 255;
        
        const angle = progress * Math.PI * 4 + timeOffset + strandOffset;
        const radius = helixWidth * (0.5 + intensity * 0.3);
        const x = cx + Math.cos(angle) * radius;
        
        if(i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      
      this.ctx.globalAlpha = 0.9 - strand * 0.1;
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
    
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.4)`;
    this.ctx.lineWidth = 1.5;
    
    for(let i=0; i<count; i+=4){
      const progress = i / count;
      const y = this.cssH * 0.1 + progress * this.cssH * 0.8;
      const dataIdx = Math.floor(progress * d.length);
      const intensity = d[dataIdx] / 255;
      
      const angle1 = progress * Math.PI * 4 + timeOffset;
      const angle2 = progress * Math.PI * 4 + timeOffset + Math.PI;
      
      const radius = helixWidth * (0.5 + intensity * 0.3);
      const x1 = cx + Math.cos(angle1) * radius;
      const x2 = cx + Math.cos(angle2) * radius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y);
      this.ctx.lineTo(x2, y);
      this.ctx.globalAlpha = intensity * 0.6;
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }
}