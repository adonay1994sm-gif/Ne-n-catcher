import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {SHIP_FLEET,SHIP_FLEET_SAVE_KEY,normalizeShipLoadout} from '../src/game/ship/modular-ship.js';

const root=new URL('..',import.meta.url);
const [html,uiSource]=await Promise.all([
  readFile(new URL('index.html',root),'utf8'),
  readFile(new URL('src/game/03-ui-game-flow.js',root),'utf8')
]);
const start=uiSource.indexOf('  function setupShipHangar() {');
const end=uiSource.indexOf('  function updateMenu() {',start);
assert.ok(start>=0&&end>start,'The real hangar setup must be present in the game source');
const hangarSetup=uiSource.slice(start,end);
const aster={hull:'aster',wings:'aster',engines:'aster'};
const bastion={hull:'bastion',wings:'bastion',engines:'bastion'};
const plain=value=>JSON.parse(JSON.stringify(value));

/**
 * Exercise the actual UI handlers with the real HTML and assembly model.
 * Campaign updates and Canvas drawing are deliberately outside this fixture;
 * a stub records the integration callback and any attempted RAF ownership.
 */
function harness(t,{mode='modular',loadout=aster}={}){
  const dom=new JSDOM(html,{url:'https://neon.test/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const {window}=dom;
  let rafRequests=0,rafCancellations=0;
  window.requestAnimationFrame=()=>++rafRequests;
  window.cancelAnimationFrame=()=>{rafCancellations++;};
  window.NeonCampaign={SHIP_FLEET,SHIP_FLEET_SAVE_KEY,normalizeShipLoadout};
  window.__HANGAR_INITIAL__={mode,loadout};
  window.eval(`
    const $=id=>document.getElementById(id);
    const canvas=$('canvas'),ui={menu:$('menu'),briefing:$('briefing')};
    let state='menu',shipRenderMode=window.__HANGAR_INITIAL__.mode;
    let shipLoadout=NeonCampaign.normalizeShipLoadout(window.__HANGAR_INITIAL__.loadout);
    let shipHangarDraft=null,syncs=0,allowSave=true;
    const writes=[],messages=[];
    const storage={setJSON(key,value){
      if(!allowSave)return false;
      writes.push({key,value:JSON.parse(JSON.stringify(value))});return true;
    }};
    function overlay(element){
      for(const node of [ui.menu,ui.briefing])node.classList.remove('show');
      if(element)element.classList.add('show');
    }
    function syncShipPresentation(){syncs++;}
    function toast(message){messages.push(message);}
    ${hangarSetup}
    setupShipHangar();
    window.__HANGAR_TEST__={
      setup:setupShipHangar,
      setState(value){state=value;},
      allowSave(value){allowSave=value;},
      showBriefing(){overlay(ui.briefing);},
      hideOverlays(){overlay();},
      snapshot(){return {state,mode:shipRenderMode,loadout:shipLoadout,
        draft:shipHangarDraft,writes,syncs,messages};}
    };
  `);
  const document=window.document;
  const node=id=>document.getElementById(id);
  return {
    window,document,node,api:window.__HANGAR_TEST__,
    snapshot:()=>plain(window.__HANGAR_TEST__.snapshot()),
    open:()=>node('openHangar').click(),
    back:()=>node('shipHangarBack').click(),
    apply:()=>node('shipApply').click(),
    preset:id=>document.querySelector(`[data-ship-preset="${id}"]`).click(),
    change(id,value){node(id).value=value;node(id).dispatchEvent(new window.Event('change',{bubbles:true}));},
    keyboard(target,key,extra={}){
      const event=new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra});
      target.dispatchEvent(event);return event;
    },
    raf:()=>({requests:rafRequests,cancellations:rafCancellations})
  };
}

test('hangar setup is idempotent and creates an accessible draft preview in the existing menu',t=>{
  const h=harness(t);
  h.api.setup();
  assert.equal(h.document.querySelectorAll('#openHangar').length,1);
  assert.equal(h.document.querySelectorAll('#shipHangar').length,1);
  assert.equal(h.node('shipHangar').getAttribute('role'),'dialog');
  assert.equal(h.node('shipHangar').getAttribute('aria-modal'),'true');
  assert.equal(h.node('shipHangarCanvas').width,512);
  assert.equal(h.node('shipHangarCanvas').height,512);
  assert.equal(h.node('shipHangarCanvas').getAttribute('role'),'img');
  assert.equal(h.node('shipHangar').classList.contains('hidden'),true);
  assert.match(h.node('shipHangarRules').textContent,/Configuración visual · mismas reglas de vuelo/);
  h.open();
  assert.equal(h.node('shipHangar').classList.contains('show'),true);
  assert.equal(h.node('menu').classList.contains('show'),false);
  assert.deepEqual(h.snapshot().draft,{mode:'modular',loadout:aster});
  assert.equal(h.document.activeElement,h.node('shipHangar').querySelector('.ship-hangar-panel'));
  assert.deepEqual(h.raf(),{requests:0,cancellations:0});
});

test('presets and mixed components remain a draft; returning discards them without saving',t=>{
  const h=harness(t);
  h.open();h.preset('bastion');h.change('shipWings','aster');
  assert.deepEqual(h.snapshot().draft.loadout,{hull:'bastion',wings:'aster',engines:'bastion'});
  assert.deepEqual(h.snapshot().loadout,aster);
  assert.equal(h.snapshot().writes.length,0);
  assert.equal(h.snapshot().syncs,0);
  h.back();
  assert.equal(h.snapshot().draft,null);
  assert.deepEqual(h.snapshot().loadout,aster);
  assert.equal(h.snapshot().writes.length,0);
  assert.equal(h.node('menu').classList.contains('show'),true);
  assert.equal(h.document.activeElement,h.node('openHangar'));
  h.open();assert.deepEqual(h.snapshot().draft.loadout,aster);
});

test('applying saves one normalized selection and then updates presentation without changing campaign state',t=>{
  const h=harness(t);
  h.open();h.preset('bastion');h.change('shipHull','aster');h.apply();
  const mixed={hull:'aster',wings:'bastion',engines:'bastion'};
  assert.deepEqual(h.snapshot().writes,[{key:SHIP_FLEET_SAVE_KEY,value:{version:1,mode:'modular',loadout:mixed}}]);
  assert.deepEqual(h.snapshot().loadout,mixed);
  assert.equal(h.snapshot().syncs,1);
  assert.equal(h.snapshot().state,'menu');
  assert.equal(h.snapshot().draft,null);
  assert.equal(h.node('shipHangar').classList.contains('hidden'),true);
  h.apply();assert.equal(h.snapshot().writes.length,1,'a hidden apply cannot duplicate a write');
  h.open();assert.deepEqual(h.snapshot().draft.loadout,mixed);
  assert.deepEqual(h.raf(),{requests:0,cancellations:0});
});

test('a failed save preserves the applied ship and keeps the draft available for a coherent retry',t=>{
  const h=harness(t);
  h.open();h.preset('bastion');h.api.allowSave(false);h.apply();
  assert.deepEqual(h.snapshot().loadout,aster);
  assert.deepEqual(h.snapshot().draft.loadout,bastion);
  assert.equal(h.snapshot().mode,'modular');
  assert.equal(h.snapshot().writes.length,0);
  assert.equal(h.snapshot().syncs,0);
  assert.equal(h.node('shipHangar').classList.contains('show'),true);
  assert.match(h.node('shipHangarStatus').textContent,/No se pudo guardar/);
  h.api.allowSave(true);h.apply();
  assert.deepEqual(h.snapshot().loadout,bastion);
  assert.equal(h.snapshot().writes.length,1);
  assert.equal(h.snapshot().syncs,1);
});

test('historical legacy selection opens as modular without losing its parts or saving until apply',t=>{
  const h=harness(t,{mode:'legacy',loadout:bastion});
  h.open();
  assert.equal(h.node('shipLegacy'),null,'the retired ship is not a selectable alternative');
  assert.deepEqual(h.snapshot().draft,{mode:'modular',loadout:bastion});
  assert.equal(h.snapshot().mode,'legacy','opening the hangar never writes storage');
  for(const id of ['shipHull','shipWings','shipEngines'])assert.equal(h.node(id).disabled,false);
  h.back();assert.equal(h.snapshot().writes.length,0);
  h.open();h.apply();
  assert.equal(h.snapshot().mode,'modular');
  assert.deepEqual(h.snapshot().loadout,bastion,'all saved modular components are retained');
  assert.deepEqual(h.snapshot().writes[0].value,{version:1,mode:'modular',loadout:bastion});
  h.open();assert.deepEqual(h.snapshot().draft,{mode:'modular',loadout:bastion});
  h.back();assert.equal(h.snapshot().writes.length,1,'reopening is idempotent');
});

test('the hangar cannot open during a run or behind an unrelated overlay',t=>{
  const h=harness(t);
  for(const state of ['playing','paused','gameover','complete','destroying']){
    h.api.setState(state);h.open();
    assert.equal(h.node('shipHangar').classList.contains('show'),false,state);
    assert.equal(h.snapshot().draft,null,state);
  }
  h.api.setState('menu');h.api.hideOverlays();h.open();
  assert.equal(h.node('shipHangar').classList.contains('show'),false);
  h.api.showBriefing();h.open();
  assert.equal(h.node('shipHangar').classList.contains('show'),true,'a non-running briefing permits preparation');
  assert.equal(h.snapshot().state,'menu');
});

test('keyboard focus stays in the dialog; Escape cancels without saving or owning a new RAF',t=>{
  const h=harness(t);
  let gameplayKeys=0;h.window.addEventListener('keydown',()=>gameplayKeys++);
  h.open();h.preset('bastion');
  const panel=h.node('shipHangar').querySelector('.ship-hangar-panel');
  const first=h.document.querySelector('[data-ship-preset="aster"]');
  const last=h.node('shipHangarBack');
  panel.focus();
  assert.equal(h.keyboard(panel,'Tab',{shiftKey:true}).defaultPrevented,true);
  assert.equal(h.document.activeElement,last);
  assert.equal(h.keyboard(last,'Tab').defaultPrevented,true);
  assert.equal(h.document.activeElement,first);
  h.keyboard(h.node('shipHull'),'ArrowLeft');
  assert.equal(gameplayKeys,0,'select navigation cannot steer the campaign');
  assert.equal(h.keyboard(first,'Escape').defaultPrevented,true);
  assert.equal(h.document.activeElement,h.node('openHangar'));
  assert.equal(h.node('menu').classList.contains('show'),true);
  assert.equal(h.snapshot().draft,null);
  assert.deepEqual(h.snapshot().loadout,aster);
  assert.equal(h.snapshot().writes.length,0);
  assert.equal(h.snapshot().syncs,0);
  assert.equal(gameplayKeys,0,'Escape cannot leak into campaign pause/resume');
  assert.deepEqual(h.raf(),{requests:0,cancellations:0});
});
