#!/usr/bin/env node
// Captura el juego real de NEON CRONIUM en varios niveles a 390×844 (tamaño
// iPhone) para revisar el cielo, los planetas y el HUD de cada sector.
//
// Uso (tras `npm run build`):
//   node scripts/capture-levels.cjs [--levels 2,4,6] [--wait 4] [--root www] [--output DIR]
//
// Los niveles se cuentan desde 1 (1 = Chronos). El script arranca cada nivel
// directamente (sin menús) y espera `--wait` segundos de juego antes de la foto.
const {chromium} = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {
  root: {type: 'string'}, output: {type: 'string'}, levels: {type: 'string'}, wait: {type: 'string'}
}});
const root = path.resolve(values.root || 'www');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(values.output || path.join(os.tmpdir(), 'neon-capturas', 'niveles-' + stamp));
const levels = (values.levels || '2,3,4,5,6,7,8,9,10').split(',').map(Number);
const wait = Number(values.wait || 4);
if (!levels.length || levels.some(level => !Number.isInteger(level) || level < 1 || level > 10)) throw new Error('--levels necesita números del 1 al 10, p. ej. 2,4,6');
if (!Number.isFinite(wait) || wait < 0) throw new Error('--wait necesita segundos >= 0');
const viewport = {width: 390, height: 844};
const MARKER = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
const HOOK = `window.__CAPTURE_LEVELS__ = {start: index => { startLevel(index); },
  status: () => ({state, currentLevel, warpTimer})};\n`;

(async () => {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error(`No existe ${root}/index.html. Ejecuta antes: npm run build`);
  await prepareEvidence(output);
  const report = {status: 'running', startedAt: new Date().toISOString(), root, output, viewport, deviceScaleFactor: 2,
    levels, wait, kind: 'Chromium headless; no certifica Safari ni iPhone físico', cases: []};
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const server = await startStaticServer(root);
  const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  try {
    for (const level of levels) {
      const item = {level, errors: [], failedRequests: []};
      report.cases.push(item);
      const context = await browser.newContext({viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
      try {
        const page = await context.newPage();
        page.on('pageerror', error => item.errors.push(errorText(error)));
        page.on('response', response => { if (response.status() >= 400) item.failedRequests.push(response.status() + ' ' + new URL(response.url()).pathname); });
        await page.addInitScript(() => localStorage.setItem('neon-unlocked-v2', '10'));
        await page.route(/\/game\.js(?:\?.*)?$/, async route => {
          const response = await route.fetch();
          const original = await response.text();
          if (original.split(MARKER).length !== 2) throw new Error('El final de game.js ha cambiado: actualiza MARKER');
          await route.fulfill({response, body: original.replace(MARKER, HOOK + MARKER)});
        });
        await page.goto(server.url, {waitUntil: 'load'});
        await page.waitForFunction(() => Boolean(window.__CAPTURE_LEVELS__));
        await page.evaluate(index => window.__CAPTURE_LEVELS__.start(index), level - 1);
        await page.waitForFunction(index => {
          const value = window.__CAPTURE_LEVELS__.status();
          return value.state === 'playing' && value.currentLevel === index && value.warpTimer <= 0;
        }, level - 1, {timeout: 30000});
        await page.waitForTimeout(wait * 1000);
        item.file = `nivel-${String(level).padStart(2, '0')}.png`;
        await page.screenshot({path: path.join(output, item.file)});
        item.status = item.errors.length ? 'failed' : 'passed';
        console.log(`captura ${item.file}${item.errors.length ? ' (con errores)' : ''}`);
      } catch (error) {
        item.status = 'failed'; item.error = errorText(error);
        console.error(`nivel ${level}: ${item.error}`);
      } finally {
        await context.close();
      }
    }
    report.status = report.cases.every(item => item.status === 'passed') ? 'passed' : 'failed';
  } catch (error) {
    report.status = 'failed'; report.error = errorText(error);
    console.error(report.error);
  } finally {
    await browser.close(); await server.close();
    await saveEvidence(output, report);
  }
  console.log(`${report.status} → ${output}`);
  process.exitCode = report.status === 'passed' ? 0 : 1;
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
