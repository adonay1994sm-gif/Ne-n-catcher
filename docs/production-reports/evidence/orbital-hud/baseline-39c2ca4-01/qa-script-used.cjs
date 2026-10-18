// Real UI and explicitly declared C9 checkpoint scenes. Never a natural run.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},'expected-commit':{type:'string'}}});
const root=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||`docs/production-reports/evidence/hud-redesign/browser-${Date.now()}`);
const expected=values['expected-commit'];
assert.match(expected||'',/^[a-f0-9]{40}$/,'Supply --expected-commit with the full clean package SHA');
const began=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,
  executionKind:'CONTROLLED_UI_LAYOUT_AND_ACCESSIBILITY',profiles:[],limits:[
    'Actual Chromium viewport and real UI navigation, not a natural chapter, balance verdict or artistic acceptance.',
    'One declared C9 fixture writes a valid stage-six entry checkpoint and recovered emitter ownership through the actual storage API. No money, purchase, enemy, HP, reward or boss result is minted.',
    'Temporary HTTP response instrumentation observes the existing game and installs the declared fixture API only. Input package hashes are checked before and after.',
    'Viewports 320x568,390x844 and844x390 do not simulate a physical notch, iPhone or Safari. Safe-area CSS variables and visible geometry are recorded; physical safe areas remain unverified.',
    'Workers are blocked. Offline and native multi-touch regressions are separate suites. This script never adds a RAF owner.'
  ]};
let server,browser,context,page,profile,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const wait=(fn,arg,timeout=30000)=>page.waitForFunction(fn,arg,{polling:60,timeout});
const inspect=()=>page.evaluate(()=>window.__HUD_REDESIGN_QA__?.snapshot()||null);
function clean(){assert.deepEqual(profile.errors,[]);assert.deepEqual(profile.consoleErrors,[]);assert.deepEqual(profile.failedRequests,[]);}
async function check(name,fn){const item={name,status:'running'};profile.checks.push(item);const start=Date.now();await save();
  console.log(`[HUD redesign ${profile.id}] ${name}`);
  try{item.result=await fn();clean();item.status='passed';}catch(error){item.status='failed';item.error=errorText(error);throw error;}
  finally{item.durationMs=Date.now()-start;await save();}}
async function capture(name){const file=`${profile.id}-${name}.png`;await page.screenshot({path:path.join(output,file)});
  profile.screenshots.push({file,kind:'ACTUAL_CHROMIUM_UI_CONTROLLED_SCENE',snapshot:await inspect()});await save();}
async function settle(selector){await page.locator(selector).waitFor({state:'visible'});await wait(selector=>Number(getComputedStyle(document.querySelector(selector)).opacity)>.999,selector);}
async function geometry(){return page.evaluate(()=>{
  const visible=e=>{if(!e)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
  const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const controls={};for(const id of ['hud','pause','flightRoute','flightObjective','flightWeapon','fire','classicMissile','classicC9','atlasEncounter','chapterSkip']){
    const e=document.getElementById(id);if(visible(e))controls[id]={...box(e),text:e.textContent.trim(),disabled:!!e.disabled};}
  const style=getComputedStyle(document.documentElement),top=[controls.hud,controls.flightRoute].filter(Boolean);
  return{viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,controls,
    safeArea:{top:style.getPropertyValue('--safe-top').trim(),right:style.getPropertyValue('--safe-right').trim(),bottom:style.getPropertyValue('--safe-bottom').trim(),left:style.getPropertyValue('--safe-left').trim()},
    stableTopHeight:top.length?Math.max(...top.map(r=>r.bottom)):0,
    stableTopAreaShare:top.reduce((sum,r)=>sum+r.width*r.height,0)/(innerWidth*innerHeight)};
});}
function overlap(a,b){return a.x<b.right-1&&a.right>b.x+1&&a.y<b.bottom-1&&a.bottom>b.y+1;}
function flightGeometry(g){assert.ok(g.documentWidth<=g.viewport.width+1,'Horizontal document overflow');
  const actions=['pause','fire','classicMissile','flightWeapon','classicC9'].filter(id=>g.controls[id]);
  assert.ok(g.controls.pause&&g.controls.fire&&g.controls.classicMissile,'Essential flight controls absent');
  for(const id of actions){const r=g.controls[id];assert.ok(r.width>=44&&r.height>=44,`${id} smaller than44px: ${JSON.stringify(r)}`);
    assert.ok(r.x>=-1&&r.y>=-1&&r.right<=g.viewport.width+1&&r.bottom<=g.viewport.height+1,`${id} outside viewport`);}
  for(let a=0;a<actions.length;a++)for(let b=a+1;b<actions.length;b++)assert.ok(!overlap(g.controls[actions[a]],g.controls[actions[b]]),`${actions[a]} overlaps ${actions[b]}`);
  if(g.controls.hud&&g.controls.flightRoute)assert.ok(!overlap(g.controls.hud,g.controls.flightRoute),'Route overlaps main HUD');
  const budget=g.viewport.height<450?105:g.viewport.width<=320?90:100;
  assert.ok(g.stableTopHeight<=budget,`Persistent top HUD ${g.stableTopHeight}px exceeds ${budget}px`);
  assert.ok(g.stableTopAreaShare<=.24,`Persistent top HUD occupies ${(100*g.stableTopAreaShare).toFixed(1)}%`);
}
async function targets(selector,{scroll=false}={}){
  const scope=page.locator(selector),items=scope.locator('button,a,input,select');const records=[];
  for(let index=0;index<await items.count();index++){
    const item=items.nth(index);if(!await item.isVisible())continue;
    if(scroll)await item.scrollIntoViewIfNeeded();
    const record=await item.evaluate(e=>{const target=e.matches('input[type="checkbox"]')?(e.closest('label')||e):e;
      const r=target.getBoundingClientRect(),s=getComputedStyle(target),center={x:r.x+r.width/2,y:r.y+r.height/2};
      const hit=document.elementFromPoint(center.x,center.y),label=e.getAttribute('aria-label')||e.labels?.[0]?.textContent||e.textContent||e.getAttribute('title');
      return{id:e.id||null,tag:e.tagName,type:e.type||null,text:label?.trim().slice(0,180),disabled:!!e.disabled,
        x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,focusable:e.tabIndex>=0,
        hit:!!hit&&(target===hit||target.contains(hit)),hitId:hit?.id||null,outlineStyle:s.outlineStyle};});
    records.push(record);assert.ok(record.text,`Unnamed control in ${selector}: ${record.id}`);
    assert.ok(record.width>=44&&record.height>=44,`${selector} ${record.id||record.text} target below44px: ${JSON.stringify(record)}`);
    assert.ok(record.x>=-1&&record.right<=profile.viewport.width+1,`${selector} control extends horizontally`);
    if(scroll&&!record.disabled)assert.ok(record.hit,`${selector} ${record.id||record.text} covered at its center by ${record.hitId}`);
  }
  assert.ok(records.length,`No visible controls in ${selector}`);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);assert.ok(width<=profile.viewport.width+1,`${selector} horizontal overflow`);
  return records;
}
async function dialog(selector){await settle(selector);
  const result=await page.locator(selector).evaluate(e=>({role:e.getAttribute('role'),modal:e.getAttribute('aria-modal'),
    name:e.getAttribute('aria-label')||[...(e.getAttribute('aria-labelledby')||'').split(/\s+/)].map(id=>document.getElementById(id)?.textContent||'').join(' ').trim(),
    focused:e.contains(document.activeElement),focusId:document.activeElement?.id||null}));
  assert.equal(result.role,'dialog',`${selector} has no dialog role`);assert.equal(result.modal,'true',`${selector} is not aria-modal`);
  assert.ok(result.name,`${selector} has no accessible name`);assert.ok(result.focused,`${selector} focus remained outside dialog: ${result.focusId}`);
  const enabled=page.locator(`${selector} button:not(:disabled),${selector} a,${selector} input:not(:disabled),${selector} select:not(:disabled)`);
  const indexes=[];for(let n=0;n<await enabled.count();n++)if(await enabled.nth(n).isVisible())indexes.push(n);
  assert.ok(indexes.length);const first=enabled.nth(indexes[0]),last=enabled.nth(indexes.at(-1));
  await last.focus();await page.keyboard.press('Tab');assert.equal(await first.evaluate(e=>document.activeElement===e),true,`${selector} forward Tab escapes`);
  await first.focus();await page.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(e=>document.activeElement===e),true,`${selector} backward Tab escapes`);
  return result;
}
(async()=>{
  await prepareEvidence(output);evidenceReady=true;await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.scriptSha256=sha256(await fs.readFile(__filename));report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,expected);assert.equal(report.buildInfo.dirty,false);assert.equal(report.buildInfo.engineV1,false);
  report.packageFiles={};for(const file of ['build-info.json','index.html','juego/index.html','juego/styles.css','juego/game.js','juego/content-runtime.js']){
    const data=await fs.readFile(path.join(root,file));report.packageFiles[file]={bytes:data.length,sha256:sha256(data)};}
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});report.browserVersion=browser.version();
  for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
    profile={id:`${viewport.width}x${viewport.height}`,viewport,status:'running',checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(30000);
    page.on('pageerror',e=>profile.errors.push(errorText(e)));page.on('console',m=>{if(m.type()==='error')profile.consoleErrors.push(m.text());});
    page.on('requestfailed',r=>profile.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)profile.failedRequests.push({url:r.url(),status:r.status()});});
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{const response=await route.fetch(),data=await response.body(),source=data.toString('utf8');
      assert.equal(sha256(data),report.packageFiles['juego/game.js'].sha256);const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
      const hook=`window.__HUD_REDESIGN_QA__={snapshot:()=>({state,currentLevel,elapsed,hull,collected,legacyRunning,
        flight:classicFlight?.snapshot()||null,opening:classicChapterView?.opening||null,equipment:JSON.parse(JSON.stringify(classicEquipment)),
        salvage:classicSalvageLedger?.getState()||null,weapons:classicWeapons?{charges:classicWeapons.charges,elapsed:classicWeapons.elapsed}:null}),
        prepareC9(){goHome();const next={version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'};
          if(!persistClassicEquipment(next))throw Error('C9 ownership fixture failed to persist');
          const checkpoint=NeonCampaign.createChronosVoyageCheckpoint(6,{goal:36,collected:18});
          const record={version:2,checkpoint,entry:{hull:100,reserve:30,score:0,maxCombo:1,collected:18},unlockedStage:6,completed:false};
          if(!storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,record))throw Error('C9 route fixture failed to persist');
          loadClassicVoyage();return{equipment:next,route:record,salvage:classicSalvageLedger?.getState()||null};}};\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});});
    await check('launcher and main menu use real accessible controls',async()=>{
      await page.goto(server.url,{waitUntil:'load'});await targets('main',{scroll:true});await capture('launcher');await page.locator('#classiclink').click();
      await settle('#menu.show');await wait(()=>typeof __HUD_REDESIGN_QA__==='object');const r=await targets('#menu',{scroll:true});await page.locator('#play').scrollIntoViewIfNeeded();await capture('main-menu');return r;});
    await check('settings have focus containment, meaningful labels and reachable44px controls',async()=>{
      await page.locator('#settings').click();const semantics=await dialog('#settingsPanel');const r=await targets('#settingsPanel',{scroll:true});await capture('settings');
      await page.locator('#settingsBack').click();await settle('#menu.show');return{semantics,controls:r};});
    await check('route selection and briefing retain keyboard focus and usable stages',async()=>{
      await page.locator('#levels').click();const selection=await dialog('#levelSelect');const levels=await targets('#levelSelect',{scroll:true});
      await page.locator('#levelGrid button').first().click();const briefing=await dialog('#briefing');const stages=await targets('#briefing',{scroll:true});
      await page.locator('#launch').scrollIntoViewIfNeeded();await capture('briefing');await page.locator('#launch').click();
      await wait(()=>__HUD_REDESIGN_QA__.snapshot().state==='playing'&&__HUD_REDESIGN_QA__.snapshot().elapsed>.12);
      if(await page.locator('#chapterSkip').isVisible())await page.locator('#chapterSkip').click();
      await wait(()=>!__HUD_REDESIGN_QA__.snapshot().opening?.controlsLocked);await page.waitForTimeout(180);
      const layout=await geometry();flightGeometry(layout);await capture('flight');return{selection,levels,briefing,stages,layout};});
    await check('pause freezes actual route and settings never leak back into combat',async()=>{
      await page.locator('#pause').click();const semantics=await dialog('#paused');const a=await inspect();await page.waitForTimeout(250);const b=await inspect();
      assert.equal(a.state,'paused');assert.equal(a.elapsed,b.elapsed);assert.deepEqual(a.flight,b.flight);const controls=await targets('#paused',{scroll:true});await capture('paused');
      await page.locator('#pauseSettings').click();await dialog('#settingsPanel');await page.keyboard.press('Escape');
      await settle('#paused.show');assert.equal((await inspect()).state,'paused');await page.locator('#resume').click();
      await wait(t=>__HUD_REDESIGN_QA__.snapshot().elapsed>t,b.elapsed);await page.locator('#pause').click();await page.locator('#quit').click();await settle('#menu.show');
      return{semantics,controls,before:a,after:b};});
    await check('declared recovered-C9 checkpoint exposes all Forja sections without covering controls',async()=>{
      profile.c9Fixture=await page.evaluate(()=>__HUD_REDESIGN_QA__.prepareC9());assert.equal(profile.c9Fixture.route.checkpoint.stageNumber,6);
      assert.equal(profile.c9Fixture.salvage.balance,0,'This scene must not mint money');await page.locator('#play').click();await page.locator('#launch').click();
      await wait(()=>__HUD_REDESIGN_QA__.snapshot().state==='playing'&&__HUD_REDESIGN_QA__.snapshot().elapsed>.12);
      await page.locator('#classicC9').waitFor({state:'visible'});const layout=await geometry();flightGeometry(layout);await capture('flight-forja-control');
      await page.locator('#classicC9').click();const semantics=await dialog('#flightDock');const a=await inspect();
      const controls=await targets('#flightDock',{scroll:true});const sections=[];
      for(const id of ['c9-arsenal','c9-systems','c9-supplies']){const nav=page.locator(`.c9-navigation [aria-controls="${id}"]`);
        await nav.scrollIntoViewIfNeeded();await nav.click();await page.waitForTimeout(380);sections.push({id,visible:await page.locator('#'+id).isVisible()});await capture(id);}
      const b=await inspect();assert.equal(a.state,'paused');assert.equal(a.elapsed,b.elapsed);assert.deepEqual(a.flight,b.flight);assert.equal(b.salvage.balance,0);
      await page.keyboard.press('Escape');await wait(()=>__HUD_REDESIGN_QA__.snapshot().state==='playing');assert.equal(await page.locator('#classicC9').evaluate(e=>document.activeElement===e),true);
      return{semantics,controls,layout,sections,routeFrozen:true};});
    profile.status='passed';await save();await context.close();context=null;page=null;
  }
  report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);if(profile)profile.status='failed';
  if(page&&evidenceReady){report.failureSnapshot=await inspect().catch(()=>null);report.failureGeometry=await geometry().catch(()=>null);
    await page.screenshot({path:path.join(output,`${profile?.id||'unknown'}-failure.png`)}).catch(()=>{});}console.error(report.error);
}).finally(async()=>{
  if(report.packageFiles)for(const[file,before]of Object.entries(report.packageFiles))try{assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,'Package changed during QA: '+file);}
    catch(error){report.status='failed';report.exitCode=1;report.error??=errorText(error);}
  await context?.close();await browser?.close();await server?.close();report.durationMs=Date.now()-began;report.finishedAt=new Date().toISOString();if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,output,profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.map(c=>({name:c.name,status:c.status}))})),error:report.error}));process.exitCode=report.exitCode??1;
});
