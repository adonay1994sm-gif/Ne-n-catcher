/** Build an opt-in Netlify browser test package without replacing production www. */
import {cp, mkdir, readFile, rm, stat} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'www');
const output = join(root, 'preview-dist');
const landing = join(root, 'preview', 'launcher.html');

for (const file of ['index.html','game.js','content-runtime.js','core-runtime.js','sw.js','assets/ship_frame_01.webp']) {
  const info = await stat(join(source,file));
  if (!info.isFile() || info.size === 0) throw new Error(`Preview source is missing or empty: ${file}`);
}
const page = await readFile(landing,'utf8');
if (!page.includes('juego/index.html?campaign=n7') || !page.includes('juego/index.html')) {
  throw new Error('Preview launcher must retain both N-7 and classic links');
}
await rm(output, {recursive:true, force:true});
await mkdir(join(output, 'juego'), {recursive:true});
await cp(source, join(output, 'juego'), {recursive:true});
await cp(landing, join(output, 'index.html'));
// Netlify reads _headers only at publish root, not in the copied /juego folder.
await cp(join(source,'_headers'), join(output,'_headers'));
console.log('[Neon Catcher] preview-dist listo: selector en / y juego íntegro en /juego/; no despliegue realizado');
