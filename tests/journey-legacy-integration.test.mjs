import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const root = new URL('..', import.meta.url);
const [html, core, content, game] = await Promise.all(['index.html','core-runtime.js','content-runtime.js','game.js']
  .map(file => readFile(new URL(file,root),'utf8')));
const key = 'neonCatcher.journeyDemo.v1';

function harness(saved) {
  const dom = new JSDOM(html,{url:'https://neon.test/?campaign=journey',runScripts:'outside-only',pretendToBeVisual:true});
  const {window} = dom;
  const gradient = {addColorStop(){}};
  const ctx = new Proxy({}, {get:(object,name)=>object[name] ?? (name==='createLinearGradient'||name==='createRadialGradient'?()=>gradient:()=>{}),
    set:(object,name,value)=>(object[name]=value,true)});
  window.HTMLCanvasElement.prototype.getContext=()=>ctx;
  window.HTMLCanvasElement.prototype.toDataURL=()=>"data:image/png;base64,";
  window.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:390,height:844});
  const pending=new Map();let next=0;
  window.requestAnimationFrame=callback=>(pending.set(++next,callback),next);
  window.cancelAnimationFrame=id=>pending.delete(id);
  window.Image=class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=640;}set src(value){this.path=value;}};
  window.localStorage.setItem('neon-unlocked-v2','8');
  window.localStorage.setItem('neon-n7-unlocked-v1','37');
  if(saved!==undefined)window.localStorage.setItem(key,saved);
  window.eval(core);window.eval(content);
  const marker='  legacyFrameId = requestAnimationFrame(frame);\n})();';
  window.eval(game.replace(marker,`window.__JOURNEY_TEST__={update,render,pauseGame,resumeGame,startJourney,fireManualShot,
    state:()=>({state,hull,target:player.target,x:player.x,journey:journey?.snapshot(),items:items.map(item=>({type:item.type,x:item.x,y:item.y,border:item.journeyBorder})),ammo})};\n${marker}`));
  return {dom,window,pending,api:window.__JOURNEY_TEST__,close:()=>window.close()};
}

test('journey uses relative pointer movement and pause freezes its route without adding RAF owners',()=>{
  const h=harness();try{
    h.window.document.getElementById('play').click();
    for(let i=0;i<80;i++)h.api.update(1/60);
    const canvas=h.window.document.getElementById('canvas'),before=h.api.state();
    canvas.dispatchEvent(new h.window.MouseEvent('pointerdown',{clientX:290,cancelable:true}));
    assert.equal(h.api.state().target,before.target,'touchdown does not jump');
    canvas.dispatchEvent(new h.window.MouseEvent('pointermove',{clientX:320,cancelable:true}));
    assert.ok(h.api.state().target>before.target);
    h.api.pauseGame();const paused=h.api.state().journey.routeProgress;
    for(let i=0;i<100;i++)h.api.update(1/60);
    assert.equal(h.api.state().journey.routeProgress,paused);
    h.api.resumeGame();h.api.update(1/60);
    assert.ok(h.api.state().journey.routeProgress>paused);
    assert.equal(h.pending.size,1);
  }finally{h.close();}
});

test('the real legacy pipeline can collect, dock, install, continue and resolve the border with isolated saves',()=>{
  const h=harness();try{
    h.window.document.getElementById('play').click();
    let docked=false,installed=false;
    for(let frame=0;frame<6500;frame++){
      const value=h.api.state();
      if(value.state==='complete')break;
      assert.notEqual(value.state,'gameover');
      if(value.journey.phase==='station'){
        docked=true;h.window.document.getElementById('journeyInstall').click();
        installed=h.api.state().journey.engineBoost;
        h.window.document.getElementById('journeyContinue').click();
      }
      const target=value.items.find(item=>item.type==='journeyPart')||value.items.find(item=>item.type==='scout');
      if(target&&Math.abs(value.target-target.x)>25)h.window.dispatchEvent(new h.window.KeyboardEvent('keydown',{key:value.target<target.x?'ArrowRight':'ArrowLeft'}));
      if(!h.window.document.getElementById('journeyShield').disabled)h.window.document.getElementById('journeyShield').click();
      h.api.update(1/60);if(frame%90===0)h.api.render(frame*1000/60);
    }
    assert.equal(docked,true);assert.equal(installed,true);
    const final=h.api.state();assert.equal(final.state,'complete');assert.equal(final.journey.routeProgress,1);
    const saved=JSON.parse(h.window.localStorage.getItem(key));
    assert.equal(saved.checkpointId,'gaia-arrival');assert.equal(saved.credits,120);
    assert.equal(h.window.localStorage.getItem('neon-unlocked-v2'),'8');
    assert.equal(h.window.localStorage.getItem('neon-n7-unlocked-v1'),'37');
    assert.equal(h.pending.size,1);
  }finally{h.close();}
});

test('invalid journey data is backed up before recovery and legacy progress remains untouched',()=>{
  const invalid='{broken journey';const h=harness(invalid);try{
    h.window.document.getElementById('play').click();
    assert.equal(h.api.state().journey.recovery,'invalid-save');
    assert.ok(JSON.parse(h.window.localStorage.getItem(key+':invalid-backups')).includes(invalid));
    assert.equal(JSON.parse(h.window.localStorage.getItem(key)).checkpointId,'chronos-departure');
    assert.equal(h.window.localStorage.getItem('neon-unlocked-v2'),'8');
  }finally{h.close();}
});

test('manual basic fire remains available beyond three shots when automatic fire is disabled',()=>{
  const h=harness();try{
    h.window.document.getElementById('journeyAuto').click();
    assert.equal(h.window.localStorage.getItem('neon-journey-demo-autofire-v1'),'false');
    h.window.document.getElementById('play').click();
    for(let i=0;i<60;i++)h.api.update(1/60);
    for(let shot=0;shot<6;shot++){
      assert.equal(h.api.fireManualShot(),true);
      for(let frame=0;frame<20;frame++)h.api.update(1/60);
    }
    assert.equal(h.api.state().ammo,3,'special/legacy ammo is untouched by the basic weapon');
    assert.equal(h.api.state().state,'playing');
  }finally{h.close();}
});
