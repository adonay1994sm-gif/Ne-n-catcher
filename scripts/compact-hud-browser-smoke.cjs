// Actual Chromium HUD/input regression. --baseline records the previous layout
// without asserting the compact budget. UI selects levels; the hook is read-only.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options:{root:{type:'string'},output:{type:'string'},baseline:{type:'boolean',default:false}}});
const root=path.resolve(values.root||'preview-dist'), output=path.resolve(values.output||`docs/production-reports/evidence/compact-hud/browser-${Date.now()}`);
const started=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,baseline:values.baseline,profiles:[],
  limits:['Real Chromium with actual UI level selection and CDP touch; no entity, clock, hull, score, progression or save instrumentation writes.',
    'The explicit QA-unlock checkbox changes the preview save through its normal UI.',
    'Short scene/input regressions are not complete natural missions, aesthetic approval or physical iPhone/Safari certification.',
    'Viewport 390x714 represents reduced browser content height, not a simulation of browser chrome or notch.',
    'Service workers are blocked; no cache lifecycle certification. Instrumentation observes the existing RAF and adds no owner.']};
let server,browser,page,profile,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__COMPACT_HUD_QA__(),raf:{maximum:window.__COMPACT_HUD_RAF__.maximum,
  pending:window.__COMPACT_HUD_RAF__.pending.size,frames:window.__COMPACT_HUD_RAF__.frames,errors:[...window.__COMPACT_HUD_RAF__.errors]}}));
const wait=(fn,arg,timeout=60000)=>page.waitForFunction(fn,arg,{polling:100,timeout});
function clean(q){assert.deepEqual(profile.errors,[]);assert.deepEqual(profile.consoleErrors,[]);assert.deepEqual(profile.failedRequests,[]);
  assert.deepEqual(q.raf.errors,[]);assert.ok(q.legacyRunning);assert.ok(q.raf.maximum<=1,'Duplicate pending RAF owner');}
async function check(name,operation){const entry={name,status:'running'};profile.checks.push(entry);await save();const began=Date.now();
  console.log(`[compact HUD ${profile.id}] ${name}`);
  try{await operation();entry.snapshot=await inspect();clean(entry.snapshot);entry.status='passed';}
  catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-began;await save();}}
async function layout(){return page.evaluate(()=>{
  const state=window.__COMPACT_HUD_QA__(),canvas=document.querySelector('#canvas').getBoundingClientRect();
  const rect=node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=node=>{if(!node)return false;for(let at=node;at;at=at.parentElement){const s=getComputedStyle(at);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}const r=node.getBoundingClientRect();return r.width>0&&r.height>0;};
  const controls={};for(const id of ['hud','pause','flightHud','flightRoute','flightWeapon','flightObjective','powerHud','fire','skipWave','shockwave','slowTime']){
    const node=document.getElementById(id);if(visible(node))controls[id]={...rect(node),text:node.textContent.trim(),active:node.dataset.active||null};}
  const topIds=['hud','flightRoute'],topRects=topIds.map(id=>controls[id]).filter(Boolean);
  const safeTop=Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top'))||0;
  const stableTopBottom=topRects.length?Math.max(...topRects.map(r=>r.bottom)):0;
  const stableTopArea=topRects.reduce((sum,r)=>sum+r.width*r.height,0);
  const ship={left:canvas.left+(state.player.x-119)*canvas.width/state.W,right:canvas.left+(state.player.x+119)*canvas.width/state.W,
    top:canvas.top+(state.player.y-158)*canvas.height/state.H,bottom:canvas.top+(state.player.y+104)*canvas.height/state.H};
  return{controls,canvas:rect(document.querySelector('#canvas')),ship,bounds:state.bounds,viewport:{width:innerWidth,height:innerHeight},safeTop,
    stableTopBottom,stableTopHeightExcludingSafeArea:stableTopBottom-safeTop,stableTopArea,stableTopAreaShare:stableTopArea/(innerWidth*innerHeight),
    topReservedHeight:state.bounds?.minY?state.bounds.minY*canvas.height/state.H:0};
});}
function overlaps(a,b){return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;}
function verifyLayout(value){const{controls,viewport,ship,bounds}=value;
  assert.ok(bounds?.fits,'Collision outline does not fit the playable area');
  for(const[id,r]of Object.entries(controls))assert.ok(r.left>=-1&&r.top>=-1&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1,`${id} leaves the viewport`);
  for(const id of ['pause','flightWeapon','fire']){assert.ok(controls[id],`${id} hidden`);assert.ok(controls[id].width>=44&&controls[id].height>=44,`${id} target below 44px`);}
  const budget=viewport.width<=320?90:100;assert.ok(value.stableTopHeightExcludingSafeArea<=budget,`Stable HUD/route ${value.stableTopHeightExcludingSafeArea}px exceeds ${budget}px`);
  assert.ok(!overlaps(controls.hud,controls.flightRoute),'Route overlaps primary HUD');
  assert.ok(!overlaps(controls.flightWeapon,controls.fire),'Weapon overlaps firing button');
  if(controls.powerHud){assert.ok(!overlaps(controls.powerHud,controls.fire),'Powers overlap fire');assert.ok(!overlaps(controls.powerHud,controls.flightWeapon),'Powers overlap weapon');}
  for(const id of ['hud','flightRoute','flightWeapon','powerHud','fire'])if(controls[id])assert.ok(!overlaps(ship,controls[id]),`Ship illustration overlaps ${id}`);
}
async function capture(name){const file=`${profile.id}-${name}.png`;await page.screenshot({path:path.join(output,file),timeout:30000});
  const result=await layout();profile.screenshots.push({file,type:'Actual live game viewport in Chromium',layout:result,snapshot:await inspect()});await save();return result;}
async function launchLevel(index){await page.locator('#levels').click();await wait(()=>document.querySelectorAll('#levelGrid button').length===10);
  assert.equal(await page.locator('#levelGrid button:disabled').count(),0);await page.locator('#levelGrid button').nth(index).click();await page.locator('#launch').click();
  await wait(i=>{const q=__COMPACT_HUD_QA__();return q.state==='playing'&&q.currentLevel===i&&q.warpTimer===0&&q.elapsed>.12&&q.assets.every(a=>a.loaded);},index);
}
async function quit(){await page.locator('#pause').click();await page.locator('#quit').click();await wait(()=>__COMPACT_HUD_QA__().state==='menu');}
(async()=>{
  await prepareEvidence(output);evidenceReady=true;report.scriptSha256=sha256(await fs.readFile(__filename));
  report.git={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim()};
  const info=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));report.buildInfo={commit:info.commit,revision:info.revision,dirty:info.dirty};
  report.packageFiles={};for(const name of ['game.js','styles.css','index.html','content-runtime.js']){const bytes=await fs.readFile(path.join(root,'juego',name));report.packageFiles[name]={bytes:bytes.length,sha256:sha256(bytes)};}
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const[width,height]of[[390,844],[320,568],[390,714],[844,390],[1024,768]]){
    profile={id:`${width}x${height}`,width,height,status:'running',checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(45000);
    page.on('pageerror',e=>profile.errors.push(errorText(e)));page.on('console',m=>{if(m.type()==='error')profile.consoleErrors.push(m.text());});
    page.on('requestfailed',r=>profile.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)profile.failedRequests.push({url:r.url(),status:r.status()});});
    await page.addInitScript(()=>{const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),audit=window.__COMPACT_HUD_RAF__={pending:new Set(),maximum:0,frames:0,errors:[]};
      window.requestAnimationFrame=callback=>{const id=request(now=>{audit.pending.delete(id);audit.frames++;try{callback(now);}catch(e){audit.errors.push(e.stack||String(e));throw e;}});audit.pending.add(id);audit.maximum=Math.max(audit.maximum,audit.pending.size);return id;};window.cancelAnimationFrame=id=>{audit.pending.delete(id);cancel(id);};});
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');assert.equal(sha256(body),report.packageFiles['game.js'].sha256);
      const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
      const hook=`window.__COMPACT_HUD_QA__=()=>({state,currentLevel,elapsed,hull,collected,ammo,W,H,warpTimer,legacyRunning,runToken,
        player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},bounds:classicFlightBounds?{...classicFlightBounds}:null,
        input:{...classicFlightInput},flight:classicFlight?.snapshot()||null,transmission:flightTransmission?{...flightTransmission}:null,
        weapons:classicWeapons?{charges:classicWeapons.charges,recharge:classicWeapons.recharge,cooldown:classicWeapons.cooldown,elapsed:classicWeapons.elapsed,selected:classicWeapons.selected}:null,
        assets:Object.entries(SPRITES).filter(([,image])=>image.src).map(([id,image])=>({id,loaded:image.complete&&image.naturalWidth>0}))});\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});});
    await check('actual preview unlock and level selector launch Chronos',async()=>{await page.goto(server.url,{waitUntil:'load'});assert.equal(await page.locator('#qaArchive').getAttribute('open'),null);
      await page.locator('#qaArchive summary').click();await page.locator('#unlockClassic').check();await page.locator('#classiclink').click();
      await wait(()=>typeof __COMPACT_HUD_QA__==='function'&&__COMPACT_HUD_QA__().state==='menu');await launchLevel(0);
      profile.chronos=await capture('chronos');if(!values.baseline)verifyLayout(profile.chronos);});
    await check('Vulkar has a readable HUD and unobstructed ship',async()=>{await quit();await launchLevel(2);profile.vulkar=await capture('vulkar');if(!values.baseline)verifyLayout(profile.vulkar);});
    if(!values.baseline){
      const cdp=await context.newCDPSession(page),touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:7,radiusX:5,radiusY:5,force:1}]});
      await check('real relative touch can reach the newly exposed upper playfield',async()=>{const before=await inspect(),box=await page.locator('#canvas').boundingBox(),anchor={x:box.x+box.width*.50,y:box.y+box.height*.85};
        await touch('touchStart',anchor.x,anchor.y);const down=await inspect();assert.ok(Math.abs(down.player.target-before.player.target)<.01);assert.ok(Math.abs(down.player.targetY-before.player.targetY)<.01);
        await touch('touchMove',anchor.x,box.y+1);await touch('touchMove',anchor.x,box.y+1);const moved=await inspect();assert.equal(moved.player.targetY,moved.bounds.minY);
        await touch('touchCancel');assert.equal((await inspect()).input.active,false);await page.waitForTimeout(450);profile.upperField=await capture('upper-playfield');verifyLayout(profile.upperField);
        const field=profile.upperField;
        const upperPanels=['hud','flightRoute'].map(id=>field.controls[id]).filter(rect=>rect&&rect.right>field.canvas.left&&rect.left<field.canvas.right);
        assert.ok(field.ship.top>=Math.max(...upperPanels.map(rect=>rect.bottom))-1,'Ship clips an upper panel intersecting the Canvas');});
      await check('fire, pause and resume preserve clocks and active controls',async()=>{const before=await inspect();await page.locator('#fire').click();await wait(c=>__COMPACT_HUD_QA__().weapons.charges===c-1,before.weapons.charges);
        await page.locator('#pause').click();const paused=await inspect();assert.equal(paused.state,'paused');await page.waitForTimeout(500);const after=await inspect();assert.equal(after.elapsed,paused.elapsed);assert.deepEqual(after.weapons,paused.weapons);assert.deepEqual(after.flight,paused.flight);profile.pause={before:paused,after};
        await capture('pause');await page.locator('#resume').click();await wait(t=>__COMPACT_HUD_QA__().elapsed>t,paused.elapsed);assert.equal((await inspect()).state,'playing');});
      await check('restart resets charges and returning to menu hides all flight chrome',async()=>{await page.locator('#pause').click();const token=(await inspect()).runToken;await page.locator('#restart').click();await wait(t=>__COMPACT_HUD_QA__().runToken>t,token);
        const restarted=await inspect();assert.equal(restarted.currentLevel,2);assert.equal(restarted.weapons.charges,3);await quit();
        for(const id of ['flightRoute','flightObjective','flightWeapon','fire','powerHud'])assert.equal(await page.locator('#'+id).isVisible(),false,`${id} leaked onto menu`);
        if(await page.locator('#flightHud').count())assert.equal(await page.locator('#flightHud').isVisible(),false,'Flight wrapper leaked onto menu');await capture('menu');});
      if(width===390&&height===844)await check('all ten classic scenes launch through real level selection',async()=>{profile.levels=[];for(let index=0;index<10;index++){
        await launchLevel(index);const q=await inspect();assert.equal(q.currentLevel,index);const frame=await capture(`level-${String(index+1).padStart(2,'0')}`);verifyLayout(frame);profile.levels.push({level:index+1,layout:frame});await quit();}});
      await cdp.detach();
    }
    profile.status='passed';await save();await context.close();page=null;
  }
  for(const[name,recorded]of Object.entries(report.packageFiles))assert.equal(sha256(await fs.readFile(path.join(root,'juego',name))),recorded.sha256,`Package changed during QA: ${name}`);
  report.packageUnchanged=true;report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);if(profile)profile.status='failed';if(page){try{profile.failureSnapshot=await inspect();profile.failureLayout=await layout();}catch{}
    try{const file=`${profile?.id||'unknown'}-failure.png`;await page.screenshot({path:path.join(output,file),timeout:5000});profile.failureScreenshot=file;}catch{}}console.error(report.error);
}).finally(async()=>{report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();if(server)report.requests=server.requests;if(browser)await browser.close().catch(()=>{});if(server)await server.close().catch(()=>{});
  if(evidenceReady)await save();console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.length})),output,durationMs:report.durationMs}));process.exitCode=report.exitCode??1;});
