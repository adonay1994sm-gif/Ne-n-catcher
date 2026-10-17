// CONTROLLED Chromium fixture: this explicitly calls the real activatePower
// handler. It is not a natural pickup, encounter or playthrough certification.
// Timers expire through ordinary played time; no game clock/entity/save writes.
// --layout-only explicitly omits expiry, leaving the full default contract intact.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},'layout-only':{type:'boolean',default:false}}});
const root=path.resolve(values.root||'preview-dist'),output=path.resolve(values.output||`docs/production-reports/evidence/compact-hud/powers-${Date.now()}`);
const names=['shield','tractor','slow','double','phaser'],started=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,profiles:[],
  scope:values['layout-only']?'CSS-only: expiry not executed':'Full controlled powers fixture: layout, pause and played-time expiry',
  omittedChecks:values['layout-only']?['Ordinary played-time expiry and release of the flight envelope are not executed in this explicitly selected CSS-only scope.']:[],
  classification:'Controlled real Chromium activation/layout fixture; not natural gameplay',
  limits:['The QA hook deliberately calls the actual activatePower(type,{x:player.x,y:player.y}) handler at the current ship position.',
    'Every injected activation is recorded; it does not demonstrate natural power spawn, collection, reward or encounter balance.',
    values['layout-only']?'CSS-only scope: expiry is not executed. Existing game timers continue unchanged; their completion is not certified by this run.':'Five power durations (6–8 seconds) expire through the existing real played-time update. No timers, health, entities, score or save data are assigned by the hook.',
    'Actual preview QA-unlock UI, classic level selection, pause and resume controls are used.',
    'DOM geometry observation delegates to the original method; the RAF observer adds no callback owner.',
    'DPR1 touch emulation is not physical iPhone/Safari or a sustained performance/memory benchmark. Service workers are blocked.']};
let server,browser,page,captureSession,profile,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__HUD_POWERS_QA__.snapshot(),
  activations:window.__HUD_POWERS_QA__.activations.slice(),domReads:{...window.__HUD_POWERS_DOM__},
  raf:{maximum:window.__HUD_POWERS_RAF__.maximum,pending:window.__HUD_POWERS_RAF__.pending.size,
    frames:window.__HUD_POWERS_RAF__.frames,errors:[...window.__HUD_POWERS_RAF__.errors]}}));
function healthy(q){assert.deepEqual(profile.errors,[],'Uncaught JavaScript error');assert.deepEqual(profile.consoleErrors,[],'Console error');assert.deepEqual(profile.failedRequests,[],'Asset/network failure');
  assert.deepEqual(q.raf.errors,[],'RAF callback error');assert.ok(q.legacyRunning,'Legacy loop stopped');assert.ok(q.raf.maximum<=1,'Multiple RAF owners');}
async function until(predicate,timeout=120000){const deadline=Date.now()+timeout;let q;while(Date.now()<deadline){q=await inspect();healthy(q);if(predicate(q))return q;await page.waitForTimeout(75);}throw new Error(`State timeout: ${JSON.stringify(q)}`);}
async function check(name,operation){const entry={name,status:'running'};profile.checks.push(entry);await save();const began=Date.now();console.log(`[HUD powers ${profile.id}] ${name}`);
  try{await operation();entry.snapshot=await inspect();healthy(entry.snapshot);entry.status='passed';}catch(error){entry.status='failed';entry.error=errorText(error);throw error;}finally{entry.durationMs=Date.now()-began;await save();}}
async function layout(){return page.evaluate(()=>{
  const q=window.__HUD_POWERS_QA__.snapshot(),canvas=document.querySelector('#canvas').getBoundingClientRect();
  const rect=node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=node=>{if(!node)return false;for(let at=node;at;at=at.parentElement){const s=getComputedStyle(at);if(s.display==='none'||s.visibility==='hidden'||(Number(s.opacity)===0&&!(at===node&&node.id==='toast'&&node.classList.contains('show'))))return false;}const r=node.getBoundingClientRect();return r.width>0&&r.height>0;};
  const controls={};for(const id of ['hud','pause','flightRoute','flightObjective','flightWeapon','powerHud','fire','toast']){const node=document.getElementById(id);if(visible(node))controls[id]={...rect(node),text:node.textContent.trim(),
    opacity:Number(getComputedStyle(node).opacity),pointerEvents:getComputedStyle(node).pointerEvents,active:node.classList.contains('show')};}
  const chips=[...document.querySelectorAll('#powerHud .power-chip')].filter(visible).map(node=>({id:node.id,...rect(node),text:node.textContent.trim()}));
  const ship={left:canvas.left+(q.player.x-119)*canvas.width/q.W,right:canvas.left+(q.player.x+119)*canvas.width/q.W,
    top:canvas.top+(q.player.y-158)*canvas.height/q.H,bottom:canvas.top+(q.player.y+104)*canvas.height/q.H};
  return{controls,chips,ship,bounds:q.bounds,canvas:rect(document.querySelector('#canvas')),viewport:{width:innerWidth,height:innerHeight}};
});}
const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
function verifyLayout(value,expectedChipCount){const{controls,viewport,ship,bounds,chips}=value;assert.ok(bounds?.fits,'No space for the complete ship outline');assert.equal(chips.length,expectedChipCount);
  for(const[id,r]of Object.entries(controls))assert.ok(r.left>=-1&&r.top>=-1&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1,`${id} leaves viewport`);
  for(const id of ['pause','flightWeapon','fire']){assert.ok(controls[id],`${id} is missing`);assert.ok(controls[id].width>=44&&controls[id].height>=44,`${id} target is below44px`);}
  for(const id of ['hud','flightRoute','flightObjective','flightWeapon','powerHud','fire'])if(controls[id])assert.ok(!overlaps(ship,controls[id]),`Full ship illustration overlaps ${id}`);
  if(controls.toast){assert.ok(controls.toast.text,'An active toast has no message');assert.equal(controls.toast.pointerEvents,'none','Toast intercepts gameplay input');assert.ok(!overlaps(ship,controls.toast),'Toast covers the complete ship outline');
    for(const id of ['hud','pause','flightWeapon','fire','powerHud','flightObjective'])if(controls[id])assert.ok(!overlaps(controls.toast,controls[id]),`Toast overlaps ${id}`);}
  if(expectedChipCount){assert.ok(controls.powerHud,'Active power row missing');for(const id of ['fire','flightWeapon'])assert.ok(!overlaps(controls.powerHud,controls[id]),`Power row overlaps ${id}`);
    for(const chip of chips){assert.ok(chip.left>=controls.powerHud.left-1&&chip.right<=controls.powerHud.right+1&&chip.top>=controls.powerHud.top-1&&chip.bottom<=controls.powerHud.bottom+1,`Chip ${chip.id} leaves power row`);
      for(const id of ['fire','flightWeapon'])assert.ok(!overlaps(chip,controls[id]),`${chip.id} overlaps ${id}`);}}
}
async function capture(name,requireToast=false,expectedChipCount=0){const file=`${profile.id}-${name}.png`;let before=await layout();
  if(requireToast){assert.ok(before.controls.toast?.active,'The real handler message was absent before capture');if(before.controls.toast.opacity===0){await page.waitForTimeout(60);before=await layout();}
    assert.ok(before.controls.toast?.active&&before.controls.toast.opacity>0,'The actual toast was not visible before capture');verifyLayout(before,expectedChipCount);}
  const captureStarted=Date.now(),screenshot=await captureSession.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const captureDurationMs=Date.now()-captureStarted;await fs.writeFile(path.join(output,file),Buffer.from(screenshot.data,'base64'));const value=await layout();
  const toastPresentAtBothChecks=Boolean(before.controls.toast?.active&&before.controls.toast.opacity>0&&value.controls.toast?.active&&value.controls.toast.opacity>0);
  if(requireToast&&value.controls.toast)verifyLayout(value,expectedChipCount);
  profile.screenshots.push({file,type:'Actual game viewport via CDP Page.captureScreenshot',captureDurationMs,requireToast,
    toastPresentAtBothChecks,caption:requireToast&&!toastPresentAtBothChecks?'Toast geometry passed while visible before capture; message expired during capture/inspection, so this image does not certify message visibility.':'Actual controlled fixture; toast visibility is recorded before and after capture.',
    beforeLayout:before,layout:value,snapshot:await inspect()});await save();return value;}
async function activate(types){const events=await page.evaluate(types=>types.map(type=>window.__HUD_POWERS_QA__.activate(type)),types);profile.activationCalls.push(...events);
  const value=await layout();assert.ok(value.controls.toast?.active,'The actual activation handler did not show its message');verifyLayout(value,types.length===1?1:5);
  profile.activationToasts.push({types,layout:value});await save();}
(async()=>{
  await prepareEvidence(output);evidenceReady=true;report.scriptSha256=sha256(await fs.readFile(__filename));
  report.git={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim()};
  const info=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));report.buildInfo={commit:info.commit,revision:info.revision,dirty:info.dirty};
  report.packageFiles={};for(const name of ['game.js','styles.css','index.html','content-runtime.js']){const bytes=await fs.readFile(path.join(root,'juego',name));report.packageFiles[name]={bytes:bytes.length,sha256:sha256(bytes)};}
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const[width,height]of[[390,844],[320,568],[844,390]]){
    profile={id:`${width}x${height}`,width,height,status:'running',checks:[],screenshots:[],activationCalls:[],activationToasts:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});page=await context.newPage();captureSession=await context.newCDPSession(page);page.setDefaultTimeout(45000);
    page.on('pageerror',e=>profile.errors.push(errorText(e)));page.on('console',m=>{if(m.type()==='error')profile.consoleErrors.push(m.text());});page.on('requestfailed',r=>profile.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)profile.failedRequests.push({url:r.url(),status:r.status()});});
    await page.addInitScript(()=>{
      const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),raf=window.__HUD_POWERS_RAF__={pending:new Set(),maximum:0,frames:0,errors:[]};
      window.requestAnimationFrame=callback=>{const id=request(now=>{raf.pending.delete(id);raf.frames++;try{callback(now);}catch(e){raf.errors.push(e.stack||String(e));throw e;}});raf.pending.add(id);raf.maximum=Math.max(raf.maximum,raf.pending.size);return id;};window.cancelAnimationFrame=id=>{raf.pending.delete(id);cancel(id);};
      const original=Element.prototype.getBoundingClientRect,ids=new Set(['canvas','hud','flightRoute','flightObjective','atlasEncounter','powerHud','fire','flightWeapon']);window.__HUD_POWERS_DOM__={};
      Element.prototype.getBoundingClientRect=function(...args){if(ids.has(this.id))window.__HUD_POWERS_DOM__[this.id]=(window.__HUD_POWERS_DOM__[this.id]||0)+1;return original.apply(this,args);};
    });
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');assert.equal(sha256(body),report.packageFiles['game.js'].sha256);
      const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
      const hook=`window.__HUD_POWERS_QA__={activations:[],activate(type){
        if(!['shield','tractor','slow','double','phaser'].includes(type)||state!=='playing')throw new Error('Invalid controlled power activation');
        const event={type,handler:'activatePower',controlledFixture:true,elapsed,before:{...powers},position:{x:player.x,y:player.y}};
        activatePower(type,{x:player.x,y:player.y});event.after={...powers};this.activations.push(event);return event;},
        snapshot:()=>({state,currentLevel,elapsed,hull,W,H,warpTimer,legacyRunning,runToken,powers:{...powers},
          player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},bounds:classicFlightBounds?{...classicFlightBounds}:null,
          assets:Object.entries(SPRITES).filter(([,image])=>image.src).map(([id,image])=>({id,loaded:image.complete&&image.naturalWidth>0}))})};\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});});
    await check('QA UI launches Vulkar with no powers and three accessible controls',async()=>{
      await page.goto(server.url,{waitUntil:'load'});await page.locator('#qaArchive summary').click();await page.locator('#unlockClassic').check();await page.locator('#classiclink').click();
      // Default Playwright polling schedules its own RAF in the observed page.
      // Numeric polling keeps this harness from adding a second RAF callback.
      await page.waitForFunction(()=>typeof window.__HUD_POWERS_QA__==='object'&&window.__HUD_POWERS_QA__.snapshot().state==='menu',null,{polling:100});
      await page.locator('#levels').click();await page.locator('#levelGrid button').nth(2).click();await page.locator('#launch').click();
      await until(q=>q.state==='playing'&&q.currentLevel===2&&q.warpTimer===0&&q.elapsed>.12&&q.assets.every(a=>a.loaded));
      const q=await inspect();assert.ok(names.every(name=>q.powers[name]===0));profile.before=await capture('no-powers');verifyLayout(profile.before,0);
    });
    await check('controlled shield activation immediately keeps the complete ship clear of its new row',async()=>{
      await activate(['shield']);const q=await until(q=>q.powers.shield>0);profile.shield=await capture('shield-handler-fixture',true,1);verifyLayout(profile.shield,1);
      assert.ok(profile.shield.bounds.maxY<=profile.before.bounds.maxY,'A new row expanded the lower flight limit');assert.equal(q.activations.length,1);
    });
    await check('pause preserves shield timer and resume permits all five real activation handlers',async()=>{
      await page.locator('#pause').click();const before=await inspect();assert.equal(before.state,'paused');await page.waitForTimeout(500);const after=await inspect();assert.equal(after.elapsed,before.elapsed);assert.deepEqual(after.powers,before.powers);assert.deepEqual(after.bounds,before.bounds);profile.pause={before,after};
      await page.locator('#resume').click();await until(q=>q.state==='playing'&&q.elapsed>before.elapsed);await activate(names);
      const q=await until(q=>names.every(name=>q.powers[name]>0));assert.equal(q.activations.length,6);profile.allStarted={elapsed:q.elapsed,powers:q.powers};
      profile.all=await capture('all-five-handler-fixture',true,5);verifyLayout(profile.all,5);assert.ok(profile.all.bounds.maxY<=profile.shield.bounds.maxY);
    });
    await check('steady countdown frames do not repeatedly sample HUD geometry',async()=>{
      const before=await inspect();await page.waitForFunction(frames=>window.__HUD_POWERS_RAF__.frames>=frames+3,before.raf.frames,{timeout:10000,polling:50});const after=await inspect();
      assert.ok(after.elapsed>before.elapsed);assert.deepEqual(after.domReads,before.domReads,'A steady power countdown performed new UI rectangle reads');
      profile.steadyCountdown={before,after,geometryReadsAdded:0};
    });
    if(!values['layout-only'])await check('ordinary played time expires all power timers and releases the measured flight envelope',async()=>{
        const q=await until(q=>q.state==='playing'&&names.every(name=>q.powers[name]===0));
        const duration=q.elapsed-profile.allStarted.elapsed;assert.ok(duration>=5.8,'Effects expired before their played-time durations');assert.ok(duration<=15,'Effects did not expire within15 played seconds');
        profile.expiry={elapsed:q.elapsed,playedSinceAllActivation:duration,powers:q.powers};profile.after=await capture('expired-through-played-time');verifyLayout(profile.after,0);
        assert.ok(profile.after.bounds.maxY>=profile.all.bounds.maxY,'Expired powers did not release the lower envelope');
      });
    else profile.expiry={status:'not-executed',reason:'Explicit --layout-only scope; no expiry assertions were executed or marked passed.'};
    profile.status='passed';await save();await context.close();page=null;
  }
  for(const[name,recorded]of Object.entries(report.packageFiles))assert.equal(sha256(await fs.readFile(path.join(root,'juego',name))),recorded.sha256,`Package changed during QA: ${name}`);
  report.packageUnchanged=true;report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);if(profile)profile.status='failed';if(page){try{profile.failureSnapshot=await inspect();profile.failureLayout=await layout();}catch{}
    try{const file=`${profile?.id||'unknown'}-failure.png`;await page.screenshot({path:path.join(output,file),timeout:5000});profile.failureScreenshot=file;}catch{}}console.error(report.error);
}).finally(async()=>{report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();if(server)report.requests=server.requests;if(browser)await browser.close().catch(()=>{});if(server)await server.close().catch(()=>{});
  if(evidenceReady)await save();console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.length})),output,durationMs:report.durationMs}));process.exitCode=report.exitCode??1;});
