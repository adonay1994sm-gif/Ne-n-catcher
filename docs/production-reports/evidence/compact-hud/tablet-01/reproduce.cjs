// Read-only browser reproduction of the compact HUD's tall-landscape cascade.
// The game is served unchanged from preview-dist; only actual UI controls run.
const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const helpers = require('../../../../../scripts/browser-qa-helpers.cjs');
const directory = __dirname;
const root = path.resolve(directory, '../../../../..');
const preview = path.join(root, 'preview-dist');
const report = {startedAt: new Date().toISOString(), command: process.argv,
  viewport: {width: 1024, height: 768}, browser: 'Real Chromium, DPR1, touch emulation',
  limitations: ['Layout reproduction only; not natural gameplay, Safari or physical iPad QA.'],
  status: 'running', exitCode: null, errors: [], consoleErrors: [], failedRequests: []};
let browser, server;
(async () => {
  await helpers.prepareEvidence(directory);
  report.git = {sha: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
    status: execFileSync('git', ['status', '--short'], {cwd: root, encoding: 'utf8'}).trim()};
  report.scriptSha256 = helpers.sha256(await fs.readFile(__filename));
  report.buildInfo = JSON.parse(await fs.readFile(path.join(preview, 'build-info.json'), 'utf8'));
  report.hashes = {};
  for (const file of ['juego/game.js', 'juego/styles.css']) {
    report.hashes[file] = helpers.sha256(await fs.readFile(path.join(preview, file)));
  }
  server = await helpers.startStaticServer(preview);
  browser = await chromium.launch({executablePath: '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport: report.viewport,
    deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(helpers.errorText(error)));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => report.failedRequests.push({url: request.url(), error: request.failure()}));
  await page.goto(server.url, {waitUntil: 'load'});
  await page.locator('#classiclink').click();
  await page.locator('#play').click();
  await page.locator('#launch').click();
  await page.waitForFunction(() => !document.getElementById('hud').classList.contains('hidden'));
  await page.waitForTimeout(300);
  report.layout = await page.evaluate(() => {
    const rectangle = id => {
      const node = document.getElementById(id), rect = node.getBoundingClientRect(), style = getComputedStyle(node);
      return {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
        width: rect.width, height: rect.height, transform: style.transform,
        cssLeft: style.left, cssRight: style.right, display: style.display};
    };
    return {viewport: {width: innerWidth, height: innerHeight},
      landscape: matchMedia('(orientation: landscape)').matches,
      shortLandscape: matchMedia('(orientation: landscape) and (max-height: 500px)').matches,
      canvas: rectangle('canvas'), hud: rectangle('hud'), pause: rectangle('pause'),
      route: rectangle('flightRoute'), weapon: rectangle('flightWeapon')};
  });
  await page.screenshot({path: path.join(directory, 'tablet-before-fix.png'), timeout: 30000});
  const hud = report.layout.hud, viewport = report.layout.viewport;
  const unclipped = hud.left >= 0 && hud.right <= viewport.width && hud.top >= 0 && hud.bottom <= viewport.height;
  report.checks = [{name: 'The complete HUD remains within a 1024x768 landscape viewport',
    status: unclipped ? 'passed' : 'failed', actual: hud}];
  report.status = unclipped ? 'passed' : 'failed';
  report.exitCode = unclipped ? 0 : 1;
  report.expectedDefect = 'Tall-landscape retains translateX(-50%) while compact HUD overrides left to8px.';
  for (const file of ['juego/game.js', 'juego/styles.css']) {
    if (helpers.sha256(await fs.readFile(path.join(preview, file))) !== report.hashes[file]) {
      throw new Error('The preview changed during this read-only layout reproduction');
    }
  }
})().catch(error => {
  report.status = 'failed'; report.exitCode = 1; report.error = helpers.errorText(error);
}).finally(async () => {
  report.finishedAt = new Date().toISOString();
  await helpers.saveEvidence(directory, report);
  await browser?.close(); await server?.close();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode, layout: report.layout, error: report.error}));
  process.exitCode = report.exitCode;
});
