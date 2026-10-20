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
assert.ok(start>=0&&end>start,'Use the real outline and its actual classic transform');
function fixture() {
  const context=vm.createContext({Math,
    SHIP_VISUAL:{classicScale:.52},player:{x:360,y:800},
    isThreat:()=>true,clamp:(value,min,max)=>Math.max(min,Math.min(max,value))});
  vm.runInContext(runtime.slice(start,end)+'\nglobalThis.outline=SHIP_COLLISION_OUTLINE;',context);
  vm.runInContext(collision,context);
  return context;
}

test('the classic nose, wings and tail collide on visible material without an enlarged invisible envelope',()=>{
  const game=fixture();
  for(const [x,y,r,label]of [[0,-57.2,2,'nose'],[46.8,10.4,2,'right wing'],[-46.8,10.4,2,'left wing'],[0,35.1,2,'aft hull']])
    assert.equal(game.circleHitsShip(x,y,r),true,`${label} must remain tangible`);
  for(const [x,y,r,label]of [[0,-68.9,2,'space ahead of the nose'],[55.9,10.4,1,'space outside right wing'],[-55.9,10.4,1,'space outside left wing'],[0,45.5,2,'space behind metal hull']])
    assert.equal(game.circleHitsShip(x,y,r),false,`${label} must not cause an invisible hit`);
});

test('fast hostile projectiles sweep across the smaller physical nose while a parallel near miss stays clear',()=>{
  const game=fixture();
  const projectile={type:'meteor',classicScoutProjectile:true,rot:0,r:2,
    x:399,y:740.2,previousX:321,previousY:740.2};
  assert.equal(game.circleHitsShip(-39,-59.8,1.88),false);
  assert.equal(game.circleHitsShip(39,-59.8,1.88),false);
  assert.equal(game.hit(projectile),true,'movement across the nose is a real contact');
  assert.equal(game.hit({...projectile,y:730,previousY:730}),false,'passing above the nose stays clear');
});
