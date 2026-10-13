import {createGameLoop} from './game-loop.mjs';
import {createViewport} from './canvas-viewport.mjs';
import {EntityWorld} from './entities.mjs';
import {createWaveGenerator} from './procedural-waves.mjs';
import {NeonAudio} from './audio.mjs';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const viewport=createViewport(canvas),world=new EntityWorld(),audio=new NeonAudio();
const params=new URLSearchParams(location.search);
const sector=Math.max(1,Math.min(100,Number(params.get('sector'))||1));
const waves=createWaveGenerator({seed:12345,sector});
const player=world.add('ship',{x:360,y:1050,r:23});
let score=0,hull=100,elapsed=0,spawn=0,shots=0;
const stats=document.querySelector('#stats');
function resize(){if(viewport.resize()){player.x=Math.min(viewport.width-30,player.x);player.y=viewport.height-145;}}
resize();addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);
function nextWave(){const wave=waves.next();for(const item of wave.objects)world.add(item.type,{x:item.x,y:item.y,vx:0,vy:item.speed,r:item.type==='energy'?13:25});}
function fire(){audio.effect('shot');world.add('shot',{x:player.x,y:player.y-40,vx:0,vy:-650,r:5});shots++;}
function move(e){const p=viewport.point(e.clientX,e.clientY);player.x=Math.max(30,Math.min(viewport.width-30,p.x));}
canvas.addEventListener('pointerdown',e=>{audio.startAmbient();move(e);});canvas.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')move(e);});
document.querySelector('#fire').addEventListener('click',()=>{audio.startAmbient();fire();});
document.querySelector('#start').addEventListener('click',()=>{audio.startAmbient();document.querySelector('#start').hidden=true;});
function update(dt){
 elapsed+=dt;spawn-=dt;if(spawn<=0){nextWave();spawn=Math.max(1.5,4-sector*.025);}
 world.update(dt);
 const entities=[...world.entities.values()];
 for(const a of entities){
   if(a.type==='ship')continue;
   if(a.y>viewport.height+50||a.y< -2500){world.remove(a.id);continue;}
   if(a.type==='shot'){for(const b of entities){if(b.type==='meteor'||b.type==='debris'){if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r){world.remove(a.id);world.remove(b.id);score+=5;audio.effect('hit');break;}}}continue;}
   if(Math.hypot(a.x-player.x,a.y-player.y)<a.r+player.r){world.remove(a.id);if(a.type==='energy'){score+=10;audio.effect('collect');}else{hull=Math.max(0,hull-10);audio.effect('hit');}}
 }
 stats.textContent='SECTOR '+sector+' · NÚCLEOS '+score+' · CASCO '+hull+'% · DISPAROS '+shots;
}
function draw(){
 const w=viewport.width,h=viewport.height;ctx.fillStyle='#030918';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(76,210,255,.12)';for(let i=0;i<13;i++){const x=i*w/12;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(const a of world.entities.values()){
 ctx.save();ctx.translate(a.x,a.y);ctx.shadowBlur=17;
 if(a.type==='ship'){ctx.fillStyle='#5cf5ff';ctx.shadowColor='#5cf5ff';ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(28,25);ctx.lineTo(0,12);ctx.lineTo(-28,25);ctx.closePath();ctx.fill();}
 else{ctx.fillStyle=a.type==='energy'?'#5cffbb':a.type==='shot'?'#fff':'#ff6b88';ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(0,0,a.r,0,Math.PI*2);ctx.fill();}
 ctx.restore();
 }
 if(hull===0){ctx.fillStyle='#fff';ctx.font='32px sans-serif';ctx.textAlign='center';ctx.fillText('CASCO AGOTADO',w/2,h/2);}
}
createGameLoop({update,render:draw}).start();
