/** Read-only repository inventory. Historical assets/evidence are never deletion candidates. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import {basename, dirname, extname, isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const runGit = (root, args) => execFileSync('git', ['--no-optional-locks', ...args], {cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});
const nulLines = text => text.split('\0').filter(Boolean);
const compact = (entries, count = 12) => entries.slice().sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path)).slice(0, count);
const categories = [
  ['runtime-assets', path => path.startsWith('assets/')],
  ['art-masters', path => path.startsWith('art-source/')],
  ['historical-evidence', path => path.startsWith('docs/production-reports/evidence/')],
  ['source', path => path.startsWith('src/')],
  ['tests-tooling', path => path.startsWith('tests/') || path.startsWith('scripts/')],
  ['reviewed-third-party', path => path.startsWith('tools/third-party/')],
  ['local-skills', path => path.startsWith('.agents/')],
  ['documentation', path => path.startsWith('docs/')],
  ['native-project', path => path.startsWith('ios/') || path.startsWith('android/')],
  ['pipeline-generated-entry', path => /^(?:game|core-runtime|content-runtime|native-admob)\.js$/.test(path)],
  ['project-root', () => true]
];
const knownLocalOutputs = ['node_modules', 'www', 'preview-dist', 'ios/App/App/public', '.netlify'];

export async function auditRepository(root, {duplicates = false} = {}) {
  root = resolve(root);
  const top = runGit(root, ['rev-parse', '--show-toplevel']).trim();
  if (resolve(top) !== root) throw new Error('Use the repository root, not a nested directory');
  const files = nulLines(runGit(root, ['ls-files', '-z']));
  const untracked = nulLines(runGit(root, ['ls-files', '--others', '--exclude-standard', '-z']));
  const entries = [];
  const missing = [];
  const symlinks = [];
  for (const path of files) {
    try {
      const info = await lstat(resolve(root, path));
      if (info.isSymbolicLink()) { symlinks.push(path); continue; }
      if (!info.isFile()) continue;
      entries.push({path, bytes: info.size, category: categories.find(([, accepts]) => accepts(path))[0]});
    } catch (error) {
      if (error.code === 'ENOENT') missing.push(path); else throw error;
    }
  }
  const groups = {};
  for (const {path, bytes, category} of entries) {
    const bucket = groups[category] ??= {files: 0, bytes: 0, largest: []};
    bucket.files++; bucket.bytes += bytes; bucket.largest.push({path, bytes});
  }
  for (const value of Object.values(groups)) value.largest = compact(value.largest, 5);
  const localOutputs = [];
  for (const path of knownLocalOutputs) {
    try {
      const info = await lstat(resolve(root, path));
      let ignored = false;
      try { runGit(root, ['check-ignore', '-q', '--', path]); ignored = true; } catch {}
      localOutputs.push({path, directory: info.isDirectory(), symlink: info.isSymbolicLink(), ignored});
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const duplicateGroups = [];
  if (duplicates) {
    const bySize = new Map();
    for (const item of entries.filter(item => item.bytes >= 256 * 1024 && /\.(?:png|webp|jpg|jpeg|wav|m4a|zip|gz)$/i.test(extname(item.path)))) {
      const group = bySize.get(item.bytes) ?? []; group.push(item); bySize.set(item.bytes, group);
    }
    for (const items of bySize.values()) {
      if (items.length < 2) continue;
      const byHash = new Map();
      for (const item of items) {
        const sha256 = createHash('sha256').update(await readFile(resolve(root, item.path))).digest('hex');
        const group = byHash.get(sha256) ?? []; group.push(item); byHash.set(sha256, group);
      }
      for (const [sha256, matches] of byHash) if (matches.length > 1) duplicateGroups.push({sha256, bytesEach: matches[0].bytes, paths: matches.map(item => item.path), action: 'retain-history; review references before any consolidation'});
    }
  }
  const sensitivePaths = files.filter(path => /(?:^|\/)(?:\.env(?:\..+)?|credentials\.json|id_rsa|id_ed25519|\.netlify\/state\.json)$/.test(path));
  const trackedGeneratedOutputs = entries.filter(item => item.path.startsWith('www/') || item.path.startsWith('ios/App/App/public/') || item.path.startsWith('preview-dist/'));
  return {
    schemaVersion: 1, generatedAt: new Date().toISOString(),
    commit: runGit(root, ['rev-parse', 'HEAD']).trim(), branch: runGit(root, ['branch', '--show-current']).trim(),
    dirty: Boolean(runGit(root, ['status', '--porcelain']).trim()), mode: 'read-only',
    tracked: {paths: files.length, regularFiles: entries.length, bytes: entries.reduce((sum, item) => sum + item.bytes, 0), missing, symlinks},
    groups, largest: compact(entries),
    localOutputs, untracked: {count: untracked.length, paths: untracked},
    duplicateScan: {enabled: duplicates, minimumBytes: 256 * 1024, groups: duplicateGroups},
    trackedGeneratedOutputs: {files: trackedGeneratedOutputs.length, bytes: trackedGeneratedOutputs.reduce((sum, item) => sum + item.bytes, 0), paths: trackedGeneratedOutputs.map(item => item.path), action: 'review exact index entries; preserve disk, source assets and Git history'},
    sensitivePathWarnings: sensitivePaths,
    policy: {deletions: 0, writes: 0, historicalEvidence: 'preserve', masters: 'preserve', generatedBundles: 'regenerate through pipeline', gitHistory: 'preserve; no reset, clean, rewrite or force push'}
  };
}

async function main(args) {
  let root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let output;
  let duplicates = false;
  for (let i = 0; i < args.length; i++) {
    const option = args[i];
    if (option === '--root' || option === '--output') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${option}`);
      if (option === '--root') root = resolve(value); else output = resolve(value);
    } else if (option === '--duplicates') duplicates = true;
    else if (option === '--help') { console.log('Usage: node scripts/repository-hygiene.mjs [--root ROOT] [--duplicates] [--output NEW_JSON_FILE]\nRead-only by default. Explicit output uses exclusive creation and never overwrites a file.'); return; }
    else throw new Error(`Unknown argument: ${option}`);
  }
  const report = await auditRepository(root, {duplicates});
  const json = JSON.stringify(report, null, 2) + '\n';
  if (output) {
    const rel = relative(root, output);
    if (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep) && (rel === '.git' || rel.startsWith('.git' + sep))) throw new Error('Output inside .git is forbidden');
    const resolvedOutput = resolve(await realpath(dirname(output)), basename(output));
    const gitDirectory = await realpath(runGit(root, ['rev-parse', '--absolute-git-dir']).trim());
    const gitRelative = relative(gitDirectory, resolvedOutput);
    if (!gitRelative || (!isAbsolute(gitRelative) && gitRelative !== '..' && !gitRelative.startsWith('..' + sep))) throw new Error('Output inside .git is forbidden');
    await writeFile(output, json, {flag: 'wx'});
    console.log(JSON.stringify({output, mode: report.mode, trackedFiles: report.tracked.regularFiles, trackedBytes: report.tracked.bytes, deletions: 0}));
  } else process.stdout.write(json);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
