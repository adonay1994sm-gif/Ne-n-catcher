const fs = require('fs');
let source = fs.readFileSync('/workspace/Ne-n-catcher/tests/unified-flight-legacy.test.mjs', 'utf8');
source = source.slice(0, source.indexOf("test('three classic charges"));
source = source.replace("import {JSDOM} from 'jsdom';", "import {JSDOM} from '/workspace/Ne-n-catcher/node_modules/jsdom/lib/api.js';");
source = source.replace("const repository = new URL('..', import.meta.url);", "const repository = new URL('file:///workspace/Ne-n-catcher/');");
source = source.replace("destructionAsset = 'loaded', rects = {}, unlocked = 2, savedVoyage} = {})", "destructionAsset = 'loaded', rects = {}, unlocked = 2, savedVoyage, randomSeed = 0} = {})");
source = source.replace("const {window} = dom; t.after(() => window.close());", `const {window} = dom; t.after(() => window.close());
  let randomState=randomSeed>>>0; window.Math.random=()=>{randomState=(randomState+0x6d2b79f5)|0;let v=Math.imul(randomState^(randomState>>>15),1|randomState);v^=v+Math.imul(v^(v>>>7),61|v);return ((v^(v>>>14))>>>0)/4294967296;};`);
source = source.replace("const flightEventsForTest=[];", `const flightEventsForTest=[];
    const patrolSpawnsForTest=[];
    const originalPatrolForTest=spawnClassicFlightPatrol;
    spawnClassicFlightPatrol=function(...args){const item=originalPatrolForTest(...args);patrolSpawnsForTest.push({requested:args[0],elapsed,role:item?.classicScout?.role,id:item?.id,frame:item?.classicScout?.animator.getFrame()});return item;};`);
source = source.replace("snapshot:()=>({state,elapsed", "snapshot:()=>({patrolSpawns:patrolSpawnsForTest,state,elapsed");
source += `
const results=[];
for(let seed=0;seed<120;seed++){
 const cleanup=[];const h=harness({after(fn){cleanup.push(fn);}},{unlocked:2,randomSeed:seed});h.api.startLevel(1);
 const seen=[];let prior='';
 for(let n=0;n<Math.ceil(17/.034);n++){h.api.update(.034);const q=h.snapshot();const ids=q.targets.filter(i=>i.role).map(i=>i.id);if(ids.join(',')!==prior){seen.push({elapsed:q.elapsed,state:q.state,hull:q.hull,ids,roles:q.targets.filter(i=>i.role).map(i=>i.role)});prior=ids.join(',');}}
 const q=h.snapshot();const passed=q.targets.some(i=>i.role==='interceptor');
 const result={seed,passed,state:q.state,hull:q.hull,elapsed:q.elapsed,patrolSpawns:q.patrolSpawns,seen,targets:q.targets};results.push(result);
 for(const fn of cleanup)fn();
 if(!passed){console.log(JSON.stringify(result));break;}
}
await (await import('node:fs/promises')).writeFile('/tmp/neon-patrol-ci-investigation-20261018/seed-diagnosis.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({runs:results.length,failed:results.filter(r=>!r.passed).map(r=>r.seed)}));
`;
fs.writeFileSync('/tmp/neon-patrol-ci-investigation-20261018/diagnose.mjs',source);
