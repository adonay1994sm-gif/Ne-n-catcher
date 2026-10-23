import test from 'node:test';
import assert from 'node:assert/strict';
import {sectorPlanetPose, SECTOR_PLANETS, SECTOR_PLANET_FRAMES, SECTOR_PLANET_FRAME_SECONDS as STEP}
  from '../src/game/presentation/sector-planets.js';

test('each far sector shows its own animated planet; Chronos and Gaia keep their scenery', () => {
  assert.equal(sectorPlanetPose(0, 1), null); assert.equal(sectorPlanetPose(1, 1), null);
  assert.equal(sectorPlanetPose(9, 1), null);
  assert.deepEqual([3, 4, 5, 6, 7, 8].map(level => sectorPlanetPose(level, 0).key),
    ['volcanico', 'glacial', 'glacial', 'violeta', 'violeta', 'tormentoso']);
});

test('the planet turns slowly through its seven frames, cross-fading into the next one', () => {
  const seen = new Set();
  for (let time = 0; time < STEP * SECTOR_PLANET_FRAMES; time += .05) {
    const pose = sectorPlanetPose(3, time);
    seen.add(pose.frame);
    assert.equal(pose.next, (pose.frame + 1) % SECTOR_PLANET_FRAMES);
    assert.ok(pose.blend >= 0 && pose.blend < 1);
  }
  assert.equal(seen.size, SECTOR_PLANET_FRAMES);
  assert.equal(sectorPlanetPose(3, STEP * SECTOR_PLANET_FRAMES + .01).frame, 0, 'the loop wraps');
});

test('progress brings the planet closer and bad input is harmless', () => {
  assert.ok(sectorPlanetPose(4, 5, 1).size > sectorPlanetPose(4, 5, 0).size);
  assert.deepEqual(sectorPlanetPose(4, 5, NaN), sectorPlanetPose(4, 5, 0));
  for (const bad of [NaN, -1, undefined]) assert.equal(sectorPlanetPose(4, bad), null);
  assert.ok(Object.isFrozen(SECTOR_PLANETS));
});
