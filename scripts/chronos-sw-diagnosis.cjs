// Observe native Chromium service-worker update jobs on a temporary preview copy.
// The shipped package, SW scripts and game files remain unchanged.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},'skip-worker-inspection':{type:'boolean'}}});
const source=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||'docs/production-reports/evidence/chronos-destruction/sw-diagnosis-01');
const report={status:'running',startedAt:new Date().toISOString(),source,command:process.argv,
  errors:[],browserRequests:[],browserResponses:[],workerVersions:[],workerRegistrations:[],snapshots:[],
  limits:['Temporary package copy; native Chromium workers. No source/package writes.',
    'The update job is observed without awaiting its browser Promise, so intermediate installation/activation remains inspectable.',
    'Only strict revision replacement, offline game/launcher and foreign-cache preservation can certify success.']};
const began=Date.now();
let temp,server,browser,context,page,ready=false;
const save=()=>saveEvidence(output,report);
const bounded=(promise,ms,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error(label)),ms))]).finally(()=>clearTimeout(timer));};
async function snapshot(label){
  const value={label,atMs:Date.now()-began,...await bounded(page.evaluate(async()=>({
    now:performance.now(),controller:navigator.serviceWorker.controller?.scriptURL,
    registrations:(await navigator.serviceWorker.getRegistrations()).map(reg=>({scope:reg.scope,
      installing:reg.installing?{scriptURL:reg.installing.scriptURL,state:reg.installing.state}:null,
      waiting:reg.waiting?{scriptURL:reg.waiting.scriptURL,state:reg.waiting.state}:null,
      active:reg.active?{scriptURL:reg.active.scriptURL,state:reg.active.state}:null})),
    caches:await caches.keys(),trace:window.__SW_DIAG_TRACE__||[],update:window.__SW_DIAG_UPDATE__||null
  })),5000,'Read-only page state inspection timed out')};
  value.workerInspectionSkipped=Boolean(values['skip-worker-inspection']);
  value.workers=values['skip-worker-inspection']?[]:await Promise.all(context.serviceWorkers().map(async worker=>{
    try{return{url:worker.url(),...await bounded(worker.evaluate(()=>({cache:typeof CACHE==='string'?CACHE:null,scope:self.registration.scope})),1500,'Worker evaluation timed out')};}
    catch(error){return{url:worker.url(),error:String(error)};}
  }));
  report.snapshots.push(value);await save();console.log(JSON.stringify({label,atMs:value.atMs,update:value.update,
    registrations:value.registrations,caches:value.caches}));return value;
}
async function poll(predicate,ms,label){const until=Date.now()+ms;while(Date.now()<until){if(await page.evaluate(predicate))return;await page.waitForTimeout(100);}throw new Error(label);}
(async()=>{
  await prepareEvidence(output);ready=true;report.scriptSha256=sha256(await fs.readFile(__filename));
  temp=await fs.mkdtemp(path.join(os.tmpdir(),'neon-chronos-sw-diagnosis-'));await fs.cp(source,temp,{recursive:true});
  const info=JSON.parse(await fs.readFile(path.join(source,'build-info.json'),'utf8'));
  report.sourceCommit=info.commit;report.sourceDirty=info.dirty;report.oldRevision=info.revision;report.newRevision='f'.repeat(64);
  assert.notEqual(report.oldRevision,report.newRevision);report.bundleSha256=sha256(await fs.readFile(path.join(source,'juego/game.js')));
  server=await startStaticServer(temp);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser=browser.version();context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'allow'});
  page=await context.newPage();const cdp=await context.newCDPSession(page);
  cdp.on('ServiceWorker.workerVersionUpdated',event=>report.workerVersions.push({atMs:Date.now()-began,...event}));
  cdp.on('ServiceWorker.workerRegistrationUpdated',event=>report.workerRegistrations.push({atMs:Date.now()-began,...event}));
  await cdp.send('ServiceWorker.enable');
  page.on('pageerror',error=>report.errors.push(errorText(error)));
  page.on('request',request=>report.browserRequests.push({atMs:Date.now()-began,url:request.url(),method:request.method()}));
  page.on('response',response=>{report.browserResponses.push({atMs:Date.now()-began,url:response.url(),status:response.status(),fromServiceWorker:response.fromServiceWorker()});if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(server.url,{waitUntil:'load'});
  await poll(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'),30000,'Launcher controller did not install');
  const game=new URL('juego/index.html?campaign=n7',server.url).href;
  await page.goto(game,{waitUntil:'load'});
  await poll(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/juego/sw.js'),30000,'Game controller did not install');
  await page.evaluate(async()=>{
    const cache=await caches.open('unrelated-app');await cache.put('/keep',new Response('safe'));
    window.__SW_DIAG_TRACE__=[];
    const record=(type,data)=>window.__SW_DIAG_TRACE__.push({type,at:performance.now(),...data});
    navigator.serviceWorker.addEventListener('controllerchange',()=>record('controllerchange',{controller:navigator.serviceWorker.controller?.scriptURL}));
    for(const reg of await navigator.serviceWorker.getRegistrations())reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;record('updatefound',{scope:reg.scope,state:worker?.state});
      worker?.addEventListener('statechange',()=>record('statechange',{scope:reg.scope,state:worker.state}));
    });
  });
  const before=await snapshot('initial-install');assert.equal(before.registrations.length,2);
  assert.ok(before.caches.some(name=>name.startsWith('neon-preview-v1:')&&name.endsWith(info.revision)));
  assert.ok(before.caches.some(name=>name.startsWith('neon-preview-launcher-v1:')&&name.endsWith(info.revision)));
  for(const file of ['launcher-sw.js','juego/sw.js']){
    const target=path.join(temp,file),original=await fs.readFile(target,'utf8');assert.ok(original.includes(info.revision));
    await fs.writeFile(target,original.replaceAll(info.revision,report.newRevision));
  }
  await page.evaluate(()=>{
    window.__SW_DIAG_UPDATE__={status:'running',started:performance.now(),jobs:[]};
    (async()=>{
      try{
        for(const registration of await navigator.serviceWorker.getRegistrations()){
          const item={scope:registration.scope,status:'pending',started:performance.now()};window.__SW_DIAG_UPDATE__.jobs.push(item);
          try{await registration.update();item.status='resolved';item.finished=performance.now();}
          catch(error){item.status='rejected';item.error=String(error);throw error;}
        }
        window.__SW_DIAG_UPDATE__.status='resolved';
      }catch(error){window.__SW_DIAG_UPDATE__.status='rejected';window.__SW_DIAG_UPDATE__.error=String(error);}
      finally{window.__SW_DIAG_UPDATE__.finished=performance.now();}
    })();
  });
  const updateStart=Date.now();let current;
  for(const mark of [1000,5000,15000,31000,45000,65000]){
    const remaining=mark-(Date.now()-updateStart);if(remaining>0)await page.waitForTimeout(remaining);
    current=await snapshot(`update-at-${mark}ms`);
    if(mark>=31000&&current.update.status==='running')report.originalThirtySecondTimeoutExceeded=true;
    if(current.update.status!=='running')break;
  }
  if(current.update.status!=='resolved'){
    report.strictUpgradeCompleted=false;
    throw new Error(`Sequential registration.update() remains ${current.update.status}; inspect intermediate worker states and request trace`);
  }
  await poll(async()=>{
    const keys=await caches.keys();const regs=await navigator.serviceWorker.getRegistrations();
    return regs.length===2&&regs.every(reg=>reg.active?.state==='activated')&&keys.filter(key=>key.startsWith('neon-preview-')).length===2&&keys.filter(key=>key.startsWith('neon-preview-')).every(key=>key.endsWith('f'.repeat(64)));
  },30000,'Workers did not replace both scoped cache revisions');
  const upgraded=await snapshot('strict-upgrade');
  assert.ok(upgraded.caches.includes('unrelated-app'));assert.ok(!upgraded.caches.some(key=>key.endsWith(info.revision)));
  assert.equal(await page.evaluate(async()=>await(await(await caches.open('unrelated-app')).match('/keep')).text()),'safe');
  await page.reload({waitUntil:'load'});await context.setOffline(true);
  await page.goto(game,{waitUntil:'load'});assert.equal(await page.locator('#levels').count(),1);
  await page.goto(server.url,{waitUntil:'load'});assert.equal(await page.locator('#classiclink').isVisible(),true);
  assert.equal(await page.locator('#classiclink').getAttribute('href'),'juego/index.html');
  assert.equal(await page.locator('#qaArchive').getAttribute('open'),null);assert.equal(await page.locator('#n7link').isVisible(),false);
  const offline=await snapshot('offline-game-and-launcher');assert.ok(offline.controller.endsWith('/launcher-sw.js'));
  assert.ok(offline.caches.includes('unrelated-app'));assert.deepEqual(report.errors,[]);
  report.strictUpgradeCompleted=true;report.offlineGameAndLauncherPassed=true;report.foreignCachePreserved=true;report.status='passed';report.exitCode=0;
})().catch(error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);console.error(report.error);}).finally(async()=>{
  report.finishedAt=new Date().toISOString();report.durationMs=Date.now()-began;if(server)report.serverRequests=server.requests;
  if(ready)await save();await context?.close();await browser?.close();await server?.close();if(temp)await fs.rm(temp,{recursive:true,force:true});
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,output,durationMs:report.durationMs,error:report.error}));process.exitCode=report.exitCode??1;
});
