// Copia CONGELADA del motor del viaje 1 (chronos-flight.js, commit 1e9218f).
// Solo para la prueba de equivalencia del motor de viaje por fichas: no se edita.
/**
 * Authored first classic flight: the Chronos attack and the escape towards Gaia.
 * This model supplies one route position for scenery, mission gates and events.
 * The existing legacy loop owns update, drawing, collisions, input and saving.
 * It deliberately does not import the isolated Journey demo or another campaign.
 */
export const CHRONOS_FLIGHT_VERSION = 'chronos-flight-v1';
export const CHRONOS_FLIGHT_MIN_DURATION = 60;
export const CHRONOS_FLIGHT_MAX_DELTA = .034;

const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));
const smooth = (value,start,end)=>{
  const t=clamp((value-start)/(end-start),0,1);
  return t*t*(3-2*t);
};
const immutable = object=>Object.freeze(object);
const NOOP = ()=>{};

export const CHRONOS_FLIGHT_EVENTS = immutable([
  immutable({id:'chronos-intruder',type:'attack',at:.025,attackerId:'cronium-raider',targetId:'chronos-reactor'}),
  immutable({id:'chronos-breach',type:'rupture',at:.10,resourceId:'cronium',cause:'hostile-reactor-strike'}),
  immutable({id:'chronos-perimeter-exit',type:'departure',at:.30,originId:'chronos-scientific-centre'}),
  immutable({id:'chronos-recovered-module',type:'twin-module-marker',at:.60,moduleId:'twin-emitter',resourceId:'cronium'}),
  immutable({id:'gaia-navigation-beacon',type:'gaia-beacon',at:.83,destinationId:'gaia-atlas-approach'}),
  immutable({id:'chronos-flight-arrival',type:'arrival',at:1,destinationId:'gaia-atlas-approach'})
]);

const PHASES = immutable([
  immutable({id:'emergency',from:0,to:.10,name:'Emergencia en Chronos'}),
  immutable({id:'recovery',from:.10,to:.30,name:'Recuperar el CRONIUM disperso'}),
  immutable({id:'departure',from:.30,to:.52,name:'Salir del perímetro orbital'}),
  immutable({id:'deep-space',from:.52,to:.82,name:'Rastro de CRONIUM en espacio profundo'}),
  immutable({id:'gaia-approach',from:.82,to:1,name:'Aproximación a la baliza de Gaia'})
]);

/**
 * createChronosFlight({goal=36,minDuration=60}) returns advance(dt,collected,emit?)
 * and snapshot(). dt=0 freezes every part of the model, including mission input.
 * Collected is the actual classic collection count; this module never awards it.
 *
 * Without all fragments the ship remains in a recovery corridor before arrival.
 * An early collection keeps the designed flight; a late collection opens the
 * remaining approach at normal speed, rather than teleporting to the endpoint.
 * Snapshot positions/sizes are viewport fractions, not changes to hitboxes.
 */
export function createChronosFlight({goal=36,minDuration=CHRONOS_FLIGHT_MIN_DURATION}={}){
  if(!Number.isInteger(goal)||goal<1)throw new RangeError('goal must be a positive integer');
  if(!Number.isFinite(minDuration)||minDuration<20)throw new RangeError('minDuration must be at least 20 seconds');
  let elapsed=0,routeProgress=0,collected=0;
  const fired=new Set();

  function snapshot(){
    const p=routeProgress,phase=PHASES.find(candidate=>p<candidate.to)||PHASES[PHASES.length-1];
    const departure=smooth(p,.08,.60),approach=smooth(p,.58,1);
    const attackApproach=smooth(p,.015,.055),attackExit=smooth(p,.12,.24);
    const objectiveComplete=collected>=goal,canFinish=objectiveComplete&&p===1;
    const reactorState=p<.07?'stable':p<.10?'struck':'ruptured';
    const attackerState=p<.055?'approach':p<.07?'charge':p<.10?'fire':'retreat';
    return immutable({
      version:CHRONOS_FLIGHT_VERSION,elapsed,minDuration,routeProgress:p,
      phase:canFinish?'arrived':phase.id,stageName:canFinish?'Acceso a Gaia localizado':phase.name,
      origin:'Centro Chronos',destination:'Baliza de acceso a Gaia Nova',
      collected,goal,remaining:Math.max(0,goal-collected),collectionFraction:collected/goal,
      objectiveComplete,canFinish,recoveryActive:p>=.10&&!canFinish,
      waitingFor:!objectiveComplete&&p>=.66+.20*(collected/goal)-1e-10?'cronium':null,
      // The origin physically retreats and becomes smaller; alpha stays one.
      // Keep the reactor below the tactical HUD during its rupture. Its exit
      // endpoint and route timing stay unchanged; this is backdrop framing.
      station:immutable({x:.48-.72*departure,y:.43+.94*departure,
        scale:1.12*Math.pow(.075,departure),rotation:-.10*departure,
        visible:p<.62,alpha:1,state:reactorState}),
      // Gaia is a distant destination that grows during the approach.
      planet:immutable({x:.79-.15*approach,y:.06+.03*approach,
        scale:.035+.69*approach*approach,rotation:.06*p,visible:true,alpha:1}),
      beacon:immutable({x:.54+.08*(1-approach),y:.16+.10*approach,
        scale:.018+.21*approach,visible:p>=.78,alpha:1,active:p>=.83}),
      attacker:immutable({x:1.12-.48*attackApproach-.95*attackExit,
        y:.13+.11*attackApproach-.15*attackExit,
        scale:.10+.07*attackApproach-.05*attackExit,
        rotation:-.18-.65*attackExit,visible:p>=.015&&p<.24,state:attackerState}),
      deepSpace:immutable({travel:p,offsetX:-.09*p,offsetY:.54*p,
        speed:.22+.78*smooth(p,.25,.56),alpha:1}),
      debris:immutable({visible:p>=.10&&!canFinish,travel:p,
        directionX:-.28,directionY:.96,depth:smooth(p,.10,.45)}),
      distance:immutable({unit:'tramo',covered:p,total:1})
    });
  }

  function advance(dt,collectionCount=collected,emit=NOOP){
    if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative delta required');
    if(!Number.isFinite(collectionCount)||collectionCount<0)throw new RangeError('collectionCount must be nonnegative');
    if(typeof emit!=='function')throw new TypeError('emit must be a function');
    if(dt===0||routeProgress===1)return snapshot();
    const step=Math.min(dt,CHRONOS_FLIGHT_MAX_DELTA);
    elapsed+=step;
    collected=Math.min(goal,Math.max(collected,Math.floor(collectionCount)));
    const collectionCap=collected>=goal?1:.66+.20*(collected/goal);
    const target=Math.min(1,elapsed/minDuration,collectionCap);
    routeProgress=Math.min(target,routeProgress+step/minDuration);
    // Floating point accumulation must not leave a permanently unreachable end.
    if(collected>=goal&&1-routeProgress<1e-10&&elapsed>=minDuration-1e-8)routeProgress=1;
    for(const event of CHRONOS_FLIGHT_EVENTS){
      if(routeProgress+1e-10<event.at||fired.has(event.id))continue;
      // Mark before invoking runtime code so a thrown callback cannot respawn it.
      fired.add(event.id);
      emit(immutable({...event,version:CHRONOS_FLIGHT_VERSION,elapsed,routeProgress}));
    }
    return snapshot();
  }

  return immutable({advance,snapshot});
}

/**
 * The ten authored crossings replace the compressed live first flight. V1 above
 * remains an unchanged, reproducible historical model. These are stages inside
 * the first classic territory, not replacements for the ten classic worlds.
 */
export const CHRONOS_VOYAGE_VERSION = 'chronos-voyage-v2';
export const CHRONOS_VOYAGE_KEY = 'neonCatcher.chronosVoyage.v2';
export const CHRONOS_VOYAGE_ROUTE_ID = 'chronos-to-gaia';
const VOYAGE_STAGE_DATA = [
  ['Emergencia en Chronos',36,4,'Recupera los primeros fragmentos del reactor','Chronos · reactor','Perímetro destruido','reactor-strike',.18,.70,.36],
  ['Perímetro destruido',36,8,'Cruza los restos y recupera el rastro de CRONIUM','Perímetro destruido','Campo de restos','wreckage-crossing',.15,.80,.48],
  ['Campo de restos',36,12,'Sigue el rastro y rescata el emisor si lo encuentras','Campo de restos','Salida orbital','recoverable-module',.12,.72,.56],
  ['Salida orbital',36,16,'Abandona la órbita de Chronos sin perder la señal','Salida orbital','Corredor exterior','origin-retreat',.08,.52,.42],
  ['El gran vacío',38,18,'Atraviesa el vacío; observa el cometa anunciado','Corredor exterior','Corredor de enlace','comet-crossing',.025,.26,.22],
  ['Enlace C9',32,18,'Configura la nave desde C9 en el HUD mientras sigues el corredor','Corredor de enlace','Ruta exterior de Gaia','service-stop',.035,.34,.12],
  ['Estela de regreso',38,24,'Prueba tu nave y recupera la señal en espacio abierto','Ruta exterior de Gaia','Ruta de Gaia','equipment-trial',.025,.28,.44],
  ['Gaia en la distancia',36,28,'Mantén la ruta hacia el planeta que crece al frente','Ruta de Gaia','Baliza exterior de Gaia','destination-reveal',.06,.40,.52],
  ['Señales de Atlas',36,32,'Cruza la patrulla y localiza el acceso orbital','Baliza exterior de Gaia','Acceso orbital de Gaia','atlas-identification',.12,.52,.72],
  ['Llegada a Gaia',36,36,'Completa el rastro y alcanza la baliza de llegada','Acceso orbital de Gaia','Baliza de acceso a Gaia Nova','persistent-arrival',.18,.62,.82]
];
let voyageOffset = 0;
export const CHRONOS_VOYAGE_STAGES = immutable(VOYAGE_STAGE_DATA.map((data,index)=>{
  const [name,duration,goal,objective,origin,destination,event,nebulaOpacity,starDensity,threatRate]=data;
  const stage=immutable({id:`1.${index+1}`,stageId:`1.${index+1}`,number:index+1,stageNumber:index+1,
    chapter:1,contentVersion:CHRONOS_VOYAGE_VERSION,routeId:CHRONOS_VOYAGE_ROUTE_ID,
    name,duration,goal,objective,origin,destination,event,offset:voyageOffset,
    nebulaOpacity,starDensity,threatRate});
  voyageOffset+=duration;
  return stage;
}));
export const CHRONOS_VOYAGE_MIN_DURATION = voyageOffset;
const voyageGoal=(stage,goal)=>Math.ceil(stage.goal*goal/36);
const validateVoyageGoal=goal=>{
  if(!Number.isInteger(goal)||goal<1)throw new RangeError('goal must be a positive integer');
};
const entryEventId=number=>`chronos-voyage:1.${number}:start`;
const checkpointEventId=number=>`chronos-voyage:1.${number}:checkpoint`;
const completionEventId=number=>`chronos-voyage:1.${number}:complete`;
const VOYAGE_EVENTS=immutable([
  immutable({id:'chronos-voyage-intruder',type:'attack',at:2.25,attackerId:'cronium-raider',targetId:'chronos-reactor'}),
  immutable({id:'chronos-voyage-breach',type:'rupture',at:9,resourceId:'cronium',cause:'hostile-reactor-strike'}),
  immutable({id:'chronos-voyage-perimeter-exit',type:'departure',at:108,originId:'chronos-scientific-centre'}),
  immutable({id:'chronos-voyage-recovered-module',type:'twin-module-marker',at:90,moduleId:'twin-emitter',resourceId:'cronium'}),
  immutable({id:'chronos-voyage-gaia-beacon',type:'gaia-beacon',at:292,destinationId:'gaia-atlas-approach'})
]);
const SERVICE_EVENT_ID='chronos-voyage:1.6:service';
const SERVICE_COMPLETE_ID='chronos-voyage:1.6:service-complete';
// Dock when the short, visible approach reaches the hangar, not thirty seconds
// after the station is already in front of the pilot. The remaining authored
// stage time is the departure leg after servicing; no route seconds are skipped.
const SERVICE_APPROACH_SECONDS=1.2;
const SERVICE_VISIBLE_APPROACH_SECONDS=2.4;
const SERVICE_DEPARTURE_SECONDS=2.4;
const ARRIVAL_EVENT_ID='chronos-voyage-arrival';
const validVoyageEventIds=new Set([
  ...VOYAGE_EVENTS.map(event=>event.id),SERVICE_EVENT_ID,SERVICE_COMPLETE_ID,ARRIVAL_EVENT_ID,
  ...CHRONOS_VOYAGE_STAGES.flatMap(stage=>[entryEventId(stage.number),checkpointEventId(stage.number),completionEventId(stage.number)])
]);

function checkpointForStage(stageNumber,goal,collected,eventIds=[],serviceWaiting=false){
  const stage=CHRONOS_VOYAGE_STAGES[stageNumber-1];
  return immutable({version:2,contentVersion:CHRONOS_VOYAGE_VERSION,routeId:CHRONOS_VOYAGE_ROUTE_ID,
    stageIndex:stageNumber-1,stageId:stage.id,stageNumber,goal,collected,
    eventIds:immutable([...new Set(eventIds)]),...(serviceWaiting?{serviceWaiting:true}:{})});
}

/** Explicit stage-entry helper for already-unlocked replay selection. */
export function createChronosVoyageCheckpoint(stageNumber=1,{goal=36,collected}={}){
  validateVoyageGoal(goal);
  if(!Number.isInteger(stageNumber)||stageNumber<1||stageNumber>10)throw new RangeError('stageNumber must be between 1 and 10');
  const minimum=stageNumber===1?0:voyageGoal(CHRONOS_VOYAGE_STAGES[stageNumber-2],goal);
  const count=collected===undefined?minimum:collected;
  if(!Number.isFinite(count)||count<minimum)throw new RangeError('collected is below the stage entry requirement');
  const boundary=CHRONOS_VOYAGE_STAGES[stageNumber-1].offset;
  const events=VOYAGE_EVENTS.filter(event=>event.at<=boundary).map(event=>event.id);
  for(let number=1;number<stageNumber;number++)events.push(entryEventId(number),checkpointEventId(number),completionEventId(number));
  if(stageNumber>6)events.push(SERVICE_EVENT_ID,SERVICE_COMPLETE_ID);
  return checkpointForStage(stageNumber,goal,Math.min(goal,Math.floor(count)),events);
}

/**
 * Pure/idempotent validation. Older flight, Journey and N-7 saves have no numeric
 * equivalence and are deliberately rejected without mutating the supplied value.
 * The caller preserves rejected raw data before replacing its separate v2 key.
 */
export function normalizeChronosVoyageCheckpoint(value,{goal=36}={}){
  validateVoyageGoal(goal);
  if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==2||
    value.contentVersion!==CHRONOS_VOYAGE_VERSION||value.routeId!==CHRONOS_VOYAGE_ROUTE_ID||
    value.goal!==goal||!Number.isInteger(value.stageNumber)||value.stageNumber<1||value.stageNumber>10||
    value.stageIndex!==value.stageNumber-1||value.stageId!==`1.${value.stageNumber}`||
    !Number.isFinite(value.collected)||value.collected<0||!Array.isArray(value.eventIds)||
    value.eventIds.some(id=>typeof id!=='string'||!validVoyageEventIds.has(id))||
    (value.serviceWaiting!==undefined&&typeof value.serviceWaiting!=='boolean')||
    (value.serviceWaiting&&value.stageNumber!==6))return null;
  const collected=Math.min(goal,Math.floor(value.collected));
  const minimum=value.stageNumber===1?0:voyageGoal(CHRONOS_VOYAGE_STAGES[value.stageNumber-2],goal);
  if(collected<minimum||(value.serviceWaiting&&collected<voyageGoal(CHRONOS_VOYAGE_STAGES[5],goal)))return null;
  // Rebuild known history from geography rather than trusting supplied IDs to
  // suppress a future attack, module or arrival. Current entry IDs and the
  // coherent current C9 milestone below are the only supplied IDs retained.
  const canonical=createChronosVoyageCheckpoint(value.stageNumber,{goal,collected});
  const currentIds=value.eventIds.filter(id=>id===entryEventId(value.stageNumber)||id===checkpointEventId(value.stageNumber));
  // Existing IDs also describe the new early dock/undock checkpoint. Preserve
  // their valid pair only in1.6; arbitrary future events still cannot hide a
  // module or arrival. Old waiting saves include1.6:complete and retain their
  // old end-of-stage boundary rather than being moved backward on reload.
  if(value.stageNumber===6){
    const completedServicePair=value.eventIds.includes(SERVICE_EVENT_ID)&&value.eventIds.includes(SERVICE_COMPLETE_ID);
    if((value.serviceWaiting||completedServicePair)&&value.eventIds.includes(completionEventId(6)))currentIds.push(completionEventId(6));
    if(!value.serviceWaiting&&completedServicePair){
      currentIds.push(SERVICE_EVENT_ID,SERVICE_COMPLETE_ID);
    }
  }
  return checkpointForStage(value.stageNumber,goal,collected,[...canonical.eventIds,...currentIds,
    ...(value.serviceWaiting?[SERVICE_EVENT_ID]:[])],Boolean(value.serviceWaiting));
}

/** One route clock, ten quota/time gates, one optional service interaction. */
export function createChronosVoyage({goal=36,checkpoint=null}={}){
  validateVoyageGoal(goal);
  const restored=checkpoint===null?null:normalizeChronosVoyageCheckpoint(checkpoint,{goal});
  if(checkpoint!==null&&!restored)throw new TypeError('Invalid Chronos voyage checkpoint');
  let stageIndex=restored?.stageIndex||0,collected=restored?.collected||0;
  const restoredServiceCompleted=stageIndex===5&&restored?.eventIds.includes(SERVICE_COMPLETE_ID);
  const restoredLegacyService=stageIndex===5&&restored?.eventIds.includes(completionEventId(6))&&
    (restored.serviceWaiting||restoredServiceCompleted);
  let stageElapsed=restoredLegacyService?CHRONOS_VOYAGE_STAGES[stageIndex].duration:
    restored?.serviceWaiting||restoredServiceCompleted?SERVICE_APPROACH_SECONDS:0;
  let serviceWaiting=Boolean(restored?.serviceWaiting),arrived=false;
  const fired=new Set(restored?.eventIds||[]);
  let entryCheckpoint=restored||createChronosVoyageCheckpoint(1,{goal});

  function exportCheckpoint(){
    if(serviceWaiting)return checkpointForStage(6,goal,collected,[...fired],true);
    return entryCheckpoint;
  }

  function snapshot(){
    const stage=CHRONOS_VOYAGE_STAGES[stageIndex],stageProgress=clamp(stageElapsed/stage.duration,0,1);
    const elapsed=stage.offset+stageElapsed,p=elapsed/CHRONOS_VOYAGE_MIN_DURATION;
    const departure=smooth(p,.025,.43),approach=smooth(p,.70,1),stageGoal=voyageGoal(stage,goal);
    const attackApproach=smooth(elapsed,1.35,4.95),attackExit=smooth(elapsed,10.8,21.6);
    const objectiveComplete=collected>=goal,quotaComplete=collected>=stageGoal;
    const reactorState=elapsed<6.3?'stable':elapsed<9?'struck':'ruptured';
    const attackerState=elapsed<4.95?'approach':elapsed<6.3?'charge':elapsed<9?'fire':'retreat';
    const phase=arrived?'arrived':stageIndex===0?(elapsed<9?'emergency':'recovery'):
      stageIndex<3?'recovery':stageIndex===3?'departure':stageIndex<7?'deep-space':'gaia-approach';
    const serviceCompleted=fired.has(SERVICE_COMPLETE_ID);
    const serviceAt=CHRONOS_VOYAGE_STAGES[5].offset+SERVICE_APPROACH_SECONDS;
    const relayArrival=smooth(elapsed,serviceAt-SERVICE_VISIBLE_APPROACH_SECONDS,serviceAt);
    const relayExit=serviceCompleted&&stageIndex===5
      ?smooth(stageElapsed,SERVICE_APPROACH_SECONDS,SERVICE_APPROACH_SECONDS+SERVICE_DEPARTURE_SECONDS):0;
    const relayVisible=stageIndex<=5&&elapsed>=serviceAt-SERVICE_VISIBLE_APPROACH_SECONDS&&
      (!serviceCompleted||relayExit<1);
    const relayState=serviceWaiting?'service':serviceCompleted?'departing':relayArrival<.48?'approach':'docking';
    return immutable({version:CHRONOS_VOYAGE_VERSION,contentVersion:CHRONOS_VOYAGE_VERSION,
      routeId:CHRONOS_VOYAGE_ROUTE_ID,chapter:1,elapsed,minDuration:CHRONOS_VOYAGE_MIN_DURATION,
      cinematicDuration:90,routeProgress:p,phase,stageId:stage.id,stageNumber:stage.number,
      stageName:stageIndex===5&&serviceCompleted?'Corredor de Gaia':stage.name,stageProgress,stageElapsed,stageDuration:stage.duration,
      stageGoal,stageObjective:stageIndex===5&&serviceCompleted?'Prueba tu nave en el corredor; C9 continúa disponible en el panel':stage.objective,
      stageOrigin:stage.origin,stageDestination:stage.destination,
      stageEvent:stage.event,stageQuotaComplete:quotaComplete,threatRate:stage.threatRate,
      origin:'Centro Chronos',destination:'Baliza de acceso a Gaia Nova',
      collected,goal,remaining:Math.max(0,goal-collected),collectionFraction:collected/goal,
      objectiveComplete,canFinish:arrived,recoveryActive:elapsed>=9&&!arrived,
      waitingFor:serviceWaiting?'service':stageProgress===1&&!quotaComplete?'cronium':null,
      station:immutable({x:.48-.72*departure,y:.43+.94*departure,
        scale:1.12*Math.pow(.032,departure),rotation:-.10*departure,
        visible:p<.44,alpha:1,state:reactorState}),
      planet:immutable({x:.79-.15*approach,y:.06+.03*approach,
        scale:.014+.71*approach*approach,rotation:.06*p,visible:true,alpha:1}),
      beacon:immutable({x:.54+.08*(1-approach),y:.16+.10*approach,
        scale:.012+.216*approach,visible:p>=.80,alpha:1,active:p>=292/360}),
      relay:immutable({visible:relayVisible,x:.77-.09*relayArrival-.48*relayExit,
        y:.08+.16*relayArrival+.84*relayExit,
        scale:(.025+.15*relayArrival)*(1-.85*relayExit),alpha:1,active:serviceWaiting,state:relayState}),
      attacker:immutable({x:1.12-.48*attackApproach-.95*attackExit,
        y:.13+.11*attackApproach-.15*attackExit,
        scale:.10+.07*attackApproach-.05*attackExit,
        rotation:-.18-.65*attackExit,visible:elapsed>=1.35&&elapsed<21.6,state:attackerState}),
      deepSpace:immutable({travel:p,offsetX:-.16*p,offsetY:2.4*p,
        speed:.20+.80*smooth(p,.25,.46),alpha:1,nebulaOpacity:stage.nebulaOpacity,
        starDensity:stage.starDensity,dustDensity:stageIndex>=4&&stageIndex<=6?.10:.32}),
      debris:immutable({visible:elapsed>=9&&!arrived,travel:p,directionX:-.28,directionY:.96,
        depth:smooth(p,.025,.35),density:stageIndex>=4&&stageIndex<=6?.22:.70}),
      distance:immutable({unit:'tramo',covered:p,total:1,stage:stage.number,stages:10})
    });
  }

  function emitOnce(event,emit){
    if(fired.has(event.id))return;
    fired.add(event.id);
    if(event.type==='checkpoint')entryCheckpoint=checkpointForStage(stageIndex+1,goal,collected,[...fired]);
    if(event.type==='service-complete')entryCheckpoint=checkpointForStage(stageIndex+1,goal,collected,[...fired]);
    emit(immutable({...event,version:CHRONOS_VOYAGE_VERSION,stageId:`1.${stageIndex+1}`,
      stageNumber:stageIndex+1,elapsed:CHRONOS_VOYAGE_STAGES[stageIndex].offset+stageElapsed,
      routeProgress:snapshot().routeProgress,...(event.type==='checkpoint'?{checkpoint:entryCheckpoint}:{})}));
  }

  function ensureEntryEvents(emit){
    emitOnce({id:entryEventId(stageIndex+1),type:'stage-start'},emit);
    emitOnce({id:checkpointEventId(stageIndex+1),type:'checkpoint'},emit);
  }

  function enterNextStage(emit){
    stageIndex++;stageElapsed=0;
    entryCheckpoint=checkpointForStage(stageIndex+1,goal,collected,[...fired]);
    ensureEntryEvents(emit);
  }

  function resolveService(emit=NOOP){
    if(typeof emit!=='function')throw new TypeError('emit must be a function');
    if(!serviceWaiting)return snapshot();
    serviceWaiting=false;
    emitOnce({id:SERVICE_COMPLETE_ID,type:'service-complete'},emit);
    // Old saves docked at the original end of1.6. Their confirmation still
    // enters1.7 immediately. Fresh early arrivals first fly the departure leg.
    if(stageElapsed===CHRONOS_VOYAGE_STAGES[stageIndex].duration)enterNextStage(emit);
    return snapshot();
  }

  function advance(dt,collectionCount=collected,emit=NOOP){
    if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative delta required');
    if(!Number.isFinite(collectionCount)||collectionCount<0)throw new RangeError('collectionCount must be nonnegative');
    if(typeof emit!=='function')throw new TypeError('emit must be a function');
    if(dt===0||arrived||serviceWaiting)return snapshot();
    ensureEntryEvents(emit);
    collected=Math.min(goal,Math.max(collected,Math.floor(collectionCount)));
    const stage=CHRONOS_VOYAGE_STAGES[stageIndex];
    stageElapsed=Math.min(stage.duration,stageElapsed+Math.min(dt,CHRONOS_FLIGHT_MAX_DELTA));
    if(stage.duration-stageElapsed<1e-8)stageElapsed=stage.duration;
    const elapsed=stage.offset+stageElapsed;
    for(const event of VOYAGE_EVENTS){
      if(elapsed+1e-10>=event.at)emitOnce(event,emit);
    }
    if(stage.number===6&&!fired.has(SERVICE_COMPLETE_ID)&&stageElapsed+1e-10>=SERVICE_APPROACH_SECONDS&&
      collected>=voyageGoal(stage,goal)){
      // Snap the reached dock to its exact geographical boundary. Each update
      // is capped; no unseen frame may add delay before opening the real UI.
      stageElapsed=SERVICE_APPROACH_SECONDS;
      serviceWaiting=true;
      emitOnce({id:SERVICE_EVENT_ID,type:'service',stationId:'c9'},emit);
      return snapshot();
    }
    if(stageElapsed===stage.duration&&collected>=voyageGoal(stage,goal)){
      emitOnce({id:completionEventId(stage.number),type:'stage-complete'},emit);
      if(stage.number===10){
        arrived=true;
        emitOnce({id:ARRIVAL_EVENT_ID,type:'arrival',destinationId:'gaia-atlas-approach'},emit);
      }else enterNextStage(emit);
    }
    return snapshot();
  }

  return immutable({advance,snapshot,exportCheckpoint,resolveService});
}
