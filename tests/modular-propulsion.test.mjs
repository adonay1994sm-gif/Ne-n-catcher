import test from 'node:test';
import assert from 'node:assert/strict';
import {shipPartFrame,shipNozzleAnchors,shipAssemblyPose,advanceShipBank}
  from '../src/game/ship/modular-ship.js';

// Roots are measured on the source illustration, independently from descriptor
// generation. Tests compare mounted geometry, rather than repeating its formula.
const roots={aster:[{x:1498,y:177},{x:1616,y:178}],bastion:[{x:1499,y:557},{x:1612,y:557}]};
const variants=['aster','bastion'];
const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-9,`${message}: ${actual} versus ${expected}`);
const pointInPlume=(plume,point)=>({
  x:plume.destination.x+(point.x-plume.source.x)/plume.source.width*plume.destination.width,
  y:plume.destination.y+(point.y-plume.source.y)/plume.source.height*plume.destination.height
});

test('each independent exhaust keeps source proportions while mounting to its own engine nozzle',()=>{
  for(const hull of variants)for(const wings of variants)for(const engines of variants){
    const loadout={hull,wings,engines},frame=shipPartFrame(loadout,'flames'),nozzles=shipNozzleAnchors(loadout);
    assert.equal(frame.plumes.length,2);
    assert.ok(Object.isFrozen(frame.plumes));
    for(const [side,plume]of frame.plumes.entries()){
      assert.ok(Object.isFrozen(plume)&&Object.isFrozen(plume.source)&&Object.isFrozen(plume.destination)&&Object.isFrozen(plume.anchor));
      const {source,destination}=plume;
      close(destination.width/destination.height,source.width/source.height,`${engines} jet ${side} aspect`);
      assert.ok(destination.width<45&&destination.height===145,'jets retain length without the old sideways inflation');
      assert.ok(Object.values(source).every(Number.isInteger),'crop boundaries align to source pixels');
      assert.ok(source.x>=0&&source.y>=0&&source.x+source.width<=frame.sourceWidth&&source.y+source.height<=frame.sourceHeight);
      const mounted=pointInPlume(plume,roots[engines][side]);
      close(mounted.x,nozzles[side].x,`${engines} jet ${side} nozzle x`);
      close(mounted.y,nozzles[side].y,`${engines} jet ${side} nozzle y`);
      assert.deepEqual(plume.anchor,nozzles[side]);
      assert.ok(destination.x>=-256&&destination.x+destination.width<=256);
      assert.ok(destination.y>=-256&&destination.y+destination.height<=318);
    }
    assert.ok(frame.plumes[0].source.x+frame.plumes[0].source.width<frame.plumes[1].source.x,
      'the opaque contamination between authored jets stays excluded');
    assert.ok(frame.plumes[0].destination.x+frame.plumes[0].destination.width<frame.plumes[1].destination.x,
      'plumes remain distinct instead of covering the ship center');
  }
});

test('thrust pulse and shared bank keep both exhaust roots attached through turns, impact and damage',()=>{
  for(const engines of variants){
    const loadout={engines},plumes=shipPartFrame(loadout,'flames').plumes,nozzles=shipNozzleAnchors(loadout);
    const pivotY=nozzles.reduce((sum,point)=>sum+point.y,0)/nozzles.length;
    let bank=0;
    for(let step=0;step<150;step++){
      bank=advanceShipBank(bank,step<50?1:step<100?-1:0,1/60);
      const pose=shipAssemblyPose({elapsedSeconds:step/60,steering:bank,impactSeconds:step===70?.6:0,hull:step<100?100:20});
      const rotate=point=>({
        x:point.x*pose.bankScaleX*Math.cos(pose.bankRotation)-point.y*Math.sin(pose.bankRotation),
        y:point.x*pose.bankScaleX*Math.sin(pose.bankRotation)+point.y*Math.cos(pose.bankRotation)
      });
      for(const [side,plume]of plumes.entries()){
        const root=pointInPlume(plume,roots[engines][side]);
        const thrustRoot={x:root.x,y:pivotY+(root.y-pivotY)*pose.enginePulse};
        const transformedRoot=rotate(thrustRoot),transformedNozzle=rotate(nozzles[side]);
        close(transformedRoot.x,transformedNozzle.x,`${engines} bank/pulse attachment x`);
        close(transformedRoot.y,transformedNozzle.y,`${engines} bank/pulse attachment y`);
      }
    }
  }
});

test('paused plume geometry and assembly poses stay deterministic without touching ship size or state',()=>{
  const loadout={hull:'bastion',wings:'aster',engines:'bastion'},snapshot={elapsedSeconds:12.3,steering:.4,hull:70};
  const frame=shipPartFrame(loadout,'flames'),pose=shipAssemblyPose(snapshot),before=JSON.stringify({loadout,snapshot});
  for(let repeat=0;repeat<100;repeat++){
    assert.equal(shipPartFrame(loadout,'flames'),frame);
    assert.deepEqual(shipAssemblyPose(snapshot),pose);
  }
  assert.equal(JSON.stringify({loadout,snapshot}),before);
  assert.equal(advanceShipBank(.4,-1,0),.4);
  assert.deepEqual(shipPartFrame({engines:'unknown'},'flames').plumes,shipPartFrame({engines:'aster'},'flames').plumes);
});
