import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createVoyageScore, VOYAGE_SCORE_PHRASES, SCORE_VOICE_LIMIT } from '../src/game/audio/voyage-score.js';
import { createChapterScore } from '../src/game/audio/chapter-score.js';

function fakeAudio() {
  const param = () => ({ value: 0, setValueAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; },
    setTargetAtTime(value) { this.value = value; } });
  const node = () => ({ disconnected: false, connect(target) { return target; },
    disconnect() { this.disconnected = true; } });
  const records = [];
  const ac = {
    state: 'running', currentTime: 0, destination: node(), resumes: 0,
    createGain() { return { ...node(), gain: param() }; },
    createBiquadFilter() { return { ...node(), frequency: param(), Q: param() }; },
    createOscillator() {
      const oscillator = { ...node(), frequency: param(), starts: [], stops: [],
        start(time = ac.currentTime) { this.starts.push(time); },
        stop(time = ac.currentTime) { this.stops.push(time); }
      };
      records.push(oscillator); return oscillator;
    },
    async suspend() { this.state = 'suspended'; },
    async resume() { this.resumes++; this.state = 'running'; },
    tick(seconds) {
      this.currentTime += seconds;
      for (const oscillator of records) if (!oscillator.ended && oscillator.stops.some(time => time <= this.currentTime)) {
        oscillator.ended = true; oscillator.onended?.();
      }
    }
  };
  return { ac, records };
}

function exercise(score, ac, seconds) {
  for (let n = 0; n < seconds * 60; n++) { ac.tick(1 / 60); score.advance(1 / 60); }
}

test('authored territorial phrases have distinct motifs, finite note envelopes and no random notes', () => {
  assert.deepEqual(Object.keys(VOYAGE_SCORE_PHRASES), ['transit', 'atlas', 'station', 'arrival']);
  const serialized = Object.values(VOYAGE_SCORE_PHRASES).map(value => JSON.stringify(value.notes));
  assert.equal(new Set(serialized).size, 4);
  for (const phrase of Object.values(VOYAGE_SCORE_PHRASES)) {
    assert.ok(phrase.bpm >= 70 && phrase.bpm <= 130);
    assert.ok(phrase.notes.length >= 12);
    for (const event of phrase.notes) {
      assert.ok(event.beat >= 0 && event.beat < phrase.beats);
      assert.ok(event.length > 0 && event.length <= 3.5);
      assert.ok(event.midi >= 24 && event.midi <= 96);
    }
  }
});

test('one update owner plays finite notes, cleans nodes and stays bounded through repeated phrases', () => {
  const { ac, records } = fakeAudio();
  const score = createVoyageScore({ context: ac, output: ac.createGain() });
  for (let n = 0; n < 360 * 60; n++) {
    ac.tick(1 / 60); score.advance(1 / 60);
    assert.ok(score.snapshot().activeVoices <= SCORE_VOICE_LIMIT);
  }
  assert.ok(score.snapshot().cycles > 10);
  assert.ok(records.length > 200);
  for (const voice of records) {
    assert.equal(voice.starts.length, 1);
    assert.ok(voice.stops.length >= 1);
    assert.ok(voice.stops[0] - voice.starts[0] <= 4.0151);
  }
  score.dispose();
  assert.equal(score.snapshot().activeVoices, 0);
  assert.ok(records.every(voice => voice.disconnected));
});

test('pause and shared-context suspension freeze the score without catch-up bursts', () => {
  const { ac, records } = fakeAudio();
  const score = createVoyageScore({ context: ac, output: ac.createGain() });
  exercise(score, ac, 2);
  score.setPaused(true);
  const before = score.snapshot(), count = records.length;
  exercise(score, ac, 60);
  assert.equal(score.snapshot().beat, before.beat);
  assert.equal(records.length, count);
  assert.equal(score.snapshot().activeVoices, 0);
  score.setPaused(false); ac.state = 'suspended';
  exercise(score, ac, 60);
  assert.equal(score.snapshot().beat, before.beat);
  ac.state = 'running'; score.advance(1 / 60);
  assert.ok(score.snapshot().beat > before.beat);
  assert.ok(records.length - count <= 1);
});

test('mute cancels current music and re-enabling resumes its phrase once', () => {
  const { ac, records } = fakeAudio();
  const score = createVoyageScore({ context: ac, output: ac.createGain() });
  exercise(score, ac, 1); score.setEnabled(false);
  const snapshot = score.snapshot(), count = records.length;
  exercise(score, ac, 20);
  assert.equal(score.snapshot().beat, snapshot.beat);
  assert.equal(score.snapshot().activeVoices, 0);
  assert.equal(records.length, count);
  score.setEnabled(true); exercise(score, ac, 1);
  assert.ok(score.snapshot().beat > snapshot.beat);
  assert.ok(records.length > count);
});

test('context signals are idempotent, replace voices and cannot restart a phrase every frame', () => {
  const { ac, records } = fakeAudio();
  const score = createVoyageScore({ context: ac, output: ac.createGain() });
  exercise(score, ac, 2);
  assert.equal(score.setContext('atlas'), true);
  assert.equal(score.snapshot().activeVoices, 0);
  assert.equal(score.snapshot().beat, 0);
  const startCount = records.length;
  for (let n = 0; n < 60; n++) {
    assert.equal(score.setContext('atlas'), false);
    ac.tick(1 / 60); score.advance(1 / 60);
  }
  assert.ok(score.snapshot().beat > 1.9);
  assert.ok(records.length - startCount < 12);
  assert.equal(score.setContext('unknown'), false);
  assert.equal(score.snapshot().context, 'atlas');
  score.dispose(); assert.equal(score.setContext('station'), false);
  const finalCount = records.length; score.advance(1); assert.equal(records.length, finalCount);
});

test('score uses supplied simulation steps without a timer, random generator or RAF owner', async () => {
  const source = await readFile(new URL('../src/game/audio/voyage-score.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:requestAnimationFrame|setInterval|setTimeout)\s*\(/);
  assert.doesNotMatch(source, /Math\.random\s*\(/);
  const { ac } = fakeAudio(), score = createVoyageScore({ context: ac, output: ac.createGain() });
  score.advance(NaN); score.advance(-1); score.advance(0);
  assert.equal(score.snapshot().beat, 0);
  score.advance(100);
  assert.ok(score.snapshot().beat <= .2, 'a stalled owner cannot enqueue minutes of missed music');
});

const legacySource = await readFile(new URL('../src/game/02-storage-audio.js', import.meta.url), 'utf8');
function legacyHarness(music = 35, fx = 70, {withMedia = false, story = false, autoplayReject = false} = {}) {
  const { ac, records } = fakeAudio();
  let mediaSources=0,mediaPlays=0;
  const media={paused:true,currentTime:0,duration:28,
    play(){mediaPlays++;if(autoplayReject)return Promise.reject(Object.assign(new Error('gesture required'),{name:'NotAllowedError'}));
      this.paused=false;return Promise.resolve();},
    pause(){this.paused=true;},removeAttribute(){},load(){}};
  if(withMedia)ac.createMediaElementSource=element=>{
    assert.equal(element,media);mediaSources++;
    return {connect(){},disconnect(){}};
  };
  const h = vm.createContext({ settings: { music, fx }, musicGain: null, audioCtx: null,
    addEventListener() {}, window: { AudioContext: function AudioContext() { return ac; } },
    isUnifiedClassic:()=>true,classicChapterStory:story?{}:null,classicFlightView:null,
    NeonCampaign: { createVoyageScore,createChapterScore:options=>createChapterScore({...options,createAudio:()=>media}) } });
  vm.runInContext(legacySource, h);
  return { h, ac, records,media,mediaSources:()=>mediaSources,mediaPlays:()=>mediaPlays,
    chapterSnapshot:()=>vm.runInContext('chapterScore?.snapshot()',h),
    snapshot: () => vm.runInContext('voyageScore?.snapshot()', h) };
}

test('legacy startMusic is one shared-context owner and no permanent drone is created', () => {
  const { h, ac, records, snapshot } = legacyHarness();
  h.startMusic(); h.startMusic(); h.startMusic();
  assert.equal(records.length, 0, 'start unlocks/creates the controller; only frame updates create notes');
  h.updateScore(1 / 60);
  assert.equal(snapshot().totalVoices, 3);
  const first = records.length;
  h.startMusic(); h.updateScore(1 / 60);
  assert.equal(records.length, first);
  h.updateScore(1 / 60, true);
  assert.equal(snapshot().activeVoices, 0);
  ac.tick(5); assert.ok(records.every(voice => voice.disconnected));
});

test('legacy volumes isolate music/FX, bound effects and suspend/resume safely', async () => {
  const { h, ac, records, snapshot } = legacyHarness();
  h.signalScoreContext('station'); h.startMusic(); h.updateScore(1 / 60);
  assert.equal(snapshot().context, 'station');
  h.settings.music = 0; h.updateAudioVolumes();
  assert.equal(snapshot().activeVoices, 0);
  const mutedCount = records.length; h.updateScore(.034);
  assert.equal(records.length, mutedCount);
  for (let n = 0; n < 100; n++) h.tone();
  assert.equal(records.length - mutedCount, 16);
  h.settings.fx = 0; h.tone();
  assert.equal(vm.runInContext('activeToneVoices.size', h), 0);
  await h.suspendAudio(); assert.equal(ac.state, 'suspended');
  const frozen = snapshot().beat; h.updateScore(.034); assert.equal(snapshot().beat, frozen);
  await h.resumeAudio(); assert.equal(ac.state, 'suspended', 'fully muted context stays suspended');
  h.settings.fx = 70; await h.resumeAudio();
  assert.equal(ac.state, 'running'); assert.equal(snapshot().enabled, false);
  h.settings.music = 35; h.updateAudioVolumes(); h.updateScore(.034);
  assert.ok(snapshot().beat > frozen);
});

test('actual legacy integration silences procedural voices when the rendered chapter score takes ownership',async()=>{
  const {h,ac,records,media,mediaSources,mediaPlays,snapshot}=legacyHarness(35,70,{withMedia:true});
  h.startMusic();h.startMusic();h.updateScore(1/60);
  assert.equal(snapshot().activeVoices,3,'outside the chapter, the established fallback remains functional');
  const prior=records.length;
  h.classicChapterStory={};h.classicFlightView={elapsed:12};
  h.updateScore(1/60);await Promise.resolve();await Promise.resolve();
  assert.equal(snapshot().activeVoices,0,'the new score cannot overlap previously running procedural music');
  assert.equal(media.paused,false);assert.equal(media.currentTime,12);
  for(let frame=0;frame<120;frame++){ac.tick(1/60);h.updateScore(1/60);}
  assert.equal(records.length,prior);assert.equal(mediaPlays(),1);assert.equal(mediaSources(),1);
  h.classicFlightView={elapsed:28};h.updateScore(1/60);
  assert.equal(media.loop,true);assert.match(media.src,/chapter1_voyage_score_v1\.m4a$/);
  assert.equal(records.length,prior);assert.equal(snapshot().activeVoices,0);
});

test('actual legacy integration falls back after rejected rendered autoplay and never plays both score systems',async()=>{
  const {h,records,mediaPlays,chapterSnapshot,snapshot}=legacyHarness(35,70,
    {withMedia:true,story:true,autoplayReject:true});
  h.startMusic();h.updateScore(1/60);
  assert.equal(records.length,0,'fallback waits for the actual media rejection');
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(chapterSnapshot().failed,true);
  h.updateScore(1/60);assert.equal(snapshot().activeVoices,3);
  const prior=records.length;
  for(let frame=0;frame<30;frame++)h.updateScore(1/60);
  assert.equal(mediaPlays(),1,'autoplay failure is not retried every frame');
  assert.ok(records.length>=prior);assert.ok(snapshot().activeVoices>0);
});
