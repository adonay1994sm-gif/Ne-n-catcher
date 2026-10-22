import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Execute the actual source module with a minimal Web Audio boundary. This is a
// logic regression; browser autoplay and physical Safari remain separate checks.
const source = await readFile(new URL('../src/game/02-storage-audio.js', import.meta.url), 'utf8');
function audioHarness(music, fx) {
  const context = vm.createContext({
    settings: {music, fx}, musicGain: null, addEventListener() {},
    audioCtx: {
      state: 'running', resumeCount: 0,
      async suspend() { this.state = 'suspended'; },
      async resume() { this.resumeCount++; this.state = 'running'; }
    }
  });
  vm.runInContext(source, context);
  return context;
}

test('effects-only audio resumes after the shared context is suspended', async () => {
  const h = audioHarness(0, 70);
  await h.suspendAudio();
  assert.equal(h.audioCtx.state, 'suspended');
  await h.resumeAudio();
  assert.equal(h.audioCtx.state, 'running');
  assert.equal(h.audioCtx.resumeCount, 1);
  await h.resumeAudio();
  assert.equal(h.audioCtx.resumeCount, 1, 'already running context is not restarted');
});

test('music-only audio resumes, while fully muted audio stays suspended', async () => {
  for (const [music, fx, expected] of [[60, 0, 'running'], [0, 0, 'suspended']]) {
    const h = audioHarness(music, fx);
    await h.suspendAudio();
    await h.resumeAudio();
    assert.equal(h.audioCtx.state, expected);
  }
});

test('missing audio support and rejected autoplay do not break game resumption', async () => {
  const h = audioHarness(0, 70);
  h.audioCtx = null;
  await h.resumeAudio();
  h.audioCtx = {state: 'suspended', resume: () => Promise.reject(new Error('user gesture required'))};
  await h.resumeAudio();
  assert.equal(h.audioCtx.state, 'suspended');
});

// Revisión de audio 22/10 (pasos 1 y 4): bus maestro con limitador y tonos sin clic.
function graphHarness() {
  const edges = [];
  const param = () => ({value: 0, ramps: [], setValueAtTime(v, t) { this.ramps.push(['set', v, t]); },
    linearRampToValueAtTime(v, t) { this.ramps.push(['lin', v, t]); },
    exponentialRampToValueAtTime(v, t) { this.ramps.push(['exp', v, t]); }, setTargetAtTime() {}});
  class FakeContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {kind: 'destination'}; }
    node(kind, extra = {}) {
      return Object.assign({kind, connect(target) { edges.push([kind, target.kind]); return target; }, disconnect() {}}, extra);
    }
    createGain() { return this.node('gain', {gain: param()}); }
    createOscillator() { return this.node('oscillator', {frequency: param(), start() {}, stop() {}}); }
    createDynamicsCompressor() {
      return this.node('limiter', {threshold: param(), knee: param(), ratio: param(), attack: param(), release: param()});
    }
    resume() { return Promise.resolve(); }
  }
  const context = vm.createContext({settings: {music: 50, fx: 70}, musicGain: null, audioCtx: null,
    addEventListener() {}, window: {AudioContext: FakeContext}});
  vm.runInContext(source, context);
  return {context, edges};
}

test('every sound reaches the speakers only through the master limiter', () => {
  const {context, edges} = graphHarness();
  context.ensureAudio();
  context.tone(440, .1);
  const toDestination = edges.filter(([, target]) => target === 'destination').map(([from]) => from);
  assert.deepEqual(toDestination, ['limiter']);
  assert.ok(edges.some(([from, to]) => from === 'gain' && to === 'gain'), 'music and tones go through the master gain');
});

test('a tone starts silent and rises in 5 ms instead of jumping to full gain (no click)', () => {
  const {context} = graphHarness();
  const ac = context.ensureAudio();
  const gains = [];
  const original = ac.createGain.bind(ac);
  ac.createGain = () => { const node = original(); gains.push(node); return node; };
  context.tone(440, .1);
  const ramps = gains.at(-1).gain.ramps;
  assert.equal(gains.at(-1).gain.value, 0.0001);
  assert.equal(ramps[0][0], 'lin');
  assert.ok(Math.abs(ramps[0][2] - .005) < 1e-9);
});
