/** Preview opt-in is branch-bound; production is allowed only on the named isolated test site. */
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const allowedBranch = 'continuity-assets-audit-20261013';
const isolatedTestSite = 'neon-preview-deploy';
const isolatedTestHost = 'neon-preview-deploy.netlify.app';
const cwd = fileURLToPath(new URL('..', import.meta.url));
let checkoutBranch = '';
try { checkoutBranch = execFileSync('git', ['branch', '--show-current'], {cwd, encoding: 'utf8'}).trim(); } catch {}
const branch = process.env.BRANCH || checkoutBranch;
const context = process.env.CONTEXT || 'local';
let isolatedTestIdentity = false;
try {
  const siteUrl = new URL(process.env.URL || '');
  isolatedTestIdentity = process.env.NETLIFY === 'true' && process.env.SITE_NAME === isolatedTestSite
    && siteUrl.protocol === 'https:' && siteUrl.hostname === isolatedTestHost
    && !siteUrl.port && !siteUrl.username && !siteUrl.password;
} catch {}
// Netlify calls the default deployment of a separate test project "production".
// This exception never authorizes the original site, another host, main or a PR.
const permittedContext = context === 'branch-deploy' || context === 'local'
  || (context === 'production' && isolatedTestIdentity);
const errors = [];
if (process.env.NEON_PREVIEW_DEPLOY !== '1') errors.push('Falta NEON_PREVIEW_DEPLOY=1 en el contexto de este despliegue');
if (branch !== allowedBranch) errors.push(`Rama no autorizada: se requiere ${allowedBranch}`);
if (!permittedContext) errors.push(`Contexto no autorizado: usar branch-deploy/local o el proyecto aislado ${isolatedTestSite} con su identidad Netlify verificada`);
const enabled = errors.length === 0;
const command = process.argv[2];
if (command === '--ignore') {
  console.log(enabled ? '[NEON CRONIUM] Preview de rama habilitada explícitamente' : '[NEON CRONIUM] Preview no autorizada para esta rama/contexto: despliegue omitido');
  process.exit(enabled ? 1 : 0); // Netlify: 0 = skip build, 1 = proceed.
}
if (command === '--require-enabled') {
  if (!enabled) {
    for (const error of errors) console.error(`[NEON CRONIUM] ${error}`);
    process.exit(1);
  }
  console.log(`[NEON CRONIUM] ${context === 'production' ? `Proyecto aislado ${isolatedTestSite}` : 'Rama de pruebas'} autorizado; solo genera preview-dist`);
  process.exit(0);
}
console.error('Uso: netlify-preview-gate.mjs --ignore|--require-enabled');
process.exit(2);
