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
