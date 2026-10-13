import test from 'node:test';
import assert from 'node:assert/strict';
import {EngineCore} from '../src/engine/EngineCore.js';
import {Renderer} from '../src/engine/Renderer.js';
import {ParticleSystem} from '../src/engine/ParticleSystem.js';
import {createCampaignAdapter} from '../src/engine/CampaignAdapter.js';

function fixture(){
 const frames=new Map(),cancelled=[],calls=[];let next=0;
 const raf=cb=>{const id=++next;frames.set(id,cb);return id;};
 const cancel=id=>{cancelled.push(id);frames.delete(id);};
 const ctx={setTransform:(...a)=>calls.push(['transform',...a]),clearRect:()=>{},save:()=>{},restore:()=>{},translate:()=>{},fillRect:()=>{}};
 const canvas={width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({left:10,top:20,width:360,height:640})};
 const renderer=new Renderer(canvas,{dprProvider:()=>2});
 const engine=new EngineCore({renderer,particles:new ParticleSystem(),requestFrame:raf,cancelFrame:cancel});
 const tick=(id,now)=>{const cb=frames.get(id);frames.delete(id);cb(now);};
 return {frames,cancelled,calls,raf,cancel,ctx,canvas,renderer,engine,tick};
}
test('01 default particle capacity',()=>assert.equal(new ParticleSystem().capacity,320));
test('02 pool allocated once',()=>{const p=new ParticleSystem();assert.equal(p.pool.length,320);assert.equal(new Set(p.pool).size,320);});
test('03 emit increases count',()=>{const p=new ParticleSystem();assert.equal(p.emit(),true);assert.equal(p.activeCount,1);});
test('04 pool saturation rejects',()=>{const p=new ParticleSystem({capacity:1});p.emit();assert.equal(p.emit(),false);});
test('05 pool reuse',()=>{const p=new ParticleSystem({capacity:1});const slot=p.pool[0];p.emit({life:.01});p.update(.02);p.emit();assert.equal(p.pool[0],slot);});
test('06 invalid emit rejected',()=>assert.equal(new ParticleSystem().emit({life:-1}),false));
test('07 burst bounded',()=>{const p=new ParticleSystem({capacity:4});p.burst(0,0,{count:10});assert.equal(p.activeCount,4);});
test('08 clear resets',()=>{const p=new ParticleSystem();p.emit();p.clear();assert.equal(p.activeCount,0);});
test('09 draw balanced',()=>{const f=fixture();f.engine.particles.emit();f.engine.particles.draw(f.ctx);});
test('10 invalid capacity rejected',()=>assert.throws(()=>new ParticleSystem({capacity:0}),RangeError));
test('11 retina backing dimensions',()=>{const f=fixture();assert.deepEqual([f.canvas.width,f.canvas.height],[1440,2560]);});
test('12 logical dimensions preserved',()=>{const f=fixture();assert.deepEqual([f.renderer.width,f.renderer.height],[720,1280]);});
test('13 pointer mapping',()=>{const f=fixture();assert.deepEqual(f.renderer.point(190,340),{x:360,y:640});});
test('14 zero-size resize ignored',()=>{const f=fixture();f.canvas.getBoundingClientRect=()=>({width:0,height:0});assert.equal(f.renderer.resize(),false);});
test('15 beginFrame sets DPR transform',()=>{const f=fixture();f.renderer.beginFrame();f.renderer.endFrame();assert.ok(f.calls.some(c=>c[0]==='transform'&&c[1]===2));});
test('16 shake expires',()=>{const f=fixture();f.renderer.shakeScreen(6,.1);f.renderer.update(.2);assert.equal(f.renderer.shake,0);});
test('17 start schedules exactly one frame',()=>{const f=fixture();assert.equal(f.engine.start(),true);assert.equal(f.frames.size,1);});
test('18 repeated start idempotent',()=>{const f=fixture();f.engine.start();assert.equal(f.engine.start(),false);assert.equal(f.frames.size,1);});
test('19 stop cancels RAF',()=>{const f=fixture();f.engine.start();f.engine.stop();assert.equal(f.frames.size,0);assert.equal(f.cancelled.length,1);});
test('20 stopped stale callback ignored',()=>{const f=fixture();f.engine.start();const cb=[...f.frames.values()][0];f.engine.stop();cb(10);assert.equal(f.frames.size,0);});
test('21 pause cancels RAF',()=>{const f=fixture();f.engine.start();assert.equal(f.engine.pause(),true);assert.equal(f.frames.size,0);});
test('22 resume schedules once',()=>{const f=fixture();f.engine.start();f.engine.pause();assert.equal(f.engine.resume(),true);assert.equal(f.frames.size,1);});
test('23 paused stale callback ignored',()=>{const f=fixture();f.engine.start();const cb=[...f.frames.values()][0];f.engine.pause();cb(20);assert.equal(f.frames.size,0);});
test('24 resume resets delta',()=>{const f=fixture();const d=[];f.engine.updateGame=dt=>d.push(dt);f.engine.start();f.tick([...f.frames.keys()][0],100);f.engine.pause();f.engine.resume();f.tick([...f.frames.keys()][0],100000);assert.equal(d.at(-1),0);});
test('25 update failure stops engine',()=>{const f=fixture();f.engine.updateGame=()=>{throw Error('boom')};f.engine.start();assert.throws(()=>f.tick([...f.frames.keys()][0],1),/boom/);assert.equal(f.engine.running,false);});
test('26 adapter rejects missing handoff',()=>assert.throws(()=>createCampaignAdapter({}),TypeError));
test('27 adapter synchronous handoff and cleanup',()=>{const f=fixture();let stops=0,started=0,ended=0;const a=createCampaignAdapter({renderer:f.renderer,particles:f.engine.particles,requestFrame:f.raf,cancelFrame:f.cancel,updateLevel:()=>{},drawBackground:()=>{},drawEntities:()=>{},stopLegacyLoop:()=>{stops++;return true;},restartLegacyLoop:()=>true,useEngineV1:true,onStart:()=>started++,onStop:()=>ended++});assert.equal(a.start(),true);assert.equal(a.start(),false);assert.equal(stops,1);assert.equal(a.stop(),true);assert.equal(ended,1);assert.equal(started,1);assert.equal(f.frames.size,0);});

test('28 disabled adapter does not stop legacy or allocate core',()=>{
 const f=fixture();let stops=0;
 const a=createCampaignAdapter({renderer:f.renderer,updateLevel:()=>{},drawBackground:()=>{},drawEntities:()=>{},stopLegacyLoop:()=>{stops++;return true;}});
 assert.equal(a.enabled,false);assert.equal(a.start(),false);assert.equal(stops,0);assert.equal(a.core,null);
});
test('29 experimental start failure restarts legacy exactly once',()=>{
 const f=fixture();let stops=0,restarts=0;
 const a=createCampaignAdapter({
  renderer:f.renderer,requestFrame:()=>{throw new Error('RAF unavailable');},
  cancelFrame:f.cancel,updateLevel:()=>{},drawBackground:()=>{},drawEntities:()=>{},
  stopLegacyLoop:()=>{stops++;return true;},restartLegacyLoop:()=>{restarts++;return true;},
  useEngineV1:true
 });
 const originalError=console.error;console.error=()=>{};
 try{assert.throws(()=>a.start(),/RAF unavailable/);}finally{console.error=originalError;}
 assert.equal(stops,1);assert.equal(restarts,1);assert.equal(a.running,false);
});
