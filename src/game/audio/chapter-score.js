/** Rendered, originally composed music. The existing frame owns policy; the
 * browser media decoder owns playback. No timers, RAF or AudioContext here. */
export function createChapterScore({context,output,createAudio=()=>new Audio()}={}) {
  if(!context?.createMediaElementSource||!output)return null;
  const audio=createAudio();audio.preload="auto";
  const source=context.createMediaElementSource(audio);source.connect(output);
  let selected=null,enabled=true,paused=true,failed=false,pending=false,disposed=false,generation=0;
  function stop(){generation++;pending=false;audio.pause();}
  function play(){
    if(disposed||failed||paused||!enabled||pending||!audio.paused)return;
    pending=true;const attempt=++generation;
    try {Promise.resolve(audio.play()).catch(error=>{
      if(attempt===generation&&!paused&&enabled&&!disposed&&error?.name!=="AbortError")failed=true;
    }).finally(()=>{if(attempt===generation)pending=false;});}
    catch {pending=false;failed=true;}
  }
  return Object.freeze({
    update({active,elapsed=0,paused:nextPaused=false,enabled:nextEnabled=true}={}) {
      if(disposed)return false;
      enabled=nextEnabled;paused=nextPaused||!active;
      if(!active||!enabled||paused){stop();return active&&!failed;}
      const next=elapsed<28?"opening":"voyage";
      if(next!==selected){
        stop();selected=next;failed=false;
        audio.src=`assets/chapter1_${next==="opening"?"opening":"voyage"}_score_v1.m4a`;
        audio.loop=next==="voyage";
      }
      if(next==="opening"&&Number.isFinite(audio.duration)&&Math.abs(audio.currentTime-elapsed)>.35)
        audio.currentTime=Math.max(0,Math.min(audio.duration-.02,elapsed));
      play();return !failed;
    },
    suspend(){paused=true;stop();},
    snapshot:()=>Object.freeze({selected,enabled,paused,failed,pending,disposed}),
    dispose(){if(disposed)return;disposed=true;stop();audio.removeAttribute("src");audio.load();source.disconnect();}
  });
}
