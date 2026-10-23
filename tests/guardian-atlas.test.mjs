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
// Furia al 30 % de vida (spec §6.11, plan F3c): deja 28 de 96.
const fury=boss=>hitGuardianAtlas(boss,boss.maxHp-Math.floor(boss.maxHp*R.furyAt));

// The owner now requests a 30% enlargement relative to the forty-percent ship.
// Keep a deliberately conservative complete outline for escape checks. These
// values do not change the actual collision geometry owned by integration.
const HULL={half:47.6*1.3,top:63.2*1.3,bottom:41.6*1.3};

test('entry arrives closed, identifies the falsified ID and exposes no free initial damage',()=>{
  const boss=createGuardianAtlas(),initial=boss.y;
  assert.equal(boss.version,'guardian-atlas-v9');assert.equal(boss.hp,96);
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
      expose(boss);state==='disabled'?hitGuardianAtlas(boss,1000):fury(boss);
    }else until(boss,b=>b.state===state);
    const before=structuredClone(boss);let calls=0;
    for(let n=0;n<50;n++)assert.deepEqual(advanceGuardianAtlas(boss,0,{x:119,y:900},()=>calls++),[]);
    assert.deepEqual(boss,before);assert.equal(calls,0);
  }
});

test('basic twin cannons deploy briefly and aim stays locked despite later pilot input',()=>{
  const boss=ready(),events=until(boss,b=>b.state==='charge',{x:170,y:1145});
  const deploy=events.find(e=>e.type==='warning');
  assert.equal(deploy.kind,'mechanicalDeployment');assert.equal(deploy.attackTier,'basic');
  assert.equal(deploy.safeGap,null);assert.ok(deploy.seconds>=.3&&deploy.seconds<.4);
  const fire=until(boss,b=>b.state==='fire',{x:601,y:1145});
  const shots=fire.filter(e=>e.type==='projectile').map(e=>e.projectile);
  assert.equal(shots.length,2);
  const crossing=shot=>shot.x+shot.vx*((shot.targetY-shot.y)/shot.vy);
  assert.ok(shots.every(shot=>shot.vy>0&&Math.abs(crossing(shot)-170)<60),'the twin pair straddles the observed lane');
  const copy=structuredClone(shots);runFor(boss,1,{x:119,y:800},fire);
  assert.deepEqual(shots,copy,'No projectile can home on a later sample');
});

// Spec §6.11: tres ataques habituales (cañones gemelos, abanico abierto y drones).
test('Atlas teaches twin cannons, open fan and drones',()=>{
  const boss=ready(),events=[];
  until(boss,b=>b.phaseAttacks>=3&&b.state==='exposed',player,events);
  const deployments=events.filter(e=>e.type==='warning');
  assert.deepEqual(deployments.map(e=>e.attackTier),['basic','medium','superpower']);
  assert.deepEqual(deployments.map(e=>e.pattern),['twinCannons','openFan','droneLaunch']);
  const shotsOf=attack=>events.filter(e=>e.type==='projectile'&&e.projectile.attackId===attack.attackId).map(e=>e.projectile);
  const [basic,medium,superpower]=deployments;
  const twin=shotsOf(basic);
  assert.equal(twin.length,2*R.attacks.basic.volleyTimes.length);
  for(const volley of [0,1])assert.equal(twin.filter(shot=>shot.volley===volley).length,2,'two twin shots per volley');
  const fan=shotsOf(medium),angles=fan.map(shot=>Math.atan2(shot.vx,shot.vy));
  assert.equal(fan.length,7);
  assert.ok(Math.max(...angles)-Math.min(...angles)>=1.3,'the open fan covers at least 1.3 rad');
  assert.equal(shotsOf(superpower).length,0);
  const drones=events.filter(e=>e.type==='drones');
  assert.equal(drones.length,1);assert.equal(drones[0].count,2);assert.equal(drones[0].attackId,superpower.attackId);
  assert.ok([drones[0].x,drones[0].y].every(Number.isFinite));
  for(const shot of [...twin,...fan]){assert.equal(shot.safeGap,null);assert.ok(shot.damage>0);}
  assert.equal(new Set([...twin,...fan].map(shot=>shot.projectileId)).size,twin.length+fan.length);
});

test('a second volley threshold emits exactly once, including paused and long foreground deltas',()=>{
  const boss=ready();until(boss,b=>b.attackTier==='basic'&&b.state==='fire');
  assert.equal(boss.volley,1);
  runFor(boss,R.attacks.basic.volleyTimes[1]-.02);
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
    const boss=ready({height,playerY});if(phase===2){expose(boss);fury(boss);}
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
    assert.equal(shots.length,11);assert.equal(new Set(shots.map(s=>s.projectileId)).size,11);
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

// Spec §6.11: la furia empieza al 30 % de vida, una sola vez, con 4 escoltas.
test('fury starts at 30 % health, once, with four escorts',()=>{
  const boss=expose();
  hitGuardianAtlas(boss,boss.maxHp-30);
  assert.equal(boss.phase,1,'31 % is not fury yet');
  const result=hitGuardianAtlas(boss,2);
  assert.equal(boss.phase,2);assert.equal(boss.state,'phaseBreak');assert.equal(boss.hp,28);
  assert.equal(boss.vulnerability,false);assert.equal(boss.coreExposure,0);
  assert.equal(hitGuardianAtlas(boss,6).reason,'armored');
  assert.equal(result.events.filter(e=>e.type==='phase'&&e.clearProjectiles).length,1);
  assert.deepEqual(result.events.filter(e=>e.type==='fury'),[{type:'fury',escorts:4}]);
  const later=[];until(boss,b=>b.state==='exposed',player,later);
  later.push(...hitGuardianAtlas(boss,6).events);until(boss,b=>b.state==='closed',player,later);
  assert.equal(later.filter(e=>e.type==='fury'||e.type==='phase').length,0,'fury happens once');
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
  fury(boss);assert.equal(boss.state,'phaseBreak');
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
      assert.equal(shots.length>0,volley.attackTier==='basic'||volley.attackTier==='medium');
      for(const s of shots){assert.equal(s.x,volley.x);assert.equal(s.y,volley.y);}
      assert.ok(Math.abs(volley.y-(boss.y+boss.r*.7))<R.motion.maxVerticalSpeed*DT+1e-8);
      assert.ok(Math.abs(volley.x-boss.x)<R.motion.maxSpeed*DT+1e-8);
    }
  }
  const volleys=events.filter(e=>e.type==='volley'&&e.attackTier==='basic');
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

test('follow-up attacks keep the shape of their routine and never build a wall',()=>{
  const boss=ready({seed:17}),events=[];
  until(boss,b=>b.phaseAttacks>=15&&b.state==='exposed',player,events);
  const followups=events.filter(event=>event.type==='warning').slice(3);
  assert.deepEqual([...new Set(followups.map(attack=>attack.attackTier))].sort(),['basic','fulminant','medium','superpower']);
  for(const attack of followups){
    assert.equal(attack.pattern,R.patterns[attack.attackTier]);assert.equal(attack.safeGap,null);
    const shots=events.filter(event=>event.type==='projectile'&&event.projectile.attackId===attack.attackId).map(event=>event.projectile);
    assert.equal(shots.length,{basic:4,medium:7,superpower:0,fulminant:0}[attack.attackTier]);
    assert.ok(shots.length<=R.maxProjectilesPerAttack);
    assert.ok(shots.every(shot=>shot.safeGap===null&&shot.vy>0&&Number.isFinite(shot.vx)));
    assert.equal(attack.maneuver,['superpower','fulminant'].includes(attack.attackTier)?'withdraw':attack.attackTier==='medium'?'flank':'pressure');
  }
});

// Spec §6.11: en furia siempre encadena dos ataques y el Fulminante sale cada 2–3.
test('in fury every attack chains two and the Fulminante comes every 2–3 attacks',()=>{
  for(const seed of [17,507,9001]){
    const boss=expose(ready({seed}));fury(boss);
    const events=[];until(boss,b=>b.phaseAttacks>=14&&b.state==='exposed',player,events);
    const order=events.filter(event=>event.type==='warning'||event.type==='opening');
    let run=0;
    for(const event of order){
      if(event.type==='warning')run++;
      else{assert.equal(run,2,`${seed}: two attacks before every opening`);run=0;}
    }
    const tiers=order.filter(event=>event.type==='warning').map(event=>event.attackTier);
    const fulminants=tiers.flatMap((tier,index)=>tier==='fulminant'?[index+1]:[]);
    assert.ok(fulminants.length>=4,`${seed}: ${tiers}`);
    assert.ok(fulminants[0]>=2&&fulminants[0]<=3,`${seed}: first Fulminante at attack ${fulminants[0]}`);
    for(let index=1;index<fulminants.length;index++){
      const gap=fulminants[index]-fulminants[index-1];
      assert.ok(gap===2||gap===3,`${seed}: Fulminante every 2–3 attacks, got ${gap}`);
    }
  }
});

test('fury fans keep every scheduled volley frozen while paused and never retarget',()=>{
  const boss=expose();fury(boss);
  const events=[];until(boss,b=>b.attackTier==='medium'&&b.state==='fire',player,events);
  const attackId=boss.attackId;
  const first=structuredClone(events.filter(event=>event.type==='projectile'&&event.projectile.attackId===attackId).map(event=>event.projectile));
  assert.equal(first.length,7);
  const snapshot=structuredClone(boss);assert.deepEqual(advanceGuardianAtlas(boss,0,{x:130,y:800}),[]);
  assert.deepEqual(boss,snapshot);
  until(boss,b=>b.state==='opening',{x:130,y:800},events);
  const shots=events.filter(event=>event.type==='projectile'&&event.projectile.attackId===attackId).map(event=>event.projectile);
  assert.deepEqual(shots,first,'later pilot input cannot retarget existing ammunition');
});

test('twin cannons and open fans leave a reachable full-hull escape before every core opening',()=>{
  for(const height of [568,1280])for(const targetX of [145,360,575])for(const phase of [1,2]){
    const playerY=height===568?450:height-135,pilot={x:targetX,y:playerY};
    const boss=ready({height,playerY,seed:17});if(phase===2){expose(boss);fury(boss);}
    const events=[];until(boss,b=>b.phaseAttacks>=15&&b.state==='exposed',pilot,events);
    const attacks=events.filter(event=>event.type==='warning'&&['basic','medium'].includes(event.attackTier));
    for(const attack of attacks){
      const shots=events.filter(event=>event.type==='projectile'&&event.projectile.attackId===attack.attackId).map(event=>event.projectile);
      assert.ok(shots.every(shot=>shot.vy>0),'Atlas never fires upwards');
      const candidates=[];for(let x=HULL.half;x<=720-HULL.half;x+=4)candidates.push(x);
      candidates.sort((a,b)=>Math.abs(a-targetX)-Math.abs(b-targetX));
      const escape=candidates.find(x=>shots.every(shot=>[playerY-HULL.top-shot.r,playerY+HULL.bottom+shot.r].every(y=>{
        const crossing=shot.x+shot.vx*((y-shot.y)/shot.vy);return Math.abs(crossing-x)>HULL.half+shot.r+2;
      })));
      assert.notEqual(escape,undefined,`${height}/${targetX}/${phase}/${attack.pattern}: a final guardian must never make a complete wall`);
      const firstContact=Math.min(...shots.map(shot=>(playerY-HULL.top-shot.r-shot.y)/shot.vy));
      assert.ok(Math.abs(escape-targetX)/720<attack.seconds+firstContact,
        `${height}/${targetX}/${phase}/${attack.pattern}: the visible hull can reach the escape before contact`);
    }
  }
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
  const phases=new Set();let nextMissileOpening=-1,beam=null;
  const choose=()=>{
    const candidates=[ship.x,boss.x,HULL.half,720-HULL.half];for(let x=HULL.half;x<=720-HULL.half;x+=20)candidates.push(x);
    const cost=x=>{
      let value=Math.abs(x-boss.x)*.2+Math.abs(x-ship.x)*.025;
      if(beam&&x>=beam.x0-HULL.half&&x<=beam.x1+HULL.half)value+=1000000;
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
      // El Fulminante avisa de su mitad al cargar y la barre al disparar.
      if(event.type==='fulminant')beam={x0:event.x0,x1:event.x1,until:Infinity,damage:0,hit:true};
      if(event.type==='beam')beam={x0:event.x0,x1:event.x1,until:boss.age+event.seconds,damage:event.damage,hit:false};
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
    if(beam&&!beam.hit&&ship.x+HULL.half>=beam.x0&&ship.x-HULL.half<=beam.x1){hull-=beam.damage;beam.hit=true;}
    if(beam&&boss.age>=beam.until)beam=null;
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
  assert.deepEqual(callbacks,events);assert.equal(events.filter(e=>e.type==='projectile').length,2);
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

// Spec §6.11: el Fulminante es un rayo sobre la mitad donde está la nave.
test('the Fulminante beam covers the ship\'s half and leaves the other free',()=>{
  let beams=0;
  for(const targetX of [100,359,360,361,620])for(const phase of [1,2])for(const seed of [17,507,9001]){
    const pilot={x:targetX,y:1145};
    const boss=ready({seed});if(phase===2){expose(boss);fury(boss);}
    const events=[];until(boss,b=>b.phaseAttacks>=12&&b.state==='exposed',pilot,events);
    for(const warning of events.filter(event=>event.type==='warning'&&event.attackTier==='fulminant')){
      beams++;
      const alarm=events.find(event=>event.type==='fulminant'&&event.attackId===warning.attackId);
      const beam=events.find(event=>event.type==='beam'&&event.attackId===warning.attackId);
      assert.ok(alarm&&beam,'alarm and beam');
      assert.deepEqual([alarm.side,alarm.x0,alarm.x1],[beam.side,beam.x0,beam.x1],'the alarm tells the real half');
      assert.ok(beam.x0<=warning.observedX&&warning.observedX<=beam.x1,`${targetX}: the beam covers the ship`);
      assert.ok(beam.x1-beam.x0<=720*.5+1e-9&&beam.x1-beam.x0>=720*.45-1e-9);
      assert.ok(beam.x1<=360+1e-9||beam.x0>=360-1e-9,'the other half stays free');
      assert.equal(beam.damage,26);assert.equal(beam.seconds,1.2);
      assert.ok(warning.seconds>=1,'at least one second of visible charge');
      assert.equal(events.some(event=>event.type==='projectile'&&event.projectile.attackId===warning.attackId),false);
    }
  }
  assert.ok(beams>=30,`Fulminantes actually occur (${beams})`);
});

test('the core never opens while the beam is still burning',()=>{
  const boss=expose(ready({seed:17}));fury(boss);
  const openings=[];let beamEndsAt=null;
  for(let frame=0;frame<120*60&&boss.phaseAttacks<12;frame++)for(const event of advanceGuardianAtlas(boss,DT,player)){
    if(event.type==='beam')beamEndsAt=boss.age+event.seconds;
    if(event.type==='opening'&&beamEndsAt!==null){assert.ok(boss.age>=beamEndsAt-1e-6);openings.push(event);}
  }
  assert.ok(openings.length>0);
});

test('the armour still only opens after attacks, chained in phase one and always two in fury',()=>{
  const boss=ready({seed:17}),events=[];
  until(boss,b=>b.phaseAttacks>=14&&b.state==='exposed',player,events);
  const order=events.filter(event=>event.type==='warning'||event.type==='opening').map(event=>event.type);
  let longest=0,run=0;for(const type of order){run=type==='warning'?run+1:0;longest=Math.max(longest,run);}
  assert.ok(longest>=2,'at least one cycle chains two attacks before the core opens');
  const exposures=events.filter(event=>event.type==='coreExposed');
  assert.ok(exposures.every(event=>event.seconds===R.exposedSeconds)&&R.exposedSeconds<3.8);
  const second=expose(ready({seed:17}));fury(second);
  const later=[];until(second,b=>b.phaseAttacks>=6&&b.state==='exposed',player,later);
  assert.ok(later.filter(event=>event.type==='coreExposed').every(event=>event.seconds===R.exposedPhaseTwoSeconds));
  const phaseTwoOrder=later.filter(event=>event.type==='warning'||event.type==='opening').map(event=>event.type);
  assert.equal(phaseTwoOrder.indexOf('opening')>=2,true,'phase two never opens after a single attack');
});
