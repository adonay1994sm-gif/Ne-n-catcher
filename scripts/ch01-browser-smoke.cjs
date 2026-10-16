// Local-only visual QA. The served bundle receives an inspection/control hook;
// no game files are changed. Time is stepped manually after stopping the only RAF.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,errorText} = require('./browser-qa-helpers.cjs');
const {values:args} = parseArgs({options:{root:{type:'string'},output:{type:'string'}}});
const root = path.resolve(args.root || 'preview-dist');
const output = path.resolve(args.output || 'docs/production-reports/evidence/block-05/ch01-visual-browser-01');
const report = {status:'running',exitCode:null,startedAt:new Date().toISOString(),root,steps:[],pageErrors:[],httpFailures:[],
  limits:['Controlled Chromium Canvas scenario; time is stepped manually and the enemy is isolated.',
    'This proves visual state transitions and drawing, not natural combat balance or Safari performance.']};
async function main(){
await prepareEvidence(output);
const server=await startStaticServer(root);
let browser,context;
async function save(){await saveEvidence(output,report);}
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.browser=browser.version();
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',error=>report.pageErrors.push(errorText(error)));
  page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({url:response.url(),status:response.status()});});
  page.on('requestfailed',request=>report.httpFailures.push({url:request.url(),error:request.failure()?.errorText}));
  await page.route(/\/game\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch();
    const source=await response.text();
    const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
    assert.equal(source.split(marker).length,2,'Expected one legacy bootstrap');
    const hook=`let ch01Target = null;
      window.__CH01_VISUAL_QA__ = {
        prepare() {
          window.NeonLegacyLoopBridge.stopLegacyLoop();
          startLevel(36);
          for (let i=0;i<1200;i++) {
            ch01Target=items.find(item=>item.n7?.ch01Animator && item.y>100);
            if(ch01Target) break;
            update(1/60);
          }
          if(!ch01Target) throw new Error('CH-01 shooter did not spawn');
          items=[ch01Target]; encounterDirector=null;
          ch01Target.y=player.y-340; ch01Target.s=0;
          ch01Target.x=ch01Target.baseX=W/2;
          ch01Target.n7.bounds={min:W/2,max:W/2};
          player.x=player.target=ch01Target.x;
          render(performance.now());
          return this.snapshot();
        },
        advance(frames) {
          for(let i=0;i<frames;i++) update(1/60);
          render(performance.now()); return this.snapshot();
        },
        fire() {
          items=[ch01Target];
          const before=score;
          const fired=fireManualShot();
          render(performance.now());
          return {...this.snapshot(),fired,scoreGain:score-before};
        },
        snapshot() {
          const frame=ch01Target?.n7.ch01Animator.getFrame();
          return {state,route:currentLevel+1,frame,enemyHp:ch01Target?.hp,
            enemyOnField:items.includes(ch01Target),score,ammo,
            projectileCount:items.filter(item=>item.n7Projectile).length,
            destructionOnField:explosions.some(effect=>effect.ch01Animator===ch01Target?.n7.ch01Animator),
            image:{complete:SPRITES.ch01.complete,width:SPRITES.ch01.naturalWidth,height:SPRITES.ch01.naturalHeight},
            legacyRunning};
        }
      };
`;
    await route.fulfill({response,body:source.replace(marker,hook+marker)});
  });
  async function step(name,fn){
    const item={name,status:'running'};report.steps.push(item);await save();
    try{item.snapshot=await fn();item.status='passed';assert.deepEqual(report.pageErrors,[]);}
    catch(error){item.status='failed';item.error=errorText(error);throw error;}
    finally{await save();}
  }
  await step('open clean preview game and isolate a naturally generated CH-01 shooter',async()=>{
    await page.addInitScript(()=>localStorage.setItem('neon-preview-v1:neon-n7-unlocked-v1','100'));
    await page.goto(new URL('juego/index.html?campaign=n7',server.url).href,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.__CH01_VISUAL_QA__==='object');
    const result=await page.evaluate(()=>__CH01_VISUAL_QA__.prepare());
    assert.equal(result.route,37);assert.equal(result.legacyRunning,false);
    await page.waitForFunction(()=>__CH01_VISUAL_QA__.snapshot().image.width===1024);
    return result;
  });
  await step('attack uses real authored frame and emits its signalled projectile',async()=>{
    let result;
    for(let i=0;i<120;i++){
      result=await page.evaluate(()=>__CH01_VISUAL_QA__.advance(1));
      if(result.frame.state==='attack' && result.projectileCount>0)break;
    }
    assert.equal(result.frame.state,'attack');assert.ok(result.projectileCount>0);
    await page.screenshot({path:path.join(output,'ch01-attack.png')});
    return result;
  });
  await step('first manual shot draws hurt pose and leaves one HP',async()=>{
    const result=await page.evaluate(()=>__CH01_VISUAL_QA__.fire());
    assert.equal(result.fired,true);assert.equal(result.enemyHp,1);
    assert.equal(result.frame.state,'hurt');assert.equal(result.enemyOnField,true);
    await page.screenshot({path:path.join(output,'ch01-hurt.png')});
    return result;
  });
  await step('second manual shot draws destruction after removal and rewards once',async()=>{
    await page.evaluate(()=>__CH01_VISUAL_QA__.advance(20));
    const result=await page.evaluate(()=>__CH01_VISUAL_QA__.fire());
    assert.equal(result.fired,true);assert.equal(result.enemyHp,0);
    assert.equal(result.frame.state,'destroy');assert.equal(result.enemyOnField,false);
    assert.equal(result.destructionOnField,true);assert.equal(result.scoreGain,10);
    await page.screenshot({path:path.join(output,'ch01-destroy.png')});
    const later=await page.evaluate(()=>__CH01_VISUAL_QA__.advance(40));
    assert.equal(later.score,result.score);
    return {...result,scoreAfterAnimation:later.score};
  });
  assert.deepEqual(report.pageErrors,[]);
  assert.deepEqual(report.httpFailures,[]);
  report.status='passed';report.exitCode=0;
}catch(error){report.status='failed';report.exitCode=1;report.error=errorText(error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await save();await context?.close();await browser?.close();await server.close();
  console.log(JSON.stringify({status:report.status,exitCode:report.exitCode,steps:report.steps.length,output,error:report.error}));}
}
main().catch(error=>{console.error(errorText(error));process.exitCode=1;});
