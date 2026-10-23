#!/usr/bin/env node
// Juega N partidas de un viaje con el bot (tests/sim/bot.mjs) y resume
// dificultad y acción. Uso:
//   node scripts/sim-voyage.mjs --voyage S1-V1 --runs 20 --seed 1 [--max 900]
// Requiere `npm run build` antes (usa el game.js construido).
import {runVoyage} from '../tests/sim/bot.mjs';

const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean)
  .map(part => part.trim().split(/\s+/)).map(([key, value]) => [key, value]));
const voyage = args.voyage || 'S1-V1', runs = Number(args.runs || 20), seed = Number(args.seed || 1), max = Number(args.max || 900);
const results = [];
for (let i = 0; i < runs; i++) results.push(await runVoyage({voyage, seed: seed + i, maxSeconds: max}));
const mean = key => Math.round(results.reduce((sum, run) => sum + run[key], 0) / runs * 100) / 100;
console.log(JSON.stringify({voyage, runs, seed, maxSeconds: max,
  completionRate: Math.round(results.filter(run => run.result === 'complete').length / runs * 100) / 100,
  avgStageReached: mean('stageReached'), avgDeaths: mean('deaths'), avgMaxIdleGap: mean('maxIdleGap'),
  avgIdleSeconds: mean('idleSeconds'), avgThreats: mean('threatsAvg'), results}, null, 2));
