// Focused Chromium QA of a declared, valid stage-1.5 entry save. No in-play
// health, clocks, positions, spawns or controls are changed by instrumentation.
// node scripts/comet-shower-browser-smoke.cjs --root preview-dist \
//   --output /tmp/comet-shower-01 --expected-commit FULL_SHA
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},
  'expected-commit':{type:'string'},timeout:{type:'string'}}});
assert.ok(values.output&&/^[a-f0-9]{40}$/.test(values['expected-commit']||''),
  'Provide --output and a full --expected-commit');
const root=path.resolve(values.root||'preview-dist'),output=path.resolve(values.output);
const timeout=Number(values.timeout||180000);
assert.ok(Number.isFinite(timeout)&&timeout>=45000&&timeout<=300000);
const report={status:'running',exitCode:null,command:process.argv,sourceRoot:root,
  startedAt:new Date().toISOString(),checks:[],errors:[],consoleErrors:[],failedRequests:[],
  screenshots:[],samples:[],actions:[],limits:[
    'Only a declared valid saved entry1.5 is seeded before game boot: hull100, score160, collected18, maxCombo1, unlockedStage5, owned Pulse and recovered emitter. The earlier four stages and their collection are not claimed as naturally played.',
    'The package advances naturally for all38 seconds of El gran vacío and the1.2-second C9 approach. The QA pilot sends actual mouse movement and pause/resume UI inputs; no health, route time, spawns, speed, rewards or enemy state is overwritten.',
    'Evasion consults only currently visible nuclei and their observed velocity, the existing collision outline and current flight bounds. Hidden reserved corridors and future encounter plans are neither exposed by diagnostics nor consulted by the pilot.',
    'Read-only closure snapshots and native Canvas/RAF observers are added to the local HTTP response. They delegate the original callbacks, create no extra RAF owner and leave package files unchanged.',
    'Service workers are explicitly blocked for local response instrumentation. This run is not offline certification, a complete voyage, a human balance review, Safari or physical iPhone certification.'
  ]};
let browser,server,context,page,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__COMET_SHOWER_QA__(),observer:{
  frames:window.__COMET_SHOWER_OBSERVER__.frames,maximum:window.__COMET_SHOWER_OBSERVER__.maximum,
  errors:[...window.__COMET_SHOWER_OBSERVER__.errors],draws:window.__COMET_SHOWER_OBSERVER__.draws,
  cells:[...window.__COMET_SHOWER_OBSERVER__.cells],recentDraws:window.__COMET_SHOWER_OBSERVER__.recentDraws.slice(-12),
  births:JSON.parse(JSON.stringify(window.__COMET_SHOWER_OBSERVER__.births)),
  warnings:JSON.parse(JSON.stringify(window.__COMET_SHOWER_OBSERVER__.warnings)),
  peak:window.__COMET_SHOWER_OBSERVER__.peak}}));
const wait=(fn,arg,ms=30000)=>page.waitForFunction(fn,arg,{polling:60,timeout:ms});
function healthy(q){
  assert.deepEqual(report.errors,[],'Uncaught JavaScript exceptions');
  assert.deepEqual(report.consoleErrors,[],'Console errors');
  assert.deepEqual(report.failedRequests,[],'Failed game resources');
  assert.deepEqual(q.observer.errors,[],'RAF callbacks threw');
  assert.ok(q.legacyRunning,'Legacy loop stopped');
  assert.ok(q.observer.maximum<=1,'Duplicate pending RAF owner');
  assert.ok(!['destroying','gameover'].includes(q.state),`Natural pilot lost the hull: ${q.hull}%`);
}
async function check(name,fn){
  const item={name,status:'running'},began=Date.now();report.checks.push(item);await save();
  console.log(`[Comet shower] ${name}`);
  try{item.result=await fn();healthy(await inspect());item.status='passed';}
  catch(error){item.status='failed';item.error=errorText(error);throw error;}
  finally{item.durationMs=Date.now()-began;await save();}
}
async function capture(name,q){
  const file=`${String(report.screenshots.length+1).padStart(2,'0')}-${name}.png`;
  await page.screenshot({path:path.join(output,file)});
  report.screenshots.push({file,type:'Authentic Chromium game with the declared stage-entry fixture',
    elapsed:q.elapsed,stageId:q.route?.stageId,stageElapsed:q.route?.stageElapsed,hull:q.hull,
    comets:q.items.filter(item=>item.showerComet).map(item=>({id:item.id,x:item.x,y:item.y,vx:item.vx,vy:item.vy})),
    actualAtlasCells:q.observer.cells});await save();
}
function circleTouchesOutline(x,y,radius,outline){
  let inside=false;
  for(let index=0,previous=outline.length-1;index<outline.length;previous=index++){
    const [ax,ay]=outline[previous],[bx,by]=outline[index];
    if((by>y)!==(ay>y)&&x<(ax-bx)*(y-by)/((ay-by)||.000001)+bx)inside=!inside;
    const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
    const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
    if((x-ax-t*dx)**2+(y-ay-t*dy)**2<=radius**2)return true;
  }
  return inside;
}
function observedPilotTarget(q){
  const bounds=q.bounds||{minX:119,maxX:q.W-119};
  const clamp=x=>Math.max(bounds.minX,Math.min(bounds.maxX,x));
  // Offscreen scheduling and the policy's reserved corridor are deliberately
  // unavailable here. Predict briefly from already visible physical motion.
  const visible=q.items.filter(item=>item.showerComet&&item.x>=0&&item.x<=q.W&&item.y>=0&&item.y<=q.H);
  const candidates=[clamp(q.player.x),clamp(q.W/2),bounds.minX,bounds.maxX];
  for(let x=bounds.minX;x<=bounds.maxX;x+=24)candidates.push(x);
  const cost=x=>{
    let result=Math.abs(x-q.W/2)*.012+Math.abs(x-q.player.x)*.025;
    for(const item of visible)for(let future=0;future<=1.1;future+=.04){
      const playerX=x+(q.player.x-x)*Math.exp(-q.follow*future);
      const dx=item.x+item.vx*future-playerX,dy=item.y+item.vy*future-q.player.y;
      if(circleTouchesOutline(dx,dy,item.r*.94+8,q.outline))result+=20000/(.15+future);
    }
    return result;
  };
  return [...new Set(candidates)].sort((left,right)=>cost(left)-cost(right))[0];
}
function frozenState(q){return{state:q.state,elapsed:q.elapsed,hull:q.hull,route:q.route,shower:q.shower,
  items:q.items.map(item=>({id:item.id,x:item.x,y:item.y,vx:item.vx,vy:item.vy,life:item.life}))};}

(async()=>{
  await prepareEvidence(output);evidenceReady=true;
  await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  report.qaScriptSha256=sha256(await fs.readFile(__filename));
  report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  assert.equal(report.buildInfo.commit,values['expected-commit']);assert.equal(report.buildInfo.dirty,false);
  assert.equal(report.buildInfo.engineV1,false);
  const modelPath=path.resolve(__dirname,'../src/game/progression/chronos-flight.js');
  const model=await import(pathToFileURL(modelPath).href);
  const checkpoint=model.normalizeChronosVoyageCheckpoint(model.createChronosVoyageCheckpoint(5,{goal:36,collected:18}));
  assert.ok(checkpoint);assert.equal(checkpoint.stageId,'1.5');
  report.fixture={version:2,checkpoint,entry:{hull:100,score:160,collected:18,maxCombo:1},
    unlockedStage:5,completed:false};
  report.equipmentFixture={version:1,recoveredTwin:true,unlocked:['pulse'],selected:'pulse'};
  report.fixtureSource={model:modelPath,sha256:sha256(await fs.readFile(modelPath)),
    method:'createChronosVoyageCheckpoint(5,{goal:36,collected:18}), normalized before browser initialization',
    showerSeed:5*811,contentVersion:checkpoint.contentVersion};
  await fs.writeFile(path.join(output,'declared-checkpoint-fixture.json'),JSON.stringify({voyage:report.fixture,
    equipment:report.equipmentFixture,showerSeed:report.fixtureSource.showerSeed},null,2)+'\n');
  const prefix=report.buildInfo.storagePrefix;assert.ok(typeof prefix==='string'&&prefix.length);
  report.packageFiles={};
  for(const file of ['build-info.json','juego/game.js','juego/content-runtime.js','juego/styles.css',
    'juego/assets/comet_flight_atlas_v3.webp']){
    const bytes=await fs.readFile(path.join(root,file));report.packageFiles[file]={bytes:bytes.length,sha256:sha256(bytes)};
  }
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser={version:browser.version(),viewport:{width:390,height:844},deviceScaleFactor:1};
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(({prefix,fixture,equipment})=>{
    if(location.pathname.endsWith('/juego/index.html')&&!localStorage.getItem(prefix+'neonCatcher.chronosVoyage.v2')){
      localStorage.setItem(prefix+'neonCatcher.chronosVoyage.v2',JSON.stringify(fixture));
      localStorage.setItem(prefix+'neonCatcher.flightEquipment.v1',JSON.stringify(equipment));
    }
    const observer=window.__COMET_SHOWER_OBSERVER__={frames:0,maximum:0,pending:new Set(),errors:[],
      draws:0,cells:new Set(),recentDraws:[],births:{},warnings:[],peak:0};
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>{
      const id=request(now=>{observer.pending.delete(id);observer.frames++;
        try{callback(now);
          const q=window.__COMET_FRAME_QA__?.();
          if(q){
            observer.peak=Math.max(observer.peak,q.items.length);
            for(const item of q.items){
              const record=observer.births[item.id]??={id:item.id,burst:item.burst,firstY:item.y,
                firstX:item.x,firstElapsed:q.elapsed,firstStageElapsed:q.stageElapsed,
                initialVx:item.vx,initialVy:item.vy,minY:item.y,maxY:item.y,observations:0};
              record.lastElapsed=q.elapsed;record.lastX=item.x;record.lastY=item.y;
              record.minY=Math.min(record.minY,item.y);record.maxY=Math.max(record.maxY,item.y);record.observations++;
              if(record.firstY>q.H&&item.y<=q.H)record.enteredFromBelow=true;
            }
            if(q.warningCount>observer.warnings.length)observer.warnings.push({count:q.warningCount,
              elapsed:q.elapsed,stageElapsed:q.stageElapsed,text:q.transmission});
          }
        }catch(error){observer.errors.push(error.stack||String(error));throw error;}});
      observer.pending.add(id);observer.maximum=Math.max(observer.maximum,observer.pending.size);return id;
    };
    window.cancelAnimationFrame=id=>{observer.pending.delete(id);return cancel(id);};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
      const result=Reflect.apply(draw,this,[image,...args]);
      const source=image?.currentSrc||image?.src||'';
      if(this.canvas.id==='canvas'&&source.includes('/comet_flight_atlas_v3.webp')&&args.length===8){
        const matrix=this.getTransform(),cell=args.slice(0,4).join(',');observer.draws++;observer.cells.add(cell);
        observer.recentDraws.push({frame:observer.frames,cell,sourceRect:args.slice(0,4),
          destination:args.slice(4),transform:{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f}});
        if(observer.recentDraws.length>1200)observer.recentDraws.shift();
      }
      return result;
    };
  },{prefix,fixture:report.fixture,equipment:report.equipmentFixture});
  page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>report.errors.push(errorText(error)));
  page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)report.failedRequests.push({url:response.url(),status:response.status()});});
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),bytes=await response.body(),source=bytes.toString('utf8');
    assert.equal(sha256(bytes),report.packageFiles['juego/game.js'].sha256);
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2,'Legacy marker changed');
    const hook=`window.__COMET_FRAME_QA__=()=>({elapsed,H,stageElapsed:classicFlightView?.stageElapsed,
      warningCount:classicCometShower?.warnings||0,transmission:flightTransmission?.text||'',
      items:items.filter(item=>item.showerComet).map(item=>({id:item.id,burst:item.showerBurst,
        x:item.x,y:item.y,vx:item.vx,vy:item.vy}))});
      window.__COMET_SHOWER_QA__=()=>({state,elapsed,W,H,hull,collected,legacyRunning,
      follow:9+settings.sensitivity/100*8,outline:SHIP_COLLISION_OUTLINE,
      player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
      bounds:classicFlightBounds?{...classicFlightBounds}:null,
      route:classicFlightView?{stageId:classicFlightView.stageId,stageNumber:classicFlightView.stageNumber,
        elapsed:classicFlightView.elapsed,stageElapsed:classicFlightView.stageElapsed,
        waitingFor:classicFlightView.waitingFor,stageGoal:classicFlightView.stageGoal}:null,
      shower:classicCometShower?NeonCampaign.cometShowerSnapshot(classicCometShower):null,
      transmission:flightTransmission?{speaker:flightTransmission.speaker,text:flightTransmission.text}:null,
      voyage:classicVoyageRecord?JSON.parse(JSON.stringify(classicVoyageRecord)):null,
      items:items.map(item=>({id:item.id,type:item.type,x:item.x,y:item.y,vx:item.vx,vy:item.vy,r:item.r,
        life:item.life,showerComet:!!item.showerComet,showerBurst:item.showerBurst}))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  await page.goto(server.url,{waitUntil:'load'});await page.locator('#classiclink').click();
  await wait(()=>typeof window.__COMET_SHOWER_QA__==='function'&&window.__COMET_SHOWER_QA__().state==='menu');
  await check('the declared saved entry1.5 launches through the real campaign selector',async()=>{
    await page.locator('#play').click();
    assert.equal(await page.locator('[data-voyage-stage="5"]').getAttribute('aria-pressed'),'true');
    await page.locator('#launch').press('Enter');
    await wait(()=>window.__COMET_SHOWER_QA__().state==='playing'&&window.__COMET_SHOWER_QA__().elapsed>0);
    const q=await inspect();assert.equal(q.route.stageId,'1.5');assert.equal(q.collected,18);
    assert.equal(q.hull,100);assert.equal(q.items.filter(item=>item.showerComet).length,0);
    await capture('vacuum-entry-before-shower',q);return q;
  });
  const box=await page.locator('#canvas').boundingBox();
  await check('three naturally scheduled fast comet trains animate, freeze on pause and preserve a playable route to C9',async()=>{
    const began=Date.now(),screens=[],seenIds=new Set();let warningCaptured=false,paused=false;
    let trackingId=null,lastMotionCapture=-Infinity,arrived=null;
    while(Date.now()-began<timeout){
      const q=await inspect();healthy(q);report.samples.push(q);
      assert.ok(q.observer.peak<=5,'Active comet cap exceeded');
      for(const item of q.items.filter(item=>item.showerComet))seenIds.add(item.id);
      if(!warningCaptured&&/lluvia de cometas/i.test(q.transmission?.text||'')){
        warningCaptured=true;report.warning=q;await capture('comet-shower-warning',q);
      }
      const visible=q.items.filter(item=>item.showerComet&&item.x>=0&&item.x<=q.W&&item.y>=0&&item.y<=q.H);
      if(!paused&&visible.length&&q.route.stageId==='1.5'){
        await page.locator('#pause').click();const before=await inspect();
        assert.equal(before.state,'paused');assert.ok(before.items.some(item=>item.showerComet));
        await page.waitForTimeout(450);const after=await inspect();
        assert.deepEqual(frozenState(after),frozenState(before),'Pause advanced route, shower or comet motion');
        report.pause={before,after};await capture('live-comets-frozen-on-pause',after);
        await page.locator('#resume').press('Enter');paused=true;continue;
      }
      if(q.state==='playing'&&visible.length&&screens.length<3){
        trackingId??=visible[0].id;
        const tracked=visible.find(item=>item.id===trackingId)||visible[0];
        if(q.elapsed-lastMotionCapture>=.16){
          screens.push({elapsed:q.elapsed,item:{...tracked},draws:q.observer.recentDraws});
          lastMotionCapture=q.elapsed;await capture(`moving-comet-frame-${screens.length}`,q);
        }
      }
      if(q.route.stageId==='1.6'&&q.route.waitingFor==='service'){
        assert.equal(q.state,'paused');arrived=q;await capture('c9-after-comet-crossings',q);break;
      }
      if(q.state==='playing'){
        const target=observedPilotTarget(q),x=box.x+target/q.W*box.width,y=box.y+box.height*.52;
        await page.mouse.move(x,y);report.actions.push({elapsed:q.elapsed,type:'mouse-hover',targetLogicalX:target});
      }
      if(report.samples.length%20===0)await save();
      await page.waitForTimeout(80);
    }
    const final=await inspect();
    assert.ok(arrived,'Natural crossing did not reach the service checkpoint');
    assert.ok(warningCaptured,'No in-game shower warning was observed');assert.ok(paused,'No live pause was tested');
    assert.equal(screens.length,3,'Three actual moving-comet screenshots were not recorded');
    assert.ok(new Set(screens.map(item=>`${item.item.x}:${item.item.y}`)).size===3,'Moving captures duplicated positions');
    assert.ok(final.observer.cells.length>=3,'Fewer than three actual atlas cells were drawn');
    const births=Object.values(final.observer.births);
    assert.equal(births.length,10,'Three trains must emit exactly3+4+3 physical bodies');
    assert.deepEqual([0,1,2].map(burst=>births.filter(item=>item.burst===burst).length),[3,4,3]);
    assert.equal(final.observer.warnings.length,3);
    for(const warning of final.observer.warnings){
      const first=births.filter(item=>item.burst===warning.count-1).sort((a,b)=>a.firstStageElapsed-b.firstStageElapsed)[0];
      assert.ok(first.firstStageElapsed-warning.stageElapsed>=1.9,'Warning offered less than two played seconds');
    }
    assert.ok(births.some(item=>item.initialVy<0&&item.enteredFromBelow),
      'No overtaking comet survived the lower boundary into visible flight space');
    assert.ok(final.elapsed>=39,'The stage/approach was shortened by instrumentation');
    assert.equal(arrived.voyage.checkpoint.stageNumber,6);
    assert.equal(arrived.voyage.checkpoint.serviceWaiting,true);
    report.motionScreens=screens;report.arrival=arrived;report.observedCometIds=[...seenIds];
    return{hull:arrived.hull,playedSeconds:final.elapsed,peak:final.observer.peak,
      draws:final.observer.draws,atlasCells:final.observer.cells,physicalComets:births.length};
  });
  for(const [file,entry]of Object.entries(report.packageFiles))assert.equal(sha256(await fs.readFile(path.join(root,file))),entry.sha256,
    `Package file changed during QA: ${file}`);
  report.status='passed';report.exitCode=0;
})().catch(error=>{report.status='failed';report.exitCode=1;report.failure=errorText(error);process.exitCode=1;})
  .finally(async()=>{report.finishedAt=new Date().toISOString();
    if(page&&report.status==='failed')try{await page.screenshot({path:path.join(output,'failure.png')});report.failureSnapshot=await inspect();}catch{}
    if(evidenceReady)await save();await browser?.close();await server?.close();
    console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,
      checks:report.checks.map(item=>({name:item.name,status:item.status})),output}));});
