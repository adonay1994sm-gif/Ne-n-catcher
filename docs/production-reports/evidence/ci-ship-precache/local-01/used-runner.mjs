import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root='/workspace/Ne-n-catcher';
const out=resolve(root,'docs/production-reports/evidence/ci-ship-precache/local-01');
mkdirSync(out,{recursive:true});
const git=(...args)=>spawnSync('git',args,{cwd:root,encoding:'utf8'}).stdout.trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={startedAt:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),workingTree:git('status','--short'),trackedDiffSha256:sha(git('diff','HEAD')),node:process.version,results:[]};
const commands=[
 ['build-preview','npm',['run','build:preview']],
 ['engine','npm',['run','test:engine']],
 ['architecture','npm',['run','test:architecture']],
 ['content','npm',['run','test:content']],
 ['static','npm',['run','test:static']],
 ['regression','npm',['test']],
 ['web','node',['tests/run-v7-web-tests.mjs']],
 ['preview','npm',['run','test:preview']],
 ['inventory','node',['scripts/audit-asset-inventory.mjs']],
 ['visual-artpass','node',['--test','tests/visual-artpass.test.mjs']],
 ['audio-lifecycle','node',['--test','tests/audio-lifecycle.test.mjs']]
];
function save(){writeFileSync(resolve(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
for(const[name,command,args]of commands){
 const start=Date.now(); const run=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:300000,maxBuffer:20*1024*1024});
 const log=name+'.txt';writeFileSync(resolve(out,log),(run.stdout||'')+(run.stderr||''));
 report.results.push({command:[command,...args].join(' '),name,exitCode:run.status,signal:run.signal,error:run.error?.message||null,durationMs:Date.now()-start,log});
 save();console.log(name+': exit='+run.status);
 if(name==='build-preview'&&run.status!==0)break;
}
report.finishedAt=new Date().toISOString();report.sourceUnchanged=git('rev-parse','HEAD')===report.head&&sha(git('diff','HEAD'))===report.trackedDiffSha256;
report.buildInfo=JSON.parse(readFileSync(resolve(root,'preview-dist/build-info.json'),'utf8'));
report.bundleHashes=Object.fromEntries(['game.js','core-runtime.js','content-runtime.js'].map(name=>[name,['.','www','ios/App/App/public'].map(dir=>({directory:dir,sha256:sha(readFileSync(resolve(root,dir,name)))}))]));
report.ok=report.results.length===commands.length&&report.results.every(r=>r.exitCode===0)&&report.sourceUnchanged;
save();console.log(JSON.stringify({ok:report.ok,head:report.head,phases:report.results.length,sourceUnchanged:report.sourceUnchanged}));process.exitCode=report.ok?0:1;
