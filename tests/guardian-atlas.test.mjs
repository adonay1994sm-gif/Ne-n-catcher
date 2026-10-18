import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGuardianAtlas, advanceGuardianAtlas, hitGuardianAtlas,
  GUARDIAN_ATLAS_RULES} from '../src/game/combat/guardian-atlas.js';
import {createClassicWeapons, advanceClassicWeapons, triggerClassicWeapon,
  hitClassicProjectile} from '../src/game/combat/classic-weapons.js';

const player = {x: 360, y: 1145};

function runFor(boss, seconds, pilot = player, events = []) {
  let remaining = seconds;
  while (remaining > 1e-8) {
    const delta = Math.min(1 / 60, remaining);
    events.push(...advanceGuardianAtlas(boss, delta, pilot));
    remaining -= delta;
  }
  return events;
}

function until(boss, predicate, pilot = player, events = []) {
  for (let frame = 0; frame < 120 * 60; frame++) {
    if (predicate(boss)) return events;
    events.push(...advanceGuardianAtlas(boss, 1 / 60, pilot));
  }
  throw new Error(`Condition not reached: state=${boss.state}, hp=${boss.hp}`);
}

function readyBoss(options) {
  const boss = createGuardianAtlas(options);
  until(boss, unit => unit.state === 'idle');
  return boss;
}

test('Guardian arrives visibly before fighting and does not accept damage during entry', () => {
  const boss = createGuardianAtlas();
  const initialY = boss.y;
  assert.equal(hitGuardianAtlas(boss, 5).accepted, false);
  const events = runFor(boss, 1);
  assert.ok(boss.y > initialY && boss.y < boss.targetY);
  assert.equal(events.some(event => event.type === 'projectile'), false);
  until(boss, unit => unit.state === 'idle', player, events);
  assert.equal(boss.y, boss.targetY);
  assert.equal(boss.hp, GUARDIAN_ATLAS_RULES.maxHp);
  assert.equal(boss.vulnerability, true);
  assert.equal(events.filter(event => event.type === 'arrival').length, 1);
});

test('zero delta freezes entry, warnings, hurt, fire and terminal animation exactly', () => {
  const boss = createGuardianAtlas();
  for (const desired of ['entry', 'idle', 'charge', 'fire']) {
    until(boss, unit => unit.state === desired);
    const before = structuredClone(boss);
    let calls = 0;
    assert.deepEqual(advanceGuardianAtlas(boss, 0, player, () => { calls++; }), []);
    assert.deepEqual(boss, before);
    assert.equal(calls, 0);
  }
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.state, 'hurt');
  const hurt = structuredClone(boss);
  advanceGuardianAtlas(boss, 0, player);
  assert.deepEqual(boss, hurt);
  hitGuardianAtlas(boss, 100);
  const terminal = structuredClone(boss);
  advanceGuardianAtlas(boss, 0, player);
  assert.deepEqual(boss, terminal);
});

test('phase-one aim is announced, then fixed, with one salvo and no homing', () => {
  const boss = readyBoss();
  const events = until(boss, unit => unit.state === 'charge', {x: 170});
  const warning = events.find(event => event.type === 'warning');
  assert.equal(warning.kind, 'aimedSalvo');
  assert.equal(warning.targetX, 170);
  assert.ok(warning.seconds >= 1);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'armored');
  const shots = until(boss, unit => unit.state === 'fire', {x: 600});
  const emitted = shots.filter(event => event.type === 'projectile');
  assert.equal(emitted.length, 5);
  assert.equal(emitted[2].projectile.targetX, 170);
  const middle = emitted[2].projectile;
  const crossingX = middle.x + middle.vx * ((middle.targetY - middle.y) / middle.vy);
  assert.ok(Math.abs(crossingX - 170) < .00001);
  assert.ok(middle.vy > 0);
  assert.equal(middle.telegraphSeconds, warning.seconds);
  assert.ok((middle.targetY - middle.y) / middle.vy > 2);
  const attackId = middle.attackId;
  runFor(boss, .7, {x: 600}, shots);
  assert.equal(shots.filter(event => event.type === 'projectile' &&
    event.projectile.attackId === attackId).length, 5);
});

test('half-health causes a protected phase transition and a different attack pattern', () => {
  const boss = readyBoss();
  const result = hitGuardianAtlas(boss, boss.maxHp / 2);
  assert.equal(result.accepted, true);
  assert.equal(boss.phase, 2);
  assert.equal(boss.state, 'phaseBreak');
  assert.equal(boss.vulnerability, false);
  assert.equal(hitGuardianAtlas(boss, 1).accepted, false);
  assert.ok(result.events.some(event => event.type === 'phase' && event.clearProjectiles));
  const events = until(boss, unit => unit.state === 'charge');
  const warning = events.find(event => event.type === 'warning');
  assert.equal(warning.kind, 'openCorridor');
  assert.ok(warning.safeGap.right - warning.safeGap.left >= 270);
  until(boss, unit => unit.state === 'fire', player, events);
  runFor(boss, .64, player, events);
  const volleys = events.filter(event => event.type === 'volley');
  assert.equal(volleys.length, 2);
  assert.deepEqual(volleys.map(event => event.volley), [0, 1]);
  assert.equal(boss.state, 'idle');
  assert.equal(boss.vulnerability, false, 'reposition is protected, not a misleading open core');
  until(boss, unit => unit.vulnerability);
  assert.equal(boss.vulnerability, true);
});

test('phase two alternates curtains and fixed-target crossfire from distinct weapon origins', () => {
  const boss = readyBoss();
  hitGuardianAtlas(boss, boss.maxHp / 2);
  const events = runFor(boss, 30, {x: 360, y: 1145});
  const warnings = events.filter(event => event.type === 'warning');
  assert.ok(warnings.length >= 4);
  for (const [index, warning] of warnings.entries()) {
    assert.equal(warning.pattern, index % 2 ? 'crossfire' : 'curtain');
    assert.equal(warning.kind, index % 2 ? 'aimedSalvo' : 'openCorridor');
    assert.ok(warning.seconds >= .8);
    if (warning.pattern !== 'crossfire') continue;
    assert.equal(warning.safeGap, null, 'an aimed fan must not promise a safety marker');
    const shots = events.filter(event => event.type === 'projectile' &&
      event.projectile.attackId === warning.attackId).map(event => event.projectile);
    if (shots.length === 0) continue; // The final warning may still be charging.
    assert.equal(shots.length, 10);
    assert.equal(new Set(shots.map(shot => shot.projectileId)).size, 10);
    const central = [shots[2], shots[7]];
    assert.ok(central[0].x < warning.originX && central[1].x > warning.originX);
    assert.ok(central[0].vx > central[1].vx,
      'the separated guns converge toward one fixed point, including after a flank move');
    for (const shot of central) {
      const crossingX = shot.x + shot.vx * ((shot.targetY - shot.y) / shot.vy);
      assert.ok(Math.abs(crossingX - warning.targetX) < .00001);
    }
  }
});

test('faster concentrated fans still permit a full-wing escape, without consulting safeGap', () => {
  // Check actual trajectories over the entire vertical ship outline, rather
  // than piloting automatically toward an internal safe-corridor property.
  for (const height of [568, 1280, 1560]) {
    const playerY = height === 568 ? 450 : height - 135;
    for (const targetX of [145, 360, 575]) {
      for (const phase of [1, 2]) {
        const boss = readyBoss({width: 720, height, playerY});
        if (phase === 2) {
          hitGuardianAtlas(boss, boss.maxHp / 2);
          until(boss, unit => unit.state === 'charge'); // First curtain.
          until(boss, unit => unit.state === 'idle');
        }
        const events = until(boss, unit => unit.state === 'charge', {x: targetX, y: playerY});
        const warning = events.findLast(event => event.type === 'warning');
        assert.equal(warning.kind, 'aimedSalvo');
        until(boss, unit => unit.state === 'fire', {x: 720 - targetX, y: playerY}, events);
        runFor(boss, .65, {x: 720 - targetX, y: playerY}, events);
        const shots = events.filter(event => event.type === 'projectile').map(event => event.projectile);
        assert.equal(shots.length, phase === 1 ? 5 : 10);
        for (const shot of shots) {
          assert.ok(Math.abs(Math.hypot(shot.vx, shot.vy) -
            (phase === 1 ? 340 : 315)) < .00001);
          assert.ok(shot.duration > (playerY + 104 - shot.y) / shot.vy);
        }
        const escapeX = [119, 601].find(candidate => shots.every(shot =>
          [playerY - 158 - shot.r, playerY + 104 + shot.r].every(y => {
            const x = shot.x + shot.vx * ((y - shot.y) / shot.vy);
            return Math.abs(x - candidate) > 119 + shot.r;
          })));
        assert.notEqual(escapeX, undefined,
          `height ${height}, target ${targetX}, phase ${phase}: at least one full-wing lateral dodge stays open`);
        assert.ok(Math.abs(escapeX - 360) / 720 < warning.seconds,
          'a responsive lateral dodge can finish before the announced shot');
        for (const shot of shots) {
          for (const y of [playerY - 158 - shot.r, playerY + 104 + shot.r]) {
            const x = shot.x + shot.vx * ((y - shot.y) / shot.vy);
            assert.ok(Math.abs(x - escapeX) > 119 + shot.r,
              `height ${height}, target ${targetX}, phase ${phase}: full-wing dodge remains open`);
          }
        }
      }
    }
  }
});

test('standing on the announced aim takes fire while moving avoids the fixed target', () => {
  const boss = readyBoss();
  until(boss, unit => unit.state === 'charge', player);
  const events = until(boss, unit => unit.state === 'fire', {x: 119, y: player.y});
  const shots = events.filter(event => event.type === 'projectile').map(event => event.projectile);
  const middle = shots[2];
  assert.equal(middle.targetX, 360);
  const middleCrossing = middle.x + middle.vx * ((player.y - middle.y) / middle.vy);
  assert.ok(Math.abs(middleCrossing - 360) < .00001);
  assert.ok(Math.abs(middleCrossing - 119) > 119 + middle.r);
  assert.equal(GUARDIAN_ATLAS_RULES.maxHp, 24,
    'challenge comes from attacks rather than inflating the damage sponge');
});

test('both phase-two curtains preserve one announced traversable corridor at three viewport widths', () => {
  for (const width of [320, 390, 720]) {
    for (const seed of [1, 17, 9001]) {
      const boss = readyBoss({width, height: 1180, playerY: 1045, seed});
      hitGuardianAtlas(boss, boss.maxHp / 2);
      const events = until(boss, unit => unit.state === 'charge', {x: width / 2});
      const gap = structuredClone(boss.telegraph.safeGap);
      until(boss, unit => unit.state === 'fire', {x: width - 30}, events);
      runFor(boss, .65, {x: 30}, events);
      const shots = events.filter(event => event.type === 'projectile').map(event => event.projectile);
      // A 270px full-wing corridor can leave just one firing side in a 320px
      // fixture. Keep both real volleys rather than narrowing the ship's gap.
      assert.ok(shots.length >= 2 && shots.length <= 14);
      assert.deepEqual([...new Set(shots.map(shot => shot.volley))], [0, 1]);
      assert.equal(new Set(shots.map(shot => shot.projectileId)).size, shots.length);
      assert.ok(gap.left >= 14 && gap.right <= width - 14);
      assert.ok(gap.right - gap.left >= 270);
      for (const shot of shots) {
        assert.equal(shot.vx, 0, 'curtain must not drift into the promised corridor');
        assert.ok(shot.x + shot.r < gap.left || shot.x - shot.r > gap.right);
        assert.ok(Math.abs(shot.x - gap.center) > 119 + shot.r + 5,
          'the established full wing outline plus projectile radius and clearance fits');
        const crossingSeconds = (1045 - shot.y) / shot.vy;
        const crossingX = shot.x + shot.vx * crossingSeconds;
        assert.ok(Math.abs(crossingX - gap.center) > 119 + shot.r + 5,
          'the same full-width clearance must remain where the bullets reach the ship');
        assert.deepEqual(shot.safeGap, gap);
        assert.ok(shot.duration > (1045 - shot.y) / shot.vy);
      }
    }
  }
});

test('repeat hits play one hurt response without permanently resetting recovery or duplicating fire', () => {
  const boss = readyBoss();
  runFor(boss, .45);
  const priorTime = boss.stateTime;
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.state, 'hurt');
  runFor(boss, .08);
  const hurtTime = boss.stateTime;
  hitGuardianAtlas(boss, 1);
  assert.equal(boss.stateTime, hurtTime);
  runFor(boss, .09);
  assert.equal(boss.state, 'idle');
  assert.ok(boss.stateTime >= priorTime);
  const events = until(boss, unit => unit.state === 'fire');
  assert.equal(events.filter(event => event.type === 'projectile').length, 5);
  const id = boss.attackId;
  hitGuardianAtlas(boss, 1);
  runFor(boss, .8, player, events);
  assert.equal(events.filter(event => event.type === 'projectile' &&
    event.projectile.attackId === id).length, 5);
});

test('flank movement is protected, then holds a real exposed-core counterattack window', () => {
  const boss = readyBoss();
  until(boss, unit => unit.state === 'fire');
  until(boss, unit => unit.state === 'idle');
  const startingX = boss.x;
  assert.equal(boss.vulnerability, false);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'armored');
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseOne.repositionSeconds / 2);
  assert.ok(boss.x > startingX && boss.x < boss.patrolToX);
  assert.equal(boss.vulnerability, false);
  const paused = structuredClone(boss);
  advanceGuardianAtlas(boss, 0, player);
  assert.deepEqual(boss, paused);
  until(boss, unit => unit.vulnerability);
  assert.ok(boss.x - startingX > 100, 'a pilot left at the centre must re-align');
  assert.equal(boss.x, boss.patrolToX);
  const exposedX = boss.x;
  runFor(boss, .8);
  assert.equal(boss.vulnerability, true, 'the core stays open long enough for a travelling basic pulse');
  assert.equal(boss.x, exposedX, 'an exposed core does not dodge by teleporting while the shot travels');
  until(boss, unit => unit.state === 'charge');
  const lockedOrigin = boss.x;
  until(boss, unit => unit.state === 'fire', {x: 119, y: 1145});
  assert.equal(boss.x, lockedOrigin, 'charging cannons stay attached to their announced origin');
});

test('visual recoil advances the underlying encounter clock instead of extending open-core time', () => {
  const control = readyBoss(), hit = readyBoss();
  const controlAge = control.age;
  until(control, unit => unit.state === 'charge');
  for (let frame = 0; frame < 180 && hit.state !== 'charge'; frame++) {
    if (frame % 6 === 0 && hit.vulnerability) hitGuardianAtlas(hit, .01);
    advanceGuardianAtlas(hit, 1 / 60, player);
  }
  assert.equal(hit.state, 'charge');
  assert.ok(hit.age - control.age <= GUARDIAN_ATLAS_RULES.hurtSeconds + .02);
  assert.ok(hit.age - controlAge < 1.55, 'repeated light hits cannot turn the first opening into a stun lock');
});

test('a physical impact during the second-volley threshold neither suppresses nor duplicates the shot', () => {
  const boss = readyBoss();
  hitGuardianAtlas(boss, boss.maxHp / 2);
  const events = until(boss, unit => unit.state === 'fire');
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseTwo.secondVolleyAt - .05, player, events);
  const attackId = boss.attackId;
  assert.equal(boss.volley, 1);
  assert.equal(hitGuardianAtlas(boss, 1).accepted, true);
  assert.equal(boss.state, 'hurt');
  runFor(boss, .08, player, events);
  assert.equal(boss.volley, 2, 'the attack clock runs while the damage pose plays');
  runFor(boss, 1, player, events);
  const volleys = events.filter(event => event.type === 'volley' && event.attackId === attackId);
  assert.deepEqual(volleys.map(event => event.volley), [0, 1]);
  const shots = events.filter(event => event.type === 'projectile' && event.projectile.attackId === attackId);
  assert.equal(new Set(shots.map(event => event.projectile.projectileId)).size, shots.length);
});

test('the next attack leaves manual re-alignment and projectile-travel time after the last bullet clears', () => {
  const boss = readyBoss();
  hitGuardianAtlas(boss, boss.maxHp / 2);
  let firstId = null, lastClearAt = 0, nextWarningAt = null;
  for (let frame = 0; frame < 1200 && nextWarningAt === null; frame++) {
    for (const event of advanceGuardianAtlas(boss, 1 / 60, player)) {
      if (event.type === 'warning') {
        if (firstId === null) firstId = event.attackId;
        else nextWarningAt = boss.age;
      }
      if (event.type === 'projectile' && event.projectile.attackId === firstId) {
        const shot = event.projectile;
        lastClearAt = Math.max(lastClearAt, boss.age +
          (player.y + 104 + shot.r - shot.y) / shot.vy);
      }
    }
  }
  assert.notEqual(nextWarningAt, null);
  assert.ok(nextWarningAt - lastClearAt >= GUARDIAN_ATLAS_RULES.phaseTwo.counterattackSeconds - .04);
});

// A conservative pure-model manual-input simulation. It sees actual emitted
// projectile positions, moves horizontally at 720 logical px/s, reacts/taps at
// 200 ms intervals and uses the real three-charge/recharge/travel rules. It is
// not a browser playthrough, human balance approval or a substituted game loop.
function simulateManualEncounter(type) {
  const boss = createGuardianAtlas({seed: 507});
  const weapons = createClassicWeapons({type, unlocked: type === 'pulse' ? ['pulse'] : ['pulse', 'twin']});
  const ship = {x: 360, y: 1145};
  let enemyShots = [], destination = ship.x, reaction = 0, hull = 100, taps = 0, rewards = 0;
  const phases = new Set();
  const pickDestination = () => {
    const choices = [119, 601, ship.x, boss.x];
    for (let x = 119; x <= 601; x += 24) choices.push(x);
    for (const shot of enemyShots) {
      const seconds = Math.max(0, (ship.y - shot.y) / shot.vy);
      const crossing = shot.x + shot.vx * seconds;
      choices.push(crossing - 119 - shot.r - 14, crossing + 119 + shot.r + 14);
    }
    const cost = candidate => {
      let score = Math.abs(candidate - boss.x) * .18 + Math.abs(candidate - ship.x) * .025;
      for (const shot of enemyShots) {
        const start = Math.max(0, (ship.y - 158 - shot.r - shot.y) / shot.vy);
        const end = Math.min(4.1, (ship.y + 104 + shot.r - shot.y) / shot.vy);
        for (let future = start; future <= end; future += .05) {
          const x = ship.x + Math.max(-720 * future, Math.min(720 * future, candidate - ship.x));
          if (Math.abs(shot.x + shot.vx * future - x) <= 119 + shot.r + 6) {
            score += 1000000 / (.2 + future); break;
          }
        }
      }
      return score;
    };
    return choices.map(x => Math.max(119, Math.min(601, x)))
      .map(x => ({x, cost: cost(x)})).sort((a, b) => a.cost - b.cost)[0].x;
  };
  for (let frame = 0; frame < 180 * 60 && !boss.resolved && hull > 0; frame++) {
    const delta = 1 / 60;
    for (const event of advanceGuardianAtlas(boss, delta, ship)) {
      if (event.type === 'projectile') enemyShots.push({...event.projectile});
      if (event.clearProjectiles || event.type === 'shutdown') enemyShots = [];
      if (event.type === 'disabled') rewards++;
    }
    phases.add(boss.phase);
    reaction -= delta;
    if (reaction <= 0) {
      reaction = .2;
      destination = pickDestination();
      if (boss.vulnerability && Math.abs(ship.x - boss.x) < 70) {
        if (triggerClassicWeapon(weapons, {x: ship.x, y: ship.y - 125}).accepted) taps++;
      }
    }
    ship.x += Math.max(-720 * delta, Math.min(720 * delta, destination - ship.x));
    advanceClassicWeapons(weapons, delta);
    for (const shot of [...weapons.projectiles]) {
      if (Math.hypot(shot.x - boss.x, shot.y - boss.y) > boss.r + shot.radius) continue;
      const impact = hitClassicProjectile(weapons, shot.id, 'atlas');
      if (impact.accepted) {
        const hit = hitGuardianAtlas(boss, impact.damage);
        if (hit.events.some(event => event.clearProjectiles || event.type === 'shutdown')) enemyShots = [];
      }
    }
    for (let index = enemyShots.length - 1; index >= 0; index--) {
      const shot = enemyShots[index];
      shot.x += shot.vx * delta; shot.y += shot.vy * delta; shot.life -= delta;
      if (Math.abs(shot.x - ship.x) <= 119 + shot.r &&
        shot.y >= ship.y - 158 - shot.r && shot.y <= ship.y + 104 + shot.r) {
        hull -= shot.damage; enemyShots.splice(index, 1);
      } else if (shot.life <= 0 || shot.y > 1400) enemyShots.splice(index, 1);
    }
  }
  return {resolved: boss.resolved, hp: boss.hp, hull, taps, rewards,
    seconds: boss.age, phases: [...phases]};
}

test('manual pulse and retained twin configurations can defeat both phases with the real battery', t => {
  const pulse = simulateManualEncounter('pulse'), twin = simulateManualEncounter('twin');
  for (const result of [pulse, twin]) {
    t.diagnostic(JSON.stringify(result));
    assert.equal(result.resolved, true);
    assert.equal(result.hp, 0); assert.ok(result.hull > 0);
    assert.equal(result.rewards, 1); assert.deepEqual(result.phases, [1, 2]);
    assert.ok(result.seconds >= 20 && result.seconds < 155,
      'manual basic fire must fit a sustained encounter without a two-minute ammunition tax');
  }
  assert.ok(pulse.taps >= 24 && twin.taps >= 12);
  assert.ok(twin.seconds < pulse.seconds, 'the retained upgrade has a perceptible benefit');
});

test('the next corridor warning waits until the previous curtain has passed the player on tall screens', () => {
  for (const height of [568, 1180, 1560]) {
    const playerY = height === 568 ? 450 : height - 135;
    const boss = readyBoss({height, playerY});
    hitGuardianAtlas(boss, boss.maxHp / 2);
    const events = [];
    let firstAttackId = null, lastShotPassedAt = 0, nextWarningAt = null;
    for (let frame = 0; frame < 20 * 60 && nextWarningAt === null; frame++) {
      const emitted = advanceGuardianAtlas(boss, 1 / 60, {x: 360});
      for (const event of emitted) {
        events.push(event);
        if (event.type === 'warning') {
          if (firstAttackId === null) firstAttackId = event.attackId;
          else if (event.attackId !== firstAttackId) nextWarningAt = boss.age;
        }
        if (event.type === 'projectile' && event.projectile.attackId === firstAttackId) {
          const shot = event.projectile;
          lastShotPassedAt = Math.max(lastShotPassedAt,
            boss.age + (playerY - shot.y) / shot.vy);
        }
      }
    }
    assert.ok(nextWarningAt !== null);
    assert.ok(nextWarningAt > lastShotPassedAt + .3,
      `height ${height}: moving toward the newly announced corridor must not cross old fire`);
  }
});

test('deactivation has a visible duration and emits its progression event exactly once', () => {
  const boss = readyBoss();
  const death = hitGuardianAtlas(boss, 100);
  assert.equal(death.accepted, true);
  assert.equal(boss.hp, 0);
  assert.equal(boss.state, 'disabled');
  assert.equal(boss.disabled, true);
  assert.equal(boss.resolved, false);
  assert.equal(death.events.filter(event => event.type === 'shutdown').length, 1);
  assert.equal(death.events.some(event => event.type === 'disabled'), false);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'disabled');
  const events = runFor(boss, 1);
  assert.equal(boss.resolved, false);
  runFor(boss, 1, player, events);
  assert.equal(boss.resolved, true);
  assert.equal(events.filter(event => event.type === 'disabled').length, 1);
  assert.equal(events.some(event => event.type === 'projectile'), false);
  const final = structuredClone(boss);
  runFor(boss, 10, player, events);
  assert.deepEqual(boss, final);
  assert.equal(events.filter(event => event.type === 'disabled').length, 1);
});

test('same seed and inputs reproduce warnings, transitions and projectile trajectories', () => {
  function trace() {
    const boss = readyBoss({seed: 507});
    hitGuardianAtlas(boss, boss.maxHp / 2);
    const events = runFor(boss, 32);
    return {boss, events};
  }
  const first = trace();
  assert.deepEqual(trace(), first);
  const warningGaps = first.events.filter(event => event.type === 'warning' && event.safeGap)
    .map(event => event.safeGap.center);
  assert.ok(warningGaps.length >= 3);
  for (let index = 1; index < warningGaps.length; index++) {
    assert.notEqual(warningGaps[index], warningGaps[index - 1]);
  }
});

test('callback delivery preserves returned-event order and does not duplicate emission', () => {
  const boss = readyBoss();
  until(boss, unit => unit.state === 'charge');
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseOne.chargeSeconds - .04);
  const callbacks = [];
  const events = advanceGuardianAtlas(boss, .05, player, event => callbacks.push(event));
  assert.deepEqual(callbacks, events);
  assert.equal(events.filter(event => event.type === 'projectile').length, 5);
  assert.deepEqual(advanceGuardianAtlas(boss, .01, player), []);
});

test('long deltas are bounded and invalid state inputs fail without advancing combat', () => {
  const boss = createGuardianAtlas();
  advanceGuardianAtlas(boss, 100, player);
  assert.equal(boss.age, GUARDIAN_ATLAS_RULES.maxDelta);
  const before = structuredClone(boss);
  for (const dt of [-.01, NaN, Infinity]) assert.throws(() => advanceGuardianAtlas(boss, dt, player));
  assert.throws(() => advanceGuardianAtlas(boss, .02, {x: NaN}));
  assert.throws(() => advanceGuardianAtlas(boss, .02, player, null));
  assert.deepEqual(boss, before);
  for (const damage of [0, -.1, Infinity, NaN]) assert.throws(() => hitGuardianAtlas(boss, damage));
  assert.throws(() => createGuardianAtlas({width: 100}));
  assert.throws(() => createGuardianAtlas({height: 500}));
  assert.throws(() => createGuardianAtlas({playerY: 200}));
});

test('encounter has no independent animation loop, wall clock, random source or save owner', async () => {
  const source = await readFile(new URL('../src/game/combat/guardian-atlas.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|setInterval|setTimeout|Date\.now|Math\.random|localStorage/);
});
