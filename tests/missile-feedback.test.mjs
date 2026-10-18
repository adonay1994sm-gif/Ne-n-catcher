import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/game/07-player-item-rendering.js',import.meta.url),'utf8');

// These checks execute the real renderer. They verify that collision evidence
// is presented at its supplied location and cannot be changed by animation.
function harness() {
  const calls=[],stack=[];
  let state={globalAlpha:1,x:0,y:0};
  const ctx=new Proxy({}, {
    get(_target,key) {
      if(key in state)return state[key];
      if(key==='save')return()=>stack.push({...state});
      if(key==='restore')return()=>{assert.ok(stack.length);state=stack.pop();};
      if(key==='translate')return(x,y)=>{state.x+=x;state.y+=y;};
      if(key==='drawImage')return(image,...args)=>calls.push({kind:'image',image,...state,args});
      if(key==='createRadialGradient')return(...args)=>{
        const stops=[];calls.push({kind:'gradient',args,stops});
        return{addColorStop:(...stop)=>stops.push(stop)};
      };
      return(...args)=>calls.push({kind:key,args,...state});
    },
    set(_target,key,value){state[key]=value;return true;}
  });
  const sandbox=vm.createContext({ctx,SPRITES:{
    chapterMissile:{name:'missile',naturalWidth:1024,naturalHeight:1024},
    guardianAtlas:{name:'guardian',naturalWidth:2048,naturalHeight:1024}
  },spriteReady:image=>Boolean(image?.naturalWidth),impactEffects:[],
    atlasBoss:{x:360,y:400,state:'fire',visualSize:350,phase:1,collisionRadius:42},
    NeonCampaign:{guardianAtlasAnimation:()=>({frame:3,previousFrame:null,blend:1})},
    requestAnimationFrame(){throw new Error('Drawing cannot schedule an update');},
    drawAtlasVfx(){throw new Error('No charge or historical fallback expected');}
  });
  vm.runInContext(source.slice(source.indexOf('  const ATLAS_FRAME_PIVOTS'),source.indexOf('  function drawAtlasVfx'))+
    source.slice(source.indexOf('  function drawGuardianAtlas()'),source.indexOf('  // Authored component crops'))+
    source.slice(source.indexOf('  function drawImpactEffects()'),source.indexOf('  function drawCombo()')),sandbox);
  return{sandbox,calls,state:()=>state,stack};
}

test('missile detonation expands visibly from the supplied contact and plays all eight authored blast/debris cells',()=>{
  const h=harness(),sizes=[],alphas=[],crops=[];
  for(const age of [0,.07,.13,.20,.25,.36,.46,.56]) {
    const effect={missileImpact:true,x:301.75,y:472.25,duration:.65,life:.65-age};
    h.sandbox.impactEffects=[effect];
    const before=JSON.stringify(effect);h.sandbox.drawImpactEffects();
    const draw=h.calls.filter(call=>call.kind==='image').at(-1);
    assert.equal(draw.image.name,'missile');
    assert.equal(draw.x,301.75);assert.equal(draw.y,472.25);
    const [sx,sy,sw,sh,dx,dy,width,height]=draw.args;
    assert.deepEqual([sw,sh],[256,256]);
    assert.equal(width,height);assert.equal(dx,-width/2);assert.equal(dy,-height/2);
    crops.push(sy/256*4+sx/256);sizes.push(width);alphas.push(draw.globalAlpha);
    assert.equal(JSON.stringify(effect),before,'Repeated render frames cannot change damage or effect life');
  }
  assert.deepEqual(crops,[8,9,10,11,12,13,14,15]);
  assert.equal(sizes[0],128);assert.equal(sizes[3],208);
  for(let index=1;index<sizes.length;index++)assert.ok(sizes[index]>=sizes[index-1]);
  assert.ok(sizes[7]<252,'The local aftermath stays bounded');
  assert.deepEqual(alphas.slice(0,5),[1,1,1,1,1]);
  assert.ok(alphas[5]>alphas[6]&&alphas[6]>alphas[7]&&alphas[7]>0);
  assert.equal(h.state().globalAlpha,1);assert.equal(h.state().x,0);assert.equal(h.stack.length,0);
});

test('Atlas silhouette separation follows every supplied position with a transparent edge and unchanged reactor geometry',()=>{
  const h=harness();
  for(const [x,y] of [[240,350],[470,430],[320,380]]) {
    h.calls.length=0;Object.assign(h.sandbox.atlasBoss,{x,y});
    const before=JSON.stringify(h.sandbox.atlasBoss);h.sandbox.drawGuardianAtlas();
    const draw=h.calls.find(call=>call.kind==='image'),gradient=h.calls.find(call=>call.kind==='gradient');
    const size=350*1.25,radius=350*.65;
    assert.deepEqual(draw.args.slice(0,4),[1536,0,512,512]);
    assert.deepEqual(draw.args.slice(4),[x-size/2,y-size/2,size,size]);
    assert.deepEqual(gradient.args,[x,y,0,x,y,radius]);
    assert.deepEqual(gradient.stops.at(-1),[1,'rgba(2,8,22,0)']);
    assert.deepEqual(h.calls.find(call=>call.kind==='fillRect').args,[x-radius,y-radius,radius*2,radius*2]);
    assert.equal(JSON.stringify(h.sandbox.atlasBoss),before,'Contrast treatment cannot move a collider or reactor');
    assert.equal(h.calls.filter(call=>call.kind==='image').length,1,'No cloned armour or overlay plate');
  }
  assert.equal(h.stack.length,0);
});
