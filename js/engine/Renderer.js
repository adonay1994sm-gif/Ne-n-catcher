/** HiDPI renderer with logical canvas coordinates and bounded camera shake. */
export class Renderer {
  constructor(canvas,{logicalWidth=720,maxDpr=2}={}){
    if(!canvas?.getContext)throw new TypeError('Canvas required');
    this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas 2D unavailable');
    this.logicalWidth=logicalWidth;this.maxDpr=maxDpr;this.width=logicalWidth;this.height=1280;this.dpr=1;
    this.shake=0;this.shakeTime=0;this.elapsed=0;this.resize();
  }
  resize(){
    const r=this.canvas.getBoundingClientRect();if(!(r.width>0&&r.height>0))return false;
    this.width=this.logicalWidth;this.height=Math.round(this.width*r.height/r.width);
    this.dpr=Math.min(this.maxDpr,Math.max(1,globalThis.devicePixelRatio||1));
    const w=Math.round(this.width*this.dpr),h=Math.round(this.height*this.dpr);
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    return true;
  }
  point(clientX,clientY){const r=this.canvas.getBoundingClientRect();return {x:(clientX-r.left)*this.width/r.width,y:(clientY-r.top)*this.height/r.height};}
  shakeScreen(intensity=6,duration=.2){this.shake=Math.max(this.shake,intensity);this.shakeTime=Math.max(this.shakeTime,duration);}
  update(dt){this.elapsed+=dt;this.shakeTime=Math.max(0,this.shakeTime-dt);if(!this.shakeTime)this.shake=0;}
  beginFrame(){
    const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.save();
    if(this.shakeTime>0){c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);}
    return c;
  }
  endFrame(){this.ctx.restore();}
}
