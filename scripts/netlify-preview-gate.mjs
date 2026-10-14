/** An explicit opt-in applies only to this branch; production/PR contexts fail closed. */
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const allowedBranch = 'continuity-assets-audit-20261013';
const cwd = fileURLToPath(new URL('..', import.meta.url));
let checkoutBranch = '';
try { checkoutBranch = execFileSync('git', ['branch', '--show-current'], {cwd, encoding: 'utf8'}).trim(); } catch {}
const branch = process.env.BRANCH || checkoutBranch;
const context = process.env.CONTEXT || 'local';
const permittedContext = context === 'branch-deploy' || context === 'local';
const enabled = process.env.NEON_PREVIEW_DEPLOY === '1' && branch === allowedBranch && permittedContext;
const command = process.argv[2];
if (command === '--ignore') {
  console.log(enabled ? '[Neon Catcher] Preview de rama habilitada explícitamente' : '[Neon Catcher] Preview no autorizada para esta rama/contexto: despliegue omitido');
  process.exit(enabled ? 1 : 0); // Netlify: 0 = skip build, 1 = proceed.
}
if (command === '--require-enabled') {
  if (!enabled) {
    console.error('[Neon Catcher] Se requiere NEON_PREVIEW_DEPLOY=1, rama continuity-assets-audit-20261013 y contexto branch-deploy/local');
    process.exit(1);
  }
  console.log('[Neon Catcher] Rama de pruebas autorizada; solo genera preview-dist');
  process.exit(0);
}
console.error('Uso: netlify-preview-gate.mjs --ignore|--require-enabled');
process.exit(2);
