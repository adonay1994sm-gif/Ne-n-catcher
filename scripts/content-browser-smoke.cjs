// Local-only QA. Requires Playwright and Chromium; never deploys or changes game files.
// node scripts/content-browser-smoke.cjs --root www --output /tmp/neon-browser-www
// node scripts/content-browser-smoke.cjs --root preview-dist --output /tmp/neon-browser-preview
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');
const repository = path.resolve(__dirname, '..');
const {values: args} = parseArgs({options: {
  root: {type: 'string'}, output: {type: 'string'}, 'base-url': {type: 'string'},
  baseURL: {type: 'string'}, timeout: {type: 'string'}, help: {type: 'boolean'},
  combat: {type: 'boolean'}, profile: {type: 'string'}, mode: {type: 'string'}
}});
if (args.help) {
  console.log('Options: --root www|preview-dist --output DIR --base-url URL --timeout 45000 --combat [--profile 390x844 --mode n7]');
  process.exit(0);
}
const root = path.resolve(args.root || process.env.NEON_BROWSER_ROOT || path.join(repository, 'www'));
const output = path.resolve(args.output || process.env.NEON_BROWSER_EVIDENCE ||
  path.join(repository, 'docs/continuity-100/evidence/block-02', 'browser-' + new Date().toISOString().replace(/[:.]/g, '-')));
const timeout = Number(args.timeout || process.env.NEON_BROWSER_TIMEOUT || 45000);
assert.ok(Number.isFinite(timeout) && timeout >= 1000 && timeout <= 180000, 'Timeout must be 1000–180000 ms');
const externalURL = args['base-url'] || args.baseURL || process.env.NEON_BROWSER_BASE_URL;
const profiles = [
  {name: '390x844', width: 390, height: 844, dpr: 3},
  {name: '320x568', width: 320, height: 568, dpr: 2},
  {name: '844x390', width: 844, height: 390, dpr: 3}
].filter(profile => !args.profile || profile.name === args.profile);
const modes = ['original', 'n7'].filter(mode => !args.mode || mode === args.mode);
assert.ok(profiles.length && modes.length, 'Unknown --profile or --mode');
const expectedCases = profiles.length * modes.length + Number(Boolean(args.combat));
const report = {
  status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  sourceRoot: root, output, timeout, cases: [], expectedCases,
  limits: ['Chromium emulation only; no physical Safari/iPhone certification.',
    'Real game images and Canvas rendering; not a sustained FPS or memory benchmark.',
    'Read-only inspection hook inserted into the served game response; shipped bundles unchanged.',
    'Smoke modes unlocked through separate keys; optional combat session completes route 37 naturally at DPR 1.',
    'Selector currently renders 10/100 buttons; pagination requires an explicit test update.',
    'Service workers blocked to verify fresh resources; offline/cache lifecycle not certified.']
};
async function saveReport() {
  await saveEvidence(output, report);
}
// Temporal polling is deliberate: QA must not schedule additional RAF callbacks.
async function wait(page, predicate, argument) {
  await page.waitForFunction(predicate, argument, {polling: 100, timeout});
}
async function snapshot(page, detailed = false) {
  return page.evaluate(detailed => {
    const a = window.__RAF_AUDIT__;
    return {game: window.__GAME_QA__?.() || null, raf: a ? {
      maxPending: a.maximum, pending: a.pending.size, frames: a.frames,
      firstTimestamp: a.first, lastTimestamp: a.last, recentFrames: detailed ? a.recent.slice(-8) : undefined,
      callbackErrors: a.errors, negativeRawDeltas: a.negativeRawDeltas
    } : null, combat: window.__COMBAT_QA__ || null,
      events: detailed ? window.__QA_EVENTS__?.slice(-5) : undefined, visibility: document.visibilityState};
  }, detailed);
}
async function layout(page, paused = false) {
  const result = await page.evaluate(paused => {
    const issues = [];
    const rect = element => {
      const r = element.getBoundingClientRect();
      return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
    };
    const inside = (r, outer) => r.x >= outer.x - 1 && r.y >= outer.y - 1 && r.right <= outer.right + 1 && r.bottom <= outer.bottom + 1;
    const viewport = {x:0,y:0,right:innerWidth,bottom:innerHeight};
    const controls = {};
    const selectors = paused ? ['#paused .panel','#resume','#pauseSettings','#restart','#quit'] : ['#hud','#pause','#pause svg','#fire'];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) { issues.push(`Missing ${selector}`); continue; }
      const bounds = controls[selector] = rect(element);
      if (!bounds.width || !bounds.height || !inside(bounds, viewport)) issues.push(`Outside viewport: ${selector}`);
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (/(hidden|clip|auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY) && !inside(bounds, rect(parent))) {
          issues.push(`Clipped ${selector} by ${parent.id || parent.className || parent.tagName}`);
        }
      }
    }
    const hud = [];
    if (!paused) for (const cell of document.querySelectorAll('#hud > div')) {
      const bounds = rect(cell), text = [];
      for (const element of cell.querySelectorAll('small,b')) {
        const range = document.createRange(); range.selectNodeContents(element);
        const r = range.getBoundingClientRect();
        if (r.left < bounds.x - 1 || r.right > bounds.right + 1) issues.push(`HUD text overflow: ${element.textContent}`);
        text.push({value:element.textContent,width:r.width});
      }
      hud.push({bounds,text});
    }
    const game = document.querySelector('.game'), canvas = rect(document.querySelector('#canvas'));
    const q = __GAME_QA__();
    if (game.scrollTop !== 0 || game.scrollLeft !== 0) issues.push('Game container scrolled');
    if (Math.abs(canvas.width / canvas.height - q.W / q.H) > .002) issues.push('Canvas aspect ratio differs from logical coordinates');
    return {issues,controls,hud,canvas,logical:{width:q.W,height:q.H},gameScrollTop:game.scrollTop,gameScrollLeft:game.scrollLeft};
  }, paused);
  assert.deepEqual(result.issues, [], 'Visible layout is clipped or distorted');
  return result;
}
async function runCase(browser, profile, mode, baseURL, fullRoute = false) {
  const result = {id: `${profile.name}-${mode}${fullRoute ? '-combat-progress' : ''}`, profile, mode, fullRoute, status: 'running',
    startedAt: new Date().toISOString(), steps: [], errors: [], failedRequests: [],
    consoleErrors: [], instrumentationErrors: [], bundles: {}, images: []};
  report.cases.push(result); await saveReport();
  const began = Date.now();
  const context = await browser.newContext({viewport: {width: profile.width, height: profile.height},
    deviceScaleFactor: profile.dpr, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  if (externalURL && process.env.NEON_BROWSER_PASSWORD) {
    const auth = await context.request.post(baseURL, {
      form: {password: process.env.NEON_BROWSER_PASSWORD}, maxRedirects: 0, timeout
    });
    assert.equal(auth.status(), 302, 'Remote preview password was rejected');
    result.passwordProtectedPreview = true;
  }
  const page = await context.newPage();
  page.setDefaultTimeout(timeout); page.setDefaultNavigationTimeout(timeout);
  page.on('pageerror', error => result.errors.push(errorText(error)));
  page.on('requestfailed', request => result.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {
    if (response.status() >= 400) result.failedRequests.push({url: response.url(), status: response.status()});
  });
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  async function step(name, action) {
    const entry = {name, startedAt: new Date().toISOString(), status: 'running'};
    result.steps.push(entry); await saveReport();
    console.log(`[${result.id}] ${name}`);
    const started = Date.now();
    try {
      await action(); entry.snapshot = await snapshot(page);
      assert.deepEqual(result.instrumentationErrors, [], 'Inspection hook failed');
      assert.deepEqual(result.errors, [], 'Uncaught game JavaScript exception');
      assert.deepEqual(entry.snapshot.raf?.callbackErrors || [], [], 'RAF callback failed');
      entry.status = 'passed';
    } catch (error) {
      entry.status = 'failed'; entry.error = errorText(error);
      entry.snapshot = await snapshot(page, true).catch(error => ({inspectionError: errorText(error)}));
      throw error;
    } finally { entry.durationMs = Date.now() - started; await saveReport(); }
  }
  try {
    await page.addInitScript(({fullRoute}) => {
      // Initialize once per context, never overwrite saves on reload or mode changes.
      if (!sessionStorage.getItem('neon-browser-qa-seeded')) {
        localStorage.setItem('neon-n7-unlocked-v1', fullRoute ? '37' : '100');
        localStorage.setItem('neon-unlocked-v2', fullRoute ? '7' : '10');
        localStorage.setItem('neon-preview-v1:neon-n7-unlocked-v1', fullRoute ? '37' : '100');
        localStorage.setItem('neon-preview-v1:neon-unlocked-v2', fullRoute ? '2' : '10');
        localStorage.setItem('neon-best-v2', '2026');
        localStorage.setItem('neon-n7-best-v1', '2037');
        sessionStorage.setItem('neon-browser-qa-seeded', '1');
      }
      window.__COMBAT_QA__ = {enemiesSeen: 0, projectilesSeen: 0, projectilesMoved: 0,
        projectileMaxTravel: 0, framesWithVisibleProjectiles: 0, lastEnemyAt: null, lastProjectileAt: null};
      const enemyIds = new Set(), projectileFirstY = new Map();
      const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      const audit = window.__RAF_AUDIT__ = {pending: new Set(), maximum: 0, frames: 0,
        first: null, last: null, recent: [], errors: [], negativeRawDeltas: []};
      window.requestAnimationFrame = callback => {
        const id = request(now => {
          audit.pending.delete(id); audit.frames++; audit.first ??= now; audit.last = now;
          const before = window.__GAME_QA__?.();
          const trace = {timestamp: now, previousLast: before?.last, state: before?.state,
            directorBefore: before?.directorTime, rawDelta: before ? (now - before.last) / 1000 : null};
          if (trace.rawDelta < 0) {
            audit.negativeRawDeltas.push(trace); if (audit.negativeRawDeltas.length > 24) audit.negativeRawDeltas.shift();
          }
          try { callback(now); }
          catch (error) { audit.errors.push({timestamp: now, error: error.stack || String(error)}); throw error; }
          finally {
            const after = window.__GAME_QA__?.();
            trace.directorAfter = after?.directorTime;
            const combat = window.__COMBAT_QA__;
            for (const enemy of after?.enemies || []) {
              enemyIds.add(enemy.id); combat.enemiesSeen = enemyIds.size; combat.lastEnemyAt = after.directorTime;
            }
            const projectiles = after?.projectiles || [];
            if (projectiles.some(shot => shot.y > 0 && shot.y < after.H)) combat.framesWithVisibleProjectiles++;
            for (const shot of projectiles) {
              if (!projectileFirstY.has(shot.id)) projectileFirstY.set(shot.id, shot.y);
              const travel = shot.y - projectileFirstY.get(shot.id);
              combat.projectileMaxTravel = Math.max(combat.projectileMaxTravel, travel);
              combat.projectilesSeen = projectileFirstY.size; combat.lastProjectileAt = after.directorTime;
              if (travel > 100) combat.projectilesMoved = Math.max(combat.projectilesMoved, 1);
            }
            audit.recent.push(trace); if (audit.recent.length > 24) audit.recent.shift();
          }
        });
        audit.pending.add(id); audit.maximum = Math.max(audit.maximum, audit.pending.size); return id;
      };
      window.cancelAnimationFrame = id => { audit.pending.delete(id); cancel(id); };
      window.__QA_EVENTS__ = [];
      const eventBefore = new WeakMap();
      document.addEventListener('click', event => {
        const id = event.target.closest?.('button')?.id;
        if (!['launch', 'pause', 'resume', 'restart', 'quit', 'fire'].includes(id)) return;
        eventBefore.set(event, {id, before: window.__GAME_QA__?.()});
      }, true);
      // Bubble after the actual target handler, without waiting for another frame.
      document.addEventListener('click', event => {
        const captured = eventBefore.get(event);
        if (captured) window.__QA_EVENTS__.push({...captured, at: performance.now(), after: window.__GAME_QA__?.()});
      });
    }, {fullRoute});
    await page.route(/\/(?:game|content-runtime|core-runtime)\.js(?:\?.*)?$/, async route => {
      try {
        const response = await route.fetch({timeout}); const body = await response.body();
        const name = path.posix.basename(new URL(route.request().url()).pathname);
        result.bundles[name] = {url: route.request().url(), bytes: body.length, sha256: sha256(body)};
        if (name !== 'game.js') { await route.fulfill({response, body}); return; }
        const source = body.toString('utf8');
        const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
        assert.equal(source.split(marker).length, 2, 'Expected exactly one legacy bootstrap marker');
        const hook = `window.__GAME_QA__ = () => ({state,hull,ammo,currentLevel,N7_CAMPAIGN,
          levelCount:LEVELS.length,playerX:player.x,target:player.target,W,H,elapsed,last,warpTimer,runToken,
          legacyRunning,legacyFrameId,entityCount:items.length,directorTime:encounterDirector?.elapsed ?? null,
          reproduction:encounterDirector?.reproduction ?? null, collected, score, goal:level().goal,
          preview:Boolean(window.NeonPreview), unlocked:getUnlocked(),keys:{...KEYS},
          enemies:items.filter(item=>item.n7).map(item=>({id:item.id,x:item.x,y:item.y})),
          projectiles:items.filter(item=>item.n7Projectile).map(item=>({id:item.id,x:item.x,y:item.y}))});
          window.__GAME_ASSETS_QA__ = () => [...new Set([...Object.values(SPRITES),
            ...Object.values(SPRITE_GROUPS).flat()])].map(image => ({path:image._assetPath,url:image.src,
            complete:image.complete,width:image.naturalWidth,height:image.naturalHeight}));\n`;
        await route.fulfill({response, body: source.replace(marker, hook + marker)});
      } catch (error) {
        result.instrumentationErrors.push(errorText(error)); await route.abort().catch(() => {});
      }
    });
    await step('open selected mode and verify level selector', async () => {
      await page.goto(baseURL, {waitUntil: 'load'});
      const preview = await page.locator('#n7link').count() === 1;
      result.previewLauncher = preview;
      if (preview) {
        if (mode === 'n7') {
          const archive = page.locator('#qaArchive');
          if (await archive.count() && await archive.getAttribute('open') === null) {
            await archive.locator('summary').click();
          }
          if (!fullRoute) await page.locator('#unlock').check();
          await page.locator('#n7link').click();
        }
        else await page.locator('a.card:not(#n7link)').click();
      } else if (mode === 'n7') {
        const url = new URL(page.url()); url.searchParams.set('campaign', 'n7');
        await page.goto(url.href, {waitUntil: 'load'});
      }
      await wait(page, () => typeof window.__GAME_QA__ === 'function' && __GAME_QA__().state === 'menu');
      result.gameURL = page.url();
      const state = await page.evaluate(() => __GAME_QA__());
      assert.equal(state.N7_CAMPAIGN, mode === 'n7'); assert.equal(state.levelCount, mode === 'n7' ? 100 : 10);
      result.storageBefore = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])));
      await page.locator('#levels').click();
      await wait(page, expected => document.querySelectorAll('#levelGrid button').length === expected, state.levelCount);
      result.levelCards = await page.locator('#levelGrid button').count();
      assert.equal(await page.locator('#levelGrid button:disabled').count(), fullRoute ? 63 : 0);
      await page.locator('#levelGrid button').nth(mode === 'n7' ? 36 : 0).click();
      await page.locator('#launch').click();
      await wait(page, isN7 => {
        const g = __GAME_QA__();
        return g.state === 'playing' && g.warpTimer === 0 && (isN7 ? g.directorTime > .05 : g.elapsed > 1.3);
      }, mode === 'n7');
      // Deferred sprites deliberately have no URL until their first use (for
      // example CH-01 is absent from the classic campaign).
      await wait(page, () => __GAME_ASSETS_QA__().filter(image => image.url)
        .every(image => image.complete && image.width > 0 && image.height > 0));
      result.images = await page.evaluate(() => __GAME_ASSETS_QA__().filter(image => image.url));
    });
    await step('touch movement and fire with visible controls', async () => {
      result.layout = {playing:await layout(page)};
      const canvas = await page.locator('#canvas').boundingBox();
      assert.ok(canvas?.width > 0 && canvas.height > 0, 'Canvas has no rendered size');
      const before = await page.evaluate(() => __GAME_QA__());
      await page.touchscreen.tap(canvas.x + canvas.width * .42, canvas.y + canvas.height * .60);
      await wait(page, previousX => {
        const g = __GAME_QA__(); return Math.abs(g.target - g.W * .42) < 2 && g.playerX < previousX - 4;
      }, before.playerX);
      result.touch = {canvas, before, after: await page.evaluate(() => __GAME_QA__())};
      await page.touchscreen.tap(canvas.x + canvas.width * .5, canvas.y + canvas.height * .60);
      const fire = await page.locator('#fire').boundingBox();
      assert.ok(fire && fire.x >= 0 && fire.y >= 0 && fire.x + fire.width <= profile.width + 1 &&
        fire.y + fire.height <= profile.height + 1, 'Fire control outside viewport');
      result.fireBounds = fire;
      await page.locator('#fire').click();
      await wait(page, () => __QA_EVENTS__.some(event => event.id === 'fire' && event.after.ammo === event.before.ammo - 1));
    });
    if (fullRoute) await step('real enemies and moving enemy projectiles reach the visible playfield', async () => {
      await page.waitForFunction(() => __COMBAT_QA__.enemiesSeen > 0 && __COMBAT_QA__.projectilesSeen > 0 &&
        __COMBAT_QA__.projectilesMoved > 0 && __COMBAT_QA__.framesWithVisibleProjectiles >= 3,
        undefined, {polling:200,timeout:180000});
      assert.equal((await snapshot(page)).game.state, 'playing');
      await page.screenshot({path:path.join(output,result.id+'-combat.png'),timeout});
    });
    let paused;
    await step('pause freezes simulation while one RAF continues', async () => {
      await page.locator('#pause').click(); await wait(page, () => __GAME_QA__().state === 'paused');
      paused = await snapshot(page);
      await wait(page, frame => __RAF_AUDIT__.frames >= frame + 3, paused.raf.frames);
      const after = await snapshot(page);
      assert.equal(after.game.elapsed, paused.game.elapsed); assert.equal(after.game.directorTime, paused.game.directorTime);
      assert.equal(after.raf.pending, 1); assert.equal(after.raf.maxPending, 1);
      result.layout.paused = await layout(page,true);
      assert.ok(Math.abs(result.layout.paused.canvas.y - result.layout.playing.canvas.y) < 1, 'Pause moved canvas by scrolling');
      await page.screenshot({path: path.join(output, result.id + '-paused.png'), timeout});
    });
    await step('resume advances real game clock and encounter director', async () => {
      await page.locator('#resume').click();
      await wait(page, before => {
        const g = __GAME_QA__(); return g.state === 'playing' && g.elapsed > before.elapsed + .05 &&
          (before.directorTime === null || g.directorTime > before.directorTime + .05);
      }, paused.game);
      const resumed = await snapshot(page);
      assert.equal(resumed.raf.pending, 1); assert.equal(resumed.raf.maxPending, 1);
      assert.ok(resumed.raf.frames > paused.raf.frames); result.lifecycle = {paused, resumed};
    });
    if (fullRoute) {
      await step('natural route completion saves progress only in its own namespace', async () => {
        // Real RAF, unmodified simulation speed, center refuge. No forced victory or time jumps.
        const progressTimer = setInterval(async () => {
          try {
            const g = await page.evaluate(() => __GAME_QA__());
            console.log(`[${result.id}] director=${g.directorTime.toFixed(2)} collected=${g.collected}/${g.goal} hull=${g.hull} state=${g.state}`);
          } catch {}
        },10000);
        try {
          await page.waitForFunction(() => ['complete','over','destroying'].includes(__GAME_QA__().state),
            undefined,{polling:500,timeout:420000});
        } finally { clearInterval(progressTimer); }
        const completed = (await snapshot(page)).game;
        assert.equal(completed.state,'complete'); assert.equal(completed.currentLevel,36);
        assert.equal(completed.unlocked,38); assert.ok(completed.collected >= completed.goal);
        assert.equal(completed.hull,100);
        const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key,localStorage.getItem(key)])));
        const prefix = completed.preview ? 'neon-preview-v1:' : '';
        const allowed = new Set(Object.entries(completed.keys).filter(([key])=>key !== 'settings').map(([,value])=>prefix+value));
        for (const key of new Set([...Object.keys(result.storageBefore),...Object.keys(after)])) {
          if (!allowed.has(key)) assert.equal(after[key],result.storageBefore[key],`Foreign save changed: ${key}`);
        }
        assert.equal(after[prefix+completed.keys.unlocked],'38');
        assert.ok(JSON.parse(after[prefix+completed.keys.stars])['37'] > 0);
        assert.ok(JSON.parse(after[prefix+completed.keys.levelBest])['37'] > 0);
        result.progress = {completed,before:result.storageBefore,after};
        await page.screenshot({path:path.join(output,result.id+'-complete.png'),timeout});
        await page.reload({waitUntil:'load'});
        await wait(page,()=>typeof window.__GAME_QA__ === 'function' && __GAME_QA__().state === 'menu');
        assert.equal((await snapshot(page)).game.unlocked,38);
        await page.locator('#levels').click();
        assert.equal(await page.locator('#levelGrid button:not(:disabled)').count(),38);
        result.progress.persistedAfterReload = true;
      });
      await step('switch to classic mode without importing N-7 progress', async () => {
        if (result.previewLauncher) {
          await page.goto(baseURL,{waitUntil:'load'});
          await page.locator('a.card:not(#n7link)').click();
        } else {
          const url = new URL(page.url()); url.searchParams.delete('campaign');
          await page.goto(url.href,{waitUntil:'load'});
        }
        await wait(page,()=>typeof window.__GAME_QA__ === 'function' && __GAME_QA__().state === 'menu');
        const game = (await snapshot(page)).game;
        assert.equal(game.N7_CAMPAIGN,false); assert.equal(game.levelCount,10);
        assert.equal(game.unlocked,game.preview ? 2 : 7);
        assert.deepEqual(result.errors,[]); assert.deepEqual(result.failedRequests,[]);
      });
      result.status = 'passed'; return;
    }
    await step('restart resets progress, preserves seed and advances again', async () => {
      await page.locator('#pause').click(); const before = await page.evaluate(() => __GAME_QA__());
      await page.locator('#restart').click();
      await wait(page, token => __QA_EVENTS__.some(event => event.id === 'restart' && event.after.runToken === token + 1), before.runToken);
      const event = await page.evaluate(() => __QA_EVENTS__.filter(event => event.id === 'restart').at(-1));
      assert.equal(event.after.state, 'playing'); assert.equal(event.after.hull, 100); assert.equal(event.after.ammo, 3);
      assert.equal(event.after.elapsed, 0); assert.equal(event.after.directorTime, mode === 'n7' ? 0 : null);
      assert.equal(event.after.currentLevel, before.currentLevel); assert.deepEqual(event.after.reproduction, before.reproduction);
      await wait(page, isN7 => {
        const g = __GAME_QA__(); return g.state === 'playing' && g.warpTimer === 0 &&
          (isN7 ? g.directorTime > .05 : g.elapsed > 1.3);
      }, mode === 'n7');
    });
    await step('return to menu and verify resource and RAF health', async () => {
      await page.locator('#pause').click(); await page.locator('#quit').click();
      await wait(page, () => __GAME_QA__().state === 'menu' && document.querySelector('#menu').classList.contains('show'));
      const before = await snapshot(page);
      await wait(page, frame => __RAF_AUDIT__.frames >= frame + 2, before.raf.frames);
      const after = await snapshot(page);
      assert.equal(after.game.elapsed, before.game.elapsed); assert.equal(after.game.directorTime, before.game.directorTime);
      assert.equal(after.raf.maxPending, 1); assert.equal(after.raf.pending, 1);
      assert.deepEqual(result.failedRequests, [], 'Failed HTTP/image/script requests');
      assert.deepEqual(result.consoleErrors, [], 'Browser console errors');
      for (const bundle of ['game.js', 'core-runtime.js', 'content-runtime.js']) assert.ok(result.bundles[bundle], `Missing loaded bundle ${bundle}`);
      result.final = after;
    });
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed'; result.error = errorText(error);
    result.failureSnapshot = await snapshot(page, true).catch(error => ({inspectionError: errorText(error)}));
    await page.screenshot({path: path.join(output, result.id + '-failure.png'), timeout: Math.min(timeout, 10000)})
      .catch(error => { result.screenshotError = errorText(error); });
    console.error(`[${result.id}] ${result.error}`);
  } finally { result.durationMs = Date.now() - began; await context.close(); await saveReport(); }
}
async function main() {
  await prepareEvidence(output);
  let browser, server;
  const began = Date.now();
  try {
    await saveReport();
    if (!externalURL) server = await startStaticServer(root);
    const baseURL = externalURL || server.url; report.baseURL = baseURL;
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true, timeout, args: ['--no-sandbox', '--disable-dev-shm-usage'],
      ...(process.env.NEON_BROWSER_PROXY ? {proxy: {server: process.env.NEON_BROWSER_PROXY}} : {})});
    report.browser = browser.version();
    for (const profile of profiles) for (const mode of modes) await runCase(browser, profile, mode, baseURL);
    if (args.combat) await runCase(browser,{name:'390x844-dpr1',width:390,height:844,dpr:1},'n7',baseURL,true);
    report.status = report.cases.length === expectedCases && report.cases.every(result => result.status === 'passed') ? 'passed' : 'failed';
    report.exitCode = report.status === 'passed' ? 0 : 1;
  } catch (error) {
    report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); console.error(report.error);
  } finally {
    report.durationMs = Date.now() - began; report.finishedAt = new Date().toISOString(); await saveReport();
    await browser?.close();
    if (server) await server.close();
    process.exitCode = report.exitCode;
    console.log(JSON.stringify({status: report.status, exitCode: report.exitCode,
      casesPassed: report.cases.filter(result => result.status === 'passed').length, totalCases: expectedCases, output, durationMs: report.durationMs}));
  }
}
main().catch(error => { console.error(errorText(error)); process.exitCode = 1; });
