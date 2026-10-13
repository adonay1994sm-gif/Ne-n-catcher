/** Netlify ignores the development branch unless a human explicitly enables its preview. */
const enabled = process.env.NEON_PREVIEW_DEPLOY === '1';
const command = process.argv[2];
if (command === '--ignore') {
  console.log(enabled ? '[Neon Catcher] Preview habilitada explícitamente' : '[Neon Catcher] Preview NO habilitada: despliegue omitido');
  process.exit(enabled ? 1 : 0); // Netlify: 0 = skip build, 1 = proceed.
}
if (command === '--require-enabled') {
  if (!enabled) {
    console.error('[Neon Catcher] Falta NEON_PREVIEW_DEPLOY=1; se rechaza el despliegue de la rama');
    process.exit(1);
  }
  console.log('[Neon Catcher] Rama de pruebas autorizada; solo genera preview-dist');
  process.exit(0);
}
console.error('Uso: netlify-preview-gate.mjs --ignore|--require-enabled');
process.exit(2);
