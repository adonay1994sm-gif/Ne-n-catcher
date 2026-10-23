/**
 * Enemigos nuevos de la Guardia de Gaia (biblia §3.1, plan F3b): Rastreador
 * (Emboscador), Sembrador (Minador), Égida (Escolta) y Alfa (élite Cazador).
 * Adónde ir y cuándo atacar lo decide enemy-ai.js con turnos de ataque; aquí
 * se mueve el cuerpo y se emite cada habilidad tras su aviso. Puro: el reloj
 * es el `now` de juego que pasa el llamador y no hay azar.
 */
import {decideEnemyIntent} from './enemy-ai.js';
import {releaseAttack} from './attack-tokens.js';

// Cifras de partida; las ajusta el bot (spec §8). salvageRole: chatarra del
// enemigo actual equivalente, para no cambiar la economía.
export const GAIA_ENEMY_RULES = Object.freeze({
  tracker: Object.freeze({profile: 'ambusher', hp: 2, speed: 230, warning: .4, firstAttack: 1.2, salvageRole: 'interceptor',
    basic: Object.freeze({cooldown: 2.4, speed: 380, damage: 12}),
    unique: Object.freeze({cooldown: 9, markSeconds: 4})}),
  sower: Object.freeze({profile: 'miner', hp: 3, speed: 150, warning: .3, firstAttack: 1.2, salvageRole: 'raider',
    basic: Object.freeze({cooldown: 2.2}),
    unique: Object.freeze({cooldown: 10, speed: 300})}),
  aegis: Object.freeze({profile: 'escort', hp: 3, speed: 200, warning: 0, firstAttack: 1.5, salvageRole: 'scout',
    unique: Object.freeze({cooldown: 8, hits: 3})}),
  alpha: Object.freeze({profile: 'hunter', hp: 12, speed: 170, warning: .5, firstAttack: 1.5, clearance: 320, salvageRole: 'interceptor',
    basic: Object.freeze({cooldown: 1.6, speed: 360, spacing: 28, damage: 12}),
    unique: Object.freeze({cooldown: 7, speed: 240, damage: 12})})
});

export function createGaiaEnemy({kind, x, y, now = 0}) {
  const rules = GAIA_ENEMY_RULES[kind];
  if (!rules || ![x, y, now].every(Number.isFinite)) throw new RangeError('Invalid Gaia enemy spawn');
  // La primera habilidad única llega a media recarga: aparece pronto, pero no al nacer.
  return {kind, profile: rules.profile, hp: rules.hp, maxHp: rules.hp, bornAt: now,
    cooldowns: {basic: now + rules.firstAttack, unique: now + rules.unique.cooldown * .5},
    telegraph: 0, pending: null, aim: null, heading: undefined, guardId: null};
}

function moveToward(item, target, maxStep) {
  const dx = target.x - item.x, dy = target.y - item.y, distance = Math.hypot(dx, dy);
  if (distance <= maxStep || distance === 0) { item.x = target.x; item.y = target.y; return; }
  item.x += dx / distance * maxStep;
  item.y += dy / distance * maxStep;
}

function aimed(from, to, speed) {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  return {vx: dx / length * speed, vy: dy / length * speed};
}

function unleash(item, ability, emit) {
  const {gaia} = item, rules = GAIA_ENEMY_RULES[gaia.kind];
  if (gaia.kind === 'tracker') {
    if (ability === 'unique') emit({type: 'mark', seconds: rules.unique.markSeconds});
    else {
      const from = {x: item.x, y: item.y - 30};
      emit({type: 'shot', ...from, ...aimed(from, gaia.aim, rules.basic.speed), damage: rules.basic.damage, sprite: 'orb'});
    }
  }
}

/** Avanza un enemigo de Gaia. item = {id, x, y, hp, maxHp, gaia}; ctx = {now,
 * player: {x, y, hull, reloading}, bounds: {w, h}, allies, tokens}. */
export function advanceGaiaEnemy(item, dt, ctx, emit) {
  if (!(dt > 0)) return;
  const {gaia} = item, rules = GAIA_ENEMY_RULES[gaia.kind];
  if (gaia.pending) {
    // Aviso visible antes de cada ataque; el turno se devuelve al emitirlo.
    gaia.telegraph = Math.min(1, gaia.telegraph + dt / Math.max(rules.warning, 1e-6));
    if (gaia.telegraph >= 1) {
      const ability = gaia.pending;
      unleash(item, ability, emit);
      gaia.cooldowns[ability] = ctx.now + rules[ability].cooldown;
      gaia.pending = null; gaia.telegraph = 0; gaia.aim = null;
      releaseAttack(ctx.tokens, item.id);
    }
    return;
  }
  const view = {id: item.id, x: item.x, y: item.y, hp: item.hp, maxHp: item.maxHp, profile: gaia.profile,
    cooldowns: gaia.cooldowns, bornAt: gaia.bornAt, ...(gaia.heading !== undefined ? {heading: gaia.heading} : {})};
  const intent = decideEnemyIntent(view, ctx);
  if (intent.heading !== undefined) gaia.heading = intent.heading;
  moveToward(item, {x: intent.targetX, y: intent.targetY}, rules.speed * dt);
  if (intent.attack) {
    gaia.pending = intent.ability;
    gaia.aim = {x: ctx.player.x, y: ctx.player.y};
    gaia.telegraph = 0;
  }
}
