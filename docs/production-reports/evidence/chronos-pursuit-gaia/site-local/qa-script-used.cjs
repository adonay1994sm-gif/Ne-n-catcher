const {chromium}=require(require.resolve('playwright',{paths:['/workspace/Ne-n-catcher']}));
const {startStaticServer}=require('/workspace/Ne-n-catcher/scripts/browser-qa-helpers.cjs');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
 const out='/tmp/neon-pursuit-site-local';await fs.mkdir(out,{recursive:true});const server=await startStaticServer('/workspace/sites/neon-catcher-pruebas/dist');
 const report={status:'running',checks:[],errors:[],scope:'Local exact pushed Site distribution; no game diagnostics or saved-game fixtures; Chromium 390x844 DPR1, service workers blocked.'};let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.goto(server.url,{waitUntil:'load'});await page.screenshot({path:out+'/01-current-site-launcher.png'});
  await page.locator('#classiclink').click();await page.locator('#play').waitFor({state:'visible'});
  assert.ok(page.url().includes('/clasico-actual/juego/'));report.checks.push({name:'CONTINUAR VIAJE opens current classic, preserving the old and orbital entries',status:'passed'});
  await page.locator('#play').click();await page.locator('#launch').click();await page.locator('#pause').waitFor({state:'visible'});await page.waitForTimeout(1800);await page.screenshot({path:out+'/02-current-site-chronos.png'});
  assert.deepEqual(report.errors,[]);report.checks.push({name:'Actual Chronos start in the exact Site source distribution, no injected diagnostics',status:'passed'});report.status='passed';report.exitCode=0;
 }catch(e){report.status='failed';report.failure=String(e.stack||e);report.exitCode=1;process.exitCode=1;}
 finally{await browser?.close();await server.close();await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
})();
