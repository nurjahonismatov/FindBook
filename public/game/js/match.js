// Pure game rules: shootout state, outcome resolution, AI decisions. No DOM / three.js.
import { DIFF } from "./data.js";
import { OVERPOWER } from './controls.js';
export const GW = 3.66, GH = 2.44;
const gauss = () => { let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function newShootout(){ return { home:[], away:[] }; }
export const goalsOf = arr => arr.filter(Boolean).length;
export function nextShooter(m){ return m.home.length===m.away.length ? "home" : "away"; }
export function isSudden(m){ return m.home.length>5 || (m.home.length===5 && m.away.length===5 && goalsOf(m.home)===goalsOf(m.away)) || m.away.length>5; }
/** returns "home" | "away" | null */
export function winner(m){
  const h=m.home.length, a=m.away.length, gH=goalsOf(m.home), gA=goalsOf(m.away);
  if(h<=5 && a<=5){
    if(gH + (5-h) < gA) return "away";
    if(gA + (5-a) < gH) return "home";
    if(h===5 && a===5 && gH!==gA) return gH>gA?"home":"away";
    return null;
  }
  if(h===a && gH!==gA) return gH>gA?"home":"away";
  return null;
}

function classify(tx,ty){
  const ax=Math.abs(tx);
  if(ty<0.02) return "miss";
  if((ax>GW-0.12 && ax<GW+0.14 && ty<GH+0.1) || (ty>GH-0.1 && ty<GH+0.14 && ax<GW+0.1)) return "post";
  if(ax>GW-0.1 || ty>GH-0.1) return "miss";
  return "in";
}

/** User shooting. aim {x,y}, power 0..1, curve -1..1, attrs, diff key, history of user shot sides */
export function resolveUserShot({ aim, power, curve, attrs, diff, sideHistory }){
  const d=DIFF[diff];
  const skill=(attrs.acc*0.6+attrs.pen*0.4)/100;
  const sigma=(1-skill)*0.75 + Math.max(0,power-0.85)*2.4;
  let tx=aim.x + gauss()*sigma, ty=aim.y + gauss()*sigma*0.6 + Math.max(0,power-0.9)*9 - Math.max(0,0.3-power)*1.2;
  if(power>OVERPOWER){
    tx+=gauss()*(power-OVERPOWER)*10;
    ty=Math.max(GH+0.3+(power-OVERPOWER)*12,ty);
  }
  const T=clamp(1.0 - power*0.5 - attrs.power/100*0.12, 0.34, 1.1);
  const arc=Math.max(0,(0.55-power))*1.2;
  const kind=classify(tx,ty);
  // keeper AI: reads the shot or guesses using the shooter's tendencies
  const corner=clamp(Math.abs(tx)/GW,0,1)*0.6 + clamp(ty/GH,0,1)*0.4;
  let read=d.read*(1-corner*0.45)*(1-Math.abs(curve)*attrs.curve/100*0.35)*(1.15-power*0.3);
  let kx, ky;
  if(Math.random()<read){ kx=tx+gauss()*0.45; ky=ty+gauss()*0.3; }
  else if(Math.random()<d.mind && sideHistory.length>=2){
    const l=sideHistory.filter(s=>s<0).length, r=sideHistory.length-l; kx=(l>r?-1:1)*(1.5+Math.random()*1.5); ky=0.5+Math.random()*1.4;
  } else { const z=Math.floor(Math.random()*3)-1; kx=z*(1.6+Math.random()*1.4); ky=0.4+Math.random()*1.6; }
  const kdelay=d.react*(0.7+Math.random()*0.6);
  let outcome = kind==="in" ? "goal" : kind;
  if(kind==="in"){
    const f=clamp((T-kdelay)/0.42,0,1); const ex=kx*f, ey=0.9+(ky-0.9)*f;
    const reach=d.reach*(1.15-power*0.35);
    if(Math.hypot(ex-tx,(ey-ty)*0.9)<reach) outcome="save";
  }
  return { tx, ty, T, arc, curve: curve*attrs.curve/100, kx, ky, kdelay, outcome };
}

/** AI shooting at the user keeper. keeperHistory = sides the user dived recently */
export function planAIShot({ diff, keeperHistory }){
  const d=DIFF[diff];
  let side = Math.random()<0.5?-1:1;
  if(Math.random()<d.mind && keeperHistory.length>=2){ const l=keeperHistory.filter(s=>s<0).length; side = l>keeperHistory.length/2 ? 1 : -1; }
  const center = Math.random()<0.12;
  let ax = center ? (Math.random()-0.5)*1.2 : side*(1.6 + Math.random()*1.7*d.acc + 0.2);
  let ay = 0.25 + Math.random()*(1.2+d.acc);
  const sigma=(1-d.acc)*1.1;
  const tx=ax+gauss()*sigma, ty=ay+gauss()*sigma*0.5;
  const power=0.55+Math.random()*0.4*(0.5+d.acc*0.5);
  const T=clamp(0.95-power*0.5,0.42,1);
  return { tx, ty, T, power, arc:Math.max(0,0.5-power)*1.2, curve:(Math.random()-0.5)*d.acc*0.6, kind:classify(tx,ty) };
}
/** user keeper outcome: dive point (or null), seconds after kick the dive started */
export function resolveUserSave(shot, dive, attrs){
  if(shot.kind!=="in") return shot.kind;
  if(!dive) return Math.hypot(shot.tx,shot.ty-0.9)<0.75 ? "save" : "goal";
  const f=clamp((shot.T-dive.delay)/0.42,0,1); const ex=dive.x*f, ey=0.9+(dive.y-0.9)*f;
  const reach=0.85+(attrs.reflex+attrs.dive)/200*0.75;
  return Math.hypot(ex-shot.tx,(ey-shot.ty)*0.9)<reach ? "save" : "goal";
}
export function simulateMatch(rA, rB){ const p=0.5+(rA-rB)*0.03; return Math.random()<p ? "a" : "b"; }
