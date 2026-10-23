/**
 * Authored first classic flight: the Chronos attack and the escape towards Gaia.
 * This model supplies one route position for scenery, mission gates and events.
 * The existing legacy loop owns update, drawing, collisions, input and saving.
 * It deliberately does not import the isolated Journey demo or another campaign.
 */
import {createVoyageRoute} from './voyage-engine.js';
import {S1_V1_CHRONOS_GAIA} from './voyages/s1-v1-chronos-gaia.js';

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
 * Viaje Chronos → Gaia en diez tramos. Desde la Fase A del motor de viaje por
 * fichas lo produce voyage-engine.js con la ficha S1-V1; estos nombres se
 * mantienen para el juego, los guardados y las pruebas existentes.
 */
const CHRONOS_VOYAGE_ROUTE = createVoyageRoute(S1_V1_CHRONOS_GAIA);
export const CHRONOS_VOYAGE_VERSION = S1_V1_CHRONOS_GAIA.version;
export const CHRONOS_VOYAGE_KEY = S1_V1_CHRONOS_GAIA.saveKey;
export const CHRONOS_VOYAGE_ROUTE_ID = S1_V1_CHRONOS_GAIA.routeId;
export const CHRONOS_VOYAGE_STAGES = CHRONOS_VOYAGE_ROUTE.stages;
export const CHRONOS_VOYAGE_MIN_DURATION = CHRONOS_VOYAGE_ROUTE.minDuration;

/** Explicit stage-entry helper for already-unlocked replay selection. */
export const createChronosVoyageCheckpoint = CHRONOS_VOYAGE_ROUTE.createCheckpoint;

/**
 * Pure/idempotent validation. Older flight, Journey and N-7 saves have no numeric
 * equivalence and are deliberately rejected without mutating the supplied value.
 */
export const normalizeChronosVoyageCheckpoint = CHRONOS_VOYAGE_ROUTE.normalizeCheckpoint;

/** One route clock, ten quota/time gates, one optional service interaction. */
export const createChronosVoyage = CHRONOS_VOYAGE_ROUTE.create;
