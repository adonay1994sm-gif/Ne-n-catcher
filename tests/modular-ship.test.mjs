import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHIP_FLEET,SHIP_FLEET_SAVE_KEY,normalizeShipLoadout,shipPartFrame,shipAssemblyPose
} from '../src/game/ship/modular-ship.js';

const stock={hull:'aster',wings:'aster',engines:'aster'};

test('two immutable cosmetic presets have a separate stable save key and no collision or combat modifiers',()=>{
  assert.equal(SHIP_FLEET_SAVE_KEY,'neonCatcher.shipFleet.v1');
  assert.deepEqual(SHIP_FLEET.map(ship=>ship.id),['aster','bastion']);
  assert.equal(Object.isFrozen(SHIP_FLEET),true);
  for(const ship of SHIP_FLEET){
    assert.equal(Object.isFrozen(ship),true);assert.equal(Object.isFrozen(ship.loadout),true);
    assert.deepEqual(ship.loadout,{hull:ship.id,wings:ship.id,engines:ship.id});
    assert.deepEqual(Object.keys(ship).sort(),['id','loadout','name']);
  }
});

test('normalization preserves mixed assemblies while independently repairing invalid slots',()=>{
  const input={hull:'bastion',wings:'aster',engines:'bastion',credits:1e9};
  const result=normalizeShipLoadout(input);
  assert.deepEqual(result,{hull:'bastion',wings:'aster',engines:'bastion'});
  assert.deepEqual(normalizeShipLoadout({hull:'bastion',wings:'missing',engines:7}),{...stock,hull:'bastion'});
  assert.equal(Object.isFrozen(result),true);assert.equal(input.credits,1e9);
  assert.throws(()=>{result.hull='aster';},TypeError);
});

test('corrupt data and inherited values cannot equip parts, and accessors are never executed',()=>{
  for(const input of [undefined,null,false,4,'bastion','{"hull":"bastion"}',[],['bastion']]){
    assert.deepEqual(normalizeShipLoadout(input),stock);
  }
  assert.deepEqual(normalizeShipLoadout(Object.create({hull:'bastion',wings:'bastion',engines:'bastion'})),stock);
  let calls=0;const input={get hull(){calls++;return 'bastion';},wings:'bastion'};
  assert.deepEqual(normalizeShipLoadout(input),{...stock,wings:'bastion'});assert.equal(calls,0);
  assert.deepEqual(normalizeShipLoadout(JSON.parse('{"__proto__":{"hull":"bastion"},"engines":"bastion"}')),
    {...stock,engines:'bastion'});
  const inaccessible=new Proxy({},{getOwnPropertyDescriptor(){throw new Error('unavailable');}});
  assert.deepEqual(normalizeShipLoadout(inaccessible),stock);
});

test('all eight combinations resolve to reviewed crops inside the real atlas and a shared destination artboard',()=>{
  for(const hull of ['aster','bastion'])for(const wings of ['aster','bastion'])for(const engines of ['aster','bastion']){
    const loadout={hull,wings,engines};
    for(const [column,part]of ['hull','wings','engines','flames'].entries()){
      const frame=shipPartFrame(loadout,part),variant=loadout[part==='flames'?'engines':part];
      assert.deepEqual({column:frame.column,row:frame.row,columns:frame.columns,rows:frame.rows},
        {column,row:variant==='aster'?0:1,columns:4,rows:2});
      assert.equal(Object.isFrozen(frame),true);assert.equal(Object.isFrozen(frame.source),true);
      assert.equal(Object.isFrozen(frame.destination),true);
      assert.equal(frame.sourceWidth,1774);assert.equal(frame.sourceHeight,887);
      const {source,destination}=frame;
      assert.ok(Object.values(source).every(Number.isFinite));assert.ok(Object.values(destination).every(Number.isFinite));
      assert.ok(source.x>=0&&source.y>=0&&source.width>0&&source.height>0);
      assert.ok(source.x+source.width<=frame.sourceWidth&&source.y+source.height<=frame.sourceHeight);
      assert.ok(destination.width>0&&destination.height>0);
      if(part!=='flames')assert.equal(destination.x+destination.width/2,0,'structural parts share the ship center axis');
      assert.ok(destination.x>=-256&&destination.x+destination.width<=256);
      // Exhaust extends behind the main artboard by design, never shifts the pivot.
      assert.ok(destination.y>=-256&&destination.y+destination.height<=318);
    }
  }
});

test('explicit source crops exclude neighboring parts and destinations preserve the reviewed mechanical joints',()=>{
  const overlaps=(first,second)=>first.x<second.x+second.width&&first.x+first.width>second.x&&
    first.y<second.y+second.height&&first.y+first.height>second.y;
  const crops=[];
  for(const variant of ['aster','bastion']){
    const loadout={hull:variant,wings:variant,engines:variant};
    for(const part of ['hull','wings','engines','flames']){
      crops.push(shipPartFrame(loadout,part).source);
    }
  }
  for(let first=0;first<crops.length;first++)for(let second=first+1;second<crops.length;second++){
    assert.equal(overlaps(crops[first],crops[second]),false,'source crops must not include a neighboring part');
  }
  // Source anchors were measured on the actual illustration. Exhaust is
  // asymmetric inside its crop: centering that crop detaches it from nozzles.
  // Validate the physical attachment instead of mirroring every crop literal.
  const anchors={
    aster:{nozzles:[[1040,375],[1185,375]],flames:[[1498,177],[1616,178]]},
    bastion:{nozzles:[[1042,799],[1189,799]],flames:[[1499,557],[1612,557]]}
  };
  const mapPoint=(frame,[x,y])=>{
    const {source,destination}=frame;
    assert.ok(x>=source.x&&x<=source.x+source.width&&y>=source.y&&y<=source.y+source.height,
      'measured attachment point must remain inside its corresponding crop');
    return {x:destination.x+(x-source.x)/source.width*destination.width,
      y:destination.y+(y-source.y)/source.height*destination.height};
  };
  for(const hull of ['aster','bastion'])for(const wings of ['aster','bastion'])for(const engines of ['aster','bastion']){
    const loadout={hull,wings,engines},frames=Object.fromEntries(
      ['hull','wings','engines','flames'].map(part=>[part,shipPartFrame(loadout,part)]));
    // Envelope checks prevent gaps in any mixed configuration; screenshots
    // remain necessary to review actual materials, silhouette and alpha seams.
    assert.ok(overlaps(frames.hull.destination,frames.wings.destination));
    assert.ok(overlaps(frames.hull.destination,frames.engines.destination));
    assert.ok(overlaps(frames.engines.destination,frames.flames.destination));
    assert.equal(frames.flames.row,frames.engines.row,'exhaust must match its engine family');
    for(let side=0;side<2;side++){
      const nozzle=mapPoint(frames.engines,anchors[engines].nozzles[side]);
      const flame=mapPoint(frames.flames,anchors[engines].flames[side]);
      assert.ok(Math.abs(nozzle.x-flame.x)<=14,`${engines} exhaust misses its nozzle horizontally`);
      assert.ok(Math.abs(nozzle.y-flame.y)<=14,`${engines} exhaust misses its nozzle vertically`);
    }
  }
});

test('exhaust always follows the equipped engine and invalid part names cannot alias prototype properties',()=>{
  assert.equal(shipPartFrame({hull:'bastion',wings:'bastion',engines:'aster'},'flames').row,0);
  assert.equal(shipPartFrame({hull:'aster',wings:'aster',engines:'bastion'},'flames').row,1);
  assert.equal(shipPartFrame(Object.create({engines:'bastion'}),'flames').row,0);
  for(const part of ['body','constructor','__proto__',undefined])assert.throws(()=>shipPartFrame(stock,part),RangeError);
});

test('paused assembly poses are deterministic, finite and cannot mutate their inputs',()=>{
  const input={elapsedSeconds:17.35,steering:.6,impactSeconds:.3,hull:35};
  const before={...input},pose=shipAssemblyPose(input);
  for(let index=0;index<100;index++)assert.deepEqual(shipAssemblyPose(input),pose);
  assert.deepEqual(input,before);assert.equal(Object.isFrozen(pose),true);
  assert.ok(Object.values(pose).every(Number.isFinite));
  assert.notDeepEqual(shipAssemblyPose({...input,elapsedSeconds:17.45}),pose);
});

test('steering produces a smooth mirrored common bank and continuous wing motion',()=>{
  const left=shipAssemblyPose({steering:-.6}),right=shipAssemblyPose({steering:.6});
  assert.equal(left.bankScaleX,right.bankScaleX);assert.equal(left.bankRotation,-right.bankRotation);
  assert.equal(left.wingSweep,-right.wingSweep);assert.equal(left.enginePulse,right.enginePulse);
  const neutral=shipAssemblyPose(),tiny=shipAssemblyPose({steering:1e-6});
  for(const name of Object.keys(neutral))assert.ok(Math.abs(neutral[name]-tiny[name])<1e-5);
  const timeBefore=shipAssemblyPose({elapsedSeconds:10,steering:.2}),timeAfter=shipAssemblyPose({elapsedSeconds:10.000001,steering:.2});
  for(const name of Object.keys(timeBefore))assert.ok(Math.abs(timeBefore[name]-timeAfter[name])<1e-4);
});

test('extreme and malformed pose inputs remain bounded without changing cosmetic assembly into physics',()=>{
  const options=[null,false,[],{elapsedSeconds:NaN,steering:Infinity,impactSeconds:-2,hull:'0'},
    {elapsedSeconds:Number.MAX_VALUE,steering:Number.MAX_VALUE,impactSeconds:Infinity,hull:-500},
    {elapsedSeconds:-9,steering:-Number.MAX_VALUE,impactSeconds:500,hull:1000}];
  for(const input of options){
    const pose=shipAssemblyPose(input);
    assert.deepEqual(Object.keys(pose).sort(),['bankRotation','bankScaleX','enginePulse','wingSweep']);
    assert.ok(Object.values(pose).every(Number.isFinite));assert.ok(pose.bankScaleX>=.88&&pose.bankScaleX<=1);
    assert.ok(Math.abs(pose.bankRotation)<=.118);assert.ok(Math.abs(pose.wingSweep)<=.055);
    assert.ok(pose.enginePulse>.8&&pose.enginePulse<1.2);
  }
});
