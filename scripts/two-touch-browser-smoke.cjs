// Real Chromium/CDP multi-contact controls. The game hook only reads state;
// contact coordinates, keyboard and normal UI are the only gameplay inputs.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {startStaticServer,prepareEvidence,saveEvidence,sha256,errorText} = require('./browser-qa-helpers.cjs');
const {values}=parseArgs({options:{root:{type:'string'},output:{type:'string'},baseline:{type:'boolean',default:false},
  'fallback-fixture':{type:'boolean',default:false}}});
const root=path.resolve(values.root||'preview-dist');
const output=path.resolve(values.output||`docs/production-reports/evidence/ship-controls/touch-${Date.now()}`);
const started=Date.now();
const report={status:'running',exitCode:null,startedAt:new Date().toISOString(),command:process.argv,sourceRoot:root,
  baseline:values.baseline,profiles:[],limits:[
    'Actual Chromium, a 390x844 touch viewport and CDP contacts; no game state, save, hull, ammo, clock, entity or progression fixture writes.',
    'Only the unlocked opening stage is selected through the actual menu. No QA unlock, save or progression injection is used.',
    'A read-only IIFE hook observes input, weapon counters and gameplay clocks. RAF instrumentation wraps the existing owner and never requests a frame.',
    'These are short controls regressions, not complete natural missions, visual acceptance, physical iPhone or Safari certification.',
    'Service workers are blocked. No cache lifecycle claim.',
    'Optional fallback profile shadows PointerEvent and suppresses native pointer dispatch in capture phase, leaving CDP native TouchEvents. This is an explicit Chrome capability fixture, not native Safari.'
  ]};
let server,browser,page,profile,context,cdp,evidenceReady=false;
const save=()=>saveEvidence(output,report);
const wait=(fn,arg,timeout=45000)=>page.waitForFunction(fn,arg,{polling:100,timeout});
const inspect=()=>page.evaluate(()=>({...window.__TWO_TOUCH_QA__(),raf:{maximum:window.__TWO_TOUCH_RAF__.maximum,
  frames:window.__TWO_TOUCH_RAF__.frames,pending:window.__TWO_TOUCH_RAF__.pending.size,errors:[...window.__TWO_TOUCH_RAF__.errors]},
  events:[...window.__TWO_TOUCH_EVENTS__],nativeDelivery:{...window.__TWO_TOUCH_DELIVERY__} }));
async function capture(name){const file=`${profile.id}-${name}.png`;await page.screenshot({path:path.join(output,file),timeout:30000});
  profile.screenshots.push({file,type:'Actual live Chromium viewport',snapshot:await page.evaluate(()=>typeof window.__TWO_TOUCH_QA__==='function')?await inspect():null});await save();}
function equalNear(actual,expected,label){assert.ok(Math.abs(actual-expected)<.01,`${label}: ${actual} instead of ${expected}`);}
function clean(q){assert.deepEqual(profile.errors,[]);assert.deepEqual(profile.consoleErrors,[]);assert.deepEqual(profile.failedRequests,[]);
  assert.deepEqual(q.raf.errors,[]);assert.ok(q.legacyRunning,'Legacy RAF stopped');assert.ok(q.raf.maximum<=1,'More than one pending RAF owner');}
let activeContacts=new Map();
function point(id,x,y){return{id,x,y,radiusX:5,radiusY:5,force:1};}
async function dispatch(type,points){const eventType=type.toLowerCase();
  const delivered=await page.evaluate(type=>window.__TWO_TOUCH_DELIVERY__?.[type]||0,eventType);
  await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
  // CDP acknowledgement can precede compositor delivery. Wait for the native
  // TouchEvent itself, rather than sampling stale game input immediately.
  await wait(({type,delivered})=>(window.__TWO_TOUCH_DELIVERY__?.[type]||0)>delivered,{type:eventType,delivered},10000);
  if(type==='touchCancel')activeContacts.clear();
  else if(type==='touchEnd'){if(points.length)for(const p of points)activeContacts.delete(p.id);else activeContacts.clear();}
  else activeContacts=new Map(points.map(p=>[p.id,p]));}
async function press(contact){await dispatch('touchStart',[...activeContacts.values(),contact]);}
async function move(contact){activeContacts.set(contact.id,contact);await dispatch('touchMove',[...activeContacts.values()]);}
// CDP touchEnd receives the ending contacts, not the remaining contacts.
async function release(id){assert.ok(activeContacts.has(id),`Contact ${id} is not held`);await dispatch('touchEnd',[activeContacts.get(id)]);}
async function cancel(){await dispatch('touchCancel',[]);}
async function anchors(){const canvas=await page.locator('#canvas').boundingBox(),fire=await page.locator('#fire').boundingBox(),missile=await page.locator('#classicMissile').boundingBox();
  assert.ok(canvas&&fire&&missile);return{pilot:point(17,canvas.x+canvas.width*.46,canvas.y+canvas.height*.68),
    fire:point(29,fire.x+fire.width*.5,fire.y+fire.height*.5),missile:point(37,missile.x+missile.width*.5,missile.y+missile.height*.5),canvas,fireRect:fire};}
async function round(){if(activeContacts.size)await cancel();await page.goto(new URL('juego/index.html',server.url).href,{waitUntil:'load'});
  await wait(()=>typeof window.__TWO_TOUCH_QA__==='function'&&__TWO_TOUCH_QA__().state==='menu');
  await page.locator('#levels').click();await wait(()=>document.querySelectorAll('#levelGrid button').length===10);
  assert.equal(await page.locator('#levelGrid button').first().isDisabled(),false);
  await page.locator('#levelGrid button').first().click();await page.locator('#launch').click();
  await wait(()=>{const q=__TWO_TOUCH_QA__();return q.state==='playing'&&q.currentLevel===0&&q.warpTimer===0&&q.elapsed>.12&&q.assets.every(a=>a.loaded);});
  const q=await inspect();assert.equal(q.weapons.charges,20);return anchors();}
async function check(name,operation){const entry={name,status:'running',assertions:[],samples:{}};profile.checks.push(entry);const began=Date.now();await save();
  console.log(`[two touch ${profile.id}] ${name}`);
  const expect=(label,fn)=>{try{fn();entry.assertions.push({label,status:'passed'});}catch(error){entry.assertions.push({label,status:'failed',error:errorText(error)});}};
  try{await operation(entry,expect);entry.snapshot=await inspect();clean(entry.snapshot);
    entry.status=entry.assertions.some(a=>a.status==='failed')?'failed':'passed';}
  catch(error){entry.status='failed';entry.error=errorText(error);try{entry.snapshot=await inspect();}catch{}}
  finally{try{if(activeContacts.size)await cancel();}catch{}entry.durationMs=Date.now()-began;await save();}
}
async function runControls(){
  for(const missileFirst of [false,true])await check(`missile ${missileFirst?'first':'second'} launches on down while another contact pilots`,async(entry,expect)=>{
    const a=await round(),before=await inspect();
    if(missileFirst){await press(a.missile);await press(a.pilot);}else{await press(a.pilot);await press(a.missile);}
    const down=await inspect();entry.samples.down=down;
    expect('exactly one missile is durably spent on press',()=>{assert.equal(down.missileShotsSpent,before.missileShotsSpent+1);assert.equal(down.missileAmmo,before.missileAmmo-1);});
    expect('missile and pilot keep independent ownership',()=>{assert.ok(down.missileInput);assert.equal(down.input.active,true);assert.notEqual(down.missileInput.id,down.input.id);assert.equal(down.fireInput,null);});
    await move({...a.pilot,x:a.pilot.x-18,y:a.pilot.y-16});const moved=await inspect();entry.samples.moved=moved;
    expect('pilot moves while missile contact remains held',()=>{assert.ok(moved.player.target<down.player.target-1);assert.ok(moved.player.targetY<down.player.targetY-1);});
    await wait(start=>__TWO_TOUCH_QA__().weapons.elapsed>=start+.85,moved.weapons.elapsed);
    const held=await inspect();entry.samples.held=held;
    expect('holding beyond cooldown never repeats a missile',()=>assert.equal(held.missileShotsSpent,down.missileShotsSpent));
    await release(a.missile.id);const released=await inspect();entry.samples.released=released;
    expect('release emits no duplicate and preserves steering',()=>{assert.equal(released.missileShotsSpent,down.missileShotsSpent);assert.equal(released.missileInput,null);assert.equal(released.input.active,true);});
    await move({...a.pilot,x:a.pilot.x-30,y:a.pilot.y-22});const after=await inspect();
    expect('remaining pilot still responds after missile release',()=>assert.ok(after.player.target<moved.player.target-1));
    await capture(missileFirst?'missile-first-two-fingers':'pilot-first-missile');await release(a.pilot.id);
  });
  await check('missile cancellation and pause clear action without a release launch',async(entry,expect)=>{
    const a=await round();await press(a.pilot);await press(a.missile);const down=await inspect();entry.samples.down=down;
    await cancel();const cancelled=await inspect();entry.samples.cancelled=cancelled;
    expect('native cancellation clears missile and pilot owners without another spend',()=>{assert.equal(cancelled.input.active,false);assert.equal(cancelled.missileInput,null);assert.equal(cancelled.missileShotsSpent,down.missileShotsSpent);});
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');const resumed=await inspect();entry.samples.resumed=resumed;
    expect('pause and resume cannot restore or spend the cancelled missile',()=>{assert.equal(resumed.missileInput,null);assert.equal(resumed.missileShotsSpent,down.missileShotsSpent);});
  });
  await check('pilot first, second contact fires immediately while pilot moves and retains ownership',async(entry,expect)=>{
    const a=await round(),before=await inspect();await press(a.pilot);const anchored=await inspect();entry.samples.anchored=anchored;
    expect('first touch anchors relative flight without a jump',()=>{assert.equal(anchored.input.active,true);equalNear(anchored.player.target,before.player.target,'target x');equalNear(anchored.player.targetY,before.player.targetY,'target y');});
    const pilotGuideVisible=await page.evaluate(()=>{
      const stick=document.querySelector('#flightPilotStick'),hint=document.querySelector('#flightPilotHint');
      return !stick.classList.contains('hidden')&&hint.classList.contains('used');
    });
    expect('pilot contact exposes its local direction control and retires the initial hint',()=>assert.equal(pilotGuideVisible,true));
    await press(a.fire);const down=await inspect();entry.samples.secondDown=down;
    expect('secondary action contact fires on pointer/touch down',()=>assert.equal(down.weapons.shotSequence,before.weapons.shotSequence+1));
    expect('action contact has independent ownership',()=>{assert.ok(down.fireInput);assert.notEqual(down.fireInput.id,down.input.id);assert.equal(down.input.id,anchored.input.id);});
    await move({...a.pilot,x:a.pilot.x-24,y:a.pilot.y-20});const moved=await inspect();entry.samples.moved=moved;
    expect('pilot moves in both axes while action is held',()=>{assert.ok(moved.player.target<anchored.player.target-1);assert.ok(moved.player.targetY<anchored.player.targetY-1);assert.equal(moved.input.id,anchored.input.id);});
    await capture('pilot-and-fire');await release(a.fire.id);const fireReleased=await inspect();entry.samples.fireReleased=fireReleased;
    expect('releasing action leaves the pilot active',()=>{assert.equal(fireReleased.input.active,true);assert.equal(fireReleased.input.id,anchored.input.id);assert.equal(fireReleased.fireInput,null);});
    await move({...a.pilot,x:a.pilot.x-40,y:a.pilot.y-30});const after=await inspect();entry.samples.afterMove=after;
    expect('remaining pilot still moves after action release',()=>assert.ok(after.player.target<moved.player.target-1));
    await release(a.pilot.id);
    const released=await inspect();entry.samples.last=released;expect('released pilot is inactive',()=>assert.equal(released.input.active,false));
    const pilotGuideReleased=await page.locator('#flightPilotStick').isVisible();
    expect('pilot direction control disappears on release',()=>assert.equal(pilotGuideReleased,false));
  });
  await check('action first, secondary pilot anchors independently and release cannot transfer control',async(entry,expect)=>{
    const a=await round(),before=await inspect();await press(a.fire);const fireFirst=await inspect();entry.samples.fireFirst=fireFirst;
    expect('primary action fires immediately',()=>assert.equal(fireFirst.weapons.shotSequence,before.weapons.shotSequence+1));
    expect('pressing action does not anchor a pilot',()=>assert.equal(fireFirst.input.active,false));
    await press(a.pilot);const pilot=await inspect();entry.samples.pilotSecond=pilot;
    expect('second contact becomes a relative pilot without a jump',()=>{assert.equal(pilot.input.active,true);equalNear(pilot.player.target,before.player.target,'target x');equalNear(pilot.player.targetY,before.player.targetY,'target y');});
    await move({...a.pilot,x:a.pilot.x+24,y:a.pilot.y-20});const moved=await inspect();entry.samples.moved=moved;
    expect('secondary pilot responds while action remains held',()=>{assert.ok(moved.player.target>pilot.player.target+1);assert.ok(moved.player.targetY<pilot.player.targetY-1);assert.ok(moved.fireInput);});
    await release(a.pilot.id);const released=await inspect();entry.samples.pilotReleased=released;
    expect('pilot release leaves action held',()=>{assert.equal(released.input.active,false);assert.ok(released.fireInput);});
    await move({...a.fire,x:a.fire.x-30,y:a.fire.y-10});const unchanged=await inspect();entry.samples.actionMoved=unchanged;
    expect('remaining action finger never takes over the pilot',()=>{assert.equal(unchanged.input.active,false);equalNear(unchanged.player.target,released.player.target,'target x');equalNear(unchanged.player.targetY,released.player.targetY,'target y');});
    await release(a.fire.id);expect('all contacts end',()=>assert.equal(activeContacts.size,0));
  });
  await check('holding action respects twenty rounds, gradual played-time recharge and weapon cadence',async(entry,expect)=>{
    const a=await round(),before=await inspect();await press(a.pilot);await press(a.fire);const immediately=await inspect();entry.samples.immediately=immediately;
    expect('first shot consumes exactly one charge immediately',()=>{assert.equal(immediately.weapons.shotSequence,1);assert.equal(immediately.weapons.charges,19);});
    await wait(start=>__TWO_TOUCH_QA__().weapons.elapsed>=start+.09,immediately.weapons.elapsed);
    const cadence=await inspect();entry.samples.duringCooldown=cadence;
    expect('holding cannot burst another shot inside the pulse cooldown',()=>assert.equal(cadence.weapons.shotSequence,1));
    await wait(()=>{const q=__TWO_TOUCH_QA__();return q.weapons.charges===0&&q.weapons.shotSequence>=20;});
    const empty=await inspect();entry.samples.empty=empty;
    const emptySequence=empty.weapons.shotSequence;
    const nextRecovery=empty.weapons.elapsed+empty.weapons.rechargeSeconds-empty.weapons.recharge;
    // CDP delivery can legitimately cross a recharge boundary between two
    // observations. Assert conservation against actual played time rather than
    // treating an old "empty" observation as frozen during contact dispatch.
    const conserved=sample=>{
      const recovered=Math.floor((empty.weapons.recharge+sample.elapsed-empty.weapons.elapsed+1e-7)/empty.weapons.rechargeSeconds);
      assert.equal(sample.shotSequence-emptySequence+sample.charges,recovered,
        `Ammunition must balance at played time ${sample.elapsed}`);
    };
    expect('holding empties the initial magazine plus rounds recovered during firing',()=>{assert.ok(emptySequence>=20&&emptySequence<40);assert.equal(empty.weapons.charges,0);assert.ok(empty.fireInput);});
    expect('ammo stays out of the tactical HUD and accessible fire label',()=>{assert.equal(empty.ammoText,'');assert.doesNotMatch(empty.fireAriaLabel,/\d|cargas|segundos/i);});
    await release(a.fire.id);const releasedEmpty=await inspect();entry.samples.releasedWhileEmpty=releasedEmpty;
    expect('release while empty clears only the action contact',()=>{assert.equal(releasedEmpty.fireInput,null);assert.equal(releasedEmpty.input.active,true);});
    await press(a.fire);const pressedEmpty=await inspect();entry.samples.startedWhileEmpty=pressedEmpty;
    expect('pressing an empty battery stores held intent and spends only played-time recovery',()=>{assert.equal(pressedEmpty.fireDisabled,false);
      assert.ok(pressedEmpty.fireInput);conserved(pressedEmpty.weapons);});
    await wait(target=>__TWO_TOUCH_QA__().weapons.elapsed>=target,nextRecovery-.12);
    const noFreeShot=await inspect();entry.samples.beforeRecharge=noFreeShot;
    await move({...a.pilot,x:a.pilot.x+16,y:a.pilot.y-16});const moving=await inspect();entry.samples.moving=moving;
    expect('pilot remains usable with an empty held battery',()=>{assert.equal(moving.input.active,true);assert.ok(moving.player.target>empty.player.target+1);});
    await wait(target=>__TWO_TOUCH_QA__().weapons.elapsed>=target,nextRecovery+.08);
    const recharged=await inspect();entry.samples.afterRecharge=recharged;
    const rechargeTrace=await page.evaluate(start=>window.__TWO_TOUCH_WEAPON_TRACE__.filter(sample=>sample.elapsed>=start),empty.weapons.elapsed);
    entry.samples.rechargeTrace=rechargeTrace;
    expect('holding cannot create free shots before recharge',()=>{
      const predeadline=rechargeTrace.filter(sample=>sample.elapsed<nextRecovery-1e-7);
      assert.ok(predeadline.length,'Record actual simulation frames before the deadline');
      for(const sample of predeadline){assert.equal(sample.shotSequence,emptySequence);assert.equal(sample.charges,0);}
      for(const sample of rechargeTrace)conserved(sample);
      conserved(noFreeShot.weapons);
    });
    expect('one played-time recharge yields exactly one further held shot',()=>{
      const firstShot=rechargeTrace.find(sample=>sample.shotSequence>emptySequence);
      assert.ok(firstShot,'A held action consumes the first recovered round');
      assert.ok(firstShot.elapsed>=nextRecovery-1e-7,'Recovered shot cannot precede its played-time deadline');
      assert.equal(firstShot.shotSequence,emptySequence+1);assert.equal(firstShot.charges,0);
      conserved(recharged.weapons);assert.ok(recharged.weapons.cooldown>=0);
    });
    await capture('held-recharge');await release(a.fire.id);const afterRelease=await inspect();entry.samples.released=afterRelease;
    expect('release while the battery button is disabled still clears action',()=>{assert.equal(afterRelease.fireInput,null);assert.equal(afterRelease.input.active,true);});
    await release(a.pilot.id);
  });
  await check('native pointer cancellation clears both independent owners',async(entry,expect)=>{
    const a=await round();await press(a.pilot);await press(a.fire);entry.samples.held=await inspect();await cancel();const cancelled=await inspect();entry.samples.cancelled=cancelled;
    expect('cancel removes pilot and action ownership',()=>{assert.equal(cancelled.input.active,false);assert.equal(cancelled.fireInput,null);});
    const shot=cancelled.weapons.shotSequence;await wait(start=>__TWO_TOUCH_QA__().weapons.elapsed>=start+.8,cancelled.weapons.elapsed);
    const later=await inspect();entry.samples.later=later;
    expect('no shot was emitted after cancellation',()=>assert.equal(later.weapons.shotSequence,shot));
  });
  await check('pause and resume freeze clocks and never inherit held contacts',async(entry,expect)=>{
    const a=await round();await press(a.pilot);await press(a.fire);await page.keyboard.press('Escape');const paused=await inspect();entry.samples.paused=paused;
    expect('pause clears both input owners',()=>{assert.equal(paused.state,'paused');assert.equal(paused.input.active,false);assert.equal(paused.fireInput,null);});
    await page.waitForTimeout(450);const frozen=await inspect();entry.samples.frozen=frozen;
    expect('pause freezes weapons and world time',()=>{assert.equal(frozen.elapsed,paused.elapsed);assert.deepEqual(frozen.weapons,paused.weapons);});
    await page.keyboard.press('Escape');await wait(()=>__TWO_TOUCH_QA__().state==='playing');const resumed=await inspect();entry.samples.resumed=resumed;
    await move({...a.pilot,x:a.pilot.x-20,y:a.pilot.y-20});const oldContact=await inspect();entry.samples.oldContactMoved=oldContact;
    expect('a contact from before pause does not resume pilot ownership',()=>{assert.equal(oldContact.input.active,false);equalNear(oldContact.player.target,resumed.player.target,'target x');equalNear(oldContact.player.targetY,resumed.player.targetY,'target y');});
    await wait(start=>__TWO_TOUCH_QA__().weapons.elapsed>=start+.6,resumed.weapons.elapsed);const after=await inspect();entry.samples.after=after;
    expect('no inherited firing after resume',()=>{assert.equal(after.fireInput,null);assert.equal(after.weapons.shotSequence,paused.weapons.shotSequence);});await cancel();
  });
  await check('restart resets ammunition without inheriting held action',async(entry,expect)=>{
    const a=await round();await press(a.pilot);await press(a.fire);const held=await inspect();entry.samples.held=held;
    await page.keyboard.press('Escape');await page.locator('#restart').click();await wait(token=>{const q=__TWO_TOUCH_QA__();return q.runToken>token&&q.state==='playing'&&q.warpTimer===0;},held.runToken);
    const restarted=await inspect();entry.samples.restarted=restarted;
    expect('new run starts with twenty rounds and no input owners',()=>{assert.equal(restarted.weapons.charges,20);assert.equal(restarted.weapons.shotSequence,0);assert.equal(restarted.input.active,false);assert.equal(restarted.fireInput,null);});
    await wait(start=>__TWO_TOUCH_QA__().weapons.elapsed>=start+.7,restarted.weapons.elapsed);const later=await inspect();entry.samples.later=later;
    expect('no old action is inherited by the new run',()=>assert.equal(later.weapons.shotSequence,0));await cancel();
  });
  await check('normal mouse click and keyboard activation emit exactly one shot each',async(entry,expect)=>{
    await round();const before=await inspect();await page.locator('#fire').click();const clicked=await inspect();entry.samples.mouseClick=clicked;
    expect('one pointer click has no synthesized duplicate shot',()=>assert.equal(clicked.weapons.shotSequence,before.weapons.shotSequence+1));
    await wait(()=>__TWO_TOUCH_QA__().weapons.cooldown===0);await page.locator('#fire').focus();await page.keyboard.press('Enter');const entered=await inspect();entry.samples.enter=entered;
    expect('button Enter activation fires exactly once',()=>assert.equal(entered.weapons.shotSequence,clicked.weapons.shotSequence+1));
    await wait(()=>__TWO_TOUCH_QA__().weapons.cooldown===0);await page.keyboard.press(' ');const spaced=await inspect();entry.samples.space=spaced;
    expect('Space fires exactly once through the keyboard action',()=>assert.equal(spaced.weapons.shotSequence,entered.weapons.shotSequence+1));
    expect('click and keyboard never leave a held action owner',()=>assert.equal(spaced.fireInput,null));await capture('single-shot-controls');
  });
}
(async()=>{
  await prepareEvidence(output);evidenceReady=true;report.scriptSha256=sha256(await fs.readFile(__filename));
  report.git={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim()};
  const info=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8'));report.buildInfo={commit:info.commit,revision:info.revision,dirty:info.dirty};
  report.packageFiles={};for(const name of ['game.js','content-runtime.js','styles.css','index.html']){const bytes=await fs.readFile(path.join(root,'juego',name));report.packageFiles[name]={bytes:bytes.length,sha256:sha256(bytes)};}
  report.launcher={sha256:sha256(await fs.readFile(path.join(root,'index.html')))};
  server=await startStaticServer(root);browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const fallback of values['fallback-fixture']?[false,true]:[false]){
    profile={id:fallback?'touch-event-capability-fixture':'native-pointer-touch',executionKind:fallback?'Explicit Chrome capability fixture with native CDP TouchEvents':'Native Chromium CDP multi-touch contacts',
      status:'running',checks:[],screenshots:[],errors:[],consoleErrors:[],failedRequests:[]};report.profiles.push(profile);
    context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(45000);
    cdp=await context.newCDPSession(page);activeContacts=new Map();
    page.on('pageerror',e=>profile.errors.push(errorText(e)));page.on('console',m=>{if(m.type()==='error')profile.consoleErrors.push(m.text());});
    page.on('requestfailed',r=>profile.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
    page.on('response',r=>{if(r.status()>=400)profile.failedRequests.push({url:r.url(),status:r.status()});});
    await page.addInitScript(fixture=>{
      if(fixture){Object.defineProperty(window,'PointerEvent',{value:undefined,writable:true,configurable:true});
        for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,event=>{if(event.pointerType==='touch')event.stopImmediatePropagation();},true);}
      const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),audit=window.__TWO_TOUCH_RAF__={pending:new Set(),maximum:0,frames:0,errors:[]};
      const weaponTrace=window.__TWO_TOUCH_WEAPON_TRACE__=[];
      window.requestAnimationFrame=callback=>{const id=request(now=>{audit.pending.delete(id);audit.frames++;try{
        callback(now);
        // Read after the existing simulation owner; never inject ammo, clocks,
        // contacts or another RAF. Retain frames so CDP latency cannot erase the
        // evidence on either side of a real recharge boundary.
        const q=window.__TWO_TOUCH_QA__?.();
        if(q?.state==='playing'&&q.weapons){weaponTrace.push({...q.weapons});if(weaponTrace.length>6000)weaponTrace.shift();}
      }catch(error){audit.errors.push(error.stack||String(error));throw error;}});audit.pending.add(id);audit.maximum=Math.max(audit.maximum,audit.pending.size);return id;};
      window.cancelAnimationFrame=id=>{audit.pending.delete(id);cancel(id);};
      const delivery=window.__TWO_TOUCH_DELIVERY__={touchstart:0,touchmove:0,touchend:0,touchcancel:0};
      for(const type of Object.keys(delivery))window.addEventListener(type,()=>{delivery[type]++;},true);
      const events=window.__TWO_TOUCH_EVENTS__=[];for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchend','touchcancel','click','keydown'])
        window.addEventListener(type,event=>{if(events.length<500)events.push({type,target:event.target?.id||event.target?.tagName,pointerId:event.pointerId??null,isPrimary:event.isPrimary??null,
          detail:event.detail??null,key:event.key??null,changedTouches:event.changedTouches?Array.from(event.changedTouches,t=>t.identifier):null,timeStamp:event.timeStamp});},true);
    },fallback);
    await page.route(/\/game\.js(?:\?.*)?$/,async route=>{const response=await route.fetch(),body=await response.body(),source=body.toString('utf8');
      assert.equal(sha256(body),report.packageFiles['game.js'].sha256);const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';assert.equal(source.split(marker).length,2);
      const hook=`window.__TWO_TOUCH_QA__=()=>({state,currentLevel,elapsed,hull,W,H,warpTimer,legacyRunning,runToken,player:{x:player.x,y:player.y,target:player.target,targetY:player.targetY},
        input:{...classicFlightInput},fireInput:typeof fireInput==='undefined'?null:fireInput?{...fireInput}:null,fireOwnershipAvailable:typeof fireInput!=='undefined',
        missileInput:typeof missileInput==='undefined'?null:missileInput?{...missileInput}:null,missileAmmo:classicSalvageState?.missileAmmo??null,missileShotsSpent:classicSalvageState?.missileShotsSpent??null,
        weapons:classicWeapons?{selected:classicWeapons.selected,charges:classicWeapons.charges,cooldown:classicWeapons.cooldown,recharge:classicWeapons.recharge,rechargeSeconds:classicWeapons.rechargeSeconds,elapsed:classicWeapons.elapsed,
          shotSequence:classicWeapons.shotSequence,projectileSequence:classicWeapons.projectileSequence}:null,fireDisabled:ui.fire.disabled,fireAriaDisabled:ui.fire.getAttribute('aria-disabled'),ammoText:ui.ammo.textContent,fireAriaLabel:ui.fire.getAttribute('aria-label'),
        assets:Object.entries(SPRITES).filter(([,image])=>image.src).map(([id,image])=>({id,loaded:image.complete&&image.naturalWidth>0}))});\n`;
      await route.fulfill({response,body:source.replace(marker,hook+marker)});
    });
    await page.goto(server.url,{waitUntil:'load'});await wait(()=>{const image=document.querySelector('.hero img');return image?.complete&&image.naturalWidth>0;});
    profile.launcher=await page.locator('.hero img').evaluate(image=>({src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight,alt:image.alt}));
    await capture('launcher');if(!values.baseline)assert.equal(profile.launcher.src,'juego/assets/player_ship_identity_v1.webp','Launcher still shows the retired ship');
    assert.equal(await page.locator('#qaArchive,#unlockClassic,#n7link,#journeylink').count(),0);
    await page.locator('#classiclink').click();
    await wait(()=>typeof __TWO_TOUCH_QA__==='function'&&__TWO_TOUCH_QA__().state==='menu');
    await runControls();profile.status=profile.checks.some(c=>c.status==='failed')?'failed':'passed';
    await save();await cdp.detach();await context.close();page=null;
  }
  for(const[name,recorded]of Object.entries(report.packageFiles))assert.equal(sha256(await fs.readFile(path.join(root,'juego',name))),recorded.sha256,`Package changed during QA: ${name}`);
  assert.equal(sha256(await fs.readFile(path.join(root,'index.html'))),report.launcher.sha256,'Launcher changed during QA');report.packageUnchanged=true;
  report.retiredShipRequests=server.requests.filter(request=>/\/assets\/ship_frame_\d+\.webp(?:\?|$)/.test(request.path));
  if(!values.baseline)assert.deepEqual(report.retiredShipRequests,[],'An active UI requested the retired ship artwork');
  report.status=report.profiles.some(p=>p.status==='failed')?'failed':'passed';report.exitCode=report.status==='passed'?0:1;
})().catch(async error=>{report.status='failed';report.exitCode=1;report.error=errorText(error);if(profile)profile.status='failed';
  if(page)try{await capture('fatal-error');}catch{}console.error(report.error);
}).finally(async()=>{report.durationMs=Date.now()-started;report.finishedAt=new Date().toISOString();if(server)report.requests=server.requests;
  if(browser)await browser.close().catch(()=>{});if(server)await server.close().catch(()=>{});if(evidenceReady)await save();
  console.log(JSON.stringify({status:report.status,baseline:report.baseline,exitCode:report.exitCode,
    profiles:report.profiles.map(p=>({id:p.id,status:p.status,checks:p.checks.map(c=>({name:c.name,status:c.status,failed:c.assertions.filter(a=>a.status==='failed').map(a=>a.label)}))})),output,durationMs:report.durationMs}));
  process.exitCode=report.exitCode??1;
});
