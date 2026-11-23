import { S } from "./store.js";
let ctx, master, sfxG, musG, crowdNode, crowdGain;
function init(){
  if(ctx) return;
  ctx = new (window.AudioContext||window.webkitAudioContext)();
  master = ctx.createGain(); master.connect(ctx.destination);
  sfxG = ctx.createGain(); sfxG.connect(master);
  musG = ctx.createGain(); musG.connect(master);
  apply();
  // crowd ambience: looped filtered noise
  const len = ctx.sampleRate*4, buf = ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){ const d=buf.getChannelData(c); let last=0; for(let i=0;i<len;i++){ last = last*0.97 + (Math.random()*2-1)*0.03; d[i]=last*6 + (Math.random()*2-1)*0.02; } }
  crowdNode = ctx.createBufferSource(); crowdNode.buffer=buf; crowdNode.loop=true;
  const f = ctx.createBiquadFilter(); f.type="bandpass"; f.frequency.value=700; f.Q.value=0.6;
  crowdGain = ctx.createGain(); crowdGain.gain.value=0.25;
  crowdNode.connect(f); f.connect(crowdGain); crowdGain.connect(musG); crowdNode.start();
}
export function unlock(){ init(); if(ctx.state==="suspended") ctx.resume(); }
export function apply(){ if(!ctx) return; sfxG.gain.value = S.settings.sfx; musG.gain.value = S.settings.music; }
function tone(freq, dur, type="sine", vol=0.3, when=0, slide=0, dest){
  if(!ctx) return; const t0 = ctx.currentTime+when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t0); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide), t0+dur);
  g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g); g.connect(dest||sfxG); o.start(t0); o.stop(t0+dur+0.05);
}
function noise(dur, vol=0.3, freq=1000, when=0){
  if(!ctx) return; const t0=ctx.currentTime+when;
  const b = ctx.createBuffer(1, ctx.sampleRate*dur, ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const s=ctx.createBufferSource(); s.buffer=b; const f=ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=freq;
  const g=ctx.createGain(); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(f); f.connect(g); g.connect(sfxG); s.start(t0);
}
function swell(level, dur){ if(!crowdGain) return; const t=ctx.currentTime; crowdGain.gain.cancelScheduledValues(t); crowdGain.gain.setValueAtTime(crowdGain.gain.value,t); crowdGain.gain.linearRampToValueAtTime(level,t+0.25); crowdGain.gain.linearRampToValueAtTime(0.25,t+dur); }
export const sfx = {
  click(){ tone(1400,0.05,"triangle",0.12); },
  hover(){ tone(900,0.03,"sine",0.04); },
  whistle(){ for(let i=0;i<14;i++) tone(2900 + (i%2)*180, 0.045, "square", 0.05, i*0.03); },
  kick(){ tone(140,0.18,"sine",0.7,0,-100); noise(0.08,0.4,2500); },
  goal(){ swell(1.4,3.5); tone(220,1.2,"sawtooth",0.08); tone(277,1.2,"sawtooth",0.06,0.05); noise(1.2,0.2,3000); },
  save(){ tone(90,0.25,"sine",0.6,0,-40); noise(0.15,0.35,1200); swell(0.9,2); },
  miss(){ swell(0.6,1.5); tone(300,0.5,"triangle",0.1,0,-150); },
  post(){ tone(1800,0.6,"sine",0.25); tone(2700,0.4,"sine",0.12); },
  victory(){ [523,659,784,1046].forEach((f,i)=>tone(f,0.5,"triangle",0.2,i*0.15)); tone(1046,1.4,"triangle",0.18,0.6); swell(1.3,4); },
  defeat(){ [392,349,311,262].forEach((f,i)=>tone(f,0.55,"sine",0.18,i*0.22)); },
  coin(){ tone(1318,0.08,"square",0.08); tone(1760,0.15,"square",0.08,0.07); },
};
