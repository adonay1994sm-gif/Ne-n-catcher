// Real Chromium/Canvas integration on Gaia classic. The injection only exposes
// the existing factory and state to QA; the distributed bundle stays unchanged.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || 'docs/immersive-rebirth/evidence/classic-scout-01');
const result = {startedAt:new Date().toISOString(), sourceRoot:root, status:'running',
  browser:'Chromium real, 390x844 DPR 2', checks:[], errors:[], failedRequests:[], screenshots:[],
  limits:['Controlled insertion of a real classic scout entity; natural balance and iPhone remain untested.']};

(async () => {
  await prepareEvidence(output);
  const server = await startStaticServer(root);
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,
      isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('response', response => {if(response.status() >= 400) result.failedRequests.push(`${response.status()} ${new URL(response.url()).pathname}`);});
    await page.addInitScript(() => localStorage.setItem('neon-preview-v1:neon-unlocked-v2','10'));
    await page.route(/\/game\.js(?:\?.*)?$/, async route => {
      const response = await route.fetch();
      const original = await response.text();
      const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
      assert.equal(original.split(marker).length,2,'Bootstrap hook changed');
      const hook = `window.__CLASSIC_SCOUT_QA__ = {
        spawn: () => {
          items=[]; spawnTimer=999;
          const scout=createThreat('scout',level());
          scout.x=scout.baseX=player.x;
          scout.classicScout.baseX=player.x;
          scout.classicScout.phase=0;
          scout.y=240;
          items.push(scout);
          return {level:currentLevel+1,type:scout.type,hp:scout.hp};
        },
        status: () => ({state,level:currentLevel+1,elapsed,classicScoutTimer,frame:items[0]?.classicScout?.animator.getFrame().state,
          age:items[0]?.classicScout?.age,telegraph:items[0]?.classicScout?.telegraph,
          fired:items[0]?.classicScout?.fired,projectiles:items.filter(item=>item.classicScoutProjectile).length,
          scouts:items.filter(item=>item.classicScout).length,
          atlasWidth:SPRITES.ch01.naturalWidth,hull,ammo,
          transmission:ui.storyTransmission?.classList.contains('show'),
          transmissionText:ui.storyText?.textContent}),
        expireTransmission: () => updateLevelStory(3.3),
        isolateTarget: () => {items=items.filter(item=>!item.classicScoutProjectile);}
      };\n`;
      await route.fulfill({response,body:original.replace(marker,hook+marker)});
    });
    await page.goto(server.url,{waitUntil:'load'});
    await page.locator('a.card:not(#n7link)').click();
    await page.waitForFunction(() => Boolean(window.__CLASSIC_SCOUT_QA__));
    await page.locator('#levels').click();
    await page.locator('#levelGrid button').nth(1).click();
    await page.locator('#launch').click();
    await page.waitForFunction(() => window.__CLASSIC_SCOUT_QA__.status().state==='playing');
    try {
      await page.waitForFunction(() => window.__CLASSIC_SCOUT_QA__.status().scouts>0,null,{timeout:30000});
    } catch (error) {
      result.diagnostic = await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.status());
      throw error;
    }
    result.checks.push('Gaia classic naturally schedules a CH-01 patrol');
    const warning = await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.status());
    assert.match(warning.transmissionText,/CH-01/);
    assert.equal(warning.transmission,true);
    await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.expireTransmission());
    assert.equal((await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.status())).transmission,false);
    result.checks.push('Atlas transmission appears once and expires');
    const spawned = await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.spawn());
    assert.deepEqual(spawned,{level:2,type:'scout',hp:2});
    await page.waitForFunction(() => window.__CLASSIC_SCOUT_QA__.status().atlasWidth===1024);
    result.checks.push('classic Gaia level 2 creates a real CH-01 with atlas loaded');
    await page.waitForFunction(() => window.__CLASSIC_SCOUT_QA__.status().frame==='attack',null,{timeout:9000});
    await page.screenshot({path:path.join(output,'gaia-scout-attack.png')});
    result.screenshots.push('gaia-scout-attack.png');
    await page.locator('#pause').click();
    const before = await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.status());
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.status());
    assert.equal(after.age,before.age,'pause froze the scout');
    result.checks.push('pause freezes CH-01 simulation');
    await page.locator('#resume').click();
    await page.waitForFunction(() => window.__CLASSIC_SCOUT_QA__.status().fired>=1,null,{timeout:9000});
    result.checks.push('resume advances a telegraphed CH-01 attack');
    await page.screenshot({path:path.join(output,'gaia-scout-fired.png')});
    result.screenshots.push('gaia-scout-fired.png');
    await page.evaluate(() => window.__CLASSIC_SCOUT_QA__.isolateTarget());
    await page.locator('#fire').click();
    await page.waitForFunction(() => window.__CLASSIC_SCOUT_QA__.status().frame==='hurt',null,{timeout:3000});
    result.checks.push('player shot triggers CH-01 hurt pose');
    await page.screenshot({path:path.join(output,'gaia-scout-hurt.png')});
    result.screenshots.push('gaia-scout-hurt.png');
    assert.deepEqual(result.errors,[]);
    assert.deepEqual(result.failedRequests,[]);
    result.checks.push('no page exceptions or missing assets');
    await context.close();
    result.status='passed'; result.exitCode=0;
  } finally {await browser.close(); await server.close();}
})().catch(error => {result.status='failed';result.exitCode=1;result.error=errorText(error);process.exitCode=1;})
  .finally(async () => {await saveEvidence(output,result);console.log(JSON.stringify({status:result.status,checks:result.checks,error:result.error}));});
