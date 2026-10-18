import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolveHullReinforcement,HULL_REINFORCEMENT_RULES} from '../src/game/combat/hull-reinforcement.js';
import {resolveDamage} from '../src/core/damage-service.js';

const damage=(request={})=>resolveHullReinforcement({hull:100,reserve:30,amount:10,...request});

test('reserve adds thirty points without replacing or inflating the one-hundred-point hull',()=>{
  const hit=damage();assert.equal(hit.hull,100);assert.equal(hit.reserve,20);
  assert.equal(hit.reserveDamage,10);assert.equal(hit.hullDamage,0);assert.equal(hit.absorbed,true);
  assert.equal(HULL_REINFORCEMENT_RULES.maxHull,100);assert.equal(HULL_REINFORCEMENT_RULES.baseCapacity,30);
  const input=Object.freeze({hull:100,reserve:30,amount:40});
  const overflow=resolveHullReinforcement(input);
  assert.equal(overflow.hull,90);assert.equal(overflow.reserve,0);assert.equal(overflow.shieldBroken,true);
  assert.equal(overflow.reserveDamage+overflow.hullDamage,40);
  assert.deepEqual(input,{hull:100,reserve:30,amount:40});
});

test('normal and heavy hostile phasers take ten and fifteen points with exact overflow',()=>{
  const normal=damage({kind:'phaser',amount:99});assert.equal(normal.reserve,20);assert.equal(normal.hull,100);
  const heavy=damage({reserve:7,kind:'heavyPhaser',amount:99});
  assert.equal(heavy.reserve,0);assert.equal(heavy.hull,92);assert.equal(heavy.reserveDamage,7);assert.equal(heavy.hullDamage,8);
  const empty=damage({reserve:0,kind:'phaser'});assert.equal(empty.hull,90);
  const zero=damage({amount:0,kind:'heavyPhaser'});assert.equal(zero.reserve,30);assert.equal(zero.hull,100);
});

test('the C9 capacity accepts forty-five points and damage never grants a free refill',()=>{
  const reinforced=damage({reserve:45,capacity:45,amount:40});assert.equal(reinforced.reserve,5);assert.equal(reinforced.hull,100);
  const partial=damage({reserve:7,capacity:45,amount:1});assert.equal(partial.reserve,6);
  const empty=damage({reserve:0,capacity:45,amount:10});assert.equal(empty.reserve,0);assert.equal(empty.hull,90);
});

test('large asteroids shatter all remaining reserve and deal twenty protected or thirty-eight bare hull damage',()=>{
  for(const reserve of [1,7,30]){
    const result=damage({reserve,largeAsteroid:true,amount:42});
    assert.equal(result.reserve,0);assert.equal(result.reserveDamage,reserve);assert.equal(result.hull,80);
    assert.equal(result.requestedHullDamage,20);assert.equal(result.shieldBroken,true);
  }
  assert.equal(damage({reserve:0,kind:'largeAsteroid',amount:34}).hull,62);
  const zero=damage({largeAsteroid:true,amount:0});assert.equal(zero.hull,100);assert.equal(zero.reserve,30);
  const fatal=damage({hull:12,reserve:30,largeAsteroid:true});
  assert.equal(fatal.hull,0);assert.equal(fatal.hullDamage,12);assert.equal(fatal.requestedHullDamage,20);assert.equal(fatal.destroyed,true);
});

test('invalid damage cannot silently normalize a malformed hull or grant reserve',()=>{
  for(const invalid of [{hull:-1},{hull:101},{hull:NaN},{reserve:-1},{reserve:31},{capacity:35},
    {amount:-1},{amount:Infinity},{amount:'10'},{kind:'unknown'},{largeAsteroid:1}])assert.throws(()=>damage(invalid));
  const fatal=damage({amount:1000});assert.equal(fatal.hull,0);assert.equal(fatal.reserve,0);assert.equal(fatal.destroyed,true);
  const source=readFileSync(new URL('../src/game/combat/hull-reinforcement.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/requestAnimationFrame|setInterval|setTimeout|Date\.now|localStorage|window\./);
});

function runtime(classic){
  const source=readFileSync(new URL('../src/game/04-entities-collision-damage.js',import.meta.url),'utf8');
  const start=source.indexOf('  function activatePower('),end=source.indexOf('  function collectItem(',start);
  const calls={hud:0};const no=()=>{};
  const sandbox=vm.createContext({hull:100,classicHullReserve:30,classicHullReserveCapacity:30,
    player:{x:360,y:1000},state:'playing',powers:{shield:0},score:0,classicShieldAge:0,classicShieldImpact:0,
    NeonCore:{resolveDamage},NeonCampaign:{resolveHullReinforcement},isUnifiedClassic:()=>classic,
    burst:no,pulseRing:no,addImpactEffect:no,tone:no,vibrate:no,toast:no,ensureSprite:no,updatePowerHud:no,
    hud:()=>{calls.hud++;},SPRITES:{forceShieldAtlas:{}},window:{},currentLevel:0,
    impactReactionTimer:0,impactReactionSide:0,damageSmokeLocked:false,damageSmokeSide:0,
    combo:3,comboTimer:2,shake:0,flash:0});
  vm.runInContext(source.slice(start,end),sandbox);
  return{sandbox,calls};
}

test('actual classic damage ignores a timed legacy shield and consumes reserve before hull',()=>{
  const {sandbox:s,calls}=runtime(true);s.powers.shield=100;
  s.damageShip(35,380,1000);assert.equal(s.classicHullReserve,0);assert.equal(s.hull,95);
  assert.equal(s.score,0);assert.equal(s.combo,1);assert.equal(calls.hud,1);
});

test('actual legacy campaign damage retains its historical timed-shield protection and reward',()=>{
  const {sandbox:s}=runtime(false);s.powers.shield=7;
  s.damageShip(35,380,1000);assert.equal(s.hull,100);assert.equal(s.classicHullReserve,30);
  assert.equal(s.powers.shield,7);assert.equal(s.score,10);
});

test('actual classic shield pickup restores persistent reserve with no timer while legacy still uses seven seconds',()=>{
  const item={x:360,y:900};
  const classic=runtime(true).sandbox;classic.classicHullReserve=3;classic.classicHullReserveCapacity=45;
  classic.activatePower('shield',item);assert.equal(classic.classicHullReserve,45);assert.equal(classic.powers.shield,0);
  const legacy=runtime(false).sandbox;legacy.activatePower('shield',item);
  assert.equal(legacy.powers.shield,7);assert.equal(legacy.classicHullReserve,30);
});
