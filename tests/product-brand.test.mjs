import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {previewManifest, previewPage, previewConfig, STORAGE_PREFIX} from '../scripts/build-preview.mjs';
import {CHRONOS_VOYAGE_KEY, createChronosVoyageCheckpoint, createChronosVoyage} from '../src/game/progression/chronos-flight.js';
import {SHIP_FLEET_SAVE_KEY} from '../src/game/ship/modular-ship.js';
import {JOURNEY_DEMO_SAVE_KEY} from '../src/game/progression/journey-demo.js';

const text = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const oldVisibleBrand = /neon\s*catcher/i;

test('NEON CRONIUM appears in live pages and accessible names without the retired wordmark', async () => {
  for (const path of ['index.html', 'preview/launcher.html', 'privacy.html', 'terms.html', 'engine-preview.html']) {
    const dom = new JSDOM(await text(path));
    const document = dom.window.document;
    assert.match(document.title, /neon cronium/i, path);
    assert.doesNotMatch(document.body.textContent, oldVisibleBrand, path);
    for (const element of document.querySelectorAll('[aria-label],[alt],meta[name="description"]')) {
      assert.doesNotMatch([element.getAttribute('aria-label'), element.getAttribute('alt'), element.getAttribute('content')].join(' '), oldVisibleBrand, path);
    }
    if (path === 'index.html') assert.equal(document.querySelector('.menu-topline strong').textContent, 'NEON CRONIUM');
    if (path === 'preview/launcher.html') assert.equal(document.querySelector('h1').textContent, 'NEONCRONIUM');
    dom.window.close();
  }
});

test('package, install names and generated preview agree while application identity stays compatible', async () => {
  const [pkg, lock, manifest] = await Promise.all(['package.json', 'package-lock.json', 'manifest.webmanifest'].map(async path => JSON.parse(await text(path))));
  assert.equal(pkg.name, 'neon-cronium');
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.equal(manifest.name, 'NEON CRONIUM');
  assert.equal(manifest.short_name, 'NEON CRONIUM');
  assert.equal(manifest.id, './');
  const html = await text('index.html');
  assert.match(previewPage(html), /<title>NEON CRONIUM — Prueba experimental<\/title>/);
  for (const nested of [false, true]) {
    const preview = JSON.parse(previewManifest(JSON.stringify(manifest), nested));
    assert.equal(preview.name, 'NEON CRONIUM — Prueba experimental');
    assert.equal(preview.short_name, 'NEON CRONIUM');
    assert.equal(preview.id, (nested ? '../' : './') + '?edition=neon-preview-v1');
  }
  assert.match(await text('capacitor.config.ts'), /appName: "NEON CRONIUM"/);
  assert.match(await text('capacitor.config.ts'), /appId: "com\.adonay\.neoncatcher"/);
  assert.match(await text('ios/App/App/Info.plist'), /<key>CFBundleDisplayName<\/key>\s*<string>NEON CRONIUM<\/string>/);
  assert.equal(JSON.parse(await text('ios/App/App/capacitor.config.json')).appName, 'NEON CRONIUM');
});

test('renaming preserves existing preview saves and resumes a pre-rename voyage checkpoint', () => {
  assert.equal(STORAGE_PREFIX, 'neon-preview-v1:');
  assert.equal(CHRONOS_VOYAGE_KEY, 'neonCatcher.chronosVoyage.v2');
  assert.equal(SHIP_FLEET_SAVE_KEY, 'neonCatcher.shipFleet.v1');
  assert.equal(JOURNEY_DEMO_SAVE_KEY, 'neonCatcher.journeyDemo.v1');
  const checkpoint = createChronosVoyageCheckpoint(5, {goal: 36, collected: 16});
  const saved = new Map([
    [STORAGE_PREFIX + CHRONOS_VOYAGE_KEY, JSON.stringify(checkpoint)],
    [STORAGE_PREFIX + 'neonCatcher.flightEquipment.v1', '{"version":1,"weapon":"twin"}'],
    ['neon-best-v2', '12345']
  ]);
  const before = [...saved];
  const context = {window: {}, localStorage: {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, String(value)),
    removeItem: key => saved.delete(key)
  }};
  vm.runInNewContext(previewConfig('1'.repeat(40), false), context);
  const restored = JSON.parse(context.window.NeonPreview.storage.getItem(CHRONOS_VOYAGE_KEY));
  const voyage = createChronosVoyage({goal: 36, checkpoint: restored});
  assert.equal(voyage.snapshot().stageNumber, 5);
  assert.equal(voyage.snapshot().collected, 16);
  assert.deepEqual([...saved], before, 'Opening the new name must neither migrate nor delete old data');
  assert.equal(context.window.NeonPreview.storage.getItem('neonCatcher.flightEquipment.v1'), before[1][1]);
});

test('ordinary PWA gets a fresh branded cache and active art documentation resolves after the filename change', async () => {
  assert.match(await text('sw.js'), /^const CACHE = "neon-cronium-pre-release-7-2-0-pursuit-1";/);
  assert.match(await text('docs/PRODUCT_VISION.md'), /ART_DIRECTION_NEON_CRONIUM\.md/);
  assert.match(await text('ART_DIRECTION_NEON_CRONIUM.md'), /# NEON CRONIUM/);
  for (const path of ['ASSET_MANIFEST.json', 'ASSET_PRODUCTION_150.json']) assert.equal(JSON.parse(await text(path)).project, 'NEON CRONIUM');
});
