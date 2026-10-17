const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {startStaticServer}=require('/workspace/Ne-n-catcher/scripts/browser-qa-helpers.cjs');
const [root,output,expectedCommit]=process.argv.slice(2);
if(!root||!output||!expectedCommit)throw Error('Usage: node harness PACKAGE NEW_OUTPUT EXPECTED_COMMIT');
(async()=>{
 await fs.mkdir(output,{recursive:false});
 await fs.copyFile(__filename,path.join(output,'used-harness.cjs'));
 const info=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
 const report={startedAt:new Date().toISOString(),kind:'Real Chromium on a clean preview with controlled storage read faults',build:info,checks:[],errors:[],limits:['Injected read faults are not a physical power-cut or iPhone certification.','No natural mission is claimed by this startup-only test.']};
 let server,browser;
 try{
  assert.equal(info.commit,expectedCommit);assert.equal(info.dirty,false);
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const scenario of [
   {name:'denied-current',legacy:'100',current:'9000',deny:'current',expected:'9000',writes:0},
   {name:'denied-legacy',legacy:'12000',current:'9000',deny:'legacy',expected:'9000',writes:0},
   {name:'corrupt-current',legacy:'100',current:'NaN',deny:null,expected:'NaN',writes:0},
   {name:'valid-migration',legacy:'12000',current:'9000',deny:null,expected:'12000',writes:1}
  ]){
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
   await context.addInitScript(({scenario,prefix})=>{
    if(new URL(location.href).searchParams.has('recovered'))return;
    const proto=Storage.prototype,get=proto.getItem,set=proto.setItem;
    const legacy=prefix+'neon-best-v1',current=prefix+'neon-best-v2';
    set.call(localStorage,legacy,scenario.legacy);set.call(localStorage,current,scenario.current);
    const writes=[];window.__SCORE_FAULT__={writes,read:()=>({legacy:get.call(localStorage,legacy),current:get.call(localStorage,current)})};
    proto.getItem=function(key){if(this===localStorage&&key===(scenario.deny==='legacy'?legacy:scenario.deny==='current'?current:null))throw new DOMException('Controlled storage read denial','SecurityError');return get.call(this,key);};
    proto.setItem=function(key,value){if(this===localStorage&&(key===legacy||key===current))writes.push({key,value});return set.call(this,key,value);};
   },{scenario,prefix:info.storagePrefix});
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto(server.url+'juego/index.html',{waitUntil:'load'});
   await page.locator('#menu.show').waitFor();
   const observed=await page.evaluate(()=>({values:window.__SCORE_FAULT__.read(),writes:window.__SCORE_FAULT__.writes}));
   assert.equal(observed.values.current,scenario.expected);assert.equal(observed.values.legacy,scenario.legacy);assert.equal(observed.writes.length,scenario.writes);
   await page.goto(server.url+'juego/index.html?recovered=1',{waitUntil:'load'});
   await page.locator('#menu.show').waitFor();
   const after=await page.evaluate(key=>localStorage.getItem(key),info.storagePrefix+'neon-best-v2');
   assert.equal(after,scenario.expected);
   if(scenario.name==='denied-current')await page.screenshot({path:path.join(output,'recovered-record-menu.png')});
   report.checks.push({name:scenario.name,status:'passed',observed,afterReadableReload:after});
   await context.close();
  }
  assert.deepEqual(report.errors,[]);report.status='passed';report.exitCode=0;
 }catch(e){report.status='failed';report.exitCode=1;report.error=e.stack;process.exitCode=1;}
 finally{await browser?.close();await server?.close();report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,errors:report.errors,error:report.error}));}
})();
