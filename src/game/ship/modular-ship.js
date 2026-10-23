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
    {source:{x:1455,y:143,width:210,height:300},destination:{x:-147.32568673290473,y:159.60669014084507,width:306.99152542372883,height:145}},
    {source:{x:1450,y:518,width:216,height:369},destination:{x:-122.43519000520561,y:160.40309863475994,width:253.44299843831337,height:145}}
  ]
});
// Pixel-measured roots on the original atlas. The paired plume's wide envelope
// remains available for old presentation consumers; it is not a draw rectangle.
// Each jet is cropped and mounted separately so nozzle spacing never stretches
// the illustrated flame sideways. The contaminated gap between jets is omitted.
const NOZZLE_POINTS=Object.freeze([
  Object.freeze([[1040,375],[1185,375]].map(Object.freeze)),
  Object.freeze([[1042,799],[1189,799]].map(Object.freeze))
]);
const PLUME_LAYOUTS=Object.freeze([
  Object.freeze([
    Object.freeze({source:Object.freeze({x:1455,y:143,width:84,height:300}),root:Object.freeze({x:1498,y:177})}),
    Object.freeze({source:Object.freeze({x:1581,y:143,width:84,height:300}),root:Object.freeze({x:1616,y:178})})
  ]),
  Object.freeze([
    Object.freeze({source:Object.freeze({x:1450,y:518,width:86,height:369}),root:Object.freeze({x:1499,y:557})}),
    Object.freeze({source:Object.freeze({x:1580,y:518,width:86,height:369}),root:Object.freeze({x:1612,y:557})})
  ])
]);
function nozzleAt(row,side){
  const {source,destination}=FRAME_LAYOUTS.engines[row],point=NOZZLE_POINTS[row][side];
  return Object.freeze({
    x:destination.x+(point[0]-source.x)/source.width*destination.width,
    y:destination.y+(point[1]-source.y)/source.height*destination.height
  });
}
function mountedPlumes(row){
  return Object.freeze(PLUME_LAYOUTS[row].map(({source,root},side)=>{
    const anchor=nozzleAt(row,side),scale=145/source.height;
    return Object.freeze({source,anchor,destination:Object.freeze({
      x:anchor.x-(root.x-source.x)*scale,
      y:anchor.y-(root.y-source.y)*scale,
      width:source.width*scale,height:source.height*scale
    })});
  }));
}
const FRAMES=Object.freeze(Object.fromEntries(['hull','wings','engines','flames'].map((part,column)=>[
  part,Object.freeze(VARIANTS.map((_,row)=>Object.freeze({column,row,columns:4,rows:2,
    sourceWidth:1774,sourceHeight:887,
    source:Object.freeze(FRAME_LAYOUTS[part][row].source),
    destination:Object.freeze(FRAME_LAYOUTS[part][row].destination),
    ...(part==='flames'?{plumes:mountedPlumes(row)}:{})
  })))
])));

/**
 * source is the explicit crop in sourceWidth x sourceHeight pixels; destination
 * is its reviewed placement on the shared 512-unit ship artboard. column/row
 * describe the original layout only and must never calculate the actual crop.
 * Do not independently center trimmed pieces by their alpha bounds. Flames
 * follow engines so a mixed assembly uses the correct family's exhaust. Draw
 * flames with the two `plumes` placements, preserving their authored proportions;
 * the parent source/destination describe the previous paired envelope only.
 */
export function shipPartFrame(loadout,part){
  if(!Object.hasOwn(FRAMES,part))throw new RangeError('Unknown ship part');
  const variant=variantAt(loadout,part==='flames'?'engines':part);
  return FRAMES[part][VARIANTS.indexOf(variant)];
}

/** Reviewed nozzle centers on the shared artboard, independent of render size. */
export function shipNozzleAnchors(loadout){
  const row=shipPartFrame(loadout,'engines').row;
  return Object.freeze(NOZZLE_POINTS[row].map((_,side)=>nozzleAt(row,side)));
}

/** Visual response only; the existing update loop keeps full control accuracy. */
export function advanceShipBank(current,target,delta){
  if(!Number.isFinite(delta)||delta<0)throw new RangeError('Visual bank delta must be nonnegative');
  const before=Number.isFinite(current)?Math.max(-1,Math.min(1,current)):0;
  const desired=Number.isFinite(target)?Math.max(-1,Math.min(1,target)):0;
  if(delta===0)return before;
  const response=Math.abs(desired)>Math.abs(before)?8:5;
  return before+(desired-before)*(1-Math.exp(-Math.min(delta,.1)*response));
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
  const bankStrength=bounded(ownValue(input,'bankStrength'),1,1,2);
  // Reduce by each oscillation's period before multiplying, including unusually
  // large finite values from malformed input; no Infinity -> NaN intermediate.
  const wave=frequency=>Math.sin((elapsed%(Math.PI*2/frequency))*frequency);
  const turn=steering*(1.5-.5*steering*steering);
  const intensity=Math.abs(turn),damage=1-health/100;
  return Object.freeze({
    bankScaleX:1-intensity*.12,
    bankRotation:turn*.10*bankStrength+wave(43)*impact*.018,
    wingSweep:turn*.055,
    enginePulse:(1+wave(17)*.075+intensity*.12)*(1-damage*.08)
  });
}
