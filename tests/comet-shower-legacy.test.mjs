import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as shower from '../src/game/progression/comet-shower.js';

const [collisionSource,updateSource,runtimeSource]=await Promise.all([
  readFile(new URL('../src/game/04-entities-collision-damage.js',import.meta.url),'utf8'),
  readFile(new URL('../src/game/05-corridor-update.js',import.meta.url),'utf8'),
  readFile(new URL('../src/game/01-runtime-assets.js',import.meta.url),'utf8')
]);
const outlineSource=runtimeSource.match(/const SHIP_COLLISION_OUTLINE = \[[\s\S]*?\n  \];/)[0];

function fixture() {
  const sandbox=vm.createContext({Math,NeonCampaign:shower,W:720,H:1280,
    clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),
    player:{x:360,y:900,target:360,targetY:900,drift:0,w:208,h:240},
    isThreat:item=>['meteor','scout','satellite','debris'].includes(item.type),
    classicCometShower:shower.createCometShower(),items:[],gates:[],
    state:'playing',level:()=>({speed:1,hazard:'wave',gate:0,spawn:1000}),
    stars:[],spaceDust:[],foregroundParticles:[],visualSpeed:1,cameraKickX:0,cameraKickY:0,
    elapsed:0,manualShotCooldown:0,levelOneShockwave:0,impactReactionTimer:0,
    settings:{sensitivity:50,effects:false},classicFlight:null,
    warpTimer:0,encounterDirector:null,spawnTimer:999,currentLevel:0,atlasBoss:null,
    comboTimer:0,hull:100,powers:{tractor:0,shield:0,slow:0,phaser:0},shake:0,flash:0,stormPulse:0,
    tractorTarget:null,classicFlightView:null,
    isUnifiedClassic:()=>false,
    updateHudVisual:()=>{},updateLevelStory:()=>{},engineTrail:()=>{},
    updatePowerHud:()=>{},advanceClassicWeaponField:()=>{},hideWarning:()=>{},
    interceptClassicProjectile:()=>false,checkSupplyFailure:()=>{},hud:()=>{},
    parts:[],shots:[],rings:[],explosions:[],impactEffects:[],
    spawnClassicScrap:()=>{},collectClassicScrap:()=>true
  });
  vm.runInContext(outlineSource,sandbox);
  vm.runInContext(collisionSource,sandbox);
  vm.runInContext(updateSource,sandbox);
  // Run the actual loop/collision code but avoid irrelevant presentation and
  // persistence dependencies in this deterministic integration fixture.
  sandbox.engineTrail=()=>{};sandbox.checkSupplyFailure=()=>{};
  return sandbox;
}

function comet(patch={}) {
  return {id:'fixture-comet',type:'meteor',flightComet:true,showerComet:true,
    showerVersion:shower.COMET_SHOWER_VERSION,showerWidth:720,showerHeight:1280,
    x:300,y:300,vx:500,vy:700,ax:20,ay:12,r:18,s:700,life:3,hp:2,maxHp:2,
    special:'comet',rot:0,rs:0,p:0,phase:0,amp:999,baseX:20,alpha:1,...patch};
}

test('the legacy update integrates a curved comet once and never overwrites its X with wave offsets',()=>{
  const game=fixture(),item=comet();game.items.push(item);
  game.update(.02);
  assert.equal(game.items.length,1);
  assert.ok(Math.abs(item.x-310.004)<1e-8);
  assert.ok(Math.abs(item.y-314.0024)<1e-8);
  assert.equal(item.previousX,300);assert.equal(item.previousY,300);
  assert.equal(item.alpha,1);
});

test('overtaking from below remains alive while crossing into the field and retires at its actual upper exit',()=>{
  const game=fixture(),item=comet({x:540,y:1376,vx:0,vy:-900,ax:0,ay:-12,s:-900});
  game.items.push(item);game.classicCometShower.active.push({item});
  game.update(.02);
  assert.equal(game.items.length,1,'generic downward offscreen test must not remove an incoming overtaker');
  assert.ok(item.y>1280 && item.y<1376);
  item.y=-127;game.update(.02);
  assert.equal(game.items.length,0);
  assert.equal(game.classicCometShower.active.length,0);
});

test('interception and physical contact both release active shower references',()=>{
  for(const contact of [false,true]) {
    const game=fixture(),item=comet();game.items.push(item);
    game.classicCometShower.active.push({item});
    game.interceptClassicProjectile=()=>!contact;
    game.hit=()=>contact;game.collectItem=()=>true;
    game.update(.02);
    assert.equal(game.items.length,0);
    assert.equal(game.classicCometShower.active.length,0);
  }
});

test('fast nuclei and enemy projectiles sweep across the original nose instead of tunnelling',()=>{
  const game=fixture();
  for(const flag of ['showerComet','classicScoutProjectile','guardianProjectile']) {
    const item={type:'meteor',special:'comet',x:382.5,y:740,previousX:335,previousY:740,r:18,rot:0,[flag]:true};
    assert.equal(game.circleHitsShip(22.5,-160,18*.94),false,'end point alone misses');
    assert.equal(game.circleHitsShip(-25,-160,18*.94),false,'start point alone misses');
    assert.equal(game.hit(item),true,`${flag} crosses the nose between frames`);
  }
  assert.equal(game.hit({type:'meteor',special:'comet',x:382.5,y:740,previousX:335,previousY:740,r:18,rot:0}),false,
    'ordinary stationary collision contract remains unchanged');
});

test('swept collision keeps empty space outside the sloping hull clear and accounts for ship translation',()=>{
  const game=fixture();
  assert.equal(game.sweptCircleHitsShip(100,-145,100,-105,3),false);
  assert.equal(game.sweptCircleHitsShip(-180,-145,-150,-105,3),false);
  const item={type:'meteor',classicScoutProjectile:true,x:360,y:740,previousX:360,previousY:740,r:18,rot:0};
  game.player.previousCollisionX=335;game.player.previousCollisionY=900;
  game.player.x=382.5;
  assert.equal(game.hit(item),true,'relative translation uses the same swept polygon');
});

test('paused gameplay moves neither comets nor salvage and leaves their lifetime untouched',()=>{
  const game=fixture(),item=comet(),pickup={type:'salvage',salvagePickup:true,x:400,y:800,life:14,r:18};
  game.items.push(item,pickup);game.state='paused';
  const before=JSON.stringify(game.items);
  for(let index=0;index<30;index++)game.update(.05);
  assert.equal(JSON.stringify(game.items),before);
});

test('scrap dispatches to its collector and a storage rejection keeps the physical pickup',()=>{
  const game=fixture(),pickup={type:'salvage',salvagePickup:true,x:360,y:900,life:.03,r:18,alpha:1};
  let collected=0;game.collectClassicScrap=()=>{collected++;return false;};
  assert.equal(game.collectItem(pickup),false);assert.equal(collected,1);
  game.items.push(pickup);game.update(.02);
  assert.equal(collected,2);assert.equal(game.items.length,1);
  assert.ok(pickup.life>=2,'durable storage can be retried before the pickup expires');
});

test('machines without an animator still drop scrap through the shared destruction hook',()=>{
  const game=fixture(),calls=[],target={type:'satellite',id:'machine'};
  game.spawnClassicScrap=item=>calls.push(item);
  game.animateScoutHit(target,false);assert.equal(calls.length,0);
  game.animateScoutHit(target,true);assert.equal(calls.length,1);
  assert.equal(calls[0],target);
});

test('ordinary scrap drifts before close-range attraction and only physical collection awards it',()=>{
  const game=fixture(),pickup={type:'salvage',salvagePickup:true,x:500,y:400,r:18,s:65,life:14};
  let credits=0;game.collectClassicScrap=()=>{credits++;return true;};
  assert.equal(game.advanceClassicSalvagePickup(pickup,.02),true);
  assert.equal(pickup.x,500);assert.ok(pickup.y>400);assert.equal(credits,0);
  pickup.x=450;pickup.y=850;
  const before=Math.hypot(pickup.x-360,pickup.y-900);
  game.advanceClassicSalvagePickup(pickup,.02);
  assert.ok(Math.hypot(pickup.x-360,pickup.y-900)<before);assert.equal(credits,0);
  pickup.x=360;pickup.y=900;game.items.push(pickup);game.update(.02);
  assert.equal(credits,1);assert.equal(game.items.length,0);
});

test('the boss recovery tractor reaches the hull before its 1.55 second resolution without auto-credit',()=>{
  const game=fixture(),pickup={type:'salvage',salvagePickup:true,bossSalvage:true,x:120,y:300,r:18,life:4};
  let credits=0;game.collectClassicScrap=()=>{credits++;return true;};
  game.items.push(pickup);
  let seconds=0;
  while(game.items.length && seconds<1.55){game.update(.02);seconds+=.02;}
  assert.ok(seconds<1.55);assert.equal(credits,1);assert.equal(game.items.length,0);
});
