// Current level-one controlled browser scenes, never a natural playthrough.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},'expected-commit':{type:'string'}}});
assert.ok(values.root&&values.output&&/^[a-f0-9]{40}$/.test(values['expected-commit']||''),
  'Usage: node scripts/current-level-visual-smoke.cjs --root IMMUTABLE_PACKAGE --output UNIQUE_DIRECTORY --expected-commit FULL_SHA');
const root=path.resolve(values.root),output=path.resolve(values.output),began=Date.now();
const report={status:'running',exitCode:null,command:process.argv,sourceRoot:root,startedAt:new Date().toISOString(),
  executionKind:'CONTROLLED_REAL_RENDERER_UI_AUDIO_AND_PHYSICAL_MISSILE_NOT_NATURAL',profiles:[],limits:[
    'Fresh contexts at390x844 and320x568. The opening, workshop, purchases, focus, escape and re-entry use real UI controls.',
    'C9 is an explicit declared stage-three fixture with recovered emitter, hull62, reserve12,48 fixture scrap and one missile; amounts are granted through the real ledger and never described as earned.',
    'Atlas is established from a valid stage-ten checkpoint. The single legacy RAF is then explicitly stopped for controlled model/update steps and restarted once per profile at the end.',
    'Accepted model hits resolve phase contracts for the conclusion fixture; they do not certify balance. The missile test launches a real physical projectile and advances actual collision/update before reading its impact.',
    'Only a temporary HTTP response receives the fixture and observation API. Original package files are hashed before and after. No production file, second RAF or original save is modified.',
    'Sound measurements show decoded sample playback, not listening quality. Browser viewport emulation is not physical Safari/iPhone certification.'
  ]};
let browser,context,page,server,profile,ready=false;
const save=()=>saveEvidence(output,report);
const snapshot=()=>page.evaluate(()=>window.__CURRENT_LEVEL_QA__.snapshot());
const fixture=(name,...args)=>page.evaluate(({name,args})=>window.__CURRENT_LEVEL_QA__[name](...args),{name,args});
const wait=(fn,arg,timeout=25000)=>page.waitForFunction(fn,arg,{polling:50,timeout});
async function capture(name){const file=profile.id+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});
  profile.screenshots.push({file,type:'ACTUAL_GAME_DECLARED_CONTROLLED_SCENE',snapshot:await snapshot()});await save();}
function clean(){assert.deepEqual(profile.errors,[]);assert.deepEqual(profile.consoleErrors,[]);assert.deepEqual(profile.failedRequests,[]);}
async function check(name,action){const entry={name,status:'running'};profile.checks.push(entry);await save();console.log('[Current level '+profile.id+'] '+name);
  const start=Date.now();try{entry.result=await action();clean();entry.status='passed';}catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-start;await save();}}
async function layout(){return page.evaluate(()=>{
  const rect=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);
    return{id,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,
      visible:!e.classList.contains('hidden')&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0,
      opacity:Number(s.opacity),disabled:!!e.disabled};};
  const ids=['canvas','hud','fire','classicMissile','flightWeapon','classicC9','flightObjective','atlasEncounter','flightDock','flightDockContinue'];
  const rects=Object.fromEntries(ids.map(id=>[id,rect(id)]));
  return{...rects,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,
    activeId:document.activeElement?.id,overlayVisible:document.querySelector('#flightDock')?.classList.contains('show'),
    comms:document.querySelector('#flightObjective')?.textContent};
});}
function controls(positions){
  const ids=['fire','classicMissile','flightWeapon','classicC9'];
  for(const id of ids){const r=positions[id];assert.ok(r?.visible,id+' must be visible');assert.ok(r.width>=44&&r.height>=44,id+' touch target <44px');
    assert.ok(r.x>=0&&r.right<=positions.viewport.width+1&&r.y>=0&&r.bottom<=positions.viewport.height+1,id+' outside viewport');}
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=positions[ids[i]],b=positions[ids[j]];
    assert.ok(a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1,'Overlapping touch controls '+ids[i]+'/'+ids[j]);}
  assert.ok(positions.documentWidth<=positions.viewport.width+1,'Horizontal overflow');
}
function guardianBounds(q,positions){
  assert.ok(q.boss?.paintBounds,'Actual decoded-alpha bounds required');const box=positions.canvas,b=q.boss.paintBounds;
  const left=box.x+b.left*box.width/q.W,right=box.x+b.right*box.width/q.W,
    top=box.y+b.top*box.height/q.H,bottom=box.y+b.bottom*box.height/q.H;
  const headerBottom=Math.max(positions.hud.bottom,positions.atlasEncounter.bottom,
    positions.flightObjective.visible?positions.flightObjective.bottom:0);
  assert.ok(left>=box.x-1&&right<=box.right+1,'Atlas painted extremities exceed the horizontal arena');
  assert.ok(top>=headerBottom-1,'Atlas painted ring overlaps the tactical HUD: '+JSON.stringify({top,headerBottom,state:q.boss.state}));
  assert.ok(bottom<positions.fire.y,'Atlas cannot obscure bottom fire controls');
  return{left,right,top,bottom,headerBottom};
}
(async()=>{
  await prepareEvidence(output);ready=true;await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256=sha256(await fs.readFile(__filename));report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,values['expected-commit']);assert.equal(report.buildInfo.dirty,false);assert.equal(report.buildInfo.engineV1,false);
  report.packageFiles={};for(const file of ['build-info.json','juego/game.js','juego/content-runtime.js','juego/index.html','juego/styles.css']){
    const bytes=await fs.readFile(path.join(root,file));report.packageFiles[file]={sha256:sha256(bytes),bytes:bytes.length};}
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browserVersion=browser.version();
  for(const viewport of [{width:390,height:844},{width:320,height:568}]){
    profile={id:viewport.width+'x'+viewport.height,viewport,status:'running',checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(25000);
    page.on('pageerror',error=>profile.errors.push(errorText(error)));page.on('console',m=>{if(m.type()==='error')profile.consoleErrors.push(m.text());});
    page.on('requestfailed',r=>profile.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
    page.on('response',r=>{if(r.status()>=400)profile.failedRequests.push({url:r.url(),status:r.status()});});
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
      const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');assert.equal(sha256(body),report.packageFiles['juego/game.js'].sha256);
      const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
      const hook=`
        const qaPaint=[],qaAlphaCache=new Map(),qaOriginalDraw=ctx.drawImage;
        ctx.drawImage=function(image,...args){
          const id=Object.keys(SPRITES).find(key=>SPRITES[key]===image);
          if(['guardianAtlas','chapterMissile','chapterIntro','chronosDestruction'].includes(id)){
            const m=ctx.getTransform();qaPaint.push({id,args,alpha:ctx.globalAlpha,x:m.e,y:m.f});if(qaPaint.length>180)qaPaint.shift();
          }
          return Reflect.apply(qaOriginalDraw,this,[image,...args]);
        };
        function qaBounds(){
          if(!atlasBoss||!spriteReady(SPRITES.guardianAtlas))return null;
          const animation=NeonCampaign.guardianAtlasAnimation(atlasBoss),frames=[animation.frame];
          if(animation.previousFrame!==null&&animation.blend<1)frames.push(animation.previousFrame);
          let minX=512,minY=512,maxX=0,maxY=0;
          for(const frame of frames){
            let box=qaAlphaCache.get(frame);
            if(!box){const tile=document.createElement('canvas');tile.width=tile.height=512;const paint=tile.getContext('2d');
              paint.drawImage(SPRITES.guardianAtlas,(frame%4)*512,Math.floor(frame/4)*512,512,512,0,0,512,512);
              const rgba=paint.getImageData(0,0,512,512).data;box={minX:512,minY:512,maxX:0,maxY:0};
              for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(rgba[(y*512+x)*4+3]>8){
                box.minX=Math.min(box.minX,x);box.minY=Math.min(box.minY,y);box.maxX=Math.max(box.maxX,x+1);box.maxY=Math.max(box.maxY,y+1);}
              qaAlphaCache.set(frame,box);
            }
            minX=Math.min(minX,box.minX);minY=Math.min(minY,box.minY);maxX=Math.max(maxX,box.maxX);maxY=Math.max(maxY,box.maxY);
          }
          const size=(atlasBoss.visualSize||350)*1.25;
          return{left:atlasBoss.x-size/2+minX/512*size,right:atlasBoss.x-size/2+maxX/512*size,
            top:atlasBoss.y-size/2+minY/512*size,bottom:atlasBoss.y-size/2+maxY/512*size};
        }
        window.__CURRENT_LEVEL_QA__={
          snapshot:()=>({state,W,H,currentLevel,elapsed,hull,reserve:classicHullReserve,capacity:classicHullReserveCapacity,
            legacyRunning,legacyPending:legacyFrameId!==null,shipVisual:{...SHIP_VISUAL},player:{x:player.x,y:player.y},
            flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
            chapter:classicChapterView?JSON.parse(JSON.stringify(classicChapterView)):null,
            salvage:classicSalvageLedger?.getState(),equipment:JSON.parse(JSON.stringify(classicEquipment)),
            combat:combatSfx?.snapshot()||null,impacts:impactEffects.map(e=>({...e})),paint:[...qaPaint],
            assets:Object.fromEntries(['guardianAtlas','chapterMissile','flightKit','chronosDestruction'].map(key=>[key,{ready:spriteReady(SPRITES[key])}])),
            weapons:classicWeapons?NeonCampaign.classicWeaponSnapshot(classicWeapons):null,
            items:items.map(i=>({id:i.id,type:i.type,x:i.x,y:i.y,hp:i.hp,guardianProjectile:!!i.guardianProjectile})),
            boss:atlasBoss?{x:atlasBoss.x,y:atlasBoss.y,state:atlasBoss.state,stateTime:atlasBoss.stateTime,
              version:atlasBoss.version,hp:atlasBoss.hp,maxHp:atlasBoss.maxHp,phase:atlasBoss.phase,vulnerability:atlasBoss.vulnerability,
              disabled:atlasBoss.disabled,age:atlasBoss.age,attackTier:atlasBoss.attackTier,motionVx:atlasBoss.motionVx,
              motionDecision:atlasBoss.motionDecision,paintBounds:qaBounds()}:null}),
          prepareC9(){
            goHome();classicEquipment={version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'};
            storage.setJSON(CLASSIC_EQUIPMENT_KEY,classicEquipment);loadClassicSalvage();
            const run=classicSalvageLedger.beginRun({scope:'classic:1',fresh:true});if(!run.ok)throw Error('Declared fixture run failed');
            for(let n=0;n<8;n++){const result=classicSalvageLedger.claimDrop({runId:run.runId,dropId:'current-visual:'+n,enemyType:'raider'});if(!result.ok)throw Error('Declared fixture grant failed');}
            for(let n=0;n<2;n++){const result=classicSalvageLedger.spendMissile({shotId:classicSalvageLedger.nextMissileShotId()});if(!result.ok)throw Error('Declared fixture missile spend failed');}
            classicSalvageState=classicSalvageLedger.getState();
            const checkpoint=NeonCampaign.createChronosVoyageCheckpoint(3,{goal:36,collected:8});
            storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,{version:2,checkpoint,entry:{hull:62,reserve:12,score:160,maxCombo:1,collected:8},unlockedStage:3,completed:false});
            loadClassicVoyage();startLevel(0);warpTimer=0;render(performance.now());
          },
          prepareAtlas(){
            goHome();const checkpoint=NeonCampaign.createChronosVoyageCheckpoint(10,{goal:36,collected:36});
            storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,{version:2,checkpoint,entry:{hull:100,reserve:30,score:160,maxCombo:1,collected:36},unlockedStage:10,completed:false});
            loadClassicVoyage();startLevel(0);warpTimer=0;spawnTimer=classicScoutTimer=classicPatrolTimer=999;gateCountdown=999;
            for(let n=0;n<2000&&!atlasBoss;n++)update(.034);
            if(!atlasBoss)throw Error('Real update did not establish Atlas');stopLegacyLoop();qaPaint.length=0;render(performance.now());
          },
          bossUntil(target){
            for(let n=0;n<3500&&atlasBoss.state!==target;n++)updateAtlasEncounter(.034);
            if(atlasBoss.state!==target)throw Error('Atlas did not reach '+target);qaPaint.length=0;render(performance.now());
          },
          motionSamples(seconds){
            const samples=[];for(let t=0;t<seconds;t+=.034){updateAtlasEncounter(.034);
              if(samples.length===0||atlasBoss.age-samples.at(-1).age>=.2)samples.push({x:atlasBoss.x,y:atlasBoss.y,age:atlasBoss.age,state:atlasBoss.state});}
            qaPaint.length=0;render(performance.now());return samples;
          },
          nextHeavy(){
            for(let n=0;n<5000&&!(atlasBoss.state==='fire'&&atlasBoss.attackTier!=='basic');n++)updateAtlasEncounter(.034);
            if(atlasBoss.state!=='fire'||atlasBoss.attackTier==='basic')throw Error('No real heavy volley emitted');qaPaint.length=0;render(performance.now());
          },
          emitMissile(){
            if(!atlasBoss.vulnerability)throw Error('Missile fixture requires actual exposed core');
            items=items.filter(i=>!i.guardianProjectile);classicWeapons.projectiles=[];impactEffects=[];
            const travel=Math.max(0,(player.y-SHIP_VISUAL.muzzleOffset-atlasBoss.y)/760);
            player.x=player.target=atlasBoss.x+clamp((atlasBoss.motionVx||0)*travel*.8,-65,65);
            const hp=atlasBoss.hp,ammo=classicSalvageState.missileAmmo;
            if(!fireClassicMissile())throw Error('Actual physical missile was not launched');
            render(performance.now());return{hp,ammo};
          },
          untilImpact(){
            for(let n=0;n<160&&!impactEffects.some(e=>e.missileImpact);n++)update(.034);
            if(!impactEffects.some(e=>e.missileImpact))throw Error('Physical missile did not produce a collision impact');
            qaPaint.length=0;render(performance.now());
          },
          advance(seconds){for(let t=0;t<seconds;t+=.034)update(Math.min(.034,seconds-t));qaPaint.length=0;render(performance.now());},
          resolveGuardian(){
            let hits=0;while(!atlasBoss.disabled){if(!atlasBoss.vulnerability)this.bossUntil('exposed');
              const hit=NeonCampaign.hitGuardianAtlas(atlasBoss,6,{x:atlasBoss.x,y:atlasBoss.y,radius:0});if(!hit.accepted)throw Error('Exposed core rejected fixture hit');
              for(const event of hit.events)consumeAtlasEvent(event);if(++hits>30)throw Error('Unexpected HP contract');}
            syncAtlasHud();for(let n=0;n<60;n++)update(.034);for(let n=0;n<72;n++)update(.034);render(performance.now());return hits;
          },
          restart(){restartLegacyLoop();return{running:legacyRunning,pending:legacyFrameId!==null};}
        };\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});
    });
    await check('the actual opening keeps Chronos in-world, immediately playable and controls separated',async()=>{
      await page.goto(server.url,{waitUntil:'load'});await page.locator('#classiclink').click();await page.locator('#menu.show').waitFor();
      await page.locator('#play').click();await page.locator('#launch').click();await wait(()=>window.__CURRENT_LEVEL_QA__?.snapshot().state==='playing');
      await wait(()=>window.__CURRENT_LEVEL_QA__?.snapshot().paint.some(p=>p.id==='chronosDestruction'));
      const q=await snapshot();assert.equal(q.chapter.opening.active,false);assert.equal(q.chapter.opening.controlsLocked,false);assert.equal(q.chapter.opening.backgroundAlpha,0);
      assert.equal(q.shipVisual.assemblySize,108.16);assert.equal(q.paint.some(p=>p.id==='chapterIntro'),false);assert.equal(await page.locator('#chapterSkip').isVisible(),false);
      const positions=await layout();controls(positions);await capture('chronos-playable-opening');return{snapshot:q,layout:positions};
    });
    await check('C9 opens from HUD, pauses without healing, traps focus and applies the illustrated paid upgrades',async()=>{
      await fixture('prepareC9');await page.locator('#classicC9').click();await wait(()=>document.querySelector('#flightDock.show'));
      const q=await snapshot();assert.equal(q.state,'paused');assert.equal(q.hull,62);assert.equal(q.reserve,12);assert.equal(q.salvage.balance,48);assert.equal(q.salvage.missileAmmo,1);
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'flightDockContinue');await page.waitForTimeout(300);
      const paused=await snapshot();assert.equal(paused.flight.elapsed,q.flight.elapsed);assert.equal(paused.hull,q.hull);assert.deepEqual(paused.items,q.items);
      await page.locator('#flightDockHome').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('#flightDock')),true);
      await page.locator('#c9BuyShield').click();const reinforced=await snapshot();assert.equal(reinforced.capacity,45);assert.equal(reinforced.reserve,27);assert.equal(reinforced.salvage.balance,18);
      await page.locator('#c9BuyMissiles').click();const refilled=await snapshot();assert.equal(refilled.salvage.balance,6);assert.equal(refilled.salvage.missileAmmo,3);
      const art=await page.locator('.c9-upgrade-art').evaluateAll(nodes=>nodes.map(n=>({size:n.getBoundingClientRect().width,image:getComputedStyle(n).backgroundImage})));
      assert.equal(art.length,4);assert.ok(art.every(a=>a.size>0&&a.image!=='none'),'Every C9 upgrade needs its authored artwork');
      await capture('onboard-c9-paid-upgrades');await page.keyboard.press('Escape');await wait(()=>window.__CURRENT_LEVEL_QA__.snapshot().state==='playing');
      const resumed=await snapshot();assert.ok(resumed.flight.elapsed>=q.flight.elapsed&&resumed.flight.elapsed-q.flight.elapsed<.5);assert.equal(resumed.hull,62);
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'classicC9');return{before:q,reinforced,refilled,resumed,art};
    });
    await check('Atlas uses the moving v6 collider and emits audible basic and heavy attacks',async()=>{
      await wait(()=>['guardianAtlas','chapterMissile','flightKit'].every(key=>window.__CURRENT_LEVEL_QA__.snapshot().assets[key].ready));
      await fixture('prepareAtlas');await wait(()=>window.__CURRENT_LEVEL_QA__.snapshot().combat?.ready);
      await fixture('bossUntil','fire');const basic=await snapshot();assert.equal(basic.boss.version,'guardian-atlas-v6');
      assert.ok(basic.combat.playedByCue['enemy-phaser']>0);const samples=await fixture('motionSamples',7);
      assert.ok(Math.max(...samples.map(s=>s.x))-Math.min(...samples.map(s=>s.x))>40,'Boss must visibly change its physical lane');
      await page.waitForTimeout(250);await fixture('nextHeavy');const heavy=await snapshot();assert.ok(heavy.combat.playedByCue['enemy-heavy']>0);
      await capture('moving-atlas-heavy-volley');return{basic,heavy,motion:samples};
    });
    await check('closed, opening and exposed Atlas poses fit below the HUD at both viewport sizes',async()=>{
      const states=[];for(const state of ['closed','opening','exposed']){
        await fixture('bossUntil',state);const q=await snapshot(),positions=await layout();controls(positions);
        assert.equal(q.boss.vulnerability,state==='exposed');assert.equal(positions.classicC9.disabled,true);
        states.push({state,bounds:guardianBounds(q,positions),snapshot:q,layout:positions});await capture('atlas-'+state);
      }return states;
    });
    await check('a real special missile travels before applying18 damage and displays expanding blast then debris',async()=>{
      await fixture('bossUntil','closed');await fixture('bossUntil','exposed');const launch=await fixture('emitMissile'),emitted=await snapshot();
      assert.equal(emitted.boss.hp,launch.hp);assert.equal(emitted.salvage.missileAmmo,launch.ammo-1);
      assert.ok(emitted.weapons.projectiles.some(s=>s.weapon==='missile'&&s.damage===18));await capture('missile-physical-flight');
      await fixture('untilImpact');const impact=await snapshot();assert.equal(impact.boss.hp,launch.hp-18);
      assert.ok(impact.paint.some(p=>p.id==='chapterMissile'&&p.args[1]===512&&p.args[6]>=128));await capture('missile-contact-explosion');
      await fixture('advance',.12);const blast=await snapshot();assert.ok(blast.paint.some(p=>p.id==='chapterMissile'&&p.args[1]===512&&p.args[6]>170));
      await capture('missile-expanding-blast');await fixture('advance',.22);const debris=await snapshot();
      assert.ok(debris.paint.some(p=>p.id==='chapterMissile'&&p.args[1]===768&&p.args[6]>=208));await capture('missile-fading-debris');return{launch,emitted,impact,blast,debris};
    });
    await check('the real guardian resolution keeps Iria legible and resumes exactly one legacy loop',async()=>{
      const hits=await fixture('resolveGuardian');const q=await snapshot(),positions=await layout();
      assert.equal(q.boss.disabled,true);assert.equal(q.chapter.aftermath.active,true);assert.equal(q.chapter.aftermath.dialogue.speakerId,'iria');
      assert.match(positions.comms,/IRIA|Comandante Iria/);assert.ok(positions.flightObjective.y>=positions.atlasEncounter.bottom-1);
      await capture('iria-unobscured-resolution');const restarted=await fixture('restart');assert.deepEqual(restarted,{running:true,pending:true});return{hits,q,layout:positions,restarted};
    });
    profile.status='passed';await context.close();context=null;page=null;await save();
  }
  report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(profile)profile.status='failed';if(page){report.failureSnapshot=await snapshot().catch(()=>null);if(ready)await page.screenshot({path:path.join(output,(profile?.id||'unknown')+'-failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(report.packageFiles)for(const[file,before]of Object.entries(report.packageFiles))try{assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,'Input package changed during QA: '+file);}
  catch(error){report.status='failed';report.exitCode=1;report.error??=errorText(error);process.exitCode=1;}
  await context?.close();await browser?.close();await server?.close();report.durationMs=Date.now()-began;report.finishedAt=new Date().toISOString();if(ready)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.map(c=>({name:c.name,status:c.status}))})),error:report.error,output}));
});
