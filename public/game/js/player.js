import * as THREE from 'three';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';
import { clone } from '../vendor/utils/SkeletonUtils.js';
let template;
export async function loadPlayers(){
  const gltf=await new GLTFLoader().loadAsync('/__l5e/assets-v1/1cb3e32c-a3da-4c9a-a857-ba79ef034cca/footballer.glb');
  template=gltf.scene;
}
export function makePlayer(o){
  if(!template) throw new Error('Player model is not ready');
  const body=clone(template), group=new THREE.Group(); group.add(body); body.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(body), size=box.getSize(new THREE.Vector3());
  const factor=1.83/size.y, center=box.getCenter(new THREE.Vector3());
  const palette=Object.fromEntries(['skin','kit','shorts','socks','boots','hairColor'].map(k=>[k,new THREE.Color(o[k])]));
  body.traverse(m=>{
    if(!m.isMesh) return;
    m.castShadow=true; m.receiveShadow=true;
    m.geometry=m.geometry.clone();
    const pos=m.geometry.attributes.position, colors=new Float32Array(pos.count*3), v=new THREE.Vector3();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);
      const h=(v.y-box.min.y)*factor, x=Math.abs((v.x-center.x)*factor);
      let c=palette.skin;
      if(m.name==='Eyebrows') c=palette.hairColor;
      else if(m.name==='Eyes') c=new THREE.Color('#f3eee6');
      else if(h>1.74) c=palette.hairColor;
      else if(h<0.13) c=palette.boots;
      else if(h<0.52) c=palette.socks;
      else if(h>0.76&&h<1.02&&x<0.33) c=palette.shorts;
      else if(h>=1.02&&h<1.52&&x<0.46) c=palette.kit;
      else if(o.gloves&&x>0.68) c=new THREE.Color(o.gloves);
      const grain=1-0.035*Math.sin(i*13.17); colors.set([c.r*grain,c.g*grain,c.b*grain],i*3);
    }
    m.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    m.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.82});
  });
  body.scale.setScalar(factor); body.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);
  const bones={}; body.traverse(b=>{if(b.isBone){bones[b.name]=b;b.userData.rest=b.quaternion.clone();}});
  group.userData={bones,body};
  posePlayer(group,'idle',0);
  return group;
}
function rotate(g,name,x=0,y=0,z=0){
  const b=g.userData.bones[name]; if(!b)return;
  b.quaternion.copy(b.userData.rest).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)));
}
export function posePlayer(g,kind,t=0,side=0){
  if(!g)return;
  const swing=Math.sin(t*12), run=kind==='run';
  for(const s of ['l','r']){
    const sign=s==='l'?1:-1;
    rotate(g,'upperarm_'+s,run?-sign*swing*0.32:0,0,-sign*1.25);
    rotate(g,'lowerarm_'+s,0.22,0,0);
    rotate(g,'thigh_'+s,run?sign*swing*0.62:0);
    rotate(g,'calf_'+s,run?Math.max(0,-sign*swing)*0.85:0.06);
  }
  rotate(g,'spine_02',run?0.12:0);
  if(kind==='kick'){
    const phase=Math.min(1,t/0.28);
    rotate(g,'thigh_r',-0.9+phase*1.65); rotate(g,'calf_r',0.65*(1-phase));
    rotate(g,'spine_02',0.12,-0.22*phase,0.08);
  }
  if(kind==='ready'){
    rotate(g,'thigh_l',-0.2,0,-0.12);rotate(g,'thigh_r',-0.2,0,0.12);
    rotate(g,'calf_l',0.32);rotate(g,'calf_r',0.32);
    rotate(g,'upperarm_l',-0.35,0,-0.85);rotate(g,'upperarm_r',-0.35,0,0.85);
  }
  if(kind==='dive'){
    const f=Math.min(1,t/0.42);
    rotate(g,'upperarm_l',-0.8*f,0,-1.25+(side<=0?1.4:0.7)*f);
    rotate(g,'upperarm_r',-0.8*f,0,1.25-(side>=0?1.4:0.7)*f);
    rotate(g,'calf_l',0.4*f);rotate(g,'calf_r',0.65*f);
  }
}