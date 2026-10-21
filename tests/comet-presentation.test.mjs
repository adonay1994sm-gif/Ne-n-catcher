import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../src/game/07-player-item-rendering.js',import.meta.url),'utf8');
const collisionSource=await readFile(new URL('../src/game/04-entities-collision-damage.js',import.meta.url),'utf8');
const helpers=await readFile(new URL('../src/game/02-storage-audio.js',import.meta.url),'utf8');
const threatHelper=helpers.match(/function isThreat\(item\) \{[\s\S]*?\n  \}/)[0];
function fixture(){
  const calls=[];
  const ctx=new Proxy({}, {get:(_,key)=>(...args)=>calls.push({method:key,args}),set:()=>true});
  const sandbox=vm.createContext({ctx,elapsed:1.125,SPRITES:{comet:{naturalWidth:1536,naturalHeight:384}},
    spriteReady:image=>Boolean(image),clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
  vm.runInContext(threatHelper,sandbox);vm.runInContext(collisionSource,sandbox);vm.runInContext(source,sandbox);
  const item={type:'meteor',special:'comet',flightComet:true,x:200,y:500,r:18,alpha:1,phase:0,
    vx:62,vy:82,rot:Math.atan2(82,62)};
  return{sandbox,calls,item};
}
test('a diagonal comet points along its velocity without the previous extra quarter-turn',()=>{
  const h=fixture();h.sandbox.drawMeteor(h.item);
  assert.equal(h.calls.find(c=>c.method==='rotate').args[0],Math.atan2(82,62));
});
test('vertical comets face downstream independently of decorative old rotation',()=>{
  const h=fixture();h.item.flightComet=false;h.item.rot=2.7;h.sandbox.drawMeteor(h.item);
  assert.equal(h.calls.find(c=>c.method==='rotate').args[0],Math.PI/2);
});
test('the authored nucleus pivot stays on the same physical collection/collision centre',()=>{
  const h=fixture(),before=JSON.stringify(h.item),hitbox=JSON.stringify(h.sandbox.collisionCircles(h.item));
  h.sandbox.drawMeteor(h.item);
  const draw=h.calls.find(c=>c.method==='drawImage').args;
  assert.equal(draw[5]+draw[7]*.75,0);assert.equal(draw[6]+draw[8]*.5,0);
  assert.equal(draw[7],h.item.r*7);assert.equal(JSON.stringify(h.item),before);
  assert.equal(JSON.stringify(h.sandbox.collisionCircles(h.item)),hitbox);
  assert.equal(h.sandbox.collisionCircles(h.item)[0].r,h.item.r*.94);
});
test('four actual atlas cells advance only with played time and remain fixed when paused',()=>{
  const h=fixture();h.sandbox.drawMeteor(h.item);
  const draw=()=>h.calls.filter(c=>c.method==='drawImage').at(-1).args.slice(1);
  const first=draw();h.sandbox.drawMeteor(h.item);assert.deepEqual(draw(),first);
  h.sandbox.elapsed+=.125;h.sandbox.drawMeteor(h.item);
  assert.equal(draw()[0],(first[0]+384)%1536);
  const cells=new Set();for(let i=0;i<4;i++){h.sandbox.elapsed=i/8;h.sandbox.drawMeteor(h.item);cells.add(draw()[0]);}
  assert.equal(cells.size,4);
});
