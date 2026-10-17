/** Cosmetic assembly data for the legacy renderer; no physics or loop owner. */
export const SHIP_FLEET_SAVE_KEY = 'neonCatcher.shipFleet.v1';

const SLOTS = Object.freeze(['hull','wings','engines']);
const VARIANTS = Object.freeze(['aster','bastion']);
const preset = id => Object.freeze({hull:id,wings:id,engines:id});
export const SHIP_FLEET = Object.freeze([
  Object.freeze({id:'aster',name:'Aster',loadout:preset('aster')}),
  Object.freeze({id:'bastion',name:'Bastion',loadout:preset('bastion')})
]);

// Saves are data: inherited fields and accessors must not select parts or run code.
function ownValue(input,key){
  if(!input||typeof input!=='object'||Array.isArray(input))return undefined;
  try{
    const descriptor=Object.getOwnPropertyDescriptor(input,key);
    return descriptor&&Object.hasOwn(descriptor,'value')?descriptor.value:undefined;
  }catch{return undefined;}
}
function variantAt(input,slot){
  const value=ownValue(input,slot);
  return VARIANTS.includes(value)?value:'aster';
}

/** Each invalid or missing slot falls back independently; unknown keys are ignored. */
export function normalizeShipLoadout(input){
  return Object.freeze(Object.fromEntries(SLOTS.map(slot=>[slot,variantAt(input,slot)])));
}

// Reviewed crops of the actual 1774x887 illustration, not an inferred grid.
// Destinations use one shared 512-unit artboard, with ship pivot at (0,0).
const FRAME_LAYOUTS=Object.freeze({
  hull:[
    {source:{x:146,y:16,width:156,height:409},destination:{x:-70,y:-235,width:140,height:440}},
    {source:{x:136,y:453,width:175,height:410},destination:{x:-88,y:-235,width:176,height:440}}
  ],
  wings:[
    {source:{x:447,y:165,width:439,height:192},destination:{x:-242,y:-50,width:484,height:212}},
    {source:{x:423,y:572,width:488,height:218},destination:{x:-242,y:-50,width:484,height:216}}
  ],
  engines:[
    {source:{x:995,y:229,width:232,height:213},destination:{x:-138,y:20,width:276,height:228}},
    {source:{x:961,y:618,width:306,height:265},destination:{x:-138,y:20,width:276,height:228}}
  ],
  flames:[
    {source:{x:1455,y:143,width:210,height:300},destination:{x:-135,y:173,width:294,height:145}},
    {source:{x:1450,y:518,width:216,height:369},destination:{x:-115,y:173,width:250,height:145}}
  ]
});
const FRAMES=Object.freeze(Object.fromEntries(['hull','wings','engines','flames'].map((part,column)=>[
  part,Object.freeze(VARIANTS.map((_,row)=>Object.freeze({column,row,columns:4,rows:2,
    sourceWidth:1774,sourceHeight:887,
    source:Object.freeze(FRAME_LAYOUTS[part][row].source),
    destination:Object.freeze(FRAME_LAYOUTS[part][row].destination)
  })))
])));

/**
 * source is the explicit crop in sourceWidth x sourceHeight pixels; destination
 * is its reviewed placement on the shared 512-unit ship artboard. column/row
 * describe the original layout only and must never calculate the actual crop.
 * Do not independently center trimmed pieces by their alpha bounds. Flames
 * follow engines so a mixed assembly uses the correct family's exhaust.
 */
export function shipPartFrame(loadout,part){
  if(!Object.hasOwn(FRAMES,part))throw new RangeError('Unknown ship part');
  const variant=variantAt(loadout,part==='flames'?'engines':part);
  return FRAMES[part][VARIANTS.indexOf(variant)];
}

const bounded=(value,fallback,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;

/**
 * Inputs come from existing game state: simulation seconds, normalized steering
 * -1..1, remaining impact seconds and hull health 0..100. No internal clock:
 * calling with the same paused snapshot gives exactly the same assembly pose.
 * bankRotation and wingSweep are radians; the renderer applies the common bank
 * transform to every part before drawing its authored attachment position.
 */
export function shipAssemblyPose(input={}){
  const elapsed=bounded(ownValue(input,'elapsedSeconds'),0,0,Number.MAX_VALUE);
  const steering=bounded(ownValue(input,'steering'),0,-1,1);
  const impact=bounded(ownValue(input,'impactSeconds'),0,0,1);
  const health=bounded(ownValue(input,'hull'),100,0,100);
  // Reduce by each oscillation's period before multiplying, including unusually
  // large finite values from malformed input; no Infinity -> NaN intermediate.
  const wave=frequency=>Math.sin((elapsed%(Math.PI*2/frequency))*frequency);
  const turn=steering*(1.5-.5*steering*steering);
  const intensity=Math.abs(turn),damage=1-health/100;
  return Object.freeze({
    bankScaleX:1-intensity*.12,
    bankRotation:turn*.10+wave(43)*impact*.018,
    wingSweep:turn*.055,
    enginePulse:(1+wave(17)*.075+intensity*.12)*(1-damage*.08)
  });
}
