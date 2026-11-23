import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chargePower,moveAim,diveTarget} from '../../public/game/js/controls.js';
import {resolveUserShot} from '../../public/game/js/match.js';
test('holding Space longer increases power and saturates',()=>{
  assert.ok(Math.abs(chargePower(0.3)-0.2)<1e-10);assert.ok(Math.abs(chargePower(0.9)-0.6)<1e-10);assert.equal(chargePower(3),1);
});
test('all four arrow keys aim in the corresponding screen direction',()=>{
  const a={x:0,y:1};assert.equal(moveAim(a,'ArrowLeft').x,-0.24);assert.equal(moveAim(a,'ArrowRight').x,0.24);
  assert.equal(moveAim(a,'ArrowUp').y,1.24);assert.equal(moveAim(a,'ArrowDown').y,0.76);
});
test('excessively charged center shots fly above the crossbar regardless of skill',()=>{
  for(let i=0;i<50;i++){
    const r=resolveUserShot({aim:{x:0,y:1.2},power:1,curve:0,attrs:{acc:99,pen:99,power:99,curve:99},diff:'normal',sideHistory:[]});
    assert.equal(r.outcome,'miss');assert.ok(r.ty>2.44);
  }
});
test('keeper prediction has distinct high and low left and right targets',()=>{
  assert.deepEqual(diveTarget(0,0),{x:-2.65,y:2.15});assert.deepEqual(diveTarget(2,1),{x:2.65,y:0.55});
});