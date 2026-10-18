import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGuardianAtlas,advanceGuardianAtlas,hitGuardianAtlas,GUARDIAN_ATLAS_RULES as R}
  from '../src/game/combat/guardian-atlas.js';
import {createClassicWeapons,advanceClassicWeapons,triggerClassicWeapon,hitClassicProjectile,
  setClassicUnlimitedFire,triggerClassicMissile} from '../src/game/combat/classic-weapons.js';

const DT=1/60,player={x:360,y:1145};
function tick(boss,pilot=player,events=[]){events.push(...advanceGuardianAtlas(boss,DT,pilot));return events;}
function runFor(boss,seconds,pilot=player,events=[]){
  for(let time=0;time<seconds-1e-8;time+=DT)events.push(...advanceGuardianAtlas(boss,Math.min(DT,seconds-time),pilot));
  return events;
}
function until(boss,predicate,pilot=player,events=[]){
  for(let frame=0;frame<240*60;frame++){if(predicate(boss))return events;tick(boss,pilot,events);}
  assert.fail(`Unreachable state ${boss.state}/${boss.hp}`);
}
function ready(options){const boss=createGuardianAtlas(options);until(boss,b=>b.state==='closed');return boss;}
function expose(boss=ready()){until(boss,b=>b.state==='exposed');return boss;}

// The owner now requests a 30% enlargement relative to the forty-percent ship.
// Keep a deliberately conservative complete outline for escape checks. These
// values do not change the actual collision geometry owned by integration.
const HULL={half:47.6*1.3,top:63.2*1.3,bottom:41.6*1.3};

test('entry arrives closed, identifies the falsified ID and exposes no free initial damage',()=>{
  const boss=createGuardianAtlas(),initial=boss.y;
  assert.equal(boss.version,'guardian-atlas-v6');assert.equal(boss.hp,96);
  assert.equal(hitGuardianAtlas(boss,10).reason,'armored');
  const events=runFor(boss,1);assert.ok(boss.y>initial&&boss.y<boss.targetY);
  assert.equal(events.some(e=>e.type==='projectile'),false);
  until(boss,b=>b.state==='closed',player,events);
  assert.equal(boss.y,boss.targetY);assert.equal(boss.coreExposure,0);
  assert.equal(boss.vulnerability,false);assert.equal(boss.armorClosed,true);
  const arrival=events.filter(e=>e.type==='arrival');assert.equal(arrival.length,1);
  assert.equal(arrival[0].reason,'falsified-identification');
  assert.equal(arrival[0].recordId,'chronos-sabotage-atlas-log');
});

test('the real cycle is closed attack -> opening -> exposed -> closing, with no damage while attacking',()=>{
  const boss=ready(),events=[];const states=[];
  for(let frame=0;frame<30*60&&!(states.includes('closing')&&boss.state==='closed');frame++){
    if(states.at(-1)!==boss.state)states.push(boss.state);
    if(boss.state!=='exposed')assert.equal(hitGuardianAtlas(boss,.01).reason,'armored');
    tick(boss,player,events);
  }
  assert.deepEqual(states,['closed','charge','fire','opening','exposed','closing']);
  assert.equal(events.filter(e=>e.type==='coreExposed').length,1);
  assert.equal(events.filter(e=>e.type==='coreClosed').length,1);
  assert.ok(events.filter(e=>e.type==='projectile').length>0);
  assert.equal(boss.hp,96,'Checking a closed plate must never drain HP');
});

test('opening and closing have monotonic physical exposure, with damage only at the fully exposed window',()=>{
  const boss=ready();until(boss,b=>b.state==='opening');
  const exposure=[];
  while(boss.state==='opening'){exposure.push(boss.coreExposure);assert.equal(hitGuardianAtlas(boss,1).accepted,false);tick(boss);}
  assert.equal(boss.state,'exposed');assert.equal(boss.coreExposure,1);assert.equal(boss.vulnerability,true);
  for(let i=1;i<exposure.length;i++)assert.ok(exposure[i]>=exposure[i-1]);
  until(boss,b=>b.state==='closing');const closing=[];
  while(boss.state==='closing'){closing.push(boss.coreExposure);assert.equal(hitGuardianAtlas(boss,1).accepted,false);tick(boss);}
  assert.equal(boss.state,'closed');assert.equal(boss.coreExposure,0);
  for(let i=1;i<closing.length;i++)assert.ok(closing[i]<=closing[i-1]);
});

test('zero delta freezes every state, observations, core shutters, fire and terminal progression',()=>{
  for(const state of ['entry','closed','charge','fire','opening','exposed','closing','phaseBreak','disabled']){
    const boss=createGuardianAtlas();
    if(state==='phaseBreak'||state==='disabled'){
      expose(boss);hitGuardianAtlas(boss,state==='disabled'?1000:boss.maxHp/2);
    }else until(boss,b=>b.state===state);
    const before=structuredClone(boss);let calls=0;
    for(let n=0;n<50;n++)assert.deepEqual(advanceGuardianAtlas(boss,0,{x:119,y:900},()=>calls++),[]);
    assert.deepEqual(boss,before);assert.equal(calls,0);
  }
});

test('basic cannon deployment is brief and aim stays locked despite later pilot input',()=>{
  const boss=ready(),events=until(boss,b=>b.state==='charge',{x:170,y:1145});
  const deploy=events.find(e=>e.type==='warning');
  assert.equal(deploy.kind,'mechanicalDeployment');assert.equal(deploy.attackTier,'basic');
  assert.equal(deploy.safeGap,null);assert.ok(deploy.seconds>=.3&&deploy.seconds<.4);
  const fire=until(boss,b=>b.state==='fire',{x:601,y:1145});
  const shots=fire.filter(e=>e.type==='projectile').map(e=>e.projectile);
  assert.equal(shots.length,3);assert.equal(shots[1].targetX,170);
  const middle=shots[1],crossing=middle.x+middle.vx*((middle.targetY-middle.y)/middle.vy);
  assert.ok(Math.abs(crossing-170)<1e-6);assert.ok(middle.vy>0);
  const copy=structuredClone(shots);runFor(boss,1,{x:119,y:800},fire);
  assert.deepEqual(shots,copy,'No projectile can home on a later sample');
});

test('basic, medium and superpower are distinct closed-armored routines in both phases',()=>{
  for(const phase of [1,2]){
    const boss=ready();if(phase===2){expose(boss);hitGuardianAtlas(boss,boss.maxHp/2);}
    const events=[];
    until(boss,b=>b.phaseAttacks>=3&&b.state==='exposed',player,events);
    const deployments=events.filter(e=>e.type==='warning');
    assert.deepEqual(deployments.map(e=>e.attackTier),phase===1?['basic','medium','superpower']:['medium','basic','superpower']);
    for(const warning of deployments){
      assert.equal(warning.safeGap,null);
      const shots=events.filter(e=>e.type==='projectile'&&e.projectile.attackId===warning.attackId).map(e=>e.projectile);
      assert.equal(shots.length,warning.attackTier==='basic'?3:warning.attackTier==='superpower'||phase===2?10:6);
      assert.equal(new Set(shots.map(s=>s.projectileId)).size,shots.length);
      assert.deepEqual([...new Set(shots.map(s=>s.volley))],warning.attackTier==='basic'?[0]:[0,1]);
      assert.ok(shots.every(s=>s.attackTier===warning.attackTier&&s.damage>0));
      if(warning.attackTier==='superpower'){
        assert.ok(shots.every(s=>s.heavy&&s.r===14&&s.damage===22));
        assert.ok(shots.every(s=>Math.hypot(s.vx,s.vy)<350));
      }
    }
  }
});

test('a second volley threshold emits exactly once, including paused and long foreground deltas',()=>{
  const boss=ready();until(boss,b=>b.attackTier==='medium'&&b.state==='fire');
  assert.equal(boss.volley,1);
  runFor(boss,R.attacks.medium.volleyTimes[1]-.02);
  const before=structuredClone(boss);assert.deepEqual(advanceGuardianAtlas(boss,0,player),[]);assert.deepEqual(boss,before);
  const events=advanceGuardianAtlas(boss,99,player);
  assert.equal(boss.volley,2);assert.ok(events.filter(e=>e.type==='projectile').length>0);
  const later=runFor(boss,1);assert.equal(later.filter(e=>e.type==='projectile').length,0);
});

test('the first opening waits until every previous projectile clears the complete scaled tail',()=>{
  for(const height of [568,1280,1560]){
    const playerY=height===568?450:height-135;
    const boss=ready({height,playerY});let passedAt=0,openedAt=null;
    for(let frame=0;frame<20*60&&!openedAt;frame++)for(const event of advanceGuardianAtlas(boss,DT,{x:360,y:playerY})){
      if(event.type==='projectile'){
        const s=event.projectile;passedAt=Math.max(passedAt,boss.age+(playerY+HULL.bottom+s.r-s.y)/s.vy);
      }
      if(event.type==='opening')openedAt=boss.age;
    }
    assert.ok(openedAt>=passedAt+.08,`${height}: a core window must be usable after dodging real shots`);
  }
});

test('all routines preserve a ballistic full-outline escape with the enlarged ship envelope',()=>{
  for(const height of [568,1280,1560])for(const targetX of [145,360,575])for(const phase of [1,2]){
    const playerY=height===568?450:height-135,pilot={x:targetX,y:playerY};
    const boss=ready({height,playerY});if(phase===2){expose(boss);hitGuardianAtlas(boss,boss.maxHp/2);}
    const events=[];until(boss,b=>b.phaseAttacks>=3&&b.state==='exposed',pilot,events);
    const attacks=events.filter(e=>e.type==='warning');
    for(const attack of attacks){
      const shots=events.filter(e=>e.type==='projectile'&&e.projectile.attackId===attack.attackId).map(e=>e.projectile);
      const candidates=[];for(let x=HULL.half;x<=720-HULL.half;x+=4)candidates.push(x);
      // Pick the closest genuinely clear lane, rather than the first lane
      // enumerated at the far left, when checking the reaction distance.
      candidates.sort((a,b)=>Math.abs(a-targetX)-Math.abs(b-targetX));
      const safe=candidates.find(x=>shots.every(s=>[playerY-HULL.top-s.r,playerY+HULL.bottom+s.r].every(y=>{
        const crossing=s.x+s.vx*((y-s.y)/s.vy);return Math.abs(crossing-x)>HULL.half+s.r+2;
      })));
      assert.notEqual(safe,undefined,`${height}/${targetX}/${phase}/${attack.attackTier}: no unavoidable complete wall`);
      const firstContact=Math.min(...shots.map(s=>(playerY-HULL.top-s.r-s.y)/s.vy));
      assert.ok(Math.abs(safe-targetX)/720<attack.seconds+firstContact,
        `${height}/${targetX}/${phase}/${attack.attackTier}: movement can reach the nearest complete escape before contact`);
    }
  }
});

test('100 seeds have finite unique ballistic emissions and no stored solved safe lane',()=>{
  for(let seed=1;seed<=100;seed++){
    const boss=ready({width:[320,390,720][seed%3],seed});
    const events=[];until(boss,b=>b.phaseAttacks>=3&&b.state==='exposed',{x:boss.width*.5,y:1145},events);
    const shots=events.filter(e=>e.type==='projectile').map(e=>e.projectile);
    assert.equal(shots.length,19);assert.equal(new Set(shots.map(s=>s.projectileId)).size,19);
    assert.ok(shots.every(s=>s.safeGap===null&&Number.isFinite(s.vx)&&s.vy>0&&s.life===7));
  }
});

test('a visible core accepts central contacts and rejects armor contacts even during exposure',()=>{
  const boss=expose();const hp=boss.hp;
  assert.equal(hitGuardianAtlas(boss,6,{x:boss.x+boss.coreRadius+20,y:boss.y,radius:4}).reason,'outside-core');
  assert.equal(boss.hp,hp);
  assert.equal(hitGuardianAtlas(boss,6,{x:boss.x,y:boss.y,radius:4}).accepted,true);
  assert.equal(boss.hp,hp-6);assert.equal(boss.state,'exposed');
  assert.equal(boss.flash,.14);
});

test('sustained real damage never resets, delays or reopens the core window',()=>{
  const control=expose(),damaged=expose();let hits=0;
  for(let frame=0;frame<300&&control.state==='exposed';frame++){
    tick(control);if(damaged.state==='exposed'&&frame%5===0){hitGuardianAtlas(damaged,.01);hits++;}
    tick(damaged);
  }
  assert.ok(hits>30);assert.equal(control.state,'closing');assert.equal(damaged.state,'closing');
  assert.equal(control.age,damaged.age);assert.equal(control.stateTime,damaged.stateTime);
  assert.equal(hitGuardianAtlas(damaged,6).reason,'armored');
});

test('half health changes phase once, clears prior fire and protects the full transition',()=>{
  const boss=expose(),result=hitGuardianAtlas(boss,boss.maxHp/2);
  assert.equal(boss.phase,2);assert.equal(boss.state,'phaseBreak');assert.equal(boss.hp,48);
  assert.equal(boss.vulnerability,false);assert.equal(boss.coreExposure,0);
  assert.equal(hitGuardianAtlas(boss,6).reason,'armored');
  assert.equal(result.events.filter(e=>e.type==='phase'&&e.clearProjectiles).length,1);
  until(boss,b=>b.state==='closed');assert.equal(boss.phaseAttacks,0);
  until(boss,b=>b.state==='charge');assert.equal(boss.attackTier,'medium');
});

test('Atlas physically flanks and keeps moving while charging, firing, opening and exposing the core',()=>{
  const boss=ready(),ranges=new Map();
  for(let frame=0;frame<30*60;frame++){
    const range=ranges.get(boss.state)||{minX:boss.x,maxX:boss.x,minY:boss.y,maxY:boss.y};
    range.minX=Math.min(range.minX,boss.x);range.maxX=Math.max(range.maxX,boss.x);
    range.minY=Math.min(range.minY,boss.y);range.maxY=Math.max(range.maxY,boss.y);
    ranges.set(boss.state,range);tick(boss,{x:575,y:1145});
  }
  for(const state of ['closed','charge','fire','opening','exposed','closing']){
    const range=ranges.get(state);assert.ok(range,`${state} reached`);
    assert.ok(range.maxX-range.minX>5,`${state} cannot remain a static turret`);
  }
  const exposed=ranges.get('exposed');assert.ok(exposed.maxX-exposed.minX>50);
});

test('motion stays inside its physical arena with bounded velocity, acceleration and no transition snaps',()=>{
  for(const width of [280,320,390,720])for(const seed of [1,17,507]){
    const boss=ready({width,seed});
    for(let frame=0;frame<60*60;frame++){
      const before={x:boss.x,y:boss.y,vx:boss.motionVx,vy:boss.motionVy};
      tick(boss,{x:width*(.5+.4*Math.sin(frame*.03)),y:1145});
      const margin=boss.r+Math.min(18,width*.025);
      assert.ok(boss.x>=margin-1e-8&&boss.x<=width-margin+1e-8);
      assert.ok(boss.y>=Math.max(64,boss.targetY-16)-1e-8&&boss.y<=boss.targetY+24+1e-8);
      assert.ok(Math.abs(boss.x-before.x)<=R.motion.maxSpeed*DT+1e-8);
      assert.ok(Math.abs(boss.y-before.y)<=R.motion.maxVerticalSpeed*DT+1e-8);
      assert.ok(Math.abs(boss.motionVx-before.vx)<=R.motion.acceleration*DT+1e-7);
      assert.ok(Math.abs(boss.motionVy-before.vy)<=R.motion.acceleration*DT+1e-7);
    }
  }
});

test('phase change and phase-two exposure retain physical movement, then shutdown fixes the disabled wreck in place',()=>{
  const boss=expose(),start={x:boss.x,y:boss.y};
  hitGuardianAtlas(boss,boss.maxHp/2);assert.equal(boss.state,'phaseBreak');
  runFor(boss,.65,{x:150,y:1145});assert.ok(Math.hypot(boss.x-start.x,boss.y-start.y)>8);
  until(boss,b=>b.state==='exposed',{x:150,y:1145});const exposedAt={x:boss.x,y:boss.y};
  runFor(boss,1,{x:575,y:1145});assert.equal(boss.vulnerability,true);
  assert.ok(Math.hypot(boss.x-exposedAt.x,boss.y-exposedAt.y)>10);
  hitGuardianAtlas(boss,1000);const stopped={x:boss.x,y:boss.y};
  runFor(boss,5);assert.deepEqual({x:boss.x,y:boss.y},stopped);assert.equal(boss.resolved,true);
});

test('every volley leaves the actual moving weapons while the sampled target remains locked',()=>{
  const boss=ready(),events=[];
  while(boss.phaseAttacks<3||boss.state!=='exposed'){
    const frame=tick(boss,{x:170,y:1145});events.push(...frame);
    for(const volley of frame.filter(e=>e.type==='volley')){
      const shots=frame.filter(e=>e.type==='projectile'&&e.projectile.attackId===volley.attackId&&
        e.projectile.volley===volley.volley).map(e=>e.projectile);
      assert.ok(shots.length>0);
      for(const s of shots){assert.equal(s.x,volley.x);assert.equal(s.y,volley.y);}
      assert.ok(Math.abs(volley.y-(boss.y+boss.r*.7))<R.motion.maxVerticalSpeed*DT+1e-8);
      const cross=boss.attackTier==='medium'&&boss.phase===1;
      const anchor=boss.x+(cross?(volley.volley===0?-1:1)*boss.r*.72:0);
      assert.ok(Math.abs(volley.x-anchor)<R.motion.maxSpeed*DT+1e-8);
    }
  }
  const volleys=events.filter(e=>e.type==='volley'&&e.attackTier==='medium');
  assert.equal(volleys.length,2);assert.notEqual(volleys[0].x,volleys[1].x);
});

test('after introducing routines, adaptive decisions intercept flanks and still recharge a superpower',()=>{
  const centre=ready({seed:17}),flank=ready({seed:17}),centreEvents=[],flankEvents=[];
  until(centre,b=>b.phaseAttacks>=8&&b.state==='charge',{x:360,y:1145},centreEvents);
  until(flank,b=>b.phaseAttacks>=8&&b.state==='charge',{x:120,y:1145},flankEvents);
  const first=e=>e.filter(event=>event.type==='warning').slice(0,3).map(event=>event.attackTier);
  assert.deepEqual(first(centreEvents),['basic','medium','superpower']);
  assert.deepEqual(first(flankEvents),first(centreEvents));
  const later=e=>e.filter(event=>event.type==='warning').slice(3);
  assert.ok(later(flankEvents).some(event=>event.decision==='intercept-flank'));
  assert.ok(later(centreEvents).some(event=>event.decision==='pressure-observed-lane'));
  assert.ok(later(flankEvents).some(event=>event.decision==='reactor-recharged'&&event.attackTier==='superpower'));
  assert.notDeepEqual(later(flankEvents).map(e=>e.attackTier),later(centreEvents).map(e=>e.attackTier));
});

test('lead uses sampled prior velocity, is capped and does not consult a later input reversal',()=>{
  const boss=ready();until(boss,b=>b.state==='closing');until(boss,b=>b.state==='closed');
  let frame=0;
  while(boss.state!=='charge')tick(boss,{x:180+Math.min(360,frame++*2),y:1145});
  const lock={...boss.telegraph};assert.equal(lock.attackTier,'medium');
  assert.ok(lock.observedVx>0&&lock.observedVx<=720);assert.ok(lock.leadOffset>0&&lock.leadOffset<=100);
  const events=until(boss,b=>b.state==='fire',{x:119,y:1145});
  assert.ok(events.filter(e=>e.type==='projectile').every(e=>e.projectile.targetX===lock.targetX));
});

function simulateManual(type,{missiles=false,seed=507,evasive=true}={}){
  const boss=createGuardianAtlas({seed}),weapons=createClassicWeapons({type,unlocked:type==='pulse'?['pulse']:['pulse','twin']});
  setClassicUnlimitedFire(weapons,true);
  const ship={x:360,y:1145};let hostile=[],destination=360,nextReaction=0,hull=100,taps=0,rewards=0,missilesUsed=0;
  const phases=new Set();let nextMissileOpening=-1;
  const choose=()=>{
    const candidates=[ship.x,boss.x,HULL.half,720-HULL.half];for(let x=HULL.half;x<=720-HULL.half;x+=20)candidates.push(x);
    const cost=x=>{
      let value=Math.abs(x-boss.x)*.2+Math.abs(x-ship.x)*.025;
      for(const s of hostile){
        const enters=Math.max(0,(ship.y-HULL.top-s.r-s.y)/s.vy),exits=Math.min(4,(ship.y+HULL.bottom+s.r-s.y)/s.vy);
        for(let t=enters;t<=exits;t+=.04){
          const px=ship.x+clamp(x-ship.x,-720*t,720*t);
          if(Math.abs(s.x+s.vx*t-px)<=HULL.half+s.r+4){value+=1000000/(.2+t);break;}
        }
      }
      return value;
    };
    return candidates.map(x=>({x,cost:cost(x)})).sort((a,b)=>a.cost-b.cost)[0].x;
  };
  for(let frame=0;frame<240*60&&!boss.resolved&&hull>0;frame++){
    for(const event of advanceGuardianAtlas(boss,DT,ship)){
      if(event.type==='projectile')hostile.push({...event.projectile});
      if(event.clearProjectiles||event.type==='shutdown')hostile=[];
      if(event.type==='disabled')rewards++;
    }
    phases.add(boss.phase);advanceClassicWeapons(weapons,DT);
    nextReaction-=DT;if(nextReaction<=0){nextReaction=.16;destination=evasive?choose():boss.x;}
    ship.x+=clamp(destination-ship.x,-720*DT,720*DT);
    if(['opening','exposed'].includes(boss.state)&&Math.abs(ship.x-boss.x)<24){
      if(triggerClassicWeapon(weapons,{x:ship.x,y:ship.y-50}).accepted)taps++;
      if(missiles&&boss.state==='exposed'&&boss.stateTime<1.3&&nextMissileOpening!==boss.attackId&&missilesUsed<3){
        const result=triggerClassicMissile(weapons,{x:ship.x,y:ship.y-50,shotId:`missile:${missilesUsed+1}`});
        if(result.accepted){missilesUsed++;nextMissileOpening=boss.attackId;}
      }
    }
    for(const shot of [...weapons.projectiles]){
      const radius=boss.vulnerability?boss.coreRadius:boss.r;
      if(Math.hypot(shot.x-boss.x,shot.y-boss.y)>radius+shot.radius)continue;
      const contact=hitClassicProjectile(weapons,shot.id,'atlas');if(!contact.accepted)continue;
      const result=hitGuardianAtlas(boss,contact.damage,{x:shot.x,y:shot.y,radius:shot.radius});
      if(result.events.some(e=>e.clearProjectiles||e.type==='shutdown'))hostile=[];
    }
    for(let i=hostile.length-1;i>=0;i--){
      const s=hostile[i];s.x+=s.vx*DT;s.y+=s.vy*DT;s.life-=DT;
      if(Math.abs(s.x-ship.x)<=HULL.half+s.r&&s.y>=ship.y-HULL.top-s.r&&s.y<=ship.y+HULL.bottom+s.r){hull-=s.damage;hostile.splice(i,1);}
      else if(s.life<=0||s.x< -60||s.x>780||s.y>1400)hostile.splice(i,1);
    }
  }
  return {resolved:boss.resolved,hp:boss.hp,hull,taps,rewards,missilesUsed,seconds:boss.age,
    phases:[...phases],magazineAfter:weapons.charges};
}
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));

test('manual basic infinite fire and retained Twin defeat the real core windows without spending the route magazine',t=>{
  const pulse=simulateManual('pulse'),twin=simulateManual('twin');
  for(const result of [pulse,twin]){
    t.diagnostic(JSON.stringify(result));assert.equal(result.resolved,true);assert.equal(result.hp,0);
    assert.ok(result.hull>0);assert.equal(result.rewards,1);assert.deepEqual(result.phases,[1,2]);
    assert.equal(result.magazineAfter,20);assert.ok(result.seconds>30&&result.seconds<180);
  }
  assert.ok(twin.seconds<pulse.seconds,'The retained two-barrel upgrade has a real counterattack benefit');
});

test('exactly three physical missiles are a useful finite supplement to the same infinite basic fire',t=>{
  const baseline=simulateManual('pulse'),armed=simulateManual('pulse',{missiles:true});t.diagnostic(JSON.stringify(armed));
  assert.equal(armed.resolved,true);assert.ok(armed.hull>0);assert.equal(armed.missilesUsed,3);
  assert.equal(armed.rewards,1);assert.equal(armed.magazineAfter,20);
  assert.ok(armed.seconds<baseline.seconds,'Finite missiles must reduce, not replace, the real counterattack fight');
});

test('counterplay stays viable across deterministic combat seeds using only emitted ballistic threats',()=>{
  for(const seed of [1,17,9001]){
    const result=simulateManual('pulse',{seed});assert.equal(result.resolved,true);assert.ok(result.hull>0);
    assert.equal(result.rewards,1);assert.ok(result.seconds<180);
  }
});

test('following the core and firing without evasion is punished even with accurate manual aiming',t=>{
  const evasive=simulateManual('pulse'),reckless=simulateManual('pulse',{evasive:false});
  t.diagnostic(JSON.stringify({evasive,reckless}));
  assert.equal(evasive.resolved,true);assert.ok(evasive.hull>0);
  assert.ok(reckless.hull<evasive.hull,'Firing accurately must not erase the need to dodge a final guardian');
  assert.equal(reckless.resolved,false);assert.ok(reckless.hull<=0);
});

test('shutdown is visible, terminates attacks and emits one restored-identity record and progression receipt',()=>{
  const boss=expose(),death=hitGuardianAtlas(boss,1000);
  assert.equal(boss.hp,0);assert.equal(boss.disabled,true);assert.equal(boss.resolved,false);
  assert.equal(death.events.filter(e=>e.type==='shutdown').length,1);
  assert.equal(hitGuardianAtlas(boss,1).reason,'disabled');
  const events=runFor(boss,1);assert.equal(boss.resolved,false);
  runFor(boss,1,player,events);assert.equal(boss.resolved,true);
  const terminal=events.filter(e=>e.type==='disabled');assert.equal(terminal.length,1);
  assert.equal(terminal[0].resolution,'identity-restored');assert.equal(terminal[0].recordId,'chronos-sabotage-atlas-log');
  assert.equal(events.some(e=>e.type==='projectile'),false);
  const copy=structuredClone(boss);runFor(boss,10,player,events);assert.deepEqual(boss,copy);
  assert.equal(events.filter(e=>e.type==='disabled').length,1);
});

test('same seed and observed inputs reproduce transitions, patrol, shutters and physical attacks',()=>{
  function trace(){const boss=ready({seed:17});const events=runFor(boss,45);return {boss,events};}
  const result=trace();assert.deepEqual(trace(),result);
  assert.equal(new Set(result.events.filter(e=>e.type==='warning').map(e=>e.attackTier)).size,3);
});

test('callback delivery preserves ordered events and never duplicates fire',()=>{
  const boss=ready();until(boss,b=>b.state==='charge');runFor(boss,R.attacks.basic.chargeSeconds-.03);
  const callbacks=[],events=advanceGuardianAtlas(boss,.05,player,e=>callbacks.push(e));
  assert.deepEqual(callbacks,events);assert.equal(events.filter(e=>e.type==='projectile').length,3);
  assert.deepEqual(advanceGuardianAtlas(boss,.01,player),[]);
});

test('invalid input never advances combat and low pilot positions do not crash initialisation',()=>{
  const boss=createGuardianAtlas();advanceGuardianAtlas(boss,999,player);assert.equal(boss.age,R.maxDelta);
  const before=structuredClone(boss);
  for(const dt of [-1,NaN,Infinity])assert.throws(()=>advanceGuardianAtlas(boss,dt,player));
  assert.throws(()=>advanceGuardianAtlas(boss,.02,{x:NaN}));assert.throws(()=>advanceGuardianAtlas(boss,.02,player,null));
  assert.deepEqual(boss,before);
  for(const damage of [0,-1,NaN,Infinity])assert.throws(()=>hitGuardianAtlas(boss,damage));
  assert.throws(()=>hitGuardianAtlas(boss,1,{x:NaN,y:0}));assert.throws(()=>createGuardianAtlas({width:100}));
  assert.throws(()=>createGuardianAtlas({height:500}));assert.throws(()=>createGuardianAtlas({playerY:100}));
  assert.ok(createGuardianAtlas({playerY:200}).targetY>=64);
});

test('encounter owns no scheduler, browser clock, random global or save operation',async()=>{
  const source=await readFile(new URL('../src/game/combat/guardian-atlas.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|Math\.random|localStorage/);
});
