/** Asset-backed sequences. Missing enemy poses remain explicitly unproduced. */
const sequence = (prefix, indices) => indices.map(index =>
  `assets/${prefix}_frame_${String(index).padStart(2, '0')}.webp`);
const define = (frames, options = {}) => Object.freeze({
  frames: Object.freeze(frames), frameMs: 115, loop: true, flipX: false,
  status: 'verified-assets', ...options
});
const ship = (...indices) => sequence('ship', indices);

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
