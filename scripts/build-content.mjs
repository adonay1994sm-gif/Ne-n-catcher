import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ['src/game/progression/legacy-content-entry.js'],
  outfile: 'content-runtime.js',
  bundle: true, format: 'iife', globalName: 'NeonCampaign',
  target: ['safari15'], sourcemap: true, legalComments: 'none'
});
console.log('[Neon Catcher] content-runtime.js: deterministic campaign modules; no RAF owner.');
