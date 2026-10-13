import {ParticleSystem} from './ParticleSystem.js';
import {Renderer} from './Renderer.js';
/** Sole requestAnimationFrame owner for the opt-in engine preview. */
export class EngineCore {
  constructor({canvas,update=()=>{},drawScene=()=>{},particles=new ParticleSystem(),renderer=null,requestFrame=cb=>requestAnimationFrame(cb),cancelFrame=id=>cancelAnimationFrame(id),maxDelta=.05}={}){
    this.renderer=renderer||new Renderer(canvas);this.particles=particles;this.updateGame=update;this.drawScene=drawScene;
    this.requestFrame=requestFrame;this.cancelFrame=cancelFrame;this.maxDelta=maxDelta;
    this.running=false;this.last=null;this.frameId=null;this.frame=this.frame.bind(this);
  }
  frame(now){
    if(!this.running)return;
    const dt=this.last===null?0:Math.min(this.maxDelta,Math.max(0,(now-this.last)/1000));this.last=now;
    this.renderer.update(dt);
    this.updateGame(dt,this);
    this.particles.update(dt);
    const ctx=this.renderer.beginFrame();
    try{this.drawScene(ctx,this.renderer,this);this.particles.draw(ctx);}
    finally{this.renderer.endFrame();}
    if(this.running)this.frameId=this.requestFrame(this.frame);
  }
  start(){if(this.running)return;this.running=true;this.last=null;this.frameId=this.requestFrame(this.frame);}
  stop(){this.running=false;if(this.frameId!==null)this.cancelFrame(this.frameId);this.frameId=null;this.last=null;}
}
