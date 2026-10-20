export {createFlightTutorial} from '../narrative/flight-tutorial.js';
import {AUTHORED_LEVELS} from './level-designs.js';
export {createVoyageScore} from '../audio/voyage-score.js';
export {createChapterScore} from '../audio/chapter-score.js';
export {createChronosChapterStory, normalizeChronosChapterCheckpoint} from '../narrative/chronos-chapter.js';
export {resolveHullReinforcement} from '../combat/hull-reinforcement.js';
export {createCompletionJournal} from './completion-journal.js';
export {SCRAP_ECONOMY_KEY, SCRAP_UPGRADES,
  createScrapLedger, rewardForEnemy, formatDenominations, classicWorkshopState} from './scrap-economy.js';
export {createVoyageHazardField, advanceVoyageHazardField} from './voyage-hazards.js';
export {createCometShower, advanceCometShower, advanceShowerComet,
  releaseCometShowerItem, cometShowerSnapshot} from './comet-shower.js';
export {normalizeClassicEquipment,prepareClassicTwin,awardClassicBossWeapon,syncClassicWorkshopWeapons} from './classic-arsenal.js';
export {EncounterDirector, advanceEnemy} from './encounter-director.js';
export {createClassicScout, advanceClassicScout} from './classic-scout.js';
export {createClassicPursuer, advanceClassicPursuer, CLASSIC_PURSUIT_VERSION} from '../combat/classic-pursuit.js';
export {createCh02Animator} from '../animation/ch02-animator.js';
export {getVoyageTransitionPresentation} from '../presentation/voyage-transitions.js';
export {createJourneyDemo, JOURNEY_DEMO_SAVE_KEY} from './journey-demo.js';
export {createGuardianAtlas, advanceGuardianAtlas, hitGuardianAtlas, GUARDIAN_ATLAS_RULES} from '../combat/guardian-atlas.js';
export {guardianAtlasAnimation} from '../animation/guardian-atlas-animator.js';
export {createCombatSfx} from '../audio/combat-sfx.js';
export {SHIP_FLEET, SHIP_FLEET_SAVE_KEY, normalizeShipLoadout, shipPartFrame, shipAssemblyPose,
  shipNozzleAnchors, advanceShipBank} from '../ship/modular-ship.js';
export {n7Dialogue} from '../narrative/n7-dialogues.js';

const palettes = [
  {accent: '#62edff', top: '#142740', mid: '#081426', scene: 'orbit'},
  {accent: '#8b9dff', top: '#261c45', mid: '#0d1028', scene: 'rift'},
  {accent: '#ffb368', top: '#392317', mid: '#20120e', scene: 'belt'},
  {accent: '#88f1bb', top: '#103a38', mid: '#071c22', scene: 'ion'},
  {accent: '#de87ff', top: '#261333', mid: '#100b1f', scene: 'dark'}
];

// The legacy UI receives its existing level shape; the director owns encounters.
export const LEVELS = Object.freeze(AUTHORED_LEVELS.map(design => Object.freeze({
  ...palettes[design.sectorId - 1],
  name: design.title, goal: design.goal,
  speed: 1 + (design.level - 1) / 150, spawn: 1, meteor: 0, power: 0,
  hazard: 'n7', world: design.sectorName.toUpperCase(),
  enemyCue: design.mechanics.join(' / '), zone: `Ruta ${design.withinSector} · ${design.sectorName}`,
  desc: 'Recupera los fragmentos y sobrevive a todas las oleadas',
  mission: design.mission, threatLabel: design.mechanics.join(' · '),
  threatPool: Object.freeze(['meteor']), gate: 0,
  sectorId: design.sectorId, bossEncounter: design.isBoss
})));

export {createChronosVoyage, CHRONOS_VOYAGE_KEY,
  CHRONOS_VOYAGE_STAGES, normalizeChronosVoyageCheckpoint, createChronosVoyageCheckpoint} from './chronos-flight.js';
export {getChronosDestructionPose} from '../animation/chronos-destruction.js';
export {getChronosIntroPose, CHRONOS_INTRO_TIMELINE} from '../animation/chronos-intro.js';
export {CLASSIC_WEAPON_RULES, createClassicWeapons, triggerClassicWeapon, advanceClassicWeapons,
  hitClassicProjectile, unlockClassicWeapon, selectClassicWeapon, classicWeaponSnapshot,
  setClassicRechargeInterval, setClassicWeaponTuning, setClassicUnlimitedFire, canTriggerClassicMissile,
  triggerClassicMissile} from '../combat/classic-weapons.js';
export {calculateFlightBounds, createRelativeFlightInput, beginFlightInput, moveFlightInput, endFlightInput} from '../ship/flight-controls.js';
