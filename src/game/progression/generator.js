import {levelDefinition} from './sectors.js';
import {authoredLevel} from './level-designs.js';
import {PLAYER_GEOMETRY} from '../../core/player-model.js';

export const GENERATOR_VERSION = 'n7-waves-v2';
export const PLAYFIELD = Object.freeze({
 width: 720, shipHalfWidth: PLAYER_GEOMETRY.collisionHalfWidth,
 safetyMargin: 24, enemyRadius: 44, edgeMargin: 18
});
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
export function generateLevel(level,{waveCount=authoredLevel(level).waveCount,seed=levelDefinition(level).seed,version=GENERATOR_VERSION}={}){
 const definition=levelDefinition(level),design=authoredLevel(level);
 if(!Number.isInteger(waveCount)||waveCount<1||waveCount>100)throw new RangeError('waveCount must be 1..100');
 if(version!==GENERATOR_VERSION)throw new RangeError('Unsupported generator version');
 const random=createSeededRandom(seed),difficulty=difficultyForLevel(level);
 const center=PLAYFIELD.width/2+(Math.floor(random()*3)-1)*56;
 const halfWidth=PLAYFIELD.shipHalfWidth+PLAYFIELD.safetyMargin;
 const corridor=Object.freeze({center,left:center-halfWidth,right:center+halfWidth,width:halfWidth*2});
 const boundsFor=side=>Object.freeze(side<0
  ? {min:PLAYFIELD.edgeMargin+PLAYFIELD.enemyRadius,max:corridor.left-PLAYFIELD.enemyRadius}
  : {min:corridor.right+PLAYFIELD.enemyRadius,max:PLAYFIELD.width-PLAYFIELD.edgeMargin-PLAYFIELD.enemyRadius});
 const cadence=8.5;
 const waves=Array.from({length:waveCount},(_,i)=>{
  const rhythm=design.rhythm[i%design.rhythm.length];
  const recovery=(i+1)%design.recoveryEvery===0||rhythm==='recovery';
  const count=recovery?2:Math.min(14,Math.max(2,Math.round((2+i%3)*difficulty.density+random())));
  const at=2+i*cadence;
  const enemies=Array.from({length:count},(_,j)=>{
   const side=(i+j)%2===0?-1:1;
   const bounds=boundsFor(side);
   const preferred=rhythm==='zigzag'?'zigzag':rhythm==='crosscurrent'
    ? design.mechanics[(i+j)%design.mechanics.length]:'linear';
   const type=design.mechanics.includes(preferred)?preferred:'linear';
   const x=Number((bounds.min+random()*(bounds.max-bounds.min)).toFixed(4));
   return Object.freeze({id:`${level}:${i+1}:${j+1}`,type,side,bounds,x,
    lane:Math.max(0,Math.min(6,Math.floor(x/(PLAYFIELD.width/7)))),
    at:Number((at+j*.32).toFixed(4)),radius:PLAYFIELD.enemyRadius,
    speedMultiplier:Number((difficulty.enemySpeed*(.9+random()*.2)).toFixed(4)),
    projectileMultiplier:difficulty.projectileSpeed,
    phase:Number((random()*Math.PI*2).toFixed(4)),
    telegraphSeconds:.8,fireInterval:Number((2.8-(level-1)/99*.8).toFixed(4))});
  });
  return Object.freeze({index:i+1,at,rhythm,recovery,spawnInterval:difficulty.spawnInterval,enemies:Object.freeze(enemies)});
 });
 const duration=2+waveCount*cadence;
 const energyBudget=design.goal+Math.ceil(design.goal*.25);
 const pickups=Object.freeze(Array.from({length:energyBudget},(_,i)=>Object.freeze({
  id:`${level}:energy:${i+1}`,type:'energy',at:Number((2+i*(duration-6)/energyBudget).toFixed(4)),
  x:Number((center+(random()-.5)*120).toFixed(4)),phase:Number((random()*Math.PI*2).toFixed(4))
 })));
 return Object.freeze({...definition,seed,version,design,difficulty,geometry:PLAYFIELD,corridor,
  duration,energyBudget,pickups,waves:Object.freeze(waves),boss:definition.isBoss?bossForLevel(level):null});
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
