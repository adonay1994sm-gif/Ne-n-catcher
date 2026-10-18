const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const readline=require('node:readline');
if(process.stdin.isTTY)execFileSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']});
console.log('Ready for private verification settings on hidden stdin.');
const rl=readline.createInterface({input:process.stdin,terminal:false});
rl.once('line',async line=>{
 rl.close();process.stdin.pause();const cfg=JSON.parse(line),out='/tmp/neon-pursuit-site-remote';let browser;
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 const report={status:'running',checks:[],errors:[],observedAt:new Date().toISOString(),site:cfg.url,commit:cfg.commit};
 try{
  await fs.mkdir(out,{recursive:true});
  const headers={'OAI-Sites-Authorization':'Bearer '+cfg.token};
  for(const [p,kind]of[['/','launcher'],['/clasico-actual/build-info.json','provenance'],['/clasico-actual/juego/game.js','game'],['/clasico-actual/juego/assets/ch02_interceptor_atlas_v1.webp','asset']]){
   const r=await fetch(cfg.url+p,{headers,cache:'no-store'}),b=Buffer.from(await r.arrayBuffer());assert.equal(r.status,200,p);
   const entry={path:p,status:r.status,bytes:b.length,sha256:sha(b)};
   if(kind==='launcher')assert.ok(b.toString().includes('clasico-actual/juego/index.html'));
   if(kind==='provenance'){const d=JSON.parse(b);assert.equal(d.commit,cfg.commit);assert.equal(d.revision,cfg.revision);assert.equal(d.dirty,false);entry.commit=d.commit;}
   if(kind==='game')assert.equal(sha(b),cfg.gameHash);
   if(kind==='asset')assert.equal(sha(b),cfg.assetHash);
   report.checks.push({...entry,result:'passed'});
  }
  const {chromium}=require(require.resolve('playwright',{paths:['/workspace/Ne-n-catcher']}));
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),host=new URL(cfg.url).host;
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.route('**/*',route=>new URL(route.request().url()).host===host?route.continue({headers:{...route.request().headers(),...headers}}):route.continue());
  await page.goto(cfg.url,{waitUntil:'load'});
  await page.screenshot({path:path.join(out,'01-live-launcher.png')});
  await page.locator('#classiclink').click();await page.locator('#play').waitFor({state:'visible'});
  assert.ok(page.url().includes('/clasico-actual/juego/'));assert.ok((await page.locator('body').innerText()).includes('NEON'));
  await page.screenshot({path:path.join(out,'02-live-current-menu.png')});
  await page.locator('#play').click();await page.locator('#launch').click();
  await page.locator('#pause').waitFor({state:'visible'});await page.waitForTimeout(3000);
  await page.screenshot({path:path.join(out,'03-live-chronos-playing.png')});
  assert.deepEqual(report.errors,[]);report.checks.push({name:'live launcher → current classic → start Chronos using actual UI',result:'passed',url:page.url(),viewport:'390x844 DPR1',limits:'No injected game diagnostics; service workers blocked. Does not certify remote offline or iPhone.'});
  report.status='passed';report.exitCode=0;
 }catch(e){report.status='failed';report.exitCode=1;report.failure=String(e.stack||e).replaceAll(cfg.token,'[redacted]');process.exitCode=1;}
 finally{await browser?.close();await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
});
