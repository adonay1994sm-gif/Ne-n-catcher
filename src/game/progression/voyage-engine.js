/**
 * Motor de viaje por fichas. Un viaje es una ficha de datos (tramos, eventos,
 * C9, paisaje) y este motor le da un único reloj de ruta, puertas de cuota y
 * tiempo por tramo, puntos de guardado y una parada de servicio opcional.
 * Es el motor del viaje Chronos → Gaia generalizado: con su ficha produce
 * exactamente las mismas vistas, eventos y guardados (ver
 * tests/voyage-engine-equivalence.test.mjs).
 *
 * Puro: no dibuja, no guarda, no toca el DOM. El juego avanza el reloj.
 */
export const VOYAGE_MAX_DELTA = .034;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const smooth = (value, start, end) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};
const immutable = object => Object.freeze(object);
const NOOP = () => {};

/**
 * Ficha (campos):
 *  chapter, version, saveKey, routeId, eventPrefix, baseGoal, origin,
 *  destination, arrivalDestinationId, cinematicDuration, recoveryAt,
 *  stages: [[name, duration, goal, objective, origin, destination, event,
 *            nebulaOpacity, starDensity, threatRate], ...],
 *  events: [{id, type, at (s), ...}],
 *  service: {stage, approach, visibleApproach, departure, renamedStage, renamedObjective} | null,
 *  phase(stageIndex, elapsed) → nombre de fase,
 *  scenery({elapsed, p, stageIndex, stage, arrived, relay}) → objetos de paisaje.
 */
export function createVoyageRoute(ficha) {
  const {chapter, version, routeId, eventPrefix, baseGoal, service} = ficha;
  const stageCount = ficha.stages.length;
  let offset = 0;
  const STAGES = immutable(ficha.stages.map((data, index) => {
    const [name, duration, goal, objective, origin, destination, event, nebulaOpacity, starDensity, threatRate] = data;
    const stage = immutable({id: `${chapter}.${index + 1}`, stageId: `${chapter}.${index + 1}`, number: index + 1, stageNumber: index + 1,
      chapter, contentVersion: version, routeId,
      name, duration, goal, objective, origin, destination, event, offset,
      nebulaOpacity, starDensity, threatRate});
    offset += duration;
    return stage;
  }));
  const MIN_DURATION = offset;
  const voyageGoal = (stage, goal) => Math.ceil(stage.goal * goal / baseGoal);
  const validateGoal = goal => {
    if (!Number.isInteger(goal) || goal < 1) throw new RangeError('goal must be a positive integer');
  };
  const entryEventId = number => `${eventPrefix}:${chapter}.${number}:start`;
  const checkpointEventId = number => `${eventPrefix}:${chapter}.${number}:checkpoint`;
  const completionEventId = number => `${eventPrefix}:${chapter}.${number}:complete`;
  const EVENTS = immutable(ficha.events.map(event => immutable({...event})));
  const SERVICE_EVENT_ID = service ? `${eventPrefix}:${chapter}.${service.stage}:service` : null;
  const SERVICE_COMPLETE_ID = service ? `${eventPrefix}:${chapter}.${service.stage}:service-complete` : null;
  const serviceIndex = service ? service.stage - 1 : -1;
  const ARRIVAL_EVENT_ID = `${eventPrefix}-arrival`;
  const validEventIds = new Set([
    ...EVENTS.map(event => event.id), ...(service ? [SERVICE_EVENT_ID, SERVICE_COMPLETE_ID] : []), ARRIVAL_EVENT_ID,
    ...STAGES.flatMap(stage => [entryEventId(stage.number), checkpointEventId(stage.number), completionEventId(stage.number)])
  ]);

  function checkpointForStage(stageNumber, goal, collected, eventIds = [], serviceWaiting = false) {
    const stage = STAGES[stageNumber - 1];
    return immutable({version: 2, contentVersion: version, routeId,
      stageIndex: stageNumber - 1, stageId: stage.id, stageNumber, goal, collected,
      eventIds: immutable([...new Set(eventIds)]), ...(serviceWaiting ? {serviceWaiting: true} : {})});
  }

  /** Entrada explícita a un tramo ya desbloqueado. */
  function createCheckpoint(stageNumber = 1, {goal = baseGoal, collected} = {}) {
    validateGoal(goal);
    if (!Number.isInteger(stageNumber) || stageNumber < 1 || stageNumber > stageCount) {
      throw new RangeError(`stageNumber must be between 1 and ${stageCount}`);
    }
    const minimum = stageNumber === 1 ? 0 : voyageGoal(STAGES[stageNumber - 2], goal);
    const count = collected === undefined ? minimum : collected;
    if (!Number.isFinite(count) || count < minimum) throw new RangeError('collected is below the stage entry requirement');
    const boundary = STAGES[stageNumber - 1].offset;
    const events = EVENTS.filter(event => event.at <= boundary).map(event => event.id);
    for (let number = 1; number < stageNumber; number++) events.push(entryEventId(number), checkpointEventId(number), completionEventId(number));
    if (service && stageNumber > service.stage) events.push(SERVICE_EVENT_ID, SERVICE_COMPLETE_ID);
    return checkpointForStage(stageNumber, goal, Math.min(goal, Math.floor(count)), events);
  }

  /** Validación pura: guardados de otras rutas o versiones se rechazan. */
  function normalizeCheckpoint(value, {goal = baseGoal} = {}) {
    validateGoal(goal);
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 2 ||
      value.contentVersion !== version || value.routeId !== routeId ||
      value.goal !== goal || !Number.isInteger(value.stageNumber) || value.stageNumber < 1 || value.stageNumber > stageCount ||
      value.stageIndex !== value.stageNumber - 1 || value.stageId !== `${chapter}.${value.stageNumber}` ||
      !Number.isFinite(value.collected) || value.collected < 0 || !Array.isArray(value.eventIds) ||
      value.eventIds.some(id => typeof id !== 'string' || !validEventIds.has(id)) ||
      (value.serviceWaiting !== undefined && typeof value.serviceWaiting !== 'boolean') ||
      (value.serviceWaiting && (!service || value.stageNumber !== service.stage))) return null;
    const collected = Math.min(goal, Math.floor(value.collected));
    const minimum = value.stageNumber === 1 ? 0 : voyageGoal(STAGES[value.stageNumber - 2], goal);
    if (collected < minimum || (value.serviceWaiting && collected < voyageGoal(STAGES[serviceIndex], goal))) return null;
    // La historia conocida se reconstruye desde la geografía; solo se
    // conservan los IDs del tramo actual y el hito coherente de C9.
    const canonical = createCheckpoint(value.stageNumber, {goal, collected});
    const currentIds = value.eventIds.filter(id => id === entryEventId(value.stageNumber) || id === checkpointEventId(value.stageNumber));
    if (service && value.stageNumber === service.stage) {
      const completedServicePair = value.eventIds.includes(SERVICE_EVENT_ID) && value.eventIds.includes(SERVICE_COMPLETE_ID);
      if ((value.serviceWaiting || completedServicePair) && value.eventIds.includes(completionEventId(service.stage))) {
        currentIds.push(completionEventId(service.stage));
      }
      if (!value.serviceWaiting && completedServicePair) currentIds.push(SERVICE_EVENT_ID, SERVICE_COMPLETE_ID);
    }
    return checkpointForStage(value.stageNumber, goal, collected, [...canonical.eventIds, ...currentIds,
      ...(value.serviceWaiting ? [SERVICE_EVENT_ID] : [])], Boolean(value.serviceWaiting));
  }

  /** Un reloj de ruta, puertas de cuota y tiempo por tramo y C9 opcional. */
  function create({goal = baseGoal, checkpoint = null} = {}) {
    validateGoal(goal);
    const restored = checkpoint === null ? null : normalizeCheckpoint(checkpoint, {goal});
    if (checkpoint !== null && !restored) throw new TypeError(ficha.invalidCheckpointMessage || 'Invalid voyage checkpoint');
    let stageIndex = restored?.stageIndex || 0, collected = restored?.collected || 0;
    const restoredServiceCompleted = service && stageIndex === serviceIndex && restored?.eventIds.includes(SERVICE_COMPLETE_ID);
    const restoredLegacyService = service && stageIndex === serviceIndex && restored?.eventIds.includes(completionEventId(service.stage)) &&
      (restored.serviceWaiting || restoredServiceCompleted);
    let stageElapsed = restoredLegacyService ? STAGES[stageIndex].duration :
      restored?.serviceWaiting || restoredServiceCompleted ? service.approach : 0;
    let serviceWaiting = Boolean(restored?.serviceWaiting), arrived = false;
    const fired = new Set(restored?.eventIds || []);
    let entryCheckpoint = restored || createCheckpoint(1, {goal});

    function exportCheckpoint() {
      if (serviceWaiting) return checkpointForStage(service.stage, goal, collected, [...fired], true);
      return entryCheckpoint;
    }

    function relayState(elapsed, serviceCompleted) {
      if (!service) return {visible: false, arrival: 0, exit: 0, active: false, state: 'approach'};
      const serviceAt = STAGES[serviceIndex].offset + service.approach;
      const arrival = smooth(elapsed, serviceAt - service.visibleApproach, serviceAt);
      const exit = serviceCompleted && stageIndex === serviceIndex
        ? smooth(stageElapsed, service.approach, service.approach + service.departure) : 0;
      const visible = stageIndex <= serviceIndex && elapsed >= serviceAt - service.visibleApproach && (!serviceCompleted || exit < 1);
      const state = serviceWaiting ? 'service' : serviceCompleted ? 'departing' : arrival < .48 ? 'approach' : 'docking';
      return {visible, arrival, exit, active: serviceWaiting, state};
    }

    function snapshot() {
      const stage = STAGES[stageIndex], stageProgress = clamp(stageElapsed / stage.duration, 0, 1);
      const elapsed = stage.offset + stageElapsed, p = elapsed / MIN_DURATION;
      const stageGoal = voyageGoal(stage, goal);
      const objectiveComplete = collected >= goal, quotaComplete = collected >= stageGoal;
      const serviceCompleted = Boolean(service) && fired.has(SERVICE_COMPLETE_ID);
      const renamed = service && stageIndex === serviceIndex && serviceCompleted;
      const scenery = ficha.scenery({elapsed, p, stageIndex, stage, arrived, relay: relayState(elapsed, serviceCompleted)});
      return immutable({version, contentVersion: version,
        routeId, chapter, elapsed, minDuration: MIN_DURATION,
        cinematicDuration: ficha.cinematicDuration, routeProgress: p,
        phase: arrived ? 'arrived' : ficha.phase(stageIndex, elapsed),
        stageId: stage.id, stageNumber: stage.number,
        stageName: renamed ? service.renamedStage : stage.name, stageProgress, stageElapsed, stageDuration: stage.duration,
        stageGoal, stageObjective: renamed ? service.renamedObjective : stage.objective,
        stageOrigin: stage.origin, stageDestination: stage.destination,
        stageEvent: stage.event, stageQuotaComplete: quotaComplete, threatRate: stage.threatRate,
        origin: ficha.origin, destination: ficha.destination,
        collected, goal, remaining: Math.max(0, goal - collected), collectionFraction: collected / goal,
        objectiveComplete, canFinish: arrived, recoveryActive: elapsed >= ficha.recoveryAt && !arrived,
        waitingFor: serviceWaiting ? 'service' : stageProgress === 1 && !quotaComplete ? 'cronium' : null,
        ...scenery,
        distance: immutable({unit: 'tramo', covered: p, total: 1, stage: stage.number, stages: stageCount})
      });
    }

    function emitOnce(event, emit) {
      if (fired.has(event.id)) return;
      fired.add(event.id);
      if (event.type === 'checkpoint') entryCheckpoint = checkpointForStage(stageIndex + 1, goal, collected, [...fired]);
      if (event.type === 'service-complete') entryCheckpoint = checkpointForStage(stageIndex + 1, goal, collected, [...fired]);
      emit(immutable({...event, version, stageId: `${chapter}.${stageIndex + 1}`,
        stageNumber: stageIndex + 1, elapsed: STAGES[stageIndex].offset + stageElapsed,
        routeProgress: snapshot().routeProgress, ...(event.type === 'checkpoint' ? {checkpoint: entryCheckpoint} : {})}));
    }

    function ensureEntryEvents(emit) {
      emitOnce({id: entryEventId(stageIndex + 1), type: 'stage-start'}, emit);
      emitOnce({id: checkpointEventId(stageIndex + 1), type: 'checkpoint'}, emit);
    }

    function enterNextStage(emit) {
      stageIndex++; stageElapsed = 0;
      entryCheckpoint = checkpointForStage(stageIndex + 1, goal, collected, [...fired]);
      ensureEntryEvents(emit);
    }

    function resolveService(emit = NOOP) {
      if (typeof emit !== 'function') throw new TypeError('emit must be a function');
      if (!serviceWaiting) return snapshot();
      serviceWaiting = false;
      emitOnce({id: SERVICE_COMPLETE_ID, type: 'service-complete'}, emit);
      // Guardados antiguos atracaban al final del tramo: entran al siguiente.
      if (stageElapsed === STAGES[stageIndex].duration) enterNextStage(emit);
      return snapshot();
    }

    function advance(dt, collectionCount = collected, emit = NOOP) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Finite nonnegative delta required');
      if (!Number.isFinite(collectionCount) || collectionCount < 0) throw new RangeError('collectionCount must be nonnegative');
      if (typeof emit !== 'function') throw new TypeError('emit must be a function');
      if (dt === 0 || arrived || serviceWaiting) return snapshot();
      ensureEntryEvents(emit);
      collected = Math.min(goal, Math.max(collected, Math.floor(collectionCount)));
      const stage = STAGES[stageIndex];
      stageElapsed = Math.min(stage.duration, stageElapsed + Math.min(dt, VOYAGE_MAX_DELTA));
      if (stage.duration - stageElapsed < 1e-8) stageElapsed = stage.duration;
      const elapsed = stage.offset + stageElapsed;
      for (const event of EVENTS) {
        if (elapsed + 1e-10 >= event.at) emitOnce(event, emit);
      }
      if (service && stage.number === service.stage && !fired.has(SERVICE_COMPLETE_ID) &&
        stageElapsed + 1e-10 >= service.approach && collected >= voyageGoal(stage, goal)) {
        // El atraque se fija en su punto exacto antes de abrir el panel real.
        stageElapsed = service.approach;
        serviceWaiting = true;
        emitOnce({id: SERVICE_EVENT_ID, type: 'service', stationId: 'c9'}, emit);
        return snapshot();
      }
      if (stageElapsed === stage.duration && collected >= voyageGoal(stage, goal)) {
        emitOnce({id: completionEventId(stage.number), type: 'stage-complete'}, emit);
        if (stage.number === stageCount) {
          arrived = true;
          emitOnce({id: ARRIVAL_EVENT_ID, type: 'arrival', destinationId: ficha.arrivalDestinationId}, emit);
        } else enterNextStage(emit);
      }
      return snapshot();
    }

    return immutable({advance, snapshot, exportCheckpoint, resolveService});
  }

  return immutable({id: ficha.id, chapter, version, saveKey: ficha.saveKey, routeId,
    stages: STAGES, minDuration: MIN_DURATION, stageCount,
    createCheckpoint, normalizeCheckpoint, create});
}
