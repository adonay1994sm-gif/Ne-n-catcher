import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  createChronosFlight,CHRONOS_FLIGHT_VERSION,CHRONOS_FLIGHT_EVENTS,
  CHRONOS_FLIGHT_MIN_DURATION,CHRONOS_FLIGHT_MAX_DELTA
} from '../src/game/progression/chronos-flight.js';

function fly(controller,seconds,collected=0,events=[]){
  for(let index=0;index<Math.ceil(seconds/.02);index++){
    controller.advance(.02,collected,event=>events.push(event));
  }
  return controller.snapshot();
}

test('Chronos is one versioned classic route with a hostile cause and a linked Gaia destination',()=>{
  const view=createChronosFlight().snapshot();
  assert.equal(view.version,CHRONOS_FLIGHT_VERSION);
  assert.equal(view.minDuration,CHRONOS_FLIGHT_MIN_DURATION);
  assert.equal(view.goal,36);assert.equal(view.routeProgress,0);assert.equal(view.canFinish,false);
  assert.match(view.origin,/Chronos/);assert.match(view.destination,/Gaia/);
  assert.deepEqual(CHRONOS_FLIGHT_EVENTS.map(event=>event.type),
    ['attack','rupture','departure','twin-module-marker','gaia-beacon','arrival']);
  assert.equal(CHRONOS_FLIGHT_EVENTS[1].cause,'hostile-reactor-strike');
  assert.equal(CHRONOS_FLIGHT_EVENTS.at(-1).destinationId,CHRONOS_FLIGHT_EVENTS.at(-2).destinationId);
});

test('a paused legacy update freezes route, visuals, mission input and events',()=>{
  const controller=createChronosFlight(),events=[];
  fly(controller,9,3,events);const before=controller.snapshot(),count=events.length;
  for(let index=0;index<100;index++)controller.advance(0,36,event=>events.push(event));
  assert.deepEqual(controller.snapshot(),before);assert.equal(events.length,count);
  fly(controller,1,4,events);assert.ok(controller.snapshot().routeProgress>before.routeProgress);
});

test('a long resumed timestamp is capped and invalid inputs cannot corrupt the route',()=>{
  const controller=createChronosFlight();controller.advance(100,0);
  assert.equal(controller.snapshot().elapsed,CHRONOS_FLIGHT_MAX_DELTA);
  for(const dt of [-1,NaN,Infinity,undefined])assert.throws(()=>controller.advance(dt,0),RangeError);
  for(const count of [-1,NaN,Infinity])assert.throws(()=>controller.advance(.02,count),RangeError);
  assert.throws(()=>controller.advance(.02,0,null),TypeError);
  assert.equal(controller.snapshot().elapsed,CHRONOS_FLIGHT_MAX_DELTA);
});

test('waiting never wins a recovery mission or silently manufactures CRONIUM',()=>{
  const controller=createChronosFlight(),events=[];
  const result=fly(controller,240,0,events);
  assert.equal(result.collected,0);assert.equal(result.remaining,36);assert.equal(result.canFinish,false);
  assert.ok(result.routeProgress<.83);assert.equal(result.phase,'deep-space');
  assert.equal(result.waitingFor,'cronium');
  assert.equal(events.some(event=>event.type==='arrival'),false);
  assert.equal(events.some(event=>event.type==='gaia-beacon'),false);
});

test('an early quota still travels through distinct scenes and cannot skip the minimum flight',()=>{
  const controller=createChronosFlight(),events=[];
  fly(controller,12,36,events);assert.equal(controller.snapshot().objectiveComplete,true);
  assert.equal(controller.snapshot().canFinish,false);assert.equal(controller.snapshot().phase,'recovery');
  fly(controller,25,36,events);assert.equal(controller.snapshot().phase,'deep-space');
  fly(controller,22.8,36,events);assert.equal(controller.snapshot().canFinish,false);
  fly(controller,1,36,events);assert.equal(controller.snapshot().canFinish,true);
  assert.ok(controller.snapshot().elapsed>=60-1e-8);
  assert.equal(events.filter(event=>event.type==='arrival').length,1);
});

test('the last late fragment opens a continuous approach rather than teleporting to Gaia',()=>{
  const controller=createChronosFlight(),events=[];
  fly(controller,120,35,events);const before=controller.snapshot();
  assert.equal(before.canFinish,false);assert.equal(before.phase,'gaia-approach');
  controller.advance(.02,36,event=>events.push(event));const after=controller.snapshot();
  assert.equal(after.canFinish,false);assert.ok(after.routeProgress-before.routeProgress<=.02/60+1e-10);
  assert.ok(after.planet.scale-before.planet.scale<.01);
  fly(controller,12,36,events);assert.equal(controller.snapshot().canFinish,true);
  assert.equal(events.filter(event=>event.type==='arrival').length,1);
});

test('collection affects progress without moving backwards when the caller reports an older count',()=>{
  const none=createChronosFlight(),partial=createChronosFlight();
  fly(none,110,0);fly(partial,110,18);
  assert.ok(partial.snapshot().routeProgress>none.snapshot().routeProgress);
  const before=partial.snapshot();fly(partial,2,0);
  assert.equal(partial.snapshot().collected,18);
  assert.ok(partial.snapshot().routeProgress>=before.routeProgress);
  partial.advance(.02,999);assert.equal(partial.snapshot().collected,36);
});

test('the station recedes geometrically and Gaia grows without fading scenery as a route substitute',()=>{
  const controller=createChronosFlight(),start=controller.snapshot();
  fly(controller,22,36);const departed=controller.snapshot();
  assert.ok(departed.station.scale<start.station.scale*.7);
  assert.ok(departed.station.y>start.station.y);assert.ok(departed.station.x<start.station.x);
  assert.equal(start.station.alpha,1);assert.equal(departed.station.alpha,1);
  fly(controller,20,36);const deep=controller.snapshot();
  assert.equal(deep.phase,'deep-space');assert.equal(deep.station.visible,false);
  fly(controller,17,36);const arrival=controller.snapshot();
  assert.ok(arrival.planet.scale>deep.planet.scale*2);
  assert.equal(arrival.planet.alpha,1);assert.equal(arrival.deepSpace.alpha,1);
  assert.equal(arrival.beacon.active,true);assert.ok(arrival.beacon.scale>deep.beacon.scale);
});

test('authored attack has preparation, discharge and reactor consequences before the escape',()=>{
  const controller=createChronosFlight(),events=[];
  fly(controller,3.6,0,events);assert.equal(controller.snapshot().attacker.state,'charge');
  assert.equal(controller.snapshot().station.state,'stable');
  fly(controller,1.4,0,events);assert.equal(controller.snapshot().attacker.state,'fire');
  assert.equal(controller.snapshot().station.state,'struck');
  fly(controller,1.2,0,events);assert.equal(controller.snapshot().station.state,'ruptured');
  assert.equal(controller.snapshot().recoveryActive,true);
  assert.deepEqual(events.map(event=>event.type),['attack','rupture']);
});

test('all narrative and module events emit once in order, even while holding a collection gate',()=>{
  const controller=createChronosFlight(),events=[];
  fly(controller,120,20,events);fly(controller,60,20,events);fly(controller,30,36,events);
  assert.deepEqual(events.map(event=>event.type),CHRONOS_FLIGHT_EVENTS.map(event=>event.type));
  assert.equal(new Set(events.map(event=>event.id)).size,events.length);
  assert.ok(events.every(event=>event.version===CHRONOS_FLIGHT_VERSION));
  const final=controller.snapshot();fly(controller,120,36,events);
  assert.deepEqual(controller.snapshot(),final);assert.equal(events.length,CHRONOS_FLIGHT_EVENTS.length);
});

test('snapshots, nested scenery and event definitions cannot mutate the route',()=>{
  const controller=createChronosFlight(),view=controller.snapshot();
  assert.throws(()=>{view.station.scale=999;},TypeError);
  assert.throws(()=>{view.routeProgress=1;},TypeError);
  assert.throws(()=>{CHRONOS_FLIGHT_EVENTS[0].at=0;},TypeError);
  assert.equal(controller.snapshot().routeProgress,0);
});

test('an event callback failure cannot duplicate its attack or suppress the later rupture',()=>{
  const controller=createChronosFlight();fly(controller,1.48);
  assert.throws(()=>controller.advance(.034,0,()=>{throw new Error('runtime failure');}),/runtime failure/);
  const events=[];fly(controller,8,0,events);
  assert.equal(events.some(event=>event.type==='attack'),false);
  assert.equal(events.filter(event=>event.type==='rupture').length,1);
});

test('configuration is explicit and the model does not own a loop, browser state, storage or randomness',async()=>{
  for(const options of [{goal:0},{goal:1.2},{minDuration:0},{minDuration:NaN}]){
    assert.throws(()=>createChronosFlight(options),RangeError);
  }
  const controller=createChronosFlight({goal:3,minDuration:30});
  fly(controller,31,3);assert.equal(controller.snapshot().canFinish,true);
  const source=await readFile(new URL('../src/game/progression/chronos-flight.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/requestAnimationFrame\s*\(|setInterval\s*\(|setTimeout\s*\(|Math\.random\s*\(|Date\.now\s*\(/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|document\.|window\./);
});
