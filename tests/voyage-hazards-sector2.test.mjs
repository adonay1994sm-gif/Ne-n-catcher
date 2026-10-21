import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoyageHazardField, advanceVoyageHazardField, largestUpperGap,
  VOYAGE_HAZARD_PROFILES, VOYAGE_HAZARD_RULES} from '../src/game/progression/voyage-hazards.js';
import {VOYAGES, getVoyageStageRulesFor} from '../src/game/progression/voyages/index.js';
import {DIFFICULTY_LIMITS, DIFFICULTY_MODES, stagePressure} from '../src/game/progression/difficulty.js';

// Peligros nuevos de Vulkar (encargo enc-nucleo): núcleo de lava y mina de plasma.
const NEW_TYPES = ['lavaCore', 'plasmaMine'];
const RADIUS = {meteor: 42, debris: 35, satellite: 46, lavaCore: 44, plasmaMine: 36};

// Igual que voyage-hazards.test.mjs, pero con el perfil del tramo de la ficha.
function simulate(profile, stageNumber, seconds, seed) {
  const field = createVoyageHazardField({stageNumber, seed, profile});
  const threats = [], emitted = [];
  let maxLive = 0, minGap = Infinity;
  for (let time = 0; time < seconds; time += .05) {
    for (const item of threats) item.y += item.speed * .05;
    for (let index = threats.length - 1; index >= 0; index--) if (threats[index].y > 1400) threats.splice(index, 1);
    advanceVoyageHazardField(field, .05, threats, hazard => {
      assert.ok(RADIUS[hazard.type], `unknown hazard ${hazard.type}`);
      const item = {...hazard, y: -95 - hazard.delayY, r: RADIUS[hazard.type]};
      threats.push(item); emitted.push(item);
    });
    maxLive = Math.max(maxLive, threats.length);
    minGap = Math.min(minGap, largestUpperGap(field, threats));
  }
  return {field, emitted, maxLive, minGap};
}

const sector = number => VOYAGES.filter(ficha => ficha.sector === number);
const fieldOf = (ficha, mode = 'normal') => ficha.encounters.map((_, index) =>
  getVoyageStageRulesFor(ficha.routeId, index + 1, mode).hazards);

test('every sector 2 voyage spawns lava cores and plasma mines, in a reasonable share', () => {
  assert.equal(sector(2).length, 5);
  for (const ficha of sector(2)) {
    const types = {};
    let total = 0;
    fieldOf(ficha).forEach((profile, index) => {
      for (const seed of [1, 99]) for (const item of simulate(profile, index + 1, 40, seed).emitted) {
        types[item.type] = (types[item.type] || 0) + 1; total++;
      }
    });
    for (const type of NEW_TYPES) assert.ok(types[type] > 0, `${ficha.id} never spawns ${type}`);
    const share = NEW_TYPES.reduce((sum, type) => sum + types[type], 0) / total;
    assert.ok(share >= .2 && share <= .5, `${ficha.id} new hazard share ${share.toFixed(2)}`);
    assert.ok(types.meteor > 0 && types.debris > 0, `${ficha.id} keeps the familiar hazards too`);
  }
});

test('sector 1 voyages never spawn the Vulkar hazards', () => {
  for (const ficha of sector(1)) fieldOf(ficha).forEach((profile, index) => {
    for (const type of NEW_TYPES) assert.equal(profile.mix[type], undefined, `${ficha.id} ${index + 1}`);
    for (const seed of [1, 99]) {
      const {emitted} = simulate(profile, index + 1, 40, seed);
      assert.ok(emitted.every(item => !NEW_TYPES.includes(item.type)), `${ficha.id} ${index + 1}`);
    }
  });
  for (let stage = 1; stage <= 10; stage++)
    for (const type of NEW_TYPES) assert.equal(VOYAGE_HAZARD_PROFILES[stage].mix[type], undefined);
});

test('sector 2 keeps a passable gap and the stage cap in every difficulty mode', () => {
  for (const mode of Object.keys(DIFFICULTY_MODES)) for (const ficha of sector(2)) {
    fieldOf(ficha, mode).forEach((profile, index) => {
      assert.ok(profile.cap <= DIFFICULTY_LIMITS.hazardCapMax && profile.gap[0] >= DIFFICULTY_LIMITS.hazardGapMin,
        `${mode} ${ficha.id} ${index + 1}`);
      for (const seed of [1, 4242]) {
        const {maxLive, minGap, field} = simulate(profile, index + 1, 36, seed);
        assert.ok(maxLive <= profile.cap, `${mode} ${ficha.id} ${index + 1} live ${maxLive}`);
        assert.ok(minGap >= field.shipWidth + VOYAGE_HAZARD_RULES.gapMargin,
          `${mode} ${ficha.id} ${index + 1} gap ${minGap}`);
      }
    });
  }
});

test('the new hazards only change the mix: total pressure of sector 2 stays the same', () => {
  for (const ficha of sector(2)) for (const rules of ficha.encounters) {
    const base = Object.values(VOYAGE_HAZARD_PROFILES).find(profile =>
      profile.cap === rules.hazards.cap && profile.gap[0] === rules.hazards.gap[0] && profile.gap[1] === rules.hazards.gap[1]);
    assert.ok(base, `${ficha.id} uses a known profile`);
    for (const key of ['cap', 'cluster', 'start', 'damageScale']) assert.equal(rules.hazards[key], base[key], key);
    assert.deepEqual(rules.hazards.gap, base.gap);
    assert.deepEqual(rules.hazards.speed, base.speed);
    assert.equal(stagePressure(rules), stagePressure({...rules, hazards: base}));
    assert.ok(NEW_TYPES.every(type => rules.hazards.mix[type] > 0), `${ficha.id} mix`);
  }
});
