import {Renderer} from './Renderer.js';
import {ParticleSystem} from './ParticleSystem.js';
/** Isolated engine preview; stale RAF callbacks cannot resurrect a stopped generation. */
export class EngineCore {
 constructor({canvas,renderer=null,particles=new ParticleSystem(),update=()=>{},drawScene=()=>{},requestFrame=cb=>requestAnimationFrame(cb),cancelFrame=id=>cancelAnimationFrame(id),maxDelta=.05,onError=null}={}){
  this.renderer=renderer||new Renderer(canvas);this.particles=particles;this.updateGame=update;this.drawScene=drawScene;
  this.requestFrame=requestFrame;this.cancelFrame=cancelFrame;this.maxDelta=maxDelta;
  this.onError=onError;this.running=false;this.paused=false;this.frameId=null;this.last=null;this.generation=0;
 }
 schedule(token){if(!this.running||this.paused||token!==this.generation)return;this.frameId=this.requestFrame(now=>{try{this.frame(now,token);}catch(error){this.stop();if(typeof this.onError==='function'){try{this.onError(error);}catch(recoveryError){console.error('Engine V1 recovery callback failed:',recoveryError);}return;}throw error;}});}
 frame(now,token){if(token!==this.generation||!this.running||this.paused)return;this.frameId=null;
  const dt=this.last===null?0:Math.min(this.maxDelta,Math.max(0,(now-this.last)/1000));this.last=now;
  try{this.renderer.update(dt);this.updateGame(dt,this);if(token!==this.generation||!this.running||this.paused)return;
   this.particles.update(dt);const ctx=this.renderer.beginFrame();try{this.drawScene(ctx,this.renderer,this);this.particles.draw(ctx);}finally{this.renderer.endFrame();}
  }catch(error){this.stop();throw error;}
  this.schedule(token);
 }
 start(){if(this.running)return false;this.running=true;this.paused=false;this.last=null;const token=++this.generation;try{this.schedule(token);}catch(error){this.stop();throw error;}return true;}
 bindVisibility(doc=globalThis.document){
  if(!doc?.addEventListener||!doc?.removeEventListener)throw new TypeError('Document visibility API required');
  this.unbindVisibility?.();
  let pausedByVisibility=false;
  const change=()=>{
   if(doc.hidden){if(this.running&&!this.paused){pausedByVisibility=this.pause();}}
   else if(pausedByVisibility){pausedByVisibility=false;this.resume();}
  };
  doc.addEventListener('visibilitychange',change);
  this.unbindVisibility=()=>{doc.removeEventListener('visibilitychange',change);pausedByVisibility=false;this.unbindVisibility=null;};
  change();
  return this.unbindVisibility;
 }
 pause(){if(!this.running||this.paused)return false;this.paused=true;this.generation++;if(this.frameId!==null)this.cancelFrame(this.frameId);this.frameId=null;this.last=null;return true;}
 resume(){if(!this.running||!this.paused)return false;this.paused=false;this.last=null;const token=++this.generation;try{this.schedule(token);}catch(error){this.stop();throw error;}return true;}
 stop(){const wasActive=this.running;this.running=false;this.paused=false;this.generation++;if(this.frameId!==null)this.cancelFrame(this.frameId);this.frameId=null;this.last=null;return wasActive;}
}
