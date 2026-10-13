/** Campaign content V1: isolated data, not imported by the ten-level legacy runtime. */
export const SECTOR_DEFINITIONS=Object.freeze([
 {id:1,name:'Suburbios Neón',theme:'aprendiz',start:1,end:20},
 {id:2,name:'Núcleo Urbano',theme:'redes-de-datos',start:21,end:40},
 {id:3,name:'Sector Industrial',theme:'procesadores',start:41,end:60},
 {id:4,name:'Matriz Cibernética',theme:'servidores-centrales',start:61,end:80},
 {id:5,name:'El Abismo',theme:'nucleo-ia',start:81,end:100}
].map(s=>Object.freeze(s)));
export const CAMPAIGN_LEVEL_COUNT=100;
export function sectorForLevel(level){
 if(!Number.isInteger(level)||level<1||level>CAMPAIGN_LEVEL_COUNT)throw new RangeError('Level must be 1..100');
 return SECTOR_DEFINITIONS[Math.floor((level-1)/20)];
}
export function levelDefinition(level){
 const sector=sectorForLevel(level);
 return Object.freeze({level,sectorId:sector.id,sectorName:sector.name,withinSector:level-sector.start+1,isBoss:level%10===0,seed:seedForLevel(level)});
}
export function seedForLevel(level){
 const sector=sectorForLevel(level);
 let n=(Math.imul(level,0x9e3779b1)^Math.imul(sector.id,0x85ebca6b)^0x4e374341)>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d)>>>0;
 n=Math.imul(n^(n>>>15),0x846ca68b)>>>0;
 return (n^(n>>>16))>>>0;
}
export const CAMPAIGN_LEVELS=Object.freeze(Array.from({length:CAMPAIGN_LEVEL_COUNT},(_,i)=>levelDefinition(i+1)));
