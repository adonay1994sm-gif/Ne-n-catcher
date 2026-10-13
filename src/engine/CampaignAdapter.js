import {EngineCore} from './EngineCore.js';

/** Explicitly disabled by default. This module is not imported by the legacy campaign. */
export const USE_ENGINE_V1 = false;

/** Experimental, opt-in migration boundary. Legacy owns its own RAF until handoff. */
export function createCampaignAdapter({
 canvas,renderer,particles,updateLevel,drawBackground,drawEntities,
 drawForeground=()=>{},stopLegacyLoop,restartLegacyLoop,onStart=()=>{},onStop=()=>{},
 requestFrame,cancelFrame,useEngineV1=USE_ENGINE_V1
}={}){
 if([updateLevel,drawBackground,drawEntities,stopLegacyLoop].some(fn=>typeof fn!=='function')){
  throw new TypeError('Synchronous legacy handoff callbacks required');
 }
 if(typeof useEngineV1!=='boolean')throw new TypeError('useEngineV1 must be boolean');
 if(useEngineV1&&typeof restartLegacyLoop!=='function')throw new TypeError('restartLegacyLoop callback required when Engine V1 is enabled');
 // Do not construct EngineCore while the feature is disabled: it could resize the legacy canvas.
 let core=null;
 let started=false;
 function ensureCore(){
  if(!core)core=new EngineCore({
   canvas,renderer,particles,requestFrame,cancelFrame,
   update:(dt,engine)=>updateLevel(dt,engine),
   drawScene:(ctx,view,engine)=>{
    drawBackground(ctx,view,engine);
    drawEntities(ctx,view,engine);
    drawForeground(ctx,view,engine);
   }
  });
  return core;
 }
 return {
  get core(){return core;},
  get enabled(){return useEngineV1;},
  get running(){return core?.running??false;},
  start(){
   if(!useEngineV1)return false;
   if(started||core?.running)return false;
   // Synchronous stop owns cancellation; do not cancel the same legacy RAF twice.
   const stopped=stopLegacyLoop();
   if(stopped!==true)throw new TypeError('stopLegacyLoop must synchronously return true');
   try{
    const engine=ensureCore();
    onStart();
    engine.start();
    started=true;
    return true;
   }catch(err){
    // Roll back even if EngineCore construction or onStart fails.
    try{core?.stop();}catch(cleanupError){console.error('Engine V1 cleanup failed:',cleanupError);}
    started=false;
    try{onStop();}catch(cleanupError){console.error('Engine V1 onStop failed:',cleanupError);}
    console.error("Engine V1 failure. Rolling back to legacy loop:", err);
    try{restartLegacyLoop();}catch(rollbackError){
     console.error('Legacy loop restart failed:',rollbackError);
     throw new AggregateError([err,rollbackError],'Engine V1 and legacy rollback failed');
    }
    throw err;
   }
  },
  stop(){
   if(!started&&!core?.running)return false;
   core.stop();
   started=false;
   onStop();
   return true;
  }
 };
}
