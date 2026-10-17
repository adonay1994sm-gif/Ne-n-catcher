import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const root = new URL('..', import.meta.url);
const [html, core, content, game] = await Promise.all(
  ['index.html', 'core-runtime.js', 'content-runtime.js', 'game.js'].map(path => readFile(new URL(path, root), 'utf8'))
);

test('content is packaged before the campaign and adds no RAF owner or Engine V1 import', async () => {
  assert.ok(html.indexOf('core-runtime.js') < html.indexOf('content-runtime.js'));
  assert.ok(html.indexOf('content-runtime.js') < html.indexOf('game.js'));
  assert.doesNotMatch(content, /requestAnimationFrame|EngineCore|CampaignAdapter/);
  assert.match(await readFile(new URL('src/engine/CampaignAdapter.js', root), 'utf8'), /USE_ENGINE_V1 = false/);
  for (const target of ['www/content-runtime.js', 'ios/App/App/public/content-runtime.js']) {
    assert.equal(await readFile(new URL(target, root), 'utf8'), content);
  }
});

function harness(unlocked = 1) {
  const dom = new JSDOM(html, {url: 'https://neon.test/?campaign=n7', runScripts: 'outside-only', pretendToBeVisual: true});
  const {window} = dom;
  const gradient = {addColorStop() {}};
  const ctx = new Proxy({}, {get: (target, key) => key in target ? target[key]
    : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient
    : key === 'measureText' ? () => ({width: 20}) : () => {},
    set(target, key, value) { target[key] = value; return true; }});
  const atlasDraws = [];
  ctx.drawImage = (image, ...arguments_) => {
    if (image?.path === 'assets/ch01_atlas_v1.webp') atlasDraws.push(arguments_);
  };
  window.__ATLAS_DRAWS__ = atlasDraws;
  window.HTMLCanvasElement.prototype.getContext = () => ctx;
  window.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,";
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({left: 0, top: 0, width: 390, height: 844});
  const pending = new Map(); let id = 0;
  window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
  window.cancelAnimationFrame = key => pending.delete(key);
  window.Image = class {
    constructor() { this.complete = true; this.naturalWidth = this.naturalHeight = 320; }
    set src(value) { this.path = value; }
  };
  window.navigator.vibrate = () => true;
  window.localStorage.setItem('neon-unlocked-v2', '8');
  window.localStorage.setItem('neon-best-v1', '1200');
  window.localStorage.setItem('neon-n7-unlocked-v1', String(unlocked));
  window.eval(core); window.eval(content);
  const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
  assert.ok(game.includes(marker));
  window.eval(game.replace(marker, `
  window.__N7_TEST__ = {
    startLevel, update, render, pauseGame, resumeGame, fireManualShot,
    atlasDraws: () => window.__ATLAS_DRAWS__,
    shooter: () => items.find(item => item.n7?.ch01Animator),
    isolateShooter(item) { items = [item]; player.x = player.target = item.x; },
    explosions: () => explosions,
    snapshot: () => ({state,hull,collected,ammo,score,currentLevel,elapsed,energySpawned,energyBudget,
      directorTime:encounterDirector?.elapsed,cursor:encounterDirector?.cursor,
      finished:encounterDirector?.finished,levelCount:LEVELS.length,
      seed:encounterDirector?.plan.seed,version:encounterDirector?.plan.version,
      unlocked:getUnlocked(),keys:{...KEYS},items:items.map(item=>({id:item.id,x:item.x,y:item.y})),
      corePool:particlePool.size}),
    runRoute(index) {
      startLevel(index);
      player.x = player.target = encounterDirector.plan.corridor.center;
      let maxEntities=0,frames=0;
      for(;frames<9000 && state==='playing';frames++) {
        update(1/60);maxEntities=Math.max(maxEntities,items.length);
        if(frames%120===0)render(frames*1000/60);
      }
      return {state,hull,collected,goal:level().goal,maxEntities,frames,unlocked:getUnlocked()};
    }
  };
${marker}`));
  return {dom, window, pending, api: window.__N7_TEST__};
}

test('100 routes run through the real legacy update and collision pipeline', () => {
  const h = harness(100);
  try {
    assert.equal(h.api.snapshot().levelCount, 100);
    for (let index = 0; index < 100; index++) {
      const result = h.api.runRoute(index);
      assert.equal(result.state, 'complete', `Route ${index + 1}: ${JSON.stringify(result)}`);
      assert.equal(result.hull, 100, `Guaranteed refuge failed at route ${index + 1}`);
      assert.ok(result.collected >= result.goal);
      assert.ok(result.maxEntities < 128, `Unbounded entities in route ${index + 1}`);
    }
    assert.equal(h.pending.size, 1, 'Legacy remains the only RAF owner');
  } finally { h.dom.window.close(); }
});

test('N-7 progression unlocks its own next route without overwriting original saves', () => {
  const h = harness();
  try {
    const result = h.api.runRoute(0);
    assert.equal(result.state, 'complete');
    assert.equal(result.unlocked, 2);
    assert.equal(h.window.localStorage.getItem('neon-unlocked-v2'), '8');
    assert.equal(h.window.localStorage.getItem('neon-best-v1'), '1200');
    assert.equal(h.window.localStorage.getItem('neon-n7-unlocked-v1'), '2');
    assert.ok(JSON.parse(h.window.localStorage.getItem('neon-n7-stars-v1'))['1'] > 0);
  } finally { h.dom.window.close(); }
});

test('pause freezes encounters; resume and restart do not duplicate scheduled waves', () => {
  const h = harness(100);
  try {
    h.api.startLevel(36);
    for (let i = 0; i < 240; i++) h.api.update(1 / 60);
    const first = h.api.snapshot();
    assert.ok(first.cursor > 0);
    h.api.pauseGame();
    for (let i = 0; i < 180; i++) h.api.update(1 / 60);
    assert.equal(h.api.snapshot().directorTime, first.directorTime);
    assert.equal(h.api.snapshot().cursor, first.cursor);
    h.api.resumeGame(); h.api.update(1 / 60);
    assert.ok(h.api.snapshot().directorTime > first.directorTime);
    h.api.startLevel(36);
    for (let i = 0; i < 240; i++) h.api.update(1 / 60);
    const restarted = h.api.snapshot();
    assert.equal(restarted.seed, first.seed);
    assert.equal(restarted.cursor, first.cursor);
    assert.deepEqual(Array.from(restarted.items, item => [item.id, item.x, item.y]),
      Array.from(first.items, item => [item.id, item.x, item.y]));
    assert.equal(h.pending.size, 1);
  } finally { h.dom.window.close(); }
});

test('resume tolerates a queued RAF timestamp older than the resume handler', () => {
  const h = harness(100);
  try {
    h.api.startLevel(36);
    for (let i = 0; i < 240; i++) h.api.update(1 / 60);
    h.api.pauseGame();
    const paused = h.api.snapshot();
    // RAF timestamps describe the start of the rendering opportunity. An input
    // handler in that opportunity can set last to a newer performance.now().
    Object.defineProperty(h.window.performance, 'now', {value: () => 1000, configurable: true});
    h.api.resumeGame();
    const runPendingFrame = now => {
      assert.equal(h.pending.size, 1);
      const [id, frame] = h.pending.entries().next().value;
      h.pending.delete(id);
      frame(now);
    };
    assert.doesNotThrow(() => runPendingFrame(999.8));
    assert.equal(h.api.snapshot().directorTime, paused.directorTime);
    assert.equal(h.api.snapshot().state, 'playing');
    runPendingFrame(1016.7);
    assert.ok(h.api.snapshot().directorTime > paused.directorTime);
    assert.equal(h.pending.size, 1, 'Resume must retain exactly one RAF');
  } finally { h.dom.window.close(); }
});

test('N-7 labels routes and shows wave progress independently of debris warnings', () => {
  const h = harness(100);
  try {
    h.api.startLevel(36);
    for (let i = 0; i < 250; i++) h.api.update(1 / 60);
    const progress = h.window.document.getElementById('encounterProgress');
    assert.equal(h.window.document.getElementById('hudLevel').previousElementSibling.textContent, 'RUTA');
    assert.ok(progress.classList.contains('active'));
    assert.match(progress.querySelector('em').textContent, /^1\/[6-8]$/);
    assert.ok(!h.window.document.getElementById('hazardWarning').classList.contains('show'));
    h.api.startLevel(36);
    assert.match(progress.querySelector('em').textContent, /^0\/[6-8]$/);
  } finally { h.dom.window.close(); }
});

test('legacy shots damage and destroy CH-01 while rendering distinct atlas frames', () => {
  const h = harness(100);
  try {
    h.api.startLevel(36);
    let shooter;
    for (let frame = 0; frame < 1600; frame++) {
      shooter = h.api.shooter();
      if (shooter?.y > 60) break;
      h.api.update(1 / 60);
    }
    assert.ok(shooter?.n7.ch01Animator, 'Route 37 must spawn an animated shooter');
    h.api.isolateShooter(shooter);
    h.api.render(0);
    assert.ok(h.api.atlasDraws().some(draw => draw[2] === 256 && draw[3] === 256),
      'The real legacy renderer must draw a 256px authored frame');
    assert.equal(h.api.fireManualShot(), true);
    assert.equal(shooter.hp, 1);
    assert.equal(shooter.n7.ch01Animator.getFrame().state, 'hurt');
    const hurt = shooter.n7.ch01Animator.getFrame().rect;
    h.api.render(.5);
    assert.ok(h.api.atlasDraws().some(draw => draw[0] === hurt.x && draw[1] === hurt.y),
      'The hit pose must be drawn from its own atlas row');
    for (let frame = 0; frame < 20; frame++) h.api.update(1 / 60);
    h.api.isolateShooter(shooter);
    const beforeReward = h.api.snapshot().score;
    assert.equal(h.api.fireManualShot(), true);
    assert.equal(shooter.hp, 0);
    assert.equal(shooter.n7.ch01Animator.getFrame().state, 'destroy');
    assert.ok(h.api.explosions().some(explosion => explosion.ch01Animator === shooter.n7.ch01Animator));
    assert.equal(h.api.snapshot().score - beforeReward, 10);
    h.api.render(1);
    const destroyed = shooter.n7.ch01Animator.getFrame().rect;
    assert.ok(h.api.atlasDraws().some(draw => draw[0] === destroyed.x && draw[1] === destroyed.y),
      'Destruction draws its atlas frame after removing the entity');
    for (let frame = 0; frame < 40; frame++) h.api.update(1 / 60);
    assert.equal(h.api.snapshot().score, beforeReward + 10, 'Reward is granted only once');
  } finally { h.dom.window.close(); }
});
