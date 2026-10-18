// Focused real-input QA of the revised C9 arrival, damaged ship and pulse art.
// One declared stage-entry save; this is not a natural ten-stage voyage.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');

const {values} = parseArgs({options:{root:{type:'string'},output:{type:'string'},
  timeout:{type:'string'},'expected-commit':{type:'string'}}});
assert.ok(values.output && /^[a-f0-9]{40}$/.test(values['expected-commit'] || ''),
  'Provide --output and a full --expected-commit');
const root = path.resolve(values.root || 'preview-dist');
const output = path.resolve(values.output);
const timeout = Number(values.timeout || 90000);
assert.ok(Number.isFinite(timeout) && timeout >= 20000 && timeout <= 180000);
const started = Date.now();
const report = {status:'running',exitCode:null,command:process.argv,sourceRoot:root,
  startedAt:new Date().toISOString(),pilotVersion:'c9-short-approach-real-input-v1',
  checks:[],errors:[],consoleErrors:[],failedRequests:[],incidentalRequests:[],screenshots:[],samples:[],
  limits:[
    'Declared valid saved entry 1.6 with hull36, score160, 18collected, maxCombo1, recovered emitter and only Pulse. No later health, time, entity, quota or equipment writes.',
    'Actual menu, stage selector, keyboard/button firing, pause, preparation and Continue inputs drive the shipped loop. This is focused C9 QA, not a complete ten-stage voyage.',
    'Read-only diagnostics are appended to a local HTTP game response; original package files remain unchanged. Canvas/RAF observers call native functions without scheduling gameplay.',
    'Real Chromium 390x844 DPR1 on this host. No Safari, physical iPhone, human balance or artistic acceptance is claimed.',
    'Service workers are blocked to make local response instrumentation explicit; this run does not certify offline update behavior.',
    'The initial pause creates inspection time before the new1.2s dock; it cannot advance the route. Only standard UI/keyboard controls resume it.'
  ]};
let server,browser,context,page,evidenceReady = false;
const save = () => saveEvidence(output,report);
const inspect = () => page.evaluate(() => ({...window.__C9_POLISH_QA__(),observer:{
  frames:window.__C9_POLISH_OBSERVER__.frames,maximum:window.__C9_POLISH_OBSERVER__.maximum,
  pending:window.__C9_POLISH_OBSERVER__.pending.size,errors:[...window.__C9_POLISH_OBSERVER__.errors],
  imageCounts:{...window.__C9_POLISH_OBSERVER__.imageCounts},lowHullFrames:window.__C9_POLISH_OBSERVER__.lowHullFrames,
  lowHullSmokeDraws:window.__C9_POLISH_OBSERVER__.lowHullSmokeDraws,
  pulses:window.__C9_POLISH_OBSERVER__.pulses,c9:window.__C9_POLISH_OBSERVER__.c9}}));
const wait = (fn,arg,ms=timeout) => page.waitForFunction(fn,arg,{polling:50,timeout:ms});
function healthy(q) {
  assert.deepEqual(report.errors,[],'JavaScript errors');
  assert.deepEqual(report.consoleErrors,[],'Console errors');
  assert.deepEqual(report.failedRequests,[],'Failed resources');
  assert.deepEqual(q.observer.errors,[],'RAF callbacks threw');
  assert.ok(q.legacyRunning,'The original loop must stay active');
  assert.ok(q.observer.maximum <= 1,'More than one RAF callback is pending');
  for(const [key,value] of Object.entries(report.sentinels)) assert.equal(q.saves[key],value,
    `Unrelated save changed: ${key}`);
}
async function check(name,fn) {
  const item = {name,status:'running',startedAt:new Date().toISOString()},began = Date.now();
  report.checks.push(item);await save();console.log(`[C9 polish] ${name}`);
  try {item.result = await fn();const q = await inspect();healthy(q);item.status = 'passed';}
  catch(error) {item.status = 'failed';item.error = errorText(error);throw error;}
  finally {item.durationMs = Date.now()-began;await save();}
}
async function capture(name,q) {
  const file = `${String(report.screenshots.length+1).padStart(2,'0')}-${name}.png`;
  await page.screenshot({path:path.join(output,file)});
  report.screenshots.push({file,type:'Authentic Chromium game with declared stage-entry fixture',
    state:q.state,hull:q.hull,routeElapsed:q.flight?.elapsed,stageElapsed:q.flight?.stageElapsed,
    stageId:q.flight?.stageId,equipment:q.equipment});await save();
}
async function hashFiles(directory,base='') {
  const result = {};
  for(const entry of await fs.readdir(path.join(directory,base),{withFileTypes:true})) {
    const file = path.join(base,entry.name);
    if(entry.isDirectory()) Object.assign(result,await hashFiles(directory,file));
    else {const bytes = await fs.readFile(path.join(directory,file));result[file] = {bytes:bytes.length,sha256:sha256(bytes)};}
  }
  return result;
}
async function menuLaunch() {
  await page.locator('#play').click();
  assert.equal(await page.locator('[data-voyage-stage="6"]').getAttribute('aria-pressed'),'true');
  await page.locator('#launch').press('Enter');
}

(async () => {
  await prepareEvidence(output);evidenceReady = true;
  await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256 = sha256(await fs.readFile(__filename));
  try {report.git = {head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    status:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim()};}
  catch(error) {report.git = {error:errorText(error)};}
  report.buildInfo = JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,values['expected-commit']);
  assert.equal(report.buildInfo.dirty,false,'The browser fixture must use a clean package');
  assert.equal(report.buildInfo.engineV1,false);
  assert.equal(report.buildInfo.branch,'continuity-assets-audit-20261013');
  report.packageBefore = await hashFiles(root);
  const modelPath = path.resolve(__dirname,'../src/game/progression/chronos-flight.js');
  const model = await import(pathToFileURL(modelPath).href);
  const checkpoint = model.normalizeChronosVoyageCheckpoint(model.createChronosVoyageCheckpoint(6,{goal:36,collected:18}));
  assert.ok(checkpoint);assert.equal(checkpoint.stageId,'1.6');
  assert.equal(checkpoint.serviceWaiting,undefined);
  report.fixture = {version:2,checkpoint,entry:{hull:36,score:160,collected:18,maxCombo:1},unlockedStage:6,completed:false};
  report.equipmentFixture = {version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'};
  report.fixtureSource = {model:modelPath,sha256:sha256(await fs.readFile(modelPath)),
    method:'createChronosVoyageCheckpoint(6) then normalizeChronosVoyageCheckpoint; valid wrapper supplied before launch'};
  const prefix = report.buildInfo.storagePrefix;
  assert.ok(typeof prefix === 'string' && prefix.length > 0,'Preview storage prefix required');
  report.sentinels = {[prefix+'neon-n7-unlocked-v1']:'37',[prefix+'neon-n7-best-v1']:'2037',
    [prefix+'neon-best-v2']:'9000','neon-n7-unlocked-v1':'37','neon-n7-best-v1':'2037'};
  await fs.writeFile(path.join(output,'declared-checkpoint-fixture.json'),JSON.stringify({voyage:report.fixture,
    equipment:report.equipmentFixture,sentinels:report.sentinels},null,2)+'\n');
  server = await startStaticServer(root);
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser = {version:browser.version(),viewport:{width:390,height:844},deviceScaleFactor:1};
  context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(({fixture,equipment,sentinels,prefix}) => {
    const key = prefix+'neonCatcher.chronosVoyage.v2';
    // Only the absent initial record is seeded. Reload must consume actual
    // application writes rather than resetting the fixture or hiding save loss.
    if(location.pathname.endsWith('/juego/index.html') && !localStorage.getItem(key)) {
      localStorage.setItem(key,JSON.stringify(fixture));
      localStorage.setItem(prefix+'neonCatcher.flightEquipment.v1',JSON.stringify(equipment));
      for(const [name,value] of Object.entries(sentinels)) localStorage.setItem(name,value);
    }
    const observer = window.__C9_POLISH_OBSERVER__ = {frames:0,maximum:0,pending:new Set(),errors:[],
      imageCounts:{},lowHullFrames:0,lowHullSmokeDraws:0,pulses:[],c9:[]};
    const request = window.requestAnimationFrame.bind(window),cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      const id = request(now => {observer.pending.delete(id);observer.frames++;
        try {callback(now);}catch(error) {observer.errors.push(error.stack || String(error));throw error;}});
      observer.pending.add(id);observer.maximum = Math.max(observer.maximum,observer.pending.size);return id;
    };
    window.cancelAnimationFrame = id => {observer.pending.delete(id);return cancel(id);};
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image,...args) {
      const result = Reflect.apply(draw,this,[image,...args]);
      if(this.canvas.id !== 'canvas') return result;
      const source = (image?.currentSrc || image?.src || '').split('/').at(-1).split('?')[0];
      observer.imageCounts[source] = (observer.imageCounts[source] || 0)+1;
      const state = window.__C9_POLISH_DRAW_QA__?.();
      if(state?.hull === 36 && /ship_modular_atlas_v1/.test(source)) observer.lowHullFrames++;
      if(state?.hull === 36 && /smoke_frame_/.test(source)) observer.lowHullSmokeDraws++;
      if(/arcade_pulse_atlas_v2/.test(source) && args.length === 8 && args[1] === 0 && state) {
        const matrix = this.getTransform(),x = args[4]+args[6]/2,y = args[5]+args[7]/2;
        const center = {x:matrix.a*x+matrix.c*y+matrix.e,y:matrix.b*x+matrix.d*y+matrix.f};
        const match = state.projectiles.filter(shot=>shot.weapon === 'pulse').map(shot=>({shot,
          error:Math.hypot(center.x-(shot.x+state.cameraKickX),center.y-(shot.y-state.cameraKickY))}))
          .sort((a,b)=>a.error-b.error)[0];
        if(match) observer.pulses.push({frame:observer.frames,rect:args.slice(0,4),center,
          matrix:{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f},
          shot:{...match.shot},alignmentError:match.error,hull:state.hull,elapsed:state.elapsed,
          routeElapsed:state.routeElapsed,stageElapsed:state.stageElapsed});
        if(observer.pulses.length > 180) observer.pulses.shift();
      }
      if(/c9_station_v1/.test(source) && args.length === 8 && state) {
        observer.c9.push({frame:observer.frames,rect:args.slice(0,4),routeElapsed:state.routeElapsed,
          stageElapsed:state.stageElapsed,state:state.relayState,hull:state.hull});
        if(observer.c9.length > 180) observer.c9.shift();
      }
      return result;
    };
  },{fixture:report.fixture,equipment:report.equipmentFixture,sentinels:report.sentinels,prefix});
  page = await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>report.errors.push(errorText(error)));
  page.on('console',message=>{if(message.type() === 'error') {
    const text = message.text();if(/favicon\.ico/.test(text))report.incidentalRequests.push(text);else report.consoleErrors.push(text);
  }});
  page.on('requestfailed',request=>{const item = {url:request.url(),error:request.failure()?.errorText};
    if(/favicon\.ico/.test(item.url))report.incidentalRequests.push(item);else report.failedRequests.push(item);});
  page.on('response',response=>{if(response.status() >= 400) {
    const item = {url:response.url(),status:response.status()};
    if(/favicon\.ico/.test(item.url))report.incidentalRequests.push(item);else report.failedRequests.push(item);
  }});
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response = await route.fetch(),body = await response.body(),source = body.toString('utf8');
    assert.equal(sha256(body),report.packageBefore['juego/game.js'].sha256,'Shipped bundle changed');
    const marker = '  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2,'Legacy injection marker changed');
    const hook = `window.__C9_POLISH_DRAW_QA__=()=>({hull,elapsed,routeElapsed:classicFlightView?.elapsed,
      stageElapsed:classicFlightView?.stageElapsed,relayState:classicFlightView?.relay?.state,
      cameraKickX,cameraKickY,projectiles:classicWeapons?.projectiles.map(shot=>({id:shot.id,weapon:shot.weapon,
      x:shot.x,y:shot.y,vx:shot.vx,vy:shot.vy,life:shot.life,duration:shot.duration}))||[]});
      window.__C9_POLISH_QA__=()=>({state,currentLevel,elapsed,W,H,hull,score,collected,legacyRunning,
      player:{x:player.x,y:player.y},settings:{...settings},
      flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),voyage:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null,
      sprites:{modular:!!(SPRITES.modularShip?.complete&&SPRITES.modularShip.naturalWidth),
      pulse:!!(SPRITES.arcadePulse?.complete&&SPRITES.arcadePulse.naturalWidth),c9:!!(SPRITES.c9Station?.complete&&SPRITES.c9Station.naturalWidth)},
      saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  await page.goto(new URL('juego/index.html',server.url).href,{waitUntil:'load'});
  await wait(()=>typeof window.__C9_POLISH_QA__ === 'function' && document.querySelector('#menu.show'));
  await check('the declared damaged stage-entry save starts through the real selector; the original loop draws a clean modular hull',async()=>{
    // The eager identity must be ready before inspecting a damaged ship: a
    // download-failure fallback is a different declared test contract.
    await wait(()=>window.__C9_POLISH_QA__().sprites.modular);
    await menuLaunch();await page.keyboard.press('Escape');
    await wait(()=>window.__C9_POLISH_QA__().state === 'paused' && window.__C9_POLISH_QA__().flight.waitingFor !== 'service');
    const before = await inspect();assert.equal(before.hull,36);assert.equal(before.score,160);
    assert.equal(before.collected,18);assert.equal(before.flight.stageId,'1.6');assert.ok(before.flight.stageElapsed < 1.2);
    assert.equal(before.settings.autoFire,false);assert.deepEqual(before.equipment.unlocked,['pulse']);
    await wait(()=>window.__C9_POLISH_QA__().sprites.pulse && window.__C9_POLISH_QA__().sprites.c9);
    await page.waitForTimeout(350);const frozen = await inspect();
    assert.equal(frozen.flight.elapsed,before.flight.elapsed);assert.equal(frozen.hull,36);
    assert.ok(frozen.observer.lowHullFrames >= 5,'No actual damaged modular frames were drawn');
    assert.equal(frozen.observer.lowHullSmokeDraws,0,'Smoke billboard drawn over the damaged modular hull');
    report.lowHull={before,frozen};return report.lowHull;
  });
  await check('one real Pulse press emits a vertical moving projectile and at least two centered authored poses before C9 opens',async()=>{
    await page.locator('#resume').press('Enter');
    await page.locator('#fire').press('Enter');
    const firing = await inspect();assert.equal(firing.state,'playing');assert.equal(firing.hull,36);
    await capture('damaged-ship-with-real-pulse-before-dock',firing);
    await wait(()=>new Set(window.__C9_POLISH_OBSERVER__.pulses.map(item=>item.rect.join(','))).size >= 2);
    const q = await inspect(),draws = q.observer.pulses;
    const ids = [...new Set(draws.map(item=>item.shot.id))];assert.equal(ids.length,1,'The discrete press must emit exactly one shot');
    const traces = draws.filter(item=>item.shot.id === ids[0]);
    assert.ok(traces.length >= 2);assert.ok(traces.some(item=>item.shot.y < traces[0].shot.y-10));
    for(const draw of traces) {
      assert.ok(Math.abs(draw.shot.vx) < 1e-8);assert.ok(draw.shot.vy < 0);
      assert.ok(Math.abs(draw.shot.x-traces[0].shot.x) < 1e-8);
      assert.ok(draw.alignmentError < .01,`Painted center differs from its real projectile: ${draw.alignmentError}`);
      assert.ok(Math.abs(draw.matrix.b) < 1e-8 && Math.abs(draw.matrix.c) < 1e-8,'Pulse art is rotated away from vertical');
    }
    report.pulse={snapshot:q,observedPoses:[...new Set(traces.map(item=>item.rect.join(',')))],traces};return report.pulse;
  });
  await check('C9 opens at the actual1.2-second arrival; service freezes route and battery, heals and only prepares the recovered component',async()=>{
    await page.locator('#flightDock.show').waitFor({timeout});
    const docked = await inspect();
    assert.equal(docked.state,'paused');assert.equal(docked.flight.stageId,'1.6');
    assert.equal(docked.flight.waitingFor,'service');assert.equal(docked.flight.stageElapsed,1.2);
    assert.equal(docked.flight.elapsed,183.2);assert.equal(docked.hull,100);
    await capture('c9-arrival-opens-workshop-without-a-wait',docked);
    await page.waitForTimeout(450);const frozen = await inspect();
    assert.deepEqual(frozen.flight,docked.flight);assert.deepEqual(frozen.weapons,docked.weapons);
    await page.locator('#flightInstallTwin').click();const prepared = await inspect();
    assert.equal(prepared.equipment.twinPrepared,true);assert.deepEqual(prepared.equipment.unlocked,['pulse']);
    assert.equal(prepared.equipment.selected,'pulse');assert.equal(prepared.weapons.selected,'pulse');
    assert.deepEqual(prepared.weapons,frozen.weapons,'Preparing a component cannot recharge or alter the weapon');
    assert.equal(await page.locator('[data-flight-loadout="twin"]').isDisabled(),true);
    assert.equal(await page.locator('[data-flight-loadout="lance"]').isDisabled(),true);
    assert.equal(await page.locator('#flightCalibrateLance').isVisible(),false);
    assert.match(await page.locator('#flightDockStatus').innerText(),/Atlas/);
    await capture('c9-component-prepared-pulse-still-equipped',prepared);
    report.service={docked,frozen,prepared};return report.service;
  });
  await check('Continue leaves the station within2.4s, persists a healed same-stage milestone and reload never reopens C9',async()=>{
    await page.locator('#flightDockContinue').click();
    const undocked = await inspect();
    assert.equal(undocked.state,'playing');assert.equal(undocked.flight.stageId,'1.6');
    assert.equal(undocked.flight.waitingFor,null);assert.equal(undocked.flight.relay.state,'departing');
    assert.equal(undocked.hull,100);assert.equal(undocked.voyage.entry.hull,100);
    assert.equal(undocked.voyage.checkpoint.stageNumber,6);
    assert.ok(undocked.voyage.checkpoint.eventIds.includes('chronos-voyage:1.6:service-complete'));
    await wait(()=>window.__C9_POLISH_QA__().flight.stageElapsed >= 3.6 && !window.__C9_POLISH_QA__().flight.relay.visible);
    const departed = await inspect();
    assert.equal(departed.flight.stageId,'1.6');assert.equal(departed.collected,18);
    const exitDraws = departed.observer.c9.filter(draw=>draw.state === 'departing');
    assert.ok(exitDraws.length,'The actual departure pose was never drawn');
    assert.ok(exitDraws.every(draw=>draw.stageElapsed < 3.6+.034),'Station remained visible beyond its2.4s exit');
    await capture('c9-departed-back-in-the-flight-corridor',departed);
    const savedBytes = departed.saves[prefix+'neonCatcher.chronosVoyage.v2'];
    const equipmentBytes = departed.saves[prefix+'neonCatcher.flightEquipment.v1'];
    assert.equal(JSON.parse(savedBytes).entry.hull,100);
    report.departure={undocked,departed,savedBytes,equipmentBytes};
    await page.reload({waitUntil:'load'});
    await wait(()=>typeof window.__C9_POLISH_QA__ === 'function' && document.querySelector('#menu.show'));
    const menu = await inspect();assert.equal(menu.saves[prefix+'neonCatcher.chronosVoyage.v2'],savedBytes);
    assert.equal(menu.saves[prefix+'neonCatcher.flightEquipment.v1'],equipmentBytes);
    await menuLaunch();await wait(()=>window.__C9_POLISH_QA__().state === 'playing');
    const restored = await inspect();
    assert.equal(restored.hull,100);assert.equal(restored.flight.stageId,'1.6');
    assert.equal(restored.flight.waitingFor,null);assert.equal(restored.equipment.twinPrepared,true);
    assert.deepEqual(restored.equipment.unlocked,['pulse']);
    await wait(()=>window.__C9_POLISH_QA__().flight.stageElapsed >= 3.6);
    const later = await inspect();assert.equal(later.state,'playing');assert.equal(later.hull,100);
    assert.equal(later.flight.waitingFor,null);
    // This project hides overlays through opacity/pointer-events, not display.
    // Playwright isVisible() deliberately ignores opacity; inspect the actual
    // presentation and input contract instead of mistaking its box for a dock.
    const dockPresentation = await page.locator('#flightDock').evaluate(element=>({
      shown:element.classList.contains('show'),opacity:getComputedStyle(element).opacity,
      pointerEvents:getComputedStyle(element).pointerEvents}));
    assert.equal(dockPresentation.shown,false);assert.equal(dockPresentation.opacity,'0');
    assert.equal(dockPresentation.pointerEvents,'none');
    assert.equal(later.flight.relay.visible,false);assert.equal(later.flight.stageId,'1.6');
    await capture('reloaded-healed-departure-does-not-reopen-c9',later);
    report.reentry={menu,restored,later,dockPresentation};return report.reentry;
  });
  report.status='passed';report.exitCode=0;
})().catch(async error=>{
  report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(page) {report.failureSnapshot=await inspect().catch(error=>({error:errorText(error)}));
    if(evidenceReady) await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(evidenceReady && report.packageBefore) {
    try {report.packageAfter=await hashFiles(root);assert.deepEqual(report.packageAfter,report.packageBefore);report.packageUnchanged=true;}
    catch(error) {report.status='failed';report.exitCode=1;report.error??=errorText(error);process.exitCode=1;}
  }
  report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();report.httpRequests=server?.requests;
  await context?.close();await browser?.close();await server?.close();
  if(evidenceReady) await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,
    passed:report.checks.filter(item=>item.status==='passed').length,
    failed:report.checks.filter(item=>item.status==='failed').length,durationMs:report.durationMs,output,error:report.error}));
});
