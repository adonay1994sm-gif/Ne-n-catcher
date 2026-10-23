import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

// En el navegador no se puede bloquear el giro: en horizontal se tapa el
// juego con un aviso y la partida se pausa (propietario, 23/10/2026).
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(join(root, file), 'utf8');
const [html, css, game, core, content] = await Promise.all(['index.html', 'styles.css', 'game.js', 'core-runtime.js', 'content-runtime.js'].map(read));
const MARKER = '  legacyFrameId = requestAnimationFrame(frame);\n})();';

test('the page has a rotate notice that only shows on a phone in landscape', () => {
  const dom = new JSDOM(html);
  const notice = dom.window.document.getElementById('rotateNotice');
  assert.ok(notice, '#rotateNotice exists');
  assert.match(notice.textContent, /Gira el móvil/);
  assert.match(css, /@media\s*\(orientation:\s*landscape\)\s*and\s*\(pointer:\s*coarse\)[^{]*\{\s*#rotateNotice\s*\{[^}]*display:\s*flex/);
});

test('turning the phone to landscape pauses a game in progress', () => {
  const dom = new JSDOM(html, {url: 'https://neon.test/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window, listeners = [];
  w.matchMedia = query => ({matches: false, media: query,
    addEventListener: (type, fn) => { if (/orientation: landscape/.test(query)) listeners.push(fn); }, removeEventListener() {}});
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {get: (t, k) => k in t ? t[k] :
    (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({addColorStop() {}}) : k === 'measureText' ? () => ({width: 10}) : () => {},
    set: (t, k, v) => { t[k] = v; return true; }});
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {};
  w.Image = class { set src(v) { this._src = v; this.complete = true; this.naturalWidth = 1536; this.naturalHeight = 768; } get src() { return this._src; } };
  w.localStorage.setItem('neon-unlocked-v2', '2');
  w.eval(core); w.eval(content);
  w.eval(game.replace(MARKER, 'window.T={st:()=>state,startSideVoyage,update};\n' + MARKER));
  w.T.startSideVoyage('S1-V2'); w.T.update(1 / 60);
  assert.equal(w.T.st(), 'playing');
  assert.ok(listeners.length > 0, 'the game listens for landscape');
  for (const fn of listeners) fn({matches: true});
  assert.equal(w.T.st(), 'paused');
});
