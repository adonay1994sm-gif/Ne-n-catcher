import {EngineCore} from './EngineCore.js';

/** Explicitly disabled by default. This module is not imported by the legacy campaign. */
export const USE_ENGINE_V1 = false;
export const CAMPAIGN_STATES = Object.freeze({LEGACY_ACTIVE:'LEGACY_ACTIVE',HANDOFF:'HANDOFF',ENGINE_ACTIVE:'ENGINE_ACTIVE',FALLBACK:'FALLBACK'});

/** Resolve the legacy IIFE bridge only on explicit opt-in. */
export function getNeonLegacyLoopBridge(host=globalThis){
 const bridge=host?.NeonLegacyLoopBridge;
 if(typeof bridge?.stopLegacyLoop!=='function'||typeof bridge?.restartLegacyLoop!=='function'){
  throw new TypeError('NeonLegacyLoopBridge lifecycle callbacks unavailable');
 }
 return bridge;
}


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
 let lifecycle=CAMPAIGN_STATES.LEGACY_ACTIVE;
 function recover(error){
  if(lifecycle===CAMPAIGN_STATES.LEGACY_ACTIVE||lifecycle===CAMPAIGN_STATES.FALLBACK)return false;
  lifecycle=CAMPAIGN_STATES.FALLBACK;
  try{core?.stop();}catch(e){console.error('Engine V1 cleanup failed:',e);}
  started=false;
  try{onStop();}catch(e){console.error('Engine V1 onStop failed:',e);}
  console.error('Engine V1 failure. Rolling back to legacy loop:',error);
  try{restartLegacyLoop();lifecycle=CAMPAIGN_STATES.LEGACY_ACTIVE;return true;}
  catch(e){console.error('Legacy loop restart failed:',e);throw new AggregateError([error,e],'Engine V1 and legacy rollback failed');}
 }
 function ensureCore(){
  if(!core)core=new EngineCore({
   canvas,renderer,particles,requestFrame,cancelFrame,onError:(error)=>recover(error),
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
  get lifecycle(){return lifecycle;},
  get enabled(){return useEngineV1;},
  get running(){return core?.running??false;},
  start(){
   if(!useEngineV1)return false;
   if(started||core?.running)return false;
   // Synchronous stop owns cancellation; do not cancel the same legacy RAF twice.
   lifecycle=CAMPAIGN_STATES.HANDOFF;
   let stopped=false;
   try{
    stopped=stopLegacyLoop();
    if(stopped!==true)throw new TypeError('stopLegacyLoop must synchronously return true');
    const engine=ensureCore();
    onStart();
    engine.start();
    started=true;
    lifecycle=CAMPAIGN_STATES.ENGINE_ACTIVE;
    return true;
   }catch(err){
    lifecycle=CAMPAIGN_STATES.FALLBACK;
    if(stopped===true){
     // recover handles cleanup and restoration after successful legacy stop.
     lifecycle=CAMPAIGN_STATES.HANDOFF;
     recover(err);
    }else{
     try{core?.stop();}catch(cleanupError){console.error('Engine V1 cleanup failed:',cleanupError);}
     lifecycle=CAMPAIGN_STATES.LEGACY_ACTIVE;
    }
    throw err;
   }
  },
  stop({restoreLegacy=false}={}){
   if(!started&&!core?.running)return false;
   core.stop();
   started=false;
   try{onStop();}finally{
    if(restoreLegacy){
     lifecycle=CAMPAIGN_STATES.FALLBACK;
     restartLegacyLoop();
     lifecycle=CAMPAIGN_STATES.LEGACY_ACTIVE;
    }else lifecycle=CAMPAIGN_STATES.HANDOFF;
   }
   return true;
  }
 };
}

/** Controlled wiring: no bridge access or RAF changes while disabled. */
export function createBridgedCampaignAdapter(options={}){
 const enabled=options.useEngineV1??USE_ENGINE_V1;
 if(!enabled)return createCampaignAdapter({...options,useEngineV1:false,stopLegacyLoop:options.stopLegacyLoop??(()=>true)});
 const bridge=getNeonLegacyLoopBridge(options.host??globalThis);
 return createCampaignAdapter({...options,useEngineV1:true,stopLegacyLoop:bridge.stopLegacyLoop,restartLegacyLoop:bridge.restartLegacyLoop});
}
