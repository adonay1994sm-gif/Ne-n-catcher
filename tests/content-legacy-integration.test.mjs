import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const [html, content] = await Promise.all(
  ['index.html', 'content-runtime.js'].map(path => readFile(new URL(path, root), 'utf8'))
);

test('content is packaged before the campaign and adds no RAF owner or Engine V1 import', async () => {
  assert.ok(html.indexOf('core-runtime.js') < html.indexOf('content-runtime.js'));
  assert.ok(html.indexOf('content-runtime.js') < html.indexOf('game.js'));
  assert.doesNotMatch(content, /requestAnimationFrame|EngineCore|CampaignAdapter/);
  for (const target of ['www/content-runtime.js', 'ios/App/App/public/content-runtime.js']) {
    assert.equal(await readFile(new URL(target, root), 'utf8'), content);
  }
});
