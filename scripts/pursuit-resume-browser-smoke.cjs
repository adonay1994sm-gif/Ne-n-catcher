// Restores an authentic stage-2 entry save; never advances time or inserts enemies.
// node scripts/pursuit-resume-browser-smoke.cjs --root preview-dist \
//   --checkpoint /path/to/natural-run/results.json --output /tmp/pursuit-resume \
//   --expected-commit FULL_SHA
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText} = require('./browser-qa-helpers.cjs');
const {values} = parseArgs({options: {root:{type:'string'},checkpoint:{type:'string'},output:{type:'string'},
  'expected-commit':{type:'string'}}});
assert.ok(values.checkpoint && values.output && values['expected-commit'], 'checkpoint, output and expected-commit are required');
const root=path.resolve(values.root||'preview-dist'), output=path.resolve(values.output);
const report={status:'running',exitCode:null,command:process.argv,startedAt:new Date().toISOString(),
  checks:[],errors:[],samples:[],limits:[
    'Authentic stage-entry save from a previous natural run is the only fixture.',
    'Read-only diagnostics are injected into a local response; package files, spawning, time and health stay unchanged.',
    'Real Chromium 390x844 DPR1; no Safari, physical iPhone or aesthetic certification.']};
let server,browser,page,ready=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>window.__RESUME_QA__());
const wait=(fn,arg,timeout=30000)=>page.waitForFunction(fn,arg,{polling:100,timeout});
async function check(name,action){
  const entry={name,status:'running'};report.checks.push(entry);
  try{await action();assert.deepEqual(report.errors,[]);entry.status='passed';}
  catch(e){entry.status='failed';entry.error=errorText(e);throw e;}
  finally{await save();}
}
(async()=>{
  await prepareEvidence(output);ready=true;
  await fs.copyFile(__filename,path.join(output,'qa-script-used.cjs'));
  const fixtureBytes=await fs.readFile(values.checkpoint);
  const source=JSON.parse(fixtureBytes);
  const checkpoint=source.checkpoint?.checkpoint?.entry?source.checkpoint.checkpoint:source;
  assert.equal(checkpoint.version,2);assert.equal(checkpoint.checkpoint.stageNumber,2);
  await fs.writeFile(path.join(output,'checkpoint-fixture.json'),JSON.stringify(checkpoint,null,2)+'\n');
  report.fixtureSource={path:path.resolve(values.checkpoint),sha256:sha256(fixtureBytes),
    originalBuild:source.buildInfo?.commit,record:checkpoint};
  report.buildInfo=JSON.parse(await fs.readFile(path.join(root,'build-info.json')));
  assert.equal(report.buildInfo.commit,values['expected-commit']);assert.equal(report.buildInfo.dirty,false);
  report.gameSha256=sha256(await fs.readFile(path.join(root,'juego/game.js')));
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(record=>{
    if(location.pathname.endsWith('/juego/index.html')&&!localStorage.getItem('neon-preview-v1:neonCronium.chronosVoyage.v2')){
      localStorage.setItem('neon-preview-v1:neonCronium.chronosVoyage.v2',JSON.stringify(record));
    }
  },checkpoint);
  page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(errorText(e)));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  page.on('requestfailed',r=>report.errors.push({url:r.url(),failure:r.failure()}));
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),source=await response.text();
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2);
    const hook=`window.__RESUME_QA__=()=>({state,elapsed,hull,classicPatrolTimer,legacyRunning,
      stage:classicFlightView?.stageNumber,routeElapsed:classicFlightView?.elapsed,
      stageElapsed:classicFlightView?.stageElapsed,
      pursuers:items.filter(i=>i.classicScout?.tacticsVersion==='classic-pursuit-v2')
        .map(i=>({id:i.id,x:i.x,y:i.y,age:i.classicScout.age,state:i.classicScout.state,fired:i.classicScout.fired}))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  await page.goto(server.url,{waitUntil:'load'});await page.locator('#classiclink').click();
  await wait(()=>typeof __RESUME_QA__==='function'&&__RESUME_QA__().state==='menu');
  await page.locator('#play').click();await page.locator('#launch').click();
  await wait(()=>__RESUME_QA__().state==='playing'&&__RESUME_QA__().elapsed>0);
  await check('restored stage 1.2 has no pursuer before its seven-second encounter grace',async()=>{
    const began=Date.now();
    while(true){const q=await inspect();report.samples.push(q);
      assert.equal(q.stage,2);assert.equal(q.state,'playing');assert.ok(q.legacyRunning);
      assert.equal(q.pursuers.length,0,'Patrol spawned before the restored entry grace elapsed');
      if(q.elapsed>=6.6){assert.ok(q.elapsed<7);report.beforeSpawn=q;break;}
      assert.ok(Date.now()-began<30000,'Encounter clock did not advance');await page.waitForTimeout(80);
    }
  });
  await check('the naturally scheduled pursuer appears after seven seconds and freezes on pause',async()=>{
    await wait(()=>__RESUME_QA__().pursuers.length===1);
    const q=await inspect();assert.ok(q.elapsed>=7&&q.elapsed<8,'Unexpected patrol schedule');
    report.spawn=q;await page.locator('#pause').click();const paused=await inspect();
    assert.equal(paused.state,'paused');await page.waitForTimeout(600);
    assert.deepEqual(await inspect(),paused,'Pause advanced route, patrol or pursuit state');
    report.paused=paused;
    await page.screenshot({path:path.join(output,'01-restored-pursuit-paused.png')});
  });
  report.status='passed';report.exitCode=0;
})().catch(e=>{report.status='failed';report.exitCode=1;report.failure=errorText(e);process.exitCode=1;})
  .finally(async()=>{report.finishedAt=new Date().toISOString();if(ready)await save();
    await browser?.close();await server?.close();console.log(JSON.stringify({status:report.status,
      exitCode:report.exitCode,checks:report.checks.map(c=>({name:c.name,status:c.status})),output}));});
