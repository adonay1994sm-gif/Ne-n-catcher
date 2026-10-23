// Captura el inicio real del juego (www/ tras `npm run build`) para revisar
// arte y cinemáticas. Solo lectura: no cambia el juego ni los guardados del
// usuario (perfil de navegador nuevo y en memoria, service worker bloqueado).
//
// Uso:
//   node scripts/capture-intro.cjs [--times 1,5,9] [--video] [--root www] [--output DIR]
//
// Los tiempos son segundos de reloj desde que empieza la partida (JUGAR abre
// el sector 1 directamente; #launch solo si aparece el briefing antiguo).
// Por defecto guarda fuera del repositorio (carpeta temporal del sistema).
const {chromium} = require('playwright');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {
  root: {type: 'string'}, output: {type: 'string'}, times: {type: 'string'}, video: {type: 'boolean'}
}});
const root = path.resolve(values.root || 'www');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(values.output || path.join(os.tmpdir(), 'neon-capturas', 'intro-' + stamp));
const times = (values.times || '1,5,9').split(',').map(Number);
if (!times.length || times.some(t => !Number.isFinite(t) || t < 0)) throw new Error('--times necesita segundos >= 0 separados por comas, p. ej. 1,5,9');
times.sort((a, b) => a - b);
const viewport = {width: 390, height: 844};

(async () => {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error(`No existe ${root}/index.html. Ejecuta antes: npm run build`);
  await prepareEvidence(output);
  const report = {status: 'running', startedAt: new Date().toISOString(), root, output, viewport, deviceScaleFactor: 2,
    times, video: Boolean(values.video), kind: 'Chromium headless; no certifica Safari ni iPhone físico',
    screenshots: [], errors: [], consoleErrors: [], failedRequests: []};
  // Chromium del sistema si existe; si no, el que trae Playwright.
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const server = await startStaticServer(root);
  const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  report.browserVersion = browser.version();
  let context;
  try {
    context = await browser.newContext({viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      serviceWorkers: 'block', ...(values.video ? {recordVideo: {dir: output, size: viewport}} : {})});
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(errorText(error)));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(response.status() + ' ' + new URL(response.url()).pathname); });
    await page.goto(server.url, {waitUntil: 'load'});
    await page.locator('#play').click();
    if (await page.locator('#briefing.show').count()) await page.locator('#launch').click();
    const start = Date.now();
    for (const seconds of times) {
      const wait = start + seconds * 1000 - Date.now();
      if (wait > 0) await page.waitForTimeout(wait);
      const file = `intro-${String(seconds).replace('.', '_')}s.png`;
      // Momento en que se pide la captura; la imagen tarda unos cientos de ms en guardarse.
      const actualSeconds = (Date.now() - start) / 1000;
      await page.screenshot({path: path.join(output, file)});
      report.screenshots.push({file, requestedSeconds: seconds, actualSeconds});
      console.log(`captura ${file} (${actualSeconds.toFixed(2)} s)`);
    }
    if (values.video) {
      const video = page.video();
      await context.close(); context = null;
      const file = path.join(output, 'intro.webm');
      await fsp.rename(await video.path(), file);
      report.videoFile = 'intro.webm';
      console.log('vídeo intro.webm');
    }
    report.status = report.errors.length ? 'failed' : 'passed';
  } catch (error) {
    report.status = 'failed'; report.error = errorText(error);
    console.error(report.error);
  } finally {
    if (context) await context.close();
    await browser.close(); await server.close();
    await saveEvidence(output, report);
  }
  console.log(`${report.status} → ${output}`);
  process.exitCode = report.status === 'passed' ? 0 : 1;
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
