// Controlled presentation/audio integration. Never label this a natural run.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},'expected-commit':{type:'string'}}});
assert.ok(values.root&&values.output&&values['expected-commit'],'Usage: node scripts/specialist-game-smoke.cjs --root IMMUTABLE_PACKAGE --output UNIQUE_DIRECTORY --expected-commit FULL_SHA');
const root=path.resolve(values.root),output=path.resolve(values.output),expected=values['expected-commit'];
assert.match(expected,/^[a-f0-9]{40}$/);
const began=Date.now(),report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,
  executionKind:'CONTROLLED_REAL_RENDERER_AND_AUDIO_GRAPH_NOT_NATURAL_GAMEPLAY',profiles:[],limits:[
    'Fresh isolated browser profiles. Menu, launch, skip, fire, missile, pause and resume use actual UI actions.',
    'After audio checks the existing legacy loop is explicitly stopped for deterministic presentation fixtures, then restarted once. No second RAF owner is created.',
    'Banking, energy ages, projectile ages and impact ages are declared scene fixtures rendered by actual game functions. They do not demonstrate earned combat, economy or difficulty.',
    'Atlas is established from an explicit valid stage-ten checkpoint. Existing model updates establish its states; accepted core hits advance phase two without assigning boss HP.',
    'Audio readiness and actual BufferSource playback are observed. Metal/hull samples and voice-pressure calls are explicit audio fixtures, not naturally suffered damage.',
    '390x844 and320x568 Chromium do not certify physical iPhone/Safari, artistic acceptance, a full chapter or human listening quality.'
  ]};
let browser,context,page,server,profile,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>window.__SPECIALIST_QA__.snapshot());
const wait=(fn,arg,timeout=20000)=>page.waitForFunction(fn,arg,{polling:50,timeout});
function clean(){assert.deepEqual(profile.errors,[]);assert.deepEqual(profile.consoleErrors,[]);assert.deepEqual(profile.failedRequests,[]);}
async function check(name,action){const entry={name,status:'running'};profile.checks.push(entry);await save();console.log('[Specialist '+profile.id+'] '+name);
  const started=Date.now();try{entry.result=await action();clean();entry.status='passed';}catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-started;await save();}}
async function capture(name){const file=profile.id+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});profile.screenshots.push({file,type:'ACTUAL GAME RENDER; DECLARED CONTROLLED SCENE',snapshot:await inspect()});await save();}
async function fixture(name,...args){return page.evaluate(({name,args})=>window.__SPECIALIST_QA__[name](...args),{name,args});}
function draws(snapshot,id){return snapshot.trace.filter(call=>call.id===id);}
function atlasFrames(snapshot){return draws(snapshot,'guardianAtlas').map(call=>Math.round(call.args[0]/512)+4*Math.round(call.args[1]/512));}

(async()=>{
  await prepareEvidence(output);evidenceReady=true;await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256=sha256(await fs.readFile(__filename));report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,expected);assert.equal(report.buildInfo.dirty,false);assert.equal(report.buildInfo.engineV1,false);
  report.packageFiles={};
  for(const file of ['build-info.json','juego/game.js','juego/content-runtime.js','juego/styles.css','juego/index.html',
    'juego/assets/guardian_atlas_states_v2.webp','juego/assets/cronium_energy_atlas_v2.webp','juego/assets/ship_modular_atlas_v1.webp',
    'juego/assets/chapter1_missile_atlas_v1.webp','juego/assets/combat_sfx_atlas_v1.m4a']){
    const bytes=await fs.readFile(path.join(root,file));report.packageFiles[file]={sha256:sha256(bytes),bytes:bytes.length};
  }
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browserVersion=browser.version();
  for(const viewport of [{width:390,height:844},{width:320,height:568}]){
    profile={id:viewport.width+'x'+viewport.height,status:'running',viewport,checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    page=await context.newPage();page.setDefaultTimeout(25000);
    page.on('pageerror',error=>profile.errors.push(errorText(error)));page.on('console',message=>{if(message.type()==='error')profile.consoleErrors.push(message.text());});
    page.on('requestfailed',request=>profile.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
    page.on('response',response=>{if(response.status()>=400)profile.failedRequests.push({url:response.url(),status:response.status()});});
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
      const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');assert.equal(sha256(body),report.packageFiles['juego/game.js'].sha256);
      const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2,'Expected immutable legacy hook point');
      const hook=`
        let qaTrace=[],qaRecording=false,qaOscillatorProbe=false,qaFallbackOscillators=0;
        const qaOriginalDraw=ctx.drawImage;
        ctx.drawImage=function(image,...args){
          if(qaRecording){const id=Object.keys(SPRITES).find(key=>SPRITES[key]===image)||'other';
            if(['guardianAtlas','croniumEnergy','chapterMissile','modularShip','croniumFragment'].includes(id)){
              const matrix=ctx.getTransform();qaTrace.push({id,args,alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,
                transform:{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f}});
            }}
          return Reflect.apply(qaOriginalDraw,this,[image,...args]);
        };
        const qaRender=()=>{qaTrace=[];qaRecording=true;try{render(performance.now());}finally{qaRecording=false;}return qaTrace;};
        window.__SPECIALIST_QA__={
          snapshot:()=>({state,currentLevel,elapsed,hull,player:{x:player.x,y:player.y,visualBank:player.visualBank},
            loadout:{...shipLoadout},shipVisual:{...SHIP_VISUAL},legacyRunning,legacyFramePending:legacyFrameId!==null,
            chapter:classicChapterView?JSON.parse(JSON.stringify(classicChapterView)):null,
            flight:classicFlightView?JSON.parse(JSON.stringify(classicFlightView)):null,
            audioContext:audioCtx?{state:audioCtx.state,currentTime:audioCtx.currentTime}:null,
            combat:combatSfx?.snapshot()||null,fallbackOscillators:qaFallbackOscillators,fx:settings.fx,
            projectiles:classicWeapons?.projectiles.map(shot=>({...shot})),missileAmmo:classicSalvageState?.missileAmmo,
            impactEffects:impactEffects.map(effect=>({...effect})),trace:qaTrace,
            boss:atlasBoss?{state:atlasBoss.state,stateTime:atlasBoss.stateTime,hp:atlasBoss.hp,maxHp:atlasBoss.maxHp,
              phase:atlasBoss.phase,vulnerability:atlasBoss.vulnerability,coreExposure:atlasBoss.coreExposure,
              animation:NeonCampaign.guardianAtlasAnimation(atlasBoss)}:null,
            assets:Object.fromEntries(['modularShip','croniumEnergy','guardianAtlas','chapterMissile'].map(key=>[key,
              {ready:spriteReady(SPRITES[key]),width:SPRITES[key].naturalWidth,height:SPRITES[key].naturalHeight}]))}),
          menuShip(variant){shipLoadout=NeonCampaign.normalizeShipLoadout({hull:variant,wings:variant,engines:variant});shipPresentationSignature='';qaRender();},
          audioProbe(cues){
            if(!audioCtx)throw new Error('Real audio context unavailable');
            const original=audioCtx.createOscillator;audioCtx.createOscillator=function(...args){if(qaOscillatorProbe)qaFallbackOscillators++;return Reflect.apply(original,this,args);};
            qaOscillatorProbe=true;try{for(const [index,cue]of cues.entries())combatSound(cue,player.x,'specialist-fixture:'+cue+':'+performance.now()+':'+index);}
            finally{qaOscillatorProbe=false;audioCtx.createOscillator=original;}
            return combatSfx?.snapshot();
          },
          freeze(){stopLegacyLoop();return {running:legacyRunning,pending:legacyFrameId};},
          restart(){restartLegacyLoop();return {running:legacyRunning,pending:legacyFrameId!==null};},
          field(variant,bank,time){
            if(legacyRunning)throw new Error('Deterministic scenes require explicit legacy-loop freeze');
            elapsed=time;shipLoadout=NeonCampaign.normalizeShipLoadout({hull:variant,wings:variant,engines:variant});
            player.x=W*.5;player.y=H*.75;player.target=player.x;player.targetY=player.y;player.drift=0;player.visualBank=bank;
            items=[];gates=[];shots=[];rings=[];explosions=[];impactEffects=[];
            classicWeapons.projectiles=[];atlasBoss=null;cameraKickX=cameraKickY=shake=flash=impactReactionTimer=0;
            spawnTimer=classicScoutTimer=classicPatrolTimer=999;gateCountdown=999;
            qaRender();
          },
          energy(time){elapsed=time;items=[{type:'energy',x:W*.32,y:H*.42,r:22,phase:0,p:0,alpha:1,rot:0}];qaRender();},
          projectile(age){items=[];impactEffects=[];classicWeapons.projectiles=[{id:'specialist-missile-fixture',weapon:'missile',x:W*.5,y:H*.49,vx:0,vy:-760,duration:3.2,life:3.2-age,radius:10,damage:6}];qaRender();},
          impact(age){items=[];classicWeapons.projectiles=[];impactEffects=[];addMissileImpact(W*.5,H*.49);
            if(impactEffects.length!==1)throw new Error('Real missile-impact helper did not emit its effect');
            impactEffects[0].life=impactEffects[0].duration-age;qaRender();},
          prepareAtlas(){
            goHome();const checkpoint=NeonCampaign.createChronosVoyageCheckpoint(10,{goal:36,collected:36});
            storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,{version:2,checkpoint,entry:{hull:100,reserve:30,score:160,maxCombo:1,collected:36},unlockedStage:10,completed:false});
            loadClassicVoyage();startLevel(0);warpTimer=0;spawnTimer=classicScoutTimer=classicPatrolTimer=999;gateCountdown=999;
            for(let n=0;n<2000&&!atlasBoss;n++)update(.034);
            if(!atlasBoss)throw new Error('Actual chapter update did not establish the frontier');
            items=[];gates=[];shots=[];classicWeapons.projectiles=[];impactEffects=[];qaRender();
          },
          bossUntil(target){
            for(let n=0;n<3000&&atlasBoss.state!==target;n++)updateAtlasEncounter(.034);
            if(atlasBoss.state!==target)throw new Error('Atlas model did not reach '+target);
            if(target==='charge')for(let n=0;n<8&&atlasBoss.stateTime<.22;n++)updateAtlasEncounter(.034);
            qaRender();
          },
          coreHit(){if(!atlasBoss.vulnerability)throw new Error('Core fixture may only hit EXPOSED');
            const hit=NeonCampaign.hitGuardianAtlas(atlasBoss,6,{x:atlasBoss.x,y:atlasBoss.y,radius:0});
            if(!hit.accepted)throw new Error('Exposed core rejected accepted hit');for(const event of hit.events)consumeAtlasEvent(event);syncAtlasHud();qaRender();return hit;},
          phaseTwo(){let count=0;while(atlasBoss.phase===1){
            if(!atlasBoss.vulnerability)this.bossUntil('exposed');this.coreHit();if(++count>20)throw new Error('Unexpected phase threshold');}
            qaRender();return count;}
        };\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});
    });
    await check('actual menus display both modular identities with corrected composed exhaust',async()=>{
      await page.goto(server.url,{waitUntil:'load'});await page.locator('#classiclink').click();await page.locator('#menu.show').waitFor();
      await wait(()=>window.__SPECIALIST_QA__?.snapshot().assets.modularShip.ready);
      for(const variant of ['aster','bastion']){await fixture('menuShip',variant);await page.waitForTimeout(100);await capture(variant+'-menu');}
      return {identities:['aster','bastion'],source:'actual syncShipPresentation composed menu image; no save mutated'};
    });
    await check('actual fire and missile use decoded bank; pause, FX mute and throttling stop playback without fallback beeps',async()=>{
      await page.locator('#play').click();await page.locator('#launch').click();await wait(()=>window.__SPECIALIST_QA__?.snapshot().chapter?.opening?.controlsLocked);
      await page.locator('#chapterSkip').click();await wait(()=>!window.__SPECIALIST_QA__.snapshot().chapter.opening.controlsLocked);
      await wait(()=>{const x=window.__SPECIALIST_QA__.snapshot();return x.combat?.ready&&!x.combat.paused&&x.audioContext?.state==='running';},undefined,25000);
      await page.waitForTimeout(350);const before=await inspect();
      await page.locator('#fire').click();await wait(previous=>window.__SPECIALIST_QA__.snapshot().combat.played>previous,before.combat.played);
      const fired=await inspect();assert.ok(fired.projectiles.some(shot=>shot.weapon==='pulse'));
      await page.locator('#classicMissile').click();await wait(previous=>window.__SPECIALIST_QA__.snapshot().missileAmmo===previous-1,before.missileAmmo);
      const missile=await inspect();assert.ok(missile.combat.played>fired.combat.played);
      await page.waitForTimeout(180);const samples=await fixture('audioProbe',['impact-metal','hull-hit']);assert.ok(samples.played>missile.combat.played);
      const pressured=await fixture('audioProbe',Array.from({length:40},(_,n)=>['phaser','impact-metal','hull-hit','missile-launch'][n%4]));
      assert.ok(pressured.activeVoices<=8);assert.ok(pressured.activeGain<=.95+1e-9);assert.ok(pressured.dropped>0);
      assert.equal((await inspect()).fallbackOscillators,0);
      await page.locator('#pause').click();await wait(()=>window.__SPECIALIST_QA__.snapshot().combat.paused);
      const paused=await inspect();assert.equal(paused.state,'paused');assert.equal(paused.combat.activeVoices,0);
      await fixture('audioProbe',['phaser','hull-hit']);await page.waitForTimeout(120);const stillPaused=await inspect();
      assert.equal(stillPaused.combat.played,paused.combat.played);assert.equal(stillPaused.flight.elapsed,paused.flight.elapsed);
      await page.locator('#resume').click();await wait(()=>{const x=window.__SPECIALIST_QA__.snapshot();return x.state==='playing'&&!x.combat.paused;});
      await page.waitForTimeout(300);await fixture('audioProbe',['hull-hit']);
      // Dispatch the actual settings input handler, explicitly outside normal
      // settings navigation, to inspect immediate audio-bus mutation.
      await page.locator('#fxVolume').evaluate(input=>{input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}));});
      const muted=await inspect();assert.equal(muted.fx,0);assert.equal(muted.combat.enabled,false);assert.equal(muted.combat.activeVoices,0);assert.equal(muted.combat.volume,0);
      await fixture('audioProbe',['phaser','impact-metal']);assert.equal((await inspect()).combat.played,muted.combat.played);
      await page.locator('#fxVolume').evaluate(input=>{input.value='70';input.dispatchEvent(new Event('input',{bubbles:true}));});
      const restored=await inspect();assert.equal(restored.combat.enabled,true);assert.equal(restored.combat.volume,.7);assert.equal(restored.fallbackOscillators,0);
      await capture('audio-ready-playing');return {before,fired,missile,samples,pressured,paused,muted,restored};
    });
    await check('actual renderer keeps each narrow plume mounted during Aster and Bastion lateral bank',async()=>{
      const frozen=await fixture('freeze');assert.equal(frozen.running,false);assert.equal(frozen.pending,null);
      const variants=[];
      for(const variant of ['aster','bastion'])for(const bank of [-1,1]){
        await fixture('field',variant,bank,90);const snapshot=await inspect();
        assert.equal(snapshot.shipVisual.assemblySize,83.2);assert.equal(snapshot.player.visualBank,bank);
        const calls=draws(snapshot,'modularShip');const flames=calls.filter(call=>call.args[1]===143||call.args[1]===518);
        assert.equal(flames.length,2);for(const flame of flames){
          assert.ok(flame.alpha>.99);assert.ok(Math.abs(flame.args[2]/flame.args[3]-flame.args[6]/flame.args[7])<1e-6,'Each illustrated plume must retain its own source aspect ratio');
        }
        variants.push({variant,bank,flames});await capture(variant+'-bank-'+(bank<0?'left':'right'));
      }
      return variants;
    });
    await check('CRONIUM cycles four whole transparent energy cells at eight poses per simulation second',async()=>{
      await fixture('field','aster',0,90);const frames=[];
      for(let frame=0;frame<4;frame++){
        await fixture('energy',90+frame/8);const snapshot=await inspect(),calls=draws(snapshot,'croniumEnergy');
        assert.equal(calls.length,1);assert.deepEqual(calls[0].args.slice(0,4),[(frame%2)*256,Math.floor(frame/2)*256,256,256]);
        assert.equal(calls[0].alpha,1);assert.equal(draws(snapshot,'croniumFragment').length,0);assert.equal(calls[0].composite,'screen');
        frames.push(calls[0]);await capture('cronium-energy-pose-'+frame);
      }
      return {simulationTimes:[90,90.125,90.25,90.375],frames};
    });
    await check('flying missile always uses row zero; its authored impact and residue use rows two and three',async()=>{
      await fixture('field','aster',0,90);const flight=[];
      for(const age of [0,.08,.17]){
        await fixture('projectile',age);const call=draws(await inspect(),'chapterMissile');assert.equal(call.length,1);assert.equal(call[0].args[1],0);
        flight.push({age,call:call[0]});await capture('missile-flight-'+String(age).replace('.','-'));
      }
      const impacts=[];
      for(const age of [.01,.08,.16,.22,.26,.37,.48,.57]){
        await fixture('impact',age);const call=draws(await inspect(),'chapterMissile');assert.equal(call.length,1);
        assert.equal(call[0].args[1],age<.25?512:768);assert.ok(call[0].alpha>0&&call[0].alpha<=1);
        impacts.push({age,call:call[0]});
        if(age===.08||age===.37)await capture(age<.25?'missile-authored-impact':'missile-authored-residue');
      }
      return {flight,impacts};
    });
    await check('real Atlas model selects closed charge/fire, exposed cores and second-phase mechanical states',async()=>{
      await fixture('prepareAtlas');await wait(()=>window.__SPECIALIST_QA__.snapshot().assets.guardianAtlas.ready);
      const phases=[];
      for(const state of ['charge','fire','exposed']){
        await fixture('bossUntil',state);const snapshot=await inspect(),frames=atlasFrames(snapshot);
        assert.equal(snapshot.boss.phase,1);assert.equal(snapshot.boss.vulnerability,state==='exposed');
        assert.equal(snapshot.boss.animation.coverRect,null);assert.ok(frames.includes(state==='charge'?2:state==='fire'?3:1));
        for(const call of draws(snapshot,'guardianAtlas'))assert.deepEqual(call.args.slice(2,4),[512,512]);
        phases.push(snapshot);await capture('atlas-phase1-'+state);
      }
      await fixture('coreHit');const hurt=await inspect();assert.ok(atlasFrames(hurt).includes(4));await capture('atlas-authored-hurt');
      const accepted=await fixture('phaseTwo');assert.ok(accepted>0);
      for(const state of ['charge','fire','exposed']){
        await fixture('bossUntil',state);const snapshot=await inspect();assert.equal(snapshot.boss.phase,2);assert.equal(snapshot.boss.vulnerability,state==='exposed');
        assert.ok(atlasFrames(snapshot).includes(state==='charge'?2:state==='fire'?6:5));assert.equal(snapshot.boss.animation.coverRect,null);
        phases.push(snapshot);await capture('atlas-phase2-'+state);
      }
      const restart=await fixture('restart');assert.equal(restart.running,true);assert.equal(restart.pending,true);
      await wait(()=>window.__SPECIALIST_QA__.snapshot().legacyFramePending);
      return {phases,acceptedPhaseOneHitGroups:accepted,restart};
    });
    profile.status='passed';await context.close();context=null;page=null;await save();
  }
  report.status='passed';report.exitCode=0;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
  if(profile)profile.status='failed';if(page&&evidenceReady){report.failureSnapshot=await inspect().catch(()=>null);await page.screenshot({path:path.join(output,(profile?.id||'unknown')+'-failure.png')}).catch(()=>{});}
}).finally(async()=>{
  if(report.packageFiles)for(const[file,before]of Object.entries(report.packageFiles))try{
    assert.equal(sha256(await fs.readFile(path.join(root,file))),before.sha256,'Immutable package changed during controlled QA: '+file);
  }catch(error){report.status='failed';report.exitCode=1;report.error??=errorText(error);process.exitCode=1;}
  await context?.close();await browser?.close();await server?.close();report.durationMs=Date.now()-began;report.finishedAt=new Date().toISOString();
  if(evidenceReady)await save();console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,profiles:report.profiles.map(item=>({id:item.id,status:item.status,checks:item.checks.map(check=>({name:check.name,status:check.status}))})),error:report.error,output}));
});
