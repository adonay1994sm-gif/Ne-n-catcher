import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {previewWorker, previewLauncherWorker} from '../scripts/build-preview.mjs';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const scope = 'https://neon.test/juego/';
const oldRevision = 'a'.repeat(64), newRevision = 'b'.repeat(64);

function deferred() {
  let resolve, reject;
  const promise = new Promise((accept, decline) => { resolve = accept; reject = decline; });
  return {promise, resolve, reject};
}

/**
 * CacheStorage.delete removes a name, NOT the already acquired Cache objects.
 * A retained handle remains writable, but writing through it does not register
 * its deleted name again. Only CacheStorage.open(name) can recreate that name.
 * This distinction is essential to reproducing an old worker's late fetch.
 */
function cacheStorageFixture() {
  const names = new Map(), trace = [];
  let generation = 0;
  const key = (request, base) => new URL(typeof request === 'string' ? request : request.url, base).href;
  function cache(name) {
    const entries = new Map();
    const base = /:(https?:\/\/.*?)::/.exec(name)?.[1] || 'https://neon.test/';
    const handle = {
      generation: ++generation,
      async match(request) { return entries.get(key(request, base))?.clone(); },
      async put(request, response) {
        entries.set(key(request, base), response.clone());
        trace.push({operation: 'put', name, handle: handle.generation});
      },
      async addAll(requests) {
        for (const request of requests) await handle.put(request,
          new Response(`precache:${key(request, base)}`, {status: 200}));
      }
    };
    return handle;
  }
  return {
    trace,
    async open(name) {
      const created = !names.has(name);
      if (created) names.set(name, cache(name));
      trace.push({operation: 'open', name, created, handle: names.get(name).generation});
      return names.get(name);
    },
    async delete(name) {
      trace.push({operation: 'delete', name});
      return names.delete(name);
    },
    async keys() { return [...names.keys()]; },
    async match(request) {
      for (const handle of names.values()) {
        const response = await handle.match(request);
        if (response) return response;
      }
    }
  };
}

function worker({revision, caches, workerScope = scope, launcher = false,
  fetch = async () => new Response('network', {status: 200})}) {
  const listeners = new Map();
  const context = vm.createContext({URL, Response, Request, caches, fetch,
    self: {registration: {scope: workerScope}, location: new URL(workerScope),
      clients: {claim: async () => {}}, skipWaiting: async () => {},
      addEventListener(type, callback) { listeners.set(type, callback); }}});
  vm.runInContext(launcher ? previewLauncherWorker(revision) : previewWorker(source, revision), context);
  const {CACHE: name, CACHE_PREFIX: prefix} = vm.runInContext('({CACHE, CACHE_PREFIX})', context);
  return {
    name, prefix,
    async lifecycle(type) {
      const promises = [];
      listeners.get(type)({waitUntil(value) { promises.push(value); }});
      await Promise.all(promises);
    },
    fetch(request) {
      let answer;
      listeners.get('fetch')({request, respondWith(value) { answer = Promise.resolve(value); }});
      assert.ok(answer, 'The fixture request must actually be handled by this worker');
      return answer;
    }
  };
}

const request = (path, mode = 'same-origin') => ({url: new URL(path, scope).href, method: 'GET', mode});

async function foreignCache(caches) {
  const unrelated = await caches.open('unrelated-app');
  await unrelated.put('https://neon.test/keep', new Response('preserved'));
  return unrelated;
}

async function pendingOldRequest({launcher = false, path = 'late-code.js', mode = 'same-origin'} = {}) {
  const caches = cacheStorageFixture();
  await foreignCache(caches);
  const started = deferred(), response = deferred();
  const workerScope = launcher ? 'https://neon.test/' : scope;
  const old = worker({revision: oldRevision, caches, workerScope, launcher,
    fetch: () => { started.resolve(); return response.promise; }});
  await old.lifecycle('install'); await old.lifecycle('activate');
  const target = launcher ? {url: 'https://neon.test/index.html', method: 'GET', mode: 'navigate'} : request(path, mode);
  const answer = old.fetch(target);
  await started.promise;
  const current = worker({revision: newRevision, caches, workerScope, launcher});
  await current.lifecycle('install'); await current.lifecycle('activate');
  assert.equal((await caches.keys()).includes(old.name), false, 'New activation must first remove its own old named cache');
  assert.ok((await caches.keys()).includes(current.name));
  assert.ok((await caches.keys()).includes('unrelated-app'));
  return {caches, old, current, answer, response};
}

test('a delayed old code response cannot recreate its cache after the newer worker activates', async () => {
  const h = await pendingOldRequest();
  h.response.resolve(new Response('old response already in flight', {status: 200}));
  assert.equal(await (await h.answer).text(), 'old response already in flight');
  assert.equal((await h.caches.keys()).includes(h.old.name), false,
    `Late old networkFirst reopened a retired generation: ${JSON.stringify(h.caches.trace.slice(-8))}`);
  assert.ok((await h.caches.keys()).includes(h.current.name));
  assert.ok((await h.caches.keys()).includes('unrelated-app'));
});

test('a delayed old uncached image cannot recreate a retired game generation', async () => {
  const h = await pendingOldRequest({path: 'assets/late-sprite.webp'});
  h.response.resolve(new Response('late image', {status: 200}));
  assert.equal(await (await h.answer).text(), 'late image');
  assert.equal((await h.caches.keys()).includes(h.old.name), false,
    `Late old cacheFirst reopened a retired generation: ${JSON.stringify(h.caches.trace.slice(-8))}`);
  assert.ok((await h.caches.keys()).includes('unrelated-app'));
});

test('a failing old navigation uses its retained fallback without creating an empty old cache', async () => {
  const h = await pendingOldRequest({path: 'route-not-precached', mode: 'navigate'});
  h.response.reject(new TypeError('Fixture: network unavailable after newer activation'));
  const answer = await h.answer;
  assert.equal((await h.caches.keys()).includes(h.old.name), false,
    'Offline fallback must not reopen the retired generation after its name was deleted');
  assert.ok(answer, 'The retained old generation still has the fallback for its already-controlled page');
  assert.equal(await answer.text(), 'precache:https://neon.test/juego/index.html');
});

test('the launcher retained handle remains writable after retirement without resurrecting its name', async () => {
  const h = await pendingOldRequest({launcher: true});
  h.response.resolve(new Response('old launcher response', {status: 200}));
  assert.equal(await (await h.answer).text(), 'old launcher response');
  assert.equal((await h.caches.keys()).includes(h.old.name), false);
  assert.ok((await h.caches.keys()).includes(h.current.name));
  assert.equal(await (await h.caches.match('https://neon.test/keep')).text(), 'preserved');
});

test('activation removes only its own scope generation and preserves launcher, sibling and foreign caches', async () => {
  const caches = cacheStorageFixture();
  const otherNames = ['unrelated-app', 'neon-catcher-pre-release-7-2-0',
    `neon-preview-v1:https://neon.test/another-game/::${oldRevision}`,
    `neon-preview-launcher-v1:https://neon.test/::${oldRevision}`];
  for (const name of otherNames) await caches.open(name);
  const old = worker({revision: oldRevision, caches}); await old.lifecycle('install');
  const current = worker({revision: newRevision, caches});
  await current.lifecycle('install'); await current.lifecycle('activate');
  const names = await caches.keys();
  assert.equal(names.includes(old.name), false); assert.ok(names.includes(current.name));
  for (const name of otherNames) assert.ok(names.includes(name), `Unrelated cache was removed: ${name}`);
});

test('the VM CacheStorage fixture distinguishes retained handles from a fresh open after delete', async () => {
  const caches = cacheStorageFixture(), handle = await caches.open('fixture');
  await caches.delete('fixture'); await handle.put('/retained', new Response('retained handle'));
  assert.deepEqual(await caches.keys(), [], 'A retained Cache.put must not register its old name again');
  assert.equal(await (await handle.match('/retained')).text(), 'retained handle');
  const reopened = await caches.open('fixture');
  assert.notEqual(reopened.generation, handle.generation);
  assert.equal(await reopened.match('/retained'), undefined, 'A new named generation is a different empty cache');
});
