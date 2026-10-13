/** Animation inventory: existing sprite references versus missing content. No fabricated frames. */
export const ANIMATION_MAP=Object.freeze({
 player:Object.freeze({
  idle:Object.freeze({frames:['ship_frame_01.webp','ship_frame_02.webp','ship_frame_03.webp','ship_frame_04.webp'],status:'verify-assets'}),
  bankLeft:Object.freeze({frames:['ship_frame_05.webp'],status:'verify-orientation'}),
  bankRight:Object.freeze({frames:['ship_frame_06.webp'],status:'verify-orientation'}),
  thruster:Object.freeze({frames:['ship_frame_07.webp'],status:'verify-assets'})
 }),
 enemies:Object.freeze({
  spawn:Object.freeze({frames:[],status:'assets-required'}),
  fire:Object.freeze({frames:[],status:'assets-required'}),
  explosion:Object.freeze({frames:[],status:'assets-required'})
 }),
 energyCore:Object.freeze({pulse:Object.freeze({frames:[],status:'audit-existing-core-sequence'})})
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
