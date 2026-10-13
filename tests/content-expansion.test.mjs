import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_LEVELS,SECTOR_DEFINITIONS,levelDefinition,seedForLevel} from '../src/game/progression/sectors.js';
import {generateLevel,difficultyForLevel,bossForLevel} from '../src/game/progression/generator.js';
import {n7Dialogue} from '../src/game/narrative/n7-dialogues.js';
import {ANIMATION_MAP,VFX_PRESETS} from '../src/game/animation/animation-map.js';
test('100 levels and five nonoverlapping sectors',()=>{
 assert.equal(CAMPAIGN_LEVELS.length,100);assert.equal(SECTOR_DEFINITIONS.length,5);
 for(let n=1;n<=100;n++)assert.equal(levelDefinition(n).sectorId,Math.ceil(n/20));
 assert.equal(new Set(CAMPAIGN_LEVELS.map(x=>x.seed)).size,100);
});
test('deterministic waves for every level across independent calls',()=>{
 for(let n=1;n<=100;n++)assert.deepEqual(generateLevel(n),generateLevel(n));
 assert.notDeepEqual(generateLevel(36).waves,generateLevel(37).waves);
});
test('difficulty density and speed increase monotonically',()=>{
 let prev=difficultyForLevel(1);
 for(let n=2;n<=100;n++){const next=difficultyForLevel(n);
  assert.ok(next.density>=prev.density);assert.ok(next.enemySpeed>=prev.enemySpeed);
  assert.ok(next.projectileSpeed>=prev.projectileSpeed);assert.ok(next.spawnInterval<=prev.spawnInterval);prev=next;}
});
test('bosses at every tenth level with two distinct phases',()=>{
 assert.deepEqual(CAMPAIGN_LEVELS.filter(x=>x.isBoss).map(x=>x.level),[10,20,30,40,50,60,70,80,90,100]);
 for(let n=10;n<=100;n+=10){const boss=bossForLevel(n);assert.equal(boss.phases.length,2);assert.equal(boss.phases[1].invulnerable,true);assert.equal(generateLevel(n).boss.level,n);}
});
test('N-7 contextual triggers and animation metadata',()=>{
 assert.ok(n7Dialogue('sectorStart',{level:1}));assert.equal(n7Dialogue('sectorStart',{level:2}),null);
 assert.ok(n7Dialogue('bossWarning',{level:100}));assert.ok(n7Dialogue('criticalHull',{hull:10}));
 assert.ok(n7Dialogue('perfectStreak',{perfectStreak:true}));assert.equal(ANIMATION_MAP.enemies.spawn.frames.length,0);
 assert.ok(VFX_PRESETS.impact.count<=320);
});
test('invalid levels and wave counts rejected',()=>{
 assert.throws(()=>levelDefinition(0),RangeError);assert.throws(()=>seedForLevel(101),RangeError);
 assert.throws(()=>generateLevel(1,{waveCount:0}),RangeError);assert.throws(()=>bossForLevel(11),RangeError);
});
