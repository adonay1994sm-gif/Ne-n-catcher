import {seededRandom} from '../render/neon-render-engine.mjs';
export function createWaveGenerator({seed=1,sector=1,width=720}={}){
  const random=seededRandom(seed);
  const difficulty=Math.max(1,Math.floor(sector));
  let wave=0;
  return {next(){
    wave++;
    const count=Math.min(12,2+Math.floor(difficulty/2)+Math.floor(wave/3));
    const corridor=Math.max(170,300-difficulty*3);
    const safeX=120+random()*(width-240);
    const objects=Array.from({length:count},(_,i)=>{
      const x=40+random()*(width-80);
      const safe=Math.abs(x-safeX)<corridor/2;
      return {type:safe?'energy':random()<.65?'meteor':'debris',x,y:-90-i*115,speed:140+difficulty*12+wave*4};
    });
    // Guarantee one collectible and an unobstructed entry lane in each wave.
    objects[0]={type:'energy',x:safeX,y:-90,speed:150+difficulty*8};
    for(const object of objects)if(object.type!=='energy'&&Math.abs(object.x-safeX)<corridor/2)object.x=object.x<safeX?Math.max(24,safeX-corridor/2-24):Math.min(width-24,safeX+corridor/2+24);
    return {wave,sector:difficulty,safeX,corridor,objects};
  }};
}
