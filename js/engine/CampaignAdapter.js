/**
 * Opt-in migration boundary for the legacy campaign.
 * Does not start an animation loop or modify the existing campaign.
 *
 * The caller must supply legacy update/render callbacks, and must stop the
 * legacy requestAnimationFrame loop before calling start().
 */
import {EngineCore} from './EngineCore.js';

export function createCampaignAdapter({
  canvas,
  updateLevel,
  drawBackground,
  drawEntities,
  drawForeground=()=>{},
  onStart=()=>{},
  onStop=()=>{},
  particles,
  renderer
}={}){
  if(typeof updateLevel!=='function'||typeof drawBackground!=='function'||typeof drawEntities!=='function'){
    throw new TypeError('Campaign adapter requires updateLevel, drawBackground and drawEntities');
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
  return {
    core,
    start({legacyLoopStopped=false}={}){
      if(!legacyLoopStopped)throw new Error('Stop the legacy RAF loop before enabling CampaignAdapter');
      onStart();core.start();
    },
    stop(){core.stop();onStop();},
    get running(){return core.running;}
  };
}
