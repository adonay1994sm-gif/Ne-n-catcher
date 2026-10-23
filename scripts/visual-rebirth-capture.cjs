// Capture authentic classic-game frames for the ten-level art review.
// The shockwave contact sheet uses a controlled render of the real game Canvas.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options: {root: {type:'string'}, output: {type:'string'}, levels: {type:'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || 'docs/visual-rebirth/evidence/gallery-01');
const levels = (values.levels || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
assert.ok(levels.length && levels.every(level => Number.isInteger(level) && level >= 1 && level <= 10));
(async () => {
await fs.mkdir(output, {recursive:true});
try { await fs.access(path.join(output, 'results.json')); throw new Error('Use a new evidence directory'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const info = JSON.parse(await fs.readFile(path.join(root, 'build-info.json'), 'utf8'));
const report = {capturedAt:new Date().toISOString(), sourceCommit:info.commit, dirty:info.dirty,
  root, viewport:'390x844 @ DPR 2', kind:'Chromium rendering of the real preview game', cases:[]};
const server = await startStaticServer(root);
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  for (const level of levels) {
    const item = {level, status:'running', errors:[], failedRequests:[], screenshots:[]};
    report.cases.push(item);
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,
      isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page = await context.newPage();
    page.on('pageerror', error => item.errors.push(error.message));
    page.on('response', response => {if(response.status() >= 400) item.failedRequests.push(response.status()+' '+new URL(response.url()).pathname);});
    try {
      await page.addInitScript(() => localStorage.setItem('neon-preview-v1:neon-unlocked-v2','10'));
      await page.route(/\/game\.js(?:\?.*)?$/, async route => {
        const response = await route.fetch();
        const original = await response.text();
        const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
        assert.equal(original.split(marker).length,2,'Legacy bootstrap marker changed');
        const hook = `window.__VISUAL_REBIRTH_QA__ = {
          status: () => ({state,currentLevel,warpTimer}),
          atlas: () => ({loaded:SPRITES.chronosShockwave.complete,
            width:SPRITES.chronosShockwave.naturalWidth,height:SPRITES.chronosShockwave.naturalHeight}),
          freezeShockwave: progress => {
            stopLegacyLoop(); levelOneShockwave=(1-progress)*0.62;
            shake=0; cameraKickX=0; cameraKickY=0;
            render(performance.now());
            return {progress, frame:Math.min(3,Math.floor(progress*4)), level:currentLevel+1};
          }
        };\n`;
        await route.fulfill({response,body:original.replace(marker,hook+marker)});
      });
      await page.goto(server.url,{waitUntil:'load'});
      await page.locator('a.card:not(#n7link)').click();
      await page.waitForFunction(() => Boolean(window.__VISUAL_REBIRTH_QA__));
      await page.locator('#levels').click();
      await page.locator('#levelGrid button').nth(level-1).click();
      await page.locator('#launch').click();
      await page.waitForFunction(index => {
        const value=window.__VISUAL_REBIRTH_QA__.status();
        return value.state==='playing' && value.currentLevel===index && value.warpTimer===0;
      },level-1,{timeout:30000});
      await page.locator('#fire').waitFor({state:'visible'});
      await page.waitForFunction(() => document.querySelector('#fire b')?.textContent === 'DISPARAR' &&
        document.querySelector('#ammo')?.textContent?.trim() === '3/3');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(level===10 ? 900 : 120);
      item.fireControl=await page.locator('#fire').evaluate(element => ({
        label:element.querySelector('b')?.textContent,
        ammo:element.querySelector('small')?.textContent,
        buttonWidth:Math.round(element.getBoundingClientRect().width),
        labelWidth:Math.round(element.querySelector('b').getBoundingClientRect().width)
      }));
      if (level===1) await page.waitForFunction(() => window.__VISUAL_REBIRTH_QA__.atlas().width>0);
      let file=`level-${String(level).padStart(2,'0')}-game.png`;
      await page.screenshot({path:path.join(output,file)});
      item.screenshots.push(file);
      if (level===1) {
        item.atlas=await page.evaluate(() => window.__VISUAL_REBIRTH_QA__.atlas());
        for (const progress of [0.125,0.375,0.625,0.875]) {
          const phase=await page.evaluate(value=>window.__VISUAL_REBIRTH_QA__.freezeShockwave(value),progress);
          file=`level-01-shockwave-frame-${phase.frame}.png`;
          await page.screenshot({path:path.join(output,file)});
          item.screenshots.push(file);
        }
      }
      assert.deepEqual(item.errors,[]); assert.deepEqual(item.failedRequests,[]);
      item.status='passed';
      console.log(`level ${level}: passed (${item.screenshots.length} screenshots)`);
    } catch(error) {
      item.status='failed'; item.error=error.stack || String(error);
      console.error(`level ${level}: ${item.error}`);
    } finally { await context.close(); await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n'); }
  }
} finally { await browser.close(); await server.close(); }
report.status=report.cases.every(item=>item.status==='passed')?'passed':'failed';
await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
process.exitCode=report.status==='passed'?0:1;
})().catch(error => { console.error(error.stack || error); process.exitCode=1; });
