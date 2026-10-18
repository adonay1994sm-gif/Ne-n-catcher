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

test('authored mechanical poses cover the new closed/open/exposed/closing cycle',()=>{
  for(const [state,time,phase,frame]of[
    ['entry',1,1,0],['closed',.2,1,0],['charge',.2,1,2],['fire',.1,1,3],
    ['opening',R.openingSeconds,1,1],['exposed',1,1,1],['closing',R.closingSeconds,1,0],
    ['closed',.2,2,0],['charge',.2,2,2],['fire',.1,2,6],['exposed',1,2,5],
    ['phaseBreak',.6,2,5],['disabled',1,2,7]
  ]){
    const visual=guardianAtlasAnimation(sample(state,time,phase));
    assert.equal(visual.frame,frame,`${state}/${phase}`);
    assert.equal(visual.columns,4);assert.equal(visual.rows,2);
    assert.equal(visual.previousFrame,null);assert.equal(visual.blend,1);
  }
});

test('entry, patrol, charge and real firing require the authored central armor cover in both phases',()=>{
  for(const phase of[1,2])for(const state of['entry','closed','charge','fire','phaseBreak']){
    const visual=guardianAtlasAnimation(sample(state,.3,phase));
    assert.equal(visual.coreCover,1);assert.equal(visual.coverFrame,0);
    assert.deepEqual(visual.coverRect,{x:156,y:145,width:132,height:162,pivotX:66,pivotY:81,sourceCell:443.5});
  }
});

test('the armor patch uses actual source art registered to the closed reactor pivot and stays within its cell',async()=>{
  const metadata=JSON.parse(await readFile(new URL('../art-source/enemies/guardian-atlas/metadata.json',import.meta.url),'utf8'));
  const visual=guardianAtlasAnimation(sample('fire',.1)),rect=visual.coverRect;
  assert.equal(metadata.atlas.frames[visual.coverFrame],'arrival-closed');
  assert.equal(rect.x+rect.pivotX,metadata.atlas.reactorPivotsPixels[0][0]);
  assert.equal(rect.y+rect.pivotY,metadata.atlas.reactorPivotsPixels[0][1]);
  assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<metadata.atlas.baseCell&&rect.y+rect.height<metadata.atlas.baseCell);
  assert.ok(Object.isFrozen(rect),'The shared source crop must not become mutable renderer state');
});

test('opening retracts real shutters, exposes the core, then closing restores them in reverse',()=>{
  for(const phase of[1,2]){
    const openFrame=phase===1?1:5;
    const opening=guardianAtlasAnimation(sample('opening',R.openingSeconds/2,phase));
    assert.equal(opening.frame,openFrame);assert.equal(opening.previousFrame,0);
    assert.equal(opening.blend,.5);assert.equal(opening.coreCover,.5);
    const exposed=guardianAtlasAnimation(sample('exposed',2,phase));
    assert.equal(exposed.frame,openFrame);assert.equal(exposed.coreCover,0);
    const closing=guardianAtlasAnimation(sample('closing',R.closingSeconds/2,phase));
    assert.equal(closing.frame,0);assert.equal(closing.previousFrame,openFrame);
    assert.equal(closing.blend,.5);assert.equal(closing.coreCover,.5);
  }
});

test('the encounter coreExposure overrides any renderer guess about a frame or transition age',()=>{
  const visual=guardianAtlasAnimation({...sample('fire',.1),coreExposure:0});
  assert.equal(visual.frame,3,'Keep the genuine firing art');assert.equal(visual.coreCover,1,'Composite actual closed plate over its open-red-core source');
  const opening=guardianAtlasAnimation({...sample('opening',.4),coreExposure:.25});
  assert.equal(opening.coreCover,.75,'The one simulation exposure value controls the armor, not another animation clock');
});

test('charge deploys the existing weapon pose without opening or repeatedly firing',()=>{
  const beginning=guardianAtlasAnimation(sample('charge'));
  assert.equal(beginning.frame,2);assert.equal(beginning.previousFrame,0);assert.equal(beginning.blend,0);
  assert.equal(beginning.coreCover,1);
  assert.equal(guardianAtlasAnimation(sample('charge',.09)).blend,.5);
  const deployed=guardianAtlasAnimation(sample('charge',.18));assert.equal(deployed.previousFrame,null);
  assert.equal(deployed.blend,1);assert.equal(deployed.coreCover,1);
});

test('phase-two impact never restores the old burnt hurt pose or changes the exposed clock',()=>{
  const boss=createGuardianAtlas();until(boss,b=>b.state==='exposed');hitGuardianAtlas(boss,boss.maxHp/2);
  until(boss,b=>b.state==='exposed');const time=boss.stateTime;
  hitGuardianAtlas(boss,1);const visual=guardianAtlasAnimation(boss);
  assert.equal(boss.state,'exposed');assert.equal(boss.stateTime,time);
  assert.equal(visual.frame,5);assert.equal(visual.previousFrame,null);assert.equal(visual.coreCover,0);
  assert.equal(visual.impactFlash,1);
});

test('deactivation opens a restored cyan core for a visible nonlooping terminal sequence',()=>{
  const first=guardianAtlasAnimation(sample('disabled',0,2));
  assert.equal(first.frame,7);assert.equal(first.previousFrame,5);assert.equal(first.blend,0);assert.equal(first.coreCover,0);
  const midpoint=guardianAtlasAnimation(sample('disabled',.3,2));assert.equal(midpoint.blend,.5);
  const final=guardianAtlasAnimation(sample('disabled',.6,2));assert.equal(final.previousFrame,null);
  for(const time of[1.55,5,60])assert.deepEqual(guardianAtlasAnimation(sample('disabled',time,2)),final);
});

test('rendering is read-only and the real route pause freezes poses, shutters and impact flash exactly',()=>{
  const boss=createGuardianAtlas();until(boss,b=>b.state==='opening');advanceGuardianAtlas(boss,.05,{x:360,y:1145});
  const before=structuredClone(boss),frozen=Object.freeze(structuredClone(boss)),visual=guardianAtlasAnimation(frozen);
  for(let frame=0;frame<1000;frame++)assert.deepEqual(guardianAtlasAnimation(frozen),visual);
  assert.deepEqual(boss,before);let events=0;
  advanceGuardianAtlas(boss,0,{x:119,y:900},()=>events++);
  assert.deepEqual(boss,before);assert.deepEqual(guardianAtlasAnimation(boss),visual);assert.equal(events,0);
});

test('invalid presentation states and clocks fail clearly instead of sampling an unrelated pose',()=>{
  for(const value of[undefined,{},sample('idle'),sample('hurt'),sample('destroy'),sample('closed',-1),
    sample('closed',NaN),sample('closed',Infinity),sample('closed',0,3)])assert.throws(()=>guardianAtlasAnimation(value));
});

test('presentation owns no scheduler, random source, combat mutation or event emitter',async()=>{
  const source=await readFile(new URL('../src/game/animation/guardian-atlas-animator.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|Math\.random|hitGuardianAtlas|advanceGuardianAtlas/);
});
