import test from 'node:test';
import assert from 'node:assert/strict';
import {runVoyage} from './sim/bot.mjs';

const FIELDS = ['voyage', 'seed', 'result', 'stageReached', 'seconds', 'hull', 'deaths', 'shots', 'hits',
  'idleSeconds', 'maxIdleGap', 'threatsAvg'];

test('the same seed gives the same run', async () => {
  const a = await runVoyage({voyage: 'S1-V2', seed: 7, maxSeconds: 30});
  const b = await runVoyage({voyage: 'S1-V2', seed: 7, maxSeconds: 30});
  assert.deepEqual(a, b);
});

test('the bot reaches stage 2 with invulnerability', async () => {
  const run = await runVoyage({voyage: 'S1-V2', seed: 1, maxSeconds: 70, invulnerable: true});
  assert.ok(run.stageReached >= 2, `stage ${run.stageReached}`);
  assert.ok(run.shots > 0, 'the bot fires');
});

test('the report has every field and idle time is measured', async () => {
  const run = await runVoyage({voyage: 'S1-V2', seed: 3, maxSeconds: 30});
  assert.deepEqual(Object.keys(run).sort(), [...FIELDS].sort());
  assert.ok(run.idleSeconds >= 0 && run.idleSeconds <= 30);
  assert.ok(run.maxIdleGap <= run.idleSeconds + 1e-9);
});
