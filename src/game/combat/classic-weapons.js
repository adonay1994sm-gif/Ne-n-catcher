const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
};

const weapon = definition => Object.freeze({...definition,
  barrels: Object.freeze(definition.barrels.map(barrel => Object.freeze({...barrel})))});

export const CLASSIC_WEAPON_RULES = Object.freeze({
  version: 'classic-weapons-v1', maxCharges: 3, rechargeSeconds: 3.6,
  maxDelta: .05, maxProjectiles: 32, boundsMargin: 80,
  types: Object.freeze({
    pulse: weapon({id: 'pulse', label: 'Pulso', cooldown: .24, speed: 920,
      damage: 1, radius: 9, duration: 2.4, barrels: [{offset: 0, spread: 0}]}),
    twin: weapon({id: 'twin', label: 'Doble pulso', cooldown: .30, speed: 900,
      damage: .7, radius: 7, duration: 2.4,
      barrels: [{offset: -42, spread: -.025}, {offset: 42, spread: .025}]})
  })
});

function knownType(type) {
  if (!Object.hasOwn(CLASSIC_WEAPON_RULES.types, type)) {
    throw new RangeError(`Unknown classic weapon: ${String(type)}`);
  }
  return type;
}

/**
 * One match, driven by the existing legacy loop. Units are logical Canvas
 * pixels and seconds. No rendering, scheduling, save or reward lives here.
 * Callers pause by passing zero delta (or by not calling advance).
 */
export function createClassicWeapons({type = 'pulse', unlocked = ['pulse'],
  width = 720, height = 1280} = {}) {
  finite(width, 'width'); finite(height, 'height'); knownType(type);
  if (width < 240 || height < 240) throw new RangeError('Invalid weapon arena');
  if (!Array.isArray(unlocked) || unlocked.length === 0) {
    throw new TypeError('At least one unlocked weapon is required');
  }
  const available = [...new Set(unlocked.map(knownType))];
  if (!available.includes(type)) throw new RangeError('Selected weapon must be unlocked');
  return {
    version: CLASSIC_WEAPON_RULES.version, width, height,
    selected: type, unlocked: available, charges: CLASSIC_WEAPON_RULES.maxCharges,
    recharge: 0, cooldown: 0, elapsed: 0,
    projectileSequence: 0, eventSequence: 0, shotSequence: 0, projectiles: []
  };
}

function event(state, type, details = {}) {
  return {id: `${state.version}:event:${++state.eventSequence}`, type, ...details};
}

/** Reward/save code owns when this is called; repeated delivery is harmless. */
export function unlockClassicWeapon(state, type) {
  knownType(type);
  if (state.unlocked.includes(type)) return {accepted: false, reason: 'unlocked', events: []};
  state.unlocked.push(type);
  return {accepted: true, events: [event(state, 'unlocked', {weapon: type})]};
}

/** Switching an unlocked weapon preserves ammunition, recharge and cooldown. */
export function selectClassicWeapon(state, type) {
  knownType(type);
  if (!state.unlocked.includes(type)) return {accepted: false, reason: 'locked', events: []};
  if (state.selected === type) return {accepted: false, reason: 'selected', events: []};
  state.selected = type;
  return {accepted: true, events: [event(state, 'selected', {weapon: type})]};
}

/**
 * One trigger spends one charge, including a two-barrel weapon. The returned
 * projectiles belong to state.projectiles; render them without applying a
 * second movement update. Their emitted event copies are immutable snapshots
 * for sound/VFX dispatch and must not be re-emitted by an animation frame.
 */
export function triggerClassicWeapon(state, {x, y, angle = -Math.PI / 2} = {}) {
  finite(x, 'origin x'); finite(y, 'origin y'); finite(angle, 'angle');
  if (state.charges === 0) return {accepted: false, reason: 'empty', events: [], projectiles: []};
  if (state.cooldown > 1e-9) return {accepted: false, reason: 'cooldown', events: [], projectiles: []};
  const definition = CLASSIC_WEAPON_RULES.types[state.selected];
  if (state.projectiles.length + definition.barrels.length > CLASSIC_WEAPON_RULES.maxProjectiles) {
    return {accepted: false, reason: 'capacity', events: [], projectiles: []};
  }
  const wasFull = state.charges === CLASSIC_WEAPON_RULES.maxCharges;
  state.charges--;
  if (wasFull) state.recharge = 0;
  state.cooldown = definition.cooldown;
  const shotId = `${state.version}:shot:${++state.shotSequence}`;
  const events = [event(state, 'fired', {shotId, weapon: state.selected,
    charges: state.charges, barrels: definition.barrels.length})];
  const projectiles = definition.barrels.map((barrel, barrelIndex) => {
    const direction = angle + barrel.spread;
    // The local right vector is perpendicular to the firing direction. This
    // keeps two muzzle positions attached to the hull even when it banks.
    const projectile = {
      id: `${state.version}:projectile:${++state.projectileSequence}`, shotId,
      weapon: state.selected, barrel: barrelIndex,
      x: x - Math.sin(angle) * barrel.offset,
      y: y + Math.cos(angle) * barrel.offset,
      vx: Math.cos(direction) * definition.speed,
      vy: Math.sin(direction) * definition.speed,
      damage: definition.damage, radius: definition.radius, pierce: 1,
      duration: definition.duration, life: definition.duration,
      hitTargets: []
    };
    events.push(event(state, 'projectile', {projectile: {...projectile, hitTargets: []}}));
    return projectile;
  });
  state.projectiles.push(...projectiles);
  return {accepted: true, shotId, events, projectiles};
}

/**
 * Recharge uses played time only. Full batteries store no hidden recharge,
 * later triggers do not restart a running recharge, and long foreground gaps
 * advance at most one normal 50 ms update rather than granting free ammo.
 */
export function advanceClassicWeapons(state, delta) {
  finite(delta, 'delta');
  if (delta < 0) throw new RangeError('Finite nonnegative delta required');
  if (delta === 0) return [];
  const dt = Math.min(delta, CLASSIC_WEAPON_RULES.maxDelta);
  const events = [];
  state.elapsed += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);
  if (state.charges < CLASSIC_WEAPON_RULES.maxCharges) {
    state.recharge += dt;
    while (state.recharge + 1e-9 >= CLASSIC_WEAPON_RULES.rechargeSeconds &&
      state.charges < CLASSIC_WEAPON_RULES.maxCharges) {
      state.charges++;
      state.recharge = Math.max(0, state.recharge - CLASSIC_WEAPON_RULES.rechargeSeconds);
      events.push(event(state, 'recharged', {charges: state.charges}));
    }
  }
  if (state.charges === CLASSIC_WEAPON_RULES.maxCharges) state.recharge = 0;
  const margin = CLASSIC_WEAPON_RULES.boundsMargin;
  for (let index = state.projectiles.length - 1; index >= 0; index--) {
    const projectile = state.projectiles[index];
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life = Math.max(0, projectile.life - dt);
    const outside = projectile.x < -margin || projectile.x > state.width + margin ||
      projectile.y < -margin || projectile.y > state.height + margin;
    if (projectile.life <= 1e-9 || outside) {
      state.projectiles.splice(index, 1);
      events.push(event(state, 'expired', {projectileId: projectile.id,
        reason: outside ? 'bounds' : 'lifetime'}));
    }
  }
  return events;
}

/**
 * Report a collision once after the caller's established hitbox test. A target
 * is identified by a stable entity ID, not a changing array index. Only the
 * accepted result applies damage/reward; repeating a rendered impact is inert.
 */
export function hitClassicProjectile(state, projectileId, targetId) {
  if (typeof projectileId !== 'string' || !projectileId) throw new TypeError('Projectile ID required');
  if (!((typeof targetId === 'string' && targetId.length > 0) || Number.isSafeInteger(targetId))) {
    throw new TypeError('Stable target ID required');
  }
  const index = state.projectiles.findIndex(projectile => projectile.id === projectileId);
  if (index < 0) return {accepted: false, reason: 'inactive', damage: 0, events: []};
  const projectile = state.projectiles[index];
  const key = `${typeof targetId}:${targetId}`;
  if (projectile.hitTargets.includes(key)) {
    return {accepted: false, reason: 'duplicate', damage: 0, events: []};
  }
  projectile.hitTargets.push(key);
  projectile.pierce--;
  if (projectile.pierce <= 0) state.projectiles.splice(index, 1);
  return {accepted: true, damage: projectile.damage,
    events: [event(state, 'hit', {projectileId, shotId: projectile.shotId,
      targetId, damage: projectile.damage, x: projectile.x, y: projectile.y,
      weapon: projectile.weapon})]};
}

/** Deep copies of mutable arrays prevent HUD/diagnostics from changing combat. */
export function classicWeaponSnapshot(state) {
  return {...state, unlocked: [...state.unlocked],
    rechargeProgress: state.charges === CLASSIC_WEAPON_RULES.maxCharges ? 0 :
      Math.min(1, state.recharge / CLASSIC_WEAPON_RULES.rechargeSeconds),
    projectiles: state.projectiles.map(projectile => ({...projectile,
      hitTargets: [...projectile.hitTargets]}))};
}
