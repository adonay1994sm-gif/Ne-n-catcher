import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Editorial contracts only. Passing these checks proves no runtime, artwork,
// balance, natural playthrough or physical-device certification.
const design=JSON.parse(readFileSync(new URL('../design/campaign-space-v1.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../ASSET_PRODUCTION_150.json',import.meta.url),'utf8'));
const chapters=design.chapters;
const stages=chapters.flatMap(chapter=>chapter.stages);
const unique=values=>new Set(values).size===values.length;
const finite=number=>typeof number==='number'&&Number.isFinite(number);
const nonempty=value=>typeof value==='string'&&value.trim().length>0;

const checkReadability=(difficulty,label)=>{
  assert.ok(finite(difficulty.minSoloTelegraphMs)&&difficulty.minSoloTelegraphMs>=900,`${label}: isolated attack below the editorial reaction floor`);
  assert.ok(finite(difficulty.minCombinedTelegraphMs)&&difficulty.minCombinedTelegraphMs>=1200,`${label}: combined attack below the editorial reaction floor`);
  assert.ok(difficulty.minCombinedTelegraphMs>=difficulty.minSoloTelegraphMs,`${label}: combinations need at least as much warning`);
  assert.ok(Number.isInteger(difficulty.maxCommittedAttackers)&&difficulty.maxCommittedAttackers>=1&&difficulty.maxCommittedAttackers<=4,`${label}: unbounded attacker concurrency`);
  assert.ok(Number.isInteger(difficulty.maxProjectileFamilies)&&difficulty.maxProjectileFamilies>=1&&difficulty.maxProjectileFamilies<=2,`${label}: projectile-family saturation`);
  assert.ok(finite(difficulty.minNavigableWidthFraction)&&difficulty.minNavigableWidthFraction>=.30&&difficulty.minNavigableWidthFraction<=1,`${label}: invalid navigable width target`);
  assert.equal(difficulty.mandatoryDamageAllowed,false,`${label}: the design cannot require taking damage`);
};

test('campaign data explicitly distinguishes editorial design from implemented, artistic and physical acceptance',()=>{
  assert.equal(design.schemaVersion,1);
  assert.equal(design.status,'EDITORIAL_DESIGN_NOT_RUNTIME');
  assert.ok(nonempty(design.productionGate.runtimeIntegration));
  assert.ok(nonempty(design.productionGate.oldCampaigns));
  for(const entry of [...chapters,...stages]){
    assert.equal(entry.implementationStatus,'PENDING',`${entry.id}: design is not implementation`);
    assert.equal(entry.artisticAcceptance,'PENDING',`${entry.id}: a dossier is not artistic approval`);
    assert.equal(entry.physicalAcceptance,'PENDING',`${entry.id}: data is not an iPhone test`);
  }
  assert.equal(design.bossFinal.implementationStatus,'PENDING');
});

test('ten ordered chapters contain one hundred stable, unique and correctly indexed stage identifiers',()=>{
  assert.equal(chapters.length,10);assert.equal(stages.length,100);
  assert.equal(unique(chapters.map(chapter=>chapter.id)),true);
  assert.equal(unique(stages.map(stage=>stage.id)),true);
  for(const [chapterIndex,chapter]of chapters.entries()){
    const chapterId=`c${String(chapterIndex+1).padStart(2,'0')}`;
    assert.equal(chapter.id,chapterId);assert.equal(chapter.index,chapterIndex+1);
    assert.equal(chapter.stages.length,10);
    for(const [stageIndex,stage]of chapter.stages.entries()){
      assert.equal(stage.id,`${chapterId}-s${String(stageIndex+1).padStart(2,'0')}`);
      assert.equal(stage.chapterId,chapterId);assert.equal(stage.chapterIndex,chapterIndex+1);
      assert.equal(stage.stageIndex,stageIndex+1);assert.equal(stage.campaignIndex,chapterIndex*10+stageIndex+1);
    }
  }
});

test('one hundred routes form a continuous chain of 101 named locations across chapter boundaries',()=>{
  assert.equal(design.locations.length,stages.length+1);
  assert.equal(unique(design.locations.map(location=>location.id)),true);
  const locations=new Map(design.locations.map(location=>[location.id,location]));
  const visited=[stages[0].route.originId];
  for(const [index,stage]of stages.entries()){
    const route=stage.route,origin=locations.get(route.originId),destination=locations.get(route.destinationId);
    assert.ok(origin&&destination,`${stage.id}: unknown endpoint`);
    assert.notEqual(route.originId,route.destinationId,`${stage.id}: empty journey`);
    assert.equal(route.originName,origin.name);assert.equal(route.destinationName,destination.name);
    assert.ok(nonempty(route.continuityCue),`${stage.id}: missing geographical presentation`);
    if(index)assert.equal(route.originId,stages[index-1].route.destinationId,`${stage.id}: unexplained teleport`);
    assert.equal(stage.checkpoint.nextStageId,stages[index+1]?.id??null,`${stage.id}: checkpoint skips or repeats a stage`);
    visited.push(route.destinationId);
  }
  assert.deepEqual(visited,design.locations.map(location=>location.id));
  for(const [index,chapter]of chapters.entries()){
    assert.equal(chapter.startLocationId,chapter.stages[0].route.originId);
    assert.equal(chapter.endLocationId,chapter.stages.at(-1).route.destinationId);
    assert.equal(chapter.nextChapterId,chapters[index+1]?.id??null);
  }
});

test('chapter route spans cover zero to one without gaps, overlaps or events scheduled inside recovery',()=>{
  for(const chapter of chapters){
    assert.equal(chapter.stages[0].route.span[0],0);
    assert.equal(chapter.stages.at(-1).route.span[1],1);
    let covered=0;
    for(const [index,stage]of chapter.stages.entries()){
      const [start,end]=stage.route.span;
      assert.ok(finite(start)&&finite(end)&&start>=0&&end<=1&&start<end,`${stage.id}: invalid span`);
      if(index)assert.equal(start,chapter.stages[index-1].route.span[1]);
      covered+=end-start;
      assert.ok(stage.route.stageDistanceUnits>0&&stage.route.chapterDistanceUnits>0);
      assert.ok(Math.abs((end-start)*stage.route.chapterDistanceUnits-stage.route.stageDistanceUnits)<1e-9);
      const [restStart,restEnd]=stage.recovery.routeProgressRange;
      assert.ok(restStart>=0&&restEnd<=1&&restStart<restEnd,`${stage.id}: invalid recovery interval`);
      assert.equal(stage.recovery.hostileSpawns,false);
      assert.ok(nonempty(stage.recovery.purpose));
      assert.ok(finite(stage.recovery.minimumTargetSeconds)&&stage.recovery.minimumTargetSeconds>=0);
      for(const event of stage.encounter.atRouteProgress){
        assert.ok(finite(event)&&event>=0&&event<=1,`${stage.id}: out-of-route encounter`);
        assert.ok(!(event>restStart&&event<restEnd),`${stage.id}: hostile beat inside the reserved recovery span`);
      }
    }
    assert.ok(Math.abs(covered-1)<1e-9);
  }
});

test('versioned authored routes and unique seeds do not masquerade as an executable generator',()=>{
  assert.match(design.version,/^[a-z0-9-]+-v\d+$/);
  assert.equal(unique(stages.map(stage=>stage.reproducibility.seedKey)),true);
  const generators=new Set();
  for(const entry of [...chapters,...stages])assert.equal(entry.contentVersion,design.version);
  for(const stage of stages){
    const replay=stage.reproducibility;
    assert.ok(replay.seedKey.includes(design.version)&&replay.seedKey.includes(stage.id),`${stage.id}: reproduction key lacks content identity`);
    assert.match(replay.generatorVersion,/v\d+-planned$/);
    assert.equal(replay.authoredLandmarksImmutable,true);
    assert.equal(replay.runtimeStatus,'NOT_IMPLEMENTED');
    generators.add(replay.generatorVersion);
  }
  assert.equal(generators.size,1,'a new design version must identify which encounter rules reproduce a stage');
});

test('first-clear rewards have unique transaction identities, safe checkpoints and consistent chapter unlocks',()=>{
  assert.equal(unique(stages.map(stage=>stage.reward.onceKey)),true);
  const parts=[];
  for(const stage of stages){
    assert.ok(stage.reward.onceKey.includes(stage.id)&&stage.reward.onceKey.includes(stage.contentVersion));
    assert.ok(Number.isInteger(stage.reward.credits)&&stage.reward.credits>=0);
    assert.equal(stage.reward.chapterAccess,stage.stageIndex===10?(stage.chapterIndex===10?'campaign-epilogue':chapters[stage.chapterIndex].id):null);
    assert.equal(stage.checkpoint.saveAt,'safe-arrival-after-objective');
    if(stage.reward.part){
      assert.ok(nonempty(stage.reward.part.id)&&nonempty(stage.reward.part.name));
      assert.equal(stage.mission.kind,'recover','equipment must have an authored recovery, not silently appear after a timer');
      assert.equal(stage.reward.part.delivery,'guaranteed-first-completion');
      assert.equal(stage.reward.part.installation,'at-service-or-checkpoint-not-mid-combat');
      parts.push(stage.reward.part.id);
    }
  }
  assert.equal(parts.length,10);assert.equal(unique(parts),true);
});

test('authored stages have varied objectives, ten safe service stops and ten distinct chapter resolutions',()=>{
  assert.equal(unique(stages.map(stage=>stage.title)),true);
  assert.equal(unique(stages.map(stage=>stage.mission.objective)),true);
  assert.equal(unique(stages.map(stage=>stage.encounter.authoredSequence)),true);
  assert.ok(new Set(stages.map(stage=>stage.mission.kind)).size>=15,'the design must not be one mission recolored one hundred times');
  const services=stages.filter(stage=>stage.mission.kind==='service');
  assert.equal(services.length,10);assert.ok(new Set(services.map(stage=>stage.stageIndex)).size>=3,'service placement cannot be the same copied beat in every chapter');
  const closes=[];
  for(const chapter of chapters){
    assert.equal(chapter.stages.filter(stage=>stage.mission.kind==='service').length,1);
    const close=chapter.stages.at(-1);
    assert.ok(['frontier','finale'].includes(close.mission.kind));
    assert.ok(nonempty(close.encounter.territorialAdversary));
    assert.ok(nonempty(chapter.resolution));closes.push(close.encounter.territorialAdversary);
  }
  assert.equal(unique(closes),true,'chapter access should not repeat an unchanged guardian');
  for(const stage of stages){
    assert.ok(stage.mission.objective.length>35);
    assert.ok(stage.mission.requiredOutcome.length>=2);
    assert.ok(nonempty(stage.narrative.speaker)&&nonempty(stage.narrative.line)&&stage.narrative.line.length<=220);
    if(['service','wonder'].includes(stage.mission.kind))assert.deepEqual(stage.encounter.enemyFamilies,[],'service or contemplation is not a disguised compulsory fight');
  }
});

test('progressive difficulty remains bounded by explicit reaction and navigability targets, never certified measurements',()=>{
  let previous;
  for(const chapter of chapters){
    const curve=chapter.difficulty;checkReadability(curve,chapter.id);
    assert.equal(curve.band,chapter.index);
    if(previous){
      assert.ok(curve.minSoloTelegraphMs<=previous.minSoloTelegraphMs);
      assert.ok(curve.minCombinedTelegraphMs<=previous.minCombinedTelegraphMs);
      assert.ok(curve.maxCommittedAttackers>=previous.maxCommittedAttackers);
    }
    for(const stage of chapter.stages){
      checkReadability(stage.difficulty,stage.id);
      assert.equal(stage.difficulty.band,chapter.index);
      assert.equal(stage.difficulty.measurementStatus,'TARGET_NOT_MEASURED');
      const [minimum,maximum]=stage.difficulty.targetNaturalDurationSeconds;
      assert.ok(finite(minimum)&&finite(maximum)&&minimum>0&&maximum>=minimum);
      assert.ok(nonempty(stage.difficulty.masteryGoal));
    }
    previous=curve;
  }
  assert.equal(design.difficultyContract.numericValuesAreTargets,true);
  assert.ok(design.difficultyContract.simulationRequired.length>=4,'corridor and loadout fairness still require real simulation');
});

test('art references resolve to catalog identities without claiming asset completion or five-phase gameplay',()=>{
  const assetIds=new Set(catalog.assets.map(asset=>asset.id));
  for(const stage of stages){
    for(const ref of stage.presentation.assetCatalogRefs)assert.ok(assetIds.has(ref),`${stage.id}: nonexistent catalog identity ${ref}`);
    assert.equal(stage.presentation.assetStatus,'PLANNED_OR_EXISTING_ASSET_REQUIRES_REVIEW');
    assert.ok(stage.presentation.requiredAnimations.length>=3);
    assert.ok(nonempty(stage.presentation.referenceDossier));
  }
  const final=design.bossFinal;
  assert.equal(final.stageId,stages.at(-1).id);assert.equal(final.phases.length,5);
  assert.equal(unique(final.phases.map(phase=>phase.id)),true);
  assert.equal(unique(final.phases.map(phase=>phase.rule)),true);
  assert.equal(final.assetStatus,'PLANNED_FROM_USER_DOSSIER');
  for(const phase of final.phases){
    assert.ok(nonempty(phase.name)&&nonempty(phase.rule)&&nonempty(phase.transition));
    assert.ok(phase.counterplay.length>=2&&phase.counterplay.every(nonempty));
  }
});

test('shared editorial policy references cannot silently drop retry, reward, dialogue or recovery contracts',()=>{
  const required=['failurePolicyRef','protectedObjectivesRef','displayPolicyRef','duplicatePolicyRef','reloadPolicyRef','runtimeAcceptanceRef','activeAttackPolicyRef','newRulePolicyRef'];
  for(const stage of stages){
    const references=new Map();
    for(const object of [stage.mission,stage.narrative,stage.reward,stage.checkpoint,stage.presentation,stage.recovery,stage.difficulty]){
      for(const [key,value]of Object.entries(object))if(key.endsWith('Ref')){
        assert.ok(nonempty(design.sharedPolicies[value]),`${stage.id}: unresolved shared policy ${value}`);
        references.set(key,value);
      }
    }
    for(const key of required)assert.ok(references.has(key),`${stage.id}: missing ${key}`);
  }
});
