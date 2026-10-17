const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
const {startStaticServer}=require('/workspace/Ne-n-catcher/scripts/browser-qa-helpers.cjs');
(async()=>{
 const out='/tmp/neon-cronium-score-guard-site-navigation';await fs.mkdir(out,{recursive:false});
 const result={status:'running',startedAt:new Date().toISOString(),errors:[],failedRequests:[],checks:[],limits:['Real local Chromium navigation; no full orbital gameplay or physical iPhone certification.','Classic package bytes verified separately against clean f39082f; concurrent orbital files preserved by SHA-256.']};
 let server,browser;
 try{
  server=await startStaticServer('/workspace/sites/neon-catcher-pruebas/dist');
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  page.on('requestfailed',r=>result.failedRequests.push(r.url()));
  await page.goto(server.url,{waitUntil:'load'});
  assert.equal(await page.locator('#classiclink').getAttribute('href'),'clasico-actual/juego/index.html');
  assert.equal(await page.locator('#orbitallink').getAttribute('href'),'vuelo-espacial/');
  await page.screenshot({path:out+'/01-preserved-home-and-current-classic.png'});
  await page.locator('#classiclink').click();await page.locator('#menu.show').waitFor();
  assert.match(page.url(),/\/clasico-actual\/juego\/index.html$/);
  const info=await page.evaluate(async()=>await(await fetch('../build-info.json')).json());
  assert.equal(info.commit,'f39082f04667d7dc18ceba17705095bacb30806e');assert.equal(info.dirty,false);
  await page.locator('#play').click();await page.locator('#briefing.show').waitFor();
  await page.locator('#launch').click();await page.locator('#hud:not(.hidden)').waitFor();
  await page.screenshot({path:out+'/02-current-classic-from-preserved-home.png'});
  await page.locator('#pause').click();await page.locator('#paused.show').waitFor();
  result.checks.push({name:'Preserved home opens exact current classic; play and pause work',status:'passed',commit:info.commit});
  const response=await page.goto(new URL('vuelo-espacial/',server.url).href,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);assert.match(page.url(),/\/vuelo-espacial\/$/);
  result.checks.push({name:'Existing orbital path remains accessible',status:'passed'});
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.failedRequests,[]);
  result.status='passed';result.exitCode=0;
 }catch(e){result.status='failed';result.exitCode=1;result.error=e.stack;process.exitCode=1;}
 finally{await browser?.close();await server?.close();result.finishedAt=new Date().toISOString();await fs.writeFile(out+'/results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
})();
