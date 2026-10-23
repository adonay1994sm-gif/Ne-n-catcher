import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createChronosVoyageCheckpoint} from '../src/game/progression/chronos-flight.js';

const repository = new URL('..', import.meta.url);
const [html, core, content, game] = await Promise.all(
  ['index.html', 'core-runtime.js', 'content-runtime.js', 'game.js']
    .map(path => readFile(new URL(path, repository), 'utf8')));
const K = {stars: 'neon-stars-v2', unlocked: 'neon-unlocked-v2', best: 'neon-best-v2',
  levelBest: 'neon-level-best-v2', voyage: 'neonCatcher.chronosVoyage.v2',
  journal: 'neon-unlocked-v2:completion-journal:v1'};
const plain = value => JSON.parse(JSON.stringify(value));
function initialSave() {
  return new Map([[K.stars, '{"1":1}'], [K.unlocked, '1'], [K.best, '200'], [K.levelBest, '{"1":200}'],
    [K.voyage, JSON.stringify({version: 2, checkpoint: createChronosVoyageCheckpoint(10, {collected: 36}),
      entry: {hull: 100, score: 777, maxCombo: 4, collected: 36}, unlockedStage: 10, completed: false})],
    ['neon-n7-unlocked-v1', '37'], ['neon-n7-best-v1', '2037']]);
}

/** Controlled integration: actual built handlers and models, mocked Canvas,
 * suppressed incidental threats, seeded already-reached last checkpoint.
 * S1-V1 ends at the real route arrival (Atlas now lives in S1-V5), so the
 * actual update loop alone completes the voyage. The fixed score isolates
 * persistence from scoring. This is a fault/recovery contract, not natural
 * gameplay, visuals, rewards, balance or device QA. */
function harness(t, {saved = initialSave(), failTarget = null, denyRead = null,
  failReceipt = false} = {}) {
  const dom = new JSDOM(html, {url: 'https://neon.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom; t.after(() => window.close());
  const gradient = {addColorStop() {}};
  const context = new Proxy({}, {get: (object, key) => key in object ? object[key] :
    ['createLinearGradient', 'createRadialGradient'].includes(key) ? () => gradient :
      key === 'measureText' ? () => ({width: 30}) : () => {},
  set(object, key, value) {object[key] = value; return true;}});
  window.HTMLCanvasElement.prototype.getContext = () => context;
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({left: 0, top: 0,
    right: 390, bottom: 844, width: 390, height: 844});
  window.Image = class {
    constructor() {this.complete = true; this.naturalWidth = 1536; this.naturalHeight = 1024;}
    get src() {return this.path || '';}
    set src(value) {this.path = value;}
  };
  const pending = new Map(); let rafId = 0;
  window.requestAnimationFrame = callback => (pending.set(++rafId, callback), rafId);
  window.cancelAnimationFrame = id => pending.delete(id);
  window.navigator.vibrate = () => {};
  for (const [key, value] of saved) window.localStorage.setItem(key, value);
  const originalSet = window.Storage.prototype.setItem, originalGet = window.Storage.prototype.getItem;
  const writes = [], fault = {armed: false, triggered: false};
  window.Storage.prototype.setItem = function(key, value) {
    const pendingIntent = JSON.parse(originalGet.call(this, K.journal) || 'null')?.phase === 'pending';
    if (fault.armed && (fault.triggered || (pendingIntent && (key === failTarget ||
        (failReceipt && key === K.journal && JSON.parse(value).phase === 'committed'))))) {
      fault.triggered = true; throw new window.DOMException('Injected interrupted completion', 'QuotaExceededError');
    }
    writes.push({key, value}); return originalSet.call(this, key, value);
  };
  window.Storage.prototype.getItem = function(key) {
    if (key === denyRead) throw new window.DOMException('Injected blocked read', 'SecurityError');
    return originalGet.call(this, key);
  };
  window.eval(core); window.eval(content);
  const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
  assert.equal(game.split(marker).length, 2);
  const hook = `
    window.__COMPLETION_TEST__={
      finishChronos(){
        startLevel(0);warpTimer=0;
        let frames=0,sawAtlas=false;
        for(;frames<3600&&state==='playing';frames++){
          items=[];gates=[];spawnTimer=999;classicScoutTimer=999;
          classicPatrolTimer=Infinity;classicVoyageSpawnTimer=Infinity;classicVoyageHazardTimer=Infinity;
          // The journal tests deliberately own their score.
          score=777;
          update(1/30);
          sawAtlas=sawAtlas||Boolean(atlasBoss);
        }
        return {frames,sawAtlas,score,routeElapsed:classicFlightView?.elapsed};
      },
      attemptCheckpoint(){return saveClassicVoyageCheckpoint(NeonCampaign.createChronosVoyageCheckpoint(1),false);},
      snapshot(){return {state,currentLevel,blocked:completionPersistenceBlocked,
        voyage:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null};}
    };\n`;
  window.eval(game.replace(marker, hook + marker));
  return {window, api: window.__COMPLETION_TEST__, writes, fault, pending,
    finishChronos() {
      const result = plain(window.__COMPLETION_TEST__.finishChronos());
      assert.equal(window.__COMPLETION_TEST__.snapshot().state, 'complete', JSON.stringify(result));
      assert.equal(result.routeElapsed, 360);
      assert.equal(result.sawAtlas, false, 'S1-V1 ends at the route arrival, without Atlas');
      assert.equal(result.score, 777);
      return result;
    },
    snapshot: () => plain(window.__COMPLETION_TEST__.snapshot()),
    dump() {
      return new Map(Array.from({length: window.localStorage.length}, (_, index) => {
        const key = window.localStorage.key(index); return [key, originalGet.call(window.localStorage, key)];
      }));
    }};
}

for (const target of [K.stars, K.levelBest, K.best, K.voyage, K.unlocked, 'receipt']) {
  test(`actual Chronos completion resumes its ${target} interrupted write before loading route/menu`, t => {
    const first = harness(t, {failTarget: target === 'receipt' ? null : target, failReceipt: target === 'receipt'});
    first.fault.armed = true; first.finishChronos();
    assert.equal(first.fault.triggered, true); assert.equal(first.snapshot().state, 'complete');
    assert.equal(first.snapshot().blocked, true);
    const interrupted = first.dump();
    assert.equal(JSON.parse(interrupted.get(K.journal)).phase, 'pending');
    assert.equal(JSON.parse(interrupted.get(K.journal)).equipment, undefined, 'The S1-V1 journal carries no equipment reward');
    assert.equal(interrupted.has('neonCatcher.flightEquipment.v1'), false);
    const restarted = harness(t, {saved: interrupted}), saved = restarted.dump();
    // Sin niveles clásicos, el juego arranca siempre en el nivel 0 (la campaña).
    assert.equal(restarted.snapshot().blocked, false); assert.equal(restarted.snapshot().currentLevel, 0);
    assert.equal(restarted.snapshot().voyage.completed, true);
    assert.equal(saved.get(K.unlocked), '2'); assert.equal(saved.get(K.best), '777');
    assert.equal(JSON.parse(saved.get(K.levelBest))['1'], 777);
    assert.equal(JSON.parse(saved.get(K.stars))['1'], 3);
    assert.equal(JSON.parse(saved.get(K.journal)).phase, 'committed');
    assert.equal(saved.get('neon-n7-unlocked-v1'), '37'); assert.equal(saved.get('neon-n7-best-v1'), '2037');
    assert.equal(restarted.pending.size, 1);
    // A second reload sees the committed receipt and does not replay writes,
    // increment game statistics, replay ads or change the arrival checkpoint.
    const third = harness(t, {saved}), after = third.dump();
    assert.deepEqual(after, saved); assert.equal(third.writes.length, 0);
  });
}

test('blocked startup recovery warns and forbids checkpoint writes over its pending durable intent', t => {
  const first = harness(t, {failTarget: K.stars}); first.fault.armed = true; first.finishChronos();
  const pending = first.dump(), restarted = harness(t, {saved: pending, denyRead: K.best});
  assert.equal(restarted.snapshot().blocked, true);
  assert.match(restarted.window.document.getElementById('toast').textContent, /Guardado pendiente/);
  assert.equal(restarted.api.attemptCheckpoint(), false);
  assert.deepEqual(restarted.dump(), pending);
  assert.equal(restarted.writes.length, 0);
  const available = harness(t, {saved: restarted.dump()});
  assert.equal(available.snapshot().blocked, false); assert.equal(available.snapshot().voyage.completed, true);
  assert.equal(available.dump().get(K.unlocked), '2');
});

test('bootstrap with legacy 100 and current 9000 never rewrites an unreadable current best without a journal', t => {
  const saved = initialSave(); saved.set('neon-best-v1', '100'); saved.set(K.best, '9000');
  const blocked = harness(t, {saved, denyRead: K.best});
  assert.equal(blocked.dump().get(K.best), '9000');
  assert.equal(blocked.dump().get('neon-best-v1'), '100');
  assert.equal(blocked.dump().has(K.journal), false);
  assert.equal(blocked.writes.some(write => write.key === K.best), false);
  assert.deepEqual(blocked.dump(), saved);
  const available = harness(t, {saved: blocked.dump()});
  assert.equal(available.dump().get(K.best), '9000');
  assert.equal(available.writes.some(write => write.key === K.best), false);
  assert.deepEqual(available.dump(), saved);
});

test('bootstrap migration cannot lower unreadable current 9000 before recovering a pending journal with legacy 100', t => {
  const saved = initialSave(); saved.set('neon-best-v1', '100'); saved.set(K.best, '9000');
  const first = harness(t, {saved, failTarget: K.stars});
  first.fault.armed = true; first.finishChronos();
  const pending = first.dump();
  assert.equal(JSON.parse(pending.get(K.journal)).phase, 'pending');
  assert.equal(pending.get(K.best), '9000');
  const blocked = harness(t, {saved: pending, denyRead: K.best});
  assert.equal(blocked.snapshot().blocked, true);
  assert.equal(blocked.dump().get(K.best), '9000');
  assert.equal(blocked.writes.some(write => write.key === K.best), false);
  assert.deepEqual(blocked.dump(), pending);
  const available = harness(t, {saved: blocked.dump()});
  assert.equal(available.snapshot().blocked, false);
  assert.equal(available.snapshot().voyage.completed, true);
  assert.equal(available.dump().get(K.unlocked), '2');
  assert.equal(available.dump().get(K.best), '9000');
  assert.equal(available.writes.some(write => write.key === K.best), false);
  assert.equal(JSON.parse(available.dump().get(K.journal)).phase, 'committed');
  assert.equal(JSON.parse(available.dump().get(K.levelBest))['1'], 777);
  assert.equal(available.dump().get('neon-best-v1'), '100');
});
