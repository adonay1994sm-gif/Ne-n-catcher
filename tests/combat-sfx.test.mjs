import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createCombatSfx, COMBAT_SFX_CUES, COMBAT_SFX_SRC, COMBAT_SFX_VOICE_LIMIT,
  COMBAT_SFX_GAIN_BUDGET} from '../src/game/audio/combat-sfx.js';

const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => {resolve = yes; reject = no;}); return {promise, resolve, reject}; };
const base = new URL('../', import.meta.url);

function harness({fetchAsset, decode, panner = true, sourceStartError = false} = {}) {
  const output = {id: 'existing-fx-output'};
  const calls = {fetch: [], decode: 0, gains: [], sources: [], panners: []};
  function node(extra = {}) {
    return {connections: [], disconnects: 0,
      connect(target) {this.connections.push(target); return target;},
      disconnect() {this.disconnects++;}, ...extra};
  }
  function parameter() {
    return {value: 0, values: [], targets: [],
      setValueAtTime(value, time) {this.value = value; this.values.push([value, time]);},
      setTargetAtTime(value, time, duration) {this.value = value; this.targets.push([value, time, duration]);}};
  }
  const context = {state: 'running', currentTime: 0,
    createGain() { const result = node({gain: parameter()}); calls.gains.push(result); return result; },
    createBufferSource() {
      const result = node({starts: [], stops: [], onended: null,
        start(...args) {if (sourceStartError) throw new Error('source failed'); this.starts.push(args);},
        stop(...args) {this.stops.push(args);}});
      calls.sources.push(result); return result;
    },
    async decodeAudioData(bytes) {
      calls.decode++; assert.ok(bytes instanceof ArrayBuffer);
      return decode ? decode(bytes) : {duration: 13.68, length: 656640, numberOfChannels: 1};
    }
  };
  if (panner) context.createStereoPanner = () => {
    const result = node({pan: parameter()}); calls.panners.push(result); return result;
  };
  const fetchBoundary = url => {
    calls.fetch.push(url);
    return fetchAsset ? fetchAsset(url) : Promise.resolve({ok: true, arrayBuffer: async () => new ArrayBuffer(128)});
  };
  const sfx = createCombatSfx({context, output, fetchAsset: fetchBoundary});
  return {context, output, calls, sfx};
}

async function ready(options) {
  const h = harness(options); assert.equal(await h.sfx.load(), true); h.sfx.setPaused(false); return h;
}

test('authoring manifest matches exact runtime offsets, and all 16 performances are original distinct PCM', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('assets/combat_sfx_atlas_v1.json', base)));
  assert.equal(manifest.src, COMBAT_SFX_SRC);
  assert.deepEqual(manifest.cues, COMBAT_SFX_CUES);
  const measurements = JSON.parse(fs.readFileSync(new URL('art-source/audio/combat-sfx-v1/measurements.json', base)));
  assert.equal(measurements.stems.length, 16);
  assert.equal(new Set(measurements.stems.map(item => item.sha256)).size, 16);
  assert.ok(measurements.estimatedDecodedFloat32Bytes < 3 * 1024 * 1024);
  assert.ok(measurements.runtimeBytes < 300000);
  const sourceRoot = new URL('art-source/audio/combat-sfx-v1/', base);
  for (const stem of measurements.stems) {
    const bytes = fs.readFileSync(new URL(stem.path, sourceRoot));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), stem.sha256);
    assert.equal(stem.clippedSamples, 0);
    assert.ok(stem.peakDbfs < -1.5);
  }
  const bytes = fs.readFileSync(new URL(COMBAT_SFX_SRC, base));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), measurements.runtimeSha256);
});

test('cue boundaries have silence guards and cannot leak into a neighboring event', () => {
  const segments = Object.values(COMBAT_SFX_CUES).flatMap(item => item.variants).sort((a,b) => a.offset - b.offset);
  for (let i = 1; i < segments.length; i++) assert.ok(segments[i].offset - (segments[i-1].offset + segments[i-1].duration) >= .1199);
  assert.ok(segments.at(-1).offset + segments.at(-1).duration <= 13.68);
});

test('unsupported boundaries use legacy fallback without constructing another AudioContext', () => {
  for (const options of [{}, {context: {}, output: {}}, {context: {createGain() {throw new Error('unsupported');}}, output: {}}]) {
    assert.equal(createCombatSfx(options), null);
  }
});

test('construction connects only to its supplied bus, starts paused, and never fetches or plays automatically', () => {
  const h = harness();
  assert.deepEqual(h.calls.gains[0].connections, [h.output]);
  assert.equal(h.sfx.snapshot().paused, true);
  assert.equal(h.sfx.play('phaser'), false);
  assert.equal(h.calls.fetch.length, 0); assert.equal(h.calls.sources.length, 0);
});

test('concurrent loads share one network request and decoder allocation, including calls after readiness', async () => {
  const network = deferred();
  const h = harness({fetchAsset: () => network.promise});
  const first = h.sfx.load(), second = h.sfx.load();
  assert.equal(first, second); await tick();
  assert.equal(h.calls.fetch.length, 1); assert.equal(h.sfx.snapshot().loading, true);
  network.resolve({ok: true, arrayBuffer: async () => new ArrayBuffer(200)});
  assert.equal(await first, true); assert.equal(await second, true);
  assert.equal(await h.sfx.load(), true);
  assert.equal(h.calls.fetch.length, 1); assert.equal(h.calls.decode, 1);
  assert.equal(h.sfx.snapshot().decodedBytes, 2626560);
});

test('a real playback uses exactly one bounded segment and alternates distinct performances', async () => {
  const h = await ready(); h.context.currentTime = 5;
  assert.equal(h.sfx.play('phaser', {eventId: 'shot-a', pan: -.4}), true);
  assert.deepEqual(h.calls.sources[0].starts, [[5, 0, .2]]);
  assert.equal(h.calls.panners[0].pan.value, -.4);
  h.context.currentTime += .21;
  assert.equal(h.sfx.play('phaser', {eventId: 'shot-b', pan: 99}), true);
  assert.deepEqual(h.calls.sources[1].starts, [[5.21, .32, .2]]);
  assert.equal(h.calls.panners[1].pan.value, .75);
  h.context.currentTime += .21; h.sfx.play('phaser', {eventId: 'shot-c'});
  assert.equal(h.calls.sources[2].starts[0][1], 0);
});

test('missing stereo panner still plays through the shared gain graph without creating spatial polyfills', async () => {
  const h = await ready({panner: false});
  assert.equal(h.sfx.play('impact-metal', {pan: .5}), true);
  assert.equal(h.calls.panners.length, 0);
  assert.equal(h.calls.gains.at(-1).connections[0], h.calls.gains[0]);
});

test('repeating an animation event ID cannot fire the sound twice, even after its original voice has ended', async () => {
  const h = await ready();
  assert.equal(h.sfx.play('missile-launch', {eventId: 'missile-78'}), true);
  h.context.currentTime = 2;
  assert.equal(h.sfx.play('missile-launch', {eventId: 'missile-78'}), false);
  assert.equal(h.calls.sources.length, 1);
  assert.equal(h.sfx.play('missile-launch', {eventId: 'missile-79'}), true);
});

test('an impact storm is rate-limited and low-priority bursts cannot exhaust the mix budget', async () => {
  const h = await ready();
  for (let i = 0; i < 100; i++) h.sfx.play('impact-metal', {eventId: `storm-${i}`});
  assert.equal(h.calls.sources.length, 1);
  assert.equal(h.sfx.snapshot().dropped, 99);
  h.context.currentTime += .05;
  h.sfx.play('impact-metal');
  h.context.currentTime += .05;
  h.sfx.play('impact-metal');
  h.context.currentTime += .05;
  assert.equal(h.sfx.play('impact-metal'), false, 'maximum three simultaneous metal collisions');
  assert.ok(h.sfx.snapshot().activeVoices <= COMBAT_SFX_VOICE_LIMIT);
  assert.ok(h.sfx.snapshot().activeGain <= COMBAT_SFX_GAIN_BUDGET);
});

test('player hull impact steals expendable phaser voices instead of getting lost in a busy mix', async () => {
  const h = await ready();
  for (let i = 0; i < 3; i++) {h.sfx.play('phaser'); h.context.currentTime += .05;}
  h.sfx.play('impact-metal'); h.context.currentTime += .05;
  h.sfx.play('impact-plasma');
  assert.equal(h.sfx.play('hull-hit'), true);
  assert.ok(h.sfx.snapshot().stolen >= 1);
  assert.ok(h.calls.sources.some(source => source.stops.length > 0));
  assert.ok(h.sfx.snapshot().activeGain <= COMBAT_SFX_GAIN_BUDGET + Number.EPSILON);
});

test('Atlas collapse is prioritised above combat, but repeated collapse frames remain one event', async () => {
  const h = await ready(); h.sfx.play('hull-hit'); h.sfx.play('atlas-charge');
  assert.equal(h.sfx.play('atlas-collapse', {eventId: 'atlas-end'}), true);
  h.context.currentTime += 1.1;
  assert.equal(h.sfx.play('atlas-collapse', {eventId: 'atlas-end'}), false);
  assert.equal(h.sfx.snapshot().played, 3);
});

for (const policy of ['pause', 'mute', 'zero-volume', 'suspended-context']) {
  test(`${policy} stops or suppresses playback and does not replay an old burst on recovery`, async () => {
    const h = await ready(); h.sfx.play('missile-launch');
    if (policy === 'pause') h.sfx.setPaused(true);
    if (policy === 'mute') h.sfx.setEnabled(false);
    if (policy === 'zero-volume') h.sfx.setVolume(0);
    if (policy === 'suspended-context') h.context.state = 'suspended';
    assert.equal(h.sfx.play('phaser'), false);
    if (policy !== 'suspended-context') {
      assert.equal(h.sfx.snapshot().activeVoices, 0);
      assert.equal(h.calls.sources[0].stops.length, 1);
    }
    h.sfx.setPaused(false); h.sfx.setEnabled(true); h.sfx.setVolume(1); h.context.state = 'running';
    assert.equal(h.calls.sources.length, 1);
    h.context.currentTime += 2;
    assert.equal(h.sfx.play('phaser'), true);
  });
}

test('volume clamps to the supported range and uses smoothing on the existing local bus', async () => {
  const h = await ready(); h.sfx.setVolume(4);
  assert.equal(h.sfx.snapshot().volume, 1);
  h.sfx.setVolume(.3);
  assert.deepEqual(h.calls.gains[0].gain.targets.at(-1), [.3, 0, .02]);
});

for (const failure of ['http', 'empty', 'oversized', 'decoder', 'short', 'long']) {
  test(`${failure} load failure is contained and exposes fallback without scheduling a retry loop`, async () => {
    const h = harness({fetchAsset: async () => ({ok: failure !== 'http', arrayBuffer: async () =>
      new ArrayBuffer(failure === 'empty' ? 0 : failure === 'oversized' ? 4 * 1024 * 1024 + 1 : 100)}),
      decode: async () => {
        if (failure === 'decoder') throw new Error('unsupported codec');
        return {duration: failure === 'short' ? 4 : failure === 'long' ? 200 : 13.68};
      }});
    assert.equal(await h.sfx.load(), false);
    assert.equal(h.sfx.snapshot().failed, true); assert.equal(h.sfx.snapshot().ready, false);
    for (let frame = 0; frame < 100; frame++) assert.equal(h.sfx.play('phaser'), false);
    assert.equal(h.calls.fetch.length, 1); assert.equal(h.calls.sources.length, 0);
  });
}

test('a synchronous fetch failure permits a later explicit load retry', async () => {
  let tries = 0;
  const h = harness({fetchAsset: () => {
    if (++tries === 1) throw new Error('network unavailable');
    return {ok: true, arrayBuffer: async () => new ArrayBuffer(128)};
  }});
  assert.equal(await h.sfx.load(), false); assert.equal(h.sfx.snapshot().loading, false);
  assert.equal(await h.sfx.load(), true); assert.equal(tries, 2);
});

test('ending a voice releases nodes once even when callbacks race with pause', async () => {
  const h = await ready(); h.sfx.play('missile-launch');
  const source = h.calls.sources[0], callback = source.onended;
  h.sfx.setPaused(true); callback();
  assert.equal(source.disconnects, 1); assert.equal(h.calls.gains[1].disconnects, 1);
  assert.equal(h.sfx.snapshot().activeVoices, 0);
});

test('elapsed voices are pruned even if the audio thread delays onended', async () => {
  const h = await ready(); h.sfx.play('phaser');
  h.context.currentTime = 10; h.sfx.play('missile-launch');
  assert.equal(h.sfx.snapshot().activeVoices, 1);
  assert.equal(h.calls.sources[0].disconnects, 1);
});

test('disposing during decoding cannot revive the graph or retain decoded memory', async () => {
  const decoded = deferred();
  const h = harness({decode: () => decoded.promise});
  const pending = h.sfx.load(); await tick(); await tick();
  h.sfx.dispose(); h.sfx.dispose();
  decoded.resolve({duration: 13.68, length: 656640, numberOfChannels: 1});
  assert.equal(await pending, false); assert.equal(await h.sfx.load(), false);
  assert.equal(h.sfx.snapshot().disposed, true); assert.equal(h.sfx.snapshot().decodedBytes, 0);
  assert.equal(h.calls.gains[0].disconnects, 1);
  h.sfx.setPaused(false); h.sfx.setEnabled(true); h.sfx.setVolume(1);
  assert.equal(h.sfx.play('phaser'), false); assert.equal(h.calls.sources.length, 0);
});

test('unknown names and prototype keys cannot schedule sources; snapshots cannot mutate policy', async () => {
  const h = await ready();
  for (const name of ['unknown', '__proto__', 'constructor', 'toString', null]) assert.equal(h.sfx.play(name), false);
  assert.equal(h.calls.sources.length, 0);
  assert.throws(() => {h.sfx.snapshot().enabled = false;}, TypeError);
  assert.equal(h.sfx.snapshot().enabled, true);
});

test('a failed source start releases the partially constructed graph and remains recoverable', async () => {
  const h = await ready({sourceStartError: true});
  assert.equal(h.sfx.play('hull-hit'), false);
  assert.equal(h.sfx.snapshot().activeVoices, 0); assert.equal(h.sfx.snapshot().ready, true);
  assert.equal(h.calls.sources[0].disconnects, 1);
});
