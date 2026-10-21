#!/usr/bin/env node
// Juega S1-V2 desde el mapa (RUTA) en Chromium, lo completa con un gancho de
// prueba y comprueba guardado propio, vuelta al mapa y que S1-V1 no cambia.
// Uso (tras npm run build): node scripts/side-voyage-smoke.cjs [prefijo-de-capturas] [S1-V2|S1-V3|…]
// S1-V2 se abre tocando el mapa; los demás se lanzan directamente con el gancho.
const {chromium} = require('playwright');
const {startStaticServer} = require('./browser-qa-helpers.cjs');
const out = process.argv[2] || require('node:path').join(require('node:os').tmpdir(), 's1-v2');
const MARKER = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
const voyage = process.argv[3] || 'S1-V2', saveKey = `neonCatcher.voyage.${voyage}.v1`;
const HOOK = `window.__V2__={start:id=>startSideVoyage(id),status:()=>({state,currentLevel,route:classicFlightView?.routeId,stage:classicFlightView?.stageId,
  dest:document.getElementById('flightDestination')?.textContent,atlas:isAtlasMission(),chapter:Boolean(classicChapterStory),side:classicSideVoyage?.ficha.id}),
  finish:()=>{collected=36;for(let i=0;i<30000&&!classicFlight.snapshot().canFinish;i++)classicFlightView=classicFlight.advance(.034,collected,classicFlightEvent);
    completeLevel();const atlasStarted=Boolean(atlasBoss);
    if(atlasBoss){atlasBoss.resolved=true;completeLevel();}
    return {state,atlasStarted,side:Boolean(classicSideVoyage),overlay:document.getElementById('levelSelect').classList.contains('show')};}};\n`;
(async () => {
  const server = await startStaticServer(require('node:path').resolve('www'));
  const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block'})).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('init')) { localStorage.setItem('neon-unlocked-v2', '2'); sessionStorage.setItem('init', '1'); } });
  await page.route(/\/game\.js(?:\?.*)?$/, async route => { const r = await route.fetch(); await route.fulfill({response: r, body: (await r.text()).replace(MARKER, HOOK + MARKER)}); });
  await page.goto(server.url, {waitUntil: 'load'});
  const v1Before = await page.evaluate(() => localStorage.getItem('neonCatcher.chronosVoyage.v2'));
  await page.locator('#levels').click(); await page.waitForTimeout(300);
  if (voyage === 'S1-V2') await page.locator('.sector-route[data-voyage="S1-V2"]').click();
  else await page.evaluate(id => window.__V2__.start(id), voyage);
  await page.waitForTimeout(6000);
  const playing = await page.evaluate(() => window.__V2__.status());
  await page.screenshot({path: `${out}-vuelo.png`});
  const finish = await page.evaluate(() => window.__V2__.finish());
  await page.waitForTimeout(500);
  await page.screenshot({path: `${out}-mapa.png`});
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  const v1After = await page.evaluate(() => localStorage.getItem('neonCatcher.chronosVoyage.v2'));
  const routeDone = await page.locator(`.sector-route[data-voyage="${voyage}"]`).getAttribute('data-status');
  console.log(JSON.stringify({playing, finish, saved: {voyage: saved?.voyage, completed: saved?.completed, stage: saved?.checkpoint?.stageNumber}, v1Untouched: v1Before === v1After, routeDone, errors}, null, 1));
  await browser.close(); await server.close();
})();
