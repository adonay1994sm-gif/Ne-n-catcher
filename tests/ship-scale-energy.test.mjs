import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const [config,render]=await Promise.all([
  readFile(new URL('../src/game/00-bootstrap-config.js',import.meta.url),'utf8'),
  readFile(new URL('../src/game/07-player-item-rendering.js',import.meta.url),'utf8')
]);
function visualContract(search='') {
  const context=vm.createContext({URLSearchParams,location:{search}});
  vm.runInContext(config.slice(config.indexOf('  const N7_CAMPAIGN'),config.indexOf('  const ui ='))+
    '\nglobalThis.contract=SHIP_VISUAL;',context);
  return JSON.parse(JSON.stringify(context.contract));
}
function harness({classic=true,reserve=0}={}) {
  const calls=[],draws=[],properties={globalAlpha:1},stats={halos:0,gradients:0,blurWrites:[]};
  const image=(name,width=192,height=192)=>({name,naturalWidth:width,naturalHeight:height,complete:true});
  const ctx=new Proxy({}, {get(_target,key){
    if(key==='drawImage')return (image,...args)=>draws.push({name:image.name,args});
    if(key==='createRadialGradient')return()=>{throw new Error('No per-pickup gradients');};
    return key in properties?properties[key]:(...args)=>calls.push({method:key,args});
  },set(_target,key,value){properties[key]=value;if(key==='shadowBlur')stats.blurWrites.push(value);return true;}});
  const sandbox=vm.createContext({Math,ctx,SHIP_VISUAL:visualContract(classic?'':'?campaign=n7'),
    isUnifiedClassic:()=>classic,state:'playing',playerVisible:true,
    player:{x:360,y:1000,target:360,targetY:1000,drift:0,visualBank:.6},
    powers:{shield:4},classicHullReserve:reserve,classicShieldImpact:.2,
    hull:100,elapsed:2.5,JOURNEY_DEMO:false,impactReactionTimer:0,
    shipLoadout:{hull:'aster',wings:'aster',engines:'aster'},classicWeapons:{cooldown:0},
    classicEquipment:{selected:'pulse'},hasClassicTwinMounts:()=>false,
    spriteReady:sprite=>!!sprite?.naturalWidth,SPRITES:{croniumFragment:image('crystal'),shieldEffect:image('legacy-shield'),shieldIdle:image('legacy-shield'),forceShieldAtlas:image('force-field',1536,384)},
    drawModularShip:(...args)=>{calls.push({method:'assembly',args});return true;},
    frameFrom:(_name,frame)=>image(`core-${frame}`),
    drawImageCentered:(...args)=>calls.push({method:'centered',args}),
    clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
    document:{createElement(){stats.halos++;return {name:'cached-energy-halo',
      getContext(){return {createRadialGradient(){stats.gradients++;return {addColorStop(){}};},fillRect(){}};}};}}
  });
  const playerStart=render.indexOf('  function drawPlayer(t) {'),energyEnd=render.indexOf('  function drawCh01Frame(');
  vm.runInContext(render.slice(playerStart,energyEnd),sandbox);
  return {sandbox,calls,draws,stats,properties};
}

test('both classic hull families share the40% render contract while N7 and Journey retain historical scale',()=>{
  const classic=visualContract();assert.equal(classic.classicScale,.4);
  assert.equal(classic.assemblySize,83.2);assert.equal(classic.muzzleOffset,50);
  for(const campaign of ['n7','journey']) {
    const historical=visualContract(`?campaign=${campaign}`);
    assert.equal(historical.classicScale,1);assert.equal(historical.assemblySize,208);
    assert.ok(Math.abs(historical.centerYOffset+19.2)<1e-9);assert.equal(historical.bankStrength,1);
    assert.ok(Math.abs(classic.centerYOffset-historical.centerYOffset*.4)<1e-9);
  }
});

test('actual player rendering uses the smoothed visual bank and integrated armor plating without a classic shield bubble',()=>{
  const h=harness({reserve:30});h.sandbox.drawPlayer(2500);
  const assembly=h.calls.find(call=>call.method==='assembly');
  assert.equal(assembly.args[2],83.2);assert.equal(assembly.args[4],.6);
  assert.equal(assembly.args[8],1.8);assert.ok(assembly.args[9]>0);
  assert.equal(h.draws.some(draw=>draw.name==='force-field'),false);
  assert.equal(h.calls.some(call=>call.method==='centered'&&call.args[0].name==='legacy-shield'),false);
  const historical=harness({classic:false});historical.sandbox.drawPlayer(2500);
  assert.equal(historical.calls.find(call=>call.method==='assembly').args[2],208);
  assert.ok(historical.calls.some(call=>call.method==='centered'&&call.args[0].name==='legacy-shield'));
});

test('animated CRONIUM draws authored energy rather than its metal bezel and reuses one small cached halo',()=>{
  const h=harness(),item={type:'energy',x:200,y:500,r:22,alpha:1,phase:0,rot:0};
  const before=JSON.stringify(item);
  h.sandbox.drawEnergy(item);h.sandbox.elapsed+=1/9;h.sandbox.drawEnergy(item);
  assert.equal(h.stats.halos,1);assert.equal(h.stats.gradients,1);
  assert.ok(h.stats.blurWrites.every(blur=>blur===0));
  const core=h.draws.filter(draw=>draw.name.startsWith('core-'));
  assert.equal(core.length,2);assert.notEqual(core[0].name,core[1].name);
  assert.ok(core.every(draw=>draw.args[2]===192*.46&&draw.args[3]===192*.46));
  assert.equal(h.draws.filter(draw=>draw.name==='cached-energy-halo').length,2);
  assert.equal(JSON.stringify(item),before,'Rendering cannot mutate pickup hitboxes or position');
});

test('the real missile renderer keeps launch and flight states at the physical projectile pivot',()=>{
  const h=harness();h.sandbox.SPRITES.chapterMissile={name:'chapter-missile',naturalWidth:1024,naturalHeight:1024};
  h.sandbox.classicWeapons.projectiles=[{weapon:'missile',x:320,y:400,vx:0,vy:-760,duration:3.2,life:3.18}];
  vm.runInContext(render.slice(0,render.indexOf('  function drawFlightModule(')),h.sandbox);
  h.sandbox.drawClassicProjectiles();
  assert.equal(h.draws[0].name,'chapter-missile');assert.equal(h.draws[0].args[1],256,'launch row');
  assert.deepEqual(h.draws[0].args.slice(4),[-27,-27,54,54]);
  assert.ok(h.calls.some(call=>call.method==='translate'&&call.args[0]===320&&call.args[1]===400));
  assert.ok(h.calls.some(call=>call.method==='rotate'&&call.args[0]===0));
  h.sandbox.classicWeapons.projectiles[0].life=2.95;h.sandbox.drawClassicProjectiles();
  assert.equal(h.draws[1].args[1],0,'stable flight row');
});

test('Guardian firing poses close their actual core with authored plating and avoid neighbouring atlas cells',()=>{
  const h=harness(),animation={frame:3,previousFrame:null,blend:1,coreCover:1,coverFrame:0,
    coverRect:{x:156,y:145,width:132,height:162,pivotX:66,pivotY:81,sourceCell:443.5}};
  h.sandbox.SPRITES.guardianAtlas={name:'guardian-atlas',naturalWidth:1774,naturalHeight:887};
  h.sandbox.atlasBoss={state:'fire',x:360,y:400,visualSize:350,phase:1,vulnerability:false};
  h.sandbox.NeonCampaign={guardianAtlasAnimation:()=>animation};
  const constants=render.slice(render.indexOf('  const ATLAS_FRAME_PIVOTS'),render.indexOf('  function drawAtlasVfx'));
  const boss=render.slice(render.indexOf('  function drawGuardianAtlas()'),render.indexOf('  function drawShipComponent('));
  vm.runInContext(constants+boss,h.sandbox);h.sandbox.drawGuardianAtlas();
  assert.equal(h.draws.length,2);
  assert.deepEqual(h.draws[0].args.slice(0,4),[1331,.5,442.5,442.5]);
  const cover=h.draws[1].args;
  assert.deepEqual(cover.slice(0,4),[156,145,132,162]);
  assert.ok(Math.abs(cover[4]+cover[6]/2-360)<1e-9);
  assert.ok(Math.abs(cover[5]+cover[7]/2-400)<1e-9);
  assert.ok(h.calls.some(call=>call.method==='ellipse'),'cover edges are clipped to the real reactor opening');
  animation.coreCover=0;h.draws.length=0;h.sandbox.drawGuardianAtlas();
  assert.equal(h.draws.length,1,'an exposed reactor cannot retain the closed plating');
});
