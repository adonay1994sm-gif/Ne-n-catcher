import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/game/07-player-item-rendering.js',import.meta.url),'utf8');
function renderHarness(){
 const calls=[],ctx={save(){},restore(){},drawImage(...args){calls.push({type:'image',args});},translate(x,y){calls.push({type:'translate',x,y});},rotate(angle){calls.push({type:'rotate',angle});}};
 const sandbox=vm.createContext({ctx,SPRITES:{hostileOrdnance:{naturalWidth:1024}},spriteReady:x=>Boolean(x?.naturalWidth)});
 vm.runInContext(source.slice(0,source.indexOf('  function drawArcadePulse(')),sandbox);
 return{sandbox,calls};
}
test('enemy artwork follows the physical velocity, renders no aim guide and cannot emit another shot',()=>{
 const h=renderHarness();const projectile={x:321,y:445,vx:150,vy:400,rot:0,life:4};
 const before=structuredClone(projectile);h.sandbox.drawAtlasProjectile(projectile);
 assert.deepEqual(projectile,before);const drawn=h.calls.find(x=>x.type==='image').args;
 assert.deepEqual(drawn.slice(1,5),[0,512,256,256]);
 assert.deepEqual(drawn.slice(5),[-32,-32,64,64]);
 assert.equal(h.calls.filter(x=>x.type==='rotate').reduce((s,x)=>s+x.angle,0),Math.atan2(400,150)+Math.PI/2);
});
test('Scout, Interceptor and Atlas have four actual frame crops without moving the physics pivot',()=>{
 for(let row=0;row<3;row++)for(let frame=0;frame<4;frame++){
  const h=renderHarness(),fps=row===2?10:12;
  assert.equal(h.sandbox.drawHostileOrdnance({life:6-(frame+.1)/fps},row,52),true);
  const drawn=h.calls.find(x=>x.type==='image').args;
  assert.deepEqual(drawn.slice(1),[frame*256,row*256,256,256,-26,-26,52,52]);
 }
});
test('raw scrap uses the copper token, not a misleading stellar or gold denomination',()=>{
 const h=renderHarness();h.sandbox.drawSalvagePickup({x:100,y:200,p:0,life:5,bossSalvage:true});
 assert.deepEqual(h.calls.find(x=>x.type==='image').args.slice(1),[0,768,256,256,-28,-28,56,56]);
});
test('classic CRONIUM uses authored animated sprites without live per-orb blur/gradient passes',()=>{
 const calls=[];const ctx=new Proxy({save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}},{get(o,k){if(k in o)return o[k];if(k==='createRadialGradient')return()=>{throw Error('per-orb gradient');};return undefined;},set(o,k,v){if(k==='shadowBlur')assert.equal(v,0);o[k]=v;return true;}});
 const energy={name:'cronium-energy-v2',naturalWidth:512,naturalHeight:512};
 const sandbox=vm.createContext({ctx,elapsed:0,frameFrom:()=>{throw Error('Classic must not sample old metal core');},spriteReady:image=>Boolean(image?.naturalWidth),SPRITES:{croniumEnergy:energy,croniumFragment:{}},drawImageCentered:()=>{throw Error('Classic must not draw old crystal');},itemVisualAlpha:()=>1});
 vm.runInContext(source.slice(source.indexOf('  let classicCroniumHalo='),source.indexOf('  function drawCh01Frame(')),sandbox);
 const item={x:50,y:200,r:22,phase:0,rot:1},before=structuredClone(item);
 for(let frame=0;frame<4;frame++){
  sandbox.elapsed=frame/8;sandbox.drawEnergy(item);
  assert.equal(calls[frame][0],energy);
  assert.deepEqual(calls[frame].slice(1,5),[(frame%2)*256,Math.floor(frame/2)*256,256,256]);
 }
 assert.equal(calls.length,4);assert.deepEqual(item,before);
});
