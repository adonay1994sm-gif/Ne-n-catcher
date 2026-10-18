import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import metadata from '../art-source/vfx/gaia-pulse-v3/gaia-pulse-atlas-v3.json' with {type:'json'};

test('Gaia pulse production contains sixteen distinct transparent poses and a recoverable master',()=>{
 const runtime=readFileSync(new URL('../assets/gaia_pulse_atlas_v3.webp',import.meta.url));
 assert.equal(createHash('sha256').update(runtime).digest('hex'),metadata.runtimeSha256);
 assert.equal(runtime.length,metadata.runtimeBytes);assert.equal(new Set(metadata.frames.map(f=>f.rgbaSha256)).size,16);
 assert.equal(metadata.transparent,true);
 for(const f of metadata.frames){assert.equal(f.maximumSixteenPixelGutterAlpha,0);assert.ok(f.alphaBounds.minX>=16&&f.alphaBounds.minY>=16);}
 assert.ok(readFileSync(new URL('../art-source/vfx/gaia-pulse-v3/gaia-pulse-production-master.png',import.meta.url)).length>100000);
});
test('actual gameplay renderer chooses Gaia artwork for every weapon and contact impact, with historical fallback retained',()=>{
 const source=readFileSync(new URL('../src/game/07-player-item-rendering.js',import.meta.url),'utf8');
 const draws=[],gaia={name:'gaia',naturalWidth:1024},historical={name:'historical',naturalWidth:1024};
 const sandbox=vm.createContext({SPRITES:{gaiaPulse:gaia,arcadePulse:historical},spriteReady:x=>Boolean(x?.naturalWidth),ctx:{save(){},restore(){},globalAlpha:1,drawImage(...args){draws.push(args);}}});
 vm.runInContext(source.slice(source.indexOf('  function drawArcadePulse('),source.indexOf('  function drawClassicProjectiles(')),sandbox);
 for(const [kind,row] of [['pulse',0],['twin',1],['lance',2],['impact',3]]){
  sandbox.drawArcadePulse(kind,.1,72);assert.equal(draws.at(-1)[0].name,'gaia');assert.equal(draws.at(-1)[2],row*256);
 }
 gaia.naturalWidth=0;sandbox.drawArcadePulse('pulse',0,72);assert.equal(draws.at(-1)[0].name,'historical');
});
