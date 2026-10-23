import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

// Plan F3a: el sector 1 continuo con el game.js construido. Mismo arnés que
// tests/side-voyage-flow.test.mjs, más startSector y el tramo actual.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(join(root, file), 'utf8');
const [html, game, core, content] = await Promise.all(['index.html', 'game.js', 'core-runtime.js', 'content-runtime.js'].map(read));
const MARKER = '  legacyFrameId = requestAnimationFrame(frame);\n})();';

const drawnTexts = []; // textos e imágenes («image:…») que pinta el lienzo
function context() {
  const gradient = {addColorStop() {}};
  return new Proxy({}, {get(target, key) {
    if (key in target) return target[key];
    if (key === 'fillText') return text => drawnTexts.push(String(text));
    if (key === 'drawImage') return image => drawnTexts.push(`image:${image?.src || ''}`);
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
  // Azar con semilla fija: las pruebas que cuentan patrullas o peligros no
  // pueden depender de la suerte (revisión 3, prueba intermitente).
  let seed = 0x9e3779b9;
  w.eval('Math').random = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  w.eval(core); w.eval(content);
  const hook = `window.T={ev:s=>eval(s),startSector,stage:()=>classicFlightView?.stageNumber||null,resumeReward,effects:()=>impactEffects,setEffects:on=>{settings.effects=on;},forceComplete:()=>{state='complete';},level:()=>currentLevel,requestStage:n=>{classicVoyageRequestedStage=n;},startSideVoyage,startLevel,finishGame,goHome,buildLevelGrid,hit:n=>{classicHullReserve=0;hullGrace=0;damageShip(n);return hull;},hitNow:n=>{classicHullReserve=0;damageShip(n);return hull;},
    st:()=>({state,side:classicSideVoyage?.ficha.id||null,route:classicFlightView?.routeId||null,
      hud:!ui.hud.classList.contains('hidden'),fire:!ui.fire.classList.contains('hidden'),scope:classicSalvageState?.activeRun?.scope||null}),
    adv:s=>{for(let r=s;r>1e-9;r-=1/60)update(1/60);},
    toGaiaBeacon:()=>{collected=36;for(let i=0;i<30000&&!classicFlightView?.beacon.active;i++)classicFlightView=classicFlight.advance(.034,collected,classicFlightEvent);return classicFlightView.beacon.active;},
    draw:()=>render(performance.now()),hull:()=>hull,stars:()=>runStars(),croniumOnScreen:()=>items.filter(item=>item.type==='energy'&&item.y>0&&item.y<H).length,miss:n=>{energySpawned+=n;},
    toStage:n=>{for(let i=0;i<30000&&classicFlightView.stageNumber<n;i++){const add=Math.max(0,classicFlightView.stageGoal-collected);collected+=add;energySpawned+=add;classicFlightView=classicFlight.advance(.034,collected,classicFlightEvent);}return classicFlightView.stageNumber;},
    finish:()=>{collected=36;for(let i=0;i<30000&&!classicFlight.snapshot().canFinish;i++)classicFlightView=classicFlight.advance(.034,collected,classicFlightEvent);
      completeLevel();if(atlasBoss){atlasBoss.resolved=true;completeLevel();}}};\n`;
  assert.equal(game.split(MARKER).length, 2);
  w.eval(game.replace(MARKER, hook + MARKER));
  const saved = id => JSON.parse(w.localStorage.getItem(`neonCronium.voyage.${id}.v1`) || 'null');
  const route = id => w.document.querySelector(`.sector-route[data-voyage="${id}"]`)?.dataset.status;
  return {w, T: w.T, saved, route};
}

const KEY = 'neonCronium.sectors.v1';
const sectorSave = w => JSON.parse(w.localStorage.getItem(KEY) || 'null');
const putRun = (w, run) => w.localStorage.setItem(KEY, JSON.stringify({version: 1, unlocked: 1, sectors: {}, run}));
const click = (w, id) => w.document.getElementById(id).click();
// Como el panel de desarrollo: tramo pedido + ficha pendiente + startLevel.
const startAt = (T, stageNumber) => {
  T.ev("classicSideVoyagePending=NeonCampaign.getSectorFicha('S1')"); T.requestStage(stageNumber); T.startLevel(0);
};

test('play starts sector 1 at stage 1 on a fresh device', () => {
  const {w, T} = harness({unlocked: '1'});
  click(w, 'play');
  assert.deepEqual([T.st().side, T.st().route, T.stage()], ['S1', 'sector-1-gaia', 1]);
});

test('entering a stage saves the sector run', () => {
  const {w, T} = harness();
  T.startSector('S1');
  T.toStage(3);
  assert.deepEqual(sectorSave(w).run, {sector: 1, stageNumber: 3, stageHull: T.hull(), reviveUsed: false});
  assert.equal(w.localStorage.getItem('neonCronium.sector.S1.v1'), null);
});

test('continue returns to the start of the saved stage with its hull', () => {
  const {w, T} = harness();
  putRun(w, {sector: 1, stageNumber: 4, stageHull: 60, reviveUsed: false});
  click(w, 'play');
  assert.deepEqual([T.st().side, T.stage(), T.hull()], ['S1', 4, 60]);
  T.adv(1);
  assert.equal(T.stage(), 4);
});

test('a damaged sector save starts a new sector', () => {
  for (const raw of ['{rota', JSON.stringify({version: 1, unlocked: 1, sectors: {}, run: {sector: 1, stageNumber: 99}})]) {
    const {w, T} = harness();
    w.localStorage.setItem(KEY, raw);
    click(w, 'play');
    assert.deepEqual([T.st().side, T.stage()], ['S1', 1], raw);
  }
});

test('C9 repairs the hull when docking at stage 6', () => {
  const {T} = harness();
  T.startSector('S1');
  T.hit(50);
  assert.ok(T.hull() < 100);
  T.toStage(6);
  for (let i = 0; i < 80 && T.hull() < 100; i++) T.adv(.1);
  assert.equal(T.hull(), 100);
});

test('the menu shows the sector and hides the old voyage map', () => {
  const {w, T} = harness();
  assert.ok(w.document.getElementById('levels').classList.contains('hidden'));
  assert.match(w.document.getElementById('playSector').textContent, /SECTOR 1/);
  putRun(w, {sector: 1, stageNumber: 4, stageHull: 80, reviveUsed: false});
  T.ev('updateMenu()');
  assert.match(w.document.getElementById('playSector').textContent, /TRAMO 4\/10/);
});

// Tarea 3: el sector empieza con el inicio de Chronos y el tutorial.
const story = T => T.ev('Boolean(classicChapterStory)');
const tutorial = T => T.ev('Boolean(classicTutorial)');

test('a fresh sector plays the Chronos opening and the tutorial', () => {
  const {T} = harness();
  T.startSector('S1');
  T.adv(3);
  assert.equal(story(T), true);
  assert.equal(tutorial(T), true);
  drawnTexts.length = 0; T.draw();
  assert.ok(drawnTexts.some(text => /^image:.*chronos_intro_station_atlas/.test(text)), 'the Chronos station is drawn');
});

test('no patrol spawns before recoveryAt', () => {
  const {T} = harness();
  T.startSector('S1');
  for (let second = 0; second < 8; second++) {
    T.adv(1);
    assert.equal(T.ev('items.filter(item=>item.classicScout).length'), 0, `second ${second + 1}`);
  }
});

test('continuing late in the sector does not throw and has no chapter story', () => {
  for (const stageNumber of [8, 9]) {
    const {w, T} = harness();
    putRun(w, {sector: 1, stageNumber, stageHull: 90, reviveUsed: false});
    click(w, 'play');
    assert.equal(T.stage(), stageNumber);
    assert.equal(story(T), false, `stage ${stageNumber}`);
  }
});

test('old side voyages still skip the intro', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V2');
  assert.equal(story(T), false);
  assert.equal(tutorial(T), false);
});

test('a sector stage spawns CRONIUM and patrols', () => {
  const {T} = harness();
  startAt(T, 2);
  assert.equal(T.stage(), 2);
  T.adv(12);
  assert.ok(T.ev('energySpawned') > 0, 'CRONIUM appears');
  assert.ok(T.ev('items.filter(item=>item.classicScout).length') > 0, 'a patrol appears');
});

test('new Gaia enemies spawn as current stand-ins until they exist (F3b)', () => {
  // Tramos 3, 4 y 7 abren con sower, aegis y alpha (ficha del sector 1).
  for (const stageNumber of [3, 4, 7]) {
    const {T} = harness();
    startAt(T, stageNumber);
    assert.equal(T.stage(), stageNumber);
    T.adv(20);
    assert.equal(T.st().state, 'playing', `stage ${stageNumber}`);
    assert.ok(T.ev('items.filter(item=>item.classicScout).length') > 0, `stage ${stageNumber} has a patrol`);
  }
});

// Tarea 4: revivir al 25 % una vez por intento; al volver a caer, tramo 1.
const rewardShown = w => !w.document.getElementById('reward').classList.contains('hidden');

test('dying in the sector saves a restart at stage 1', () => {
  const {w, T} = harness();
  startAt(T, 3);
  T.finishGame('hull');
  assert.deepEqual(sectorSave(w).run, {sector: 1, stageNumber: 1, stageHull: 100, reviveUsed: false});
  assert.equal(w.document.getElementById('retry').textContent, 'REINTENTAR SECTOR · TRAMO 1');
  assert.equal(rewardShown(w), true);
});

test('the rewarded revive returns at 25 % to the same stage, once', () => {
  const {w, T} = harness();
  startAt(T, 3);
  T.finishGame('hull');
  assert.equal(T.resumeReward(), true);
  assert.deepEqual([T.st().state, T.stage(), T.hull()], ['playing', 3, 25]);
  assert.deepEqual(sectorSave(w).run, {sector: 1, stageNumber: 3, stageHull: 100, reviveUsed: true});
  T.finishGame('hull');
  assert.equal(rewardShown(w), false);
  assert.equal(sectorSave(w).run.stageNumber, 1);
});

test('a revive used before closing the app is still spent', () => {
  const {w, T} = harness();
  putRun(w, {sector: 1, stageNumber: 3, stageHull: 80, reviveUsed: true});
  click(w, 'play');
  T.finishGame('hull');
  assert.equal(rewardShown(w), false);
});

test('restarting the sector makes the revive available again', () => {
  const {w, T} = harness();
  startAt(T, 3);
  T.finishGame('hull'); T.resumeReward(); T.finishGame('hull');
  T.startLevel(0);
  assert.equal(T.stage(), 1);
  T.finishGame('hull');
  assert.equal(rewardShown(w), true);
});

test('old side voyages keep their 35 % revive', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev('hull=0');
  T.finishGame('hull');
  T.resumeReward();
  assert.equal(T.hull(), 35);
});
