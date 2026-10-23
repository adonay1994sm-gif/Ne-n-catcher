// Native Chromium decode/playback of the actual AAC exports. No game hook or
// source patch. It certifies the files, not Safari, device speakers or aesthetics.
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=__dirname;
const report={kind:'audio-artifact-check',startedAt:new Date().toISOString(),
  limits:['Real Chromium AAC decoding/Web Audio graph; no physical audibility or human aesthetic review.',
    'Not in-game integration, Safari/iPhone, or complete combat/music balance.'],cases:[],errors:[]};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const html=`<!doctype html><html lang="es"><meta charset="utf-8"><title>NEON CRONIUM · revisión de música</title><body style="background:#080f20;color:#dceeff;font:18px system-ui;padding:32px"><h1>Capítulo 1 · música original</h1><p>Maestros de producción: revisión artística pendiente.</p><button id="play">Escuchar apertura y viaje</button><pre id="status">Pulsa para habilitar el audio.</pre><script>
window.check={};
document.getElementById('play').onclick=async()=>{
 try{
  const context=new AudioContext();window.check.context=context;await context.resume();
  const files=['chapter1_opening_score_v1','chapter1_voyage_score_v1'];
  const buffers=await Promise.all(files.map(async id=>context.decodeAudioData(await(await fetch('runtime/'+id+'.m4a')).arrayBuffer())));
  window.check.metadata=buffers.map((buffer,index)=>({id:files[index],duration:buffer.duration,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,length:buffer.length}));
  const gain=context.createGain();gain.gain.value=.15;const analyser=context.createAnalyser();analyser.fftSize=2048;
  gain.connect(analyser);analyser.connect(context.destination);
  window.check.sources=buffers.map(buffer=>{const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);return source;});
  window.check.sources[0].start();window.check.sources[1].loop=true;window.check.sources[1].loopStart=0;window.check.sources[1].loopEnd=48;
  window.check.analyser=analyser;window.check.loaded=true;
  document.getElementById('status').textContent='Apertura: 28 s · después, viaje: 48 s en bucle.';
  window.check.sources[0].onended=()=>window.check.sources[1].start();
 }catch(error){window.check.error=String(error);}
};</script></body></html>`;
async function main(){
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}
  const filename=path.basename(req.url||'');
  if(!['chapter1_opening_score_v1.m4a','chapter1_voyage_score_v1.m4a'].includes(filename)){res.writeHead(404);res.end();return;}
  try{res.writeHead(200,{'Content-Type':'audio/mp4'});res.end(await fs.readFile(path.join(root,'runtime',filename)));}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  report.chromiumVersion=browser.version();
  const page=await browser.newPage();page.on('pageerror',error=>report.errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.click('#play');
  await page.waitForFunction(()=>window.check.loaded||window.check.error,null,{timeout:20000});
  const metadata=await page.evaluate(()=>({metadata:window.check.metadata,error:window.check.error}));
  assert.equal(metadata.error,undefined);
  for(const [index,duration] of [28,48].entries()){
   assert.ok(Math.abs(metadata.metadata[index].duration-duration)<.03);
   assert.equal(metadata.metadata[index].channels,2);
   const bytes=await fs.readFile(path.join(root,'runtime',metadata.metadata[index].id+'.m4a'));
   report.cases.push({name:`decode ${metadata.metadata[index].id}`,status:'passed',
     ...metadata.metadata[index],bytes:bytes.length,sha256:hash(bytes)});
  }
  await page.waitForTimeout(600);
  const playing=await page.evaluate(()=>{
   const values=new Float32Array(2048);window.check.analyser.getFloatTimeDomainData(values);
   return{state:window.check.context.state,time:window.check.context.currentTime,
     peak:Math.max(...Array.from(values,Math.abs))};
  });
  assert.equal(playing.state,'running');assert.ok(playing.time>.1);assert.ok(playing.peak>1e-5);
  report.cases.push({name:'user gesture starts real decoded opening audio',status:'passed',...playing});
  await page.evaluate(()=>{window.check.sources[0].onended=null;window.check.sources[0].stop();window.check.sources[1].start();});
  await page.waitForTimeout(600);
  const looping=await page.evaluate(()=>{
   const values=new Float32Array(2048);window.check.analyser.getFloatTimeDomainData(values);
   return{loop:window.check.sources[1].loop,start:window.check.sources[1].loopStart,
    end:window.check.sources[1].loopEnd,peak:Math.max(...Array.from(values,Math.abs))};
  });
  assert.equal(looping.loop,true);assert.equal(looping.end,48);assert.ok(looping.peak>1e-5);
  report.cases.push({name:'real voyage graph supports authored 0–48s loop',status:'passed',...looping});
  assert.deepEqual(report.errors,[]);report.status='passed';report.exitCode=0;
 }catch(error){report.status='failed';report.exitCode=1;report.errors.push(error.stack||String(error));process.exitCode=1;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
  report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(root,'browser-audio-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
