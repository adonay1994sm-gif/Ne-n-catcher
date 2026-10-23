import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {guardianAtlasAnimation} from '../src/game/animation/guardian-atlas-animator.js';
import {createGuardianAtlas,advanceGuardianAtlas,hitGuardianAtlas,
  GUARDIAN_ATLAS_RULES as R} from '../src/game/combat/guardian-atlas.js';
const sample=(state,stateTime=0,phase=1)=>({state,stateTime,phase,age:10});
function until(boss,predicate){
  for(let frame=0;frame<240*60;frame++){if(predicate(boss))return;advanceGuardianAtlas(boss,1/60,{x:360,y:1145});}
  assert.fail(`Unknown presentation state ${boss.state}`);
}

test('v2 mechanical poses cover the closed/open/exposed/closing encounter cycle',()=>{
  for(const [state,time,phase,frame]of[
    ['entry',1,1,0],['closed',.2,1,0],['charge',.2,1,2],['fire',.1,1,3],
    ['opening',R.openingSeconds,1,1],['exposed',1,1,1],['closing',R.closingSeconds,1,0],
    ['closed',.2,2,0],['charge',.2,2,2],['fire',.1,2,6],['exposed',1,2,5],
    ['phaseBreak',.6,2,2],['disabled',1,2,7]
  ]){
    const visual=guardianAtlasAnimation(sample(state,time,phase));
    assert.equal(visual.frame,frame,`${state}/${phase}`);
    assert.equal(visual.columns,4);assert.equal(visual.rows,2);
    assert.equal(visual.previousFrame,null);assert.equal(visual.blend,1);
  }
});

test('entry, patrol, charge, firing and phase break use genuinely sealed art without an obsolete armor patch',()=>{
  for(const phase of[1,2])for(const state of['entry','closed','charge','fire','phaseBreak']){
    for(const time of[0,.03,.3,1]){
      const visual=guardianAtlasAnimation(sample(state,time,phase));
      assert.equal(visual.coreCover,1);assert.equal(visual.coverFrame,0);assert.equal(visual.coverRect,null);
      assert.ok([0,2,3,6].includes(visual.frame),`${state}/${phase} cannot show a vulnerable core`);
      assert.ok(visual.previousFrame===null||[0,2,3,6].includes(visual.previousFrame));
    }
  }
});

test('v2 registers eight distinct complete 512px cells with uniform reactor pivots and transparent gutters',async()=>{
  const metadata=JSON.parse(await readFile(new URL('../art-source/atlas-repair-v2/metadata.json',import.meta.url),'utf8'));
  const qa=JSON.parse(await readFile(new URL('../art-source/atlas-repair-v2/alpha-qa.json',import.meta.url),'utf8'));
  assert.equal(metadata.runtime,'assets/guardian_atlas_states_v2.webp');
  assert.deepEqual(metadata.dimensions,[2048,1024]);assert.deepEqual(metadata.cellDimensions,[512,512]);
  assert.equal(metadata.frames.length,8);assert.equal(qa.frames.length,8);
  assert.equal(new Set(metadata.frames.map(frame=>frame.sha256Rgba)).size,8);
  assert.ok(qa.checks.every(check=>check.passed));
  for(const [index,frame]of metadata.frames.entries()){
    assert.deepEqual(frame.rect,[(index%4)*512,Math.floor(index/4)*512,512,512]);
    assert.deepEqual(frame.pivot,{x:.5,y:.5});
    assert.ok(frame.alpha8Margins.every(margin=>margin>=32),`${index}: authored metal and visible glow cannot touch a cell edge`);
    assert.ok(qa.frames[index].padding.every(margin=>margin>=24),`${index}: even faint alpha has a real gutter`);
  }
  assert.equal(metadata.frames[3].state,'fire-closed');assert.equal(metadata.frames[6].state,'phase-two-fire-closed');
});

test('opening exposes the core and closing restores shutters using the encounter exposure value',()=>{
  for(const phase of[1,2]){
    const openFrame=phase===1?1:5;
    const opening=guardianAtlasAnimation({...sample('opening',.01,phase),coreExposure:.5});
    assert.equal(opening.frame,openFrame);assert.equal(opening.previousFrame,0);
    assert.equal(opening.blend,.5);assert.equal(opening.coreCover,.5);
    const exposed=guardianAtlasAnimation({...sample('exposed',2,phase),coreExposure:1});
    assert.equal(exposed.frame,openFrame);assert.equal(exposed.coreCover,0);
    const closing=guardianAtlasAnimation({...sample('closing',.01,phase),coreExposure:.5});
    assert.equal(closing.frame,0);assert.equal(closing.previousFrame,openFrame);
    assert.equal(closing.blend,.5);assert.equal(closing.coreCover,.5);
  }
});

test('the simulation coreExposure controls both transition blending and cover semantics rather than a renderer clock',()=>{
  const visual=guardianAtlasAnimation({...sample('fire',.1),coreExposure:0});
  assert.equal(visual.frame,3);assert.equal(visual.coreCover,1);assert.equal(visual.coverRect,null);
  for(const phase of[1,2])for(const exposure of[0,.25,.8,1]){
    const opening=guardianAtlasAnimation({...sample('opening',.6,phase),coreExposure:exposure});
    assert.equal(opening.blend,exposure);assert.equal(opening.coreCover,1-exposure);
    const closing=guardianAtlasAnimation({...sample('closing',.5,phase),coreExposure:exposure});
    assert.equal(closing.blend,1-exposure);assert.equal(closing.coreCover,1-exposure);
  }
  assert.equal(guardianAtlasAnimation({...sample('opening',.1),coreExposure:-2}).blend,0);
  assert.equal(guardianAtlasAnimation({...sample('opening',.1),coreExposure:2}).blend,1);
});

test('legacy isolated fixtures may fall back to their state age without creating another animation scheduler',()=>{
  for(const phase of[1,2]){
    const opening=guardianAtlasAnimation(sample('opening',R.openingSeconds/2,phase));
    const closing=guardianAtlasAnimation(sample('closing',R.closingSeconds/2,phase));
    assert.equal(opening.blend,.5);assert.equal(opening.coreCover,.5);
    assert.equal(closing.blend,.5);assert.equal(closing.coreCover,.5);
  }
});

test('charge deploys a sealed weapon pose without opening the core or repeatedly firing',()=>{
  const beginning=guardianAtlasAnimation(sample('charge'));
  assert.equal(beginning.frame,2);assert.equal(beginning.previousFrame,0);assert.equal(beginning.blend,0);
  assert.equal(beginning.coreCover,1);
  assert.equal(guardianAtlasAnimation(sample('charge',.09)).blend,.5);
  const deployed=guardianAtlasAnimation(sample('charge',.18));assert.equal(deployed.previousFrame,null);
  assert.equal(deployed.blend,1);assert.equal(deployed.coreCover,1);
});

test('a real phase-one hit shows the authored damaged open pose only during its short hit flash',()=>{
  const boss=createGuardianAtlas();until(boss,b=>b.state==='exposed');const time=boss.stateTime;
  hitGuardianAtlas(boss,1);const visual=guardianAtlasAnimation(boss);
  assert.equal(boss.state,'exposed');assert.equal(boss.stateTime,time);assert.equal(visual.frame,4);
  assert.equal(visual.previousFrame,null);assert.equal(visual.impactFlash,1);assert.equal(visual.coreCover,0);
  const fading=guardianAtlasAnimation({...boss,flash:.07});
  assert.equal(fading.frame,4);assert.equal(fading.previousFrame,1);assert.equal(fading.blend,.5);
  const faded=guardianAtlasAnimation({...boss,flash:0});assert.equal(faded.frame,1);assert.equal(faded.previousFrame,null);
  for(const state of['entry','closed','charge','fire','opening','closing','phaseBreak','disabled']){
    assert.notEqual(guardianAtlasAnimation({...sample(state,.1),flash:.14}).frame,4,`Damage pose must not open armor in ${state}`);
  }
});

test('phase-two impact preserves the split ring instead of restoring the phase-one hurt pose or changing its clock',()=>{
  // Furia al 30 % de vida (spec §6.11, plan F3c).
  const boss=createGuardianAtlas();until(boss,b=>b.state==='exposed');hitGuardianAtlas(boss,boss.maxHp-Math.floor(boss.maxHp*.3));
  assert.equal(boss.state,'phaseBreak');assert.equal(guardianAtlasAnimation(boss).frame,2);
  until(boss,b=>b.state==='exposed');const time=boss.stateTime;
  hitGuardianAtlas(boss,1);const visual=guardianAtlasAnimation(boss);
  assert.equal(boss.state,'exposed');assert.equal(boss.stateTime,time);
  assert.equal(visual.frame,5);assert.equal(visual.previousFrame,null);assert.equal(visual.coreCover,0);
  assert.equal(visual.impactFlash,1);
});

test('deactivation reveals a restored cyan core for a visible nonlooping terminal sequence',()=>{
  const first=guardianAtlasAnimation(sample('disabled',0,2));
  assert.equal(first.frame,7);assert.equal(first.previousFrame,5);assert.equal(first.blend,0);assert.equal(first.coreCover,0);
  const midpoint=guardianAtlasAnimation(sample('disabled',.3,2));assert.equal(midpoint.blend,.5);
  const final=guardianAtlasAnimation(sample('disabled',.6,2));assert.equal(final.previousFrame,null);
  for(const time of[1.55,5,60])assert.deepEqual(guardianAtlasAnimation(sample('disabled',time,2)),final);
});

test('sampling is read-only and the real route pause freezes poses, shutters and impact flash exactly',()=>{
  const boss=createGuardianAtlas();until(boss,b=>b.state==='opening');advanceGuardianAtlas(boss,.05,{x:360,y:1145});
  const before=structuredClone(boss),frozen=Object.freeze(structuredClone(boss)),visual=guardianAtlasAnimation(frozen);
  for(let frame=0;frame<1000;frame++)assert.deepEqual(guardianAtlasAnimation(frozen),visual);
  assert.deepEqual(boss,before);let events=0;
  advanceGuardianAtlas(boss,0,{x:119,y:900},()=>events++);
  assert.deepEqual(boss,before);assert.deepEqual(guardianAtlasAnimation(boss),visual);assert.equal(events,0);
});

test('repeated pose reads cannot duplicate combat projectiles, state transitions or terminal rewards',()=>{
  const boss=createGuardianAtlas();until(boss,b=>b.state==='charge');
  const readModel=structuredClone(boss);
  for(let index=0;index<500;index++)guardianAtlasAnimation(boss);
  assert.deepEqual(boss,readModel);
  const withReads=structuredClone(boss),withoutReads=structuredClone(boss),readEvents=[],referenceEvents=[];
  for(let frame=0;frame<360;frame++){
    for(let sample=0;sample<10;sample++)guardianAtlasAnimation(withReads);
    advanceGuardianAtlas(withReads,1/60,{x:360,y:1145},event=>readEvents.push(event));
    advanceGuardianAtlas(withoutReads,1/60,{x:360,y:1145},event=>referenceEvents.push(event));
  }
  assert.deepEqual(withReads,withoutReads);assert.deepEqual(readEvents,referenceEvents);
  const ids=readEvents.filter(event=>event.type==='projectile').map(event=>event.projectile.projectileId);
  assert.ok(ids.length>0);assert.equal(new Set(ids).size,ids.length);
});

test('invalid presentation states and clocks fail clearly instead of sampling an unrelated pose',()=>{
  for(const value of[undefined,{},sample('idle'),sample('hurt'),sample('destroy'),sample('closed',-1),
    sample('closed',NaN),sample('closed',Infinity),sample('closed',0,3)])assert.throws(()=>guardianAtlasAnimation(value));
});

test('presentation owns no scheduler, random source, combat mutation or event emitter',async()=>{
  const source=await readFile(new URL('../src/game/animation/guardian-atlas-animator.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|Math\.random|hitGuardianAtlas|advanceGuardianAtlas/);
});
