import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {resolveHullReinforcement} from '../src/game/combat/hull-reinforcement.js';
const source=readFileSync(new URL('../src/game/04-entities-collision-damage.js',import.meta.url),'utf8');

test('actual collision dispatch preserves the three guardian damage tiers and the patrol Phaser table',()=>{
  const collisions=[];
  const context=vm.createContext({isThreat:()=>true,hud(){},
    player:{x:360,y:900},hull:100,classicHullReserve:0,classicHullReserveCapacity:30,
    state:'playing',NeonCampaign:{resolveHullReinforcement}});
  vm.runInContext(source,context);
  context.damageShip=(amount,x,y,details)=>collisions.push(resolveHullReinforcement({
    hull:100,reserve:0,capacity:30,amount,...details}));
  for(const amount of [13,15,22])context.collectItem({type:'meteor',guardianProjectile:true,damage:amount,x:20,y:30});
  assert.deepEqual(collisions.map(result=>result.hullDamage),[13,15,22]);
  collisions.length=0;
  for(const amount of [13,20])context.collectItem({type:'meteor',classicScoutProjectile:true,damage:amount,x:20,y:30});
  assert.deepEqual(collisions.map(result=>result.hullDamage),[10,15]);
});
