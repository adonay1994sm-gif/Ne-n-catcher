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
  w.eval(core); w.eval(content);
  const hook = `window.T={ev:s=>eval(s),resumeReward,effects:()=>impactEffects,setEffects:on=>{settings.effects=on;},forceComplete:()=>{state='complete';},level:()=>currentLevel,requestStage:n=>{classicVoyageRequestedStage=n;},startSideVoyage,startLevel,finishGame,goHome,buildLevelGrid,hit:n=>{classicHullReserve=0;damageShip(n);return hull;},
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
  let seen = false, held = true, patrols = 0;
  for (let i = 0; i < 30 * 60; i++) {
    T.ev('hull=100'); T.adv(1 / 60);
    if (T.ev('cometShowerActive()')) {
      seen = true;
      for (const enemy of T.ev('items.filter(item=>item.classicScout)')) { patrols++; held &&= enemy.classicScout.holdFire === true; }
    }
  }
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
