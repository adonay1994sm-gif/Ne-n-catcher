// Natural, unaccelerated Chromium playthrough. The only game hook is read-only.
// node scripts/journey-browser-smoke.cjs --root preview-dist --output /tmp/journey-qa-01
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output || 'docs/production-reports/evidence/journey-p1/browser-01');
const began = Date.now(), deadline = began + 180000;
const sentinel = {'neon-best-v2':'4829','neon-unlocked-v2':'7','neon-n7-best-v1':'7341',
  'neon-preview-v1:neon-best-v2':'2489','neon-preview-v1:neon-n7-best-v1':'1437'};
const result = {startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,
  status:'running',exitCode:null,browser:'Chromium real, desktop 390x844 DPR 1, pointer input',
  checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[],samples:[],
  limits:['No simulation clock, entity, health, position or progress mutation; input is mouse/pointer and UI buttons.',
    'Read-only hook inserted into served game response; shipped bundle is unchanged.',
    'Service workers blocked for a fresh build; offline/cache lifecycle not certified.',
    'Chromium desktop playthrough is not physical Safari/iPhone or a sustained performance benchmark.']};
let server,browser,context,page,evidenceReady=false;
const inspect = () => page.evaluate(() => ({...window.__JOURNEY_QA__(),
  raf:{maximum:window.__JOURNEY_RAF_QA__.maximum,pending:window.__JOURNEY_RAF_QA__.pending.size,
    frames:window.__JOURNEY_RAF_QA__.frames,errors:window.__JOURNEY_RAF_QA__.errors}}));
async function check(name,operation){
  const start=Date.now();console.log(`[journey] ${name}`);
  try{await operation();result.checks.push({name,status:'passed',durationMs:Date.now()-start});}
  catch(error){result.checks.push({name,status:'failed',durationMs:Date.now()-start,error:errorText(error)});throw error;}
  finally{await saveEvidence(output,result);}
}
async function capture(name){
  const file=`${name}.png`;await page.screenshot({path:path.join(output,file)});
  result.screenshots.push({file,snapshot:await inspect()});await saveEvidence(output,result);
}
async function shipControlLayout(){
  const layout=await page.evaluate(()=>{
    const q=window.__JOURNEY_QA__(),canvas=document.querySelector('#canvas').getBoundingClientRect();
    const ship={left:canvas.left+(q.playerX-110)*canvas.width/q.W,
      right:canvas.left+(q.playerX+110)*canvas.width/q.W,
      top:canvas.top+(q.playerY-150)*canvas.height/q.H,
      bottom:canvas.top+(q.playerY+110)*canvas.height/q.H};
    const controls={},intersections=[];
    for(const selector of ['#fire','#journeySkills','#storyTransmission.show']){
      const element=document.querySelector(selector);if(!element)continue;
      const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)continue;
      controls[selector]={left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};
      if(ship.left<rect.right&&ship.right>rect.left&&ship.top<rect.bottom&&ship.bottom>rect.top)intersections.push(selector);
    }
    return {ship,controls,intersections};
  });
  assert.deepEqual(layout.intersections,[],'Conservative ship drawing bounds overlap a control or visible transmission');
  return layout;
}
async function dragTo(target){
  const q=await inspect(),box=await page.locator('#canvas').boundingBox();
  const delta=(Math.max(80,Math.min(q.W-80,target))-q.target)*box.width/q.W;
  if(Math.abs(delta)<1)return;
  const x=delta>0?box.x+12:box.x+box.width-12,y=box.y+box.height*.66;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+delta,y,{steps:3});await page.mouse.up();
}
function assertClean(q){
  assert.deepEqual(result.errors,[],'Uncaught JavaScript exception');
  assert.deepEqual(result.consoleErrors,[],'Console error');
  assert.deepEqual(result.failedRequests,[],'Missing resource or network failure');
  assert.deepEqual(q.raf.errors,[],'RAF callback exception');
  assert.ok(q.legacyRunning,'Legacy loop stopped');
  assert.ok(q.raf.maximum<=1,'More than one RAF callback was pending');
  assert.ok(!['destroying','gameover'].includes(q.state),`Natural player died: ${q.state}`);
}

(async()=>{
  await prepareEvidence(output);
  evidenceReady=true;
  result.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  // Avoid copying the complete build inventory into every evidence snapshot.
  result.buildInfo={commit:result.buildInfo.commit,revision:result.buildInfo.revision,dirty:result.buildInfo.dirty};
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:false,hasTouch:true,serviceWorkers:'block'});
  page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>result.errors.push(errorText(error)));
  page.on('console',message=>{if(message.type()==='error')result.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>result.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)result.failedRequests.push({url:response.url(),status:response.status()});});
  await page.addInitScript(sentinel=>{
    if(!sessionStorage.getItem('journey-natural-qa-seeded')){
      for(const [key,value] of Object.entries(sentinel))localStorage.setItem(key,value);
      sessionStorage.setItem('journey-natural-qa-seeded','1');
    }
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    const audit=window.__JOURNEY_RAF_QA__={pending:new Set(),maximum:0,frames:0,errors:[]};
    window.requestAnimationFrame=callback=>{
      const id=request(now=>{
        audit.pending.delete(id);audit.frames++;
        try{callback(now);}catch(error){audit.errors.push(error.stack || String(error));throw error;}
      });
      audit.pending.add(id);audit.maximum=Math.max(audit.maximum,audit.pending.size);return id;
    };
    window.cancelAnimationFrame=id=>{audit.pending.delete(id);cancel(id);};
  },sentinel);
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
    result.gameBundle={bytes:body.length,sha256:sha256(body)};
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2,'Expected one legacy bootstrap marker');
    const hook=`window.__JOURNEY_QA__=()=>({state,journey:journey?.snapshot()||null,
      playerX:player.x,playerY:player.y,target:player.target,W,H,hull,legacyRunning,
      powers:{...powers},items:items.map(item=>({type:item.type,x:item.x,y:item.y,
        journeyBorder:Boolean(item.journeyBorder),scout:Boolean(item.classicScout),
        telegraph:item.classicScout?.telegraph||0,fired:item.classicScout?.fired||0,hp:item.hp}))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  const gameDirectory=await fs.access(path.join(root,'juego','index.html')).then(()=> 'juego/').catch(()=> '');
  await check('open journey and start with the real Continue Journey button',async()=>{
    await page.goto(`${server.url}${gameDirectory}index.html?campaign=journey`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.__JOURNEY_QA__==='function',null,{polling:100});
    await page.locator('#play').click();
    await page.waitForFunction(()=>__JOURNEY_QA__().state==='playing'&&__JOURNEY_QA__().journey?.elapsed>.3,null,{polling:100});
    assert.equal((await inspect()).journey.segmentId,'departure');await capture('01-chronos-departure');
  });
  await check('relative pointerdown preserves target; dragging steers without teleportation',async()=>{
    const before=await inspect(),box=await page.locator('#canvas').boundingBox();
    await page.mouse.move(box.x+box.width*.87,box.y+box.height*.65);await page.mouse.down();
    const down=await inspect();assert.ok(Math.abs(down.target-before.target)<.01,'Pointerdown jumped the ship target');
    await page.mouse.move(box.x+box.width*.96,box.y+box.height*.65,{steps:3});await page.mouse.up();
    const moved=await inspect();assert.ok(moved.target>before.target+30,'Relative drag did not steer');
    await dragTo(before.W*.82);
  });
  await check('pause freezes the shared route clock and Resume continues it',async()=>{
    await page.locator('#pause').click();const before=await inspect();
    await page.waitForTimeout(650);const after=await inspect();
    assert.equal(after.state,'paused');assert.equal(after.journey.routeElapsed,before.journey.routeElapsed);
    await page.locator('#resume').click();
    await page.waitForFunction(time=>__JOURNEY_QA__().journey.routeElapsed>time,before.journey.routeElapsed,{polling:100});
  });
  let stationDone=false,propulsionCaptured=false,borderCaptured=false,partSeen=false,attackSeen=false,shieldUsed=false,tractorUsed=false;
  let lastSample=0;
  await check('natural departure, pickup, service, upgraded transit and border combat',async()=>{
    while(Date.now()<deadline){
      const q=await inspect();assertClean(q);
      if(Date.now()-lastSample>1500){result.samples.push({wallMs:Date.now()-began,...q});lastSample=Date.now();await saveEvidence(output,result);}
      attackSeen ||= q.items.some(item=>item.scout&&(item.telegraph>0||item.fired>0));
      if(q.journey.phase==='complete')break;
      if(q.journey.phase==='station'){
        assert.ok(q.journey.partCollected,'Station reached without recovered piece');
        await capture('02-relay-station');
        await page.locator('#journeyInstall').click();
        assert.equal((await inspect()).journey.partInstalled,true);
        await page.locator('#journeyContinue').click();stationDone=true;continue;
      }
      const part=q.items.find(item=>item.type==='journeyPart');
      if(part){
        partSeen=true;await dragTo(part.x);
        if(part.y>q.playerY-300&&!tractorUsed&&await page.locator('#journeyTractor').isEnabled()){
          await page.locator('#journeyTractor').click();tractorUsed=true;
        }
      }else{
        const scout=q.items.find(item=>item.scout);
        if(scout){
          if(scout.journeyBorder&&!borderCaptured){await capture('04-atlas-border');borderCaptured=true;}
          // Let the first encounter show its announced attack, then respond by piloting and firing.
          if(attackSeen||q.journey.segmentId!=='departure'){
            await dragTo(scout.x);
            if(!shieldUsed&&await page.locator('#journeyShield').isEnabled()){
              await page.locator('#journeyShield').click();shieldUsed=true;
            }
            if(scout.journeyBorder)await page.locator('#fire').click();
          }
        }
      }
      if(stationDone&&q.journey.segmentId==='transit'&&q.journey.elapsed>1&&!propulsionCaptured){
        assert.equal(q.journey.engineBoost,true);result.upgradedShipLayout=await shipControlLayout();
        await capture('03-upgraded-propulsion');propulsionCaptured=true;
      }
      await page.waitForTimeout(140);
    }
    const final=await inspect();assertClean(final);
    assert.equal(final.journey.phase,'complete','Natural journey did not complete before the 180 s wall deadline');
    assert.equal(final.journey.routeProgress,1);assert.equal(final.journey.partInstalled,true);
    assert.equal(final.journey.borderResolved,true);assert.equal(final.journey.credits,120);
    assert.ok(stationDone&&partSeen&&tractorUsed&&shieldUsed&&propulsionCaptured&&borderCaptured,'An essential step was skipped');
    assert.ok(attackSeen,'No telegraphed CH-01 attack was observed');
    result.naturalCompletion=final;await capture('05-gaia-arrival');
  });
  await check('arrival checkpoint survives reload and old campaign sentinel saves remain unchanged',async()=>{
    const before=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
    const journeyKeys=Object.keys(before).filter(key=>key.endsWith('neonCatcher.journeyDemo.v1'));
    assert.equal(journeyKeys.length,1,'Journey save was not written to an isolated key');
    const saved=JSON.parse(before[journeyKeys[0]]);assert.equal(saved.checkpointId,'gaia-arrival');assert.equal(saved.credits,120);
    await page.reload({waitUntil:'load'});await page.waitForFunction(()=>typeof window.__JOURNEY_QA__==='function',null,{polling:100});
    const after=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
    assert.equal(after[journeyKeys[0]],before[journeyKeys[0]],'Reload changed or duplicated the checkpoint reward');
    for(const [key,value]of Object.entries(sentinel))assert.equal(after[key],value,`Old campaign save changed: ${key}`);
    result.storageEvidence={journeyKey:journeyKeys[0],saved,oldSentinelsPreserved:true};
    await page.locator('#play').click();
    await page.waitForFunction(()=>__JOURNEY_QA__().journey?.elapsed>.2,null,{polling:100});
    assert.equal((await inspect()).journey.segmentId,'departure','Completed demo should offer an explicit fresh replay');
    assertClean(await inspect());
  });
  result.status='passed';result.exitCode=0;
})().catch(async error=>{
  result.status='failed';result.exitCode=1;result.error=errorText(error);process.exitCode=1;
  if(page){result.failureSnapshot=await inspect().catch(()=>null);await capture('failure').catch(()=>{});}
}).finally(async()=>{
  result.durationMs=Date.now()-began;
  if(server)result.httpRequests=server.requests;
  if(context)await context.close();if(browser)await browser.close();if(server)await server.close();
  if(evidenceReady)await saveEvidence(output,result);
  console.log(JSON.stringify({status:result.status,exitCode:result.exitCode,durationMs:result.durationMs,
    checks:result.checks.map(({name,status})=>({name,status})),error:result.error}));
});
