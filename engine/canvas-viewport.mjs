export function createViewport(canvas,{logicalWidth=720,maxDpr=2}={}){
  if(!canvas?.getBoundingClientRect)throw new TypeError('Canvas required');
  let width=logicalWidth,height=1280,rect=null;
  function resize(){
    rect=canvas.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return false;
    width=logicalWidth;height=Math.round(logicalWidth*rect.height/rect.width);
    // Coordinates remain in logical units, regardless of backing-store resolution.
    const dpr=Math.min(maxDpr,Math.max(1,globalThis.devicePixelRatio||1));
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
    return true;
  }
  function point(clientX,clientY){
    const r=canvas.getBoundingClientRect();
    return {x:(clientX-r.left)*width/r.width,y:(clientY-r.top)*height/r.height};
  }
  return {resize,point,get width(){return width;},get height(){return height;}};
}
