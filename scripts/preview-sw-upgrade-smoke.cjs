// Test an actual Chromium SW revision change on a temporary copy of a preview.
// The checked-in preview package and game bundles are never modified.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,errorText}=require('./browser-qa-helpers.cjs');
const {values:args}=parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const source=path.resolve(args.root||'preview-dist');
const output=path.resolve(args.output||'docs/production-reports/evidence/block-03/sw-upgrade-01');
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),source,
  steps:[],errors:[],limits:['Chromium on a temporary package copy; synthetic revision change, not an installed iPhone PWA upgrade.']};
async function main(){
  await prepareEvidence(output);
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'neon-preview-sw-upgrade-'));
  let server,browser,context;
  async function save(){await saveEvidence(output,report);}
  async function step(name,fn){const item={name,status:'running'};report.steps.push(item);await save();
    try{item.result=await fn();item.status='passed';assert.deepEqual(report.errors,[]);}
    catch(error){item.status='failed';item.error=errorText(error);throw error;}
    finally{await save();}}
  try{
    await fs.cp(source,temp,{recursive:true});
    const provenance=JSON.parse(await fs.readFile(path.join(temp,'build-info.json'),'utf8'));
    const old=provenance.revision,newRevision='f'.repeat(64);
    assert.notEqual(old,newRevision);
    report.sourceCommit=provenance.commit;report.oldRevision=old;report.newRevision=newRevision;
    server=await startStaticServer(temp);
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
      args:['--no-sandbox','--disable-dev-shm-usage']});
    report.browser=browser.version();
    context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'allow'});
    const page=await context.newPage();
    page.on('pageerror',error=>report.errors.push(errorText(error)));
    page.on('response',response=>{if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
    const root=server.url,game=new URL('juego/index.html?campaign=n7',root).href;
    const state=async()=>({...await page.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,
      registrations:(await navigator.serviceWorker.getRegistrations()).map(reg=>({scope:reg.scope,active:reg.active?.scriptURL,state:reg.active?.state})),
      caches:await caches.keys()})),workers:await Promise.all(context.serviceWorkers().map(async worker=>{try{return{url:worker.url(),...await worker.evaluate(()=>({cache:typeof CACHE==='string'?CACHE:null,scope:self.registration.scope}))};}catch(error){return{url:worker.url(),error:String(error)};}}))});
    await step('install launcher and game workers and keep foreign caches',async()=>{
      await page.goto(root,{waitUntil:'load'});
      await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/launcher-sw.js'));
      await page.goto(game,{waitUntil:'load'});
      await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/juego/sw.js'));
      await page.evaluate(async()=>{const cache=await caches.open('unrelated-app');await cache.put('/keep',new Response('safe'));});
      const before=await state();
      assert.equal(before.registrations.length,2);
      assert.ok(before.caches.some(name=>name.endsWith(old)&&name.startsWith('neon-preview-v1:')));
      assert.ok(before.caches.some(name=>name.endsWith(old)&&name.startsWith('neon-preview-launcher-v1:')));
      assert.ok(before.caches.includes('unrelated-app'));
      return before;
    });
    await step('update both worker scripts and replace only their own old caches',async()=>{
      for(const file of ['launcher-sw.js','juego/sw.js']){
        const target=path.join(temp,file);const original=await fs.readFile(target,'utf8');
        assert.ok(original.includes(old));await fs.writeFile(target,original.replaceAll(old,newRevision));
      }
      await page.evaluate(async()=>{const registrations=await navigator.serviceWorker.getRegistrations();
        for(const registration of registrations)await registration.update();});
      await page.waitForFunction(async revision=>{
        const keys=await caches.keys();
        const registrations=await navigator.serviceWorker.getRegistrations();
        if(!registrations.every(registration=>registration.active?.state==='activated'))return false;
        return keys.filter(name=>name.startsWith('neon-preview-')).length===2&&
          keys.filter(name=>name.startsWith('neon-preview-')).every(name=>name.endsWith(revision));
      },newRevision,{timeout:30000});
      await page.reload({waitUntil:'load'});
      report.afterReloadImmediate=await state();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      report.afterNetworkIdle=await state();
      await page.waitForFunction(async revision=>{
        const keys=await caches.keys();
        const registrations=await navigator.serviceWorker.getRegistrations();
        if(!registrations.every(registration=>registration.active?.state==='activated'))return false;
        return keys.filter(name=>name.startsWith('neon-preview-')).length===2&&
          keys.filter(name=>name.startsWith('neon-preview-')).every(name=>name.endsWith(revision));
      },newRevision,{timeout:30000});
      await page.waitForTimeout(500);
      const after=await state();
      report.upgradeAfter=after;
      assert.ok(after.caches.includes('unrelated-app'));
      assert.ok(!after.caches.some(name=>name.endsWith(old)));
      return after;
    });
    await step('new workers serve both game and selector after network loss',async()=>{
      await page.reload({waitUntil:'load'});
      await context.setOffline(true);
      await page.goto(game,{waitUntil:'load'});
      assert.ok(await page.locator('#levels').count());
      await page.goto(root,{waitUntil:'load'});
      assert.ok(await page.locator('#classiclink').isVisible(), 'The principal journey remains available offline');
      assert.equal(await page.locator('#classiclink').getAttribute('href'), 'juego/index.html');
      assert.equal(await page.locator('#qaArchive').getAttribute('open'), null, 'Historical QA stays collapsed offline');
      assert.equal(await page.locator('#n7link').count(), 1, 'The historical N-7 entry is preserved');
      assert.equal(await page.locator('#n7link').isVisible(), false, 'Historical variants are not competing principal campaigns');
      const after=await state();
      assert.ok(after.controller.endsWith('/launcher-sw.js'));
      assert.deepEqual(report.errors,[]);
      return after;
    });
    report.status='passed';report.exitCode=0;
  }catch(error){report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;}
  finally{report.finishedAt=new Date().toISOString();await save();await context?.close();await browser?.close();await server?.close();
    await fs.rm(temp,{recursive:true,force:true});
    console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,steps:report.steps.length,error:report.error,output}));}
}
main().catch(error=>{console.error(errorText(error));process.exitCode=1;});
