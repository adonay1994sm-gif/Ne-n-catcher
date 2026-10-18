// Full fresh chapter-one browser pilot: no minted money, stage unlock, HP,
// entity insertion or clock writes. Read-only diagnostics and actual inputs.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},timeout:{type:'string'},
  'expected-commit':{type:'string'},'skip-intro':{type:'boolean',default:false}}});
assert.ok(values.output&&/^[a-f0-9]{40}$/.test(values['expected-commit']||''),'Provide --output and full --expected-commit');
const root=path.resolve(values.root||'preview-dist'),output=path.resolve(values.output),timeout=Number(values.timeout||900000);
assert.ok(Number.isFinite(timeout)&&timeout>=120000&&timeout<=1200000,'Timeout must be 120000–1200000 ms');
const started=Date.now(),report={status:'running',exitCode:null,command:process.argv,sourceRoot:root,
  startedAt:new Date().toISOString(),pilotVersion:'chapter-one-fresh-manual-missiles-v1',skipIntro:values['skip-intro'],
  checks:[],errors:[],consoleErrors:[],failedRequests:[],samples:[],screenshots:[],manualShots:[],missiles:[],
  enemies:[],physicalDrops:[],claims:[],damage:[],limits:[
    'Fresh Chromium context with no saved progress, currency, equipment or health fixtures.',
    'Complete natural 360-second Chronos-to-Gaia route plus C9, frontier combat and story conclusion; wall time may exceed nine minutes.',
    'QA pilot adapted from salvage-journey-browser-smoke.cjs and guardian-atlas-browser-smoke.cjs; current visible positions, velocities, collision outline and observed combat states inform actual input choices.',
    'Read-only diagnostics and draw/RAF observation are inserted into a local response; no production file, simulation time, entity or inventory is changed.',
    'Short two-contact exercise uses actual Chromium CDP input; the rest of the pilot uses mouse movement and real keyboard/button actions.',
    'Service workers are blocked. This is not an offline, aesthetic, human balance or physical iPhone certification.'
  ]};
let server,browser,context,page,cdp,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__CHAPTER_ONE_QA__(),raf:{
  frames:window.__CHAPTER_ONE_OBSERVER__.frames,maximum:window.__CHAPTER_ONE_OBSERVER__.maximum,
  errors:[...window.__CHAPTER_ONE_OBSERVER__.errors]},draw:{...window.__CHAPTER_ONE_OBSERVER__.draw}}));
const wait=(fn,arg,ms=30000)=>page.waitForFunction(fn,arg,{polling:100,timeout:ms});
function healthy(q){
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.failedRequests,[]);
  assert.deepEqual(q.raf.errors,[]);assert.ok(q.legacyRunning&&q.raf.maximum<=1,'Single existing RAF owner');
  assert.equal(q.settingsAutoFire,false,'This run must remain manual');
}
async function check(name,action){const entry={name,status:'running',startedAt:new Date().toISOString()};
  const began=Date.now();report.checks.push(entry);await save();console.log('[Chapter one] '+name);
  try{await action();healthy(await inspect());entry.status='passed';}
  catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-began;await save();}}
const captured=new Set();
async function capture(name,q){if(captured.has(name))return;captured.add(name);
  const file=String(report.screenshots.length+1).padStart(2,'0')+'-'+name+'.png';
  await page.screenshot({path:path.join(output,file)});report.screenshots.push({file,
    type:'Actual gameplay; fresh save, read-only observation and actual inputs',stage:q.flight?.stageId,
    routeElapsed:q.flight?.elapsed,hull:q.hull,reserve:q.reserve,balance:q.salvage?.balance,
    boss:q.boss&&{state:q.boss.state,hp:q.boss.hp,phase:q.boss.phase}});await save();}
function alive(q){assert.ok(!['destroying','gameover'].includes(q.state),
  'Natural pilot lost: '+JSON.stringify({state:q.state,hull:q.hull,reserve:q.reserve,stage:q.flight?.stageId,boss:q.boss}));}

// Pilot scoring adapted from the two existing natural-input regression scripts.
function touchesOutline(x,y,radius,outline){
  let inside=false;
  for(let index=0,previous=outline.length-1;index<outline.length;previous=index++){
    const [ax,ay]=outline[previous],[bx,by]=outline[index];
    if((by>y)!==(ay>y)&&x<(ax-bx)*(y-by)/((ay-by)||.000001)+bx)inside=!inside;
    const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
    const along=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
    if((x-ax-along*dx)**2+(y-ay-along*dy)**2<=radius**2)return true;
  }
  return inside;
}
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
function choosePilotTarget(q,attackObserved){
  const ship=q.player,bounds=q.bounds||{minX:119,maxX:q.W-119};
  const pickups=q.items.filter(item=>['flightModule','salvage','energy','shield'].includes(item.type)&&item.y<ship.y+80);
  const part=pickups.find(item=>item.type==='flightModule'&&!q.equipment.recoveredTwin);
  const loot=pickups.filter(item=>item.salvagePickup).sort((a,b)=>b.y-a.y)[0];
  const energy=pickups.filter(item=>item.type==='energy').sort((a,b)=>b.y-a.y)[0];
  const enemies=q.items.filter(item=>item.isPursuer&&item.hp>0&&item.y>80&&item.y<ship.y-270)
    .sort((a,b)=>a.hp-b.hp||b.y-a.y);
  const enemy=attackObserved?enemies[0]:null;
  const lead=enemy?enemy.x+clamp(enemy.observedVx*Math.max(0,(ship.y-125-enemy.y)/920)*.75,-100,100):null;
  const objective=part||loot;
  const aim=objective?.x??(enemy?lead:energy?.x??ship.x);
  const weight=part?2.2:loot?1.6:enemy?1.1:.5;
  const candidates=[aim,ship.x,ship.target,bounds.minX,bounds.maxX,
    ...pickups.slice(0,6).map(item=>item.x)];
  for(let x=bounds.minX;x<=bounds.maxX;x+=24)candidates.push(x);
  const threats=q.items.filter(item=>['meteor','debris','satellite','scout'].includes(item.type));
  const follow=q.follow*(q.inputGain||1);
  const cost=x=>{
    let total=Math.abs(x-aim)*weight+Math.abs(x-ship.x)*.035;
    for(const item of threats){
      const vy=item.vy??item.s??0,vx=item.observedVx??item.vx??0;
      if(item.y>ship.y+180||item.y+Math.max(0,vy)*1.4<ship.y-230)continue;
      for(let future=0;future<=1.4;future+=.045){
        const px=x+(ship.x-x)*Math.exp(-follow*future);
        const tx=item.x+vx*future,ty=item.y+vy*future,rotation=(item.rot||0)+(item.rs||0)*future;
        for(const circle of item.circles||[{x:0,y:0,r:item.r}]){
          const localX=tx+circle.x*Math.cos(rotation)-circle.y*Math.sin(rotation)-px;
          const localY=ty+circle.x*Math.sin(rotation)+circle.y*Math.cos(rotation)-ship.y;
          if(touchesOutline(localX,localY,circle.r+14,q.outline)){total+=1000000/(.2+future);break;}
        }
      }
    }
    return total;
  };
  const x=[...new Set(candidates.filter(Number.isFinite).map(value=>clamp(value,bounds.minX,bounds.maxX)))]
    .map(x=>({x,cost:cost(x)})).sort((a,b)=>a.cost-b.cost)[0].x;
  return {x,enemy,lead,objective:objective?.type||'combat-or-energy'};
}

function combatTarget(q) {
  const ship = q.player, aim = q.boss.x ?? q.W / 2;
  const minimum = q.bounds?.minX ?? 119, maximum = q.bounds?.maxX ?? q.W - 119;
  const clampX = x => Math.max(minimum, Math.min(maximum, x));
  const outlineLeft = Math.min(...q.outline.map(point => point[0]));
  const outlineRight = Math.max(...q.outline.map(point => point[0]));
  const outlineTop = Math.min(...q.outline.map(point => point[1]));
  const outlineBottom = Math.max(...q.outline.map(point => point[1]));
  const threats = q.items.filter(item => item.guardianProjectile &&
    item.y - item.r < ship.y + outlineBottom + 12);
  const candidates = [aim, ship.x, ship.target, minimum, maximum];
  for (let x = minimum; x <= maximum; x += 20) candidates.push(x);
  for (const shot of threats) {
    // Candidate positions come from observed bullet trajectories. They are
    // evaluated against the actual polygon, including the complete move path.
    const crossing = Math.max(0, (ship.y - shot.y) / Math.max(1, shot.vy || shot.s || 1));
    const crossingX = shot.x + (shot.vx || 0) * crossing;
    candidates.push(crossingX + outlineLeft - shot.r - 18,
      crossingX + outlineRight + shot.r + 18);
  }
  const horizon = 4.1, stride = .055;
  const effectiveFollow = q.follow * (q.inputGain || 1);
  const cost = x => {
    // Return to firing alignment when safe, without sacrificing a viable dodge
    // merely to spend a charge. The movement term prevents pointless jitter.
    let value = Math.abs(x - aim) * (q.boss.vulnerability ? .25 : .08) +
      Math.abs(x - ship.x) * .055;
    for (const shot of threats) {
      const speed = shot.vy || shot.s || 1;
      const radius = shot.r + 10;
      const enters = Math.max(0, (ship.y + outlineTop - radius - shot.y) / speed);
      const exits = Math.min(horizon, (ship.y + outlineBottom + radius - shot.y) / speed);
      if (enters > exits) continue;
      for (let future = enters; future <= exits + 1e-8; future += stride) {
        const playerX = x + (ship.x - x) * Math.exp(-effectiveFollow * future);
        const localX = shot.x + (shot.vx || 0) * future - playerX;
        const localY = shot.y + speed * future - ship.y;
        if (localX < outlineLeft - radius || localX > outlineRight + radius) continue;
        if (touchesOutline(localX, localY, radius, q.outline)) {
          value += 1000000 / (.2 + future);
          break;
        }
        // A small clearance preference makes narrow-grazing plans less likely
        // under the finite polling interval and actual pointer latency.
        value += Math.max(0, 24 - Math.abs(localX)) / (2 + future);
      }
    }
    return value;
  };
  return [...new Set(candidates.filter(Number.isFinite).map(clampX))]
    .map(x => ({x, cost: cost(x)})).sort((a, b) => a.cost - b.cost)[0].x;
}


(async()=>{
  await prepareEvidence(output);evidenceReady=true;await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256=sha256(await fs.readFile(__filename));
  report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,values['expected-commit']);assert.equal(report.buildInfo.dirty,false);
  report.packageFiles={};
  for(const file of ['build-info.json','juego/game.js','juego/content-runtime.js','juego/styles.css','juego/index.html']){
    const bytes=await fs.readFile(path.join(root,file));report.packageFiles[file]={bytes:bytes.length,sha256:sha256(bytes)};}
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser={version:browser.version(),viewport:{width:390,height:844},deviceScaleFactor:1};
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  page=await context.newPage();page.setDefaultTimeout(20000);cdp=await context.newCDPSession(page);
  page.on('pageerror',error=>report.errors.push(errorText(error)));
  page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)report.failedRequests.push({url:response.url(),status:response.status()});});
  await page.addInitScript(()=>{
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    const q=window.__CHAPTER_ONE_OBSERVER__={pending:new Set(),maximum:0,frames:0,errors:[],draw:{}};
    window.requestAnimationFrame=callback=>{const id=request(now=>{q.pending.delete(id);q.frames++;
      try{callback(now);}catch(error){q.errors.push(error.stack||String(error));throw error;}});
      q.pending.add(id);q.maximum=Math.max(q.maximum,q.pending.size);return id;};
    window.cancelAnimationFrame=id=>{q.pending.delete(id);cancel(id);};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){const result=Reflect.apply(draw,this,[image,...args]);
      const file=image?.src?.split('/').at(-1)?.split('?')[0];if(file&&this.canvas?.id==='canvas')q.draw[file]=(q.draw[file]||0)+1;return result;};
  });
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
    assert.equal(sha256(body),report.packageFiles['juego/game.js'].sha256);
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
    const hook=`window.__CHAPTER_ONE_QA__=()=>({state,currentLevel,elapsed,hull,score,collected,W,H,legacyRunning,
      settingsAutoFire:settings.autoFire,warpTimer,manualShotCooldown,reserve:classicHullReserve,reserveCapacity:classicHullReserveCapacity,
      shipVisual:{...SHIP_VISUAL},player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
      input:{...classicFlightInput},fireInput:typeof fireInput==='undefined'?null:fireInput?{...fireInput}:null,
      bounds:classicFlightBounds?{...classicFlightBounds}:null,outline:SHIP_COLLISION_OUTLINE,
      follow:9+settings.sensitivity/100*8,inputGain:settings.sensitivity/100,
      flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      chapter:classicChapterView?JSON.parse(JSON.stringify(classicChapterView)):null,
      voyage:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),salvage:classicSalvageLedger?.getState(),
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      boss:atlasBoss?{x:atlasBoss.x,y:atlasBoss.y,r:atlasBoss.r,coreRadius:atlasBoss.coreRadius,state:atlasBoss.state,
        stateTime:atlasBoss.stateTime,age:atlasBoss.age,version:atlasBoss.version,hp:atlasBoss.hp,maxHp:atlasBoss.maxHp,
        vulnerability:atlasBoss.vulnerability,phase:atlasBoss.phase,attackTier:atlasBoss.attackTier,
        disabled:atlasBoss.disabled,resolved:atlasBoss.resolved}:null,
      unlocked:getUnlocked(),saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])),
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        observedVx:item.classicScout?.vx??item.vx??0,rot:item.rot,rs:item.rs,hp:item.hp,maxHp:item.maxHp,
        circles:collisionCircles(item),isPursuer:!!item.classicScout,role:item.classicScout?.role,
        pose:item.classicScout?.state,classicScoutProjectile:!!item.classicScoutProjectile,
        guardianProjectile:!!item.guardianProjectile,projectileId:item.projectileId,attackId:item.attackId,
        showerComet:!!item.showerComet,salvagePickup:!!item.salvagePickup,
        salvageDropId:item.salvageDropId,dropId:item.dropId,enemyType:item.enemyType,amount:item.amount}))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  await check('start a fresh chapter, capture the real opening and keep all progression unseeded',async()=>{
    await page.goto(server.url,{waitUntil:'load'});assert.equal(await page.locator('#classiclink').count(),1);
    await page.locator('#classiclink').click();await wait(()=>typeof __CHAPTER_ONE_QA__==='function'&&__CHAPTER_ONE_QA__().state==='menu');
    const menu=await inspect();report.initial=menu;
    assert.equal(menu.unlocked,1);assert.equal(menu.salvage.balance,0);assert.equal(menu.salvage.earned,0);
    assert.equal(menu.salvage.missileAmmo,3);assert.deepEqual(menu.equipment.unlocked,['pulse']);
    await capture('main-menu-before',menu);await page.locator('#play').click();await page.locator('#launch').click();
    await wait(()=>__CHAPTER_ONE_QA__().state==='playing'&&__CHAPTER_ONE_QA__().warpTimer===0);
    await wait(()=>__CHAPTER_ONE_QA__().chapter?.opening?.active);
    await wait(()=>window.__CHAPTER_ONE_OBSERVER__.draw['chapter1_intro_atlas_v1.webp']>0);
    const opening=await inspect();assert.equal(opening.flight.stageId,'1.1');assert.equal(opening.reserve,30);
    assert.equal(opening.weapons.charges,20);assert.equal(opening.shipVisual.assemblySize,83.2);
    await capture('chronos-cinematic-opening',opening);
    assert.ok(opening.draw['chapter1_intro_atlas_v1.webp']>0,'The actual opening must draw its registered illustration');
    if(values['skip-intro']){await page.locator('#chapterSkip').click();report.introSkippedUsingControl=true;}
    await wait(()=>!__CHAPTER_ONE_QA__().chapter.opening.controlsLocked,undefined,40000);
    assert.equal(await page.locator('#ammo').isVisible(),false);
  });
  await check('pilot and shoot with two actual contacts without jumping or transferring ownership',async()=>{
    const canvas=await page.locator('#canvas').boundingBox(),fire=await page.locator('#fire').boundingBox();
    const pilot={id:17,x:canvas.x+canvas.width*.46,y:canvas.y+canvas.height*.68,radiusX:5,radiusY:5,force:1};
    const action={id:29,x:fire.x+fire.width*.5,y:fire.y+fire.height*.5,radiusX:5,radiusY:5,force:1};
    const before=await inspect();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pilot]});
    await wait(()=>__CHAPTER_ONE_QA__().input.active);
    const anchored=await inspect();assert.ok(Math.abs(anchored.player.target-before.player.target)<.01);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pilot,action]});
    await wait(sequence=>__CHAPTER_ONE_QA__().weapons.shotSequence>sequence,before.weapons.shotSequence);
    const held=await inspect();assert.ok(held.fireInput);assert.notEqual(held.fireInput.id,held.input.id);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...pilot,x:pilot.x-15,y:pilot.y-12},action]});
    await wait(target=>__CHAPTER_ONE_QA__().player.target<target,anchored.player.target);
    const moved=await inspect();assert.ok(moved.player.targetY<anchored.player.targetY);
    await capture('two-finger-flight-and-fire',moved);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await wait(()=>!__CHAPTER_ONE_QA__().input.active&&!__CHAPTER_ONE_QA__().fireInput);
    report.twoContacts={before,anchored,held,moved};
  });
  const enemies=new Map(),drops=new Map(),claims=new Map(),bossStates=new Set(),bossTiers=new Set(),stages=new Set();
  let previous,lastSample=0,lastProgress=0,attackObserved=false,service=false,paused=false,completed=false,blockedMissile=null;
  let lastMove=null,initialBossBattery=null;
  await check('naturally fly all ten stages, earn physical salvage, purchase at C9 and defeat the real frontier guardian',async()=>{
    while(Date.now()-started<timeout){
      const q=await inspect();healthy(q);alive(q);stages.add(q.flight?.stageId);
      if(previous&&(q.hull<previous.hull||q.reserve<previous.reserve))report.damage.push({routeElapsed:q.flight?.elapsed,
        beforeHull:previous.hull,afterHull:q.hull,beforeReserve:previous.reserve,afterReserve:q.reserve});
      previous=q;
      assert.equal(q.salvage.balance,q.salvage.earned-q.salvage.spent);
      if(q.items.some(item=>item.classicScoutProjectile)){attackObserved=true;await capture('pursuer-real-projectile',q);}
      for(const item of q.items){
        if(item.isPursuer&&!enemies.has(item.id)){const record={id:item.id,role:item.role,firstElapsed:q.flight.elapsed};enemies.set(item.id,record);report.enemies.push(record);}
        if(item.salvagePickup&&!drops.has(item.dropId)){const record={dropId:item.dropId,amount:item.amount,enemyType:item.enemyType,routeElapsed:q.flight.elapsed};
          drops.set(item.dropId,record);report.physicalDrops.push(record);await capture('enemy-destruction-physical-salvage',q);}
      }
      for(const receipt of q.salvage.activeRun?.claimed||[])if(!claims.has(receipt.id)){
        const record={...receipt,routeElapsed:q.flight.elapsed};claims.set(receipt.id,record);report.claims.push(record);}
      if(Date.now()-lastSample>2000){report.samples.push({wallMs:Date.now()-started,elapsed:q.elapsed,
        routeElapsed:q.flight?.elapsed,stage:q.flight?.stageId,state:q.state,hull:q.hull,reserve:q.reserve,
        balance:q.salvage.balance,missileAmmo:q.salvage.missileAmmo,collected:q.collected,boss:q.boss});lastSample=Date.now();await save();}
      if(Date.now()-lastProgress>30000){console.log('[Chapter one] '+JSON.stringify({stage:q.flight?.stageId,route:q.flight?.elapsed,
        hull:q.hull,reserve:q.reserve,balance:q.salvage.balance,boss:q.boss&&{hp:q.boss.hp,state:q.boss.state}}));lastProgress=Date.now();}
      if(q.state==='complete'){report.final= q;await capture('chapter-one-complete',q);completed=true;break;}
      if(q.chapter?.aftermath?.active){await capture('gaia-iria-vulkar-aftermath',q);await page.waitForTimeout(75);continue;}
      if(q.flight?.waitingFor==='service'){
        assert.equal(service,false,'C9 cannot repeat in the same run');assert.equal(q.state,'paused');
        assert.ok(q.equipment.recoveredTwin,'The actual emitter must have been recovered');
        assert.ok(q.salvage.balance>=24,'Natural loot must finance C9; no money injection is allowed');
        assert.ok(report.physicalDrops.length>0&&report.claims.length>0);
        await capture('c9-before-natural-purchase',q);const before=q;
        await page.locator('#flightInstallTwin').click();const after=await inspect();
        assert.equal(after.salvage.balance,before.salvage.balance-24);assert.equal(after.salvage.spent,before.salvage.spent+24);
        assert.equal(after.equipment.twinPrepared,true);assert.deepEqual(after.equipment.unlocked,['pulse']);
        const receipt=after.salvage.purchases.find(item=>item.sku==='twin-preparation');assert.equal(receipt.price,24);
        const button=await page.locator('#flightInstallTwin').boundingBox();
        await page.mouse.click(button.x+button.width/2,button.y+button.height/2);
        assert.deepEqual((await inspect()).salvage,after.salvage,'Repeated disabled purchase cannot debit money');
        report.c9={before,after,receipt};await capture('c9-after-paid-preparation',after);
        await page.locator('#flightDockContinue').click();service=true;lastMove=null;
        await wait(()=>__CHAPTER_ONE_QA__().state==='playing');continue;
      }
      assert.equal(q.state,'playing');
      if(q.boss){
        assert.equal(q.currentLevel,0);assert.equal(q.boss.version,'guardian-atlas-v5');assert.equal(q.boss.maxHp,96);
        assert.ok(q.flight.canFinish);assert.equal(q.flight.stageNumber,10);assert.ok(q.flight.elapsed>=360);
        if(!initialBossBattery)initialBossBattery={charges:q.weapons.charges,recharge:q.weapons.recharge};
        if(!q.boss.disabled){assert.equal(q.weapons.unlimitedFire,true);
          assert.equal(q.weapons.charges,initialBossBattery.charges);assert.equal(q.weapons.recharge,initialBossBattery.recharge);}
        bossStates.add(q.boss.state);if(q.boss.attackTier)bossTiers.add(q.boss.attackTier);
        if(q.boss.state==='opening')await capture('atlas-opening-core',q);
        if(q.boss.state==='exposed')await capture('atlas-exposed-core',q);
        if(q.boss.phase===2)await capture('atlas-second-phase',q);
        if(q.boss.disabled){await capture('atlas-disabled-before-story-resolution',q);await page.waitForTimeout(70);continue;}
        if(!paused&&q.boss.state==='closed'){
          await page.locator('#pause').click();const before=await inspect();await page.waitForTimeout(350);const after=await inspect();
          assert.equal(after.state,'paused');assert.deepEqual(after.boss,before.boss);assert.deepEqual(after.weapons,before.weapons);
          assert.equal(after.reserve,before.reserve);assert.equal(after.elapsed,before.elapsed);
          assert.deepEqual(after.salvage,before.salvage);await page.locator('#resume').click();paused=true;continue;
        }
        const destination=combatTarget(q),box=await page.locator('#canvas').boundingBox();
        if(lastMove===null||Math.abs(lastMove-destination)>2){await page.mouse.move(box.x+destination*box.width/q.W,box.y+box.height*.7);lastMove=destination;}
        const aligned=Math.abs(q.player.x-q.boss.x)<Math.max(12,q.boss.coreRadius*.65);
        if(report.missiles.length===0&&q.boss.state==='closed'&&q.boss.stateTime<.35&&aligned&&q.salvage.missileAmmo>0){
          const before=await inspect();await page.locator('#classicMissile').click();const after=await inspect();
          assert.equal(after.salvage.missileAmmo,before.salvage.missileAmmo-1);
          assert.equal(after.salvage.missileShotsSpent,before.salvage.missileShotsSpent+1);
          const shot=after.weapons.projectiles.find(item=>item.weapon==='missile');assert.ok(shot);
          assert.equal(after.boss.hp,before.boss.hp,'Missile emission cannot apply instant damage');
          blockedMissile={id:shot.id,hp:before.boss.hp};report.missiles.push({kind:'closed-armour',before,after});
        }
        if(blockedMissile&&!q.weapons.projectiles.some(shot=>shot.id===blockedMissile.id)){
          assert.equal(q.boss.hp,blockedMissile.hp,'Closed armour must reject the first physical missile');
          blockedMissile=null;
        }
        const flightTime=Math.max(0,(q.player.y-50-q.boss.y)/760);
        const exposureRemaining=4.2-q.boss.stateTime;
        if(q.boss.vulnerability&&aligned&&exposureRemaining>flightTime+.25){
          if(q.salvage.missileAmmo>0&&report.missiles.length<3&&q.weapons.missileCooldown<=1e-8){
            const before=await inspect();await page.locator('#classicMissile').click();const after=await inspect();
            assert.equal(after.salvage.missileAmmo,before.salvage.missileAmmo-1);
            assert.equal(after.salvage.missileShotsSpent,before.salvage.missileShotsSpent+1);
            const shot=after.weapons.projectiles.find(item=>item.weapon==='missile'&&!before.weapons.projectiles.some(old=>old.id===item.id));
            assert.ok(shot&&shot.y>after.boss.y+after.boss.coreRadius,'A missile must originate away from the core and travel physically');
            if(before.weapons.projectiles.length===0)assert.equal(after.boss.hp,before.boss.hp,'An isolated emission cannot apply instant damage');
            report.missiles.push({kind:'exposed-core',before,after});await capture('special-missile-real-flight',after);
          }
          if(q.manualShotCooldown<=1e-8&&q.weapons.cooldown<=1e-8){
            const before=await inspect();await page.keyboard.press('Space');const after=await inspect();
            assert.equal(after.weapons.shotSequence,before.weapons.shotSequence+1);
            assert.equal(after.weapons.charges,before.weapons.charges);
            report.manualShots.push({elapsed:q.elapsed,coreHpBefore:before.boss.hp,shotSequence:after.weapons.shotSequence});
          }
        }
      }else{
        const target=choosePilotTarget(q,attackObserved),box=await page.locator('#canvas').boundingBox();
        if(lastMove===null||Math.abs(lastMove-target.x)>2){await page.mouse.move(box.x+target.x*box.width/q.W,box.y+box.height*.72);lastMove=target.x;}
        if(target.enemy&&q.weapons.charges>0&&q.weapons.cooldown<=1e-8&&q.manualShotCooldown<=1e-8&&Math.abs(q.player.x-target.lead)<32){
          await page.keyboard.press('Space');report.manualShots.push({elapsed:q.elapsed,targetId:target.enemy.id});}
      }
      await page.waitForTimeout(65);
    }
    assert.equal(completed,true,'Full natural chapter did not finish before its explicit timeout');
    assert.equal(service,true);assert.equal(paused,true);assert.ok(stages.size===10,'All ten actual stages must be observed');
    assert.equal(report.missiles.length,3,'Use all three real persistent special missiles');
    for(const state of ['closed','opening','exposed','closing','disabled'])assert.ok(bossStates.has(state),'Missing actual boss state '+state);
    assert.ok(bossTiers.has('basic')&&bossTiers.has('medium')&&bossTiers.has('superpower'),'All three authored attack tiers must be observed');
    assert.ok(report.final.chapter.aftermathReady);assert.equal(report.final.unlocked,2);
    assert.ok(report.final.equipment.unlocked.includes('twin'));assert.equal(report.final.equipment.unlocked.includes('lance'),false);
    assert.equal(report.final.salvage.missileAmmo,0);
    assert.ok(report.final.draw['chapter1_missile_atlas_v1.webp']>0,'The special projectile must draw its actual asset');
    report.route={stages:[...stages],bossStates:[...bossStates],attackTiers:[...bossTiers],physicalClaims:report.claims.length};
  });
  await check('victory and story arrival persist exactly once across a normal reload',async()=>{
    const q=await inspect(),before=q.saves;
    const receipt=q.salvage.activeRun?.claimed.filter(item=>item.enemyType==='atlas')||[];
    assert.equal(receipt.length,1);assert.equal(receipt[0].amount,600);
    assert.ok(q.voyage.completed);assert.ok(q.voyage.chapter.signalIds.includes('atlas-disabled'));
    await page.waitForTimeout(350);assert.deepEqual((await inspect()).salvage,q.salvage);
    await page.reload({waitUntil:'load'});await wait(()=>typeof __CHAPTER_ONE_QA__==='function'&&__CHAPTER_ONE_QA__().state==='menu');
    const restored=await inspect();assert.equal(restored.unlocked,2);assert.equal(restored.salvage.missileAmmo,0);
    assert.deepEqual(restored.salvage,q.salvage);assert.deepEqual(restored.equipment,q.equipment);
    for(const [key,value]of Object.entries(before))assert.equal(restored.saves[key],value,'Reload changed persisted field '+key);
    await capture('chapter-arrival-persisted-after-reload',restored);report.reloaded=restored;
  });
  report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(page){report.failureSnapshot=await inspect().catch(error=>({inspectionError:errorText(error)}));
    if(evidenceReady)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(report.packageFiles)for(const[file,before]of Object.entries(report.packageFiles))try{
    assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,'Package changed during QA: '+file);
  }catch(error){report.status='failed';report.exitCode=1;report.error??=errorText(error);process.exitCode=1;}
  await cdp?.detach().catch(()=>{});await context?.close();await browser?.close();await server?.close();
  report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,checks:report.checks.map(item=>({name:item.name,status:item.status})),durationMs:report.durationMs,output,error:report.error}));
});
