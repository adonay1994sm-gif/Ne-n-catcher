// Real Chromium, original campaign. No entity insertion or simulation mutation.
// node scripts/modular-ship-browser-smoke.cjs --root preview-dist --output /tmp/modular-ships-01
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const root=path.resolve(values.root || 'preview-dist');
const output=path.resolve(values.output || 'docs/production-reports/evidence/modular-ships/browser-01');
const outlineHash='997fed2f9a050e08eca8c68d0b43486bc2f67a3243519e4f425bfb928ebb4841';
const profiles=[{width:390,height:844},{width:320,height:568},{width:844,height:390}];
const mixed={hull:'bastion',wings:'aster',engines:'bastion'};
const sentinels={
  'neon-best-v1':'1200','neon-best-v2':'4829','neon-unlocked-v2':'1','neon-stars-v2':'{}',
  'neon-n7-best-v1':'7341','neon-n7-unlocked-v1':'37',
  'neon-preview-v1:neon-best-v2':'2489','neon-preview-v1:neon-unlocked-v2':'1',
  'neon-preview-v1:neon-stars-v2':'{}','neon-preview-v1:neon-n7-best-v1':'1437',
  'neon-preview-v1:neon-n7-unlocked-v1':'37'
};
const began=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,
  sourceRoot:root,profiles:profiles.map(profile=>({...profile,dpr:1})),cases:[],
  limits:['Read-only game hook; configuration changes occur only through real UI controls.',
    'No clock acceleration, inserted enemies, forced damage or progression writes.',
    'Real Chromium touch-emulated viewports, not Safari or physical iPhone certification.',
    'Service workers blocked for fresh resources; offline lifecycle is not certified.',
    'Screenshots show running artwork; visual coherence still requires human review.',
    'Short original-campaign sessions are not complete-level balance or sustained performance tests.']};
let server,browser,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=page=>page.evaluate(()=>({...window.__MODULAR_SHIP_QA__(),raf:{
  maximum:window.__MODULAR_SHIP_RAF_QA__.maximum,pending:window.__MODULAR_SHIP_RAF_QA__.pending.size,
  frames:window.__MODULAR_SHIP_RAF_QA__.frames,errors:[...window.__MODULAR_SHIP_RAF_QA__.errors]
}}));
const wait=(page,fn,arg)=>page.waitForFunction(fn,arg,{polling:100,timeout:15000});

const shipControlLayout=page=>page.evaluate(()=>{
  const {player}=window.__MODULAR_SHIP_QA__(),canvas=document.querySelector('#canvas').getBoundingClientRect();
  const ship={left:canvas.left+(player.x-110)*canvas.width/player.logicalWidth,
    right:canvas.left+(player.x+110)*canvas.width/player.logicalWidth,
    top:canvas.top+(player.y-150)*canvas.height/player.logicalHeight,
    bottom:canvas.top+(player.y+110)*canvas.height/player.logicalHeight};
  const controls={},intersections=[];
  for(const selector of ['#fire','#storyTransmission.show']){
    const element=document.querySelector(selector);if(!element)continue;
    const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)continue;
    controls[selector]={left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};
    if(ship.left<rect.right&&ship.right>rect.left&&ship.top<rect.bottom&&ship.bottom>rect.top)intersections.push(selector);
  }
  return {ship,controls,intersections};
});

function clean(result,q){
  assert.deepEqual(result.errors,[],'Uncaught JavaScript exception');
  assert.deepEqual(result.consoleErrors,[],'Console error');
  assert.deepEqual(result.failedRequests,[],'Missing resource or failed HTTP request');
  assert.deepEqual(q.raf.errors,[],'RAF callback exception');
  assert.ok(q.legacyRunning,'Legacy game loop stopped');
  assert.ok(q.raf.maximum<=1,'Multiple RAF callbacks pending');
  assert.equal(sha256(JSON.stringify(q.collisionOutline)),outlineHash,'Original collision polygon changed');
  assert.equal(q.assetsReady,true,'Modular atlas did not load');
}

async function runProfile(profile){
  const id=`${profile.width}x${profile.height}`;
  const result={id,profile:{...profile,dpr:1},status:'running',startedAt:new Date().toISOString(),
    checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};
  report.cases.push(result);await save();const caseBegan=Date.now();
  const context=await browser.newContext({viewport:profile,deviceScaleFactor:1,
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>result.errors.push(errorText(error)));
  page.on('console',message=>{if(message.type()==='error')result.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>result.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)result.failedRequests.push({url:response.url(),status:response.status()});});
  async function check(name,action){
    const start=Date.now(),entry={name,status:'running'};result.checks.push(entry);await save();
    console.log(`[modular ${id}] ${name}`);
    try{await action();entry.snapshot=await inspect(page);clean(result,entry.snapshot);entry.status='passed';}
    catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
    finally{entry.durationMs=Date.now()-start;await save();}
  }
  async function capture(name,selector){
    const file=`${id}-${name}.png`;
    if(selector)await page.locator(selector).screenshot({path:path.join(output,file)});
    else await page.screenshot({path:path.join(output,file)});
    result.screenshots.push({file,type:selector?'real rendered element':'real game viewport'});await save();
  }
  async function setMixed(){
    await page.locator('[data-ship-preset="bastion"]').click();
    await page.locator('#shipWings').selectOption('aster');
  }
  try{
    await page.addInitScript(sentinels=>{
      if(!sessionStorage.getItem('modular-qa-seeded')){
        for(const [key,value]of Object.entries(sentinels))localStorage.setItem(key,value);
        sessionStorage.setItem('modular-qa-seeded','1');
      }
      const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
      const audit=window.__MODULAR_SHIP_RAF_QA__={pending:new Set(),maximum:0,frames:0,errors:[]};
      window.requestAnimationFrame=callback=>{
        const frame=request(now=>{
          audit.pending.delete(frame);audit.frames++;
          try{callback(now);}catch(error){audit.errors.push(error.stack || String(error));throw error;}
        });
        audit.pending.add(frame);audit.maximum=Math.max(audit.maximum,audit.pending.size);return frame;
      };
      window.cancelAnimationFrame=frame=>{audit.pending.delete(frame);cancel(frame);};
    },sentinels);
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
      const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
      result.gameBundle={bytes:body.length,sha256:sha256(body)};
      const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
      assert.equal(source.split(marker).length,2,'Legacy bootstrap marker changed');
      const hook=`window.__MODULAR_SHIP_QA__=()=>({state,elapsed,
        player:{...player,logicalWidth:W,logicalHeight:H},loadout:{...shipLoadout},mode:shipRenderMode,
        collisionOutline:SHIP_COLLISION_OUTLINE.map(point=>[...point]),legacyRunning,
        assetsReady:spriteReady(SPRITES.modularShip)});\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});
    });
    const nested=await fs.access(path.join(root,'juego','index.html')).then(()=> 'juego/').catch(()=> '');
    await check('open original campaign and inspect authored fleet atlas',async()=>{
      await page.goto(`${server.url}${nested}index.html`,{waitUntil:'load'});
      await wait(page,()=>typeof window.__MODULAR_SHIP_QA__==='function'&&__MODULAR_SHIP_QA__().assetsReady);
      assert.equal((await inspect(page)).state,'menu');
      assert.equal(await page.locator('#journeyRoute').count(),0,'This must test the original game, not the short journey demo');
      await page.locator('#openHangar').click();
      await page.locator('#shipHangar.show').waitFor({state:'visible'});
    });
    await check('preview Aster, Bastion and a genuine mixed assembly using only hangar controls',async()=>{
      const before=await inspect(page);
      for(const preset of ['aster','bastion']){
        await page.locator(`[data-ship-preset="${preset}"]`).click();await page.waitForTimeout(150);
        for(const slot of ['Hull','Wings','Engines'])assert.equal(await page.locator(`#ship${slot}`).inputValue(),preset);
        assert.equal(await page.locator(`[data-ship-preset="${preset}"]`).getAttribute('aria-pressed'),'true');
        await capture(`${preset}-ship`,'#shipHangarCanvas');await capture(`${preset}-hangar`);
      }
      await setMixed();await page.waitForTimeout(150);
      assert.equal(await page.locator('#shipHull').inputValue(),'bastion');
      assert.equal(await page.locator('#shipWings').inputValue(),'aster');
      assert.equal(await page.locator('#shipEngines').inputValue(),'bastion');
      assert.match(await page.locator('#shipHangarName').textContent(),/combinada/i);
      await capture('mixed-ship','#shipHangarCanvas');await capture('mixed-hangar');
      assert.deepEqual((await inspect(page)).loadout,before.loadout,'Draft changed the live selection before Apply');
    });
    await check('Apply saves the isolated loadout, reload restores it and Cancel preserves it',async()=>{
      await page.locator('#shipApply').click();
      assert.deepEqual((await inspect(page)).loadout,mixed);assert.equal((await inspect(page)).mode,'modular');
      const saved=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
      const keys=Object.keys(saved).filter(key=>key.endsWith('neonCatcher.shipFleet.v1'));
      assert.equal(keys.length,1,'Fleet configuration has no unique save key');
      if(nested)assert.equal(keys[0],'neon-preview-v1:neonCatcher.shipFleet.v1');
      result.fleetSave={key:keys[0],value:JSON.parse(saved[keys[0]])};
      assert.deepEqual(result.fleetSave.value,{version:1,mode:'modular',loadout:mixed});
      await page.reload({waitUntil:'load'});
      await wait(page,()=>typeof window.__MODULAR_SHIP_QA__==='function'&&__MODULAR_SHIP_QA__().assetsReady);
      assert.deepEqual((await inspect(page)).loadout,mixed);
      await page.locator('#openHangar').click();await page.locator('[data-ship-preset="aster"]').click();
      await page.locator('#shipHangarBack').click();assert.deepEqual((await inspect(page)).loadout,mixed);
    });
    await check('original ship stays recoverable and mixed configuration can be restored',async()=>{
      await page.locator('#openHangar').click();await page.locator('#shipLegacy').click();
      assert.equal(await page.locator('#shipHull').isDisabled(),true);
      await page.locator('#shipApply').click();assert.equal((await inspect(page)).mode,'legacy');
      await page.locator('#openHangar').click();await setMixed();await page.locator('#shipApply').click();
      assert.equal((await inspect(page)).mode,'modular');assert.deepEqual((await inspect(page)).loadout,mixed);
    });
    await check('original level launches, steers naturally and retains the selected assembly',async()=>{
      await page.locator('#play').click();await page.locator('#launch').click();
      await wait(page,()=>__MODULAR_SHIP_QA__().state==='playing'&&__MODULAR_SHIP_QA__().elapsed>.2);
      const before=await inspect(page),box=await page.locator('#canvas').boundingBox();
      await page.mouse.move(box.x+box.width*.5,box.y+box.height*.62);await page.mouse.down();
      await page.mouse.move(box.x+box.width*.7,box.y+box.height*.62,{steps:5});await page.mouse.up();
      await wait(page,x=>__MODULAR_SHIP_QA__().player.x>x+25,before.player.x);
      await page.keyboard.press('ArrowLeft');
      await wait(page,time=>__MODULAR_SHIP_QA__().elapsed>time+3,before.elapsed);
      const after=await inspect(page);assert.equal(after.state,'playing');assert.deepEqual(after.loadout,mixed);
      result.naturalFlight={duration:after.elapsed-before.elapsed,beforePlayer:before.player,afterPlayer:after.player};
      result.flightLayout=await shipControlLayout(page);
      assert.deepEqual(result.flightLayout.intersections,[],'Ship drawing bounds overlap fire control or a visible transmission');
      await capture('original-level-flight');
    });
    await check('pause freezes time, Resume advances it, Restart resets the level and Quit reaches menu',async()=>{
      await page.locator('#pause').click();const paused=await inspect(page);
      await page.waitForTimeout(650);const after=await inspect(page);
      assert.equal(after.state,'paused');assert.equal(after.elapsed,paused.elapsed);
      await page.locator('#resume').click();await wait(page,time=>__MODULAR_SHIP_QA__().elapsed>time+.15,paused.elapsed);
      await page.locator('#pause').click();await page.locator('#restart').click();
      const restarted=await inspect(page);assert.equal(restarted.state,'playing');assert.ok(restarted.elapsed<1);
      assert.deepEqual(restarted.loadout,mixed);
      await page.locator('#pause').click();await page.locator('#quit').click();
      assert.equal((await inspect(page)).state,'menu');
    });
    await check('old campaign save sentinels are unchanged and collision/RAF contracts survive',async()=>{
      const actual=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
      for(const [key,value]of Object.entries(sentinels))assert.equal(actual[key],value,`Campaign save changed: ${key}`);
      result.oldCampaignSentinelsPreserved=true;
    });
    result.status='passed';result.exitCode=0;
  }catch(error){
    result.status='failed';result.exitCode=1;result.error=errorText(error);
    result.failureSnapshot=await inspect(page).catch(()=>null);
    await capture('failure').catch(()=>{});throw error;
  }finally{result.durationMs=Date.now()-caseBegan;await context.close();await save();}
}

(async()=>{
  await prepareEvidence(output);evidenceReady=true;
  const build=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  report.buildInfo={commit:build.commit,dirty:build.dirty,revision:build.revision};
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const profile of profiles)await runProfile(profile);
  report.status='passed';report.exitCode=0;
})().catch(error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;})
  .finally(async()=>{
    report.durationMs=Date.now()-began;
    report.checksPassed=report.cases.reduce((sum,item)=>sum+item.checks.filter(check=>check.status==='passed').length,0);
    report.checksFailed=report.cases.reduce((sum,item)=>sum+item.checks.filter(check=>check.status==='failed').length,0);
    if(server)report.httpRequests=server.requests;
    if(browser)await browser.close();if(server)await server.close();
    if(evidenceReady)await save();
    console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,durationMs:report.durationMs,
      cases:report.cases.map(({id,status})=>({id,status})),checksPassed:report.checksPassed,
      checksFailed:report.checksFailed,error:report.error}));
  });
