/**
 * Opt-in migration boundary. Never loaded by the legacy campaign.
 *
 * Migration contract:
 * - stopLegacyLoop() MUST synchronously disable legacy scheduling and return
 *   the last outstanding legacy requestAnimationFrame ID (or null).
 * - cancelLegacyFrame(id) cancels that ID before EngineCore.start().
 * - stopLegacyLoop() must be idempotent and must prevent callbacks already
 *   executing from scheduling further frames.
 * - A legacy callback already on the call stack cannot be cancelled by RAF.
 */
import {EngineCore} from './EngineCore.js';

export function createCampaignAdapter({
  canvas,
  updateLevel,
  drawBackground,
  drawEntities,
  drawForeground=()=>{},
  stopLegacyLoop,
  cancelLegacyFrame=id=>cancelAnimationFrame(id),
  onStart=()=>{},
  onStop=()=>{},
  particles,
  renderer
}={}){
  if(typeof updateLevel!=='function'||typeof drawBackground!=='function'||typeof drawEntities!=='function'){
    throw new TypeError('Campaign adapter requires updateLevel, drawBackground and drawEntities');
  }
  if(typeof stopLegacyLoop!=='function'||typeof cancelLegacyFrame!=='function'){
    throw new TypeError('A synchronous stopLegacyLoop and cancelLegacyFrame are required');
  }
  const core=new EngineCore({
    canvas,particles,renderer,
    update:(dt,engine)=>updateLevel(dt,engine),
    drawScene:(ctx,view,engine)=>{
      drawBackground(ctx,view,engine);
      drawEntities(ctx,view,engine);
      drawForeground(ctx,view,engine);
    }
  });
  let started=false;
  return {
    core,
    start(){
      if(started||core.running)return;
      // Disable legacy scheduling first, then cancel its pending RAF by ID.
      const frameId=stopLegacyLoop();
      if(frameId&&typeof frameId.then==='function'){
        throw new TypeError('stopLegacyLoop must be synchronous');
      }
      if(frameId!==null&&frameId!==undefined){
        if(!Number.isInteger(frameId)||frameId<0){
          throw new TypeError('stopLegacyLoop must return a valid RAF ID or null');
        }
        cancelLegacyFrame(frameId);
      }
      // Any failure above prevents the new loop from starting.
      onStart();
      try{core.start();started=true;}
      catch(error){core.stop();onStop();throw error;}
    },
    stop(){
      if(!started&&!core.running)return;
      core.stop();started=false;onStop();
    },
    get running(){return core.running;}
  };
}
