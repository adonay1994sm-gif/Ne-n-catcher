import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const [runtime,collision]=await Promise.all([
  readFile(new URL('../src/game/01-runtime-assets.js',import.meta.url),'utf8'),
  readFile(new URL('../src/game/04-entities-collision-damage.js',import.meta.url),'utf8')
]);
const start=runtime.indexOf('  const SHIP_COLLISION_OUTLINE =');
const end=runtime.indexOf('  const SHIP_COLLISION_HALF_WIDTH =',start);
assert.ok(start>=0&&end>start,'Use the real outline and its actual campaign transforms');
function fixture(campaign='classic') {
  const context=vm.createContext({Math,N7_CAMPAIGN:campaign==='n7',JOURNEY_DEMO:campaign==='journey',
    SHIP_VISUAL:{classicScale:campaign==='classic'?.4:1},player:{x:360,y:800},
    isThreat:()=>true,clamp:(value,min,max)=>Math.max(min,Math.min(max,value))});
  vm.runInContext(runtime.slice(start,end)+'\nglobalThis.outline=SHIP_COLLISION_OUTLINE;',context);
  vm.runInContext(collision,context);
  return context;
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('the classic nose, wings and tail collide on visible material without an enlarged invisible envelope',()=>{
  const game=fixture();
  for(const [x,y,r,label]of [[0,-44,2,'nose'],[36,8,2,'right wing'],[-36,8,2,'left wing'],[0,27,2,'aft hull']])
    assert.equal(game.circleHitsShip(x,y,r),true,`${label} must remain tangible`);
  for(const [x,y,r,label]of [[0,-53,2,'space ahead of the nose'],[43,8,1,'space outside right wing'],[-43,8,1,'space outside left wing'],[0,35,2,'space behind metal hull']])
    assert.equal(game.circleHitsShip(x,y,r),false,`${label} must not cause an invisible hit`);
});

test('fast hostile projectiles sweep across the smaller physical nose while a parallel near miss stays clear',()=>{
  const game=fixture();
  const projectile={type:'meteor',classicScoutProjectile:true,rot:0,r:2,
    x:390,y:754,previousX:330,previousY:754};
  assert.equal(game.circleHitsShip(-30,-46,1.88),false);
  assert.equal(game.circleHitsShip(30,-46,1.88),false);
  assert.equal(game.hit(projectile),true,'movement across the nose is a real contact');
  assert.equal(game.hit({...projectile,y:746,previousY:746}),false,'passing above the nose stays clear');
});

test('the unchanged original contact envelope remains available in both archived campaigns',()=>{
  const n7=fixture('n7'),journey=fixture('journey');
  assert.deepEqual(plain(n7.outline),plain(journey.outline));
  assert.equal(n7.outline.length,30);
  assert.deepEqual(plain(n7.outline[0]),[0,-148]);
  assert.ok(n7.outline.some(([x,y])=>x===109&&y===20));
  for(const game of [n7,journey]) {
    assert.equal(game.circleHitsShip(0,-130,2),true);
    assert.equal(game.circleHitsShip(100,20,2),true);
    assert.equal(game.circleHitsShip(0,85,2),true);
    assert.equal(game.circleHitsShip(120,20,2),false);
  }
});
