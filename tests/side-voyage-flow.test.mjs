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
  const hook = `window.T={ev:s=>eval(s),resumeReward,effects:()=>impactEffects,setEffects:on=>{settings.effects=on;},forceComplete:()=>{state='complete';},level:()=>currentLevel,requestStage:n=>{classicVoyageRequestedStage=n;},startSideVoyage,startLevel,finishGame,goHome,buildLevelGrid,hit:n=>{classicHullReserve=0;hullGrace=0;damageShip(n);return hull;},hitNow:n=>{classicHullReserve=0;damageShip(n);return hull;},
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

test('a hull hit shows the painted sparks, and with effects off keeps the old hit', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.5);
  T.hit(5);
  assert.equal(T.effects().filter(effect => effect.hullSparks).length, 1);
  T.setEffects(false); T.adv(1);
  T.hit(5);
  assert.equal(T.effects().filter(effect => effect.hullSparks).length, 0, 'the first sparks faded and no new ones appear with effects off');
});

test('replaying S1-V1 counts as a run for interstitials only the first time, like every voyage', () => {
  const {w, T} = harness({unlocked: '1'});
  const games = () => Number(w.localStorage.getItem('neon-games-v2') || 0);
  T.startLevel(0); T.finish();
  assert.equal(games(), 1);
  T.startLevel(0); T.finish();
  assert.equal(games(), 1, 'the second completion of S1-V1 does not count');
});

test('an attempt continued with a rewarded ad counts once: the death, not the later finish or a second death', () => {
  const {w, T} = harness();
  const games = () => Number(w.localStorage.getItem('neon-games-v2') || 0);
  T.startSideVoyage('S1-V2'); T.adv(.5);
  T.finishGame('hull');
  assert.equal(games(), 1);
  assert.equal(T.resumeReward(), true);
  T.finish();
  assert.equal(games(), 1, 'finishing after the rewarded continue does not count again');
  T.startSideVoyage('S1-V3'); T.adv(.5); T.finishGame('hull'); T.resumeReward(); T.adv(.5); T.finishGame('hull');
  assert.equal(games(), 2, 'a second death after the continue does not count again');
});

test('the HUD names the current voyage instead of «NIVEL 1», without repeating it in the route line', () => {
  const {w, T} = harness();
  const text = id => w.document.getElementById(id).textContent;
  T.startLevel(0); T.adv(.5);
  assert.equal(T.st().side, null);
  assert.deepEqual([text('hudLevel'), w.document.getElementById('hudLevel').previousElementSibling.textContent], ['S1-V1', 'VIAJE']);
  T.startSideVoyage('S2-V3'); T.adv(.5);
  assert.deepEqual([text('hudLevel'), w.document.getElementById('hudLevel').previousElementSibling.textContent], ['S2-V3', 'VIAJE']);
  assert.doesNotMatch(text('flightDestination'), /S2-V3/, 'the voyage id lives in the HUD cell only');
  assert.match(text('flightDestination'), /1\/\d+/);
  assert.doesNotMatch(w.document.getElementById('hud').textContent, /NIVEL/);
});

test('in the last S1-V1 stage Atlas only shows far away over Gaia, without a «GUARDIAN ATLAS» tag', () => {
  const {T} = harness();
  T.requestStage(10); T.startLevel(0); T.adv(.5);
  assert.equal(T.toGaiaBeacon(), true, 'the far Atlas beacon is on screen');
  drawnTexts.length = 0; T.draw();
  assert.ok(drawnTexts.some(text => /^image:.*guardian_atlas/.test(text)), 'Atlas is still drawn far away as a warning');
  assert.equal(drawnTexts.some(text => /GUARDIAN ATLAS/.test(text)), false);
});

test('continuing a map voyage from the menu keeps the hull and the lost CRONIUM of the checkpoint', () => {
  const {T, saved} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.5);
  for (let i = 0; i < 20 && T.hit(10) >= 70; i++);
  const damaged = T.hull();
  assert.ok(damaged < 70 && damaged >= 50, 'the hull is damaged above the resume floor');
  T.miss(8);
  assert.equal(T.toStage(2), 2, 'the voyage reaches its second checkpoint');
  assert.equal(saved('S1-V2').entry.hull, damaged, 'the checkpoint stores the entry hull');
  assert.equal(saved('S1-V2').entry.missed, 8, 'and the CRONIUM lost so far');
  T.goHome(); T.startSideVoyage('S1-V2');
  assert.equal(T.hull(), damaged, 'continuing keeps the damaged hull');
  assert.notEqual(T.stars(), 3, 'stars measure the whole voyage, not only the last stretch');
});

test('continuing a map voyage keeps the lost CRONIUM even with a full hull', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.5);
  T.miss(8); T.toStage(2);
  T.goHome(); T.startSideVoyage('S1-V2');
  assert.equal(T.hull(), 100);
  assert.notEqual(T.stars(), 3, 'eight lost fragments are more than the 10 % allowed for 3 stars');
});

test('retrying a map voyage after dying uses the entry hull of the stage with the S1-V1 floor', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.5);
  for (let i = 0; i < 40 && T.hit(10) > 30; i++);
  assert.ok(T.hull() <= 30);
  T.toStage(2);
  T.finishGame('hull');
  T.startLevel(0);
  assert.equal(T.st().side, 'S1-V2');
  assert.equal(T.hull(), 50, 'below the floor the retry starts with 50');
});

test('old map voyage records without the entry fields still resume', () => {
  const {w, T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.5); T.toStage(2); T.goHome();
  const key = 'neonCatcher.voyage.S1-V2.v1', record = JSON.parse(w.localStorage.getItem(key));
  delete record.entry; w.localStorage.setItem(key, JSON.stringify(record));
  T.startSideVoyage('S1-V2');
  assert.deepEqual([T.st().state, T.st().side, T.hull()], ['playing', 'S1-V2', 100]);
  assert.equal(T.stars(), 3);
});

test('every map voyage shows CRONIUM within its first 3 seconds', () => {
  for (const id of ['S1-V2', 'S1-V3', 'S1-V4', 'S1-V5', 'S2-V1', 'S2-V2', 'S2-V3', 'S2-V4', 'S2-V5']) {
    const {T} = harness({unlocked: '10'});
    T.startSideVoyage(id); T.adv(3);
    assert.equal(T.st().side, id);
    assert.ok(T.croniumOnScreen() > 0, `${id}: CRONIUM on screen at 3 s`);
  }
});

test('retrying a replayed finished voyage resumes the stage it promises, and a new replay starts at 1', () => {
  // Auditoría 22/10, L01: rejugar un viaje hecho y morir en el tramo 3 llevaba al tramo 1.
  const {w, T, saved} = harness();
  T.startSideVoyage('S1-V2'); T.finish(); T.goHome();
  T.startSideVoyage('S1-V2'); T.adv(.5); T.toStage(3);
  T.finishGame('hull');
  assert.match(w.document.getElementById('retry').textContent, /2\.3/);
  w.document.getElementById('retry').click();
  assert.deepEqual([T.st().state, T.ev('classicFlightView.stageNumber'), T.ev('collected')], ['playing', 3, 10]);
  assert.equal(saved('S1-V2').completed, true, 'the voyage stays done on the map');
  T.finish(); T.goHome();
  T.startSideVoyage('S1-V2');
  assert.equal(T.ev('classicFlightView.stageNumber'), 1, 'after finishing again, a replay starts from the beginning');
});

test('after replaying S1-V1 halfway, «JUGAR» follows the campaign instead of reopening S1-V1', () => {
  // Auditoría 22/10, L02: rejugar S1-V1 dejaba «JUGAR» atascado en su ficha.
  const {w, T} = harness({unlocked: '1'});
  T.startLevel(0); T.adv(.1); T.finish(); T.goHome();
  T.startSideVoyage('S1-V2'); T.finish(); T.goHome();
  T.startLevel(0); T.adv(.2); T.toStage(2); T.goHome();
  assert.equal(T.ev('nextCampaignVoyage()?.voyage'), 'S1-V3');
  assert.match(w.document.getElementById('playSector').textContent, /S1-V3/);
  w.document.getElementById('play').click();
  assert.equal(w.document.getElementById('briefing').classList.contains('show'), false, 'no S1-V1 briefing');
  assert.equal(T.st().side, 'S1-V3');
});

test('retrying S1-V1 keeps the CRONIUM lost before the checkpoint, like the map voyages', () => {
  // Auditoría 22/10, L03: S1-V1 lo ponía a 0 y las 3 estrellas salían más fáciles.
  const {T} = harness();
  T.requestStage(null); T.startLevel(0); T.adv(.2); T.miss(10); T.toStage(2);
  assert.equal(T.ev('energySpawned-collected'), 10);
  T.finishGame('hull'); T.startLevel(0);
  assert.equal(T.ev('classicFlightView.stageNumber'), 2);
  assert.equal(T.ev('energySpawned-collected'), 10);
});

test('during a comet shower the safe corridor is marked and patrols hold fire, then fight again', () => {
  // Propietario (22/10, auditoría J04): pasillo marcado + alto el fuego.
  const {T} = harness();
  T.startSideVoyage('S1-V5'); T.adv(.2); T.toStage(2);
  let seen = false, held = true, patrols = 0, fired = 0, known = new Set();
  for (let i = 0; i < 30 * 60; i++) {
    T.ev('hull=100'); T.adv(1 / 60);
    const shots = T.ev('items.filter(item=>item.classicScoutProjectile)');
    const fresh = shots.filter(shot => !known.has(shot)); shots.forEach(shot => known.add(shot));
    if (T.ev('cometShowerActive()')) {
      seen = true; fired += fresh.length;
      for (const enemy of T.ev('items.filter(item=>item.classicScout)')) { patrols++; held &&= enemy.classicScout.holdFire === true; }
    }
  }
  // Auditoría del bloque (B05): contar disparos de verdad, no solo el indicador.
  assert.equal(fired, 0, 'no enemy shot is fired while the shower lasts');
  assert.ok(seen, 'a shower happens in S1-V5 stage 2');
  assert.ok(patrols > 0, 'some patrol was on screen during the shower');
  assert.ok(held, 'every patrol holds fire while the shower lasts');
  T.ev('items=items.filter(item=>!item.showerComet);classicCometCorridor.until=-1');
  assert.equal(T.ev('cometShowerActive()'), false, 'the ceasefire ends with the shower');
});

test('once the stage quota is met, a map voyage stage ends soon after 20 s instead of idling to its full length', () => {
  // Propietario (22/10, auditoría J05): sin tiempo muerto tras cumplir la cuota.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.1);
  const goal = T.ev('classicFlightView.stageGoal'), full = T.ev('classicFlightView.stageDuration');
  assert.ok(full >= 30);
  T.ev(`collected=${goal};energySpawned=${goal}`);
  let at = null;
  for (let i = 0; i < 40 * 60 && at === null; i++) {
    T.ev('hull=100'); T.adv(1 / 60);
    if (T.ev('classicFlightView.stageNumber') === 2) at = i / 60;
  }
  assert.ok(at !== null && at >= 20 && at <= 25, `stage 1 ended at ${at} s (full length ${full} s)`);
});

test('without the quota a map voyage stage is not shortened', () => {
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.1);
  for (let i = 0; i < 26 * 60; i++) { T.ev('hull=100;collected=0'); T.adv(1 / 60); }
  assert.equal(T.ev('classicFlightView.stageNumber'), 1);
});

test('resuming from pause gives a short grace and the pause offers «REINICIAR TRAMO»', () => {
  // Propietario (22/10, auditoría J06).
  const {w, T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev('pauseGame()');
  // Revisión M1: el botón vuelve al punto de control del tramo, no al inicio del viaje.
  assert.equal(w.document.getElementById('restart').textContent.trim(), 'REINICIAR TRAMO');
  T.ev('pauseStartedAt-=600;resumeGame()');
  assert.equal(T.hitNow(20), 100, 'a hit right after resuming does no damage');
  T.adv(1);
  assert.ok(T.hitNow(20) < 100, 'after the grace the hull takes damage again');
});

test('two hits in the same instant cost the hull only once', () => {
  // Propietario (22/10, auditoría J07): 0,3 s de invulnerabilidad tras un golpe.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  const first = T.hitNow(15);
  assert.equal(T.hitNow(15), first, 'the second simultaneous hit is ignored');
  T.adv(.4);
  assert.ok(T.hitNow(15) < first, 'a later hit counts');
});

test('simultaneous hits absorbed by a full hull reserve also cost only once', () => {
  // Revisión 22/10 (L3): la gracia de 0,3 s faltaba cuando la reserva absorbía el golpe.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev('classicHullReserve=30;hullGrace=0');
  for (let i = 0; i < 3; i++) T.ev('damageShip(15)');
  assert.deepEqual([T.ev('classicHullReserve'), T.hull()], [15, 100]);
});

test('pausing and resuming quickly does not chain the resume grace into invulnerability', () => {
  // Revisión 22/10 (L2): la gracia de 0,8 s solo tras una pausa real (≥ 0,5 s).
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev('pauseGame();resumeGame()');
  assert.ok(T.hitNow(20) < 100, 'an instant pause/resume gives no grace');
});

test('while a comet shower lasts no new hazard falls inside the marked corridor', () => {
  // Revisión 22/10 (L1): el pasillo marcado tiene que ser seguro de verdad.
  for (const voyage of ['S1-V5', 'S2-V5']) {
    const {T} = harness();
    T.startSideVoyage(voyage); T.adv(.2); T.toStage(2);
    let seen = new Set(), inside = 0, spawned = 0;
    for (let i = 0; i < 30 * 60; i++) {
      T.ev('hull=100'); T.adv(1 / 60);
      const active = T.ev('cometShowerActive()');
      const fresh = T.ev(`items.filter(item=>isThreat(item)&&!item.showerComet&&!item.flightPatrol&&!item.classicScout&&!item.classicScoutProjectile).map(item=>({ref:item,x:item.x,r:item.r}))`);
      for (const {ref, x, r} of fresh) {
        if (seen.has(ref)) continue; seen.add(ref);
        if (!active) continue;
        spawned++;
        const c = T.ev('classicCometCorridor.corridor');
        if (x + r > c.left && x - r < c.right) inside++;
      }
    }
    assert.ok(spawned > 0, `${voyage}: hazards keep falling during the shower`);
    assert.equal(inside, 0, `${voyage}: ${inside} of ${spawned} new hazards fell inside the corridor`);
  }
});

test('a stage with a comet shower is not shortened, so every announced burst still falls', () => {
  // Revisión 22/10 (M2): el reloj al triple cortaba la lluvia tras su aviso.
  const {T} = harness();
  T.startSideVoyage('S1-V5'); T.adv(.2); T.toStage(2);
  const goal = T.ev('classicFlightView.stageGoal'), full = T.ev('classicFlightView.stageDuration');
  T.ev(`collected=${goal};energySpawned=${goal}`);
  let at = null;
  for (let i = 0; i < 45 * 60 && at === null; i++) {
    T.ev('hull=100'); T.adv(1 / 60);
    if (T.ev('classicFlightView.stageNumber') === 3) at = i / 60;
  }
  assert.ok(at !== null && at >= full - 1, `stage 2 ended at ${at} s of ${full} s`);
});

test('skipping the Chronos intro moves the world past the rupture instead of playing it under the HUD', () => {
  // Revisión 22/10 (B1): omitir solo quitaba subtítulos; Cronos Prime seguía llegando.
  const {w, T} = harness({unlocked: '1'});
  T.requestStage(null); T.startLevel(0); T.adv(1);
  const skip = w.document.getElementById('chapterSkip');
  assert.equal(skip.classList.contains('hidden'), false, 'the skip button is offered');
  skip.click();
  const gone = T.ev('NeonCampaign.CHRONOS_INTRO_TIMELINE.gone');
  assert.ok(T.ev('classicFlightView.elapsed') >= gone, 'the route clock is past Cronos Prime leaving');
  assert.equal(T.st().state, 'playing');
  assert.equal(T.ev('classicFlightView.stageNumber'), 1);
});

test('a one-step flight lesson shows for its seconds, returns once, and never shows «· 0 %»', () => {
  // Revisión 22/10 (G1): «Pieza recuperada… · 0 %» se quedaba fijo unos 3 minutos.
  const {w, T} = harness({unlocked: '1'});
  T.requestStage(null); T.startLevel(0);
  T.ev("classicTutorial.observe({type:'pilot',distance:100})");
  let shown = 0, percent = false;
  for (let i = 0; i < 120 * 60; i++) {
    T.ev('hull=100;flightTransmission=null'); T.adv(1 / 60);
    const text = w.document.getElementById('flightObjective')?.textContent || '';
    if (/DISPARAR/.test(text)) { shown += 1 / 60; percent ||= /%/.test(text); }
  }
  assert.ok(shown > 0, 'the fire lesson is shown');
  assert.ok(shown <= 9, `the fire lesson is visible ${shown.toFixed(1)} s, at most twice its 4 s`);
  assert.equal(percent, false, 'no meaningless percentage on a one-step lesson');
});

test('a hit absorbed by the hull reserve reads differently from collecting CRONIUM, and N-7 explains it once', () => {
  // Revisión 22/10 (G2): antes eran las mismas chispas y aro cian que al recoger.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev('classicHullReserve=30;hullGrace=0;parts.length=0;flightTransmission=null');
  T.ev('damageShip(10)');
  const kinds = new Set(T.ev('parts.map(p=>p.kind)'));
  assert.equal(kinds.has('cyan'), false, 'no cyan sparks on an absorbed hit');
  assert.ok(kinds.has('gold'));
  assert.match(T.ev('flightTransmission?.text||""'), /refuerzo/i);
  T.ev('flightTransmission=null;hullGrace=0'); T.ev('damageShip(10)');
  assert.equal(T.ev('flightTransmission'), null, 'the explanation is said only once');
});

test('when a stage clock ends without its CRONIUM quota, N-7 says what is missing', () => {
  // Revisión 22/10 (G5): el tramo esperaba sin explicar por qué no avanzaba.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.1);
  let said = '';
  for (let i = 0; i < 40 * 60; i++) {
    T.ev('hull=100;collected=0;items=items.filter(item=>item.type!=="energy")'); T.adv(1 / 60);
    const text = T.ev('flightTransmission?.text||""');
    if (/CRONIUM/.test(text) && /Faltan/.test(text)) said = text;
  }
  assert.equal(T.ev('classicFlightView.waitingFor'), 'cronium');
  assert.match(said, /Faltan \d+ CRONIUM/);
});

test('retrying a stage forgets the lesson window and the CRONIUM notice of the previous attempt', () => {
  // Auditoría del bloque (B03): elapsed vuelve a 0 y la ventana de 4 s quedaba en negativo.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev("classicGuideSeen={id:'x',at:500};classicCroniumWaitNotice=classicFlightView.stageId");
  T.finishGame('hull'); T.startLevel(0);
  assert.deepEqual([T.ev('classicGuideSeen'), T.ev('classicCroniumWaitNotice')], [null, null]);
});

test('closing the C9 workshop opened in flight gives the same resume grace as the pause', () => {
  // Auditoría del bloque (B04): C9 pausa el viaje pero al cerrarlo no había gracia.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  assert.equal(T.ev("openClassicDock('hud')"), true);
  T.ev('pauseStartedAt-=600;closeClassicDock()');
  assert.equal(T.st().state, 'playing');
  assert.equal(T.hitNow(20), 100, 'a hit right after closing C9 does no damage');
});

test('while a comet shower lasts nothing but comets is ever inside the marked corridor', () => {
  // Auditoría del bloque (B01): los peligros y disparos que ya caían seguían dentro.
  for (const voyage of ['S1-V5', 'S2-V5']) {
    const {T} = harness();
    T.startSideVoyage(voyage); T.adv(.2); T.toStage(2);
    let frames = 0, dirty = 0;
    for (let i = 0; i < 30 * 60; i++) {
      T.ev('hull=100'); T.adv(1 / 60);
      if (!T.ev('cometShowerActive()')) continue;
      frames++;
      dirty += T.ev(`(()=>{const c=classicCometCorridor.corridor;return items.some(item=>(item.classicScoutProjectile||(isThreat(item)&&!item.showerComet&&!item.flightPatrol&&!item.classicScout))&&
        item.x>c.left&&item.x<c.right&&item.y+item.r>c.top&&item.y-item.r<H)?1:0})()`); // centro dentro (A2/C2)
    }
    assert.ok(frames > 0, `${voyage}: a shower happens`);
    assert.equal(dirty, 0, `${voyage}: ${dirty} of ${frames} shower frames had a threat inside the corridor`);
  }
});

test('opening a finished voyage again from the map starts it at stage 1 even after a half-played replay', () => {
  // Auditoría del bloque (B02): la reanudación de una rejugada es solo para reintentar.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.finish(); T.goHome();
  T.startSideVoyage('S1-V2'); T.adv(.5); T.toStage(3); T.goHome();
  T.startSideVoyage('S1-V2');
  assert.equal(T.ev('classicFlightView.stageNumber'), 1);
});

test('the comet corridor only clears its marked area, not the whole column above it', () => {
  // Revisión tras el PR #44 (P01): los peligros desaparecían a media pantalla.
  const {T} = harness();
  T.startSideVoyage('S1-V5'); T.adv(.2); T.toStage(2);
  for (let i = 0; i < 30 * 60 && !T.ev('cometShowerActive()'); i++) { T.ev('hull=100'); T.adv(1 / 60); }
  assert.ok(T.ev('cometShowerActive()'));
  T.ev(`(()=>{const c=classicCometCorridor.corridor,m=createThreat('meteor',level());m.x=m.baseX=c.center;m.y=c.top-200;m.s=0;m.amp=0;m.markP01=true;items.push(m);})()`);
  T.adv(1 / 60);
  assert.equal(T.ev('items.some(item=>item.markP01)'), true, 'a hazard above the marked area is kept');
});

test('«Repetir» after finishing a voyage starts at stage 1 even if the final save failed', () => {
  // Revisión tras el PR #44 (P02): un guardado fallido dejaba inProgress de la rejugada.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.finish(); T.goHome();
  T.startSideVoyage('S1-V2'); T.adv(.5); T.toStage(3); T.adv(.5);
  T.ev('Object.getPrototypeOf(localStorage).setItem=()=>{throw new Error("lleno")}');
  T.finish();
  assert.equal(T.st().state, 'complete');
  T.startLevel(0);
  assert.equal(T.ev('classicFlightView.stageNumber'), 1);
});

test('alternating real pauses with short play does not chain the resume grace', () => {
  // Revisión 3 (R1): pausas de 0,5 s cada 0,6 s de juego evitaban todo el daño.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  let damaged = 0;
  for (let i = 0; i < 10; i++) {
    T.ev('pauseGame();pauseStartedAt-=600;resumeGame()');
    T.adv(.3);
    const before = T.hull(); T.hitNow(5);
    if (T.hull() < before) damaged++;
    T.ev('hull=100'); T.adv(.3);
  }
  assert.ok(damaged >= 6, `only ${damaged} of 10 hits did damage`);
});

test('a hazard cleared from the comet corridor breaks with its explosion instead of vanishing', () => {
  // Revisión 3 (R2): antes desaparecía con unas chispas sueltas.
  const {T} = harness();
  T.startSideVoyage('S1-V5'); T.adv(.2); T.toStage(2);
  for (let i = 0; i < 30 * 60 && !T.ev('cometShowerActive()'); i++) { T.ev('hull=100'); T.adv(1 / 60); }
  const before = T.ev('explosions.length');
  T.ev(`(()=>{const c=classicCometCorridor.corridor,m=createThreat('meteor',level());m.x=m.baseX=c.center;m.y=c.top+60;m.s=0;m.amp=0;m.markR2=true;items.push(m);})()`);
  T.adv(1 / 60);
  assert.equal(T.ev('items.some(item=>item.markR2)'), false);
  assert.ok(T.ev('explosions.length') > before, 'an explosion marks where it broke');
});

test('the new N-7 notices never replace a story line already on screen, and wait for their turn', () => {
  // Revisión 3 (R7): G2 y G5 sustituían una línea de MIRA o del capítulo.
  const {T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(1);
  T.ev("showStoryTransmission('MIRA · C9','Línea de historia.',4)");
  T.ev('classicHullReserve=30;hullGrace=0;damageShip(10)');
  assert.equal(T.ev('flightTransmission.text'), 'Línea de historia.');
  T.ev('flightTransmission=null;hullGrace=0;damageShip(10)');
  assert.match(T.ev('flightTransmission?.text||""'), /refuerzo/i, 'the explanation comes once the channel is free');
});

test('while a stage waits for CRONIUM the HUD shows the stage quota and N-7 repeats the notice every 10 s', () => {
  // Revisión 3 (R6): «Faltan 4» frente a «0/36», un solo aviso y «Faltan 1».
  const {w, T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.1);
  let notices = 0, last = '';
  for (let i = 0; i < 60 * 60; i++) {
    T.ev('hull=100;collected=0;items=items.filter(item=>item.type!=="energy")'); T.adv(1 / 60);
    const text = T.ev('flightTransmission?.text||""');
    if (/CRONIUM/.test(text) && text !== last) notices++;
    last = text; if (/CRONIUM/.test(text)) T.ev('flightTransmission.remaining=Math.min(flightTransmission.remaining,.5)');
  }
  assert.equal(T.ev('classicFlightView.waitingFor'), 'cronium');
  assert.match(w.document.getElementById('goal').textContent, /^0\/4$/, 'the HUD counter shows the stage quota');
  assert.ok(notices >= 2, `the notice repeats while waiting (${notices})`);
  T.ev('collected=3;classicCroniumWaitAt=-99;flightTransmission=null'); T.adv(1 / 60);
  assert.match(T.ev('flightTransmission?.text||""'), /^Falta 1 CRONIUM/);
});

test('skipping the intro also clears the pre-rupture LIRA line and opens with N-7', () => {
  // Revisión 3 (R8): seguía «Chronos, turno de guardia» en el HUD tras omitir.
  const {w, T} = harness({unlocked: '1'});
  T.requestStage(null); T.startLevel(0); T.adv(3);
  w.document.getElementById('chapterSkip').click();
  assert.doesNotMatch(T.ev('flightTransmission?.text||""'), /turno de guardia|firma aceptada/);
  assert.equal(T.ev('flightTransmission?.speaker'), 'N-7');
});

test('the piloting lesson hides its percentage until there is some progress', () => {
  // Revisión 3 (M10): «Desliza el pulgar izquierdo… · 0 %».
  const {w, T} = harness({unlocked: '1'});
  T.requestStage(null); T.startLevel(0);
  let seen = false, zero = false;
  for (let i = 0; i < 40 * 60; i++) {
    T.ev('hull=100;flightTransmission=null'); T.adv(1 / 60);
    const text = w.document.getElementById('flightObjective')?.textContent || '';
    if (/pulgar izquierdo/.test(text)) { seen = true; zero ||= /· 0 %/.test(text); }
  }
  assert.ok(seen); assert.equal(zero, false);
});

test('the harness randomness is seeded, so counts of patrols and hazards are repeatable', () => {
  assert.equal(harness().T.ev('Math.random()'), harness().T.ev('Math.random()'));
});

test('a new player starts with piloting sensitivity 135', () => {
  // Propietario (22/10, revisión G6): menos recorrido de pulgar por defecto.
  const {w, T} = harness();
  assert.equal(T.ev('settings.sensitivity'), 135);
  assert.equal(w.document.getElementById('sensitivity').value, '135');
});

test('after skipping the intro, «Los atacantes nos siguen» is said only once', () => {
  // Revisión 5 (C1): sonaba al omitir y otra vez con el primer perseguidor.
  const {w, T} = harness({unlocked: '1'});
  T.requestStage(null); T.startLevel(0); T.adv(3);
  T.ev('window.__said=0;const original=showStoryTransmission;showStoryTransmission=(...args)=>{if(/Los atacantes nos siguen/.test(args[1]))window.__said++;return original(...args);}');
  w.document.getElementById('chapterSkip').click();
  for (let i = 0; i < 40 * 60; i++) { T.ev('hull=100'); T.adv(1 / 60); }
  assert.equal(T.ev('window.__said'), 1);
});

test('the CRONIUM wait notice disappears as soon as CRONIUM changes, and the HUD labels the stage quota', () => {
  // Revisión 5 (C3): «Faltan 4» seguía en pantalla con el HUD ya en 1/4 o 4/36.
  const {w, T} = harness();
  T.startSideVoyage('S1-V2'); T.adv(.1);
  const label = () => w.document.querySelector('.metric-cronium small').textContent;
  for (let i = 0; i < 40 * 60 && !/CRONIUM para seguir/.test(T.ev('flightTransmission?.text||""')); i++) {
    T.ev('hull=100;collected=0;items=items.filter(item=>item.type!=="energy")'); T.adv(1 / 60);
  }
  assert.match(T.ev('flightTransmission.text'), /Faltan 4/);
  assert.equal(label(), 'TRAMO');
  T.ev('collected=1'); T.adv(1 / 60);
  assert.equal(T.ev('flightTransmission'), null, 'the stale count is removed');
  T.ev('collected=4;energySpawned=4'); for (let i = 0; i < 60; i++) T.adv(1 / 60);
  assert.equal(label(), 'CRONIUM');
});

test('the corridor never breaks a rock above its line, nor one whose centre is outside it', () => {
  // Revisiones 4 y 5 (A2/C2): explosiones 60-77 px por encima y rocas rozando el borde.
  const {T} = harness();
  T.startSideVoyage('S1-V5'); T.adv(.2); T.toStage(2);
  for (let i = 0; i < 30 * 60 && !T.ev('cometShowerActive()'); i++) { T.ev('hull=100'); T.adv(1 / 60); }
  T.ev(`(()=>{const c=classicCometCorridor.corridor;
    const a=createThreat('meteor',level());a.x=a.baseX=c.left-10;a.r=38;a.y=c.top+80;a.s=0;a.amp=0;a.markOut=true;items.push(a);
    const b=createThreat('meteor',level());b.x=b.baseX=c.center;b.y=c.top-30;b.s=0;b.amp=0;b.markAbove=true;items.push(b);})()`);
  const before = T.ev('explosions.length');
  T.adv(1 / 60);
  assert.equal(T.ev('items.some(item=>item.markOut)'), true, 'centre outside the corridor: kept');
  const exploded = T.ev('explosions.slice(' + before + ')');
  for (const e of exploded) assert.ok(e.y >= T.ev('classicCometCorridor.corridor.top') - 1, `explosion at y=${e.y} above the line`);
});
