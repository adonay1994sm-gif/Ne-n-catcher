import ch02 from '../../../art-source/enemies/ch02/ch02-atlas-v1.json' with {type:'json'};
/** Asset-backed sequences. Missing enemy poses remain explicitly unproduced. */
const sequence = (prefix, indices) => indices.map(index =>
  `assets/${prefix}_frame_${String(index).padStart(2, '0')}.webp`);
const define = (frames, options = {}) => Object.freeze({
  frames: Object.freeze(frames), frameMs: 115, loop: true, flipX: false,
  status: 'verified-assets', ...options
});
const ship = (...indices) => sequence('ship', indices);
// These are actual atlas cells, never duplicated file names masquerading as
// different drawings. Timing/geometry remain owned by the legacy flight model.
const flightAtlas = (cell, options = {}) => define(['assets/chronos_flight_atlas_v1.webp'], {
  loop: false, atlasColumns: 3, atlasRows: 2,
  atlasCells: Object.freeze([cell]), cellWidth: 512, cellHeight: 512,
  pivot: Object.freeze({x: 256, y: 256}),
  integrationStatus: 'IN_REVIEW', artisticAcceptance: 'PENDING_OWNER',
  physicalAcceptance: 'PENDING', ...options
});
const emitterAtlas = cell => define(['assets/chronos_flight_weapons_v1.webp'], {
  loop: false, atlasColumns: 3, atlasRows: 1,
  atlasCells: Object.freeze([cell]), cellWidth: 512, cellHeight: 512,
  pivot: Object.freeze({x: 256, y: 440}),
  mounts: Object.freeze([Object.freeze({x:154,y:440}),Object.freeze({x:358,y:440})]),
  muzzles: Object.freeze([Object.freeze({x:154,y:190}),Object.freeze({x:358,y:190})]),
  integrationStatus: 'IN_REVIEW', artisticAcceptance: 'PENDING_OWNER',
  physicalAcceptance: 'PENDING'
});
const forceShieldAtlas = (cells, options = {}) => define(['assets/force_shield_atlas_v1.webp'], {
  loop: false, atlasColumns: 4, atlasRows: 1,
  atlasCells: Object.freeze(cells), cellWidth: 384, cellHeight: 384,
  pivot: Object.freeze({x: 192, y: 192}), layer: 'shield',
  status: 'IN_REVIEW', integrationStatus: 'IN_REVIEW',
  artisticAcceptance: 'PENDING_OWNER', physicalAcceptance: 'PENDING',
  frameEvents: Object.freeze([]), ...options
});

export const ANIMATION_MAP = Object.freeze({
  arcadeCombat: Object.freeze(Object.fromEntries([
    ['pulse',0,60,true],['twin',1,50,true],['lance',2,55,true],['impact',3,35,false]
  ].map(([name,row,frameMs,loop]) => [name,define(['assets/arcade_pulse_atlas_v2.webp'],{
    frameMs,loop,atlasColumns:4,atlasRows:4,cellWidth:256,cellHeight:256,
    atlasCells:Object.freeze([0,1,2,3].map(column=>row*4+column)),
    ...(name==='impact'?{durationMs:Object.freeze([35,55,75,95])}:{}),
    pivot:Object.freeze({x:.5,y:.5}),integrationStatus:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'
  })]))),
  gaiaCombat: Object.freeze(Object.fromEntries([
    ['pulse',0,1000/12,true],['twin',1,1000/12,true],['lance',2,1000/12,true],['impact',3,1000/16,false]
  ].map(([name,row,frameMs,loop]) => [name,define(['assets/gaia_pulse_atlas_v3.webp'],{
    frameMs,loop,atlasColumns:4,atlasRows:4,cellWidth:256,cellHeight:256,
    atlasCells:Object.freeze([0,1,2,3].map(column=>row*4+column)),
    ...(name==='impact'?{durationMs:Object.freeze([62.5,62.5,62.5,62.5])}:{}),
    pivot:Object.freeze({x:.5,y:.5}),forwardAxis:'-Y',frameEvents:Object.freeze([]),
    integrationStatus:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'
  })]))),
  hostileOrdnance: Object.freeze(Object.fromEntries([
    ['scout',0,1000/12],['interceptor',1,1000/12],['atlas',2,100]
  ].map(([name,row,frameMs]) => [name,define(['assets/hostile_ordnance_atlas_v1.webp'],{
    frameMs,loop:true,atlasColumns:4,atlasRows:4,cellWidth:256,cellHeight:256,
    atlasCells:Object.freeze([0,1,2,3].map(column=>row*4+column)),
    pivot:Object.freeze({x:.5,y:.5}),forwardAxis:'-Y',frameEvents:Object.freeze([]),
    integrationStatus:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'
  })]))),
  // Different denomination designs are static pickups, never one animation.
  salvageTokens: Object.freeze(Object.fromEntries(['copper','silver','gold','stellar'].map((name,index)=>
    [name,define(['assets/hostile_ordnance_atlas_v1.webp'],{
      frameMs:1000,loop:false,atlasColumns:4,atlasRows:4,cellWidth:256,cellHeight:256,
      atlasCells:Object.freeze([12+index]),pivot:Object.freeze({x:.5,y:.5}),frameEvents:Object.freeze([]),
      integrationStatus:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'
    })]))),
  ch02Interceptor: Object.freeze(Object.fromEntries(Object.entries(ch02.animations).map(([name,animation])=>
    [name,define([ch02.proposedRuntimeImage],{frameMs:animation.durationMs[0],loop:animation.loop,
      atlasColumns:4,atlasRows:4,cellWidth:256,cellHeight:256,
      atlasCells:Object.freeze([...animation.frames]),durationMs:Object.freeze([...animation.durationMs]),
      pivot:Object.freeze({...ch02.pivot}),integrationStatus:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'})]))),
  cometFlight: Object.freeze({
    travel: define(['assets/comet_flight_atlas_v2.webp'], {
      frameMs:125,loop:true,atlasColumns:4,atlasRows:1,
      atlasCells:Object.freeze([0,1,2,3]),cellWidth:384,cellHeight:384,
      pivot:Object.freeze({x:288,y:192}),forwardAxis:'+X',tailCollision:false,
      integrationStatus:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'
    })
  }),
  // Player poses below remain references for the reserved engine. The live
  // renderer animates its accepted modular assembly directly; no old ship pose
  // is selected or precached by the normal experience.
  player: Object.freeze({
    idle: define(ship(0, 1, 2, 1)),
    bankLeft: define(ship(3), {loop: false}),
    bankRight: define(ship(3), {loop: false, flipX: true}),
    thruster: define(ship(4), {loop: false}),
    fire: define(sequence('phaser', [0, 1, 2, 3, 4, 5]), {frameMs: 63, loop: false, layer: 'weapon'}),
    impact: define(ship(5), {frameMs: 320, loop: false, interruptible: false}),
    lightDamage: define(sequence('smoke', [0, 1, 2, 1]), {frameMs: 222, layer: 'smoke', opacity: 0.25}),
    criticalDamage: define(ship(2), {layer: 'ship', loop: false}),
    destruction: define(sequence('explosion', [0, 1, 2, 3, 4, 5, 6, 7]), {frameMs: 65, loop: false, interruptible: false, layer: 'explosion'}),
    respawn: define(['assets/shield_idle.webp', 'assets/shield_effect.webp'], {frameMs: 140, layer: 'shield'})
  }),
  enemies: Object.freeze({
    spawn: define([], {status: 'assets-required'}),
    fire: define([], {status: 'assets-required'}),
    explosion: define(sequence('explosion', [0, 1, 2, 3, 4, 5, 6, 7]), {frameMs: 65, loop: false, layer: 'explosion'})
  }),
  energyCore: Object.freeze({
    pulse: define(sequence('core', [0, 1, 2, 3, 4, 5]), {frameMs: 111})
  }),
  chronosFlight: Object.freeze({
    stationIntact: flightAtlas(0, {layer: 'landmark'}),
    stationBroken: flightAtlas(1, {layer: 'landmark'}),
    gaia: flightAtlas(2, {layer: 'destination'})
  }),
  chronosRaider: Object.freeze({
    approach: flightAtlas(3, {layer: 'attacker'}),
    charge: flightAtlas(4, {layer: 'attacker', interruptible: false}),
    fire: flightAtlas(5, {layer: 'attacker', interruptible: false})
  }),
  chronosDestruction: Object.freeze({
    rupture: define(['assets/chronos_destruction_atlas_v1.webp'], {
      loop: false, atlasColumns: 3, atlasRows: 2, cellWidth: 512, cellHeight: 512,
      atlasCells: Object.freeze([0, 1, 2, 3, 4, 5]),
      pivot: Object.freeze({x: 256, y: 256}),
      timing: 'Route clock; intact until rupture, then .45/.80/1.15/2.0 seconds and persistent aftermath',
      integrationStatus: 'IN_REVIEW', artisticAcceptance: 'PENDING_OWNER', physicalAcceptance: 'PENDING'
    })
  }),
  twinEmitter: Object.freeze({
    idle: emitterAtlas(0),
    charge: emitterAtlas(1),
    fire: emitterAtlas(2)
  }),
  forceShield: Object.freeze({
    activation: forceShieldAtlas([0], {frameMs: 200, durationMs: 200}),
    stable: forceShieldAtlas([1, 2], {
      loop: true, frameMs: 600, cycleMs: 1200, interpolation: 'crossfade',
      timing: 'Existing legacy game clock; blend only stable and pulse cells 1/2'
    }),
    pulse: forceShieldAtlas([2], {frameMs: 600}),
    impact: forceShieldAtlas([3], {frameMs: 180, durationMs: 180})
  })
});
export const VFX_PRESETS=Object.freeze({
 impact:Object.freeze({count:16,speed:185,life:0.28,color:'#ffb766'}),
 coreCapture:Object.freeze({count:22,speed:125,life:0.42,color:'#66faff'}),
 stardust:Object.freeze({count:1,speed:0,life:2,color:'#9cb5ff'})
});
export function emitVfx(particles,type,x,y){
 const preset=VFX_PRESETS[type];
 if(!preset||!particles||typeof particles.burst!=='function')return false;
 particles.burst(x,y,preset);
 return true;
}
