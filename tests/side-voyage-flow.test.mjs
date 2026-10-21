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
  const hook = `window.T={requestStage:n=>{classicVoyageRequestedStage=n;},startSideVoyage,startLevel,finishGame,goHome,buildLevelGrid,hit:n=>{classicHullReserve=0;damageShip(n);return hull;},
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

test('finishing a side voyage returns to the map with the flight HUD and fire button hidden', () => {
  const {w, T, route} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1); T.finish();
  assert.deepEqual([T.st().state, T.st().hud, T.st().fire], ['menu', false, false]);
  assert.equal(w.document.getElementById('levelSelect').classList.contains('show'), true);
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
  assert.equal(panel.querySelectorAll('.dev-row').length, 11, '10 voyages and the classic levels');
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
