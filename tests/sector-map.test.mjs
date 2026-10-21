import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTOR_MAPS, sectorMapState} from '../src/game/progression/sector-map.js';
import {baseConversation, BASE_ACTORS} from '../src/game/narrative/base-dialogues.js';
import {PLAYABLE_VOYAGES} from '../src/game/progression/voyages/index.js';

test('sector 1 follows the campaign: five routes from Chronos to Gaia and two bases', () => {
  const map = SECTOR_MAPS[1];
  assert.deepEqual(map.routes.map(route => route.voyage), ['S1-V1', 'S1-V2', 'S1-V3', 'S1-V4', 'S1-V5']);
  const ids = new Set(map.places.map(place => place.id));
  for (const route of map.routes) assert.ok(ids.has(route.from) && ids.has(route.to), route.voyage);
  for (let index = 1; index < map.routes.length; index++) assert.equal(map.routes[index].from, map.routes[index - 1].to);
  assert.deepEqual(map.places.filter(place => place.kind === 'base').map(place => place.actor), ['iria', 'mira']);
  for (const place of map.places) assert.ok(place.x >= 0 && place.x <= 1 && place.y >= 0 && place.y <= 1);
});

test('only the next playable voyage opens; finished ones stay done; the rest wait', () => {
  const playable = PLAYABLE_VOYAGES.map(ficha => ficha.id);
  assert.deepEqual(sectorMapState(1, {playable}).routes.map(route => route.status),
    ['open', 'locked', 'locked', 'locked', 'locked']);
  assert.deepEqual(sectorMapState(1, {playable, completed: ['S1-V1']}).routes.map(route => route.status),
    ['done', 'locked', 'locked', 'locked', 'locked'], 'S1-V2 has no card yet');
  assert.deepEqual(sectorMapState(1, {playable: [...playable, 'S1-V2'], completed: ['S1-V1']}).routes
    .map(route => route.status), ['done', 'open', 'locked', 'locked', 'locked']);
  assert.equal(sectorMapState(99), null);
});

test('base conversations are short, in character and change once Atlas is convinced', () => {
  for (const base of ['c9', 'gaia']) {
    const before = baseConversation(base), after = baseConversation(base, {atlasConvinced: true});
    assert.ok(before.lines.length >= 3 && after.lines.length >= 3);
    assert.notDeepEqual(before.lines, after.lines);
    for (const {text} of [...before.lines, ...after.lines]) assert.ok(text.length <= 90, text);
  }
  assert.equal(baseConversation('c9').actor, BASE_ACTORS.mira);
  assert.equal(baseConversation('gaia').actor, BASE_ACTORS.iria);
  assert.equal(baseConversation('nada'), null);
});
