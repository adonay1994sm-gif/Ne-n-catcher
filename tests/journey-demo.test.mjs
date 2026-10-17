import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJourneyDemo,JOURNEY_DEMO_SEGMENTS,JOURNEY_DEMO_VERSION,
  JOURNEY_DEMO_SAVE_KEY,JOURNEY_DEMO_MAX_DELTA,JOURNEY_DEMO_REWARD
} from '../src/game/progression/journey-demo.js';

function runFor(controller,seconds,events=[]){
  const count=Math.ceil(seconds/.02);
  for(let index=0;index<count;index++)controller.advance(.02,event=>events.push(event));
  return events;
}
function station(controller=createJourneyDemo()){
  runFor(controller,11);assert.equal(controller.collectPart(),true);
  runFor(controller,10);assert.equal(controller.snapshot().phase,'station');return controller;
}
function border(controller=station()){
  assert.equal(controller.serviceInstall(),true);assert.equal(controller.resumeFromStation(),true);
  runFor(controller,24.1);assert.equal(controller.snapshot().segmentId,'border');return controller;
}

test('three connected authored segments are versioned and isolated from old campaign saves',()=>{
  assert.deepEqual(JOURNEY_DEMO_SEGMENTS.map(segment=>segment.id),['departure','transit','border']);
  assert.deepEqual(JOURNEY_DEMO_SEGMENTS.map(segment=>segment.duration),[20,24,20]);
  assert.equal(JOURNEY_DEMO_SEGMENTS[0].destination,JOURNEY_DEMO_SEGMENTS[1].origin);
  assert.equal(JOURNEY_DEMO_SEGMENTS[1].destination,JOURNEY_DEMO_SEGMENTS[2].origin);
  assert.equal(createJourneyDemo().snapshot().version,JOURNEY_DEMO_VERSION);
  assert.equal(JOURNEY_DEMO_SAVE_KEY,'neonCatcher.journeyDemo.v1');
});
test('one bounded clock drives segment and whole-route progress, while invalid deltas are rejected',()=>{
  const controller=createJourneyDemo();
  controller.advance(30);
  assert.equal(controller.snapshot().elapsed,JOURNEY_DEMO_MAX_DELTA);
  assert.equal(controller.snapshot().routeProgress,JOURNEY_DEMO_MAX_DELTA/64);
  for(const value of [-1,NaN,Infinity,-Infinity,undefined])assert.throws(()=>controller.advance(value),RangeError);
  assert.throws(()=>controller.advance(.01,null),TypeError);
});
test('explicit pause freezes progress, events and combat/pickup actions',()=>{
  const controller=createJourneyDemo(),events=[];
  runFor(controller,11,events);controller.setPaused(true);
  const before=controller.snapshot();runFor(controller,30,events);
  assert.deepEqual(controller.snapshot(),before);assert.equal(controller.collectPart(),false);
  controller.setPaused(false);assert.equal(controller.collectPart(),true);
  assert.throws(()=>controller.setPaused(1),TypeError);
});
test('the station cannot be reached by waiting without physically collecting the available part',()=>{
  const controller=createJourneyDemo(),events=[];
  assert.equal(controller.collectPart(),false);runFor(controller,100,events);
  assert.equal(controller.snapshot().phase,'travel');assert.equal(controller.snapshot().elapsed,20);
  assert.equal(controller.snapshot().waitingFor,'part');
  assert.equal(events.filter(event=>event.type==='station').length,0);
  assert.equal(controller.collectPart(),true);assert.equal(controller.collectPart(),false);
  controller.advance(0,event=>events.push(event));
  assert.equal(controller.snapshot().phase,'station');assert.equal(controller.snapshot().checkpointId,'relay-station');
  assert.equal(events.filter(event=>event.type==='station').length,1);
});
test('free recovered module installs once, persists at station and produces a visible/runtime propulsion modifier',()=>{
  const controller=station();
  assert.equal(controller.snapshot().engineBoost,false);assert.equal(controller.resumeFromStation(),false);
  assert.equal(controller.serviceInstall(),true);assert.equal(controller.serviceInstall(),false);
  assert.equal(controller.snapshot().credits,0);assert.equal(controller.snapshot().engineBoost,true);
  assert.equal(controller.snapshot().propulsionMultiplier,1.2);
  const restored=createJourneyDemo(JSON.stringify(controller.checkpoint()));
  assert.equal(restored.snapshot().phase,'station');assert.equal(restored.snapshot().partInstalled,true);
  assert.equal(restored.serviceInstall(),false);assert.equal(restored.resumeFromStation(),true);
  assert.equal(restored.resumeFromStation(),false);assert.equal(restored.snapshot().segmentId,'transit');
});
test('station is a natural pause without consuming route time and explicit pause blocks service actions',()=>{
  const controller=station(),before=controller.snapshot();runFor(controller,30);
  assert.deepEqual(controller.snapshot(),before);
  controller.setPaused(true);assert.equal(controller.serviceInstall(),false);
  controller.setPaused(false);assert.equal(controller.serviceInstall(),true);
  controller.setPaused(true);assert.equal(controller.resumeFromStation(),false);
});
test('checkpoints resume coherent beginnings rather than claiming an exact mid-combat save',()=>{
  const controller=createJourneyDemo();runFor(controller,12);controller.collectPart();
  const early=createJourneyDemo(controller.checkpoint());
  assert.equal(early.snapshot().elapsed,0);assert.equal(early.snapshot().partCollected,true);
  const replayEvents=[];runFor(early,21,replayEvents);
  assert.equal(early.snapshot().phase,'station');assert.equal(early.collectPart(),false);
  assert.equal(replayEvents.filter(event=>event.type==='partAvailable').length,0);
  const transit=station();transit.serviceInstall();transit.resumeFromStation();runFor(transit,7);
  const restored=createJourneyDemo(transit.checkpoint());
  assert.equal(restored.snapshot().segmentId,'transit');assert.equal(restored.snapshot().elapsed,0);
  assert.equal(restored.snapshot().engineBoost,true);
  runFor(transit,30);const restoredBorder=createJourneyDemo(transit.checkpoint());
  assert.equal(restoredBorder.snapshot().segmentId,'border');assert.equal(restoredBorder.snapshot().elapsed,0);
  assert.equal(restoredBorder.snapshot().borderResolved,false);
});
test('authored events fire once even across held clocks and repeated tiny updates',()=>{
  const controller=createJourneyDemo(),events=[];runFor(controller,40,events);runFor(controller,10,events);
  assert.deepEqual(events.map(event=>event.type),['enemy','partAvailable']);
  assert.equal(new Set(events.map(event=>event.id)).size,events.length);
  assert.ok(events.every(event=>event.segmentId==='departure'&&event.version===JOURNEY_DEMO_VERSION));
});
test('border guardian must be active and resolved, and completion reward is idempotent after reload',()=>{
  const controller=createJourneyDemo();assert.equal(controller.resolveBorder(),false);
  station(controller);border(controller);const events=[];runFor(controller,50,events);
  assert.equal(controller.snapshot().phase,'travel');assert.equal(controller.snapshot().waitingFor,'border');
  assert.equal(controller.snapshot().credits,0);assert.equal(events.filter(event=>event.type==='border').length,1);
  controller.setPaused(true);assert.equal(controller.resolveBorder(),false);controller.setPaused(false);
  assert.equal(controller.resolveBorder(),true);assert.equal(controller.resolveBorder(),false);
  controller.advance(0,event=>events.push(event));runFor(controller,100,events);
  assert.equal(controller.snapshot().phase,'complete');assert.equal(controller.snapshot().routeProgress,1);
  assert.equal(controller.snapshot().credits,JOURNEY_DEMO_REWARD);
  assert.equal(events.filter(event=>event.type==='complete').length,1);
  const restored=createJourneyDemo(controller.checkpoint());runFor(restored,100,events);
  assert.equal(restored.snapshot().phase,'complete');assert.equal(restored.snapshot().credits,JOURNEY_DEMO_REWARD);
  assert.equal(restored.snapshot().completionRewardGranted,true);assert.equal(restored.resolveBorder(),false);
  assert.equal(events.filter(event=>event.type==='complete').length,1);
});
test('snapshots and checkpoint exports cannot mutate the controller state',()=>{
  const controller=createJourneyDemo(),view=controller.snapshot(),saved=controller.checkpoint();
  assert.throws(()=>{view.elapsed=100;},TypeError);assert.throws(()=>{saved.credits=10000;},TypeError);
  assert.equal(controller.snapshot().elapsed,0);assert.equal(controller.snapshot().credits,0);
});
test('an early guardian defeat stays resolved while the ship finishes approaching the border',()=>{
  const controller=border();runFor(controller,3.2);
  assert.equal(controller.resolveBorder(),true);runFor(controller,1);
  assert.equal(controller.snapshot().borderActive,false);assert.equal(controller.snapshot().borderResolved,true);
  assert.equal(controller.resolveBorder(),false);runFor(controller,20);
  assert.equal(controller.snapshot().phase,'complete');
});
test('malformed, foreign-version and inconsistent saves recover safely without importing old progress',()=>{
  const good=border().checkpoint();
  for(const saved of ['{',[],0,{level:37,unlocked:100},{...good,schemaVersion:2},
    {...good,contentVersion:'future'}, {...good,credits:-1},{...good,credits:500},
    {...good,partInstalled:false},{...good,checkpointId:'unknown'},
    {...good,borderResolved:true},{...good,completionRewardGranted:true}]){
    const restored=createJourneyDemo(saved);
    assert.equal(restored.snapshot().recovery,'invalid-save');
    assert.equal(restored.snapshot().segmentId,'departure');assert.equal(restored.snapshot().elapsed,0);
    assert.equal(restored.snapshot().credits,0);assert.equal(restored.snapshot().partCollected,false);
  }
});
test('an event callback failure cannot duplicate the same authored spawn',()=>{
  const controller=createJourneyDemo();runFor(controller,3.98);
  assert.throws(()=>controller.advance(.034,()=>{throw new Error('runtime callback');}),/runtime callback/);
  const events=[];controller.advance(.02,event=>events.push(event));assert.equal(events.length,0);
});
