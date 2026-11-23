// Swipe / mouse input. Shooting: swipe speed = power, end point = direction, bend = curve.
// Keeping: swipe (or tap / arrow keys) to dive toward a goal point.
import { pickGoalPoint, setReticle } from "./scene.js";
import { GW, GH } from "./match.js";
import { chargePower, moveAim, diveTarget } from './controls.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let mode=null, cb=null, pts=[], down=false, curveBias=0, sens=1, hooks={};
let aim={x:0,y:1.2}, chargeStart=null, chargeFrame=0, keepCol=1, keepRow=0;
function showAim(){ setReticle(aim.x,aim.y,true); }
function chargeTick(){
  if(chargeStart===null||mode!=='shoot')return;
  hooks.onPower?.(chargePower((performance.now()-chargeStart)/1000));
  chargeFrame=requestAnimationFrame(chargeTick);
}
function chooseKeeper(){
  const d=diveTarget(keepCol,keepRow);setReticle(d.x,d.y,true);hooks.onDive?.(keepCol,keepRow);
}

function aimFrom(x,y){
  const p=pickGoalPoint(x,y);
  if(!p) return { x:0, y:GH+1.2 };
  return { x:clamp(p.x,-(GW+0.8),GW+0.8), y:clamp(p.y,0.05,GH+1.2) };
}
function blocked(e){ return e.target.closest && e.target.closest("button,input,select,.screen,.result"); }

function onDown(e){
  if(!mode || blocked(e)) return;
  down=true; pts=[{x:e.clientX,y:e.clientY,t:performance.now()}];
}
function onMove(e){
  if(!mode) return;
  if(!down){ if(mode==="shoot" && e.pointerType==="mouse"){ const a=aimFrom(e.clientX,e.clientY); setReticle(a.x,a.y,true); } return; }
  pts.push({x:e.clientX,y:e.clientY,t:performance.now()});
  const a=aimFrom(e.clientX,e.clientY); aim=a; setReticle(a.x,a.y,true);
  if(mode==="shoot"){ const f=pts[0]; hooks.onPower?.(clamp(Math.hypot(e.clientX-f.x,e.clientY-f.y)/(innerHeight*0.45),0,1)); }
}
function onUp(e){
  if(!down || !mode) return; down=false;
  pts.push({x:e.clientX,y:e.clientY,t:performance.now()});
  const f=pts[0], l=pts[pts.length-1], dx=l.x-f.x, dy=l.y-f.y, dist=Math.hypot(dx,dy);
  if(mode==="keep"){
    const a=aimFrom(l.x,l.y);
    const dive={x:clamp(a.x,-3.1,3.1),y:clamp(a.y,0.2,GH)};
    fire(dive); return;
  }
  if(dist<40 || dy>-20){ hooks.onPower?.(0); return; } // must swipe upward
  // speed over the last ~120ms of the gesture
  let i=pts.length-1; while(i>0 && l.t-pts[i].t<120) i--;
  const s=pts[i], dt=Math.max(16,l.t-s.t), speed=Math.hypot(l.x-s.x,l.y-s.y)/dt; // px/ms
  const scale=Math.max(0.6,innerHeight/900);
  const power=clamp(speed/(2.4*scale)*sens,0.15,1);
  let dev=0; for(const p of pts){ const d=(dx*(p.y-f.y)-dy*(p.x-f.x))/dist; if(Math.abs(d)>Math.abs(dev)) dev=d; }
  const curve=clamp(dev/dist*4 + curveBias,-1,1);
  hooks.onPower?.(power);
  fire({ aim:aimFrom(l.x,l.y), power, curve });
}
function onKey(e){
  if(!mode||blocked(e))return;
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
  if(mode==="shoot"){
    if(e.code.startsWith('Arrow')){aim=moveAim(aim,e.code);showAim();return;}
    if(e.code==='Space'){
      if(chargeStart===null&&!e.repeat){chargeStart=performance.now();chargeTick();}return;
    }
    if(e.key==="q"||e.key==="Q") curveBias=clamp(curveBias-0.5,-1,1);
    else if(e.key==="e"||e.key==="E") curveBias=clamp(curveBias+0.5,-1,1);
    else return; hooks.onCurve?.(curveBias);
  } else if(mode==="keep"){
    if(e.code==='ArrowLeft')keepCol=Math.max(0,keepCol-1);
    else if(e.code==='ArrowRight')keepCol=Math.min(2,keepCol+1);
    else if(e.code==='ArrowUp')keepRow=0;
    else if(e.code==='ArrowDown')keepRow=1;
    else if(e.code==='Space'&&!e.repeat){fire(diveTarget(keepCol,keepRow));return;}
    else return;
    chooseKeeper();
  }
}
function onKeyUp(e){
  if(e.code!=='Space'||chargeStart===null)return;
  e.preventDefault();const power=chargePower((performance.now()-chargeStart)/1000);
  chargeStart=null;cancelAnimationFrame(chargeFrame);
  if(mode==='shoot'){hooks.onPower?.(power);fire({aim:{...aim},power,curve:curveBias});}
}
function fire(v){ const c=cb; mode=null; cb=null; down=false;chargeStart=null;cancelAnimationFrame(chargeFrame);setReticle(0,0,false); c&&c(v); }

export function init(h={}){
  hooks=h;
  addEventListener("pointerdown",onDown); addEventListener("pointermove",onMove);
  addEventListener("pointerup",onUp); addEventListener("pointercancel",()=>{ down=false; });
  addEventListener("keydown",onKey);addEventListener('keyup',onKeyUp);
  addEventListener('blur',()=>{down=false;chargeStart=null;cancelAnimationFrame(chargeFrame);hooks.onPower?.(0);});
  document.getElementById('app').addEventListener('pointerdown',e=>{
    const target=e.target.closest('[data-dive]');if(mode!=='keep'||!target)return;
    e.preventDefault();keepCol=Number(target.dataset.col);keepRow=Number(target.dataset.row);chooseKeeper();fire(diveTarget(keepCol,keepRow));
  });
}
export function setSensitivity(v){ sens=v||1; }
export function setMode(m, callback){
  mode=m; cb=callback||null; down=false; pts=[];chargeStart=null;cancelAnimationFrame(chargeFrame);
  if(m==='shoot'){aim={x:0,y:1.2};curveBias=0;hooks.onCurve?.(0);hooks.onPower?.(0);showAim();}
  if(m==='keep'){keepCol=1;keepRow=0;chooseKeeper();}
  if(!m)setReticle(0,0,false);
}
export function getMode(){ return mode; }
