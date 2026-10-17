// Real Chromium isolation of an old worker's in-flight response crossing a
// revision activation. The actual built game worker is used on a temporary
// package copy; the original package, gameplay, saves and production are untouched.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const source=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||'docs/production-reports/evidence/unified-flight/sw-inflight-01');
const began=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,source,
 steps:[],errors:[],limits:['Actual Chromium CacheStorage and actual built game service worker on a temporary copy.',
 'Cleanup is deliberately interleaved using real CacheStorage.delete from the QA page while a worker-owned fetch is outstanding; this is not an actual new-worker activation.',
 'A QA-only diagnostic document and delayed network probe isolate cache lifecycle; this is not gameplay or physical iPhone certification.']};
let temp,server,browser,context,page,releaseProbe,evidenceReady=false;
const save=()=>saveEvidence(output,report);
async function step(name,operation){const result={name,status:'running'};report.steps.push(result);await save();const began=Date.now();console.log('[SW in-flight] '+name);
 try{result.result=await operation();result.status='passed';}catch(error){result.status='failed';result.error=errorText(error);throw error;}finally{result.durationMs=Date.now()-began;await save();}}
const bounded=(promise,ms,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})]).finally(()=>clearTimeout(timer));};

// This installed Playwright treats a Promise from waitForFunction as truthy.
// Poll evaluated asynchronous predicates in Node so false really keeps waiting.
async function waitAsync(page,predicate,argument,{timeout=30000}={}) {
 const until=Date.now()+timeout;
 while(Date.now()<until){if(await page.evaluate(predicate,argument))return;await page.waitForTimeout(100);}
 throw new Error('Asynchronous browser predicate timed out after '+timeout+' ms');
}

(async()=>{
 await prepareEvidence(output);evidenceReady=true;report.scriptSha256=sha256(await fs.readFile(__filename));
 const info=JSON.parse(await fs.readFile(path.join(source,'build-info.json'),'utf8'));
 report.sourceCommit=info.commit;report.sourceDirty=info.dirty;report.originalPackageRevision=info.revision;
 report.oldRevision=info.revision;report.newRevision='e'.repeat(64);assert.notEqual(report.oldRevision,report.newRevision);
 temp=await fs.mkdtemp(path.join(os.tmpdir(),'neon-inflight-cache-'));await fs.cp(source,temp,{recursive:true});
 await fs.writeFile(path.join(temp,'juego/sw-diagnostic.html'),'<!doctype html><html><head><title>Service worker isolation fixture</title></head><body>QA lifecycle only</body></html>');
 const workerFile=path.join(temp,'juego/sw.js'),baseWorker=await fs.readFile(workerFile,'utf8');
 report.originalWorkerSha256=sha256(baseWorker);
 await fs.writeFile(workerFile,baseWorker+'\nself.addEventListener("message", event=>{if(event.data?.qa==="cache-generation")event.ports[0]?.postMessage({cache:CACHE});});\n');
 report.cleanupMode='controlled-cache-unlink-interleaving';
 report.limits.push('A separate same-URL upgrade smoke verifies actual activation and offline navigation; this fixture isolates CacheStorage handles only.');
 report.limits.push('A QA-only message listener reports the active worker CACHE constant without changing install/activate/fetch handlers.');
 server=await startStaticServer(temp);const gameScope=server.url+'juego/';
 report.scope=gameScope;report.oldCache='neon-preview-v1:'+gameScope+'::'+report.oldRevision;
 report.newCache='neon-preview-v1:'+gameScope+'::'+report.newRevision;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});page=await context.newPage();
 await page.addInitScript(()=>{const register=navigator.serviceWorker.register.bind(navigator.serviceWorker);window.__QA_REGISTER_CALLS__=[];navigator.serviceWorker.register=(...args)=>{window.__QA_REGISTER_CALLS__.push({args,stack:new Error().stack});return register(...args);};});
 report.navigations=[];page.on('framenavigated',frame=>{if(frame===page.mainFrame())report.navigations.push(frame.url());});
 page.on('pageerror',error=>report.errors.push(errorText(error)));
 const snapshot=()=>page.evaluate(async()=>({url:location.href,title:document.title,bodyText:document.body.textContent,registerCalls:window.__QA_REGISTER_CALLS__,controller:navigator.serviceWorker.controller?.scriptURL,activeCache:await window.__QA_ACTIVE_CACHE__?.(),
  caches:await caches.keys(),registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.scriptURL,state:r.active?.state}))}));
 await step('activate the original game worker on a resource-free diagnostic document',async()=>{
  await page.goto(gameScope+'sw-diagnostic.html',{waitUntil:'load'});
  await page.evaluate(()=>{window.__QA_ACTIVE_CACHE__=async()=>{const registration=await navigator.serviceWorker.getRegistration();if(!registration?.active)return null;return new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>resolve(null),1500);channel.port1.onmessage=event=>{clearTimeout(timer);resolve(event.data.cache);channel.port1.close();};registration.active.postMessage({qa:'cache-generation'},[channel.port2]);});};});
  await page.evaluate(async()=>{await navigator.serviceWorker.register('sw.js',{scope:'./'});await navigator.serviceWorker.ready;});
  await waitAsync(page,async cache=>{const r=await navigator.serviceWorker.getRegistration();return navigator.serviceWorker.controller&&r?.active?.state==='activated'&&(await caches.keys()).includes(cache);},report.oldCache,{polling:100,timeout:30000});
  await page.evaluate(async()=>{const cache=await caches.open('unrelated-inflight-app');await cache.put('/keep',new Response('safe'));});
  return snapshot();
 });
 let readyResolve;
 const ready=new Promise(resolve=>{readyResolve=resolve;});const gate=new Promise(resolve=>{releaseProbe=resolve;});
 await context.route('**/sw-inflight-probe.js',async route=>{
  const details={url:route.request().url(),serviceWorkerOwned:Boolean(route.request().serviceWorker())};readyResolve(details);
  await gate;await route.fulfill({status:200,contentType:'application/javascript',body:'qa-inflight-response'});
 });
 await step('hold an actual network response requested by the old service worker',async()=>{
  await page.evaluate(()=>{window.__QA_PROBE_RESPONSE__=fetch('sw-inflight-probe.js').then(response=>response.text());});
  const request=await bounded(ready,15000,'The old worker did not request the probe network response');
  assert.equal(request.serviceWorkerOwned,true,'The probe was not fetched by a service worker');report.probe=request;return request;
 });
 await step('unlink the old named cache while a worker-owned response remains held',async()=>{
  await page.evaluate(async names=>{
    const next=await caches.open(names.current);await next.put('qa-next-generation',new Response('preserved'));
    await caches.delete(names.old);
  },{current:report.newCache,old:report.oldCache});
  report.beforeRelease=await snapshot();
  assert.equal(report.beforeRelease.activeCache,report.oldCache,'The controlled old worker changed unexpectedly');
  assert.ok(!report.beforeRelease.caches.includes(report.oldCache),'The fixture did not unlink the old cache');
  assert.ok(report.beforeRelease.caches.includes(report.newCache));
  assert.ok(report.beforeRelease.caches.includes('unrelated-inflight-app'));return report.beforeRelease;
 });
 await step('release the old response without resurrecting its deleted cache',async()=>{
  releaseProbe();const response=await bounded(page.evaluate(()=>window.__QA_PROBE_RESPONSE__),15000,'The held response did not finish');
  assert.equal(response,'qa-inflight-response');await page.waitForTimeout(500);report.afterRelease=await snapshot();
  if(report.afterRelease.caches.includes(report.oldCache))report.resurrectedEntries=await page.evaluate(async name=>(await(await caches.open(name)).keys()).map(request=>request.url),report.oldCache);
  assert.ok(report.afterRelease.caches.includes('unrelated-inflight-app'),'A foreign cache was deleted');
  assert.ok(report.afterRelease.caches.includes(report.newCache),'The active cache was lost');
  assert.ok(!report.afterRelease.caches.includes(report.oldCache),'An old in-flight response resurrected its deleted named cache');
  assert.deepEqual(report.errors,[]);return report.afterRelease;
 });
 report.status='passed';report.exitCode=0;
})().catch(error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);console.error(report.error);})
.finally(async()=>{
 releaseProbe?.();await context?.close().catch(()=>{});await browser?.close().catch(()=>{});await server?.close().catch(()=>{});
 if(server)report.requests=server.requests;
 if(temp)await fs.rm(temp,{recursive:true,force:true});
 report.finishedAt=new Date().toISOString();report.durationMs=Date.now()-began;if(evidenceReady)await save();
 console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,steps:report.steps.map(s=>({name:s.name,status:s.status})),output,durationMs:report.durationMs}));process.exitCode=report.exitCode??1;
});
