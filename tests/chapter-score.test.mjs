import test from 'node:test';
import assert from 'node:assert/strict';
import {createChapterScore} from '../src/game/audio/chapter-score.js';

// Contract tests against the actual policy with a tagged media boundary. They
// do not claim an audible speaker, native AAC decoding or physical Safari.
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function harness({playQueue=[],duration=28}={}) {
  const output={id:'existing-music-bus'};
  const calls={created:0,connected:[],disconnected:0,plays:0,pauses:0,loads:0,removed:[],sources:[],seeks:[]};
  let currentTime=0,src='';
  const audio={paused:true,duration,loop:false,
    get src(){return src;},set src(value){src=value;currentTime=0;calls.sources.push(value);},
    get currentTime(){return currentTime;},set currentTime(value){currentTime=value;calls.seeks.push(value);},
    play(){
      calls.plays++;
      const behavior=playQueue.shift();
      if(behavior?.throw)throw behavior.throw;
      audio.paused=false;
      return behavior?.promise||Promise.resolve();
    },
    pause(){calls.pauses++;audio.paused=true;},
    load(){calls.loads++;audio.paused=true;},
    removeAttribute(name){calls.removed.push(name);if(name==='src')src='';}
  };
  const source={connect(target){calls.connected.push(target);},disconnect(){calls.disconnected++;}};
  const context={createMediaElementSource(value){calls.created++;assert.equal(value,audio);return source;}};
  const score=createChapterScore({context,output,createAudio:()=>audio});
  return {audio,score,calls,output,context,playQueue,
    // Native media advancement belongs to the browser, not this score module.
    advanceMedia(seconds){currentTime+=seconds;}};
}

test('unsupported media graph returns a fallback without constructing a second audio context or media element',()=>{
  let creations=0;
  const createAudio=()=>{creations++;throw new Error('must not create unsupported media');};
  for(const options of [{},{context:{},output:{}},{context:{createMediaElementSource(){}},output:null}]) {
    assert.equal(createChapterScore({...options,createAudio}),null);
  }
  assert.equal(creations,0);
});

test('construction connects one media element to the existing music bus without starting playback',()=>{
  const h=harness();
  assert.equal(h.audio.preload,'auto');assert.equal(h.calls.created,1);
  assert.deepEqual(h.calls.connected,[h.output]);assert.equal(h.calls.plays,0);
  assert.equal(h.score.snapshot().selected,null);
  assert.equal(h.score.snapshot().paused,true);
});

test('inactive and muted policy do not load a score or start media',()=>{
  const h=harness();
  assert.equal(h.score.update({active:false,elapsed:0}),false);
  assert.equal(h.score.update({active:true,elapsed:0,enabled:false}),true,
    'muting a supported score is not a decoder failure requiring an audible fallback');
  assert.deepEqual(h.calls.sources,[]);assert.equal(h.calls.plays,0);
  assert.equal(h.score.snapshot().enabled,false);
});

test('opening starts at route zero and ordinary updates do not recreate sources or replay already running media',async()=>{
  const h=harness();
  assert.equal(h.score.update({active:true,elapsed:0}),true);await flush();
  assert.deepEqual(h.calls.sources,['assets/chapter1_opening_score_v1.m4a']);
  assert.equal(h.audio.loop,false);
  for(let frame=0;frame<120;frame++){
    h.advanceMedia(1/60);h.score.update({active:true,elapsed:(frame+1)/60});
  }
  assert.equal(h.calls.plays,1);assert.equal(h.calls.created,1);
  assert.equal(h.calls.sources.length,1);assert.equal(h.calls.seeks.length,0);
});

test('opening seeks to restored route position once metadata exists, with a tolerance against tiny frame drift',async()=>{
  const h=harness({duration:NaN});
  assert.equal(h.score.update({active:true,elapsed:12}),true);await flush();
  assert.equal(h.calls.seeks.length,0,'unknown metadata cannot accept an invented seek');
  h.audio.duration=28;h.score.update({active:true,elapsed:12});
  assert.equal(h.audio.currentTime,12);
  h.score.update({active:true,elapsed:12.2});
  assert.deepEqual(h.calls.seeks,[12],'small media/route drift is not an audio scrub on every frame');
  h.score.update({active:true,elapsed:13});assert.equal(h.audio.currentTime,13);
});

test('the 28-second route boundary switches exactly once to the authored voyage loop',async()=>{
  const h=harness();
  h.score.update({active:true,elapsed:27.999});await flush();
  assert.equal(h.score.snapshot().selected,'opening');assert.equal(h.audio.loop,false);
  h.score.update({active:true,elapsed:28});await flush();
  assert.equal(h.score.snapshot().selected,'voyage');assert.equal(h.audio.loop,true);
  assert.deepEqual(h.calls.sources,['assets/chapter1_opening_score_v1.m4a','assets/chapter1_voyage_score_v1.m4a']);
  assert.equal(h.calls.plays,2);assert.equal(h.calls.created,1);
  h.advanceMedia(5);h.score.update({active:true,elapsed:100});
  assert.equal(h.audio.currentTime,5,'the loop position is not scrubbed by total geographical elapsed time');
  assert.equal(h.calls.sources.length,2);
});

test('pause, suspend and resume preserve an existing voyage media position',async()=>{
  const h=harness();h.score.update({active:true,elapsed:60});await flush();
  h.advanceMedia(13.25);
  h.score.update({active:true,elapsed:60,paused:true});
  assert.equal(h.audio.paused,true);assert.equal(h.audio.currentTime,13.25);
  assert.equal(h.calls.plays,1);
  h.score.update({active:true,elapsed:60,paused:false});await flush();
  assert.equal(h.calls.plays,2);assert.equal(h.audio.currentTime,13.25);
  h.score.suspend();assert.equal(h.audio.paused,true);
  h.score.update({active:true,elapsed:60,paused:false});await flush();
  assert.equal(h.calls.plays,3);assert.equal(h.audio.currentTime,13.25);
  assert.equal(h.calls.sources.length,1);
});

test('mute stops media and unmute resumes the same score instead of returning to its beginning',async()=>{
  const h=harness();h.score.update({active:true,elapsed:50});await flush();h.advanceMedia(17);
  h.score.update({active:true,elapsed:50,enabled:false});
  assert.equal(h.audio.paused,true);assert.equal(h.score.snapshot().enabled,false);
  assert.equal(h.audio.currentTime,17);
  h.score.update({active:true,elapsed:50,enabled:true});await flush();
  assert.equal(h.audio.currentTime,17);assert.equal(h.calls.plays,2);
  assert.equal(h.calls.sources.length,1);
});

test('opening pause/resume follows a frozen route without resetting or seeking a position already aligned',async()=>{
  const h=harness();h.score.update({active:true,elapsed:10});await flush();
  const seeks=h.calls.seeks.length;
  for(let i=0;i<20;i++)h.score.update({active:true,elapsed:10,paused:true});
  h.score.update({active:true,elapsed:10,paused:false});await flush();
  assert.equal(h.audio.currentTime,10);assert.equal(h.calls.seeks.length,seeks);
  assert.equal(h.calls.sources.length,1);
});

test('a rejected autoplay request reports fallback without throwing or retrying on every frame',async()=>{
  const rejection=deferred(),h=harness({playQueue:[rejection]});
  assert.equal(h.score.update({active:true,elapsed:0}),true);
  rejection.reject(new Error('NotAllowedError: user gesture required'));await flush();
  assert.equal(h.score.snapshot().failed,true);
  for(let frame=0;frame<60;frame++)assert.equal(h.score.update({active:true,elapsed:0}),false);
  assert.equal(h.calls.plays,1,'failed playback does not create a promise/error every frame');
});

test('a synchronous media play exception is contained and exposes fallback immediately',()=>{
  const h=harness({playQueue:[{throw:new Error('media unavailable')}]});
  assert.equal(h.score.update({active:true,elapsed:0}),false);
  assert.equal(h.score.snapshot().failed,true);assert.equal(h.score.snapshot().pending,false);
});

test('pending playback cannot produce multiple play requests under repeated update calls',async()=>{
  const pending=deferred(),h=harness({playQueue:[pending]});
  h.score.update({active:true,elapsed:0});h.audio.paused=true;
  for(let i=0;i<120;i++)h.score.update({active:true,elapsed:0});
  assert.equal(h.calls.plays,1);assert.equal(h.score.snapshot().pending,true);
  pending.resolve();await flush();assert.equal(h.score.snapshot().pending,false);
});

for(const cancellation of ['paused','muted','suspended']) {
  test(`normal ${cancellation} cancellation of pending playback does not permanently mark the score failed`,async()=>{
    const pending=deferred(),h=harness({playQueue:[pending]});
    h.score.update({active:true,elapsed:0});
    if(cancellation==='paused')h.score.update({active:true,elapsed:0,paused:true});
    if(cancellation==='muted')h.score.update({active:true,elapsed:0,enabled:false});
    if(cancellation==='suspended')h.score.suspend();
    const aborted=new Error('play request interrupted by pause');aborted.name='AbortError';
    pending.reject(aborted);await flush();
    assert.equal(h.score.snapshot().failed,false);
    assert.equal(h.score.update({active:true,elapsed:0,paused:false,enabled:true}),true);await flush();
    assert.equal(h.calls.plays,2);assert.equal(h.calls.sources.length,1);
  });
}

test('a stale opening rejection cannot poison or clear a pending voyage request after a cue switch',async()=>{
  const old=deferred(),next=deferred(),h=harness({playQueue:[old,next]});
  h.score.update({active:true,elapsed:0});
  h.score.update({active:true,elapsed:28});
  assert.equal(h.calls.plays,2,'a new source has its own playback intent, not the stale pending opening');
  old.reject(Object.assign(new Error('old src interrupted'),{name:'AbortError'}));await flush();
  assert.equal(h.score.snapshot().failed,false);assert.equal(h.score.snapshot().pending,true);
  h.audio.paused=true;h.score.update({active:true,elapsed:29});
  assert.equal(h.calls.plays,2,'old promise cleanup must not allow a duplicate current request');
  next.resolve();await flush();assert.equal(h.score.snapshot().pending,false);
});

test('a failed opening can try the distinct voyage file without recreating the media graph',async()=>{
  const pending=deferred(),h=harness({playQueue:[pending]});h.score.update({active:true,elapsed:0});
  pending.reject(new Error('opening decoder unavailable'));await flush();
  assert.equal(h.score.update({active:true,elapsed:1}),false);
  assert.equal(h.score.update({active:true,elapsed:28}),true);await flush();
  assert.equal(h.score.snapshot().failed,false);assert.equal(h.calls.plays,2);assert.equal(h.calls.created,1);
});

test('dispose is idempotent, releases the decoder source and prevents later updates from recreating it',async()=>{
  const pending=deferred(),h=harness({playQueue:[pending]});h.score.update({active:true,elapsed:0});
  h.score.dispose();h.score.dispose();
  pending.reject(Object.assign(new Error('disposed load aborted'),{name:'AbortError'}));await flush();
  assert.equal(h.score.snapshot().disposed,true);assert.equal(h.audio.paused,true);
  assert.deepEqual(h.calls.removed,['src']);assert.equal(h.calls.loads,1);assert.equal(h.calls.disconnected,1);
  const calls={...h.calls};
  assert.equal(h.score.update({active:true,elapsed:40}),false);
  assert.equal(h.calls.plays,calls.plays);assert.equal(h.calls.created,1);assert.equal(h.calls.sources.length,1);
});

test('snapshot values cannot change internal policy',()=>{
  const h=harness(),snapshot=h.score.snapshot();
  assert.equal(Object.isFrozen(snapshot),true);
  assert.throws(()=>{snapshot.failed=true;},TypeError);
  assert.equal(h.score.snapshot().failed,false);
});
