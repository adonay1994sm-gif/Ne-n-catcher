import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtemp, mkdir, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {auditRepository} from '../scripts/repository-hygiene.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'neon-hygiene-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  const git = (...args) => execFileSync('git', args, {cwd: root, stdio: 'pipe'}).toString();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  await mkdir(join(root, 'assets')); await mkdir(join(root, 'art-source')); await mkdir(join(root, 'docs/production-reports/evidence'), {recursive: true});
  const bytes = Buffer.alloc(270000, 9);
  await writeFile(join(root, 'assets/atlas.webp'), bytes);
  await writeFile(join(root, 'art-source/master.webp'), bytes);
  await writeFile(join(root, 'docs/production-reports/evidence/history.txt'), 'retain evidence\n');
  await writeFile(join(root, '.gitignore'), 'preview-dist/\n');
  await symlink('/path-that-must-not-be-read', join(root, 'outside-link'));
  git('add', '.'); git('commit', '-qm', 'fixture');
  await mkdir(join(root, 'preview-dist')); await writeFile(join(root, 'preview-dist/build-info.json'), '{}');
  return {root, git};
}

test('read-only audit preserves tracked bytes, evidence, index and ignored build outputs', async t => {
  const {root, git} = await fixture(t); const before = git('status', '--porcelain');
  const report = await auditRepository(root);
  assert.equal(report.mode, 'read-only'); assert.equal(report.policy.deletions, 0); assert.equal(report.policy.writes, 0);
  assert.equal(report.groups['runtime-assets'].files, 1); assert.equal(report.groups['art-masters'].files, 1); assert.equal(report.groups['historical-evidence'].files, 1);
  assert.deepEqual(report.tracked.symlinks, ['outside-link']); assert.equal(report.localOutputs[0].path, 'preview-dist'); assert.equal(report.localOutputs[0].ignored, true);
  assert.equal(report.duplicateScan.enabled, false); assert.equal(git('status', '--porcelain'), before);
  assert.equal(await readFile(join(root, 'docs/production-reports/evidence/history.txt'), 'utf8'), 'retain evidence\n');
});

test('duplicate scan identifies identical masters but explicitly retains them', async t => {
  const {root, git} = await fixture(t); const report = await auditRepository(root, {duplicates: true});
  assert.equal(report.duplicateScan.groups.length, 1);
  assert.deepEqual(report.duplicateScan.groups[0].paths.sort(), ['art-source/master.webp', 'assets/atlas.webp']);
  assert.match(report.duplicateScan.groups[0].action, /^retain-history/); assert.equal(git('status', '--porcelain'), '');
});

test('CLI rejects destructive flags and refuses to overwrite an explicit output', async t => {
  const {root, git} = await fixture(t); const script = resolve('scripts/repository-hygiene.mjs');
  const forbidden = spawnSync(process.execPath, [script, '--root', root, '--delete'], {encoding: 'utf8'});
  assert.equal(forbidden.status, 1); assert.match(forbidden.stderr, /Unknown argument/);
  const output = join(root, 'new-report.json');
  const first = spawnSync(process.execPath, [script, '--root', root, '--output', output], {encoding: 'utf8'}); assert.equal(first.status, 0);
  const original = await readFile(output, 'utf8');
  const second = spawnSync(process.execPath, [script, '--root', root, '--output', output], {encoding: 'utf8'}); assert.equal(second.status, 1); assert.match(second.stderr, /EEXIST/);
  assert.equal(await readFile(output, 'utf8'), original); assert.match(git('status', '--porcelain'), /new-report\.json/);
});

test('CLI rejects writing a report into git metadata', async t => {
  const {root, git} = await fixture(t); const result = spawnSync(process.execPath, [resolve('scripts/repository-hygiene.mjs'), '--root', root, '--output', join(root, '.git/hygiene.json')], {encoding: 'utf8'});
  assert.equal(result.status, 1); assert.match(result.stderr, /inside \.git is forbidden/); assert.equal(git('status', '--porcelain'), '');
});

test('audit identifies already-tracked generated copies without removing them', async t => {
  const {root, git} = await fixture(t);
  await mkdir(join(root, 'www')); await writeFile(join(root, 'www/game.js'), 'historical generated copy');
  git('add', 'www/game.js'); git('commit', '-qm', 'tracked generated fixture');
  const report = await auditRepository(root);
  assert.equal(report.trackedGeneratedOutputs.files, 1);
  assert.deepEqual(report.trackedGeneratedOutputs.paths, ['www/game.js']);
  assert.equal(await readFile(join(root, 'www/game.js'), 'utf8'), 'historical generated copy');
  assert.equal(git('status', '--porcelain'), '');
});

test('CLI rejects a symlinked path into git metadata', async t => {
  const {root} = await fixture(t); await symlink(join(root, '.git'), join(root, 'git-alias'));
  const result = spawnSync(process.execPath, [resolve('scripts/repository-hygiene.mjs'), '--root', root, '--output', join(root, 'git-alias/hygiene.json')], {encoding: 'utf8'});
  assert.equal(result.status, 1); assert.match(result.stderr, /inside \.git is forbidden/);
});
