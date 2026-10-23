import {spawnSync} from 'node:child_process';
import {mkdirSync, openSync, closeSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Local verification only. Each invocation needs a new output directory so
// failed attempts and their exit codes cannot be overwritten by a later pass.
const root = fileURLToPath(new URL('..', import.meta.url));
if (!process.argv[2]) throw new Error('Usage: node scripts/certify-local.mjs <new-evidence-directory>');
const output = resolve(root, process.argv[2]);
const summaryPath = resolve(output, 'results.json');
if (existsSync(summaryPath)) throw new Error('Evidence already exists; choose another directory');
mkdirSync(output, {recursive: true});
const git = (...args) => spawnSync('git', args, {cwd: root, encoding: 'utf8'}).stdout.trim();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  startedAt: new Date().toISOString(), node: process.version,
  branch: git('branch', '--show-current'), head: git('rev-parse', 'HEAD'),
  workingTree: git('status', '--short'), results: []
};
const commands = [
  ['build', 'npm', ['run', 'build']],
  ['engine', 'npm', ['run', 'test:engine']],
  ['architecture', 'npm', ['run', 'test:architecture']],
  ['content-integration-assets', 'npm', ['run', 'test:content']],
  ['static', 'npm', ['run', 'test:static']],
  ['regression', 'npm', ['test']],
  ['web', 'node', ['tests/run-v7-web-tests.mjs']],
  ['experimental-render-adapter', 'node', ['--test', 'tests/campaign-adapter.test.mjs',
    'tests/neon-render-engine.test.mjs', 'tests/sprite-animator.test.mjs']],
  ['audio-lifecycle', 'node', ['--test', 'tests/audio-lifecycle.test.mjs']],
  ['visual-artpass', 'node', ['--test', 'tests/visual-artpass.test.mjs']],
  ['inventory', 'node', ['scripts/audit-asset-inventory.mjs']]
];
for (const [name, command, args] of commands) {
  const started = Date.now();
  const log = `${name}.txt`, fd = openSync(resolve(output, log), 'w');
  const child = spawnSync(command, args, {
    cwd: root, stdio: ['ignore', fd, fd], timeout: 300000,
    // Node 22 forbids --test-isolation in NODE_OPTIONS. Keep the ordinary test
    // runner defaults, matching CI, instead of injecting version-specific flags.
    env: {...process.env}
  });
  closeSync(fd);
  const result = {
    name, command: [command, ...args].join(' '), exitCode: child.status,
    signal: child.signal, error: child.error?.message || null,
    durationMs: Date.now() - started, log
  };
  report.results.push(result);
  writeFileSync(summaryPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`${name}: exit=${child.status}, ${result.durationMs}ms (${log})`);
  if (name === 'build' && child.status !== 0) break;
}
report.artifacts = Object.fromEntries(['game.js', 'core-runtime.js', 'content-runtime.js'].map(file => {
  return [file, ['.', 'www', 'ios/App/App/public'].map(directory => {
    const path = resolve(root, directory, file);
    return {directory, sha256: existsSync(path) ? sha256(readFileSync(path)) : null};
  })];
}));
report.finishedAt = new Date().toISOString();
report.ok = report.results.length === commands.length && report.results.every(result => result.exitCode === 0);
writeFileSync(summaryPath, JSON.stringify(report, null, 2) + '\n');
process.exitCode = report.ok ? 0 : 1;
