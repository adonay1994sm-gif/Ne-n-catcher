import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CHRONOS_CHAPTER_VERSION, CHRONOS_CHAPTER_STORY_KEY,
  CHRONOS_CHAPTER_OPENING_SECONDS, CHRONOS_CHAPTER_AFTERMATH_SECONDS,
  CHRONOS_CHAPTER_ACTORS, CHRONOS_CHAPTER_OPENING, CHRONOS_CHAPTER_DIALOGUES,
  createChronosChapterStory, normalizeChronosChapterCheckpoint} from '../src/game/narrative/chronos-chapter.js';
import {CHRONOS_VOYAGE_STAGES, CHRONOS_VOYAGE_MIN_DURATION} from '../src/game/progression/chronos-flight.js';
import {getChronosDestructionPose} from '../src/game/animation/chronos-destruction.js';

const step = (story, elapsed, emit = () => {}, extra = {}) => story.advance({elapsed, ...extra}, emit);

test('chapter actors have distinct roles and short contextual Spanish dialogue', () => {
  assert.equal(CHRONOS_CHAPTER_VERSION, 'chronos-chapter-v1');
  assert.equal(CHRONOS_CHAPTER_STORY_KEY, 'neonCatcher.chronosChapterStory.v1');
  assert.deepEqual(Object.keys(CHRONOS_CHAPTER_ACTORS), ['lira', 'mira', 'atlas', 'iria', 'n7']);
  assert.match(CHRONOS_CHAPTER_ACTORS.lira.role, /evacuación/);
  assert.match(CHRONOS_CHAPTER_ACTORS.mira.role, /cobra/);
  assert.match(CHRONOS_CHAPTER_ACTORS.atlas.role, /identificación falsificada/);
  assert.match(CHRONOS_CHAPTER_ACTORS.iria.role, /verificar pruebas/);
  assert.notEqual(CHRONOS_CHAPTER_ACTORS.atlas.role, CHRONOS_CHAPTER_ACTORS.iria.role);
  assert.equal(new Set(CHRONOS_CHAPTER_DIALOGUES.map(cue => cue.id)).size, CHRONOS_CHAPTER_DIALOGUES.length);
  for (const cue of CHRONOS_CHAPTER_DIALOGUES) {
    assert.ok(CHRONOS_CHAPTER_ACTORS[cue.speakerId]);
    assert.ok(cue.text.length <= 110, cue.id);
    assert.ok(cue.duration >= 2 && cue.duration <= 7, cue.id);
    assert.ok(cue.visualCue && cue.audioCue, cue.id);
    assert.ok(Object.isFrozen(cue));
  }
});

test('six opening shots share the authored 9-second rupture and 26-second playable opening', () => {
  assert.equal(CHRONOS_CHAPTER_OPENING_SECONDS, 26);
  assert.equal(CHRONOS_CHAPTER_OPENING.length, 6);
  assert.deepEqual(CHRONOS_CHAPTER_OPENING.map(cue => cue.at), [0, 3, 6.3, 9, 13.2, 19.2]);
  assert.ok(Math.abs(CHRONOS_CHAPTER_OPENING.at(-1).at + CHRONOS_CHAPTER_OPENING.at(-1).duration - 26) < 1e-9);
  const route = elapsed => ({elapsed, minDuration: CHRONOS_VOYAGE_MIN_DURATION, cinematicDuration: 90});
  assert.equal(getChronosDestructionPose(route(8.999)).state, 'intact');
  assert.equal(getChronosDestructionPose(route(9)).state, 'impact');
  assert.equal(getChronosDestructionPose(route(16.2)).waveVisible, false);
  assert.equal(CHRONOS_VOYAGE_MIN_DURATION, 360);
  assert.equal(CHRONOS_VOYAGE_STAGES.length, 10);
});

test('opening progression uses supplied route snapshots and emits each line once', () => {
  const story = createChronosChapterStory(), events = [];
  let view = step(story, 0, cue => events.push(cue));
  assert.equal(view.opening.controlsLocked, true);
  assert.equal(view.opening.canSkip, true);
  for (const elapsed of [0, 1, 3, 3, 6.3, 9, 13.2, 19.2, 25.999, 26]) {
    view = step(story, elapsed, cue => events.push(cue));
  }
  assert.deepEqual(events.map(cue => cue.id), CHRONOS_CHAPTER_OPENING.map(cue => cue.id));
  assert.equal(view.routeElapsed, 26);
  assert.equal(view.opening.active, false);
  assert.equal(view.opening.controlsLocked, false);
  assert.equal(view.introSeen, true);
  assert.equal(view.carriesRecord, true);
  assert.ok(events.every(cue => cue.type === 'transmission' && cue.chapter === 1));
  assert.deepEqual(Object.keys(story).sort(), ['advance', 'checkpoint', 'signal', 'skipIntro', 'snapshot']);
});

test('pilot control releases at the one real rupture and illustration yields to existing station', () => {
  const story = createChronosChapterStory();
  assert.equal(step(story, 8.99).opening.controlsLocked, true);
  const before = step(story, 9);
  assert.equal(before.opening.controlsLocked, false);
  assert.equal(before.opening.backgroundAlpha, 1);
  assert.ok(Math.abs(step(story, 10.2).opening.backgroundAlpha - .5) < 1e-9);
  assert.equal(step(story, 11.4).opening.backgroundAlpha, 0);
  assert.equal(step(story, 15).opening.active, true, 'Dialogue may accompany playable recovery');
});

test('pause stops both opening and aftermath without consuming future cues', () => {
  const story = createChronosChapterStory(), events = [];
  step(story, 3, cue => events.push(cue));
  const frozen = story.checkpoint(), snapshot = story.snapshot();
  assert.deepEqual(step(story, 26, cue => events.push(cue), {playing: false, aftermathElapsed: 8}), snapshot);
  assert.deepEqual(story.checkpoint(), frozen);
  assert.equal(events.length, 1);
  step(story, 6.3, cue => events.push(cue));
  assert.equal(events.at(-1).id, 'chapter1:false-clearance');
});

test('skip hides the cinematic and releases control without fast-forwarding route or generating gameplay', () => {
  const story = createChronosChapterStory(), events = [];
  step(story, 4, cue => events.push(cue));
  assert.equal(story.skipIntro(), true);
  assert.equal(story.snapshot().routeElapsed, 4);
  assert.equal(story.snapshot().opening.active, false);
  assert.equal(story.snapshot().opening.controlsLocked, false);
  assert.equal(story.snapshot().introSeen, true);
  assert.equal(story.skipIntro(), false);
  step(story, 26, cue => events.push(cue));
  assert.equal(events.length, 1);
  assert.ok(normalizeChronosChapterCheckpoint(story.checkpoint()));
  assert.ok(events.every(cue => !('reward' in cue) && !('damage' in cue) && !('checkpoint' in cue)));
});

test('intro preference, previous consumption and explicit replay are separate from route data', () => {
  const disabled = createChronosChapterStory({introEnabled: false});
  assert.equal(disabled.snapshot().opening.active, false);
  step(disabled, 0);
  assert.ok(normalizeChronosChapterCheckpoint(disabled.checkpoint()));
  const seen = createChronosChapterStory();
  step(seen, 2); seen.skipIntro();
  const ordinaryRetry = createChronosChapterStory({checkpoint: seen.checkpoint(), routeElapsed: 0});
  assert.equal(ordinaryRetry.snapshot().opening.active, false);
  const replay = createChronosChapterStory({checkpoint: seen.checkpoint(), routeElapsed: 0, replayIntro: true, introEnabled: false});
  const replayEvents = [];
  step(replay, 0, cue => replayEvents.push(cue));
  assert.equal(replay.snapshot().opening.active, true);
  assert.equal(replayEvents[0].id, 'chapter1:routine');
  assert.ok(normalizeChronosChapterCheckpoint(replay.checkpoint()));
  assert.equal(replay.snapshot().routeElapsed, 0, 'Caller must also select the real first route stage');
});

test('stage-entry restoration consumes crossed lines without dumping old transmissions', () => {
  const story = createChronosChapterStory({routeElapsed: 144}), events = [];
  step(story, 144, cue => events.push(cue));
  assert.deepEqual(events, []);
  assert.equal(story.snapshot().opening.active, false);
  step(story, 177, cue => events.push(cue));
  assert.deepEqual(events.map(cue => cue.id), ['chapter1:c9-contact']);
  assert.ok(normalizeChronosChapterCheckpoint(story.checkpoint()));
  const resumed = createChronosChapterStory({checkpoint: story.checkpoint()});
  step(resumed, 177, cue => events.push(cue));
  assert.equal(events.length, 1);
});

test('late route jumps consume stale lines instead of playing several radios at once', () => {
  const story = createChronosChapterStory(), events = [];
  step(story, 40, cue => events.push(cue));
  assert.deepEqual(events.map(cue => cue.id), ['chapter1:pursuit-motive']);
  assert.equal(story.snapshot().routeElapsed, 40);
  assert.equal(story.snapshot().introSeen, true);
  assert.ok(normalizeChronosChapterCheckpoint(story.checkpoint()));
});

test('gameplay signals require coherent geography and occur once even across reload', () => {
  const story = createChronosChapterStory(), events = [];
  assert.equal(story.signal('module-recovered', cue => events.push(cue)), false);
  step(story, 90);
  assert.equal(story.signal('module-recovered', cue => events.push(cue)), true);
  assert.equal(story.signal('module-recovered', cue => events.push(cue)), false);
  const resumed = createChronosChapterStory({checkpoint: story.checkpoint()});
  assert.equal(resumed.signal('module-recovered', cue => events.push(cue)), false);
  assert.equal(events.length, 1);
  assert.equal(events[0].speakerId, 'mira');
  assert.equal(story.signal('atlas-entry'), false);
});

test('C9 dialogue follows actual docking and departure without granting repairs or purchases', () => {
  const story = createChronosChapterStory({routeElapsed: 183.2}), events = [];
  assert.equal(story.signal('c9-departure'), false);
  assert.equal(story.signal('c9-arrival', cue => events.push(cue)), true);
  assert.equal(story.signal('c9-departure', cue => events.push(cue)), true);
  assert.deepEqual(events.map(cue => cue.id), ['chapter1:c9-arrival', 'chapter1:c9-departure']);
  assert.equal(story.snapshot().routeElapsed, 183.2);
  assert.ok(events.every(cue => cue.type === 'transmission'));
  assert.ok(normalizeChronosChapterCheckpoint(story.checkpoint()));
});

test('Atlas resolution starts eight seconds of contextual access and a Vulkar lead, not a second boss or reward', () => {
  const story = createChronosChapterStory({routeElapsed: 360}), events = [];
  const emit = cue => events.push(cue);
  assert.equal(story.signal('atlas-disabled', emit), false);
  assert.equal(story.signal('atlas-entry', emit), true);
  assert.equal(story.signal('atlas-phase-two', emit), true);
  assert.equal(story.signal('atlas-disabled', emit), true);
  assert.equal(story.signal('atlas-disabled', emit), false);
  assert.equal(story.snapshot().aftermathReady, false);
  const afterSignal = story.checkpoint();
  step(story, 360, emit, {aftermathElapsed: 2});
  assert.equal(events.at(-1).speakerId, 'iria');
  assert.match(events.at(-1).text, /señal para atacar Chronos/);
  const paused = story.snapshot();
  assert.deepEqual(step(story, 360, emit, {aftermathElapsed: 8, playing: false}), paused);
  step(story, 360, emit, {aftermathElapsed: 5});
  assert.match(events.at(-1).text, /Vulkar/);
  const final = step(story, 360, emit, {aftermathElapsed: CHRONOS_CHAPTER_AFTERMATH_SECONDS});
  assert.equal(final.aftermathReady, true);
  assert.equal(final.aftermath.active, false);
  assert.equal(final.routeElapsed, 360);
  assert.equal(events.length, 5);
  assert.equal(story.snapshot().signalIds.filter(name => name === 'atlas-disabled').length, 1);
  assert.ok(normalizeChronosChapterCheckpoint(afterSignal));
  assert.ok(normalizeChronosChapterCheckpoint(story.checkpoint()));
});

test('reloading the aftermath keeps one-time cues and resumes its existing supplied clock', () => {
  const story = createChronosChapterStory({routeElapsed: 360});
  story.signal('atlas-entry'); story.signal('atlas-disabled');
  step(story, 360, () => {}, {aftermathElapsed: 2.5});
  const checkpoint = story.checkpoint(), events = [];
  const restored = createChronosChapterStory({checkpoint});
  step(restored, 360, cue => events.push(cue), {aftermathElapsed: 2.5});
  assert.deepEqual(events, []);
  step(restored, 360, cue => events.push(cue), {aftermathElapsed: 5});
  assert.deepEqual(events.map(cue => cue.id), ['chapter1:vulkar-lead']);
  assert.throws(() => step(restored, 360, () => {}, {aftermathElapsed: 4}), /monotonic/);
});

test('restoring an earlier route checkpoint cannot carry later service or border story flags forward', () => {
  const story = createChronosChapterStory({routeElapsed: 360});
  story.signal('c9-arrival'); story.signal('c9-departure'); story.signal('atlas-entry'); story.signal('atlas-disabled');
  const restored = createChronosChapterStory({checkpoint: story.checkpoint(), routeElapsed: 72});
  assert.deepEqual(restored.snapshot().signalIds, []);
  assert.equal(restored.snapshot().aftermathReady, false);
  assert.ok(restored.checkpoint().eventIds.every(id => !id.startsWith('chapter1:c9-') && !id.startsWith('chapter1:atlas-')));
  assert.ok(normalizeChronosChapterCheckpoint(restored.checkpoint()));
});

test('story records are immutable, idempotently validated and reject future or unrelated content', () => {
  const story = createChronosChapterStory();
  step(story, 3);
  const valid = story.checkpoint(), input = JSON.parse(JSON.stringify(valid));
  const result = normalizeChronosChapterCheckpoint(input);
  assert.deepEqual(normalizeChronosChapterCheckpoint(result), result);
  assert.deepEqual(input, valid);
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.eventIds));
  for (const patch of [{version: 2}, {routeId: 'n7'}, {contentVersion: 'future'}, {routeElapsed: -1},
    {routeElapsed: Infinity}, {eventIds: ['chapter1:vulkar-lead']}, {eventIds: ['chapter1:gaia-visible']},
    {eventIds: ['unknown']}, {signalIds: ['atlas-disabled']}, {introSkipped: true, introSeen: false},
    {eventIds: [valid.eventIds[0], valid.eventIds[0]]}]) {
    assert.equal(normalizeChronosChapterCheckpoint({...input, ...patch}), null, JSON.stringify(patch));
  }
  assert.equal(normalizeChronosChapterCheckpoint(null), null);
  assert.throws(() => createChronosChapterStory({checkpoint: {version: 2}}), /checkpoint/);
});

test('callbacks are marked before dispatch and invalid clocks do not silently rewind the story', () => {
  const story = createChronosChapterStory(), events = [];
  assert.throws(() => step(story, 0, () => {throw new Error('renderer unavailable');}), /renderer unavailable/);
  step(story, 0, cue => events.push(cue));
  assert.deepEqual(events, []);
  step(story, 3);
  const saved = story.checkpoint();
  assert.throws(() => step(story, 2), /earlier route checkpoint/);
  assert.deepEqual(story.checkpoint(), saved);
  for (const value of [null, {elapsed: NaN}, {elapsed: -1}, {elapsed: 3, playing: 'yes'}, {elapsed: 3, aftermathElapsed: -1}]) {
    assert.throws(() => story.advance(value), /view/);
  }
  assert.throws(() => story.signal('grant-gold'), /Unknown/);
});

test('narrative policy has no engine, storage, rewards or second time source', async () => {
  const source = await readFile(new URL('../src/game/narrative/chronos-chapter.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame\s*\(|setInterval\s*\(|setTimeout\s*\(|Date\.now\s*\(|Math\.random\s*\(/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.|window\.|\.damage\s*=|\.balance\s*=|\.hp\s*=/);
  assert.doesNotMatch(source, /import .*engine|USE_ENGINE_V1/);
});
