// Simulador con bot: juega un viaje con el game.js real en JSDOM, con el azar
// de una semilla fija, y mide dificultad y acción (segundos sin amenazas).
// Arnés tomado de tests/side-voyage-flow.test.mjs.
import {readFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = file => readFile(join(root, file), 'utf8');
let sources = null;
const MARKER = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
const DT = 1 / 60;

function context() {
  const gradient = {addColorStop() {}};
  return new Proxy({}, {get(target, key) {
    if (key in target) return target[key];
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
    if (key === 'measureText') return value => ({width: String(value).length * 14});
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; }});
}

// Corre dentro del ámbito del juego: decide el movimiento y el disparo del
// bot en cada fotograma y devuelve lo que mide.
const BOT = `window.B={
  hostile:item=>item.classicScoutProjectile||item.guardianProjectile||item.showerComet||(isThreat(item)&&!item.classicScout),
  enemy:item=>item.classicScout||item.type==='scout',
  step(invulnerable){
    if(invulnerable)hull=100;
    const dangers=[];
    for(const item of items){
      if(!this.hostile(item))continue;
      const vx=item.vx||0,vy=item.vy??item.s??0;
      for(let t=0;t<=.6;t+=.1)dangers.push({x:item.x+vx*t,y:item.y+vy*t,r:(item.r||12)+46});
    }
    const near=x=>dangers.reduce((m,d)=>Math.min(m,Math.hypot(d.x-x,d.y-player.y)-d.r),Infinity);
    let goal=player.x;
    if(near(player.x)<0){
      let best=-Infinity;
      for(const dx of [-200,-110,0,110,200]){const x=Math.max(60,Math.min(W-60,player.x+dx)),score=near(x)-Math.abs(dx)*.05;if(score>best){best=score;goal=x;}}
    }else{
      const enemies=items.filter(item=>this.enemy(item)&&item.y>0&&item.y<player.y);
      const energy=items.filter(item=>item.type==='energy'&&Math.hypot(item.x-player.x,item.y-player.y)<200);
      const pick=enemies.sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0]||energy[0];
      if(pick)goal=pick.x;
    }
    player.target=goal;
    let fired=false;
    const aligned=items.some(item=>this.enemy(item)&&item.y>0&&item.y<player.y&&Math.abs(item.x-player.x)<55);
    if(aligned&&manualShotCooldown<=0&&classicWeapons&&classicWeapons.charges>0)fired=fireClassicWeapon();
    const threats=items.filter(item=>(this.hostile(item)||this.enemy(item))&&item.y>-20&&item.y<H+20).length;
    const scouts=new Set(items.filter(item=>this.enemy(item)));
    return {fired,threats,scouts,state,stage:classicFlightView?.stageNumber||0,hull};
  }};\n`;

export async function runVoyage({voyage, seed, maxSeconds, invulnerable = false}) {
  sources ||= await Promise.all(['index.html', 'game.js', 'core-runtime.js', 'content-runtime.js'].map(read));
  const [html, game, core, content] = sources;
  const dom = new JSDOM(html, {url: 'https://neon.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = () => context();
  w.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({x: 0, y: 0, left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844});
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {}; w.navigator.vibrate = () => true;
  w.AdBridge = {showRewarded: async () => false, showInterstitial: async () => false};
  w.Image = class { constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
    set src(v) { this._src = v; this.complete = true; this.naturalWidth = 1536; this.naturalHeight = 768; } get src() { return this._src || ''; } };
  w.localStorage.setItem('neon-unlocked-v2', '2');
  let state = (seed >>> 0) || 1;
  w.eval('Math').random = () => { state = (state + 0x6D2B79F5) >>> 0; let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  w.eval(core); w.eval(content);
  const hook = `window.S={ev:s=>eval(s),startLevel,startSideVoyage,update};\n` + BOT;
  w.eval(game.replace(MARKER, hook + MARKER));
  const {S, B} = w;
  if (voyage === 'S1-V1') { S.startLevel(0); w.document.getElementById('chapterSkip')?.click(); }
  else if (!S.startSideVoyage(voyage)) throw new RangeError(`Unknown voyage ${voyage}`);

  let seconds = 0, idle = 0, gap = 0, maxGap = 0, threatSum = 0, frames = 0, shots = 0, hits = 0, stageReached = 1, hull = 100;
  let result = 'timeout', previous = new Set(), started = false, gapsOver6 = 0;
  while (seconds < maxSeconds) {
    const view = B.step(invulnerable);
    S.update(DT); seconds += DT; frames++;
    if (view.fired) shots++;
    for (const enemy of previous) if (!view.scouts.has(enemy) && enemy.y > 0 && enemy.y < 1280) hits++;
    previous = view.scouts;
    threatSum += view.threats;
    // El hueco sin acción se mide desde la primera amenaza: el arranque del
    // viaje no cuenta como tramo aburrido (revisión F2).
    started ||= view.threats > 0;
    if (started && view.threats === 0 && view.state === 'playing') {
      idle += DT; gap += DT; maxGap = Math.max(maxGap, gap);
    } else { if (gap > 6) gapsOver6++; gap = 0; }
    stageReached = Math.max(stageReached, view.stage); hull = view.hull;
    const now = S.ev('state');
    if (now === 'complete') { result = 'complete'; break; }
    if (now === 'gameover') { result = 'defeat'; break; }
  }
  if (gap > 6) gapsOver6++;
  w.close();
  const round = value => Math.round(value * 100) / 100;
  return {voyage, seed, result, stageReached, seconds: round(seconds), hull: Math.round(hull), deaths: result === 'defeat' ? 1 : 0,
    shots, hits, idleSeconds: round(idle), maxIdleGap: round(maxGap), idleGapsOver6: gapsOver6, threatsAvg: round(threatSum / Math.max(1, frames))};
}
