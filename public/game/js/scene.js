import * as THREE from "three";
import { loadPlayers, makePlayer, posePlayer } from "./player.js";
export { makePlayer } from "./player.js";

const GW = 3.66, GH = 2.44, SPOT = 11, BR = 0.11;
let renderer, scene, camera, clock, crowd, crowdHeads, crowdData = [], lightsArr = [], adTex, dust, ballMesh, reticle, keeper, shooter, sunTint;
let mode = "menu", camMode = "camPlayer", anim = null, idleT = 0, hype = 0;
const ray = new THREE.Raycaster(), goalPlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
export const GOAL = { GW, GH, SPOT };

function canvasTex(w,h,draw){ const c=document.createElement("canvas"); c.width=w; c.height=h; draw(c.getContext("2d"),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }

function pitchTexture(){
  const PX=14, W=68, D=64, z0=-8; // plane spans z -8..56
  return canvasTex(W*PX, D*PX, (g,w,h)=>{
    for(let i=0;i<16;i++){ g.fillStyle = i%2 ? "#448a35" : "#50983b"; g.fillRect(0, i*h/16, w, h/16+1); }
    // Fine grass blades and mowing grain
    for(let i=0;i<65000;i++){const x=Math.random()*w,y=Math.random()*h;g.strokeStyle=Math.random()<.5?"rgba(185,210,105,0.14)":"rgba(13,58,18,0.17)";g.beginPath();g.moveTo(x,y);g.lineTo(x+0.6,y-3);g.stroke();}
    // subtle grain
    for(let i=0;i<9000;i++){ g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?40:255},0,0.035)`; g.fillRect(Math.random()*w,Math.random()*h,2,2); }
    const X = x => (x + W/2)*PX, Z = z => (z - z0)*PX;
    g.strokeStyle="rgba(255,255,255,0.92)"; g.lineWidth=0.12*PX;
    g.beginPath(); g.moveTo(0,Z(0)); g.lineTo(w,Z(0)); g.stroke();
    g.strokeRect(X(-9.16),Z(0),18.32*PX,5.5*PX);
    g.strokeRect(X(-20.16),Z(0),40.32*PX,16.5*PX);
    g.beginPath(); g.arc(X(0),Z(11),9.15*PX, Math.PI*0.2, Math.PI*0.8); g.stroke();
    g.fillStyle="#fff"; g.beginPath(); g.arc(X(0),Z(11),0.16*PX,0,Math.PI*2); g.fill();
  });
}
function netTexture(){ return canvasTex(256,256,(g,w,h)=>{ g.clearRect(0,0,w,h); g.strokeStyle="rgba(240,244,255,0.85)"; g.lineWidth=2; for(let i=0;i<=w;i+=16){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,h); g.stroke(); g.beginPath(); g.moveTo(0,i); g.lineTo(w,i); g.stroke(); } }); }
function adTexture(){
  const t = canvasTex(2048,64,(g,w,h)=>{ g.fillStyle="#e8e9e4"; g.fillRect(0,0,w,h);
    const words=["FINAL KICK","PENALTY NIGHT","★","3D SHOOTOUT","★"]; g.font="800 40px 'Saira Condensed', sans-serif"; g.textBaseline="middle";
    let x=20; for(let r=0;r<4;r++) for(const wd of words){ g.fillStyle = wd==="★" ? "#26824c" : "#18262d"; g.fillText(wd,x,h/2+2); x += g.measureText(wd).width+50; } });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(3,1); return t;
}

function buildStadium(){
  const pitch=new THREE.Mesh(new THREE.PlaneGeometry(68,64), new THREE.MeshStandardMaterial({ map:pitchTexture(), roughness:0.95 }));
  pitch.rotation.x=-Math.PI/2; pitch.position.z=24; pitch.receiveShadow=true; scene.add(pitch);
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({color:"#1d4a26",roughness:1})); outer.rotation.x=-Math.PI/2; outer.position.y=-0.01; outer.receiveShadow=true; scene.add(outer);
  // goal
  const post=new THREE.MeshStandardMaterial({color:"#f4f6fa",roughness:0.3,metalness:0.1});
  const cyl=(h,x,y,z,rz=0)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,h,16),post); m.position.set(x,y,z); m.rotation.z=rz; m.castShadow=true; scene.add(m); };
  cyl(GH,-GW,GH/2,0); cyl(GH,GW,GH/2,0); cyl(GW*2+0.12,0,GH,0,Math.PI/2);
  const nt=netTexture(); nt.wrapS=nt.wrapT=THREE.RepeatWrapping;
  const nm=(w,h)=>{ const t=nt.clone(); t.needsUpdate=true; t.repeat.set(w*0.5,h*0.5); return new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:0.02,side:THREE.DoubleSide,roughness:1}); };
  const back=new THREE.Mesh(new THREE.PlaneGeometry(GW*2,GH),nm(GW*2,GH)); back.position.set(0,GH/2,-2); back.rotation.x=-0.25; scene.add(back);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(GW*2,1.8),nm(GW*2,1.8)); top.rotation.x=-Math.PI/2+0.1; top.position.set(0,GH-0.05,-0.95); scene.add(top);
  for(const s of [-1,1]){ const sd=new THREE.Mesh(new THREE.PlaneGeometry(2.1,GH),nm(2.1,GH)); sd.rotation.y=Math.PI/2; sd.position.set(GW*s,GH/2,-1); scene.add(sd); }
  // ad boards
  adTex=adTexture();
  const adm=new THREE.MeshBasicMaterial({map:adTex});
  const ad=(w,x,z,ry)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.9,0.15),[new THREE.MeshStandardMaterial({color:"#0a1020"}),new THREE.MeshStandardMaterial({color:"#0a1020"}),new THREE.MeshStandardMaterial({color:"#0a1020"}),new THREE.MeshStandardMaterial({color:"#0a1020"}),adm,adm]); m.position.set(x,0.45,z); m.rotation.y=ry; scene.add(m); };
  ad(60,0,-6,0); ad(50,-30,20,Math.PI/2); ad(50,30,20,-Math.PI/2);
  // stands
  const standMat=new THREE.MeshStandardMaterial({color:"#1a1f2b",roughness:0.9});
  const seats=[];
  const tier=(cx,cz,len,ry)=>{
    const grp=new THREE.Group(); grp.position.set(cx,0,cz); grp.rotation.y=ry; scene.add(grp);
    for(let r=0;r<14;r++){ const st=new THREE.Mesh(new THREE.BoxGeometry(len,0.9,1.4),standMat); st.position.set(0,1.2+r*0.9,-r*1.4); st.receiveShadow=true; grp.add(st);
      for(let i=0;i<len/0.9;i++){ if(Math.random()<0.1) continue; seats.push({grp, x:-len/2+0.45+i*0.9+(Math.random()-.5)*0.2, y:1.95+r*0.9, z:-r*1.4, ph:Math.random()*6.28}); } }
    const roof=new THREE.Mesh(new THREE.BoxGeometry(len,0.4,22), new THREE.MeshStandardMaterial({color:"#0d1118",roughness:0.6,metalness:0.4})); roof.position.set(0,17,-10); grp.add(roof);
  };
  tier(0,-9,70,0); tier(-34,22,62,Math.PI/2); tier(34,22,62,-Math.PI/2); tier(0,58,70,Math.PI);
  // crowd instanced
  const geo=new THREE.CapsuleGeometry(0.17,0.27,2,5); const mat=new THREE.MeshStandardMaterial({roughness:0.8});
  crowd=new THREE.InstancedMesh(geo,mat,seats.length); const palette=["#d8dde8","#1c2a52","#c8102e","#2a6fdb","#f2c14e","#2b2f3a","#e85d2a","#16a37a","#efefef"];
  const m4=new THREE.Matrix4(), col=new THREE.Color();
  seats.forEach((s,i)=>{ s.grp.updateMatrixWorld(true); const v=new THREE.Vector3(s.x,s.y,s.z).applyMatrix4(s.grp.matrixWorld); crowdData.push({p:v, ph:s.ph}); m4.makeTranslation(v.x,v.y,v.z); crowd.setMatrixAt(i,m4); crowd.setColorAt(i,col.set(palette[(Math.random()*palette.length)|0]).multiplyScalar(0.6+Math.random()*0.5)); });
  scene.add(crowd);
  crowdHeads=new THREE.InstancedMesh(new THREE.SphereGeometry(0.105,6,4),new THREE.MeshStandardMaterial({roughness:0.9}),seats.length);
  crowdData.forEach((c,i)=>{m4.makeTranslation(c.p.x,c.p.y+0.4,c.p.z);crowdHeads.setMatrixAt(i,m4);crowdHeads.setColorAt(i,col.set(["#c28d6c","#e2b595","#835440"][i%3]));});scene.add(crowdHeads);
  // Aisles and safety rails give the terraces scale.
  const railMaterial=new THREE.MeshStandardMaterial({color:"#b9c1c2",metalness:0.55,roughness:0.4});
  for(let x=-30;x<=30;x+=10){const rail=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,17),railMaterial);rail.position.set(x,7,-18);rail.rotation.x=-0.55;scene.add(rail);}

  // floodlights
  for(const [x,z] of [[-30,-8],[30,-8],[-30,52],[30,52]]){
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.6,30,8),new THREE.MeshStandardMaterial({color:"#2a2f3a",metalness:0.6,roughness:0.4})); tower.position.set(x*1.15,15,z+(z<0?-6:6)); scene.add(tower);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(6,3,0.4),new THREE.MeshBasicMaterial({color:"#ffffff"})); panel.position.set(x*1.15,30,z+(z<0?-6:6)); panel.lookAt(0,0,10); scene.add(panel);
    lightsArr.push(panel);
  }
  // ambient & key lights
  scene.add(new THREE.HemisphereLight("#e9eff4","#667b46",1.0));
  const key=new THREE.SpotLight("#ffffff",600,120,0.55,0.6,1.6); key.position.set(-22,32,-14); key.target.position.set(0,0,6); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.bias=-0.0004; scene.add(key,key.target);
  const key2=new THREE.SpotLight("#ffffff",450,120,0.55,0.6,1.6); key2.position.set(24,32,34); key2.target.position.set(0,0,8); key2.castShadow=true; key2.shadow.mapSize.set(1024,1024); scene.add(key2,key2.target);
  sunTint=[key,key2];
  const fill=new THREE.DirectionalLight("#fff5dd",1.3); fill.position.set(-8,18,25);fill.castShadow=true;fill.shadow.mapSize.set(2048,2048);fill.shadow.camera.left=-22;fill.shadow.camera.right=22;fill.shadow.camera.top=24;fill.shadow.camera.bottom=-16;fill.shadow.bias=-0.0004;scene.add(fill);
  const pmrem=new THREE.PMREMGenerator(renderer);const envScene=new THREE.Scene();envScene.background=new THREE.Color("#cdd6d8");const softbox=new THREE.Mesh(new THREE.BoxGeometry(30,1,30),new THREE.MeshBasicMaterial({color:"#ffffff"}));softbox.position.y=12;envScene.add(softbox);scene.environmentIntensity=0.25;scene.environment=pmrem.fromScene(envScene,0.02).texture;pmrem.dispose();
  // dust particles
  const N=600, pos=new Float32Array(N*3); for(let i=0;i<N;i++){ pos[i*3]=(Math.random()-.5)*60; pos[i*3+1]=Math.random()*25; pos[i*3+2]=Math.random()*60-10; }
  const dg=new THREE.BufferGeometry(); dg.setAttribute("position",new THREE.BufferAttribute(pos,3));
  dust=new THREE.Points(dg,new THREE.PointsMaterial({color:"#cfe0ff",size:0.09,transparent:true,opacity:0.55,depthWrite:false})); scene.add(dust);
}

function ballTex(color){ return canvasTex(256,128,(g,w,h)=>{ g.fillStyle=color; g.fillRect(0,0,w,h); g.fillStyle="#141821";
  for(let i=0;i<10;i++){ const x=(i%5)*w/5+(i>4?w/10:0), y=i>4?h*0.72:h*0.28; g.beginPath(); for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; g.lineTo(x+Math.cos(a)*16,y+Math.sin(a)*16);} g.fill(); } }); }

export async function initScene(canvas){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene(); scene.background=new THREE.Color("#909da4"); scene.fog=new THREE.Fog("#909da4",65,180);
  camera=new THREE.PerspectiveCamera(50,1,0.1,300);
  clock=new THREE.Clock();
  buildStadium();
  ballMesh=new THREE.Mesh(new THREE.SphereGeometry(BR,32,20),new THREE.MeshStandardMaterial({map:ballTex("#ffffff"),roughness:0.45}));
  ballMesh.castShadow=true; scene.add(ballMesh); ballMesh.position.set(0,BR,SPOT);
  const rg=new THREE.Group();
  rg.add(new THREE.Mesh(new THREE.RingGeometry(0.22,0.28,40),new THREE.MeshBasicMaterial({color:"#3d9bff",transparent:true,opacity:0.95,depthTest:false})));
  rg.add(new THREE.Mesh(new THREE.CircleGeometry(0.05,20),new THREE.MeshBasicMaterial({color:"#ffffff",depthTest:false})));
  const cross=new THREE.Mesh(new THREE.RingGeometry(0.36,0.38,40),new THREE.MeshBasicMaterial({color:"#2ee6a6",transparent:true,opacity:0.5,depthTest:false})); rg.add(cross);
  rg.renderOrder=10; rg.children.forEach(c=>c.renderOrder=10); rg.visible=false; rg.position.z=0.05; reticle=rg; scene.add(rg);
  resize(); addEventListener("resize",resize);
  await loadPlayers();
  renderer.setAnimationLoop(loop);
}
export function setQuality(q){ if(!renderer) return; renderer.setPixelRatio(Math.min(devicePixelRatio, q==="high"?2:q==="medium"?1.25:0.8)); renderer.shadowMap.enabled=q!=="low"; crowd.visible=true; dust.visible=q!=="low"; resize(); }
export function setCamMode(m){ camMode=m; }
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.fov = w/h<0.8 ? 68 : 50; camera.updateProjectionMatrix(); }

export function setTheme({ stadium="#ffffff", ball="#ffffff" }){
  lightsArr.forEach(p=>p.material.color.set(stadium)); sunTint.forEach(l=>l.color.set(stadium).lerp(new THREE.Color("#ffffff"),0.55));
  ballMesh.material.map=ballTex(ball); ballMesh.material.needsUpdate=true;
}
export function setMode(m){ mode=m; if(m==="menu"){ reticle.visible=false; } }

export function setupKick(shooterOpts, keeperOpts){
  if(shooter) scene.remove(shooter); if(keeper) scene.remove(keeper);
  shooter=makePlayer(shooterOpts); shooter.position.set(-0.65,0,SPOT+2.3); shooter.rotation.y=Math.PI+0.32; scene.add(shooter);
  keeper=makePlayer(keeperOpts); keeper.position.set(0,0,0.5); scene.add(keeper);
  ballMesh.position.set(0,BR,SPOT); ballMesh.rotation.set(0,0,0); anim=null; hype=0;
}
export function setReticle(x,y,vis=true){ reticle.visible=vis; reticle.position.x=x; reticle.position.y=y; }
export function pickGoalPoint(cx,cy){
  const v=new THREE.Vector2(cx/innerWidth*2-1, -(cy/innerHeight)*2+1); ray.setFromCamera(v,camera);
  const p=new THREE.Vector3(); if(!ray.ray.intersectPlane(goalPlane,p)) return null; return {x:p.x,y:p.y};
}

// Kick animation. opts: {tx,ty,T,curve,outcome:'goal'|'save'|'miss'|'post', kx,ky,kdelay}
export function playKick(o){
  return new Promise(res=>{ anim={...o, t:0, res, phase:"run", kicked:false, done:false, bv:null}; });
}
const ease = t => t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;

function stepAnim(dt){
  const a=anim; a.t+=dt;
  const RUN=0.9;
  if(a.t<RUN){
    const s=a.t/RUN;shooter.position.x=-0.65+0.4*s;shooter.position.z=SPOT+2.3-2.05*s;
    shooter.rotation.y=Math.PI+0.32*(1-s);shooter.position.y=Math.abs(Math.sin(a.t*12))*0.025;
    posePlayer(shooter,'run',a.t);
  }else if(!a.kicked){
    a.kicked=true;a.k0=a.t;shooter.position.y=0;posePlayer(shooter,'kick',0);a.onKick?.();
  }else{posePlayer(shooter,'kick',a.t-a.k0);}
  const kt=a.t-RUN-a.kdelay, K=keeper;
  if(a.t<RUN){K.position.x=Math.sin(a.t*5)*0.08;posePlayer(K,'ready',a.t);}
  else if(a.kx!==null&&kt>0){
    const s=Math.min(1,kt/0.42),e=ease(s),kx=Math.max(-3.1,Math.min(3.1,a.kx)),side=Math.sign(kx),far=Math.min(1,Math.abs(kx)/2.6);
    K.position.x=kx*e;K.position.y=Math.max(0,a.ky-1.0)*0.55*e+Math.sin(s*Math.PI)*0.35*far;
    K.rotation.z=-side*far*1.22*e;posePlayer(K,'dive',kt,side);
  }
  // ball
  if(a.kicked){ const bt=a.t-a.k0; const s=Math.min(1,bt/a.T);
    if(!a.bv){ const sx=a.tx, sy=a.ty;
      ballMesh.position.set( sx*s + a.curve*Math.sin(Math.PI*s)*1.3, BR+(sy-BR)*s + a.arc*Math.sin(Math.PI*s), SPOT*(1-s) );
      ballMesh.rotation.x-=dt*30; ballMesh.rotation.y+=a.curve*dt*20;
      if(s>=1){ const end=ballMesh.position.clone(); if(a.outcomeFn) a.outcome=a.outcomeFn();
        if(a.outcome==="goal") a.bv=new THREE.Vector3(a.curve*-1.5, -1, -14);
        else if(a.outcome==="save") a.bv=new THREE.Vector3((Math.random()-.5)*6+Math.sign(end.x)*3, 3, 8);
        else if(a.outcome==="post") a.bv=new THREE.Vector3(-Math.sign(end.x)*3, 1, 9);
        else a.bv=new THREE.Vector3(a.curve*-2+Math.sign(end.x)*2, (end.y>GH?2:-0.5), -16);
        a.hit=a.t; a.onArrive&&a.onArrive(); }
    } else { a.bv.y-=9.8*dt; const p=ballMesh.position; p.addScaledVector(a.bv,dt);
      if(a.outcome==="goal" && p.z<-1.85){ p.z=-1.85; a.bv.z*=-0.15; a.bv.x*=0.5; }
      if(p.y<BR){ p.y=BR; a.bv.y*=-0.45; a.bv.x*=0.8; a.bv.z*=0.8; }
      ballMesh.rotation.x-=dt*a.bv.z*3; }
    if(a.hit && a.t-a.hit>1.4 && !a.done){ a.done=true; a.res(a.outcome); }
  }
}

function loop(){
  const dt=Math.min(clock.getDelta(),0.05), T=clock.elapsedTime; idleT+=dt;
  if(mode==="menu"){ const r=24, ang=T*0.06; camera.position.set(Math.sin(ang)*r, 7+Math.sin(T*0.2)*1.5, 8+Math.cos(ang)*r); camera.lookAt(0,2,4); }
  else { const target = camMode==="camPlayer" ? new THREE.Vector3(camera.aspect<0.8?-0.28:0,2.15,SPOT+(camera.aspect<0.8?6.2:5.0)) : new THREE.Vector3(5.5,5.2,SPOT+11);
    if(anim&&anim.kicked&&!anim.done){ target.lerp(new THREE.Vector3(ballMesh.position.x*0.3,1.6,SPOT+3),0.25); }
    camera.position.lerp(target,1-Math.exp(-4*dt)); camera.lookAt(0,0.9,1.5); }
  if(anim&&!anim.done) stepAnim(dt);
  else if(shooter){posePlayer(shooter,"idle",T);if(!anim)posePlayer(keeper,"ready",T);}
  if(anim&&anim.done&&anim.outcome==="goal"){ hype=Math.min(1,hype+dt); }
  // crowd bob
  const m4=new THREE.Matrix4(), amp=0.05+hype*0.35, sp=3+hype*6;
  for(let i=0;i<crowdData.length;i+=1){ const c=crowdData[i]; m4.makeTranslation(c.p.x, c.p.y+Math.max(0,Math.sin(T*sp+c.ph))*amp, c.p.z); crowd.setMatrixAt(i,m4);m4.makeTranslation(c.p.x,c.p.y+0.4+Math.max(0,Math.sin(T*sp+c.ph))*amp,c.p.z);crowdHeads.setMatrixAt(i,m4); }
  crowd.instanceMatrix.needsUpdate=true;crowdHeads.instanceMatrix.needsUpdate=true;
  adTex.offset.x=(T*0.04)%1;
  const dp=dust.geometry.attributes.position.array; for(let i=1;i<dp.length;i+=3){ dp[i]+=dt*0.15; if(dp[i]>25) dp[i]=0; } dust.geometry.attributes.position.needsUpdate=true;
  reticle.children[2].scale.setScalar(1+Math.sin(T*5)*0.08);
  renderer.render(scene,camera);renderer.domElement.dataset.sceneReady="1";
}
export function setHype(v){ hype=v; }

export function snapshot(){return {ball:ballMesh?.position.toArray(),keeper:keeper?.position.toArray(),shot:anim?{tx:anim.tx,ty:anim.ty,outcome:anim.outcome,t:anim.t}:null};}
export function sim(seconds){for(let t=0;t<seconds;t+=1/60){if(anim&&!anim.done)stepAnim(1/60);}renderer.render(scene,camera);}
