import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMET_SHOWER_RULES, COMET_SHOWER_VERSION, createCometShower, advanceCometShower,
  advanceShowerComet, releaseCometShowerItem, showerCometIntersectsCircle, cometShowerSnapshot
} from '../src/game/progression/comet-shower.js';

const DT = 1 / 60;
function run({width = 720, height = 1280, seed = 0, stageId = '1.5', elapsed = 0,
  seconds = 34, shipWidth = COMET_SHOWER_RULES.shipWidth,
  shipSideClearance = COMET_SHOWER_RULES.shipSideClearance,
  player = {x: width / 2, y: height * .72}} = {}) {
  const state = createCometShower({width, height, seed, stageId, elapsed, shipWidth, shipSideClearance});
  const items = [], events = [], seen = new Set(), trajectories = new Map();
  let peak = 0;
  for (let frame = 0; frame < seconds / DT; frame++) {
    advanceCometShower(state, DT, player, event => {
      events.push(event);
      if (event.type === 'spawn') {
        assert.ok(!seen.has(event.item.id), 'one emission per stable nucleus ID');
        seen.add(event.item.id);items.push(event.item);
        const speed = Math.hypot(event.item.vx, event.item.vy);
        assert.ok(speed >= 700 && speed <= 952, `initial speed ${speed}`);
        trajectories.set(event.item.id, {corridor: event.corridor, positions: []});
      }
    });
    peak = Math.max(peak, items.length);
    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index], trace = trajectories.get(item.id);
      const alive = advanceShowerComet(item, DT);
      trace.positions.push({x: item.x, y: item.y, vx: item.vx, vy: item.vy});
      const corridor = trace.corridor;
      if (item.y + item.r + 10 >= corridor.top && item.y - item.r - 10 <= corridor.bottom) {
        assert.ok(item.x + item.r + 10 < corridor.left || item.x - item.r - 10 > corridor.right,
          `clear lower flight passage at ${width}x${height}, seed ${seed}, ${item.id}`);
      }
      if (!alive) {releaseCometShowerItem(state, item);items.splice(index, 1);}
    }
  }
  return {state, items, events, peak, trajectories};
}

test('new shower is isolated from route content/checkpoints and rejects impossible input', () => {
  assert.equal(COMET_SHOWER_VERSION, 'comet-shower-v4');
  const state = createCometShower();
  assert.equal(state.stageId, '1.5');
  assert.equal(state.elapsed, 0);
  assert.throws(() => createCometShower({stageId: '1.4'}), RangeError);
  assert.throws(() => createCometShower({width: 200}), RangeError);
  assert.throws(() => createCometShower({seed: Infinity}), RangeError);
  assert.throws(() => createCometShower({elapsed: -1}), RangeError);
  assert.throws(() => createCometShower({shipWidth: 0}), RangeError);
  assert.throws(() => createCometShower({shipWidth: 140, shipSideClearance: 60}), RangeError);
  assert.throws(() => createCometShower({shipSideClearance: NaN}), RangeError);
  assert.throws(() => advanceCometShower(state, -.01, {x: 1, y: 2}, () => {}), RangeError);
  assert.throws(() => advanceCometShower(state, DT, {x: NaN, y: 2}, () => {}), TypeError);
});

test('three dispersed bursts are preceded by two played seconds of warning and bounded to the active cap', () => {
  const result = run();
  const warnings = result.events.filter(event => event.type === 'warning');
  const spawns = result.events.filter(event => event.type === 'spawn');
  assert.deepEqual(warnings.map(event => event.at), [5, 14, 23]);
  assert.ok(warnings.every(event => event.text.startsWith('Se aproxima lluvia de cometas')));
  assert.deepEqual(spawns.map(event => event.burst),
    COMET_SHOWER_RULES.burstSizes.flatMap((size, burst) => Array(size).fill(burst)));
  for (let burst = 0; burst < 3; burst++) {
    const members = spawns.filter(event => event.burst === burst);
    assert.ok(new Set(members.map(event => event.item.entryEdge)).size >= 2, `burst ${burst} mixes entrances`);
    const gaps = members.slice(1).map((event, index) => +(event.at - members[index].at).toFixed(3));
    assert.ok(new Set(gaps).size > 2, `burst ${burst} spawns at irregular intervals`);
  }
  for (const warning of warnings) {
    const first = spawns.find(event => event.burst === warning.burst);
    assert.equal(first.at - warning.at, 2);
  }
  assert.ok(spawns.some(event => event.item.vy < 0), 'overtaking arrives from behind');
  assert.ok(spawns.some(event => event.item.x < 0), 'lateral entry from port');
  assert.ok(spawns.some(event => event.item.x > 720), 'lateral entry from starboard');
  assert.ok(result.peak <= COMET_SHOWER_RULES.maxActive);
  const rainPaths = [...result.trajectories.entries()].filter(([id]) => id.includes(':1:'));
  assert.ok(rainPaths.some(([, trace]) => trace.positions.some(point =>
    point.y > 1280 * .55 && point.y < 1280 * .8 && point.x > 119 && point.x < 601)),
  'at least one rain path crosses useful interior flight space rather than hiding along the edge');
  assert.equal(result.items.length, 0);
  assert.equal(cometShowerSnapshot(result.state).done, true);
});

test('100 seeds across six viewports retain a reachable whole-hull passage for the 30% larger ship', () => {
  const profiles = [[250, 300], [320, 568], [390, 844], [540, 960], [720, 1280], [720, 1558]];
  for (const [width, height] of profiles) for (let seed = 0; seed < 100; seed++) {
    const result = run({width, height, seed});
    assert.equal(result.events.filter(event => event.type === 'warning').length, 3);
    assert.equal(result.state.spawned, 24, `complete bursts at ${width}x${height}, seed ${seed}`);
    assert.ok(result.peak <= COMET_SHOWER_RULES.maxActive);
    for (const corridor of result.state.corridors) {
      assert.ok(corridor.width >= COMET_SHOWER_RULES.shipWidth + 40);
      assert.ok(corridor.center >= COMET_SHOWER_RULES.shipSideClearance &&
        corridor.center <= width - COMET_SHOWER_RULES.shipSideClearance);
      assert.ok(corridor.left >= 0 && corridor.right <= width);
    }
    // The largest lane change is reachable at 180 logical px/s during the
    // guaranteed quiet gap, even before the next two-second warning begins.
    for (let burst = 1; burst < 3; burst++) {
      const distance = Math.abs(result.state.corridors[burst].center - result.state.corridors[burst - 1].center);
      assert.ok(distance / 180 < 3, `reachable next crossing, seed ${seed}`);
    }
  }
});

test('trajectories curve ballistically and cannot home after the player changes direction', () => {
  const left = run({seed: 12, player: {x: 119, y: 700}});
  const right = run({seed: 12, player: {x: 601, y: 1000}});
  assert.deepEqual(left.events.map(event => ({id: event.id, at: event.at, type: event.type})),
    right.events.map(event => ({id: event.id, at: event.at, type: event.type})));
  assert.deepEqual(left.trajectories, right.trajectories);
  for (const trace of left.trajectories.values()) {
    assert.ok(trace.positions.length > 3);
    const first = trace.positions[0], last = trace.positions.at(-1);
    assert.notEqual(Math.atan2(first.vy, first.vx), Math.atan2(last.vy, last.vx));
  }
});

test('wide-field danger reaches a stationary central hull instead of leaving a permanent refuge', () => {
  // A 32px circle around the ship center lies entirely inside its unchanged
  // hull. Crossing even this smaller body is sufficient to disprove immunity;
  // exact polygon/contact integration has its own legacy-loop regression.
  const width=720,height=1558,player={x:360,y:1262},state=createCometShower({width,height,seed:4055});
  const items=[],contacts=new Set(),modes=new Set();
  for(let frame=0;frame<34/DT;frame++) {
    advanceCometShower(state,DT,player,event=>{if(event.type==='spawn')items.push(event.item);});
    for(let index=items.length-1;index>=0;index--) {
      const item=items[index],alive=advanceShowerComet(item,DT);
      if(showerCometIntersectsCircle(item,{...player,r:32})){contacts.add(item.id);modes.add(item.crossingMode);}
      if(!alive){releaseCometShowerItem(state,item);items.splice(index,1);}
    }
  }
  assert.ok(contacts.size>0,'A stationary center must not be immune throughout the vacuum');
  assert.ok(modes.has(1),'Descending rain reaches the central hull regardless of its new seeded burst position');
  assert.ok(modes.has(2),'An overtaking train also requires a response');
});

test('environmental warnings describe the actual seeded entrance two seconds before its first nucleus at every viewport', () => {
  const labels={left:'desde la izquierda',right:'desde la derecha',top:'desde arriba',bottom:'desde abajo'};
  for(const [width,height] of [[320,568],[390,844],[720,1558]]) for(let seed=0;seed<30;seed++) {
    const result=run({width,height,seed});
    for(const warning of result.events.filter(event=>event.type==='warning')) {
      const first=result.events.find(event=>event.type==='spawn'&&event.burst===warning.burst);
      assert.equal(first.at-warning.at,2);
      assert.equal(warning.text,`Se aproxima lluvia de cometas · ${labels[first.item.entryEdge]}`);
      const trace=result.trajectories.get(first.item.id).positions[0];
      if(first.item.entryEdge==='left')assert.ok(trace.x<0);
      if(first.item.entryEdge==='right')assert.ok(trace.x>width);
      if(first.item.entryEdge==='top')assert.ok(trace.y<0);
      if(first.item.entryEdge==='bottom')assert.ok(trace.y>height);
    }
  }
});

test('seeded crossing order, entrance pitch, passage and curvature do not repeat one fixed choreography', () => {
  const orders=new Set(),centers=new Set(),angles=new Set(),signatures=new Set();
  for(let seed=0;seed<48;seed++) {
    const result=run({seed});
    orders.add(result.state.burstModes.join(','));
    const firstCorridor=result.state.corridors[0];centers.add(firstCorridor.center.toFixed(2));
    const spawns=result.events.filter(event=>event.type==='spawn');
    signatures.add(spawns.map(event=>{const p=result.trajectories.get(event.item.id).positions[0];
      angles.add(Math.atan2(p.vy,p.vx).toFixed(2));return`${event.item.entryEdge}:${p.x.toFixed(1)}:${p.vx.toFixed(1)}`;}).join('|'));
    assert.deepEqual([...result.state.burstModes].sort(),[0,1,2],'all three arrival families remain represented');
    const replay=run({seed});
    assert.deepEqual(result.trajectories,replay.trajectories,'same version/seed reproduces exact ballistic paths');
    assert.deepEqual(result.state.corridors,replay.state.corridors);
  }
  assert.equal(orders.size,6,'the burst order is not always lateral, rain, then overtaking');
  assert.ok(centers.size>=40,'the passage has continuous seeded placement');
  assert.ok(angles.size>35,'entry angles differ visibly instead of only recolouring a vertical train');
  assert.equal(signatures.size,48);
});

test('explicit hull widths preserve the full safety contract and never shrink the ship to fit a dangerous lane', () => {
  for(const [width,height,shipWidth,shipSideClearance] of [[320,568,208,119],[390,844,270.4,154.7],[720,1280,108.16,61.88]]) {
    const result=run({width,height,shipWidth,shipSideClearance,seed:17});
    assert.equal(result.state.shipWidth,shipWidth);
    assert.equal(result.state.spawned,24);
    assert.ok(result.state.corridors.every(corridor=>corridor.width===shipWidth+40));
  }
});

test('zero delta freezes scheduling and positions, while oversized deltas cannot bypass an approach', () => {
  const state = createCometShower(), events = [];
  const before = cometShowerSnapshot(state);
  for (let frame = 0; frame < 100; frame++) advanceCometShower(state, 0, {x: 360, y: 900}, e => events.push(e));
  assert.deepEqual(cometShowerSnapshot(state), before);
  assert.deepEqual(events, []);
  advanceCometShower(state, 100, {x: 360, y: 900}, e => events.push(e));
  assert.equal(state.elapsed, .05);
  assert.deepEqual(events, []);
  const item = run().events.find(event => event.type === 'spawn').item;
  const saved = structuredClone(item);
  advanceShowerComet(item, 0);
  assert.deepEqual(item, saved);
});

test('resuming discards past bursts, guarantees seven seconds of grace and never replays IDs', () => {
  for (const elapsed of [1, 5, 6, 7, 12, 15, 18, 20, 23, 24, 26, 31]) {
    const result = run({elapsed});
    const spawns = result.events.filter(event => event.type === 'spawn');
    assert.ok(spawns.every(event => event.at >= elapsed + 7));
    assert.equal(new Set(result.events.map(event => event.id)).size, result.events.length);
    for (const event of spawns) {
      const warning = result.events.find(item => item.type === 'warning' && item.burst === event.burst);
      assert.ok(warning);
      assert.ok(event.at >= warning.at + 2);
    }
  }
  const first = run({elapsed: 12}), second = run({elapsed: 12});
  assert.deepEqual(first.events.map(event => event.id), second.events.map(event => event.id));
  assert.equal(run({elapsed: 31}).events.length, 0);
});

test('moving a comet once uses exact ballistic displacement and swept nucleus contact', () => {
  const item = {id: 'fixture', showerComet: true, showerVersion: COMET_SHOWER_VERSION,
    showerWidth: 720, showerHeight: 1280, x: 100, y: 100, vx: 950, vy: 0,
    ax: 20, ay: 30, life: 2, r: 15};
  assert.equal(advanceShowerComet(item, .05), true);
  assert.equal(item.previousX, 100);assert.equal(item.previousY, 100);
  assert.equal(item.x, 147.525);assert.equal(item.y, 100.0375);
  assert.equal(item.vx, 951);assert.equal(item.vy, 1.5);
  assert.equal(showerCometIntersectsCircle(item, {x: 123, y: 100, r: 1}), true);
  assert.equal(showerCometIntersectsCircle(item, {x: 123, y: 140, r: 1}), false);
  assert.equal(showerCometIntersectsCircle(item, {x: 123, y: 125, r: 12}), true);
});

test('both lateral edges, upper exit, lower exit and lifetime retire bodies without leaking active references', () => {
  const template = {showerComet: true, showerVersion: COMET_SHOWER_VERSION, showerWidth: 720,
    showerHeight: 1280, x: 360, y: 640, vx: 0, vy: 0, ax: 0, ay: 0, life: 2, r: 15};
  for (const patch of [{x: -127, vx: -800}, {x: 847, vx: 800},
    {y: -127, vy: -800}, {y: 1407, vy: 800}, {life: .001}]) {
    assert.equal(advanceShowerComet({...template, ...patch}, .02), false);
  }
  const state = createCometShower(), items = [];
  for (let frame = 0; frame < 7.1 / DT; frame++) advanceCometShower(state, DT, {x: 360, y: 900}, event => {
    if (event.type === 'spawn') items.push(event.item);
  });
  assert.equal(state.active.length, 1);
  assert.equal(releaseCometShowerItem(state, items[0]), true);
  assert.equal(releaseCometShowerItem(state, items[0]), false);
  assert.equal(state.active.length, 0);
});

test('slow or externally held comets retain their safe corridor and cannot be forgotten to evade the active cap', () => {
  const state = createCometShower(), items = [];
  for (let frame = 0; frame < 34 / DT; frame++) {
    advanceCometShower(state, DT, {x: 360, y: 900}, event => {
      if (event.type === 'spawn') items.push(event.item);
    });
    assert.ok(state.active.length <= COMET_SHOWER_RULES.maxActive);
    assert.ok(new Set(state.active.map(entry=>entry.item.showerBurst)).size<=1,
      'two different passage reservations never close each other during slow motion');
  }
  assert.equal(items.length, 7, 'only the first physical burst exists while its bodies are externally held');
  assert.equal(state.skipped, 17, 'later incompatible bursts are skipped rather than filling the safe lane');
  assert.equal(state.active.length, 7);
  for (const item of items) releaseCometShowerItem(state, item);
  assert.equal(state.active.length, 0);
});

test('Atlas approach can opt into the same isolated crossings without changing the other route IDs', () => {
  const vacuum = run(), atlas = run({stageId: '1.9'});
  assert.equal(atlas.state.spawned, vacuum.state.spawned);
  assert.ok(atlas.events.every(event => event.stageId === '1.9'));
  assert.ok(atlas.events.every(event => !vacuum.events.some(other => other.id === event.id)));
});
