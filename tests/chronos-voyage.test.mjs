import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHRONOS_FLIGHT_VERSION,createChronosFlight,CHRONOS_VOYAGE_VERSION,CHRONOS_VOYAGE_KEY,
  CHRONOS_VOYAGE_STAGES,CHRONOS_VOYAGE_MIN_DURATION,createChronosVoyage,
  createChronosVoyageCheckpoint,normalizeChronosVoyageCheckpoint
} from '../src/game/progression/chronos-flight.js';

function fly(controller,seconds,collected=controller.snapshot().collected,events=[]){
  for(let index=0;index<Math.ceil(seconds/.02);index++)controller.advance(.02,collected,event=>events.push(event));
  return controller.snapshot();
}

function finishCurrentStage(controller,events=[]){
  const before=controller.snapshot();
  for(let frame=0;frame<Math.ceil(before.stageDuration/.02)+2;frame++){
    const view=controller.advance(.02,before.stageGoal,event=>events.push(event));
    if(view.stageNumber!==before.stageNumber||view.waitingFor==='service'||view.canFinish)return view;
  }
  throw new Error(`Stage ${before.stageId} did not close`);
}

test('ten authored crossings are stable stages inside Chronos and preserve the reproducible v1 model',()=>{
  assert.equal(createChronosFlight().snapshot().version,CHRONOS_FLIGHT_VERSION);
  const stages=CHRONOS_VOYAGE_STAGES;
  assert.equal(stages.length,10);
  assert.deepEqual(stages.map(stage=>stage.id),Array.from({length:10},(_,index)=>`1.${index+1}`));
  assert.deepEqual(stages.map(stage=>stage.goal),[4,8,12,16,18,18,24,28,32,36]);
  assert.ok(stages.every(stage=>stage.duration>=32&&stage.duration<=40&&stage.chapter===1));
  assert.equal(stages.reduce((total,stage)=>total+stage.duration,0),CHRONOS_VOYAGE_MIN_DURATION);
  assert.equal(CHRONOS_VOYAGE_MIN_DURATION,360);
  for(let index=1;index<stages.length;index++)assert.equal(stages[index].origin,stages[index-1].destination);
  assert.notEqual(CHRONOS_VOYAGE_KEY,'neonCatcher.flightEquipment.v1');
  assert.equal(createChronosVoyage().snapshot().version,CHRONOS_VOYAGE_VERSION);
  assert.throws(()=>{stages[0].duration=1;},TypeError);
});

test('the only clock freezes route, scenery, collection and events when the legacy loop is paused',()=>{
  const controller=createChronosVoyage(),events=[];
  fly(controller,12,2,events);const before=controller.snapshot(),checkpoint=controller.exportCheckpoint();
  for(let index=0;index<100;index++)controller.advance(0,36,event=>events.push(event));
  assert.deepEqual(controller.snapshot(),before);assert.deepEqual(controller.exportCheckpoint(),checkpoint);
  assert.equal(events.filter(event=>event.type==='rupture').length,1);
  controller.advance(.02,3);assert.ok(controller.snapshot().elapsed>before.elapsed);
});

test('time alone cannot unlock any new crossing or manufacture a fragment',()=>{
  const controller=createChronosVoyage(),events=[];
  const view=fly(controller,180,0,events);
  assert.equal(view.stageId,'1.1');assert.equal(view.stageElapsed,36);
  assert.equal(view.collected,0);assert.equal(view.waitingFor,'cronium');assert.equal(view.canFinish,false);
  assert.equal(events.filter(event=>event.type==='stage-complete').length,0);
  assert.equal(events.filter(event=>event.type==='arrival').length,0);
});

test('an early complete quota must still travel all ten stages and cannot bypass C9',()=>{
  const controller=createChronosVoyage(),events=[];
  fly(controller,360,36,events);
  let view=controller.snapshot();
  assert.equal(view.stageNumber,6);assert.equal(view.waitingFor,'service');assert.equal(view.elapsed,183.2);
  assert.equal(view.canFinish,false);assert.equal(view.relay.active,true);
  const waiting=view;
  fly(controller,600,36,events);assert.deepEqual(controller.snapshot(),waiting);
  controller.resolveService(event=>events.push(event));
  assert.equal(controller.snapshot().stageNumber,6);assert.equal(controller.snapshot().elapsed,183.2);
  fly(controller,176.6,36,events);assert.equal(controller.snapshot().canFinish,false);
  fly(controller,1,36,events);view=controller.snapshot();
  assert.equal(view.stageNumber,10);assert.equal(view.phase,'arrived');assert.equal(view.canFinish,true);
  assert.equal(view.elapsed,360);assert.equal(view.routeProgress,1);
  assert.equal(events.filter(event=>event.type==='stage-complete').length,10);
  assert.equal(events.filter(event=>event.type==='arrival').length,1);
});

test('each quota gate advances one stage, with no teleport and monotonically retained collection',()=>{
  const controller=createChronosVoyage(),events=[];
  for(let number=1;number<=10;number++){
    const entry=controller.snapshot();assert.equal(entry.stageNumber,number);
    if(number!==6){
      fly(controller,entry.stageDuration+.1,Math.max(entry.collected,entry.stageGoal-1),events);
      assert.equal(controller.snapshot().stageNumber,number);assert.equal(controller.snapshot().waitingFor,'cronium');
    }
    const before=controller.snapshot();
    fly(controller,entry.stageDuration+.1,entry.stageGoal,events);
    const after=controller.snapshot();
    assert.ok(after.routeProgress>=before.routeProgress);
    if(number===6){
      assert.equal(after.waitingFor,'service');controller.resolveService(event=>events.push(event));
      finishCurrentStage(controller,events);
    }
    else if(number<10)assert.equal(after.stageNumber,number+1);
    controller.advance(.02,0);assert.ok(controller.snapshot().collected>=entry.collected);
  }
  assert.equal(controller.snapshot().canFinish,true);
});

test('stage entry checkpoints reproduce a coherent boundary rather than a mid-combat timestamp',()=>{
  const controller=createChronosVoyage(),events=[];
  for(let number=1;number<=10;number++){
    const boundary=controller.snapshot(),entry=controller.exportCheckpoint();
    assert.equal(entry.stageNumber,number);
    //1.6 now reaches its real service checkpoint after1.2s. Sample its ordinary
    // entry before docking; the dedicated tests below cover dock/undock saves.
    fly(controller,number===6?.6:7,boundary.stageGoal,events);
    const checkpoint=controller.exportCheckpoint();
    // The first positive update records the initial entry event IDs. It still
    // stores the same geographical boundary and never the seven combat seconds.
    assert.deepEqual({...checkpoint,eventIds:[]},{...entry,eventIds:[]});
    const restored=createChronosVoyage({checkpoint});
    assert.equal(restored.snapshot().elapsed,CHRONOS_VOYAGE_STAGES[number-1].offset);
    assert.equal(restored.snapshot().stageProgress,0);
    assert.equal(restored.snapshot().collected,entry.collected);
    assert.equal(restored.snapshot().station.scale,boundary.station.scale);
    assert.equal(restored.snapshot().planet.scale,boundary.planet.scale);
    finishCurrentStage(controller,events);
    if(number===6){controller.resolveService(event=>events.push(event));finishCurrentStage(controller,events);}
  }
  const checkpointEvents=events.filter(event=>event.type==='checkpoint');
  assert.equal(checkpointEvents.length,10);
  assert.ok(checkpointEvents.every(event=>event.checkpoint.stageId===event.stageId));
});

test('resuming a checkpoint never repeats earlier attacks, salvage markers, service or stage rewards',()=>{
  const events=[];let controller=createChronosVoyage();
  for(let number=1;number<8;number++){
    finishCurrentStage(controller,events);
    if(number===6){controller.resolveService(event=>events.push(event));finishCurrentStage(controller,events);}
    controller=createChronosVoyage({checkpoint:controller.exportCheckpoint()});
  }
  const before=new Set(events.map(event=>event.id));
  fly(controller,6,controller.snapshot().stageGoal,events);
  assert.equal(new Set(events.map(event=>event.id)).size,events.length);
  assert.ok(events.filter(event=>event.type==='attack'||event.type==='rupture'||event.type==='twin-module-marker').every(event=>before.has(event.id)));
  assert.equal(events.filter(event=>event.type==='service').length,1);
});

test('a saved early service boundary remains docked and confirmation resumes the departure leg once',()=>{
  const controller=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(6)}),events=[];
  finishCurrentStage(controller,events);
  const checkpoint=controller.exportCheckpoint();assert.equal(checkpoint.serviceWaiting,true);
  const restored=createChronosVoyage({checkpoint}),before=restored.snapshot();
  assert.equal(before.waitingFor,'service');fly(restored,100,36,events);assert.deepEqual(restored.snapshot(),before);
  restored.resolveService(event=>events.push(event));const after=restored.snapshot();
  restored.resolveService(event=>events.push(event));assert.deepEqual(restored.snapshot(),after);
  assert.equal(after.stageId,'1.6');assert.equal(after.elapsed,before.elapsed);
  assert.equal(after.stageElapsed,1.2);assert.equal(after.relay.state,'departing');
  assert.equal(after.stageName,'Salida de C9');
  assert.equal(events.filter(event=>event.type==='service-complete').length,1);
  const departedCheckpoint=restored.exportCheckpoint();
  assert.ok(departedCheckpoint.eventIds.includes('chronos-voyage:1.6:service-complete'));
  const reentered=createChronosVoyage({checkpoint:departedCheckpoint});
  assert.equal(reentered.snapshot().waitingFor,null);
  assert.equal(reentered.snapshot().stageElapsed,1.2);
  assert.equal(reentered.snapshot().relay.state,'departing');
  fly(reentered,3,18,events);
  assert.equal(reentered.snapshot().relay.visible,false);
  assert.equal(reentered.snapshot().stageId,'1.6');
  assert.equal(events.filter(event=>event.type==='service').length,1);
  finishCurrentStage(reentered,events);
  assert.equal(reentered.snapshot().stageId,'1.7');assert.equal(reentered.snapshot().elapsed,214);
});

test('C9 appears only for its short approach and opens as the illustrated hangar is reached',()=>{
  const controller=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(5)}),events=[];
  fly(controller,36.78,18,events);
  assert.equal(controller.snapshot().relay.visible,false);
  fly(controller,.04,18,events);
  const distant=controller.snapshot();assert.equal(distant.relay.visible,true);
  assert.equal(distant.relay.state,'approach');assert.equal(distant.relay.active,false);
  finishCurrentStage(controller,events);
  assert.equal(controller.snapshot().stageId,'1.6');
  fly(controller,1.18,18,events);
  const approaching=controller.snapshot();
  assert.equal(approaching.waitingFor,null);assert.equal(approaching.relay.state,'docking');
  assert.ok(approaching.relay.scale>distant.relay.scale*4);
  controller.advance(.02,18,event=>events.push(event));
  const docked=controller.snapshot();
  assert.equal(docked.stageElapsed,1.2);assert.equal(docked.elapsed,183.2);
  assert.equal(docked.waitingFor,'service');assert.equal(docked.relay.state,'service');
  assert.equal(docked.relay.scale,.175);assert.equal(docked.relay.active,true);
  assert.equal(events.filter(event=>event.type==='service').length,1);
  const before=structuredClone(docked);
  for(let index=0;index<100;index++)controller.advance(0,36,event=>events.push(event));
  assert.deepEqual(controller.snapshot(),before);
  assert.equal(docked.collected,18,'Docking cannot manufacture the remaining18fragments');
});

test('old version2 end-of-stage service saves keep their original geography and next-stage confirmation',()=>{
  const base=createChronosVoyageCheckpoint(6);
  const old={...base,eventIds:[...base.eventIds,'chronos-voyage:1.6:complete','chronos-voyage:1.6:service'],serviceWaiting:true};
  const normalized=normalizeChronosVoyageCheckpoint(old);
  assert.deepEqual(normalizeChronosVoyageCheckpoint(normalized),normalized);
  const controller=createChronosVoyage({checkpoint:normalized}),events=[];
  assert.equal(controller.snapshot().elapsed,214);assert.equal(controller.snapshot().stageElapsed,32);
  assert.equal(controller.snapshot().relay.visible,true);assert.equal(controller.snapshot().relay.active,true);
  controller.resolveService(event=>events.push(event));
  assert.equal(controller.snapshot().stageId,'1.7');assert.equal(controller.snapshot().elapsed,214);
  assert.equal(events.filter(event=>event.type==='service-complete').length,1);
  assert.equal(CHRONOS_VOYAGE_MIN_DURATION,360);
  assert.deepEqual(CHRONOS_VOYAGE_STAGES.map(stage=>stage.offset),[0,36,72,108,144,182,214,252,288,324]);
  const confirmedAtOldBoundary={...old,serviceWaiting:false,
    eventIds:[...old.eventIds,'chronos-voyage:1.6:service-complete']};
  const confirmed=createChronosVoyage({checkpoint:confirmedAtOldBoundary});
  assert.equal(confirmed.snapshot().elapsed,214,'An interrupted old confirmation cannot rewind the origin');
  confirmed.advance(.02,18);
  assert.equal(confirmed.snapshot().stageId,'1.7');
});

test('the completed dock milestone survives a throwing UI callback without re-opening the service',()=>{
  const controller=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(6)});
  finishCurrentStage(controller);
  assert.throws(()=>controller.resolveService(()=>{throw new Error('panel callback failed');}),/panel callback failed/);
  assert.equal(controller.snapshot().waitingFor,null);
  const checkpoint=controller.exportCheckpoint();
  assert.ok(checkpoint.eventIds.includes('chronos-voyage:1.6:service-complete'));
  const restored=createChronosVoyage({checkpoint}),events=[];
  fly(restored,10,18,events);
  assert.equal(restored.snapshot().waitingFor,null);
  assert.equal(events.some(event=>event.type==='service'||event.type==='service-complete'),false);
});

test('checkpoint validation rejects incompatible saves without changing them and clamps safe numeric excess',()=>{
  const legacy={version:1,routeId:'n7',stageNumber:7,collected:36};
  const copy=structuredClone(legacy);
  assert.equal(normalizeChronosVoyageCheckpoint(legacy),null);assert.deepEqual(legacy,copy);
  assert.throws(()=>createChronosVoyage({checkpoint:legacy}),/Invalid Chronos voyage checkpoint/);
  const good=createChronosVoyageCheckpoint(5);
  for(const mutation of [{version:1},{goal:37},{stageId:'1.8'},{stageIndex:6},{stageNumber:99},
    {collected:0},{eventIds:['unknown']},{serviceWaiting:true},{collected:NaN}]){
    assert.equal(normalizeChronosVoyageCheckpoint({...good,...mutation}),null);
  }
  const excess=normalizeChronosVoyageCheckpoint({...good,collected:999});
  assert.equal(excess.collected,36);
  assert.deepEqual(normalizeChronosVoyageCheckpoint(excess),excess);
  assert.throws(()=>{excess.eventIds.push('corrupt');},TypeError);
  for(const stage of [0,11,1.5])assert.throws(()=>createChronosVoyageCheckpoint(stage),RangeError);
});

test('future event IDs in a forged checkpoint cannot hide a future module or arrival',()=>{
  const checkpoint=createChronosVoyageCheckpoint(2);
  const clean=normalizeChronosVoyageCheckpoint({...checkpoint,eventIds:[...checkpoint.eventIds,'chronos-voyage-recovered-module','chronos-voyage-arrival']});
  assert.equal(clean.eventIds.includes('chronos-voyage-recovered-module'),false);
  assert.equal(clean.eventIds.includes('chronos-voyage-arrival'),false);
  const controller=createChronosVoyage({checkpoint:clean}),events=[];
  finishCurrentStage(controller,events);finishCurrentStage(controller,events);
  assert.equal(events.filter(event=>event.type==='twin-module-marker').length,1);
});

test('Chronos shrinks into the empty route and Gaia remains a distant point before the designed approach',()=>{
  const early=createChronosVoyage().snapshot();
  const exit=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(4)}).snapshot();
  const voidStart=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(5)}).snapshot();
  const lateVoid=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(7)}).snapshot();
  const approach=createChronosVoyage({checkpoint:createChronosVoyageCheckpoint(10)}).snapshot();
  assert.ok(exit.station.scale<early.station.scale*.4);assert.ok(exit.station.y>early.station.y);
  assert.equal(lateVoid.station.visible,false);
  assert.ok(voidStart.deepSpace.nebulaOpacity<early.deepSpace.nebulaOpacity*.2);
  assert.ok(lateVoid.deepSpace.starDensity<early.deepSpace.starDensity*.5);
  assert.equal(voidStart.planet.scale,.014);assert.equal(lateVoid.planet.scale,.014);
  assert.ok(approach.planet.scale>lateVoid.planet.scale*10);
  assert.equal(early.station.alpha,1);assert.equal(approach.planet.alpha,1);
  assert.ok(approach.deepSpace.offsetY>voidStart.deepSpace.offsetY);
});

test('the rupture still happens at nine played seconds and phase poses remain immutable',()=>{
  const controller=createChronosVoyage(),events=[];
  fly(controller,4.96,0,events);assert.equal(controller.snapshot().attacker.state,'charge');
  fly(controller,1.5,0,events);assert.equal(controller.snapshot().attacker.state,'fire');
  fly(controller,2.6,0,events);const view=controller.snapshot();
  assert.equal(view.station.state,'ruptured');assert.equal(view.cinematicDuration*.1,9);
  assert.equal(events.filter(event=>event.type==='rupture').length,1);
  assert.throws(()=>{view.deepSpace.travel=1;},TypeError);
});

test('invalid delta inputs do not advance a route and a background-sized delta is capped',()=>{
  const controller=createChronosVoyage();
  for(const dt of [-1,NaN,Infinity,undefined])assert.throws(()=>controller.advance(dt,0),RangeError);
  for(const count of [-1,NaN,Infinity])assert.throws(()=>controller.advance(.02,count),RangeError);
  assert.throws(()=>controller.advance(.02,0,null),TypeError);
  assert.equal(controller.snapshot().elapsed,0);
  controller.advance(200,0);assert.equal(controller.snapshot().elapsed,.034);
  for(const goal of [0,1.5,NaN])assert.throws(()=>createChronosVoyage({goal}),RangeError);
});

test('a throwing narrative callback cannot duplicate its attack on the next update',()=>{
  const controller=createChronosVoyage();
  for(let frame=0;frame<66;frame++)controller.advance(.034,0);
  assert.throws(()=>controller.advance(.034,0,event=>{if(event.type==='attack')throw new Error('presentation failed');}),/presentation failed/);
  const events=[];fly(controller,10,4,events);
  assert.equal(events.filter(event=>event.type==='attack').length,0);
  assert.equal(events.filter(event=>event.type==='rupture').length,1);
});
