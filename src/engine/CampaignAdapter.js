import {EngineCore} from './EngineCore.js';
/** Opt-in adapter only. No imports from src/game; no legacy RAF takeover yet. */
export function createCampaignAdapter({canvas,renderer,particles,updateLevel,drawBackground,drawEntities,drawForeground=()=>{},stopLegacyLoop,cancelLegacyFrame=id=>cancelAnimationFrame(id),onStart=()=>{},onStop=()=>{},requestFrame,cancelFrame}={}){
 if([updateLevel,drawBackground,drawEntities,stopLegacyLoop,cancelLegacyFrame].some(fn=>typeof fn!=='function'))throw new TypeError('Synchronous legacy handoff callbacks required');
 const core=new EngineCore({canvas,renderer,particles,requestFrame,cancelFrame,update:(dt,engine)=>updateLevel(dt,engine),drawScene:(ctx,view,engine)=>{drawBackground(ctx,view,engine);drawEntities(ctx,view,engine);drawForeground(ctx,view,engine);}});
 let started=false;
 return {core,start(){
  if(started||core.running)return false;
  const id=stopLegacyLoop();if(id&&typeof id.then==='function')throw new TypeError('stopLegacyLoop must be synchronous');
  if(id!=null){if(!Number.isInteger(id)||id<0)throw new TypeError('Invalid RAF ID');cancelLegacyFrame(id);}
  try{onStart();core.start();started=true;return true;}catch(error){core.stop();onStop();throw error;}
 },stop(){if(!started&&!core.running)return false;core.stop();started=false;onStop();return true;},get running(){return core.running;}};
}
