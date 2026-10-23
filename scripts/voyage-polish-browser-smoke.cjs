// Bounded Chromium QA for the illustrated C9, contextual Web Audio score,
// comfort settings and destination framing. All fixtures are declared below.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options:{root:{type:'string'},output:{type:'string'},timeout:{type:'string'},'focus-c9':{type:'boolean'},'expected-commit':{type:'string'}}});
const root=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||'/tmp/neon-cronium-polish-focused');
const timeout=Number(values.timeout||180000);
assert.ok(Number.isFinite(timeout)&&timeout>=30000&&timeout<=300000);
const started=Date.now();
const report={status:'running',exitCode:null,command:process.argv,root,startedAt:new Date().toISOString(),
  cases:[],errors:[],consoleErrors:[],failedRequests:[],incidentalRequests:[],screenshots:[],samples:[],c9Responses:[],
  limits:['Real Chromium on this software-rendered host, not Safari, physical iPhone, or an installed PWA.',
    'Explicit valid checkpoints 1.6 and 1.10 seed already-reached stages; this is not a natural complete voyage.',
    'The first context checks preference persistence; service and framing contexts are sequential and bounded.',
    'Read-only closure diagnostics are added to a local HTTP game response; no distributed files or simulation state are changed.',
    'RAF, oscillator and Canvas observers call original native functions unchanged; no second animation owner.',
    'Web Audio context and native finite nodes are verified; no claim of perceptual listening quality or device loudness.',
    'Offline C9 uses a live page after native precaching plus a worker-served byte check; not a fresh offline relaunch.',
    'Atlas context is not forced by mutating combat state; the separate natural Atlas pilot covers that transition.']};
if(values['focus-c9'])report.limits.push('Focused C9 rerun starts from an explicit already-paused service checkpoint; it does not repeat transit audio, comfort persistence, Gaia framing or the 32-second approach.');
let server,browser,currentContext,currentPage,evidenceReady=false;
const save=()=>saveEvidence(output,report);
async function hashFiles(directory,base=''){
  const out={};for(const entry of await fs.readdir(path.join(directory,base),{withFileTypes:true})){
    const file=path.join(base,entry.name);if(entry.isDirectory())Object.assign(out,await hashFiles(directory,file));
    else{const bytes=await fs.readFile(path.join(directory,file));out[file]={bytes:bytes.length,sha256:sha256(bytes)};}
  }return out;
}
async function step(name,action){
  const entry={name,status:'running'},began=Date.now();report.cases.push(entry);await save();console.log(`[Voyage polish] ${name}`);
  try{entry.result=await action();clean();entry.status='passed';}catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-began;await save();}
}
function clean(){assert.deepEqual(report.errors,[],'JavaScript errors');assert.deepEqual(report.consoleErrors,[],'Console errors');assert.deepEqual(report.failedRequests,[],'Requested resources failed');}
const inspect=page=>page.evaluate(()=>({...window.__POLISH_QA__(),observer:{
  frames:window.__POLISH_OBSERVER__.frames,maximum:window.__POLISH_OBSERVER__.maximum,
  errors:[...window.__POLISH_OBSERVER__.errors],draw:window.__POLISH_OBSERVER__.draw,
  voices:window.__POLISH_OBSERVER__.voices},memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,
  totalJSHeapSize:performance.memory.totalJSHeapSize,jsHeapSizeLimit:performance.memory.jsHeapSizeLimit}:null}));
async function waitAsync(page,predicate,argument,ms=timeout){const end=Date.now()+ms;while(Date.now()<end){if(await page.evaluate(predicate,argument))return;await page.waitForTimeout(150);}throw new Error(`Browser condition timed out after ${ms}ms`);}
async function capture(page,name){const file=`${String(report.screenshots.length+1).padStart(2,'0')}-${name}.png`;await page.screenshot({path:path.join(output,file)});report.screenshots.push({file,type:'Authentic running Chromium viewport; explicit checkpoint fixture'});await save();}
function healthy(q){clean();assert.ok(q.observer.maximum<=1,'Duplicate RAF owner');assert.deepEqual(q.observer.errors,[]);}
async function createContext({stage,reducedMotion='no-preference',workers='block',equipment,serviceReady=false}={}){
  currentContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
    reducedMotion,serviceWorkers:workers});
  const model=await import(pathToFileURL(path.resolve(__dirname,'../src/game/progression/chronos-flight.js')).href);
  const baseCheckpoint=stage?model.createChronosVoyageCheckpoint(stage,{goal:36}):null;
  const checkpoint=baseCheckpoint&&serviceReady?{...baseCheckpoint,serviceWaiting:true}:baseCheckpoint;
  const fixture=checkpoint?{version:2,checkpoint,entry:{hull:100,score:160,maxCombo:3,collected:checkpoint.collected},unlockedStage:stage,completed:false}:null;
  report.fixtures??=[];report.fixtures.push({stage,serviceReady,reducedMotion,workers,voyage:fixture,equipment:equipment||null});
  await currentContext.addInitScript(({fixture,equipment,prefix})=>{
    if(fixture&&!localStorage.getItem(prefix+'neonCatcher.chronosVoyage.v2'))localStorage.setItem(prefix+'neonCatcher.chronosVoyage.v2',JSON.stringify(fixture));
    if(equipment&&!localStorage.getItem(prefix+'neonCatcher.flightEquipment.v1'))localStorage.setItem(prefix+'neonCatcher.flightEquipment.v1',JSON.stringify(equipment));
    const q=window.__POLISH_OBSERVER__={frames:0,maximum:0,pending:new Set(),errors:[],draw:{},voices:[]};
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>{const id=request(now=>{q.pending.delete(id);q.frames++;try{callback(now);}catch(error){q.errors.push(error.stack||String(error));throw error;}});
      q.pending.add(id);q.maximum=Math.max(q.maximum,q.pending.size);return id;};
    window.cancelAnimationFrame=id=>{q.pending.delete(id);return cancel(id);};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){const result=Reflect.apply(draw,this,[image,...args]);
      const file=image?.src?.split('/').at(-1)?.split('?')[0],canvas=this.canvas?.id||'anonymous';
      if(file){q.draw[file]??={};q.draw[file][canvas]=(q.draw[file][canvas]||0)+1;}return result;};
    const Context=window.AudioContext||window.webkitAudioContext;
    if(Context){const create=Context.prototype.createOscillator;Context.prototype.createOscillator=function(...args){
      const oscillator=Reflect.apply(create,this,args),context=this,record={created:context.currentTime,starts:[],stops:[],ended:false};q.voices.push(record);
      const start=oscillator.start.bind(oscillator),stop=oscillator.stop.bind(oscillator);
      oscillator.start=function(at=0){record.starts.push(at);return start(at);};
      oscillator.stop=function(at=0){record.stops.push(at);return stop(at);};
      oscillator.addEventListener('ended',()=>{record.ended=true;});return oscillator;};}
  },{fixture,equipment,prefix:report.buildInfo.storagePrefix});
  currentPage=await currentContext.newPage();currentPage.setDefaultTimeout(30000);
  currentPage.on('pageerror',error=>report.errors.push(errorText(error)));
  currentPage.on('console',message=>{if(message.type()==='error'){const entry={text:message.text(),location:message.location()};
    if(/\/favicon\.ico$/.test(entry.location.url||''))report.incidentalRequests.push(entry);else report.consoleErrors.push(entry);}});
  currentPage.on('requestfailed',request=>{const entry={url:request.url(),error:request.failure()?.errorText};
    if(/\/favicon\.ico(?:\?|$)/.test(entry.url))report.incidentalRequests.push(entry);else report.failedRequests.push(entry);});
  currentPage.on('response',response=>{if(/\/assets\/c9_station_v1\.webp(?:\?|$)/.test(response.url()))report.c9Responses.push({url:response.url(),status:response.status(),fromServiceWorker:response.fromServiceWorker()});if(response.status()>=400){const entry={url:response.url(),status:response.status()};
    if(/\/favicon\.ico(?:\?|$)/.test(entry.url))report.incidentalRequests.push(entry);else report.failedRequests.push(entry);}});
  await currentPage.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
    assert.equal(sha256(body),report.packageBefore['juego/game.js'].sha256,'The served game differs from the frozen package');
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
    const hook=`window.__POLISH_QA__=()=>({state,currentLevel,elapsed,W,H,hull,collected,
      settings:{...settings},systemReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
      audio:audioCtx?{native:audioCtx instanceof (window.AudioContext||window.webkitAudioContext),state:audioCtx.state,currentTime:audioCtx.currentTime,sampleRate:audioCtx.sampleRate}:null,
      musicGain:musicGain?.gain.value??null,score:voyageScore?.snapshot()||null,scoreContext:voyageScoreContext,
      activeToneVoices:activeToneVoices.size,view:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      frame:classicFlightView?chronosSceneryFrame():null,
      projection:classicFlightView?chronosDestinationPresentation(classicFlightView.planet):null,
      bounds:classicFlightBounds?{...classicFlightBounds}:null,equipment:JSON.parse(JSON.stringify(classicEquipment)),
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  await currentPage.goto(new URL('juego/index.html',server.url).href,{waitUntil:'load'});
  await currentPage.waitForFunction(()=>typeof window.__POLISH_QA__==='function'&&document.querySelector('#menu.show'));
  return currentPage;
}
async function closeContext(){await currentContext?.close();currentContext=null;currentPage=null;}
async function launch(page,stage){await page.locator('#play').click();assert.equal(await page.locator(`[data-voyage-stage="${stage}"]`).getAttribute('aria-pressed'),'true');await page.locator('#launch').click();await page.waitForFunction(()=>window.__POLISH_QA__().state==='playing'||window.__POLISH_QA__().state==='paused'&&window.__POLISH_QA__().view?.waitingFor==='service');}
function finiteVoices(q){assert.ok(q.observer.voices.length>0,'No native oscillators were created');
  assert.ok(q.observer.voices.every(voice=>voice.starts.length&&voice.stops.length&&voice.stops.every(Number.isFinite)),'A voice has no finite scheduled stop');
  assert.ok(q.observer.voices.some(voice=>voice.ended),'No native voice ended');
  assert.ok(q.score.activeVoices<=12,'Score exceeded bounded voice limit');}

(async()=>{
  await prepareEvidence(output);evidenceReady=true;await fs.copyFile(__filename,path.join(output,'used-harness.cjs'));
  report.harnessSha256=sha256(await fs.readFile(__filename));report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,values['expected-commit']||'6d30b6884db9cc8bb2d9c636e9f7434c9c416ccb');assert.equal(report.buildInfo.dirty,false);assert.equal(report.buildInfo.engineV1,false);
  report.packageBefore=await hashFiles(root);server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=browser.version();
  if(!values['focus-c9'])await step('system reduced-motion default and explicit comfort preference persist through real settings and reload',async()=>{
    const page=await createContext({reducedMotion:'reduce'});const initial=await inspect(page);healthy(initial);
    assert.equal(initial.systemReduced,true);assert.equal(initial.settings.reduceEffects,true);assert.equal(initial.audio,null);
    await page.locator('#quickSettings').click();await page.waitForFunction(()=>window.__POLISH_QA__().audio?.state==='running');
    assert.equal(await page.locator('#reduceEffects').isChecked(),true);const gesture=await inspect(page);assert.equal(gesture.audio.native,true);
    await page.locator('label:has(#reduceEffects)').click();assert.equal(await page.locator('#reduceEffects').isChecked(),false);await page.locator('#settingsBack').click();await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.__POLISH_QA__==='function');const override=await inspect(page);
    assert.equal(override.systemReduced,true);assert.equal(override.settings.reduceEffects,false);
    assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('reduced-effects')),false);
    await page.locator('#quickSettings').click();assert.equal(await page.locator('#reduceEffects').isChecked(),false);
    await page.locator('label:has(#reduceEffects)').click();assert.equal(await page.locator('#reduceEffects').isChecked(),true);await page.locator('#settingsBack').click();await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.__POLISH_QA__==='function');const enabled=await inspect(page);
    assert.equal(enabled.settings.reduceEffects,true);assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('reduced-effects')),true);
    await page.locator('#quickSettings').click();await capture(page,'comfort-checkbox-system-default-and-persistence');
    const saved=JSON.parse(enabled.saves[report.buildInfo.storagePrefix+'neon-settings-v5']);assert.equal(saved.reduceEffects,true);
    healthy(enabled);await closeContext();return{initial,gesture,override,enabled};
  });
  let servicePage,transitStart;
  if(!values['focus-c9'])await step('a gesture starts real finite Web Audio transit voices; pause freezes the beat, resume continues, mute releases music',async()=>{
    servicePage=await createContext({stage:6,workers:'allow',equipment:{version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'}});
    assert.equal((await inspect(servicePage)).audio,null);await launch(servicePage,6);
    await servicePage.waitForFunction(()=>window.__POLISH_QA__().audio?.state==='running'&&window.__POLISH_QA__().score?.totalVoices>=3);
    transitStart=await inspect(servicePage);assert.equal(transitStart.audio.native,true);assert.ok(transitStart.audio.sampleRate>0);
    assert.equal(transitStart.score.context,'transit');await servicePage.waitForTimeout(3000);const phrase=await inspect(servicePage);
    assert.ok(phrase.score.beat>transitStart.score.beat);finiteVoices(phrase);healthy(phrase);
    await servicePage.locator('#pause').click();await servicePage.waitForFunction(()=>window.__POLISH_QA__().score.paused===true);
    const paused=await inspect(servicePage);await servicePage.waitForTimeout(700);const frozen=await inspect(servicePage);
    assert.equal(frozen.score.beat,paused.score.beat);assert.equal(frozen.score.activeVoices,0);assert.equal(frozen.view.elapsed,paused.view.elapsed);
    await servicePage.locator('#resume').click();await servicePage.waitForFunction(beat=>window.__POLISH_QA__().score.beat>beat,paused.score.beat);
    const resumed=await inspect(servicePage);await servicePage.locator('#pause').click();await servicePage.locator('#pauseSettings').click();
    await servicePage.locator('#musicVolume').focus();await servicePage.keyboard.press('Home');assert.equal(await servicePage.locator('#musicVolume').inputValue(),'0');
    await servicePage.locator('#settingsBack').click();await servicePage.locator('#resume').click();await servicePage.waitForTimeout(500);
    const muted=await inspect(servicePage);assert.equal(muted.settings.music,0);assert.equal(muted.score.enabled,false);assert.equal(muted.score.activeVoices,0);
    await servicePage.locator('#pause').click();await servicePage.locator('#pauseSettings').click();await servicePage.locator('#musicVolume').focus();await servicePage.keyboard.press('End');
    await servicePage.locator('#settingsBack').click();await servicePage.locator('#resume').click();await servicePage.waitForFunction(()=>window.__POLISH_QA__().score.enabled===true);
    report.transitAudio={transitStart,phrase,paused,frozen,resumed,muted};return report.transitAudio;
  });
  if(values['focus-c9']){servicePage=await createContext({stage:6,serviceReady:true,workers:'allow',equipment:{version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'}});await launch(servicePage,6);}
  await step(values['focus-c9']?'explicit saved C9 service checkpoint verifies real contrast, selectable weapons and native offline artwork':'fixture stage 1.6 reaches illustrated C9 through the clock, station music continues while the route stops, real weapon buttons work',async()=>{
    const before=await inspect(servicePage),wall=Date.now();report.serviceWaitStart={elapsed:before.elapsed,routeElapsed:before.view.elapsed,rafFrames:before.observer.frames,memory:before.memory};
    while(Date.now()-wall<timeout){const q=await inspect(servicePage);healthy(q);
      report.samples.push({wallMs:Date.now()-wall,elapsed:q.elapsed,routeElapsed:q.view?.elapsed,stage:q.view?.stageId,state:q.state,score:q.score,memory:q.memory,rafFrames:q.observer.frames});
      if(q.state==='paused'&&q.view.waitingFor==='service')break;assert.equal(q.state,'playing');await servicePage.waitForTimeout(800);}
    await servicePage.locator('#flightDock.show').waitFor();await servicePage.waitForFunction(()=>window.__POLISH_QA__().score.context==='station'&&window.__POLISH_OBSERVER__.draw['c9_station_v1.webp']?.flightDockCanvas>0);
    const dock=await inspect(servicePage);assert.equal(dock.view.stageNumber,6);assert.equal(dock.score.paused,false);assert.equal(dock.audio.state,'running');
    assert.ok(dock.observer.draw['c9_station_v1.webp'].flightDockCanvas>0);assert.ok(dock.observer.draw['ship_modular_atlas_v1.webp'].flightDockCanvas>0);
    await servicePage.waitForTimeout(650);const station=await inspect(servicePage);assert.equal(station.view.elapsed,dock.view.elapsed);assert.ok(station.score.beat>dock.score.beat);
    const panel=servicePage.locator('#flightDock .flight-dock');const panelBefore=await panel.evaluate(node=>({scrollTop:node.scrollTop,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
    await capture(servicePage,'c9-illustrated-service-before-install');
    await servicePage.locator('#flightInstallTwin').click();assert.equal(await servicePage.locator('[data-flight-loadout="twin"]').getAttribute('aria-pressed'),'true');
    await servicePage.locator('#flightCalibrateLance').click();assert.equal(await servicePage.locator('[data-flight-loadout="lance"]').getAttribute('aria-pressed'),'true');
    const battery=(await inspect(servicePage)).weapons.charges;
    for(const type of ['pulse','twin','lance']){const button=servicePage.locator(`[data-flight-loadout="${type}"]`);assert.equal(await button.isDisabled(),false);await button.click();
      assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal((await inspect(servicePage)).weapons.charges,battery);}
    const contrasts=await servicePage.locator('#flightLoadoutChoices button:not(:disabled) b').evaluateAll(elements=>{
      const rgb=text=>{const values=text.match(/[\d.]+/g)?.map(Number)||[];return values.slice(0,3).map(v=>v/255);};
      const luminance=color=>color.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,index)=>sum+v*[.2126,.7152,.0722][index],0);
      return elements.map(element=>{const text=getComputedStyle(element).color,background=getComputedStyle(element.closest('button')).backgroundColor,fg=luminance(rgb(text)),bg=luminance(rgb(background));
        return{label:element.textContent.trim(),text,background,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};});
    });
    report.latestC9Contrast=contrasts;await save();assert.equal(contrasts.length,3);for(const item of contrasts)assert.ok(item.ratio>=4.5,`C9 ${item.label} contrast ${item.ratio.toFixed(2)}:1 is below 4.5:1`);
    await capture(servicePage,'c9-selectable-calibrated-weapons');
    await servicePage.setViewportSize({width:320,height:568});await servicePage.waitForTimeout(250);
    const smallBefore=await panel.evaluate(node=>({scrollTop:node.scrollTop,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
    const panelBox=await panel.boundingBox();await servicePage.mouse.move(panelBox.x+panelBox.width*.5,panelBox.y+panelBox.height*.5);await servicePage.mouse.wheel(0,1100);await servicePage.waitForTimeout(200);
    const smallAfter=await panel.evaluate(node=>({scrollTop:node.scrollTop,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
    if(smallBefore.scrollHeight>smallBefore.clientHeight+1)assert.ok(smallAfter.scrollTop>smallBefore.scrollTop,'Real C9 panel wheel did not scroll');
    await servicePage.locator('#flightDockContinue').scrollIntoViewIfNeeded();await capture(servicePage,'c9-small-screen-controls-native-scroll');
    const asset=await fs.readFile(path.join(root,'juego/assets/c9_station_v1.webp'));
    await waitAsync(servicePage,async()=>{const regs=await navigator.serviceWorker.getRegistrations();return regs.some(reg=>reg.active?.state==='activated'&&reg.scope.endsWith('/juego/'))&&Boolean(await caches.match(new URL('assets/c9_station_v1.webp',location.href)));});
    await currentContext.setOffline(true);
    const response=await servicePage.evaluate(async()=>{const r=await fetch('assets/c9_station_v1.webp'),b=await r.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');return{status:r.status,bytes:b.byteLength,sha256:hash,online:navigator.onLine};});
    assert.equal(response.status,200);assert.equal(response.online,false);assert.ok(report.c9Responses.some(item=>item.fromServiceWorker),'Offline C9 has no native worker response');assert.equal(response.bytes,asset.length);assert.equal(response.sha256,sha256(asset));
    const offline=await inspect(servicePage);assert.ok(offline.observer.draw['c9_station_v1.webp'].flightDockCanvas>dock.observer.draw['c9_station_v1.webp'].flightDockCanvas);
    await servicePage.locator('#flightDockContinue').click();await servicePage.waitForFunction(()=>window.__POLISH_QA__().view.stageNumber===7&&window.__POLISH_QA__().score.context==='transit');
    const exited=await inspect(servicePage);assert.equal(exited.state,'playing');assert.equal(exited.equipment.selected,'lance');healthy(exited);
    report.service={dock,station,panelBefore,smallBefore,smallAfter,offlineAsset:response,offline,exited,waitWallMs:Date.now()-wall};
    await closeContext();return report.service;
  });
  if(!values['focus-c9'])await step('late Gaia is projected below measured HUD and above controls at 390x844 and 320x568',async()=>{
    const page=await createContext({stage:10});await launch(page,10);await page.waitForFunction(()=>window.__POLISH_OBSERVER__.draw['chronos_flight_atlas_v1.webp']?.canvas>=2);
    await page.locator('#pause').click();await page.locator('#paused.show').waitFor();await page.locator('#resume').click();
    const frames=[];
    for(const viewport of [{width:390,height:844},{width:320,height:568}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(450);const q=await inspect(page);healthy(q);
      const geometry=await page.evaluate(()=>{const canvas=document.querySelector('#canvas').getBoundingClientRect(),rect=id=>{const e=document.getElementById(id),r=e?.getBoundingClientRect();return r?{id,x:r.x,y:r.y,top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.width>0&&r.height>0&&!e.classList.contains('hidden')}:null;};
        return{canvas:{top:canvas.top,bottom:canvas.bottom,height:canvas.height,width:canvas.width},hud:['hud','flightRoute','flightObjective'].map(rect),controls:['fire','flightWeapon'].map(rect)};});
      const scale=geometry.canvas.height/q.H,top=geometry.canvas.top+(q.projection.y*q.H-q.projection.scale*q.W*.5)*scale,
        bottom=geometry.canvas.top+(q.projection.y*q.H+q.projection.scale*q.W*.5)*scale;
      const hudBottom=Math.max(...geometry.hud.filter(r=>r?.visible).map(r=>r.bottom));
      const controlTop=Math.min(...geometry.controls.filter(r=>r?.visible).map(r=>r.top));
      assert.ok(top>=hudBottom-1,`Gaia top ${top} overlaps HUD ${hudBottom}`);assert.ok(bottom<=controlTop+1,`Gaia bottom ${bottom} overlaps controls ${controlTop}`);
      assert.ok(top>=geometry.canvas.top&&bottom<=geometry.canvas.bottom);assert.equal(q.view.stageNumber,10);
      const file=`gaia-below-hud-${viewport.width}x${viewport.height}`;await capture(page,file);frames.push({viewport,q,geometry,projectionCss:{top,bottom},hudBottom,controlTop});
    }
    await closeContext();return frames;
  });
  report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(currentPage){report.failureSnapshot=await inspect(currentPage).catch(error=>({error:errorText(error)}));if(evidenceReady)await currentPage.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(evidenceReady&&report.packageBefore){try{report.packageAfter=await hashFiles(root);assert.deepEqual(report.packageAfter,report.packageBefore);report.packageUnchanged=true;}catch(error){report.status='failed';report.exitCode=1;report.error??=errorText(error);process.exitCode=1;}}
  report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();report.httpRequests=server?.requests;
  await closeContext();await browser?.close();await server?.close();if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,passed:report.cases.filter(x=>x.status==='passed').length,failed:report.cases.filter(x=>x.status==='failed').length,durationMs:report.durationMs,error:report.error,output}));
});
