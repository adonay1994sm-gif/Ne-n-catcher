import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

// Flujo real de los viajes secundarios con el game.js construido: reintentar
// tras morir, rejugar un viaje hecho y limpiar el HUD al volver al mapa.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(join(root, file), 'utf8');
const [html, game, core, content] = await Promise.all(['index.html', 'game.js', 'core-runtime.js', 'content-runtime.js'].map(read));
const MARKER = '  legacyFrameId = requestAnimationFrame(frame);\n})();';

function context() {
  const gradient = {addColorStop() {}};
  return new Proxy({}, {get(target, key) {
    if (key in target) return target[key];
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    if (key === 'measureText') return value => ({width: String(value).length * 14});
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; }});
}

function harness({unlocked = '2', query = ''} = {}) {
  const dom = new JSDOM(html, {url: `https://neon.test/${query}`, runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => context();
  w.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({x: 0, y: 0, left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844});
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {}; w.navigator.vibrate = () => true;
  w.AdBridge = {showRewarded: async () => true, showInterstitial: async () => false};
  w.Image = class { constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
    set src(v) { this._src = v; this.complete = true; this.naturalWidth = 1536; this.naturalHeight = 768; } get src() { return this._src || ''; } };
  w.localStorage.setItem('neon-unlocked-v2', unlocked);
  w.eval(core); w.eval(content);
  const hook = `window.T={forceComplete:()=>{state='complete';},level:()=>currentLevel,requestStage:n=>{classicVoyageRequestedStage=n;},startSideVoyage,startLevel,finishGame,goHome,buildLevelGrid,hit:n=>{classicHullReserve=0;damageShip(n);return hull;},
    st:()=>({state,side:classicSideVoyage?.ficha.id||null,route:classicFlightView?.routeId||null,
      hud:!ui.hud.classList.contains('hidden'),fire:!ui.fire.classList.contains('hidden'),scope:classicSalvageState?.activeRun?.scope||null}),
    adv:s=>{for(let r=s;r>1e-9;r-=1/60)update(1/60);},
    finish:()=>{collected=36;for(let i=0;i<30000&&!classicFlight.snapshot().canFinish;i++)classicFlightView=classicFlight.advance(.034,collected,classicFlightEvent);
      completeLevel();if(atlasBoss){atlasBoss.resolved=true;completeLevel();}}};\n`;
  assert.equal(game.split(MARKER).length, 2);
  w.eval(game.replace(MARKER, hook + MARKER));
  const saved = id => JSON.parse(w.localStorage.getItem(`neonCatcher.voyage.${id}.v1`) || 'null');
  const route = id => w.document.querySelector(`.sector-route[data-voyage="${id}"]`)?.dataset.status;
  return {w, T: w.T, saved, route};
}

test('retrying after dying in a side voyage stays in that voyage and never touches S1-V1', () => {
  const {w, T} = harness();
  const v1 = w.localStorage.getItem('neonCatcher.chronosVoyage.v2');
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.finishGame('hull');
  T.startLevel(0);
  assert.deepEqual([T.st().side, T.st().route], ['S1-V2', 'gaia-outer-net']);
  T.adv(1);
  assert.equal(w.localStorage.getItem('neonCatcher.chronosVoyage.v2'), v1);
});

test('replaying a finished voyage keeps it done on the map and keeps the next route open', () => {
  const {T, saved, route} = harness();
  T.startSideVoyage('S1-V2'); T.finish();
  assert.equal(saved('S1-V2').completed, true);
  T.startSideVoyage('S1-V2'); T.adv(1); T.goHome(); T.buildLevelGrid();
  assert.equal(saved('S1-V2').completed, true);
  assert.equal(route('S1-V2'), 'done'); assert.equal(route('S1-V3'), 'open');
});

test('finishing a side voyage shows its completion screen with the next voyage, and the HUD hidden', () => {
  const {w, T, route} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1); T.finish();
  assert.deepEqual([T.st().state, T.st().hud, T.st().fire], ['complete', false, false]);
  assert.equal(w.document.getElementById('complete').classList.contains('show'), true);
  assert.match(w.document.getElementById('completeTitle').textContent, /S1-V2/);
  assert.match(w.document.getElementById('nextLevel').textContent, /SIGUIENTE VIAJE: S1-V3/);
  w.document.getElementById('replayLevel').click();
  assert.deepEqual([T.st().state, T.st().side], ['playing', 'S1-V2'], 'Repeat replays the same voyage');
  T.finish();
  w.document.getElementById('nextLevel').click();
  assert.deepEqual([T.st().state, T.st().side], ['playing', 'S1-V3'], 'Next starts the next voyage');
  T.goHome(); T.buildLevelGrid();
  assert.equal(route('S1-V2'), 'done');
});

test('side voyages keep their own salvage scope apart from the Chronos voyage', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V3'); T.adv(.5);
  assert.equal(T.st().scope, 'voyage:S1-V3');
});

test('Iria only believes the record once S1-V5 is done', () => {
  const {w, T} = harness();
  T.buildLevelGrid();
  w.document.querySelector('.sector-place[data-place="gaia"]').click();
  assert.match(w.document.getElementById('baseTalkLine').textContent, /firma coincide/);
});

test('without ?dev=1 there is no development panel and saves use the real keys', () => {
  const {w} = harness();
  assert.equal(w.document.getElementById('devOpen'), null);
  assert.equal(w.document.getElementById('devBadge'), null);
  assert.equal(w.NeonDev, undefined);
});

test('?dev=1 opens every voyage and stage with a separate save and an optional invulnerable hull', () => {
  const {w, T} = harness({unlocked: '1', query: '?dev=1'});
  assert.equal(w.localStorage.getItem('neon-unlocked-v2'), '1', 'real progress untouched');
  assert.equal(w.localStorage.getItem('neon-dev-v1:neon-unlocked-v2'), '10', 'everything unlocked in dev');
  w.document.getElementById('devOpen').click();
  const panel = w.document.getElementById('devPanel');
  assert.equal(panel.classList.contains('show'), true);
  assert.equal(panel.querySelectorAll('.dev-row').length, 10, 'the 10 voyages; no classic levels any more');
  const row = [...panel.querySelectorAll('.dev-row')].find(node => node.textContent.includes('S2-V3'));
  [...row.querySelectorAll('button')].find(node => node.textContent === '4').click();
  assert.deepEqual([T.st().side, T.st().route], ['S2-V3', 'slag-belt']);
  T.adv(.5);
  assert.equal(w.localStorage.getItem('neonCatcher.voyage.S2-V3.v1'), null);
  assert.ok(w.localStorage.getItem('neon-dev-v1:neonCatcher.voyage.S2-V3.v1'));
  assert.ok(T.hit(40) < 100, 'damage counts while the option is off');
  const god = w.document.getElementById('devInvulnerable'); god.checked = true; god.dispatchEvent(new w.Event('change'));
  assert.equal(T.hit(40), 100, 'the invulnerable hull ignores damage');
  assert.equal(T.st().state, 'playing');
});

test('a stage picked for S1-V1 never leaks into another voyage and going home clears the side voyage', () => {
  const {T} = harness();
  T.requestStage(9);
  T.startSideVoyage('S1-V2');
  assert.deepEqual([T.st().state, T.st().side], ['playing', 'S1-V2']);
  T.goHome();
  assert.equal(T.st().side, null);
});

test('after S1-V1, Play continues the voyage campaign with the next open route', () => {
  const {w, T} = harness({unlocked: '2'});
  assert.match(w.document.getElementById('playSector').textContent, /S1-V2/);
  w.document.getElementById('play').click();
  assert.deepEqual([T.st().state, T.st().side], ['playing', 'S1-V2']);
  T.finish();
  T.goHome();
  assert.match(w.document.getElementById('playSector').textContent, /S1-V3/);
});

test('classic levels are gone from the game: RUTA only shows the voyage map and the menu counts voyages', () => {
  const {w, T} = harness({unlocked: '10'});
  assert.equal(w.document.getElementById('levelGrid'), null);
  assert.equal(w.document.querySelector('.level-card'), null);
  T.buildLevelGrid();
  assert.ok(w.document.querySelector('.sector-route'));
  assert.match(w.document.getElementById('unlockedText').textContent, /^1\/10$/, 'only S1-V1 counts as done');
  w.document.getElementById('play').click();
  assert.equal(T.st().side, 'S1-V2', 'Play continues with the next voyage');
});

test('with every voyage done, Play opens the map and Next never starts a classic level', () => {
  const {w, T} = harness({unlocked: '10'});
  assert.equal(T.level(), 0, 'old saves with classic levels unlocked start at level 0');
  for (const id of ['S1-V2', 'S1-V3', 'S1-V4', 'S1-V5', 'S2-V1', 'S2-V2', 'S2-V3', 'S2-V4', 'S2-V5']) {
    T.startSideVoyage(id); T.finish(); T.goHome();
  }
  w.document.getElementById('play').click();
  assert.equal(T.st().state, 'menu');
  assert.equal(w.document.getElementById('levelSelect').classList.contains('show'), true, 'Play opens the map');
  T.startLevel(0); T.forceComplete();
  w.document.getElementById('nextLevel').click();
  assert.equal(T.level(), 0, 'Next after replaying S1-V1 never opens classic level 2');
  assert.equal(T.st().state, 'menu');
  assert.equal(w.document.getElementById('levelSelect').classList.contains('show'), true, 'it opens the map instead');
});

test('a map voyage counts as one run for interstitials only the first time it is completed', () => {
  const {w, T} = harness();
  const games = () => Number(w.localStorage.getItem('neon-games-v2') || 0);
  const before = games();
  T.startSideVoyage('S1-V2'); T.finish();
  assert.equal(games(), before + 1);
  T.startSideVoyage('S1-V2'); T.finish();
  assert.equal(games(), before + 1);
});

test('Next after the last voyage of sector 2 opens the map on the SECTOR 2 tab', () => {
  const {w, T} = harness({unlocked: '10'});
  for (const id of ['S1-V2', 'S1-V3', 'S1-V4', 'S1-V5', 'S2-V1', 'S2-V2', 'S2-V3', 'S2-V4']) {
    T.startSideVoyage(id); T.finish(); T.goHome();
  }
  T.startSideVoyage('S2-V5'); T.finish();
  w.document.getElementById('nextLevel').click();
  assert.equal(w.document.querySelector('.sector-tab[aria-selected="true"]')?.dataset.sector, '2');
});

test('the S1-V1 briefing opened from the map names a Chronos → Gaia stage', () => {
  const {w, T} = harness();
  T.buildLevelGrid();
  w.document.querySelector('.sector-route[data-voyage="S1-V1"]').click();
  assert.match(w.document.getElementById('briefingSector').textContent, /^TRAMO 1\.\d+ · CHRONOS → GAIA$/);
});

test('map voyages earn 0-3 stars like S1-V1, keep the best and the menu counts them out of 30', () => {
  const {w, T, saved, route} = harness();
  const lit = () => w.document.querySelectorAll('#starsAwarded span:not(.off)').length;
  T.startSideVoyage('S1-V2'); T.finish();
  assert.equal(saved('S1-V2').stars, 3, 'full hull and every CRONIUM: 3 stars');
  assert.equal(lit(), 3);
  T.startSideVoyage('S1-V2'); T.adv(.5); for (let i = 0; i < 20 && T.hit(10) >= 70; i++); T.finish();
  assert.equal(lit(), 2, 'a damaged hull earns fewer stars this run');
  assert.equal(saved('S1-V2').stars, 3, 'but the best result is kept');
  T.goHome();
  assert.equal(w.document.getElementById('totalStars').textContent, '4/30', 'S1-V2 (3) + S1-V1 done (at least 1)');
  T.buildLevelGrid();
  assert.match(w.document.querySelector('.sector-route[data-voyage="S1-V2"] small').textContent, /★★★/);
  assert.equal(route('S1-V2'), 'done');
});

test('voyages finished before per-voyage stars count at least one star instead of ☆☆☆', () => {
  const {w, T} = harness();
  T.startSideVoyage('S1-V2'); T.finish(); T.goHome();
  const key = 'neonCatcher.voyage.S1-V2.v1', record = JSON.parse(w.localStorage.getItem(key));
  delete record.stars; w.localStorage.setItem(key, JSON.stringify(record));
  T.goHome();
  assert.equal(w.document.getElementById('totalStars').textContent, '2/30', 'S1-V1 and S1-V2 done: one star each');
  T.buildLevelGrid();
  assert.match(w.document.querySelector('.sector-route[data-voyage="S1-V2"] small').textContent, /★☆☆/);
});

test('a voyage that is not done adds no stars, whatever its record says', () => {
  const {w, T, route} = harness();
  w.localStorage.setItem('neonCatcher.voyage.S1-V2.v1', JSON.stringify({...JSON.parse((() => {
    T.startSideVoyage('S1-V2'); T.finish(); T.goHome(); return w.localStorage.getItem('neonCatcher.voyage.S1-V2.v1');
  })()), completed: false, stars: 3}));
  T.goHome();
  assert.equal(w.document.getElementById('totalStars').textContent, '1/30', 'only S1-V1 counts');
  T.buildLevelGrid();
  assert.notEqual(route('S1-V2'), 'done');
});

test('S1-V1 adds no stars until it is done, even with old stars saved', () => {
  const {w, T} = harness({unlocked: '1'});
  w.localStorage.setItem('neon-stars-v2', JSON.stringify({1: 3}));
  T.goHome();
  assert.equal(w.document.getElementById('totalStars').textContent, '0/30');
});
