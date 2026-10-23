/** Bounded, allocation-free particle slots after construction. */
export class ParticleSystem {
  constructor({capacity=320}={}) {
    this.capacity=Math.max(1,Math.floor(capacity));
    this.pool=Array.from({length:this.capacity},()=>({active:false,x:0,y:0,vx:0,vy:0,life:0,maxLife:1,size:2,color:'#5cf5ff'}));
    this.cursor=0;this.activeCount=0;
  }
  emit({x=0,y=0,vx=0,vy=0,life=.4,size=3,color='#5cf5ff'}={}){
    if(![x,y,vx,vy,life,size].every(Number.isFinite)||life<=0||size<=0)return false;
    let slot=null;
    for(let i=0;i<this.capacity;i++){const index=(this.cursor+i)%this.capacity;if(!this.pool[index].active){slot=this.pool[index];this.cursor=(index+1)%this.capacity;break;}}
    if(!slot)return false;
    Object.assign(slot,{active:true,x,y,vx,vy,life,maxLife:life,size,color});this.activeCount++;return true;
  }
  burst(x,y,{count=12,speed=160,color='#5cf5ff',life=.35}={}){
    for(let i=0;i<count;i++){const angle=i*Math.PI*2/count;this.emit({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,size:2+((i%3)*.7),color});}
  }
  update(dt){
    const step=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
    for(const p of this.pool){if(!p.active)continue;p.x+=p.vx*step;p.y+=p.vy*step;p.life-=step;if(p.life<=0){p.active=false;this.activeCount--;}}
  }
  draw(ctx){
    ctx.save();
    for(const p of this.pool){if(!p.active)continue;ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}
    ctx.restore();
  }
  clear(){for(const p of this.pool)p.active=false;this.activeCount=0;this.cursor=0;}
}
