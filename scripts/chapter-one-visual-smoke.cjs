// Controlled scene integration only. This is deliberately not a natural run.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},'expected-commit':{type:'string'}}});
const root=path.resolve(values.root||'/tmp/neon-chapter-playtest-final'),output=path.resolve(values.output||'/tmp/neon-chapter-visual-01');
const expected=values['expected-commit']||'968ebc8b861409f157fb797f249b709669f99d4d';
assert.match(expected,/^[a-f0-9]{40}$/);
const began=Date.now(),report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,
  sourceRoot:root,executionKind:'CONTROLLED_SCENE_UI_AND_MODEL_INTEGRATION',profiles:[],limits:[
    'These are controlled scenes, not a natural route, earned economy or balance certification.',
    'Intro uses actual launcher/menu/launch actions. C9 seeds a valid stage-six waiting checkpoint with 18 collected, hull100 and reserve12; recovered emitter is explicit fixture equipment.',
    'C9 gets exactly48 fixture scrap by eight declared raider grants through the real ledger API. Two special missiles are spent through its real durable API before the scene. No money is described as naturally earned.',
    'Atlas starts from a valid stage-ten checkpoint with36 collected. Repeated real update calls establish the encounter; explicit model advancement and accepted core hits resolve it without assigning HP or skipping phase contracts.',
    'Iria epilogue uses the actual chapter story and existing update clock. Scene acceleration and enemy scheduling suppression are recorded fixtures.',
    'Only a temporary HTTP response receives the declared fixture/observation API. All package inputs are hashed before and after. No application files, extra RAF or production save are changed.',
    '390x844 and320x568 Chromium viewports do not certify physical iPhone, Safari, artistic acceptance or a complete natural chapter.'
  ]};
let browser,context,page,server,profile,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.snapshot());
const wait=(fn,arg,timeout=30000)=>page.waitForFunction(fn,arg,{polling:50,timeout});
function clean(){assert.deepEqual(profile.errors,[]);assert.deepEqual(profile.consoleErrors,[]);assert.deepEqual(profile.failedRequests,[]);}
async function check(name,action){const entry={name,status:'running'};profile.checks.push(entry);await save();
  console.log('[Chapter visual '+profile.id+'] '+name);const start=Date.now();
  try{entry.result=await action();clean();entry.status='passed';}catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-start;await save();}}
async function capture(name){const file=profile.id+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});
  profile.screenshots.push({file,type:'ACTUAL GAME CONTROLLED SCENE; NOT NATURAL GAMEPLAY',snapshot:await inspect()});await save();}
async function settledOverlay(){await wait(()=>{const e=document.getElementById('flightDock');return e.classList.contains('show')&&Number(getComputedStyle(e).opacity)>.999;});await page.waitForTimeout(300);}
async function layout(){return page.evaluate(()=>{
  const box=id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{id,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,opacity:s.opacity,visible:s.visibility!=='hidden'&&s.display!=='none',zIndex:s.zIndex};};
  const ids=['fire','classicMissile','flightWeapon','flightObjective','atlasEncounter','chapterSkip'];
  const result=Object.fromEntries(ids.map(id=>[id,box(id)]));
  const objective=document.getElementById('flightObjective'),r=objective.getBoundingClientRect();
  const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return{...result,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,
    commsText:objective.textContent,commsActor:objective.querySelector('[data-actor]')?.dataset.actor||null,
    commsHitId:hit?.id||null,commsCoveredByAtlas:!!hit?.closest('#atlasEncounter')};
});}
function buttonGeometry(result){
  const controls=['fire','classicMissile','flightWeapon'];
  for(const id of controls){const b=result[id];assert.ok(b.visible);assert.ok(b.width>=44&&b.height>=44,id+' must retain a44px touch target');
    assert.ok(b.x>=0&&b.right<=result.viewport.width+1&&b.y>=0&&b.bottom<=result.viewport.height+1,id+' outside viewport');}
  for(let a=0;a<controls.length;a++)for(let b=a+1;b<controls.length;b++){
    const x=result[controls[a]],y=result[controls[b]];
    assert.ok(x.right<=y.x+1||y.right<=x.x+1||x.bottom<=y.y+1||y.bottom<=x.y+1,
      'Touch controls overlap: '+JSON.stringify({first:x,second:y}));}
  assert.ok(result.documentWidth<=result.viewport.width+1,'Horizontal overflow');
}
(async()=>{
  await prepareEvidence(output);evidenceReady=true;await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256=sha256(await fs.readFile(__filename));report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,expected);assert.equal(report.buildInfo.dirty,false);assert.equal(report.buildInfo.engineV1,false);
  report.packageFiles={};for(const file of ['build-info.json','juego/game.js','juego/content-runtime.js','juego/styles.css','juego/index.html']){
    const bytes=await fs.readFile(path.join(root,file));report.packageFiles[file]={sha256:sha256(bytes),bytes:bytes.length};}
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browserVersion=browser.version();
  for(const viewport of [{width:390,height:844},{width:320,height:568}]){
    profile={id:viewport.width+'x'+viewport.height,status:'running',viewport,checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await context.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;const media=window.__CHAPTER_VISUAL_MEDIA__=[];
      HTMLMediaElement.prototype.play=function(...args){if(!media.includes(this))media.push(this);return Reflect.apply(play,this,args);};});
    page=await context.newPage();page.setDefaultTimeout(30000);
    page.on('pageerror',e=>profile.errors.push(errorText(e)));page.on('console',m=>{if(m.type()==='error')profile.consoleErrors.push(m.text());});
    page.on('requestfailed',r=>profile.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
    page.on('response',r=>{if(r.status()>=400)profile.failedRequests.push({url:r.url(),status:r.status()});});
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
      assert.equal(sha256(body),report.packageFiles['juego/game.js'].sha256);const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
      const hook=`window.__CHAPTER_VISUAL_QA__={
        snapshot:()=>({state,currentLevel,elapsed,hull,reserve:classicHullReserve,capacity:classicHullReserveCapacity,
          shipVisual:{...SHIP_VISUAL},flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
          chapter:classicChapterView?JSON.parse(JSON.stringify(classicChapterView)):null,
          equipment:JSON.parse(JSON.stringify(classicEquipment)),salvage:classicSalvageLedger?.getState(),
          boss:atlasBoss?{state:atlasBoss.state,hp:atlasBoss.hp,maxHp:atlasBoss.maxHp,phase:atlasBoss.phase,
            disabled:atlasBoss.disabled,resolved:atlasBoss.resolved,vulnerability:atlasBoss.vulnerability}:null,
          media:window.__CHAPTER_VISUAL_MEDIA__.map(e=>({src:e.currentSrc||e.src,paused:e.paused,currentTime:e.currentTime,
            duration:Number.isFinite(e.duration)?e.duration:null,readyState:e.readyState,error:e.error?.message||null})),
          score:chapterScore?.snapshot()||null}),
        prepareC9(){
          goHome();
          classicEquipment={version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'};
          storage.setJSON(CLASSIC_EQUIPMENT_KEY,classicEquipment);
          loadClassicSalvage();
          const run=classicSalvageLedger.beginRun({scope:'classic:1',fresh:true});
          if(!run.ok)throw new Error('Fixture ledger could not begin its declared run');
          for(let n=0;n<8;n++){const result=classicSalvageLedger.claimDrop({runId:run.runId,dropId:'visual-fixture-raider:'+n,enemyType:'raider'});
            if(!result.ok)throw new Error('Fixture grant failed');}
          for(let n=0;n<2;n++){const result=classicSalvageLedger.spendMissile({shotId:classicSalvageLedger.nextMissileShotId()});
            if(!result.ok||result.duplicate)throw new Error('Fixture missile spend failed');}
          classicSalvageState=classicSalvageLedger.getState();
          const checkpoint={...NeonCampaign.createChronosVoyageCheckpoint(6,{goal:36,collected:18}),serviceWaiting:true};
          storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,{version:2,checkpoint,
            entry:{hull:100,reserve:12,score:160,maxCombo:1,collected:18},unlockedStage:6,completed:false});
          loadClassicVoyage();startLevel(0);
        },
        prepareAtlas(){
          goHome();const checkpoint=NeonCampaign.createChronosVoyageCheckpoint(10,{goal:36,collected:36});
          storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,{version:2,checkpoint,
            entry:{hull:100,reserve:30,score:160,maxCombo:1,collected:36},unlockedStage:10,completed:false});
          loadClassicVoyage();startLevel(0);warpTimer=0;
          // Explicit scene fixture: disable unrelated ambient scheduling while
          // advancing the real update, not a natural difficulty certification.
          spawnTimer=classicScoutTimer=classicPatrolTimer=999;gateCountdown=999;
          for(let n=0;n<2000&&!atlasBoss;n++)update(.034);
          if(!atlasBoss)throw new Error('Actual chapter update did not establish its frontier');
          render(performance.now());
        },
        bossUntil(target){
          for(let n=0;n<2000&&atlasBoss.state!==target;n++){
            NeonCampaign.advanceGuardianAtlas(atlasBoss,.034,player,consumeAtlasEvent);syncAtlasHud();
          }
          if(atlasBoss.state!==target)throw new Error('Model did not reach '+target);
          render(performance.now());
        },
        acceptCoreHits(){
          if(!atlasBoss.vulnerability)throw new Error('Fixture may only apply accepted EXPOSED hits');
          let accepted=0;
          while(atlasBoss.vulnerability&&!atlasBoss.disabled){
            const hit=NeonCampaign.hitGuardianAtlas(atlasBoss,6,{x:atlasBoss.x,y:atlasBoss.y,radius:0});
            if(!hit.accepted)throw new Error('Exposed core rejected model damage');
            for(const event of hit.events)consumeAtlasEvent(event);accepted++;
            if(accepted>20)throw new Error('Unexpected HP contract');
          }
          syncAtlasHud();render(performance.now());return accepted;
        },
        advanceAftermath(seconds){
          for(let remaining=seconds;remaining>1e-8;remaining-=Math.min(.034,remaining))update(Math.min(.034,remaining));
          render(performance.now());
        }
      };\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});
    });
    await check('actual intro shows Lira, decoded music and the smaller ship with usable separated controls',async()=>{
      await page.goto(server.url,{waitUntil:'load'});await page.locator('#classiclink').click();await page.locator('#menu.show').waitFor();
      await page.locator('#play').click();await page.locator('#launch').click();
      await wait(()=>window.__CHAPTER_VISUAL_QA__?.snapshot().chapter?.opening?.controlsLocked);
      await page.waitForTimeout(800);await capture('lira-intro-controlled-viewport');
      const intro=await inspect();assert.equal(intro.shipVisual.assemblySize,83.2);assert.equal(intro.chapter.opening.dialogue.speakerId,'lira');
      const introLayout=await layout();assert.match(introLayout.commsText,/LIRA|Turno tranquilo|corredor/i);
      await wait(()=>window.__CHAPTER_VISUAL_QA__.snapshot().media.some(e=>e.currentTime>.1&&!e.paused&&e.readyState>=2),undefined,10000);
      const audio=await inspect();assert.ok(audio.media.some(e=>!e.error&&e.currentTime>.1&&!e.paused));
      await page.locator('#chapterSkip').click();await wait(()=>!window.__CHAPTER_VISUAL_QA__.snapshot().chapter.opening.controlsLocked);
      const controls=await layout();profile.controlsAfterIntro=controls;buttonGeometry(controls);await capture('smaller-ship-separated-controls');return{intro,layout:introLayout,controls,audio:audio.media};
    });
    await check('controlled C9 service keeps opacity settled and charges real reinforcement and missile refill transactions',async()=>{
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.prepareC9());await settledOverlay();
      const before=await inspect();assert.equal(before.state,'paused');assert.equal(before.flight.waitingFor,'service');
      assert.equal(before.flight.collected,18);assert.equal(before.reserve,12);assert.equal(before.salvage.balance,48);assert.equal(before.salvage.missileAmmo,1);
      await capture('c9-settled-before-purchases');
      await page.locator('#c9BuyShield').click();const reinforced=await inspect();
      assert.equal(reinforced.capacity,45);assert.equal(reinforced.reserve,27);assert.equal(reinforced.salvage.balance,18);
      assert.ok(reinforced.salvage.upgrades.includes('hull-reinforcement'));
      await page.locator('#c9BuyMissiles').click();const filled=await inspect();assert.equal(filled.salvage.missileAmmo,3);assert.equal(filled.salvage.balance,6);
      assert.equal(filled.salvage.missileRoundsPurchased,2);assert.equal(filled.salvage.missileRefillSequence,1);
      assert.equal(await page.locator('#c9BuyShield').isDisabled(),true);assert.equal(await page.locator('#c9BuyMissiles').isDisabled(),true);
      await settledOverlay();await capture('c9-settled-paid-refuerzo-and-missiles');return{before,reinforced,filled};
    });
    await check('controlled real Atlas model renders CLOSED, OPENING and EXPOSED before the actual Iria epilogue remains unobscured',async()=>{
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.prepareAtlas());
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.bossUntil('closed'));await capture('atlas-closed');
      const closed=await inspect();assert.equal(closed.boss.maxHp,96);assert.equal(closed.boss.vulnerability,false);
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.bossUntil('opening'));await capture('atlas-opening');
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.bossUntil('exposed'));await capture('atlas-core-exposed');
      const first=await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.acceptCoreHits());const phase=await inspect();assert.equal(phase.boss.phase,2);assert.ok(first>0);
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.bossUntil('exposed'));
      const second=await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.acceptCoreHits());assert.ok(second>0);
      const disabled=await inspect();assert.equal(disabled.boss.state,'disabled');
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.bossUntil('disabled'));
      // The disabled state needs its real duration to dispatch its terminal event.
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.advanceAftermath(1.65));
      await page.evaluate(()=>window.__CHAPTER_VISUAL_QA__.advanceAftermath(2.3));
      await wait(()=>document.querySelector('#flightObjective [data-actor="iria"]'));
      await page.waitForTimeout(300);const epilogue=await inspect(),positions=await layout();profile.epilogueLayout=positions;
      assert.equal(epilogue.chapter.aftermath.active,true);assert.equal(epilogue.chapter.aftermath.dialogue.speakerId,'iria');
      assert.ok(positions.flightObjective.y>positions.atlasEncounter.bottom,'Iria channel must begin below the full guardian header');
      assert.equal(positions.commsCoveredByAtlas,false,'Guardian panel must not cover the dialogue');
      assert.ok(Number(positions.flightObjective.opacity)>.99);assert.match(positions.commsText,/IRIA|Comandante Iria/);
      buttonGeometry(positions);await capture('iria-epilogue-unobscured');return{closed,phase,disabled,epilogue,positions,acceptedHitGroups:[first,second]};
    });
    profile.status='passed';await context.close();context=null;page=null;await save();
  }
  report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(profile)profile.status='failed';if(page&&evidenceReady){report.failureSnapshot=await inspect().catch(()=>null);await page.screenshot({path:path.join(output,(profile?.id||'unknown')+'-failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(report.packageFiles)for(const[file,before]of Object.entries(report.packageFiles))try{
    assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,'Input package changed during controlled QA: '+file);
  }catch(error){report.status='failed';report.exitCode=1;report.error??=errorText(error);process.exitCode=1;}
  await context?.close();await browser?.close();await server?.close();report.durationMs=Date.now()-began;report.finishedAt=new Date().toISOString();
  if(evidenceReady)await save();console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.map(c=>({name:c.name,status:c.status}))})),error:report.error,output}));
});
