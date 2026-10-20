// One fresh, naturally played Chronos -> salvage -> C9 purchase -> departure.
// No save fixture, minted money, forced drops, time jumps, HP or entity writes.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');

const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},
  'expected-commit':{type:'string'},timeout:{type:'string'}}});
assert.ok(values.output&&/^[a-f0-9]{40}$/.test(values['expected-commit']||''),
  'Provide --output and full --expected-commit');
const root=path.resolve(values.root||'preview-dist'),output=path.resolve(values.output);
const timeout=Number(values.timeout||600000);
assert.ok(Number.isFinite(timeout)&&timeout>=30000&&timeout<=600000);
const started=Date.now();
const report={status:'running',exitCode:null,command:process.argv,sourceRoot:root,
  startedAt:new Date().toISOString(),pilotVersion:'fresh-chronos-manual-salvage-paid-c9-v1',
  checks:[],errors:[],consoleErrors:[],failedRequests:[],samples:[],screenshots:[],
  fireInputs:[],enemies:[],physicalDrops:[],claims:[],damage:[],
  limits:[
    'One fresh Chromium context; no localStorage/sessionStorage seeding, unlock, wallet or checkpoint fixtures.',
    'The QA pilot uses real menu, mouse and keyboard actions. It sees current positions/velocities and the real ship outline, not hidden aim, safe lanes or future AI targets.',
    'Read-only closure diagnostics and an observer around the existing RAF are inserted into a local response. Shipped package files remain unchanged.',
    'This test ends after the natural first C9 departure, not after ten stages or Gaia. A failure is retained; difficulty and money are not changed to obtain green.',
    'Automatic QA is not human playtesting, artistic acceptance, Safari or physical iPhone certification. Service workers are blocked.'
  ]};
let server,browser,page,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__SALVAGE_JOURNEY_QA__(),raf:{
  frames:window.__SALVAGE_JOURNEY_RAF__.frames,maximum:window.__SALVAGE_JOURNEY_RAF__.maximum,
  errors:[...window.__SALVAGE_JOURNEY_RAF__.errors]}}));
const wait=(fn,arg,ms=30000)=>page.waitForFunction(fn,arg,{polling:100,timeout:ms});
function healthy(q){
  assert.deepEqual(report.errors,[],'Uncaught JavaScript error');
  assert.deepEqual(report.consoleErrors,[],'Console error');
  assert.deepEqual(report.failedRequests,[],'Missing resource');
  assert.deepEqual(q.raf.errors,[],'RAF callback error');
  assert.ok(q.legacyRunning&&q.raf.maximum<=1,'Only the original game RAF may own gameplay');
  assert.equal(q.settingsAutoFire,false,'Natural manual run cannot enable automatic firing');
}
async function check(name,action){
  const entry={name,status:'running',startedAt:new Date().toISOString()},began=Date.now();
  report.checks.push(entry);await save();console.log(`[Natural salvage journey] ${name}`);
  try{await action();healthy(await inspect());entry.status='passed';}
  catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-began;await save();}
}
const captured=new Set();
async function capture(name,q){
  if(captured.has(name))return;captured.add(name);
  const file=`${String(report.screenshots.length+1).padStart(2,'0')}-${name}.png`;
  await page.screenshot({path:path.join(output,file)});
  report.screenshots.push({file,type:'Authentic game; fresh save and real inputs only',
    routeElapsed:q.flight?.elapsed,stage:q.flight?.stageId,hull:q.hull,collected:q.collected,
    balance:q.salvage?.balance,equipment:q.equipment});await save();
}
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

(async()=>{
  await prepareEvidence(output);evidenceReady=true;await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256=sha256(await fs.readFile(__filename));
  report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,values['expected-commit']);assert.equal(report.buildInfo.dirty,false);
  report.packageFiles={};
  for(const file of ['build-info.json','juego/game.js','juego/content-runtime.js','juego/styles.css']){
    const bytes=await fs.readFile(path.join(root,file));report.packageFiles[file]={bytes:bytes.length,sha256:sha256(bytes)};
  }
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser={version:browser.version(),viewport:{width:390,height:844},deviceScaleFactor:1};
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
  page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>report.errors.push(errorText(error)));
  page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)report.failedRequests.push({url:response.url(),status:response.status()});});
  await page.addInitScript(()=>{
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    const observer=window.__SALVAGE_JOURNEY_RAF__={pending:new Set(),maximum:0,frames:0,errors:[]};
    window.requestAnimationFrame=callback=>{
      const id=request(now=>{observer.pending.delete(id);observer.frames++;
        try{callback(now);}catch(error){observer.errors.push(error.stack||String(error));throw error;}});
      observer.pending.add(id);observer.maximum=Math.max(observer.maximum,observer.pending.size);return id;
    };
    window.cancelAnimationFrame=id=>{observer.pending.delete(id);cancel(id);};
  });
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
    assert.equal(sha256(body),report.packageFiles['juego/game.js'].sha256);
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2,'Legacy read-only observation marker changed');
    const hook=`window.__SALVAGE_JOURNEY_QA__=()=>({state,currentLevel,elapsed,hull,score,collected,W,H,
      legacyRunning,settingsAutoFire:settings.autoFire,warpTimer,manualShotCooldown,
      player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
      bounds:classicFlightBounds?{...classicFlightBounds}:null,outline:SHIP_COLLISION_OUTLINE,
      follow:9+settings.sensitivity/100*8,inputGain:settings.sensitivity/100,
      flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
      voyage:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null,
      equipment:JSON.parse(JSON.stringify(classicEquipment)),
      salvage:classicSalvageLedger?.getState(),
      weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
      unlocked:getUnlocked(),saves:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])),
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,s:item.s,r:item.r,vx:item.vx,vy:item.vy,
        observedVx:item.classicScout?.vx??item.vx??0,rot:item.rot,rs:item.rs,hp:item.hp,maxHp:item.maxHp,
        circles:collisionCircles(item).map(circle=>({...circle})),isPursuer:!!item.classicScout,role:item.classicScout?.role,
        pose:item.classicScout?.state,classicScoutProjectile:!!item.classicScoutProjectile,
        showerComet:!!item.showerComet,salvagePickup:!!item.salvagePickup,
        salvageDropId:item.salvageDropId,dropId:item.dropId,enemyType:item.enemyType,amount:item.amount}))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  await check('fresh main route starts with zero currency, Pulse and no recovered module or seeded unlock',async()=>{
    await page.goto(server.url,{waitUntil:'load'});
    const href=await page.locator('#classiclink').getAttribute('href');assert.ok(href&&!href.includes('campaign='));
    await page.locator('#classiclink').click();await wait(()=>typeof __SALVAGE_JOURNEY_QA__==='function'&&__SALVAGE_JOURNEY_QA__().state==='menu');
    const menu=await inspect();report.initial=menu;
    assert.equal(menu.unlocked,1);assert.equal(menu.equipment.recoveredTwin,false);
    assert.deepEqual(menu.equipment.unlocked,['pulse']);assert.equal(menu.salvage.balance,0);
    assert.equal(menu.salvage.earned,0);assert.equal(menu.salvage.spent,0);assert.deepEqual(menu.salvage.purchases,[]);
    await page.locator('#play').click();await page.locator('#launch').click();
    await wait(()=>__SALVAGE_JOURNEY_QA__().state==='playing'&&__SALVAGE_JOURNEY_QA__().warpTimer===0);
    const q=await inspect();assert.equal(q.flight.stageId,'1.1');assert.equal(q.weapons.charges,20);
    assert.equal(await page.locator('#ammo').isVisible(),false);await capture('fresh-chronos-zero-earned-currency',q);
  });
  const box=await page.locator('#canvas').boundingBox(),enemies=new Map(),drops=new Map(),claims=new Map();
  let previous,lastSample=0,lastProgress=0,attackObserved=false,service=false,departure=false;
  await check('naturally defeat pursuers, physically recover salvage and the emitter, then reach C9 alive',async()=>{
    const began=Date.now();
    while(Date.now()-began<timeout){
      const q=await inspect();healthy(q);
      if(previous&&q.hull<previous.hull)report.damage.push({routeElapsed:q.flight?.elapsed,
        stage:q.flight?.stageId,before:previous.hull,after:q.hull,nearby:previous.items.filter(item=>Math.abs(item.y-previous.player.y)<280)});
      previous=q;
      assert.ok(!['destroying','gameover'].includes(q.state),`Natural pilot lost: ${q.state}, hull${q.hull}, stage${q.flight?.stageId}, earned${q.salvage?.earned}`);
      assert.ok(q.flight&&q.flight.stageNumber<=6,'Test must stop at the first natural C9 departure');
      if(q.items.some(item=>item.classicScoutProjectile)){attackObserved=true;await capture('actual-pursuer-projectile',q);}
      for(const item of q.items){
        if(item.isPursuer){
          let record=enemies.get(item.id);
          if(!record){record={id:item.id,dropId:item.salvageDropId,role:item.role,firstElapsed:q.flight.elapsed,hp:[]};enemies.set(item.id,record);report.enemies.push(record);}
          if(record.hp.at(-1)!==item.hp)record.hp.push(item.hp);
        }
        if(item.salvagePickup&&!drops.has(item.dropId)){
          const record={dropId:item.dropId,amount:item.amount,enemyType:item.enemyType,position:{x:item.x,y:item.y},routeElapsed:q.flight.elapsed};
          drops.set(item.dropId,record);report.physicalDrops.push(record);await capture('real-salvage-after-enemy-destruction',q);
        }
      }
      for(const receipt of q.salvage.activeRun?.claimed||[]){
        if(claims.has(receipt.id))continue;
        const record={...receipt,routeElapsed:q.flight.elapsed,balance:q.salvage.balance};claims.set(receipt.id,record);report.claims.push(record);
        assert.ok(enemies.size>0,'Fresh money must follow a real encountered enemy');await capture('salvage-physically-collected-and-persisted',q);
      }
      assert.equal(q.salvage.balance,q.salvage.earned-q.salvage.spent);
      assert.equal(q.salvage.earned,[...(q.salvage.activeRun?.claimed||[])].reduce((sum,receipt)=>sum+receipt.amount,0),
        'A fresh ledger may contain only the actual receipts earned in this natural run');
      assert.deepEqual(q.equipment.unlocked,['pulse'],'Chronos/C9 must not grant the Atlas weapon');
      if(q.equipment.recoveredTwin)await capture('natural-emitter-recovered',q);
      if(Date.now()-lastSample>1500){
        report.samples.push({elapsed:q.elapsed,routeElapsed:q.flight.elapsed,stage:q.flight.stageId,
          state:q.state,hull:q.hull,collected:q.collected,stageGoal:q.flight.stageGoal,
          waitingFor:q.flight.waitingFor,earned:q.salvage.earned,balance:q.salvage.balance,
          charges:q.weapons.charges,entities:q.items.length,claims:claims.size,recovered:q.equipment.recoveredTwin});
        lastSample=Date.now();await save();
      }
      if(Date.now()-lastProgress>30000){console.log(`[Natural salvage journey] ${q.flight.stageId} route${q.flight.elapsed.toFixed(1)} hull${q.hull} salvage${q.salvage.balance} claims${claims.size}`);lastProgress=Date.now();}
      if(q.flight.waitingFor==='service'){
        assert.equal(q.state,'paused');assert.equal(q.flight.stageId,'1.6');assert.equal(q.flight.elapsed,183.2);
        assert.equal(q.equipment.recoveredTwin,true,'The natural pilot must recover the actual emitter');
        assert.ok(q.salvage.balance>=24,`Natural journey reached C9 without the required24: actual${q.salvage.balance}`);
        assert.ok(report.claims.length>=4,'At least four real raider drops must finance the first upgrade');
        assert.ok(report.physicalDrops.length>0,'Actual recoverable drops must be observed');
        report.beforePurchase=q;await capture('c9-funded-only-by-natural-combat',q);service=true;break;
      }
      assert.equal(q.state,'playing');
      const target=choosePilotTarget(q,attackObserved);
      await page.mouse.move(box.x+target.x*box.width/q.W,box.y+box.height*.72);
      if(target.enemy&&q.weapons.charges>0&&q.weapons.cooldown<=1e-8&&
        q.manualShotCooldown<=1e-8&&Math.abs(q.player.x-target.lead)<32){
        await page.keyboard.press('Space');const after=await inspect();
        assert.equal(after.weapons.shotSequence,q.weapons.shotSequence+1,'One real manual trigger must emit exactly one accepted shot');
        report.fireInputs.push({action:'Space',routeElapsed:q.flight.elapsed,targetId:target.enemy.id,
          targetHp:target.enemy.hp,shipX:q.player.x,observedTargetX:target.enemy.x,observedVx:target.enemy.observedVx,aimEstimate:target.lead});
      }
      await page.waitForTimeout(45);
    }
    assert.equal(service,true,`Natural journey did not reach C9 within${timeout}ms`);
    assert.equal(attackObserved,true);assert.ok(report.fireInputs.length>0);
  });
  await check('C9 charges legitimately earned salvage once, keeps Pulse and persists the paid module on departure',async()=>{
    const before=await inspect();assert.equal(before.state,'paused');
    const frozen=await inspect();assert.deepEqual(frozen.flight,before.flight);
    assert.match(await page.locator('#flightInstallTwin').innerText(),/24/);
    await page.locator('#flightInstallTwin').dblclick();const bought=await inspect();
    assert.equal(bought.salvage.balance,before.salvage.balance-24);assert.equal(bought.salvage.spent,24);
    assert.equal(bought.salvage.earned,before.salvage.earned);assert.equal(bought.salvage.purchases.length,1);
    assert.deepEqual(bought.salvage.purchases[0],{id:'c9:twin-preparation',sku:'twin-preparation',price:24});
    assert.equal(bought.equipment.twinPrepared,true);assert.deepEqual(bought.equipment.unlocked,['pulse']);
    await capture('c9-upgrade-paid-with-natural-salvage',bought);
    await page.locator('#flightDockContinue').click();
    await wait(()=>__SALVAGE_JOURNEY_QA__().state==='playing'&&__SALVAGE_JOURNEY_QA__().flight.elapsed>=185.6&&
      !__SALVAGE_JOURNEY_QA__().flight.relay.visible);
    const after=await inspect();assert.equal(after.flight.stageId,'1.6');assert.equal(after.flight.waitingFor,null);
    assert.equal(after.equipment.twinPrepared,true);assert.deepEqual(after.equipment.unlocked,['pulse']);
    assert.deepEqual(after.salvage,bought.salvage,'Departure must not charge again or manufacture money');
    assert.ok(after.voyage.checkpoint.eventIds.includes('chronos-voyage:1.6:service-complete'));
    report.purchase={beforeBalance:before.salvage.balance,afterBalance:bought.salvage.balance,price:24,
      earnedOnlyByReceipts:bought.salvage.earned,receipt:bought.salvage.purchases[0]};
    report.final=after;departure=true;await capture('natural-paid-c9-departure',after);
  });
  assert.equal(departure,true);report.status='passed';report.exitCode=0;
})().catch(async error=>{
  report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(page){report.failureSnapshot=await inspect().catch(error=>({inspectionError:errorText(error)}));
    if(evidenceReady)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(report.packageFiles)for(const [file,before]of Object.entries(report.packageFiles)){
    try{assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,`Package changed:${file}`);}
    catch(error){report.status='failed';report.exitCode=1;process.exitCode=1;report.error??=errorText(error);}
  }
  await browser?.close();await server?.close();report.durationMs=Date.now()-started;
  if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,
    checks:report.checks.map(item=>({name:item.name,status:item.status})),output,error:report.error}));
});
