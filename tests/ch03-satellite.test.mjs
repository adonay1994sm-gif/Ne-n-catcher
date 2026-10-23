import test from 'node:test';
import assert from 'node:assert/strict';
import {CH03_RULES, createCh03Satellite, advanceCh03Satellite, ch03HitsShip, hitCh03Satellite}
  from '../src/game/combat/ch03-satellite.js';

// Plan F3c, tarea 1: subjefe del sector 1 (biblia §3.1).
const DT = 1 / 60, W = 720, H = 1280, SHIP_Y = H * .82;
const make = (seed = 7) => createCh03Satellite({width: W, height: H, seed});

function run(boss, seconds, onStep) {
  const events = [];
  let now = 0;
  for (let frame = 0; frame < Math.round(seconds / DT); frame++) {
    now += DT;
    advanceCh03Satellite(boss, DT, event => events.push({...event, at: now}));
    onStep?.(now, boss);
  }
  return events;
}
const hurting = boss => boss.state === 'attack' && (boss.attack === 'sweep' ? Boolean(boss.beam?.active)
  : boss.attack === 'grid' ? Boolean(boss.grid?.active) : false);

test('it enters, then attacks in order: sweep, ring, grid', () => {
  const warnings = run(make(), 30).filter(event => event.type === 'warning').map(event => event.attack);
  assert.deepEqual(warnings.slice(0, 3), ['sweep', 'ring', 'grid']);
  assert.ok(warnings.length >= 4);
  for (let index = 3; index < warnings.length; index++) assert.notEqual(warnings[index], warnings[index - 1]);
});

test('every attack is announced at least 0.7 s before it can hurt', () => {
  const boss = make();
  let lastWarning = null, firstHurt = new Map();
  const events = run(boss, 40, (now, b) => {
    if (lastWarning !== null && !firstHurt.has(lastWarning) && hurting(b)) firstHurt.set(lastWarning, now);
  });
  for (const event of events) {
    if (event.type === 'warning') lastWarning = event.at;
    if (event.type === 'projectile' && lastWarning !== null && !firstHurt.has(lastWarning)) firstHurt.set(lastWarning, event.at);
  }
  const warnings = events.filter(event => event.type === 'warning');
  assert.ok(warnings.length >= 3);
  for (const warning of warnings) {
    if (firstHurt.has(warning.at)) assert.ok(firstHurt.get(warning.at) - warning.at >= .7 - 1e-9, `${warning.attack}`);
  }
});

test('the sweep beam turns and there is always room beside it', () => {
  const boss = make(), angles = new Set();
  run(boss, 12, (now, b) => {
    if (b.attack !== 'sweep' || !b.beam?.active) return;
    angles.add(b.beam.angle.toFixed(2));
    const beamX = b.x + Math.tan(b.beam.angle) * (SHIP_Y - b.y);
    // Siempre queda sitio en pantalla a más de 100 px del rayo.
    const safe = Array.from({length: 17}, (_, k) => 40 + k * 40).filter(x => Math.abs(x - beamX) >= 100)
      .some(x => ch03HitsShip(b, {x, y: SHIP_Y, r: 30}) === 0);
    assert.ok(safe, `no room at angle ${b.beam.angle}`);
    if (beamX >= 40 && beamX <= W - 40) assert.ok(ch03HitsShip(b, {x: beamX, y: SHIP_Y, r: 30}) > 0, 'the beam hurts');
  });
  assert.ok(angles.size > 10, 'the beam turns');
});

test('the ring fires two rings of eight', () => {
  const shots = run(make(), 20).filter(event => event.type === 'projectile');
  const first = shots.filter(shot => shot.at === shots[0].at), second = shots.filter(shot => shot.at !== shots[0].at).slice(0, 8);
  assert.equal(first.length, 8);
  assert.equal(second.length, 8);
  assert.ok(Math.abs(second[0].at - first[0].at - CH03_RULES.ring.gap) < .02);
  for (const ring of [first, second]) assert.equal(new Set(ring.map(s => Math.atan2(s.vy, s.vx).toFixed(3))).size, 8);
});

test('the grid always leaves one safe column that moves', () => {
  const boss = make(), steps = [];
  let firstGridDone = false;
  run(boss, 30, (now, b) => {
    if (steps.length && !b.grid) firstGridDone = true;
    if (!firstGridDone && b.attack === 'grid' && b.grid?.active && steps.at(-1)?.step !== b.grid.step) steps.push({step: b.grid.step, safe: b.grid.safe});
  });
  assert.equal(steps.length, CH03_RULES.grid.steps);
  const column = W / CH03_RULES.grid.columns;
  for (const [index, {safe}] of steps.entries()) {
    if (index) assert.equal(Math.abs(safe - steps[index - 1].safe), 1);
  }
  const b = make();
  run(b, 30, (now, it) => {
    if (it.attack !== 'grid' || !it.grid?.active) return;
    const hit = [...Array(CH03_RULES.grid.columns).keys()].filter(c => ch03HitsShip(it, {x: (c + .5) * column, y: SHIP_Y, r: 20}) > 0);
    assert.equal(hit.length, CH03_RULES.grid.columns - 1);
  });
});

test('zero delta changes nothing', () => {
  const boss = make();
  run(boss, 5);
  const before = JSON.stringify(boss), events = [];
  for (let frame = 0; frame < 300; frame++) advanceCh03Satellite(boss, 0, event => events.push(event));
  assert.equal(JSON.stringify(boss), before);
  assert.equal(events.length, 0);
});

test('hits only count while it is not entering or defeated, and it falls once', () => {
  const boss = make();
  assert.equal(hitCh03Satellite(boss, 5).accepted, false, 'entering');
  run(boss, 3);
  assert.equal(hitCh03Satellite(boss, 5).accepted, true);
  hitCh03Satellite(boss, CH03_RULES.hp);
  assert.equal(boss.state, 'defeated');
  assert.equal(hitCh03Satellite(boss, 5).accepted, false);
  const events = run(boss, 3);
  assert.equal(events.filter(event => event.type === 'defeated').length, 1);
  assert.equal(boss.resolved, true);
});
