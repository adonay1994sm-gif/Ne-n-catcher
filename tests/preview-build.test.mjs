import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root,'preview-dist');

test('launcher presents both modes and paths resolve within the preview package',async()=>{
  const html=await readFile(join(dist,'index.html'),'utf8');
  assert.match(html,/href="juego\/index\.html\?campaign=n7"/);
  assert.match(html,/href="juego\/index\.html"/);
  assert.match(html,/juego\/assets\/ship_frame_01\.webp/);
  assert.match(html,/neon-n7-unlocked-v1/);
  for (const name of ['index.html','game.js','core-runtime.js','content-runtime.js','sw.js','assets/ship_frame_01.webp']) {
    assert.ok((await stat(join(dist,'juego',name))).size>0,name);
  }
  assert.ok((await stat(join(dist,'_headers'))).size>0);
});

test('preview game artifacts match the ordinary web build byte for byte',async()=>{
  for(const file of ['index.html','game.js','content-runtime.js','core-runtime.js','sw.js','assets/ship_frame_01.webp']) {
    const a=await readFile(join(root,'www',file));
    const b=await readFile(join(dist,'juego',file));
    assert.deepEqual(a,b,file);
  }
});

test('preview build never changes the default web root entry',async()=>{
  const html=await readFile(join(root,'www','index.html'),'utf8');
  assert.doesNotMatch(html,/<title>NEON CATCHER — Edición de prueba<\/title>/);
  assert.match(html,/id="canvas"/);
});

test('Netlify preview requires explicit opt in',()=>{
  const script=join(root,'scripts','netlify-preview-gate.mjs');
  const run=(mode,value)=>spawnSync(process.execPath,[script,mode],{
    encoding:'utf8',env:{...process.env,NEON_PREVIEW_DEPLOY:value}
  });
  assert.equal(run('--ignore','').status,0,'ordinary development branch deploy must be skipped');
  assert.equal(run('--require-enabled','').status,1,'ordinary development branch deploy must fail closed');
  assert.equal(run('--ignore','1').status,1,'an opted-in branch deploy must run');
  assert.equal(run('--require-enabled','1').status,0,'explicit opted-in branch deploy may build');
});
