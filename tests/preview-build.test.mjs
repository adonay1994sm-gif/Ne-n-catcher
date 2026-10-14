import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {PREVIEW_BRANCH, STORAGE_PREFIX, previewGame, previewWorker, previewConfig, previewPage} from '../scripts/build-preview.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'preview-dist');
const text = file => readFile(join(root, file), 'utf8');
const sha256 = value => createHash('sha256').update(value).digest('hex');

// Tests named "unit:" do not require or create build output.
test('unit: isolated storage never reads, overwrites or removes normal campaign keys', () => {
  const data = new Map([['neon-unlocked-v2', '8'], ['neon-n7-unlocked-v1', '42'], ['neon-settings-v5', '{"music":12}']]);
  const storage = {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key)};
  const context = {window: {}, localStorage: storage};
  vm.runInNewContext(previewConfig('a'.repeat(40), true), context);
  const isolated = context.window.NeonPreview.storage;
  assert.equal(isolated.getItem('neon-unlocked-v2'), null);
  assert.equal(isolated.getItem('neon-n7-unlocked-v1'), null);
  isolated.setItem('neon-n7-unlocked-v1', '100');
  isolated.setItem('neon-unlocked-v2', '2');
  isolated.setItem('neon-settings-v5', '{}');
  isolated.removeItem('neon-unlocked-v2');
  assert.equal(data.get('neon-n7-unlocked-v1'), '42');
  assert.equal(data.get('neon-unlocked-v2'), '8');
  assert.equal(data.get('neon-settings-v5'), '{"music":12}');
  assert.equal(data.get(`${STORAGE_PREFIX}neon-n7-unlocked-v1`), '100');
  assert.equal(context.window.NeonPreview.dirty, true);
});

test('unit: preview transforms require the actual game markers and preserve ordinary input', async () => {
  const source = await text('game.js');
  const html = await text('index.html');
  const transformed = previewGame(source);
  assert.match(transformed, /createStorageService\(window\.NeonPreview\.storage\)/);
  assert.doesNotMatch(transformed, /VER ANUNCIO Y REPARAR/);
  assert.equal(source, await text('game.js'));
  assert.match(previewPage(html), /preview-config\.js/);
  assert.match(previewPage(html), /PRUEBA EXPERIMENTAL/);
  assert.equal(html, await text('index.html'));
  assert.throws(() => previewGame('unexpected source'), /exactly one marker/);
  assert.throws(() => previewPage('unexpected source'), /exactly one marker/);
});

test('unit: launcher unlock affects only preview N-7 and reports blocked storage', async () => {
  const html = await text('preview/launcher.html');
  const dom = new JSDOM(html, {url: 'https://preview.test/', runScripts: 'dangerously'});
  try {
    const {window} = dom;
    window.localStorage.setItem('neon-n7-unlocked-v1', '42');
    window.localStorage.setItem('neon-unlocked-v2', '7');
    window.document.getElementById('unlock').checked = true;
    // Avoid navigation in this DOM-only test; the actual listener still runs.
    const link = window.document.getElementById('n7link');
    const click = () => link.dispatchEvent(new window.Event('click', {cancelable: true}));
    assert.equal(click(), true);
    assert.equal(window.localStorage.getItem(`${STORAGE_PREFIX}neon-n7-unlocked-v1`), '100');
    assert.equal(window.localStorage.getItem('neon-n7-unlocked-v1'), '42');
    assert.equal(window.localStorage.getItem('neon-unlocked-v2'), '7');
    Object.defineProperty(window, 'localStorage', {get() {throw new Error('blocked');}});
    assert.equal(click(), false);
    assert.match(window.document.getElementById('storageStatus').textContent, /bloquea el guardado/);
  } finally {dom.window.close();}
});

function workerHarness(source, revision) {
  const scope = 'https://preview.test/juego/';
  const prefix = `neon-preview-v1:${scope}::`;
  const deleted = [], matches = [], handlers = {};
  const names = ['neon-catcher-pre-release-7-2-0', 'unrelated-app', `${prefix}old`, `${prefix}${revision}`, `neon-preview-v1:${scope}child/::old`];
  const sandbox = {
    URL,
    self: {registration: {scope}, location: {origin: 'https://preview.test'},
      addEventListener: (name, callback) => {handlers[name] = callback;}, skipWaiting() {}, clients: {claim() {}}},
    caches: {keys: async () => names, delete: async name => {deleted.push(name);},
      match() {throw new Error('Origin-wide cache lookup forbidden');},
      open: async name => ({match: async request => {matches.push({name, request}); return typeof request === 'string' ? 'scoped-index' : undefined;}, addAll: async () => {}})},
    fetch: async () => {throw new Error('offline');}
  };
  vm.runInNewContext(previewWorker(source, revision), sandbox);
  return {handlers, deleted, matches, prefix, scope};
}

test('unit: preview worker preserves foreign caches and nested-scope caches', async () => {
  const revision = 'a'.repeat(64);
  const worker = workerHarness(await text('sw.js'), revision);
  let activation;
  worker.handlers.activate({waitUntil: promise => {activation = promise;}});
  await activation;
  assert.deepEqual(worker.deleted, [`${worker.prefix}old`]);
});

test('unit: offline navigation uses only the scoped cache and ignores foreign paths', async () => {
  const worker = workerHarness(await text('sw.js'), 'b'.repeat(64));
  let response;
  worker.handlers.fetch({request: {method: 'GET', mode: 'navigate', url: `${worker.scope}index.html?campaign=n7`}, respondWith: value => {response = value;}});
  assert.equal(await response, 'scoped-index');
  assert.equal(worker.matches.at(-1).request, `${worker.scope}index.html`);
  assert.ok(worker.matches.every(item => item.name.startsWith(worker.prefix)));
  worker.handlers.fetch({request: {method: 'GET', url: 'https://preview.test/index.html'}, respondWith() {assert.fail('Foreign path must not be intercepted');}});
});

test('unit: Netlify opt-in cannot authorize main or PR deploy contexts', () => {
  const script = join(root, 'scripts/netlify-preview-gate.mjs');
  const run = (mode, flag, branch = PREVIEW_BRANCH, context = 'branch-deploy') => spawnSync(process.execPath, [script, mode], {
    encoding: 'utf8', env: {...process.env, NEON_PREVIEW_DEPLOY: flag, BRANCH: branch, CONTEXT: context}
  });
  assert.equal(run('--ignore', '').status, 0);
  assert.equal(run('--require-enabled', '').status, 1);
  assert.equal(run('--ignore', '1').status, 1);
  assert.equal(run('--require-enabled', '1').status, 0);
  for (const [branch, context] of [['main', 'production'], ['main', 'branch-deploy'], [PREVIEW_BRANCH, 'production'], [PREVIEW_BRANCH, 'deploy-preview']]) {
    assert.equal(run('--require-enabled', '1', branch, context).status, 1, `${branch}/${context}`);
    assert.equal(run('--ignore', '1', branch, context).status, 0, `${branch}/${context}`);
  }
  assert.equal(run('--unknown', '1').status, 2);
});

test('built launcher presents both modes and all paths resolve within the preview package', async () => {
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  assert.match(html, /href="juego\/index\.html\?campaign=n7"/);
  assert.match(html, /href="juego\/index\.html"/);
  assert.match(html, /juego\/assets\/ship_frame_01\.webp/);
  assert.match(html, /neon-preview-v1:neon-n7-unlocked-v1/);
  assert.doesNotMatch(html, /__NEON_PREVIEW_/);
  for (const name of ['index.html', 'game.js', 'core-runtime.js', 'content-runtime.js', 'preview-config.js', 'sw.js', 'assets/ship_frame_01.webp']) {
    assert.ok((await stat(join(dist, 'juego', name))).size > 0, name);
  }
  const page = await readFile(join(dist, 'juego/index.html'), 'utf8');
  for (const [, path] of page.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^" ]*)?"/g)) {
    if (/^https?:/.test(path)) assert.fail(`External preview dependency: ${path}`);
    else assert.ok((await stat(join(dist, 'juego', path))).isFile(), path);
  }
});

test('preview preserves core, content and every original asset byte for byte', async () => {
  for (const file of ['core-runtime.js', 'content-runtime.js', 'styles.css', ...(await readdir(join(root, 'www/assets'))).map(name => `assets/${name}`)]) {
    assert.deepEqual(await readFile(join(root, 'www', file)), await readFile(join(dist, 'juego', file)), file);
  }
});

test('preview-only transforms do not change the default web root or native game', async () => {
  const source = await readFile(join(root, 'www/game.js'), 'utf8');
  const ordinaryPage = await readFile(join(root, 'www/index.html'), 'utf8');
  assert.doesNotMatch(ordinaryPage, /preview-config|PRUEBA EXPERIMENTAL/);
  assert.doesNotMatch(source, /window\.NeonPreview/);
  assert.equal(source, await readFile(join(root, 'ios/App/App/public/game.js'), 'utf8'));
  assert.equal(await readFile(join(dist, 'juego/game.js'), 'utf8'), previewGame(source));
  assert.equal(await readFile(join(dist, 'juego/index.html'), 'utf8'), previewPage(ordinaryPage));
});

test('preview cannot initialize native ads or make real payments', async () => {
  const context = {window: {}};
  vm.runInNewContext(await readFile(join(dist, 'juego/ads-config.js'), 'utf8'), context);
  vm.runInNewContext(await readFile(join(dist, 'juego/native-admob.js'), 'utf8'), context);
  assert.equal(context.window.MONETIZATION_CONFIG.web.enabled, false);
  assert.equal(context.window.MONETIZATION_CONFIG.native.enabled, false);
  assert.equal(context.window.NeonNativeAds.isAvailable(), false);
  const headers = await readFile(join(dist, '_headers'), 'utf8');
  assert.match(headers, /payment=\(\)/);
  assert.match(headers, /connect-src 'self'/);
  assert.match(headers, /Cache-Control: no-cache, no-store/);
});

test('build provenance records exact commit, source tree and every emitted byte', async () => {
  const info = JSON.parse(await readFile(join(dist, 'build-info.json'), 'utf8'));
  assert.match(info.commit, /^[a-f0-9]{40}$/);
  assert.match(info.sourceTree, /^[a-f0-9]{40}$/);
  assert.match(info.trackedDiffSha256, /^[a-f0-9]{64}$/);
  assert.equal(typeof info.dirty, 'boolean');
  assert.equal(info.branch, PREVIEW_BRANCH);
  assert.equal(info.storagePrefix, STORAGE_PREFIX);
  assert.equal(info.engineV1, false);
  assert.equal(info.realAds, false);
  assert.equal(info.realPayments, false);
  for (const [path, expected] of Object.entries(info.files)) {
    const actual = await readFile(join(dist, path));
    assert.equal(actual.length, expected.bytes, path);
    assert.equal(sha256(actual), expected.sha256, path);
  }
  for (const [path, expected] of Object.entries(info.sourceFiles)) {
    assert.equal(sha256(await readFile(join(root, path))), expected, path);
  }
  const context = {window: {}};
  vm.runInNewContext(await readFile(join(dist, 'juego/preview-config.js'), 'utf8'), context);
  assert.equal(context.window.NeonPreview.commit, info.commit);
  assert.equal(context.window.NeonPreview.dirty, info.dirty);
  assert.ok((await readFile(join(dist, 'index.html'), 'utf8')).includes(info.commit));
});
