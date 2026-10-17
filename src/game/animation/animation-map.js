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

export const ANIMATION_MAP = Object.freeze({
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
  twinEmitter: Object.freeze({
    idle: emitterAtlas(0),
    charge: emitterAtlas(1),
    fire: emitterAtlas(2)
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
