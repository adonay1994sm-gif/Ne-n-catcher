import {execFileSync} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
import readline from 'node:readline';

// Explicit invocation only. Credentials arrive on hidden stdin and are never stored.
const folder = '/workspace/sites/neon-catcher-pruebas';
const hidden = process.stdin.isTTY;
if (hidden) execFileSync('stty', ['-echo'], {stdio: ['inherit', 'ignore', 'ignore']});
process.stdout.write('Ready for Site workflow JSON on stdin (input is hidden).\n');
const reader = readline.createInterface({input: process.stdin, terminal: false});
reader.once('line', line => {
  reader.close(); process.stdin.pause(); let credential;
  try {
    let data;
    try { data = JSON.parse(line); } catch { throw Error('Invalid workflow JSON; input was not logged'); }
    credential = data.credential;
    if (!credential?.token || !credential?.branch || !['open', 'publish'].includes(data.mode)) throw Error('Explicit open/publish mode and Site credentials required');
    const env = {...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.extraHeader', GIT_CONFIG_VALUE_0: `Authorization: Bearer ${credential.token}`};
    const git = (...args) => execFileSync('git', args, {cwd: folder, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trimEnd();
    const manifest = JSON.parse(readFileSync(folder + '/.openai/hosting.json', 'utf8'));
    if (manifest.project_id !== 'appgprj_6ad34f65ce74819195e871d7dd99fe21' || manifest.static?.directory !== 'dist' || !existsSync(folder + '/.git')) throw Error('Existing Site identity required');
    git('check-ref-format', '--branch', credential.branch);
    if (data.mode === 'open') {
      if (git('status', '--porcelain')) throw Error('Preserve Site changes before synchronization');
      const initial = git('rev-parse', 'HEAD');
      git('fetch', 'origin', credential.branch); git('merge', '--ff-only', 'FETCH_HEAD');
      process.stdout.write(JSON.stringify({project_id: manifest.project_id, initial, head: git('rev-parse', 'HEAD'), clean: !git('status', '--porcelain')}) + '\n');
      return;
    }
    const info = JSON.parse(readFileSync(folder + '/dist/clasico-actual/build-info.json', 'utf8'));
    if (!/^[a-f0-9]{40}$/.test(data.expectedApplicationCommit || '') || info.commit !== data.expectedApplicationCommit || info.dirty !== false || info.engineV1 !== false) throw Error('Expected clean application commit required before publishing Site source');
    const allowed = new Set(['dist/index.html', 'dist/manifest.webmanifest', 'dist/build-info.json', 'dist/launcher-sw.js', 'README.md']);
    for (const entry of git('status', '--porcelain').split('\n').filter(Boolean)) {
      const path = entry.slice(3);
      if (!allowed.has(path) && !path.startsWith('dist/clasico-actual/')) throw Error('Unexpected Site change outside the package and allowed root files');
    }
    const before = git('rev-parse', 'HEAD');
    if (!git('ls-remote', 'origin', `refs/heads/${credential.branch}`).startsWith(before + '\t')) throw Error('Site changed remotely: preserve and reconcile');
    git('add', '--', ...allowed, 'dist/clasico-actual');
    git('commit', '-m', 'Publish Chronos chapter, compact ships, reinforcement and Atlas v5');
    const commit_sha = git('rev-parse', 'HEAD');
    git('push', 'origin', `HEAD:refs/heads/${credential.branch}`);
    if (!git('ls-remote', 'origin', `refs/heads/${credential.branch}`).startsWith(commit_sha + '\t')) throw Error('Source push verification failed');
    if (git('status', '--porcelain')) throw Error('Site source must be clean before packaging');
    const archive = '/tmp/neon-cronium-chapter-site.tar.gz';
    execFileSync('tar', ['-czf', archive, '.openai/hosting.json', 'dist'], {cwd: folder, stdio: 'pipe'});
    process.stdout.write(JSON.stringify({project_id: manifest.project_id, commit_sha, archive, applicationCommit: info.commit, revision: info.revision, entry: '/clasico-actual/juego/index.html', clean: true}) + '\n');
  } catch (error) {
    const message = String(error.stderr || error.message || error).replaceAll(credential?.token || 'NO_TOKEN', '[redacted]');
    process.stderr.write(message + '\n'); process.exitCode = 1;
  } finally {
    if (hidden) execFileSync('stty', ['echo'], {stdio: ['inherit', 'ignore', 'ignore']});
  }
});
