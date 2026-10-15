// Real service workers, real caches and offline navigation. Never intercept game/SW responses.
// node scripts/preview-offline-smoke.cjs --root preview-dist --output /tmp/neon-offline
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,errorText,sha256} = require('./browser-qa-helpers.cjs');
const {values:args} = parseArgs({options:{root:{type:'string'},output:{type:'string'},'base-url':{type:'string'},timeout:{type:'string'}}});
const root = path.resolve(args.root || process.env.NEON_BROWSER_ROOT || 'preview-dist');
const output = path.resolve(args.output || process.env.NEON_BROWSER_EVIDENCE ||
  `docs/continuity-100/evidence/block-03/offline-${new Date().toISOString().replace(/[:.]/g,'-')}`);
const timeout = Number(args.timeout || process.env.NEON_BROWSER_TIMEOUT || 45000);
assert.ok(Number.isFinite(timeout) && timeout >= 1000 && timeout <= 180000);
const report = {status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,
  sourceRoot:root,steps:[],pageErrors:[],httpFailures:[],consoleErrors:[],
  limits:['Chromium with serviceWorkers=allow; no response interception or synthetic worker harness.',
    'Browser offline emulation on loopback; not an iPhone, installed PWA, or real network outage.',
    'Checks cache activation/isolation, both game modes and selector offline; not a long gameplay or performance test.']};
let browser,context,page,server,offline=false;
const wait = (predicate,arg) => page.waitForFunction(predicate,arg,{polling:100,timeout});
const save = () => saveEvidence(output,report);
async function state() {
  return page.evaluate(async () => ({url:location.href,online:navigator.onLine,
    controller:navigator.serviceWorker.controller?.scriptURL || null,
    registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,active:r.active?.scriptURL,state:r.active?.state})),
    caches:await caches.keys(),storage:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))}));
}
async function step(name,action) {
  const entry={name,status:'running',startedAt:new Date().toISOString()};report.steps.push(entry);await save();
  console.log(`[offline] ${name}`);const started=Date.now();
  try {await action();entry.state=await state();assert.deepEqual(report.pageErrors,[]);entry.status='passed';}
  catch(error){entry.status='failed';entry.error=errorText(error);entry.state=await state().catch(error=>({error:errorText(error)}));throw error;}
  finally{entry.durationMs=Date.now()-started;await save();}
}
async function game(mode,baseURL,{reload=false}={}) {
  if(reload) await page.reload({waitUntil:'load'});
  else {
    await page.goto(baseURL,{waitUntil:'load'});
    await wait(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'));
    if(mode==='n7') await page.locator('#n7link').click();
    else await page.locator('a.card:not(#n7link)').click();
  }
  await wait(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/juego/sw.js'));
  await page.locator('#levels').click();
  await wait(n=>document.querySelectorAll('#levelGrid button').length===n,mode==='n7'?100:10);
  const count=await page.locator('#levelGrid button').count();assert.equal(count,mode==='n7'?100:10);
  await page.locator('#levelGrid button').first().click();await page.locator('#launch').click();
  await wait(()=>!document.querySelector('#hud').classList.contains('hidden') && !document.querySelector('#fire').disabled);
  const label=await page.locator('#hudLevel').evaluate(el=>el.previousElementSibling.textContent);
  assert.equal(label,mode==='n7'?'RUTA':'SECTOR');
  await page.locator('#pause').click();
  await wait(()=>document.querySelector('#paused').classList.contains('show'));
  const response=await page.evaluate(async()=>{
    const r=await fetch('content-runtime.js?v=7.2.0');return {status:r.status,bytes:(await r.arrayBuffer()).byteLength};
  });
  assert.equal(response.status,200);assert.ok(response.bytes>1000);
  return {mode,url:page.url(),levelCards:count,label,cachedContentBytes:response.bytes};
}
async function main(){
  await prepareEvidence(output);const started=Date.now();
  try{
    await save();
    if(!args['base-url']) server=await startStaticServer(root);
    const baseURL=args['base-url'] || server.url;report.baseURL=baseURL;
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
      timeout,args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=browser.version();
    context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'allow'});
    page=await context.newPage();page.setDefaultTimeout(timeout);page.setDefaultNavigationTimeout(timeout);
    page.on('pageerror',error=>report.pageErrors.push(errorText(error)));
    page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push({offline,text:message.text()});});
    page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({offline,url:response.url(),status:response.status()});});
    await step('seed foreign caches and normal saves before installing preview workers',async()=>{
      await page.goto(new URL('build-info.json',baseURL).href,{waitUntil:'load'});
      report.provenance=await page.evaluate(()=>JSON.parse(document.body.textContent));
      const info=report.provenance;
      assert.equal(info.storagePrefix,'neon-preview-v1:');assert.equal(info.engineV1,false);
      const gameScope=new URL('juego/',baseURL).href;
      report.foreignCaches=['neon-catcher-pre-release-7-2-0','unrelated-app',`neon-preview-v1:${gameScope}child/::old`];
      report.staleCaches=[`neon-preview-launcher-v1:${baseURL}::old`,`neon-preview-v1:${gameScope}::old`];
      await page.evaluate(async({foreign,stale})=>{
        for(const name of [...foreign,...stale]){const cache=await caches.open(name);await cache.put('/qa-cache-sentinel',new Response(name));}
        localStorage.setItem('neon-unlocked-v2','7');localStorage.setItem('neon-n7-unlocked-v1','42');
        localStorage.setItem('neon-best-v2','2026');localStorage.setItem('neon-settings-v5','{"music":12}');
        localStorage.setItem('neon-preview-v1:neon-unlocked-v2','2');
        localStorage.setItem('neon-preview-v1:neon-n7-unlocked-v1','37');
      },{foreign:report.foreignCaches,stale:report.staleCaches});
      report.storageBefore=(await state()).storage;
    });
    await step('launcher activates its real worker and manifest resolves to the selector',async()=>{
      const response=await page.goto(baseURL,{waitUntil:'load'});
      report.headers=await response.allHeaders();
      assert.match(report.headers['content-security-policy']||'',/connect-src 'self'/);
      assert.match(report.headers['cache-control']||'',/no-store/);
      await wait(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'));
      report.manifest=await page.evaluate(async()=>{
        const url=document.querySelector('link[rel=manifest]').href;const response=await fetch(url);const manifest=await response.json();
        return {url,manifest,startURL:new URL(manifest.start_url,url).href,scope:new URL(manifest.scope,url).href};
      });
      assert.equal(report.manifest.startURL,new URL('index.html',baseURL).href);
      assert.equal(report.manifest.scope,baseURL);
      report.icons=await page.evaluate(async({url,manifest})=>Promise.all(manifest.icons.map(async icon=>{
        const image=new Image();image.src=new URL(icon.src,url).href;await image.decode();
        return {url:image.src,width:image.naturalWidth,height:image.naturalHeight};
      })),report.manifest);
      assert.deepEqual(report.icons.map(i=>i.width),[192,512]);
    });
    await step('both real game modes load online under the game worker',async()=>{
      report.onlineModes=[];
      for(const mode of ['original','n7'])report.onlineModes.push(await game(mode,baseURL));
      const current=await state();
      assert.equal(current.registrations.length,2);
      for(const name of report.foreignCaches)assert.ok(current.caches.includes(name),`Foreign cache deleted: ${name}`);
      for(const name of report.staleCaches)assert.ok(!current.caches.includes(name),`Stale own cache retained: ${name}`);
      const own=current.caches.filter(name=>name.startsWith('neon-preview-')&&!report.foreignCaches.includes(name));
      assert.equal(own.length,2);assert.ok(own.every(name=>name.endsWith(report.provenance.revision)));
      report.precache=await page.evaluate(async names=>Promise.all(names.map(async name=>{
        const cache=await caches.open(name);return {name,urls:(await cache.keys()).map(r=>r.url)};
      })),own);
      const gameCache=report.precache.find(cache=>cache.name.startsWith('neon-preview-v1:'));
      assert.ok(gameCache.urls.length>=70);assert.ok(gameCache.urls.some(url=>url.endsWith('/preview-config.js')));
      assert.deepEqual(report.httpFailures,[],'Online resources must not fail');
    });
    await step('offline reload preserves N-7, then selector opens classic and N-7 offline',async()=>{
      offline=true;await context.setOffline(true);report.offlineModes=[];
      report.offlineModes.push(await game('n7',baseURL,{reload:true}));
      for(const mode of ['original','n7']){
        report.offlineModes.push(await game(mode,baseURL));
        await page.screenshot({path:path.join(output,`offline-${mode}-paused.png`),timeout});
      }
      await page.goto(report.manifest.startURL,{waitUntil:'load'});
      await wait(()=>Boolean(document.querySelector('#n7link')));
      assert.equal(await page.evaluate(()=>navigator.onLine),false);
      assert.ok(await page.locator('a.card:not(#n7link)').isVisible());
      await page.screenshot({path:path.join(output,'offline-selector.png'),timeout});
      const foreign=await page.evaluate(async names=>Promise.all(names.map(async name=>{
        const response=await(await caches.open(name)).match('/qa-cache-sentinel');return response?.text();
      })),report.foreignCaches);
      assert.deepEqual(foreign,report.foreignCaches);
      const after=(await state()).storage;
      for(const [key,value]of Object.entries(report.storageBefore))assert.equal(after[key],value,`Saved state changed: ${key}`);
      report.storageAfter=after;
      // This path is outside the launcher's allowlist and must fail offline.
      const foreignPath=await page.evaluate(async()=>{
        try{await fetch('/qa-outside-preview-cache');return 'unexpected-success';}catch{return 'network-failed';}
      });assert.equal(foreignPath,'network-failed');
      assert.deepEqual(report.httpFailures,[]);
    });
    report.status='passed';report.exitCode=0;
  }catch(error){report.status='failed';report.exitCode=1;report.error=errorText(error);console.error(report.error);
    if(page){report.failureState=await state().catch(error=>({error:errorText(error)}));
      await page.screenshot({path:path.join(output,'failure.png'),timeout:10000}).catch(()=>{});}}
  finally{report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();await save();
    await context?.close();await browser?.close();await server?.close();process.exitCode=report.exitCode;
    console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,steps:report.steps.length,output,durationMs:report.durationMs}));}
}
main().catch(error=>{console.error(errorText(error));process.exitCode=1;});
