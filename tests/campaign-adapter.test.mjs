import test from 'node:test';
import assert from 'node:assert/strict';
import {createCampaignAdapter} from '../js/engine/CampaignAdapter.js';

function fixture(overrides={}){
  const events=[];
  let next=1;
  const pending=new Map();
  const cancelled=[];
  const originalRequest=globalThis.requestAnimationFrame;
  const originalCancel=globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame=callback=>{const id=next++;pending.set(id,callback);events.push('engine:request');return id;};
  globalThis.cancelAnimationFrame=id=>{cancelled.push(id);pending.delete(id);events.push('engine:cancel');};
  const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){}};
  const canvas={width:720,height:1280,getContext:()=>ctx,getBoundingClientRect:()=>({width:360,height:640,left:0,top:0})};
  const adapter=createCampaignAdapter({
    canvas,
    updateLevel:()=>{},drawBackground:()=>{},drawEntities:()=>{},
    stopLegacyLoop:()=>{events.push('legacy:stop');return 42;},
    cancelLegacyFrame:id=>{events.push('legacy:cancel:'+id);},
    ...overrides
  });
  return {adapter,events,pending,cancelled,restore(){globalThis.requestAnimationFrame=originalRequest;globalThis.cancelAnimationFrame=originalCancel;}};
}
test('stops legacy scheduling and cancels its RAF before new RAF starts',()=>{
  const f=fixture();
  try{
    f.adapter.start();
    assert.deepEqual(f.events.slice(0,3),['legacy:stop','legacy:cancel:42','engine:request']);
    assert.equal(f.adapter.running,true);
    assert.equal(f.pending.size,1);
  }finally{f.adapter.stop();f.restore();}
});
test('repeated start does not schedule a second RAF',()=>{
  const f=fixture();
  try{
    f.adapter.start();f.adapter.start();
    assert.equal(f.events.filter(e=>e==='legacy:stop').length,1);
    assert.equal(f.events.filter(e=>e==='engine:request').length,1);
    assert.equal(f.pending.size,1);
  }finally{f.adapter.stop();f.restore();}
});
test('stop cancels engine RAF and is idempotent',()=>{
  const f=fixture();
  try{
    f.adapter.start();f.adapter.stop();f.adapter.stop();
    assert.equal(f.adapter.running,false);
    assert.equal(f.pending.size,0);
    assert.equal(f.cancelled.length,1);
  }finally{f.restore();}
});
test('invalid legacy RAF ID blocks engine startup',()=>{
  const f=fixture({stopLegacyLoop:()=>-1});
  try{
    assert.throws(()=>f.adapter.start(),/valid RAF ID/);
    assert.equal(f.adapter.running,false);
    assert.equal(f.pending.size,0);
  }finally{f.restore();}
});
test('async legacy stop blocks engine startup',()=>{
  const f=fixture({stopLegacyLoop:()=>Promise.resolve(42)});
  try{
    assert.throws(()=>f.adapter.start(),/synchronous/);
    assert.equal(f.adapter.running,false);
    assert.equal(f.pending.size,0);
  }finally{f.restore();}
});
test('legacy cancellation failure blocks engine startup',()=>{
  const f=fixture({cancelLegacyFrame:()=>{throw new Error('legacy cancellation failed');}});
  try{
    assert.throws(()=>f.adapter.start(),/legacy cancellation failed/);
    assert.equal(f.adapter.running,false);
    assert.equal(f.pending.size,0);
  }finally{f.restore();}
});
