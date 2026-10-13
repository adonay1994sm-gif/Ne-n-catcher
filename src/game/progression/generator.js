import {levelDefinition} from './sectors.js';
/** Pure seeded encounter blueprint; no Date, Math.random, browser globals or side effects. */
export function createSeededRandom(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Expected uint32 seed');
 let state=seed>>>0;
 return ()=>{state=(state+0x6d2b79f5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function difficultyForLevel(level){
 levelDefinition(level);
 const t=(level-1)/99;
 return Object.freeze({
  density:Number((1+2.4*t).toFixed(4)),
  spawnInterval:Number((2.8-1.65*t).toFixed(4)),
  enemySpeed:Number((1+1.75*t).toFixed(4)),
  projectileSpeed:Number((1+1.35*t).toFixed(4))
 });
}
const ENEMIES=Object.freeze(['linear','zigzag','chaser','shooter']);
export function generateLevel(level,{waveCount=8}={}){
 const definition=levelDefinition(level);
 if(!Number.isInteger(waveCount)||waveCount<1||waveCount>100)throw new RangeError('waveCount must be 1..100');
 const random=createSeededRandom(definition.seed),difficulty=difficultyForLevel(level);
 const available=Math.min(ENEMIES.length,1+Math.floor((level-1)/25));
 const waves=Array.from({length:waveCount},(_,i)=>{
  const count=Math.min(18,Math.max(1,Math.round((2+i%3)*difficulty.density+random()*2)));
  const enemies=Array.from({length:count},()=>Object.freeze({
   type:ENEMIES[Math.floor(random()*available)],
   lane:Math.floor(random()*7),
   speedMultiplier:Number((difficulty.enemySpeed*(0.9+random()*0.2)).toFixed(4)),
   projectileMultiplier:difficulty.projectileSpeed
  }));
  return Object.freeze({index:i+1,spawnInterval:difficulty.spawnInterval,enemies:Object.freeze(enemies)});
 });
 return Object.freeze({...definition,difficulty,waves:Object.freeze(waves),boss:definition.isBoss?bossForLevel(level):null});
}
export function bossForLevel(level){
 if(!Number.isInteger(level)||level<10||level>100||level%10!==0)throw new RangeError('Boss level must be a multiple of ten');
 const names=['Centinela Prisma','Guardián del Umbral','Firewall Viviente','Arquitecto de Datos','Forjador de Silicio','Titán de Procesos','Supervisor de Nodos','Matriz Centinela','Eco del Abismo','N-7: Núcleo Corrupto'];
 return Object.freeze({id:'boss-'+level,name:names[level/10-1],level,
  phases:Object.freeze([
   Object.freeze({id:1,pattern:'spread-shot',invulnerable:false,healthThreshold:1}),
   Object.freeze({id:2,pattern:'particle-barrier',invulnerable:true,invulnerabilitySeconds:2,healthThreshold:0.5})
  ])});
}
