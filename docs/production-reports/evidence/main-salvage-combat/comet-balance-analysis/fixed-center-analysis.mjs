import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root='/workspace/Ne-n-catcher';
const sourceFile='/tmp/neon-comet-balance-analysis/comet-shower-v1-source.mjs';
const collisionFile=path.join(root,'src/game/04-entities-collision-damage.js');
const runtimeFile=path.join(root,'src/game/01-runtime-assets.js');
const [modelSource,collisionSource,runtimeSource]=await Promise.all([readFile(sourceFile,'utf8'),readFile(collisionFile,'utf8'),readFile(runtimeFile,'utf8')]);
const model=await import(pathToFileURL(sourceFile).href);
const outlineSource=runtimeSource.match(/const SHIP_COLLISION_OUTLINE = \[[\s\S]*?\n  \];/)[0];
const geometry=vm.createContext({Math,clamp:(value,lo,hi)=>Math.max(lo,Math.min(hi,value))});
vm.runInContext(outlineSource,geometry);vm.runInContext(collisionSource,geometry);
const DT=1/120;
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
function scenario({width,height,seed,proposal=false}){
 const player={x:width/2,y:height*(1262/1558)};
 const shower=model.createCometShower({width,height,seed,stageId:'1.5'});
 const items=[],hits=[],births=[],corridorViolations=[],minimumDistances=[];
 for(let frame=0;frame<34/DT;frame++){
  model.advanceCometShower(shower,DT,player,event=>{
   if(event.type!=='spawn')return;
   const item=event.item;let changed=false;
   if(proposal&&event.burst>0&&Math.abs(item.vy)>Math.abs(item.vx)){
    const side=-event.corridor.side;
    const minimum=side<0?32:event.corridor.right+44;
    const maximum=side<0?event.corridor.left-44:width-32;
    if(minimum<=maximum){
      const oldQuarter=width*(side<0?.25:.75);
      const offset=item.x-oldQuarter;
      item.x=item.previousX=item.baseX=clamp(width*(side<0?.46:.54)+offset,minimum,maximum);
      changed=true;
    }
   }
   births.push({id:item.id,burst:event.burst,x:item.x,y:item.y,vx:item.vx,vy:item.vy,changed});
   items.push({item,corridor:event.corridor,hit:false,minDistance:Infinity});
  });
  for(let index=items.length-1;index>=0;index--){
   const record=items[index],item=record.item;
   const alive=model.advanceShowerComet(item,DT);
   const localX=item.x-player.x,localY=item.y-player.y;
   const contact=geometry.sweptCircleHitsShip(item.previousX-player.x,item.previousY-player.y,localX,localY,item.r*.94);
   record.minDistance=Math.min(record.minDistance,Math.hypot(localX,localY));
   const c=record.corridor,margin=item.r+12;
   if(item.y+margin>=c.top&&item.y-margin<=c.bottom&&item.x+margin>=c.left&&item.x-margin<=c.right){
    if(!corridorViolations.includes(item.id))corridorViolations.push(item.id);
   }
   if(contact&&!record.hit){
    record.hit=true;hits.push({id:item.id,burst:item.showerBurst,time:shower.elapsed,x:item.x,y:item.y,damage:item.damage});
    // Actual gameplay removes a colliding threat once, so its trail cannot
    // multiply damage. This analysis counts every scheduled collision even
    // after hypothetical hull death to expose the complete pressure pattern.
   }
   if(!alive||record.hit){minimumDistances.push({id:item.id,distance:record.minDistance});model.releaseCometShowerItem(shower,item);items.splice(index,1);}
  }
 }
 return {width,height,seed,player,proposal,spawned:shower.spawned,hits:hits.length,
   projectedHull:Math.max(0,100-hits.reduce((sum,item)=>sum+item.damage,0)),hitEvents:hits,
   corridorViolations,births,minimumNucleusDistance:Math.min(...minimumDistances.map(item=>item.distance))};
}
const profiles=[[250,300],[390,844],[540,960],[720,1558]];
const summaries=[],cases=[];
for(const proposal of [false,true])for(const [width,height]of profiles){
 const group=[];
 for(let seed=0;seed<100;seed++)group.push(scenario({width,height,seed,proposal}));
 cases.push(...group);
 summaries.push({proposal,width,height,cases:group.length,stationaryUnharmed:group.filter(c=>c.hits===0).length,
   stationaryDamaged:group.filter(c=>c.hits>0).length,stationaryDestroyed:group.filter(c=>c.projectedHull===0).length,
   minHits:Math.min(...group.map(c=>c.hits)),maxHits:Math.max(...group.map(c=>c.hits)),
   corridorViolationCases:group.filter(c=>c.corridorViolations.length).length});
}
const actualSeed=scenario({width:720,height:1558,seed:4055});
const actualSeedProposal=scenario({width:720,height:1558,seed:4055,proposal:true});
const hash=text=>createHash('sha256').update(text).digest('hex');
const report={createdAt:new Date().toISOString(),command:'node /tmp/neon-comet-balance-analysis/fixed-center-analysis.mjs',
 method:'Pure module simulation120Hz with actual sweptCircleHitsShip and unchanged SHIP_COLLISION_OUTLINE; stationary center at y=H*(1262/1558). No application edits or Chromium.',
 caveats:['Four logical viewport fixtures, not four physical devices. The250px arena does not fit the208px hull plus248px safe lane; its fallback high passes intentionally leave the lower field clear.',
 'The proposed .46/.54 lane positions exist only in emitted-item clones in this temporary simulation. All current source files remain unchanged.',
 'An untouched safe corridor is a geometric passage, not proof of human learnability or combined enemy/projectile balance. No player AI or incoming fire is simulated.',
 'The simulation records all scheduled hits beyond a hypothetical hull death; actual gameplay stops at death.'],
 sourceHashes:{cometShower:hash(modelSource),collision:hash(collisionSource),runtime:hash(runtimeSource)},
 summaries,actualSeed,actualSeedProposal,cases};
await writeFile('/tmp/neon-comet-balance-analysis/results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summaries,actualSeed:{hits:actualSeed.hits,hull:actualSeed.projectedHull,minDistance:actualSeed.minimumNucleusDistance},
 actualSeedProposal:{hits:actualSeedProposal.hits,hull:actualSeedProposal.projectedHull,corridorViolations:actualSeedProposal.corridorViolations,
 hitEvents:actualSeedProposal.hitEvents}},null,2));
