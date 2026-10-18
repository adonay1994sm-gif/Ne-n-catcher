import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as shipModel from '../src/game/ship/modular-ship.js';

const root=new URL('..',import.meta.url);
const [html,uiSource,renderSource]=await Promise.all([
  readFile(new URL('index.html',root),'utf8'),
  readFile(new URL('src/game/03-ui-game-flow.js',root),'utf8'),
  readFile(new URL('src/game/07-player-item-rendering.js',root),'utf8')
]);
const setupStart=uiSource.indexOf('  function setupShipHangar() {');
const setupEnd=uiSource.indexOf('  function setupJourneyUI() {',setupStart);
const renderEnd=renderSource.indexOf('  function playerFrameState(t) {');
assert.ok(setupStart>=0&&setupEnd>setupStart&&renderEnd>0,'Real setup and rendering functions must exist');
const setup=uiSource.slice(setupStart,setupEnd),render=renderSource.slice(0,renderEnd);
const aster={hull:'aster',wings:'aster',engines:'aster'};
const plain=value=>JSON.parse(JSON.stringify(value));

function harness(t){
  const dom=new JSDOM(html,{url:'https://neon.test/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const {window}=dom,contexts=new WeakMap(),draws=[];
  let rafRequests=0,dataUrls=0;
  window.requestAnimationFrame=()=>++rafRequests;
  window.NeonCampaign=shipModel;
  window.__ATLAS__={complete:false,naturalWidth:0,naturalHeight:0,_assetPath:'assets/ship_modular_atlas_v1.webp'};
  window.HTMLCanvasElement.prototype.getContext=function(){
    if(!contexts.has(this)){
      const canvas=this;
      contexts.set(this,new Proxy({}, {get(target,key){
        if(key==='drawImage')return (image,...args)=>draws.push({canvas:canvas.id||'generated-preview',path:image._assetPath,args});
        if(!(key in target))target[key]=()=>{};
        return target[key];
      }}));
    }
    return contexts.get(this);
  };
  window.HTMLCanvasElement.prototype.toDataURL=()=>`data:image/png;base64,fixture-${++dataUrls}`;
  window.eval(`
    const $=id=>document.getElementById(id),canvas=$('canvas');
    const ui={menu:$('menu'),briefing:$('briefing')},SPRITES={modularShip:window.__ATLAS__,shipIdentity:{complete:true,naturalWidth:512,naturalHeight:640,_assetPath:'assets/player_ship_identity_v1.webp'}};
    let state='menu',shipRenderMode='modular',shipLoadout=NeonCampaign.normalizeShipLoadout();
    let shipHangarDraft=null,shipPresentationSignature='',writes=[];
    const originals=[0,1,2].map(index=>({complete:true,naturalWidth:320,naturalHeight:320,_assetPath:'assets/ship_frame_0'+index+'.webp'}));
    const spriteReady=image=>Boolean(image&&image.complete&&image.naturalWidth>0);
    const frameFrom=(name,index)=>name==='ship'?originals[index]:null;
    const storage={setJSON(key,value){writes.push({key,value});return true;}};
    function overlay(element){for(const node of [ui.menu,ui.briefing,ui.shipHangar].filter(Boolean))node.classList.remove('show');if(element)element.classList.add('show');}
    function toast(){}
    ${render}
    ${setup}
    setupShipHangar();
    window.__FALLBACK_TEST__={
      sync:syncShipPresentation,draw:drawShipHangar,
      active(mode,loadout){shipRenderMode=mode;shipLoadout=NeonCampaign.normalizeShipLoadout(loadout);},
      snapshot(){return {mode:shipRenderMode,loadout:shipLoadout,draft:shipHangarDraft,signature:shipPresentationSignature,writes};}
    };
  `);
  const node=id=>window.document.getElementById(id);
  return {window,node,draws,api:window.__FALLBACK_TEST__,
    snapshot:()=>plain(window.__FALLBACK_TEST__.snapshot()),
    open(){node('openHangar').click();},
    ready(){Object.assign(window.__ATLAS__,{complete:true,naturalWidth:1774,naturalHeight:887});},
    stats:()=>({rafRequests,dataUrls})};
}

test('historical legacy mode cannot bring back the retired menu ship when the atlas is unavailable',t=>{
  const h=harness(t);
  for(const image of h.window.document.querySelectorAll('.menu-ship-image,.briefing-ship'))image.src='data:image/png;base64,stale-modular';
  h.api.active('legacy',aster);h.api.sync();
  for(const image of h.window.document.querySelectorAll('.menu-ship-image,.briefing-ship'))assert.equal(image.getAttribute('src'),'assets/player_ship_identity_v1.webp');
  assert.equal(h.snapshot().signature,'','an unavailable assembly remains retryable');
  assert.equal(h.stats().dataUrls,0,'failure must not export an empty Canvas');
  assert.equal(h.stats().rafRequests,0);
});

test('an unavailable atlas keeps a verified signature intact and never stamps an unrendered loadout',t=>{
  const h=harness(t);h.ready();h.api.sync();
  const signature=h.snapshot().signature;
  Object.assign(h.window.__ATLAS__,{complete:false,naturalWidth:0,naturalHeight:0});
  h.api.active('modular',{...aster,hull:'bastion'});h.api.sync();
  assert.deepEqual(h.snapshot().signature,signature);
  for(const image of h.window.document.querySelectorAll('.menu-ship-image,.briefing-ship'))assert.equal(image.getAttribute('src'),'assets/player_ship_identity_v1.webp');
  assert.equal(h.stats().dataUrls,1,'only the successful assembly was exported');
});

test('the hangar shows the same current ship in reserve while unavailable components cannot be applied',t=>{
  const h=harness(t);h.open();h.api.draw(0);
  assert.equal(h.node('shipAtlasNotice').classList.contains('hidden'),false);
  assert.equal(h.node('shipApply').disabled,true);
  assert.ok(h.draws.some(draw=>draw.canvas==='shipHangarCanvas'&&draw.path==='assets/player_ship_identity_v1.webp'));
  assert.equal(h.draws.some(draw=>/ship_frame_/.test(draw.path)),false,'retired art is not a fallback');
  assert.equal(h.draws.some(draw=>draw.path==='assets/ship_modular_atlas_v1.webp'),false);
  assert.equal(h.node('shipLegacy'),null);
  h.node('shipApply').click();assert.equal(h.snapshot().writes.length,0);
  assert.equal(h.stats().rafRequests,0);
});

test('a recovered atlas replaces reserve with the authored components and keeps a single RAF owner',t=>{
  const h=harness(t);h.open();h.api.draw(0);
  assert.equal(h.node('shipApply').disabled,true);
  h.ready();h.draws.length=0;h.api.draw(32);
  assert.equal(h.node('shipApply').disabled,false);
  assert.equal(h.node('shipAtlasNotice').classList.contains('hidden'),true);
  assert.equal(h.draws.filter(draw=>draw.canvas==='shipHangarCanvas').length,6,'two clean plumes, articulated wing halves, engines and hull');
  assert.ok(h.draws.every(draw=>draw.path==='assets/ship_modular_atlas_v1.webp'));
  h.node('shipApply').click();
  assert.equal(h.snapshot().signature.mode,'modular');
  for(const image of h.window.document.querySelectorAll('.menu-ship-image,.briefing-ship'))assert.match(image.getAttribute('src'),/^data:image\/png;base64,fixture-/);
  const exports=h.stats().dataUrls;h.api.sync();
  assert.equal(h.stats().dataUrls,exports,'unchanged selection reuses the prepared presentation');
  assert.equal(h.stats().rafRequests,0);
});

test('the real renderer draws independent proportional jets at either engine family mounting points',t=>{
  const h=harness(t);h.ready();
  const roots={aster:[[1498,177],[1616,178]],bastion:[[1499,557],[1612,557]]};
  for(const engines of ['aster','bastion']){
    const loadout={...aster,engines};h.api.active('modular',loadout);h.open();h.draws.length=0;h.api.draw(0);
    const plumeDraws=h.draws.filter(draw=>draw.canvas==='shipHangarCanvas').slice(0,2);
    assert.equal(plumeDraws.length,2);
    const flame=shipModel.shipPartFrame(loadout,'flames'),anchors=shipModel.shipNozzleAnchors(loadout);
    for(const [side,draw]of plumeDraws.entries()){
      const {source,destination}=flame.plumes[side];
      assert.deepEqual(draw.args,[source.x,source.y,source.width,source.height,
        destination.x,destination.y,destination.width,destination.height]);
      assert.ok(Math.abs(draw.args[6]/draw.args[7]-draw.args[2]/draw.args[3])<1e-12,
        'a wider nozzle separation cannot stretch the individual plume');
      const [x,y]=roots[engines][side];
      const root={x:draw.args[4]+(x-draw.args[0])/draw.args[2]*draw.args[6],
        y:draw.args[5]+(y-draw.args[1])/draw.args[3]*draw.args[7]};
      assert.ok(Math.abs(root.x-anchors[side].x)<1e-9);assert.ok(Math.abs(root.y-anchors[side].y)<1e-9);
    }
    const [first,second]=plumeDraws.map(draw=>draw.args);
    assert.ok(first[0]+first[2]<second[0],'the contaminated center stays excluded');
    assert.equal(h.draws.some(draw=>/ship_frame_/.test(draw.path)),false);
    h.node('shipHangarBack').click();
  }
});
