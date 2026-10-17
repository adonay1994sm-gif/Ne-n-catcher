import {AUTHORED_LEVELS} from './level-designs.js';
export {EncounterDirector, advanceEnemy} from './encounter-director.js';
export {createClassicScout, advanceClassicScout} from './classic-scout.js';
export {createJourneyDemo, JOURNEY_DEMO_SAVE_KEY, JOURNEY_DEMO_VERSION} from './journey-demo.js';
export {GENERATOR_VERSION} from './generator.js';
export {SHIP_FLEET, SHIP_FLEET_SAVE_KEY, normalizeShipLoadout, shipPartFrame, shipAssemblyPose} from '../ship/modular-ship.js';
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
