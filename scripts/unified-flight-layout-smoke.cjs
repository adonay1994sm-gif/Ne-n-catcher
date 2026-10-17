// Brief real-Chromium input/layout regression. Only a read-only state hook and
// RAF observer are added to the local HTTP response; gameplay is never mutated.
// node scripts/unified-flight-layout-smoke.cjs --root preview-dist --output <new-directory>
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const root=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||'docs/production-reports/evidence/unified-flight/browser-layout-01');
const started=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,
  browser:'Real Chromium, DPR 1, touch-emulated 390x844 / 320x568 / 844x390',profiles:[],
  limits:['Brief real input/layout regression; not a complete natural level playthrough or aesthetic acceptance.',
    'HTTP instrumentation only reads state; no entity, timer, health, equipment, progress or save mutation.',
    'Input uses Chrome DevTools touch events and actual UI controls.',
    'Service workers are blocked; offline cache lifecycle is not certified.',
    'Chromium touch emulation is not Safari, physical iPhone or a sustained performance benchmark.']};
let server,browser,page,profile,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__FLIGHT_LAYOUT_QA__(),raf:{
  maximum:window.__FLIGHT_LAYOUT_RAF__.maximum,pending:window.__FLIGHT_LAYOUT_RAF__.pending.size,
  frames:window.__FLIGHT_LAYOUT_RAF__.frames,errors:[...window.__FLIGHT_LAYOUT_RAF__.errors]}}));
const wait=(fn,arg,timeout=30000)=>page.waitForFunction(fn,arg,{polling:100,timeout});
function clean(q){
  assert.deepEqual(profile.errors,[],'Uncaught JavaScript error');
  assert.deepEqual(profile.consoleErrors,[],'Console error');
  assert.deepEqual(profile.failedRequests,[],'Missing asset or failed request');
  assert.deepEqual(q.raf.errors,[],'RAF callback threw');
  assert.ok(q.legacyRunning,'The legacy loop stopped');
  assert.ok(q.raf.maximum<=1,'More than one RAF owner was pending');
}
async function check(name,operation){
  const check={name,status:'running',startedAt:new Date().toISOString()};profile.checks.push(check);await save();
  console.log(`[flight layout ${profile.id}] ${name}`);const began=Date.now();
  try{await operation();if(await page.evaluate(()=>typeof window.__FLIGHT_LAYOUT_QA__==='function')){const q=await inspect();clean(q);check.snapshot=q;}check.status='passed';}
  catch(error){check.status='failed';check.error=errorText(error);throw error;}
  finally{check.durationMs=Date.now()-began;await save();}
}
async function capture(name){
  const file=profile.id+'-'+name+'.png';await page.waitForTimeout(250);await page.screenshot({path:path.join(output,file),timeout:30000});
  profile.screenshots.push({file,type:'Actual game viewport in real Chromium',snapshot:await inspect()});await save();
}
async function layout(){
  return page.evaluate(()=>{
    const state=window.__FLIGHT_LAYOUT_QA__(),canvas=document.querySelector('#canvas').getBoundingClientRect();
    const rect=node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const controls={};
    for(const id of ['hud','flightRoute','flightWeapon','flightObjective','powerHud','fire']){
      const node=document.getElementById(id);if(!node)continue;const style=getComputedStyle(node),r=rect(node);
      if(style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.height>0)controls[id]=r;
    }
    const ship={left:canvas.left+(state.player.x-119)*canvas.width/state.W,
      right:canvas.left+(state.player.x+119)*canvas.width/state.W,
      top:canvas.top+(state.player.y-158)*canvas.height/state.H,
      bottom:canvas.top+(state.player.y+104)*canvas.height/state.H};
    return{canvas:rect(document.querySelector('#canvas')),controls,ship,viewport:{width:innerWidth,height:innerHeight},bounds:state.bounds};
  });
}
function overlaps(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
function verifyLayout(value){
  const {controls,viewport,ship,bounds}=value;
  assert.ok(bounds.fits,'The full collision outline cannot fit the available UI area');
  for(const [id,r] of Object.entries(controls))assert.ok(r.left>=-1&&r.top>=-1&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1,`${id} outside viewport`);
  assert.ok(controls.flightWeapon.height>=44,'Weapon control is smaller than 44 px');
  assert.ok(!overlaps(controls.hud,controls.flightRoute),'Route overlaps primary HUD');
  if(controls.powerHud)assert.ok(!overlaps(controls.powerHud,controls.fire),'Powers overlap fire control');
  for(const id of ['hud','flightRoute','powerHud','fire'])if(controls[id])assert.ok(!overlaps(ship,controls[id]),`Ship outline overlaps ${id}`);
}
(async()=>{
  await prepareEvidence(output);evidenceReady=true;
  report.scriptSha256=sha256(await fs.readFile(__filename));
  report.git={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim()};
  const info=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  report.buildInfo={commit:info.commit,revision:info.revision,dirty:info.dirty,sourceTree:info.sourceTree};
  const gamePath=path.join(root,'juego/game.js'),cssPath=path.join(root,'juego/styles.css');
  report.bundleHashes={game:sha256(await fs.readFile(gamePath)),styles:sha256(await fs.readFile(cssPath))};
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [width,height] of [[390,844],[320,568],[844,390]]){
    profile={id:`${width}x${height}`,width,height,status:'running',checks:[],errors:[],consoleErrors:[],failedRequests:[],screenshots:[]};report.profiles.push(profile);
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    page=await context.newPage();page.setDefaultTimeout(30000);
    page.on('pageerror',error=>profile.errors.push(errorText(error)));
    page.on('console',message=>{if(message.type()==='error')profile.consoleErrors.push(message.text());});
    page.on('requestfailed',request=>profile.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
    page.on('response',response=>{if(response.status()>=400)profile.failedRequests.push({url:response.url(),status:response.status()});});
    await page.addInitScript(()=>{
      const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
      const audit=window.__FLIGHT_LAYOUT_RAF__={pending:new Set(),maximum:0,frames:0,errors:[]};
      window.requestAnimationFrame=callback=>{const id=request(now=>{audit.pending.delete(id);audit.frames++;try{callback(now);}catch(error){audit.errors.push(error.stack||String(error));throw error;}});audit.pending.add(id);audit.maximum=Math.max(audit.maximum,audit.pending.size);return id;};
      window.cancelAnimationFrame=id=>{audit.pending.delete(id);cancel(id);};
    });
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
      const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
      assert.equal(sha256(body),report.bundleHashes.game,'Served game is not the recorded bundle');
      const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2,'Legacy bootstrap marker changed');
      const hook=`window.__FLIGHT_LAYOUT_QA__=()=>({state,elapsed,hull,collected,ammo,currentLevel,W,H,warpTimer,legacyRunning,runToken,
        player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},bounds:classicFlightBounds?{...classicFlightBounds}:null,
        input:{...classicFlightInput},flight:classicFlight?.snapshot()||null,
        weapons:classicWeapons?{charges:classicWeapons.charges,recharge:classicWeapons.recharge,cooldown:classicWeapons.cooldown,elapsed:classicWeapons.elapsed,selected:classicWeapons.selected}:null,
        assets:Object.entries(SPRITES).filter(([,image])=>image.src).map(([id,image])=>({id,url:image.src,loaded:image.complete&&image.naturalWidth>0}))});\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});
    });
    await check('one principal journey and closed historical QA archive',async()=>{
      await page.goto(server.url,{waitUntil:'load'});
      assert.equal(await page.locator('#qaArchive').getAttribute('open'),null);
      assert.equal(await page.locator('#classiclink').getAttribute('href'),'juego/index.html');
      assert.match(await page.locator('#classiclink').innerText(),/CONTINUAR VIAJE/);
      const visibleEntries=[];
      for(const link of await page.locator('a[href^="juego/index.html"]').all())if(await link.isVisible())visibleEntries.push(await link.getAttribute('id'));
      assert.deepEqual(visibleEntries,['classiclink']);
      await page.locator('#classiclink').click();
      await wait(()=>typeof __FLIGHT_LAYOUT_QA__==='function'&&__FLIGHT_LAYOUT_QA__().state==='menu');
      assert.match(await page.locator('#playLabel').innerText(),/CONTINUAR VIAJE/);
      await page.locator('#play').click();await page.locator('#launch').click();
      await wait(()=>{const q=__FLIGHT_LAYOUT_QA__();return q.state==='playing'&&q.warpTimer===0&&q.flight?.elapsed>.1&&q.assets.every(asset=>asset.loaded);});
      const q=await inspect();assert.equal(q.currentLevel,0);assert.ok(q.flight);assert.equal(q.weapons.charges,3);
      profile.firstLayout=await layout();verifyLayout(profile.firstLayout);
      await capture('chronos-start');
    });
    const cdp=await context.newCDPSession(page);
    const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:7,radiusX:5,radiusY:5,force:1}]});
    await check('real touch anchors without jumping and steers both axes within measured bounds',async()=>{
      const before=await inspect(),box=await page.locator('#canvas').boundingBox();
      const anchor={x:box.x+box.width*.62,y:box.y+box.height*.63};
      await touch('touchStart',anchor.x,anchor.y);const down=await inspect();
      assert.ok(Math.abs(down.player.target-before.player.target)<.01,'Touchdown jumped X');
      assert.ok(Math.abs(down.player.targetY-before.player.targetY)<.01,'Touchdown jumped Y');
      const dx=Math.min(22,box.width*.08),dy=-Math.min(26,box.height*.06);
      await touch('touchMove',anchor.x+dx,anchor.y+dy);
      await wait(previous=>{const q=__FLIGHT_LAYOUT_QA__();return q.player.x>previous.x+4&&q.player.y<previous.y-4;},{x:before.player.x,y:before.player.y});
      const moved=await inspect();assert.ok(moved.player.target>before.player.target+8);assert.ok(moved.player.targetY<before.player.targetY-8);
      profile.relativeInput={before,down,moved};
      await touch('touchMove',box.x+1,box.y+1);let q=await inspect();
      assert.equal(q.player.target,q.bounds.minX);assert.equal(q.player.targetY,q.bounds.minY);
      await touch('touchMove',box.x+box.width-1,box.y+box.height-1);q=await inspect();
      assert.equal(q.player.target,q.bounds.maxX);assert.equal(q.player.targetY,q.bounds.maxY);
      await touch('touchCancel');assert.equal((await inspect()).input.active,false);
      await page.waitForTimeout(220);profile.movedLayout=await layout();verifyLayout(profile.movedLayout);
      await capture('two-axis-flight');
    });
    await check('actual fire consumes a charge and pause freezes route, recharge and movement',async()=>{
      const before=await inspect();await page.locator('#fire').click();
      await wait(charges=>__FLIGHT_LAYOUT_QA__().weapons.charges===charges-1,before.weapons.charges);
      await page.locator('#pause').click();const paused=await inspect();assert.equal(paused.state,'paused');
      await page.waitForTimeout(550);const after=await inspect();
      assert.equal(after.elapsed,paused.elapsed);assert.equal(after.flight.elapsed,paused.flight.elapsed);assert.equal(after.flight.routeProgress,paused.flight.routeProgress);
      assert.deepEqual(after.weapons,paused.weapons);assert.equal(after.player.x,paused.player.x);assert.equal(after.player.y,paused.player.y);
      assert.equal(after.input.active,false);profile.pause={before:paused,after};
      await capture('paused');await page.locator('#resume').click();
      await wait(time=>__FLIGHT_LAYOUT_QA__().flight.elapsed>time,paused.flight.elapsed);
      const resumed=await inspect();assert.equal(resumed.state,'playing');assert.ok(resumed.weapons.recharge>paused.weapons.recharge);
    });
    await check('restart resets route and three charges; quitting returns to the one journey menu',async()=>{
      await page.locator('#pause').click();const token=(await inspect()).runToken;
      await page.locator('#restart').click();await wait(previous=>__FLIGHT_LAYOUT_QA__().runToken>previous,token);
      const restarted=await inspect();assert.equal(restarted.state,'playing');assert.equal(restarted.currentLevel,0);assert.equal(restarted.weapons.charges,3);assert.ok(restarted.flight.elapsed<=.25,'Restart retained an old route clock');assert.ok(restarted.flight.routeProgress<.002,'Restart retained old route progress');
      await page.locator('#pause').click();await page.locator('#quit').click();await wait(()=>__FLIGHT_LAYOUT_QA__().state==='menu');
      assert.match(await page.locator('#playLabel').innerText(),/CONTINUAR VIAJE/);
      assert.equal(await page.locator('#flightRoute').isVisible(),false);await capture('returned-menu');
    });
    profile.status='passed';await save();await cdp.detach();await context.close();page=null;
  }
  assert.equal(sha256(await fs.readFile(gamePath)),report.bundleHashes.game,'The package changed during QA');
  assert.equal(sha256(await fs.readFile(cssPath)),report.bundleHashes.styles,'The package CSS changed during QA');
  report.requests=server.requests;report.status='passed';report.exitCode=0;
})().catch(async error=>{
  report.status='failed';report.exitCode=1;report.error=errorText(error);if(profile)profile.status='failed';
  if(page){try{profile.failureSnapshot=await inspect();}catch{}try{const file=(profile?.id||'unknown')+'-failure.png';await page.screenshot({path:path.join(output,file),timeout:5000});if(profile)profile.failureScreenshot=file;}catch{}}
  console.error(report.error);
}).finally(async()=>{
  report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();
  if(server)report.requests=server.requests;
  if(browser)await browser.close().catch(()=>{});if(server)await server.close().catch(()=>{});
  if(evidenceReady)await save();console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.length})),output,durationMs:report.durationMs}));
  process.exitCode=report.exitCode??1;
});
