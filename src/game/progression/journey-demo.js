/**
 * Authored, isolated Chronos -> service relay -> Gaia proof of the journey loop.
 * The legacy loop owns time, combat, input, drawing and storage. This module owns
 * the one route clock. It deliberately does not import or migrate older saves.
 */
export const JOURNEY_DEMO_VERSION = 'chronos-gaia-demo-v1';
export const JOURNEY_DEMO_SAVE_KEY = 'neonCatcher.journeyDemo.v1';
export const JOURNEY_DEMO_MAX_DELTA = 0.034;
export const JOURNEY_DEMO_REWARD = 120;

const freezeEvent = event => Object.freeze(event);
export const JOURNEY_DEMO_SEGMENTS = Object.freeze([
  Object.freeze({
    id:'departure', chapter:1, stage:'demo-departure', name:'Salida de Chronos',
    origin:'Centro Chronos', destination:'Baliza de servicio C-9', duration:20,
    events:Object.freeze([
      freezeEvent({id:'departure-scout',type:'enemy',at:4,entityId:'chronos-scout',entry:'left',pattern:'scout'}),
      freezeEvent({id:'recovered-propulsion',type:'partAvailable',at:10,partId:'relay-drive',name:'Propulsor de relevo'})
    ])
  }),
  Object.freeze({
    id:'transit', chapter:1, stage:'demo-transit', name:'Corredor hacia Gaia',
    origin:'Baliza de servicio C-9', destination:'Aproximación a Gaia Nova', duration:24,
    events:Object.freeze([
      freezeEvent({id:'transit-scout',type:'enemy',at:8,entityId:'relay-scout',entry:'right',pattern:'scout'})
    ])
  }),
  Object.freeze({
    id:'border', chapter:1, stage:'demo-border', name:'Frontera Atlas',
    origin:'Aproximación a Gaia Nova', destination:'Acceso Atlas de Gaia Nova', duration:20,
    events:Object.freeze([
      freezeEvent({id:'atlas-guardian',type:'border',at:3,entityId:'atlas-guardian',entry:'top',pattern:'guardian'})
    ])
  })
]);

const TOTAL_DURATION = JOURNEY_DEMO_SEGMENTS.reduce((sum,segment)=>sum+segment.duration,0);
const NOOP = ()=>{};
const CHECKPOINT_IDS = Object.freeze(['chronos-departure','relay-station','relay-transit','atlas-border','gaia-arrival']);

function makeSave(checkpointId,partInstalled=false,collectedAtDeparture=false){
  const index=CHECKPOINT_IDS.indexOf(checkpointId),complete=index===4;
  return Object.freeze({
    schemaVersion:1,contentVersion:JOURNEY_DEMO_VERSION,checkpointId,
    partCollected:index>0||collectedAtDeparture,partInstalled:index>1||partInstalled,
    borderResolved:complete,completionRewardGranted:complete,
    credits:complete?JOURNEY_DEMO_REWARD:0
  });
}

/** A rejected save is preserved by the caller; recovery starts at Chronos. */
function readSave(saved){
  if(saved===undefined||saved===null)return {value:makeSave(CHECKPOINT_IDS[0]),recovery:'new'};
  let value=saved;
  try{if(typeof value==='string')value=JSON.parse(value);}catch{
    return {value:makeSave(CHECKPOINT_IDS[0]),recovery:'invalid-save'};
  }
  if(!value||typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==1||
    value.contentVersion!==JOURNEY_DEMO_VERSION||!CHECKPOINT_IDS.includes(value.checkpointId)){
    return {value:makeSave(CHECKPOINT_IDS[0]),recovery:'invalid-save'};
  }
  const canonical=makeSave(value.checkpointId,value.checkpointId==='relay-station'&&value.partInstalled===true,
    value.checkpointId==='chronos-departure'&&value.partCollected===true);
  if(Object.keys(canonical).some(key=>value[key]!==canonical[key])){
    return {value:makeSave(CHECKPOINT_IDS[0]),recovery:'invalid-save'};
  }
  return {value:canonical,recovery:'checkpoint'};
}

/**
 * API: snapshot(), checkpoint(), setPaused(boolean), advance(seconds, emit?),
 * collectPart(), serviceInstall(), resumeFromStation(), resolveBorder().
 * Mutating actions return true only when accepted; repeated rewards are false.
 * checkpoint() is the last coherent save, never an unsafe mid-combat snapshot.
 * advance emits enemy/partAvailable/station/segmentStart/border/complete objects.
 * Restarting an unfinished segment intentionally replays that segment's events;
 * a collected part remains banked at the segment's beginning and no currency
 * is awarded before Gaia arrival. Collection never grants duplicate currency.
 */
export function createJourneyDemo(saved){
  const restored=readSave(saved);
  let save=restored.value,segmentIndex=0,elapsed=0,phase='travel',paused=false;
  let partCollected=save.partCollected,partInstalled=save.partInstalled,partAvailable=false;
  let borderResolved=save.borderResolved,borderActive=false,credits=save.credits;
  const fired=new Set();
  if(save.checkpointId==='relay-station'){
    phase='station';elapsed=JOURNEY_DEMO_SEGMENTS[0].duration;
  }else if(save.checkpointId==='relay-transit'){
    segmentIndex=1;
  }else if(save.checkpointId==='atlas-border'){
    segmentIndex=2;
  }else if(save.checkpointId==='gaia-arrival'){
    segmentIndex=2;elapsed=JOURNEY_DEMO_SEGMENTS[2].duration;phase='complete';
  }

  function routeElapsed(){
    let total=elapsed;
    for(let index=0;index<segmentIndex;index++)total+=JOURNEY_DEMO_SEGMENTS[index].duration;
    return total;
  }

  function snapshot(){
    const segment=JOURNEY_DEMO_SEGMENTS[segmentIndex];
    return Object.freeze({
      version:JOURNEY_DEMO_VERSION,segmentId:segment.id,segmentIndex,
      segment,origin:segment.origin,destination:segment.destination,
      elapsed,segmentProgress:elapsed/segment.duration,
      routeElapsed:routeElapsed(),routeDuration:TOTAL_DURATION,routeProgress:routeElapsed()/TOTAL_DURATION,
      phase,paused,partAvailable,partCollected,partInstalled,
      engineBoost:partInstalled,propulsionMultiplier:partInstalled?1.2:1,
      borderActive,borderResolved,credits,completionRewardGranted:save.completionRewardGranted,
      waitingFor:phase==='station'?(partInstalled?'continue':'install'):
        phase==='travel'&&segmentIndex===0&&elapsed===segment.duration&&!partCollected?'part':
        phase==='travel'&&segmentIndex===2&&elapsed===segment.duration&&!borderResolved?'border':null,
      checkpointId:save.checkpointId,recovery:restored.recovery
    });
  }

  function emitEvent(emit,event){
    // Mark before invoking the runtime: callbacks cannot repeat an authored event.
    if(fired.has(event.id))return;
    fired.add(event.id);
    emit(Object.freeze({...event,segmentId:JOURNEY_DEMO_SEGMENTS[segmentIndex].id,version:JOURNEY_DEMO_VERSION}));
  }

  function advance(dt,emit=NOOP){
    if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative delta required');
    if(typeof emit!=='function')throw new TypeError('emit must be a function');
    if(paused||phase!=='travel')return snapshot();
    const segment=JOURNEY_DEMO_SEGMENTS[segmentIndex];
    elapsed=Math.min(segment.duration,elapsed+Math.min(dt,JOURNEY_DEMO_MAX_DELTA));
    for(const event of segment.events){
      if(elapsed<event.at||fired.has(event.id)||event.type==='partAvailable'&&partCollected)continue;
      if(event.type==='partAvailable'&&!partCollected)partAvailable=true;
      if(event.type==='border')borderActive=true;
      emitEvent(emit,event);
    }
    if(elapsed===segment.duration){
      if(segmentIndex===0&&partCollected){
        phase='station';save=makeSave('relay-station',partInstalled);
        emitEvent(emit,{id:'relay-arrival',type:'station',at:20,stationId:'relay-c9'});
      }else if(segmentIndex===1){
        segmentIndex=2;elapsed=0;save=makeSave('atlas-border');
        emitEvent(emit,{id:'border-start',type:'segmentStart',at:0});
      }else if(segmentIndex===2&&borderResolved){
        phase='complete';credits=JOURNEY_DEMO_REWARD;save=makeSave('gaia-arrival');
        emitEvent(emit,{id:'gaia-arrival',type:'complete',at:20,reward:JOURNEY_DEMO_REWARD});
      }
    }
    return snapshot();
  }

  return Object.freeze({
    snapshot,
    checkpoint:()=>save,
    setPaused(value){
      if(typeof value!=='boolean')throw new TypeError('paused must be boolean');
      paused=value;return snapshot();
    },
    advance,
    collectPart(){
      if(paused||phase!=='travel'||segmentIndex!==0||!partAvailable||partCollected)return false;
      partCollected=true;partAvailable=false;save=makeSave('chronos-departure',false,true);return true;
    },
    serviceInstall(){
      if(paused||phase!=='station'||!partCollected||partInstalled)return false;
      partInstalled=true;save=makeSave('relay-station',true);return true;
    },
    resumeFromStation(){
      if(paused||phase!=='station'||!partInstalled)return false;
      phase='travel';segmentIndex=1;elapsed=0;save=makeSave('relay-transit');return true;
    },
    resolveBorder(){
      if(paused||phase!=='travel'||segmentIndex!==2||!borderActive||borderResolved)return false;
      borderResolved=true;borderActive=false;return true;
    }
  });
}
