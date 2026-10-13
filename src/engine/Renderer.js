/** Isolated HiDPI Canvas renderer; never mutates legacy campaign. */
export class Renderer {
 constructor(canvas,{logicalWidth=720,maxDpr=3,dprProvider=()=>globalThis.devicePixelRatio||1}={}){
  if(!canvas?.getContext)throw new TypeError('Canvas required');
  this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('2D context unavailable');
  this.logicalWidth=logicalWidth;this.maxDpr=maxDpr;this.dprProvider=dprProvider;
  this.width=logicalWidth;this.height=1280;this.dpr=1;this.scaleX=1;this.scaleY=1;this.shake=0;this.shakeTime=0;this.resize();
 }
 resize(){
  const r=this.canvas.getBoundingClientRect();
  if(!(r.width>0&&r.height>0))return false;
  this.width=this.logicalWidth;this.height=Math.round(this.width*r.height/r.width);
  const raw=Number(this.dprProvider());this.dpr=Math.min(this.maxDpr,Math.max(1,Number.isFinite(raw)?raw:1));
  const w=Math.round(this.width*this.dpr),h=Math.round(this.height*this.dpr);
  if(this.canvas.width!==w)this.canvas.width=w;
  if(this.canvas.height!==h)this.canvas.height=h;
  // Backing pixels are rounded; derive the exact transform from actual dimensions.
  this.scaleX=this.canvas.width/this.width;
  this.scaleY=this.canvas.height/this.height;
  return true;
 }
 point(x,y,{clampToCanvas=true}={}){
  const r=this.canvas.getBoundingClientRect();
  if(!(r.width>0&&r.height>0))return null;
  const px=(x-r.left)*this.width/r.width,py=(y-r.top)*this.height/r.height;
  if(!clampToCanvas&&(px<0||py<0||px>this.width||py>this.height))return null;
  return {x:clampToCanvas?Math.max(0,Math.min(this.width,px)):px,y:clampToCanvas?Math.max(0,Math.min(this.height,py)):py};
 }
 shakeScreen(intensity=6,duration=.2){this.shake=Math.max(this.shake,intensity);this.shakeTime=Math.max(this.shakeTime,duration);}
 update(dt){this.shakeTime=Math.max(0,this.shakeTime-Math.max(0,dt));if(!this.shakeTime)this.shake=0;}
 beginFrame(){const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(this.scaleX,0,0,this.scaleY,0,0);c.save();if(this.shakeTime)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);return c;}
 endFrame(){this.ctx.restore();}
}
