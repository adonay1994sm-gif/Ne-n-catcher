export class NeonAudio{
  constructor(){this.context=null;this.master=null;this.ambient=null;}
  unlock(){
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)return false;
    if(!this.context){this.context=new AudioContextClass();this.master=this.context.createGain();this.master.gain.value=.17;this.master.connect(this.context.destination);}
    if(this.context.state==='suspended')this.context.resume().catch(()=>{});
    return true;
  }
  tone(frequency,duration=.1,type='sine',volume=.3){
    if(!this.unlock())return;
    const c=this.context,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
    o.type=type;o.frequency.setValueAtTime(frequency,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.01);
  }
  effect(name){if(name==='shot')this.tone(620,.07,'square',.12);else if(name==='collect')this.tone(880,.18,'sine',.32);else if(name==='hit')this.tone(110,.24,'sawtooth',.28);}
  startAmbient(){
    if(!this.unlock()||this.ambient)return;
    const c=this.context,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.value=55;g.gain.value=.035;o.connect(g);g.connect(this.master);o.start();this.ambient={o,g};
  }
  stopAmbient(){if(this.ambient){this.ambient.o.stop();this.ambient.o.disconnect();this.ambient.g.disconnect();this.ambient=null;}}
}
