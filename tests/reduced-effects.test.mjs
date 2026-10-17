import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const settingsSource = await readFile(new URL('../src/game/02-storage-audio.js', import.meta.url), 'utf8');
const loopSource = await readFile(new URL('../src/game/08-loop-input-bootstrap.js', import.meta.url), 'utf8');

function load(saved, system) {
  const sandbox = vm.createContext({storage: {getJSON: () => saved}, KEYS: {settings: 'fixture'},
    DEFAULT_SETTINGS: {music: 35, fx: 70, sensitivity: 100, vibration: true, effectsQuality: 'normal'},
    window: {matchMedia: () => ({matches: system})}});
  vm.runInContext(settingsSource.slice(0, settingsSource.indexOf('  function saveSettings')), sandbox);
  return sandbox.loadSettings();
}

test('old settings inherit the system comfort preference without overwriting their audio or quality', () => {
  for (const system of [true, false]) {
    const settings = load({music: 12, fx: 80, effectsQuality: 'high'}, system);
    assert.equal(settings.reduceEffects, system);
    assert.equal(settings.music, 12);
    assert.equal(settings.fx, 80);
    assert.equal(settings.effectsQuality, 'high');
  }
});

test('an explicit saved comfort choice overrides either system preference; corrupt values fall back safely', () => {
  assert.equal(load({reduceEffects: false}, true).reduceEffects, false);
  assert.equal(load({reduceEffects: true}, false).reduceEffects, true);
  assert.equal(load({reduceEffects: 'false'}, true).reduceEffects, true);
});

function rendered(reduceEffects) {
  const calls = [];
  const ctx = new Proxy({}, {get: (_, key) => (...args) => calls.push({name: key, args})});
  const sandbox = {ctx, settings: {reduceEffects}, cameraKickX: 12, cameraKickY: 8,
    shake: 20, flash: .8, W: 720, H: 1280, powers: {slow: 0}, gates: [], items: []};
  for (const name of ['syncShipPresentation', 'drawShipHangar', 'drawClassicDock', 'background', 'drawWarp',
    'drawTractorCable', 'drawGuardianAtlas', 'drawPlayer', 'drawShots', 'drawClassicProjectiles',
    'drawExplosions', 'drawImpactEffects', 'drawRings', 'drawParts', 'drawCombo']) {
    sandbox[name] = () => calls.push({name});
  }
  vm.createContext(sandbox);
  vm.runInContext(loopSource.slice(0, loopSource.indexOf('  // Synchronous')), sandbox);
  sandbox.render(100);
  return calls;
}

test('comfort rendering removes camera kicks, shake and full-screen damage flash while retaining the scene', () => {
  const regular = rendered(false), reduced = rendered(true);
  assert.equal(regular.filter(call => call.name === 'translate').length, 2);
  assert.equal(regular.filter(call => call.name === 'fillRect').length, 1);
  assert.equal(reduced.filter(call => call.name === 'translate').length, 0);
  assert.equal(reduced.filter(call => call.name === 'fillRect').length, 0);
  for (const name of ['background', 'drawGuardianAtlas', 'drawPlayer', 'drawClassicProjectiles', 'drawImpactEffects']) {
    assert.equal(reduced.filter(call => call.name === name).length, 1, `${name} remains visible`);
  }
});
