import { clamp, updateLED } from './utils.js';
import { Equalizer } from './equalizer.js';
import { NoiseEngine } from './noise.js';

export class AudioEngine{ 
  constructor(){ 
    this.audioCtx=null; 
    this.isPlaying=false; 
    this.mode='binaural'; 
    this.volume=0.7; 
    this.freqVolume=0.7; 
    this.isMuted=false; 
    this.beatFrequency=10; 
    this.baseFrequency=220; 
    this.filtersEnabled=true; 
    this.swapLR=false; 
    this.tonePan=0; 
    this.width=1.0; 
    this.toneGain=null; 
    this.tonePanner=null; 
    this.noiseHP=null; 
    this.noiseLP=null; 
    this.noiseGain=null; 
    this.noisePanner=null; 
    this.mainMix=null; 
    this.eqOut=null; 
    this.analyser=null; 
    this.masterPanner=null; 
    this.oscillators=[]; 
    this.gainNodes=[]; 
    this.leftTonePanner=null; 
    this.rightTonePanner=null; 
    this.RAMP_TIME=0.03; 
    this.equalizer=null; 
    this.noiseEngine=new NoiseEngine(this); 
  }
  
  async ensureCtx(){ 
    if(!this.audioCtx) this.audioCtx=new (window.AudioContext||window.webkitAudioContext)(); 
    if(this.audioCtx.state==='suspended') await this.audioCtx.resume(); 
  }
  
  async start(){ 
    await this.ensureCtx(); 
    if(!this.isPlaying){ 
      this.setupGraph(); 
      this.isPlaying=true; 
      updateLED('engLed',true); 
      this.onStart?.(); 
      if(this.noiseEngine.enabled) this.noiseEngine.start(); 
    } 
  }
  
  setupGraph(){ 
    const ctx=this.audioCtx, now=ctx.currentTime; 
    this.toneGain=ctx.createGain(); 
    this.tonePanner=ctx.createStereoPanner(); 
    this.noiseGain=ctx.createGain(); 
    this.noisePanner=ctx.createStereoPanner(); 
    this.mainMix=ctx.createGain(); 
    this.masterPanner=ctx.createStereoPanner(); 
    this.analyser=ctx.createAnalyser(); 
    this.toneGain.gain.setValueAtTime(this.freqVolume, now); 
    this.noiseGain.gain.setValueAtTime((parseFloat(document.getElementById('noiseVolInput')?.value)||15)/100, now); 
    this.mainMix.gain.setValueAtTime(this.isMuted?0:this.volume, now); 
    this.analyser.fftSize=2048; 
    this.setupTones(); 
    this.noiseHP=ctx.createBiquadFilter(); 
    this.noiseHP.type='highpass'; 
    this.noiseHP.frequency.value=parseFloat(document.getElementById('hpInput')?.value||80); 
    this.noiseLP=ctx.createBiquadFilter(); 
    this.noiseLP.type='lowpass'; 
    this.noiseLP.frequency.value=parseFloat(document.getElementById('lpInput')?.value||6000); 
    if(this.mode==='binaural'){ 
      this.toneGain.connect(this.mainMix); 
    } else { 
      this.toneGain.connect(this.tonePanner).connect(this.mainMix); 
      this.setTonePan(this.tonePan*100); 
    } 
    if(this.filtersEnabled){ 
      this.noiseHP.connect(this.noiseLP).connect(this.noiseGain).connect(this.noisePanner).connect(this.mainMix);
    } else { 
      this.noiseGain.connect(this.noisePanner).connect(this.mainMix); 
    } 
    this.noisePanner.pan.value=0; 
    this.equalizer=new Equalizer(ctx); 
    this.eqOut=this.equalizer.connectTo(this.mainMix); 
    this.eqOut.connect(this.analyser); 
    this.masterPanner.pan.value=0; 
    this.analyser.connect(this.masterPanner).connect(ctx.destination); 
  }
  
  setupTones(){ 
    const ctx=this.audioCtx; 
    try{ this.oscillators.forEach(o=>{try{o.stop();}catch{}});}catch{} 
    try{ this.gainNodes.forEach(g=>{try{g.disconnect();}catch{}});}catch{} 
    this.oscillators=[]; 
    this.gainNodes=[]; 
    
    if(this.mode==='binaural'){ 
      const oL=ctx.createOscillator(), oR=ctx.createOscillator(); 
      const leftBase=!this.swapLR; 
      const fL=leftBase?this.baseFrequency:this.baseFrequency+this.beatFrequency; 
      const fR=leftBase?this.baseFrequency+this.beatFrequency:this.baseFrequency; 
      oL.frequency.value=fL; 
      oR.frequency.value=fR; 
      const gL=ctx.createGain(), gR=ctx.createGain(); 
      gL.gain.value=0.0; 
      gR.gain.value=0.0; 
      this.leftTonePanner=ctx.createStereoPanner(); 
      this.rightTonePanner=ctx.createStereoPanner(); 
      this.applyWidth(); 
      oL.connect(gL).connect(this.leftTonePanner).connect(this.toneGain); 
      oR.connect(gR).connect(this.rightTonePanner).connect(this.toneGain); 
      oL.start(); 
      oR.start(); 
      gL.gain.linearRampToValueAtTime(0.5, ctx.currentTime + this.RAMP_TIME); 
      gR.gain.linearRampToValueAtTime(0.5, ctx.currentTime + this.RAMP_TIME); 
      this.oscillators=[oL,oR]; 
      this.gainNodes=[gL,gR]; 
    } else if(this.mode==='isochronic'){ 
      const o=ctx.createOscillator(), lfo=ctx.createOscillator(); 
      o.frequency.value=this.baseFrequency; 
      lfo.type='square'; 
      lfo.frequency.value=this.beatFrequency; 
      const g=ctx.createGain(), lfoG=ctx.createGain(); 
      lfoG.gain.value=0.5; 
      g.gain.value=0.0; 
      lfo.connect(lfoG).connect(g.gain); 
      o.connect(g).connect(this.toneGain); 
      o.start(); 
      lfo.start(); 
      g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + this.RAMP_TIME); 
      this.oscillators=[o,lfo]; 
      this.gainNodes=[g]; 
    } else { 
      // Monaural mode - single steady tone (no beating)
      const o=ctx.createOscillator();
      o.frequency.value=this.baseFrequency;
      const g=ctx.createGain();
      g.gain.value=0.0;
      o.connect(g).connect(this.toneGain);
      o.start();
      g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + this.RAMP_TIME);
      this.oscillators=[o];
      this.gainNodes=[g];
    } 
  }
  
  stop(updateTimer=true){ 
    if(!this.audioCtx||!this.isPlaying){ 
      this.isPlaying=false; 
      return; 
    } 
    this.onStop?.(); 
    try{ this.oscillators.forEach(o=>{try{o.stop();}catch{}});}catch{} 
    try{ 
      [this.toneGain,this.tonePanner,this.noiseGain,this.noisePanner,this.mainMix,this.noiseHP,this.noiseLP,this.eqOut,this.analyser,this.masterPanner,this.leftTonePanner,this.rightTonePanner].forEach(n=>{ 
        try{n&&n.disconnect();}catch{} 
      }); 
    }catch{} 
    this.isPlaying=false; 
    updateLED('engLed',false); 
    if(updateTimer) this.onTimerReset?.(); 
  }
  
  setVolume(v){ 
    this.volume=clamp(v/100,0,1); 
    if(this.mainMix&&this.audioCtx){ 
      this.mainMix.gain.setTargetAtTime(this.isMuted?0:this.volume, this.audioCtx.currentTime, this.RAMP_TIME);
    } 
  }
  
  setFreqVolume(v){ 
    this.freqVolume=clamp(v/100,0,1); 
    if(this.toneGain&&this.audioCtx){ 
      this.toneGain.gain.setTargetAtTime(this.freqVolume, this.audioCtx.currentTime, this.RAMP_TIME);
    } 
  }
  
  setBeat(v){ 
    this.beatFrequency=clamp(parseFloat(v),0.1,100); 
    if(!this.audioCtx) return; 
    const now=this.audioCtx.currentTime; 
    
    if(this.mode==='binaural'&&this.oscillators[1]){ 
      const leftBase=!this.swapLR; 
      const fL=leftBase?this.baseFrequency:this.baseFrequency+this.beatFrequency; 
      const fR=leftBase?this.baseFrequency+this.beatFrequency:this.baseFrequency; 
      this.oscillators[0].frequency.linearRampToValueAtTime(fL,now+this.RAMP_TIME); 
      this.oscillators[1].frequency.linearRampToValueAtTime(fR,now+this.RAMP_TIME); 
    } else if(this.mode==='isochronic'&&this.oscillators[1]) {
      this.oscillators[1].frequency.linearRampToValueAtTime(this.beatFrequency, now+this.RAMP_TIME); 
    }
    // Monaural mode: beat frequency has no effect (single steady tone only)
  }
  
  setBase(v){ 
    this.baseFrequency=clamp(parseFloat(v),20,2000); 
    if(!this.audioCtx) return; 
    const now=this.audioCtx.currentTime; 
    
    if(this.mode==='isochronic'){ 
      if(this.oscillators[0]) this.oscillators[0].frequency.linearRampToValueAtTime(this.baseFrequency, now+this.RAMP_TIME); 
    } else if(this.mode==='binaural'){ 
      const leftBase=!this.swapLR; 
      const fL=leftBase?this.baseFrequency:this.baseFrequency+this.beatFrequency; 
      const fR=leftBase?this.baseFrequency+this.beatFrequency:this.baseFrequency; 
      if(this.oscillators[0]) this.oscillators[0].frequency.linearRampToValueAtTime(fL, now+this.RAMP_TIME); 
      if(this.oscillators[1]) this.oscillators[1].frequency.linearRampToValueAtTime(fR, now+this.RAMP_TIME); 
    } else if(this.mode==='monaural'){
      // Monaural: single oscillator at base frequency
      if(this.oscillators[0]) this.oscillators[0].frequency.linearRampToValueAtTime(this.baseFrequency, now+this.RAMP_TIME);
    }
  }
  
  setTonePan(v){ 
    const p=clamp((v/100),-0.2,0.2); 
    this.tonePan=p; 
    if(this.mode!=='binaural' && this.tonePanner && this.audioCtx){ 
      this.tonePanner.pan.setTargetAtTime(p, this.audioCtx.currentTime, this.RAMP_TIME); 
    } 
  }
  
  setWidth(v){ 
    const w=clamp(v/100,0,1); 
    this.width=w; 
    this.applyWidth(); 
  }
  
  applyWidth(){ 
    if(this.mode==='binaural' && this.leftTonePanner && this.rightTonePanner){ 
      const pan=this.width; 
      this.leftTonePanner.pan.value=-pan; 
      this.rightTonePanner.pan.value=+pan; 
    } 
  }
  
  toggleSwap(){ 
    this.swapLR=!this.swapLR; 
    if(this.isPlaying){ 
      this.setupTones(); 
    } 
  }
  
  async setMode(m){ 
    if(this.mode===m) return; 
    this.mode=m; 
    this.updatePanWidthVisibility?.(); 
    if(this.isPlaying){ 
      this.setupTones(); 
    } 
  }
  
  setNoiseHP(freq){ 
    if(this.noiseHP) this.noiseHP.frequency.value=clamp(parseFloat(freq),20,2000); 
  }
  
  setNoiseLP(freq){ 
    if(this.noiseLP) this.noiseLP.frequency.value=clamp(parseFloat(freq),200,20000); 
  }
  
  setFilters(on){ 
    this.filtersEnabled=!!on; 
    if(!this.audioCtx) return; 
    try{ this.noiseGain?.disconnect(); }catch{} 
    try{ this.noiseHP?.disconnect(); }catch{} 
    try{ this.noiseLP?.disconnect(); }catch{} 
    this.equalizer?.disconnect(); 
    if (this.filtersEnabled){ 
      this.noiseHP?.connect(this.noiseLP); 
      this.noiseLP?.connect(this.noiseGain); 
    } 
    this.noiseGain?.connect(this.noisePanner).connect(this.mainMix); 
    this.eqOut=this.equalizer.connectTo(this.mainMix); 
    try{ this.analyser?.disconnect(); }catch{} 
    this.eqOut.connect(this.analyser); 
    try{ this.masterPanner?.disconnect(); }catch{} 
    this.analyser.connect(this.masterPanner).connect(this.audioCtx.destination); 
  }
}