/** Fixed-capacity particle pool; no per-frame particle object allocations. */
export class ParticleSystem {
 constructor({capacity=320}={}){if(!Number.isInteger(capacity)||capacity<1)throw new RangeError('Invalid capacity');this.capacity=capacity;this.pool=Array.from({length:capacity},()=>({active:false,x:0,y:0,vx:0,vy:0,life:0,maxLife:1,size:2,color:'#5cf5ff'}));this.cursor=0;this.activeCount=0;}
 emit({x=0,y=0,vx=0,vy=0,life=.4,size=3,color='#5cf5ff'}={}){
  if(![x,y,vx,vy,life,size].every(Number.isFinite)||life<=0||size<=0)return false;
  for(let i=0;i<this.capacity;i++){const n=(this.cursor+i)%this.capacity,p=this.pool[n];if(p.active)continue;
   p.active=true;p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=life;p.maxLife=life;p.size=size;p.color=color;this.cursor=(n+1)%this.capacity;this.activeCount++;return true;}
  return false;
 }
 burst(x,y,{count=12,speed=160,life=.35,color='#5cf5ff'}={}){for(let i=0;i<count;i++){const a=i*2*Math.PI/count;this.emit({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life,color});}}
 update(dt){const step=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));for(const p of this.pool){if(!p.active)continue;p.x+=p.vx*step;p.y+=p.vy*step;p.life-=step;if(p.life<=0){p.active=false;this.activeCount--;}}}
 draw(ctx){ctx.save();for(const p of this.pool){if(!p.active)continue;ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.restore();}
 clear(){for(const p of this.pool)p.active=false;this.activeCount=0;this.cursor=0;}
}
