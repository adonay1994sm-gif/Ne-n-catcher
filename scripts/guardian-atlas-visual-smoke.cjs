// CONTROLLED visual fixtures, NOT a natural playthrough or boss-balance test.
// Only the local HTTP response receives scene preparation and read-only hooks.
// node scripts/guardian-atlas-visual-smoke.cjs --root preview-dist --output /tmp/atlas-visual-01
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type: 'string'}, output: {type: 'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || `docs/production-reports/evidence/guardian-atlas/visual-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const profiles = [{width: 390, height: 844}, {width: 320, height: 568}, {width: 844, height: 390}];
const poses = [
  {name: 'arrival-pose', state: 'entry', phase: 1, stateTime: 1.8, hp: 36, frame: 0},
  {name: 'idle-open', state: 'idle', phase: 1, stateTime: .8, hp: 36, frame: 1},
  {name: 'attack-windup', state: 'charge', phase: 1, stateTime: .8, hp: 36, frame: 2},
  {name: 'first-volley', state: 'fire', phase: 1, stateTime: .1, hp: 36, frame: 3},
  {name: 'impact-hurt', state: 'hurt', phase: 1, stateTime: .08, hp: 30, frame: 4},
  {name: 'phase-two-warning', state: 'charge', phase: 2, stateTime: .8, hp: 18, frame: 5},
  {name: 'phase-two-volley', state: 'fire', phase: 2, stateTime: .1, hp: 15, frame: 6},
  {name: 'restored-disabled', state: 'disabled', phase: 2, stateTime: 1, hp: 0, frame: 7}
];
const began = Date.now();
const report = {status: 'running', exitCode: null, startedAt: new Date().toISOString(), command: process.argv,
  kind: 'CONTROLLED_VISUAL_FIXTURES_NOT_NATURAL_PLAYTHROUGH', sourceRoot: root,
  qaScriptSha256: sha256(require('node:fs').readFileSync(__filename)),
  profiles: profiles.map(profile => ({...profile, dpr: 1})), sceneDefinitions: poses,
  expectedScreenshots: 10, cases: [], limits: [
    'Each screenshot uses the real legacy renderer and real loaded artwork in Chromium.',
    'Scene preparation forces the CRONIUM quota, boss pose, health and time, and positions the boss at its existing arena target.',
    'The arrival pose is positioned at the arena target for inspection; it does not document the natural offscreen entry trajectory.',
    'The fixture then sets state=paused and removes the pause overlay, preserving one existing RAF and freezing combat.',
    'Volley fixtures emit real model projectiles during preparation; an illustrated player pulse is placed halfway through its flight.',
    'No player Y, canvas dimensions, CSS, collision geometry or shipping file is changed by the fixture.',
    'These scenes do not prove natural reachability, combat balance, progression, aesthetic acceptance or physical iPhone compatibility.',
    'Service workers are blocked; offline/cache lifecycle is not tested.']};
try {
  report.git = {sha: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    status: execFileSync('git', ['status', '--short'], {encoding: 'utf8'}).trim()};
} catch (error) { report.git = {error: error.message}; }
let browser, server, evidenceReady = false;
const save = () => saveEvidence(output, report);

function clean(result, q) {
  assert.deepEqual(result.errors, [], 'Uncaught JavaScript exception');
  assert.deepEqual(result.consoleErrors, [], 'Console error');
  assert.deepEqual(result.failedRequests, [], 'HTTP or asset load error');
  assert.deepEqual(q.raf.errors, [], 'RAF callback exception');
  assert.equal(q.legacyRunning, true, 'Legacy loop stopped');
  assert.ok(q.raf.maximum <= 1, 'More than one RAF callback was pending');
  assert.equal(q.state, 'paused', 'Controlled scene must stay frozen');
  assert.equal(q.assetsReady, true, 'Required illustrated sprites were not loaded');
  assert.equal(q.unlocked, 2, 'The controlled pose must not award progression');
}

async function inspect(page) {
  return page.evaluate(() => ({...window.__ATLAS_VISUAL_QA__.inspect(), raf: {
    maximum: window.__ATLAS_VISUAL_RAF__.maximum,
    pending: window.__ATLAS_VISUAL_RAF__.pending.size,
    frames: window.__ATLAS_VISUAL_RAF__.frames,
    errors: [...window.__ATLAS_VISUAL_RAF__.errors]
  }}));
}

async function layout(page) {
  return page.evaluate(() => {
    const q = window.__ATLAS_VISUAL_QA__.inspect();
    const issues = [], rect = node => {
      const r = node.getBoundingClientRect();
      return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height};
    };
    const canvas = rect(document.querySelector('#canvas'));
    const project = bounds => ({left: canvas.left + bounds.left * canvas.width / q.W,
      right: canvas.left + bounds.right * canvas.width / q.W,
      top: canvas.top + bounds.top * canvas.height / q.H,
      bottom: canvas.top + bounds.bottom * canvas.height / q.H});
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const inViewport = r => r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1;
    const controls = {};
    for (const selector of ['#hud', '#atlasEncounter', '#atlasAutoFire', '#pause', '#fire']) {
      const node = document.querySelector(selector);
      if (!node) { issues.push(`Missing ${selector}`); continue; }
      const r = controls[selector] = rect(node);
      if (!r.width || !r.height || !inViewport(r)) issues.push(`Outside viewport: ${selector}`);
      if (['#atlasAutoFire', '#pause', '#fire'].includes(selector)) {
        const at = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
        if (!at || !node.contains(at)) issues.push(`Occluded control: ${selector}`);
      }
    }
    const auto = controls['#atlasAutoFire'];
    const minimumAutoHeight = innerHeight < 500 ? 35 : 44;
    if (auto && (auto.width < 94 || auto.height < minimumAutoHeight)) issues.push('Automatic-fire control is smaller than its defined touch target');
    const boss = project(q.bossBounds), ship = project(q.shipBounds);
    const headerBottom = Math.max(controls['#hud']?.bottom || 0, controls['#atlasEncounter']?.bottom || 0);
    if (boss.top < headerBottom - 1) issues.push('Guardian artwork overlaps the actual HUD bottom');
    if (boss.bottom > ship.top + 1) issues.push('Guardian artwork overlaps the ship flight area');
    if (!inViewport(boss)) issues.push('Guardian artwork is clipped by viewport');
    if (boss.left < canvas.left - 1 || boss.right > canvas.right + 1) issues.push('Guardian artwork is clipped by canvas sides');
    for (const selector of ['#atlasEncounter', '#atlasAutoFire', '#pause', '#fire']) {
      if (controls[selector] && overlaps(ship, controls[selector])) issues.push(`Ship overlaps ${selector}`);
    }
    for (const selector of ['#atlasPhase', '#atlasStatus', '#atlasAutoFire']) {
      const node = document.querySelector(selector), r = rect(node);
      if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) issues.push(`Text is clipped: ${selector}`);
      if (!inViewport(r)) issues.push(`Text outside viewport: ${selector}`);
    }
    const hudText = [];
    for (const node of document.querySelectorAll('#hud > div small, #hud > div b')) {
      const style = getComputedStyle(node), bounds = rect(node);
      const range = document.createRange(); range.selectNodeContents(node);
      const text = rect(range), inline = style.display === 'inline';
      const parent = node.parentElement, parentBounds = rect(parent), parentStyle = getComputedStyle(parent);
      const available = inline ? {
        left: parentBounds.left + parseFloat(parentStyle.paddingLeft || 0),
        right: parentBounds.right - parseFloat(parentStyle.paddingRight || 0)
      } : bounds;
      const clipped = (!inline && node.scrollWidth > node.clientWidth + 1) ||
        text.left < available.left - 1 || text.right > available.right + 1;
      hudText.push({value: node.textContent, element: node.id || node.tagName.toLowerCase(),
        bounds, text, available, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, clipped});
      if (clipped) issues.push(`HUD text is clipped: ${node.textContent}`);
    }
    return {issues, canvas, logical: {width: q.W, height: q.H}, boss, ship, headerBottom,
      controls, hudText, minimumAutoHeight, minimumAutoHeightReason: 'Existing responsive CSS contract; 44px portrait, 35px compact landscape'};
  });
}

async function runProfile(profile) {
  const id = `${profile.width}x${profile.height}`, result = {id, status: 'running', profile: {...profile, dpr: 1},
    errors: [], consoleErrors: [], failedRequests: [], scenes: [], screenshots: []};
  report.cases.push(result); await save();
  const context = await browser.newContext({viewport: profile, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => result.errors.push(errorText(error)));
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => result.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => { if (response.status() >= 400) result.failedRequests.push({url: response.url(), status: response.status()}); });
  try {
    await page.addInitScript(() => {
      for (const prefix of ['', 'neon-preview-v1:']) localStorage.setItem(prefix + 'neon-unlocked-v2', '2');
      const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      const audit = window.__ATLAS_VISUAL_RAF__ = {pending: new Set(), maximum: 0, frames: 0, errors: []};
      window.requestAnimationFrame = callback => {
        const frame = request(now => {
          audit.pending.delete(frame); audit.frames++;
          try { callback(now); } catch (error) { audit.errors.push(error.stack || String(error)); throw error; }
        });
        audit.pending.add(frame); audit.maximum = Math.max(audit.maximum, audit.pending.size); return frame;
      };
      window.cancelAnimationFrame = frame => { audit.pending.delete(frame); cancel(frame); };
    });
    await page.route(/\/game\.js(?:\?.*)?$/, async route => {
      const response = await route.fetch(), body = await response.body(), source = body.toString('utf8');
      result.gameBundle = {bytes: body.length, sha256: sha256(body)};
      const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
      assert.equal(source.split(marker).length, 2, 'Legacy bootstrap marker changed');
      const hook = `window.__ATLAS_VISUAL_QA__ = {
        prepare(pose) {
          // Explicit, local-only scene setup. This is not a natural completion.
          startLevel(1); warpTimer=0; collected=level().goal; completeLevel();
          atlasAutoFire=false; player.x=player.target=W/2;
          atlasBoss.y=atlasBoss.targetY; atlasBoss.x=W/2; atlasBoss.age=8;
          Object.assign(atlasBoss,{phase:pose.phase,state:pose.state,stateTime:pose.stateTime,
            hp:pose.hp,disabled:pose.state==='disabled',resolved:false,
            vulnerability:['idle','fire','hurt'].includes(pose.state),flash:pose.state==='hurt'?.14:0});
          const timing=pose.phase===1?NeonCampaign.GUARDIAN_ATLAS_RULES.phaseOne:NeonCampaign.GUARDIAN_ATLAS_RULES.phaseTwo;
          const gap=pose.phase===2?{left:W/2-125,right:W/2+125,center:W/2}:null;
          if(pose.state==='charge'||pose.state==='fire') atlasBoss.telegraph={
            kind:pose.phase===1?'aimedSalvo':'openCorridor',progress:pose.stateTime/timing.chargeSeconds,
            targetX:player.x,targetY:player.y,originX:atlasBoss.x,originY:atlasBoss.y+atlasBoss.r*.7,
            seconds:timing.chargeSeconds,safeGap:gap,attackId:1};
          else atlasBoss.telegraph=null;
          if(pose.state==='fire') {
            atlasBoss.state='charge';atlasBoss.stateTime=timing.chargeSeconds-.008;
            NeonCampaign.advanceGuardianAtlas(atlasBoss,.016,player,consumeAtlasEvent);
            atlasBoss.stateTime=pose.stateTime;
            fireAtlasPulse('pulse');
            const pulse=shots.find(shot=>shot.atlasPulse);if(pulse)pulse.life=pulse.duration/2;
          }
          if(pose.state==='hurt') impactEffects.push({x:atlasBoss.x,y:atlasBoss.y,angle:0,scale:1,life:.18,duration:.24,atlasImpact:true});
          state='paused';overlay(null);syncAtlasHud();updateAmmoHud();render(performance.now());
          return this.inspect();
        },
        inspect() {
          const animation=atlasBoss?NeonCampaign.guardianAtlasAnimation(atlasBoss):null;
          const frames=animation?[animation.frame,...(animation.previousFrame===null?[]:[animation.previousFrame])]:[];
          const size=atlasBoss?.visualSize||350;
          const bounds=frames.map(frame=>{const pivot=ATLAS_FRAME_PIVOTS[frame];return {
            left:atlasBoss.x-size*pivot[0]/443.5,right:atlasBoss.x+size*(1-pivot[0]/443.5),
            top:atlasBoss.y-size*pivot[1]/443.5,bottom:atlasBoss.y+size*(1-pivot[1]/443.5)};});
          return {state,W,H,collected,goal:level().goal,unlocked:getUnlocked(),atlasAutoFire,legacyRunning,
            shipRenderMode,player:{x:player.x,y:player.y},
            shipBounds:{left:player.x-110,right:player.x+110,top:player.y-150,bottom:player.y+110},
            boss:atlasBoss?JSON.parse(JSON.stringify(atlasBoss)):null,animation,
            bossBounds:bounds.length?{left:Math.min(...bounds.map(b=>b.left)),right:Math.max(...bounds.map(b=>b.right)),
              top:Math.min(...bounds.map(b=>b.top)),bottom:Math.max(...bounds.map(b=>b.bottom))}:null,
            assetsReady:spriteReady(SPRITES.guardianAtlas)&&spriteReady(SPRITES.atlasVfx)&&spriteReady(SPRITES.modularShip)&&spriteReady(SPRITES.atlasBackground),
            projectiles:items.filter(item=>item.guardianProjectile).map(item=>({x:item.x,y:item.y,rot:item.rot,attackId:item.attackId,volley:item.volley})),
            illustratedPulses:shots.filter(shot=>shot.atlasPulse).length};
        }
      };\n`;
      await route.fulfill({response, body: source.replace(marker, hook + marker)});
    });
    const nested = await fs.access(path.join(root, 'juego', 'index.html')).then(() => 'juego/').catch(() => '');
    await page.goto(`${server.url}${nested}index.html`, {waitUntil: 'load'});
    await page.waitForFunction(() => Boolean(window.__ATLAS_VISUAL_QA__), null, {polling: 100});
    const selected = profile.width === 390 && profile.height === 844 ? poses : poses.filter(pose => pose.name === 'phase-two-volley');
    for (const pose of selected) {
      const scene = {name: pose.name, type: 'CONTROLLED_RENDERER_FIXTURE', status: 'running', preparation: pose};
      result.scenes.push(scene); await save(); console.log(`[Atlas controlled ${id}] ${pose.name}`);
      await page.evaluate(pose => window.__ATLAS_VISUAL_QA__.prepare(pose), pose);
      await page.waitForFunction(() => window.__ATLAS_VISUAL_QA__.inspect().assetsReady, null, {polling: 100});
      // Repeat the same documented preparation once assets are decoded. Combat
      // remains frozen throughout, and no second RAF/timer is introduced.
      await page.evaluate(pose => window.__ATLAS_VISUAL_QA__.prepare(pose), pose);
      scene.snapshot = await inspect(page); clean(result, scene.snapshot);
      assert.equal(scene.snapshot.animation.frame, pose.frame, 'The requested authored pose was not selected');
      scene.layout = await layout(page);
      const file = `${id}-${pose.name}-CONTROLLED.png`;
      await page.screenshot({path: path.join(output, file)});
      const bytes = await fs.readFile(path.join(output, file));
      const screenshot = {file, sha256: sha256(bytes), bytes: bytes.length,
        type: 'Real Chromium legacy-renderer image of an explicitly forced scene', pose: pose.name};
      result.screenshots.push(screenshot); scene.screenshot = screenshot; await save();
      assert.deepEqual(scene.layout.issues, [], `Controlled ${id} ${pose.name}: visual layout problem`);
      const before = scene.snapshot;
      await page.waitForTimeout(120);
      const after = await inspect(page); clean(result, after);
      assert.equal(after.boss.stateTime, before.boss.stateTime, 'Prepared pose advanced while frozen');
      assert.equal(after.boss.age, before.boss.age, 'Prepared encounter advanced while frozen');
      assert.deepEqual(after.projectiles, before.projectiles, 'Prepared projectiles advanced while frozen');
      scene.status = 'passed'; await save();
    }
    const before = await inspect(page);
    await page.locator('#atlasAutoFire').click();
    const after = await inspect(page);
    assert.equal(after.atlasAutoFire, !before.atlasAutoFire, 'The real automatic-fire control is not clickable');
    assert.equal(await page.locator('#atlasAutoFire').getAttribute('aria-pressed'), String(after.atlasAutoFire));
    clean(result, after); result.automaticFireControlClickable = true; result.status = 'passed';
  } catch (error) {
    result.status = 'failed'; result.error = errorText(error);
    const activeScene = result.scenes.at(-1);
    if (activeScene?.status === 'running') { activeScene.status = 'failed'; activeScene.error = errorText(error); }
    result.failureSnapshot = await inspect(page).catch(error => ({inspectionError: errorText(error)}));
    await page.screenshot({path: path.join(output, `${id}-failure-CONTROLLED.png`)}).catch(() => {});
    throw error;
  } finally { await context.close(); await save(); }
}

(async () => {
  await prepareEvidence(output); evidenceReady = true;
  report.buildInfo = await fs.readFile(path.join(root, 'build-info.json'), 'utf8').then(JSON.parse).catch(() => null);
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  for (const profile of profiles) await runProfile(profile);
  const screenshots = report.cases.reduce((count, entry) => count + entry.screenshots.length, 0);
  assert.equal(screenshots, report.expectedScreenshots, 'Not all controlled pose captures were produced');
  report.status = 'passed'; report.exitCode = 0;
})().catch(error => {
  report.status = 'failed'; report.exitCode = 1; report.error = errorText(error); process.exitCode = 1;
}).finally(async () => {
  await browser?.close(); await server?.close(); report.durationMs = Date.now() - began;
  report.finishedAt = new Date().toISOString();
  if (server) report.httpRequests = server.requests;
  if (evidenceReady) await save();
  console.log(JSON.stringify({status: report.status, exitCode: report.exitCode, output,
    cases: report.cases.map(entry => ({id: entry.id, status: entry.status})), error: report.error}));
});
