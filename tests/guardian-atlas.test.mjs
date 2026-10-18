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

test('a short mechanical deployment fixes sampled aim and emits one ballistic salvo without homing', () => {
  const boss = readyBoss();
  const events = until(boss, unit => unit.state === 'charge', {x: 170, y: player.y});
  const deployment = events.find(event => event.type === 'warning');
  assert.equal(deployment.kind, 'aimedSalvo');
  assert.equal(deployment.pattern, 'focusedSalvo');
  assert.equal(deployment.safeGap, null, 'the model does not promise a marked safety corridor');
  assert.equal(deployment.targetX, 170);
  assert.ok(deployment.seconds >= .3 && deployment.seconds <= .4);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'armored');
  const shots = until(boss, unit => unit.state === 'fire', {x: 600});
  const emitted = shots.filter(event => event.type === 'projectile');
  assert.equal(emitted.length, 3);
  const middle = emitted[1].projectile;
  assert.equal(middle.targetX, 170, 'a last-second reversal cannot change a locked cannon');
  const crossingX = middle.x + middle.vx * ((middle.targetY - middle.y) / middle.vy);
  assert.ok(Math.abs(crossingX - 170) < .00001);
  assert.ok(middle.vy > 0);
  assert.equal(middle.telegraphSeconds, deployment.seconds);
  assert.ok((middle.targetY - middle.y) / middle.vy > 1.8);
  const snapshot = structuredClone(middle), attackId = middle.attackId;
  runFor(boss, .7, {x: 600}, shots);
  assert.equal(shots.filter(event => event.type === 'projectile' &&
    event.projectile.attackId === attackId).length, 3);
  assert.deepEqual(middle, snapshot, 'later observations never steer an emitted projectile');
});

test('half-health causes a protected transition and two real crossfire volleys', () => {
  const boss = readyBoss();
  const result = hitGuardianAtlas(boss, boss.maxHp / 2);
  assert.equal(result.accepted, true);
  assert.equal(boss.phase, 2); assert.equal(boss.state, 'phaseBreak');
  assert.equal(boss.vulnerability, false); assert.equal(hitGuardianAtlas(boss, 1).accepted, false);
  assert.ok(result.events.some(event => event.type === 'phase' && event.clearProjectiles));
  const events = until(boss, unit => unit.state === 'charge');
  const deployment = events.find(event => event.type === 'warning');
  assert.equal(deployment.pattern, 'crossfire'); assert.equal(deployment.safeGap, null);
  until(boss, unit => unit.state === 'fire', player, events);
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseTwo.fireSeconds, player, events);
  const volleys = events.filter(event => event.type === 'volley');
  assert.deepEqual(volleys.map(event => event.volley), [0, 1]);
  assert.equal(boss.state, 'idle'); assert.equal(boss.vulnerability, false);
  until(boss, unit => unit.vulnerability);
  assert.equal(boss.vulnerability, true, 'the new pattern retains an actual counterattack');
});

test('phase two cycles crossfire, rake and observed-lead routines with unique physical emissions', () => {
  const boss = readyBoss(); hitGuardianAtlas(boss, boss.maxHp / 2);
  const events = runFor(boss, 40, {x: 360, y: 1145});
  until(boss, unit => unit.state === 'idle', {x: 360, y: 1145}, events);
  const deployments = events.filter(event => event.type === 'warning');
  assert.ok(deployments.length >= 6);
  for (const [index, deployment] of deployments.entries()) {
    assert.equal(deployment.pattern, ['crossfire', 'rakingSalvo', 'leadSalvo'][index % 3]);
    assert.equal(deployment.kind, 'aimedSalvo'); assert.equal(deployment.safeGap, null);
    assert.ok(deployment.seconds >= .3 && deployment.seconds <= .4);
    const shots = events.filter(event => event.type === 'projectile' &&
      event.projectile.attackId === deployment.attackId).map(event => event.projectile);
    if (shots.length === 0) continue; // The final physical deployment may be incomplete.
    assert.equal(shots.length, deployment.pattern === 'crossfire' ? 10 : 6);
    assert.equal(new Set(shots.map(shot => shot.projectileId)).size, shots.length);
    assert.deepEqual([...new Set(shots.map(shot => shot.volley))], [0, 1]);
    const central = deployment.pattern === 'crossfire' ? [shots[2], shots[7]] : [shots[1], shots[4]];
    if (deployment.pattern === 'crossfire') {
      assert.ok(central[0].x < deployment.originX && central[1].x > deployment.originX);
      assert.ok(central[0].vx > central[1].vx);
    }
    if (deployment.pattern === 'rakingSalvo') assert.ok(central[0].targetX < central[1].targetX);
    for (const shot of central) {
      const crossingX = shot.x + shot.vx * ((shot.targetY - shot.y) / shot.vy);
      assert.ok(Math.abs(crossingX - shot.targetX) < .00001);
      assert.equal(shot.safeGap, null);
    }
  }
});

test('every faster attack has a full-wing ballistic escape across tall and short arenas without safeGap', () => {
  for (const height of [568, 1280, 1560]) {
    const playerY = height === 568 ? 450 : height - 135;
    for (const targetX of [145, 360, 575]) {
      for (const desired of ['focusedSalvo', 'crossfire', 'rakingSalvo', 'leadSalvo']) {
        const boss = readyBoss({width: 720, height, playerY});
        if (desired !== 'focusedSalvo') hitGuardianAtlas(boss, boss.maxHp / 2);
        until(boss, unit => unit.state === 'charge' && unit.telegraph.pattern === desired,
          {x: targetX, y: playerY});
        const deployment = {...boss.telegraph};
        const events = until(boss, unit => unit.state === 'fire', {x: 720 - targetX, y: playerY});
        runFor(boss, .57, {x: 720 - targetX, y: playerY}, events);
        const shots = events.filter(event => event.type === 'projectile' &&
          event.projectile.attackId === deployment.attackId).map(event => event.projectile);
        assert.equal(shots.length, desired === 'focusedSalvo' ? 3 : desired === 'crossfire' ? 10 : 6);
        for (const shot of shots) {
          assert.equal(shot.safeGap, null);
          assert.ok(Math.abs(Math.hypot(shot.vx, shot.vy) -
            (desired === 'focusedSalvo' ? 400 : 430)) < .00001);
          assert.ok(shot.vy > 0 && shot.duration > (playerY + 104 - shot.y) / shot.vy);
        }
        const escapeX = [119, 601].find(candidate => shots.every(shot =>
          [playerY - 158 - shot.r, playerY + 104 + shot.r].every(y => {
            const x = shot.x + shot.vx * ((y - shot.y) / shot.vy);
            return Math.abs(x - candidate) > 119 + shot.r;
          })));
        assert.notEqual(escapeX, undefined,
          `${height}/${targetX}/${desired}: the full unchanged wing outline retains an open side`);
        // An actual projectile is visible in flight. A pilot may react to it;
        // no omniscient response to an unrendered internal target is required.
        const arrival = Math.min(...shots.map(shot => (playerY - 158 - shot.r - shot.y) / shot.vy));
        assert.ok(Math.abs(escapeX - targetX) / 720 < deployment.seconds + arrival,
          `${height}/${targetX}/${desired}: room to move at the real pilot speed`);
      }
    }
  }
});

test('remaining on the sampled aim takes fire and a real lateral dodge avoids it', () => {
  const boss = readyBoss(); until(boss, unit => unit.state === 'charge', player);
  const events = until(boss, unit => unit.state === 'fire', {x: 119, y: player.y});
  const middle = events.filter(event => event.type === 'projectile')[1].projectile;
  assert.equal(middle.targetX, 360);
  const crossing = middle.x + middle.vx * ((player.y - middle.y) / middle.vy);
  assert.ok(Math.abs(crossing - 360) < .00001);
  assert.ok(Math.abs(crossing - 119) > 119 + middle.r);
  assert.equal(GUARDIAN_ATLAS_RULES.maxHp, 36,
    'both phases are balanced against the new twenty-charge basic magazine');
});

test('100 seeds keep physical phase-two volleys finite, unique and bounded without a safe-lane marker', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const width = [320, 390, 720][seed % 3];
    const boss = readyBoss({width, height: 1180, playerY: 1045, seed});
    hitGuardianAtlas(boss, boss.maxHp / 2);
    const events = runFor(boss, 25, {x: width * .52, y: 1045});
    const shots = events.filter(event => event.type === 'projectile');
    assert.ok(shots.length >= 20 && shots.length <= 60);
    assert.equal(new Set(shots.map(event => event.projectile.projectileId)).size, shots.length);
    for (const {projectile: shot} of shots) {
      assert.equal(shot.safeGap, null); assert.ok(shot.vy > 0);
      assert.ok(Number.isFinite(shot.vx) && shot.duration === 7);
      assert.ok(shot.duration > (1045 - shot.y) / shot.vy);
    }
    const perAttack = new Map();
    for (const {projectile: shot} of shots) perAttack.set(shot.attackId, (perAttack.get(shot.attackId) || 0) + 1);
    assert.ok([...perAttack.values()].every(count => count <= 10));
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
  assert.equal(events.filter(event => event.type === 'projectile').length, 3);
  const id = boss.attackId;
  hitGuardianAtlas(boss, 1);
  runFor(boss, .8, player, events);
  assert.equal(events.filter(event => event.type === 'projectile' &&
    event.projectile.attackId === id).length, 3);
});

test('flank movement is protected, then holds a real exposed-core counterattack window', () => {
  const boss = readyBoss();
  until(boss, unit => unit.state === 'fire');
  until(boss, unit => unit.state === 'idle');
  const startingX = boss.x;
  assert.equal(boss.vulnerability, false);
  assert.equal(hitGuardianAtlas(boss, 1).reason, 'armored');
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseOne.repositionSeconds / 2);
  assert.ok(Math.abs(boss.x - startingX) > 1 && Math.abs(boss.x - startingX) < Math.abs(boss.patrolToX - startingX));
  assert.equal(boss.vulnerability, false);
  const paused = structuredClone(boss);
  advanceGuardianAtlas(boss, 0, player);
  assert.deepEqual(boss, paused);
  until(boss, unit => unit.vulnerability);
  assert.ok(Math.abs(boss.x - startingX) > 50, 'a pilot left at the centre must re-align');
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
// 200 ms intervals and uses the real twenty-charge/recharge/travel rules. It is
// not a browser playthrough, human balance approval or a substituted game loop.
function simulateManualEncounter(type, seed = 507) {
  const boss = createGuardianAtlas({seed});
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
    assert.ok(result.seconds >= 15 && result.seconds < 110,
      'the new magazine supports a sustained manual encounter without a two-minute ammunition tax');
  }
  assert.ok(pulse.taps >= 36 && twin.taps >= 18);
  assert.ok(twin.seconds < pulse.seconds, 'the retained upgrade has a perceptible benefit');
});

test('the next cannon routine waits until the previous physical salvo clears the tail on tall screens', () => {
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
      `height ${height}: moving toward a new firing line must not cross old fire`);
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
  const patterns = first.events.filter(event => event.type === 'warning').map(event => event.pattern);
  assert.ok(patterns.length >= 4);
  assert.equal(new Set(patterns).size, 3);
  assert.ok(first.events.filter(event => event.type === 'warning').every(event => event.safeGap === null));
  assert.ok(first.events.filter(event => event.type === 'state' && event.state === 'idle').length >= 4);
});

test('callback delivery preserves returned-event order and does not duplicate emission', () => {
  const boss = readyBoss();
  until(boss, unit => unit.state === 'charge');
  runFor(boss, GUARDIAN_ATLAS_RULES.phaseOne.chargeSeconds - .04);
  const callbacks = [];
  const events = advanceGuardianAtlas(boss, .05, player, event => callbacks.push(event));
  assert.deepEqual(callbacks, events);
  assert.equal(events.filter(event => event.type === 'projectile').length, 3);
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


test('observed player movement produces bounded lead, never reads later input or steers a shot', () => {
  const boss = readyBoss(), pilot = {x: 180, y: player.y};
  until(boss, unit => unit.state === 'fire', pilot);
  until(boss, unit => unit.state === 'idle', pilot);
  for (let frame = 0; frame < 600 && boss.state !== 'charge'; frame++) {
    pilot.x = Math.min(560, 180 + frame * 1.2);
    advanceGuardianAtlas(boss, 1 / 60, pilot);
  }
  const lock = {...boss.telegraph};
  assert.equal(lock.pattern, 'leadSalvo');
  assert.ok(lock.observedVx > 0 && lock.observedVx <= 720);
  assert.ok(lock.leadOffset > 0 && lock.leadOffset <= 105);
  assert.ok(lock.targetX >= lock.observedX);
  const events = until(boss, unit => unit.state === 'fire', {x: 119, y: player.y});
  const shots = events.filter(event => event.type === 'projectile').map(event => event.projectile);
  assert.equal(shots.length, 3);
  assert.ok(shots.every(shot => shot.targetX === lock.targetX));
  const frozen = structuredClone(shots);
  runFor(boss, .8, {x: 601, y: 900}, events);
  assert.deepEqual(shots, frozen);
});

test('phase-two projectile populations are capped and every routine leaves a physical counterattack window', () => {
  const boss = readyBoss(); hitGuardianAtlas(boss, boss.maxHp / 2);
  let active = [], maximum = 0, count = 0;
  for (let frame = 0; frame < 90 * 60; frame++) {
    for (const event of advanceGuardianAtlas(boss, 1 / 60, player)) {
      if (event.type === 'projectile') { active.push({...event.projectile}); count++; }
    }
    for (const shot of active) { shot.life -= 1 / 60; shot.y += shot.vy / 60; }
    active = active.filter(shot => shot.life > 0 && shot.y < 1400);
    maximum = Math.max(maximum, active.length);
  }
  assert.ok(count > 80, 'the boss actually sustains attacks');
  assert.ok(maximum <= 10, 'one finite physical salvo at a time, never an unbounded bullet stack');
});

test('manual Pulse and Twin remain viable across multiple deterministic combat seeds with no target markers', t => {
  for (const seed of [1, 17, 507, 9001]) {
    for (const type of ['pulse', 'twin']) {
      const result = simulateManualEncounter(type, seed);
      t.diagnostic(JSON.stringify({seed, type, ...result}));
      assert.equal(result.resolved, true); assert.ok(result.hull > 0);
      assert.equal(result.rewards, 1); assert.deepEqual(result.phases, [1, 2]);
      assert.ok(result.seconds < 110 && result.taps >= (type === 'pulse' ? 36 : 18));
    }
  }
});
