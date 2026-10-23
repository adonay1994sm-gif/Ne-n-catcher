// Focused real-Chromium degradation/recovery check. No builds or deployments.
// node scripts/ship-fallback-browser-smoke.cjs --root preview-dist --output /tmp/ship-fallback-01
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseArgs}=require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText}=require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const root=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||'docs/production-reports/evidence/modular-ships/fallback-browser-01');
const atlasPattern=/\/assets\/ship_modular_atlas_v1\.webp(?:\?.*)?$/;
const began=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,
  sourceRoot:root,profile:{width:390,height:844,dpr:1},cases:[],screenshots:[],
  pageErrors:[],consoleErrors:[],unexpectedRequests:[],expectedAssetFailures:[],
  limits:['Real Chromium at one touch-emulated viewport; no physical Safari/iPhone certification.',
    'The first asset failure is intentional and recorded separately from unexpected failures.',
    'Recovery is a real reload with the request permitted, not an automatic retry claim.',
    'Service workers blocked to test fresh network behavior; no offline-cache certification.',
    'Read-only state hook and Canvas/RAF observation; no gameplay state or entity insertion.',
    'This is a degradation test, not an artistic acceptance or sustained performance benchmark.']};
let server,browser,context,page,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const inspect=()=>page.evaluate(()=>({...window.__SHIP_FALLBACK_QA__(),
  raf:{maximum:window.__FALLBACK_RAF_QA__.maximum,pending:window.__FALLBACK_RAF_QA__.pending.size,
    frames:window.__FALLBACK_RAF_QA__.frames,errors:[...window.__FALLBACK_RAF_QA__.errors]},
  draws:{...window.__FALLBACK_DRAW_QA__}}));
async function wait(predicate){await page.waitForFunction(predicate,undefined,{polling:100,timeout:15000});}
async function check(name,action){
  const entry={name,status:'running',startedAt:new Date().toISOString()},start=Date.now();
  report.cases.push(entry);await save();console.log(`[ship fallback] ${name}`);
  try{
    await action();entry.snapshot=await inspect();
    assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.unexpectedRequests,[]);
    assert.deepEqual(report.consoleErrors.filter(error=>!error.expected),[]);
    assert.equal(entry.snapshot.legacyRunning,true);
    assert.ok(entry.snapshot.raf.maximum<=1,'fallback must retain one game RAF owner');
    assert.deepEqual(entry.snapshot.raf.errors,[]);
    entry.status='passed';
  }catch(error){entry.status='failed';entry.error=errorText(error);throw error;}
  finally{entry.durationMs=Date.now()-start;await save();}
}
async function capture(name){
  const filename=name+'.png';await page.screenshot({path:path.join(output,filename)});
  report.screenshots.push({file:filename,type:'real game viewport with intentional asset failure or restored request'});
}

(async()=>{
  await prepareEvidence(output);evidenceReady=true;
  const build=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));
  report.buildInfo={commit:build.commit,dirty:build.dirty,revision:build.revision};
  server=await startStaticServer(root);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
  page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>report.pageErrors.push(errorText(error)));
  page.on('console',message=>{
    if(message.type()==='error')report.consoleErrors.push({message:message.text(),url:message.location().url,
      expected:atlasPattern.test(message.location().url)});
  });
  page.on('requestfailed',request=>{
    const failure={url:request.url(),error:request.failure()?.errorText};
    (atlasPattern.test(request.url())?report.expectedAssetFailures:report.unexpectedRequests).push(failure);
  });
  page.on('response',response=>{if(response.status()>=400)report.unexpectedRequests.push({url:response.url(),status:response.status()});});
  await page.addInitScript(()=>{
    const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    const audit=window.__FALLBACK_RAF_QA__={pending:new Set(),maximum:0,frames:0,errors:[]};
    window.requestAnimationFrame=callback=>{
      const id=request(now=>{
        audit.pending.delete(id);audit.frames++;
        try{callback(now);}catch(error){audit.errors.push(error.stack||String(error));throw error;}
      });
      audit.pending.add(id);audit.maximum=Math.max(audit.maximum,audit.pending.size);return id;
    };
    window.cancelAnimationFrame=id=>{audit.pending.delete(id);cancel(id);};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    const draws=window.__FALLBACK_DRAW_QA__={hangarLegacy:0,hangarModular:0};
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
      if(this.canvas.id==='shipHangarCanvas'){
        const source=image?._assetPath||image?.currentSrc||image?.src||'';
        if(/ship_frame_\d+\.webp/.test(source))draws.hangarLegacy++;
        if(/ship_modular_atlas_v1\.webp/.test(source))draws.hangarModular++;
      }
      return draw.call(this,image,...args);
    };
  });
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
    report.gameBundle={bytes:body.length,sha256:sha256(body)};
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2,'Read-only hook bootstrap marker changed');
    const hook=`window.__SHIP_FALLBACK_QA__=()=>({state,mode:shipRenderMode,loadout:{...shipLoadout},legacyRunning,
      atlasReady:spriteReady(SPRITES.modularShip),menuImages:[...document.querySelectorAll('.menu-ship-image,.briefing-ship')].map(image=>image.getAttribute('src'))});\n`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  const blockAtlas=route=>route.abort('failed');
  await page.route(atlasPattern,blockAtlas);
  const nested=await fs.access(path.join(root,'juego','index.html')).then(()=>'juego/').catch(()=>'');
  const url=server.url+nested+'index.html';

  await check('missing atlas shows original ship, explains the fallback and blocks unseen modular application',async()=>{
    await page.goto(url,{waitUntil:'load'});
    await wait(()=>typeof window.__SHIP_FALLBACK_QA__==='function'&&!__SHIP_FALLBACK_QA__().atlasReady);
    await page.locator('#openHangar').click();
    await wait(()=>!document.querySelector('#shipAtlasNotice').classList.contains('hidden')&&document.querySelector('#shipApply').disabled&&window.__FALLBACK_DRAW_QA__.hangarLegacy>0);
    const state=await inspect();
    assert.equal(state.mode,'modular');assert.equal(state.draws.hangarModular,0);
    assert.ok(report.expectedAssetFailures.length>0,'the atlas request must really fail');
    const alphaPixels=await page.locator('#shipHangarCanvas').evaluate(canvas=>{
      const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      let count=0;for(let index=3;index<pixels.length;index+=4)if(pixels[index]>0)count++;return count;
    });
    assert.ok(alphaPixels>1000,'fallback Canvas must contain the actual original artwork');
    report.fallbackAlphaPixels=alphaPixels;
    await capture('01-missing-atlas-original-fallback');
  });

  await check('the original ship can be explicitly applied and updates menu presentation despite the failed atlas',async()=>{
    await page.locator('#shipLegacy').click();
    await wait(()=>!document.querySelector('#shipApply').disabled&&document.querySelector('#shipAtlasNotice').classList.contains('hidden'));
    await capture('02-legacy-selection-without-atlas');
    await page.locator('#shipApply').click();
    await wait(()=>__SHIP_FALLBACK_QA__().mode==='legacy'&&document.querySelector('#menu').classList.contains('show'));
    const state=await inspect();
    assert.ok(state.menuImages.every(source=>source==='assets/ship_frame_01.webp'));
    report.persistedLegacy=await page.evaluate(()=>{
      const key=Object.keys(localStorage).find(key=>key.endsWith('neonCronium.shipFleet.v1'));
      return {key,value:key?JSON.parse(localStorage.getItem(key)):null};
    });
    assert.equal(report.persistedLegacy.value.mode,'legacy');
    assert.equal(state.atlasReady,false);
  });

  await check('reload with the atlas available restores modular preview, application and one RAF',async()=>{
    await page.unroute(atlasPattern,blockAtlas);
    await page.reload({waitUntil:'load'});
    await wait(()=>typeof window.__SHIP_FALLBACK_QA__==='function'&&__SHIP_FALLBACK_QA__().atlasReady);
    assert.equal((await inspect()).mode,'legacy','the stored original choice survives reload');
    await page.locator('#openHangar').click();
    await page.locator('[data-ship-preset="bastion"]').click();
    await wait(()=>!document.querySelector('#shipApply').disabled&&document.querySelector('#shipAtlasNotice').classList.contains('hidden')&&window.__FALLBACK_DRAW_QA__.hangarModular>0);
    await capture('03-restored-modular-atlas');
    await page.locator('#shipApply').click();
    await wait(()=>__SHIP_FALLBACK_QA__().mode==='modular'&&__SHIP_FALLBACK_QA__().menuImages.every(source=>source.startsWith('data:image/png')));
    assert.deepEqual((await inspect()).loadout,{hull:'bastion',wings:'bastion',engines:'bastion'});
  });
  report.status='passed';report.exitCode=0;
})().catch(error=>{
  report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;
}).finally(async()=>{
  report.durationMs=Date.now()-began;
  report.checksPassed=report.cases.filter(entry=>entry.status==='passed').length;
  report.checksFailed=report.cases.filter(entry=>entry.status==='failed').length;
  if(server)report.httpRequests=server.requests;
  if(context)await context.close();if(browser)await browser.close();if(server)await server.close();
  if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,checksPassed:report.checksPassed,
    checksFailed:report.checksFailed,durationMs:report.durationMs,error:report.error}));
});
