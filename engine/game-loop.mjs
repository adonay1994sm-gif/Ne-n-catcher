export function createGameLoop({update,render,requestFrame=callback=>requestAnimationFrame(callback),cancelFrame=id=>cancelAnimationFrame(id),step=1/60,maxSteps=5}){
  let active=false,last=null,accumulator=0,id=null;
  function frame(now){
    if(!active)return;
    if(last===null)last=now;
    const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=now;accumulator+=elapsed;
    let steps=0;
    while(accumulator>=step&&steps<maxSteps){update(step);accumulator-=step;steps++;}
    if(steps===maxSteps&&accumulator>=step)accumulator=0;
    render(Math.min(1,accumulator/step),now);
    id=requestFrame(frame);
  }
  return {start(){if(active)return;active=true;last=null;accumulator=0;id=requestFrame(frame);},stop(){active=false;if(id!==null)cancelFrame(id);id=null;last=null;accumulator=0;},get running(){return active;}};
}
