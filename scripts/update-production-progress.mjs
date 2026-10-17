import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ledger = JSON.parse(await readFile(join(root, 'docs/production-tasks.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(root, ledger.assetTasks.catalog), 'utf8'));
const fail = (message) => { throw new Error(message); };
const safe = (value) => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const list = (items) => items.length ? items.map(safe).join('<br>') : '—';
const link = (path) => /^https?:\/\//.test(path) ? '[enlace](' + path + ')' : '[' + safe(path) + '](' + relative('docs', path) + ')';
const links = (paths) => paths.length ? paths.map(link).join('<br>') : '—';
const count = (tasks) => Object.fromEntries(ledger.states.map((state) => [state, tasks.filter((task) => task.status === state).length]));
const ratio = (tasks) => {
  const done = tasks.filter((task) => task.status === 'DONE').length;
  return done + '/' + tasks.length + ' (' + (tasks.length ? done * 100 / tasks.length : 0).toFixed(1) + '%)';
};
if (catalog.assets.length !== ledger.assetTasks.expectedCount) fail('El catálogo cambió de tamaño: revisar el alcance.');
const assetIds = new Set(catalog.assets.map((asset) => asset.id));
if (assetIds.size !== catalog.assets.length) fail('Identificadores de asset duplicados.');
for (const id of Object.keys(ledger.assetTasks.overrides)) if (!assetIds.has(id)) fail('Override desconocido: ' + id);
const assetTasks = catalog.assets.map((asset) => {
  const review = ['READY', 'IN_REVIEW', 'IMPLEMENTED_CODE'].includes(asset.status);
  const areas = ['Assets'];
  if (asset.type === 'sprite-sheet') areas.push('Animaciones');
  if (asset.category === 'enemy') areas.push('Enemigos');
  if (asset.category === 'boss') areas.push('Jefes');
  const id = 'A' + String(asset.sequence).padStart(3, '0');
  const task = {
    id, block: '05', name: asset.name + ' (' + asset.id + ')',
    priority: asset.priority, status: review ? 'IN_REVIEW' : ledger.assetTasks.defaultState,
    areas, dependencies: ['B05-02'], files: [ledger.assetTasks.catalog], commit: null, tests: [], evidence: [],
    openErrors: [review ? 'Estado ' + asset.status + ' del catálogo pendiente de los doce criterios de entrega.' : 'Maestro, exportación, integración y prueba visual final pendientes.'],
    acceptance: ledger.assetGate, ...ledger.assetTasks.overrides[asset.id]
  };
  if (task.id !== id || task.block !== '05') fail('No cambiar ID/bloque mediante override: ' + asset.id);
  return task;
});
const tasks = [...ledger.tasks, ...assetTasks];
const ids = new Set(tasks.map((task) => task.id));
if (ids.size !== tasks.length) fail('IDs de tarea duplicados.');
for (const task of tasks) {
  if (!ledger.states.includes(task.status)) fail(task.id + ': estado no permitido.');
  for (const key of ['name', 'block', 'priority']) if (!task[key]) fail(task.id + ': falta ' + key);
  for (const key of ['areas', 'dependencies', 'files', 'tests', 'evidence', 'openErrors', 'acceptance']) {
    if (!Array.isArray(task[key])) fail(task.id + ': ' + key + ' debe ser un array.');
  }
  for (const area of task.areas) if (!ledger.areas.includes(area)) fail(task.id + ': área desconocida ' + area);
  for (const dependency of task.dependencies) if (!ids.has(dependency)) fail(task.id + ': dependencia inexistente ' + dependency);
  if (!task.acceptance.length) fail(task.id + ': falta criterio de aceptación.');
  if (task.status === 'BLOCKED' && !task.openErrors.length) fail(task.id + ': bloqueo sin motivo.');
  if (task.status === 'DONE') {
    if (!/^[a-f0-9]{40}$/.test(task.commit ?? '')) fail(task.id + ': DONE exige SHA de implementación completo.');
    if (!task.tests.length || !task.evidence.length || !task.files.length || task.openErrors.length) fail(task.id + ': DONE exige archivos, pruebas, evidencia y ningún error pendiente.');
    for (const evidence of task.evidence) if (!/^https?:\/\//.test(evidence)) await readFile(join(root, evidence));
  }
}
for (const division of ledger.organization) for (const refs of Object.values(division.responsibilities)) {
  for (const id of refs) if (!ids.has(id)) fail('Organigrama referencia ID inexistente: ' + id);
}
const blocks = {
  '03': 'Prueba integrada y cierre técnico', '04': 'Jugabilidad procedural', '05': 'Producción visual y 150 assets',
  '06': 'Diez jefes', '07': 'Narrativa completa', '08': 'Audio y experiencia sensorial',
  '09': 'Rendimiento y estabilidad', '10': 'Preparación para lanzamiento'
};
const blockEntries = Object.entries(blocks).sort(([left], [right]) => Number(left) - Number(right));
const row = (cells) => '| ' + cells.join(' | ') + ' |';
const table = (entries) => [
  row(['ID', 'Nombre', 'Prioridad', 'Estado', 'Dependencias', 'Archivos', 'Commit implementación', 'Pruebas ejecutadas', 'Evidencia', 'Errores pendientes']),
  row(Array(10).fill('---')),
  ...entries.map((task) => row([task.id, safe(task.name), task.priority, task.status, list(task.dependencies), links(task.files), safe(task.commit), list(task.tests), links(task.evidence), list(task.openErrors)]))
].join('\n');
const criteria = (entries) => entries.map((task) => '- **' + task.id + ':** ' + task.acceptance.map(safe).join('; ') + '.').join('\n');
const catalogCounts = Object.entries(catalog.assets.reduce((result, asset) => {
  result[asset.status] = (result[asset.status] ?? 0) + 1;
  return result;
}, {})).map(([state, value]) => state + ': ' + value).join('; ');
const summary = (entries) => Object.entries(count(entries)).map(([state, value]) => state + ': ' + value).join(' · ');
const header = 'Fecha del registro: **' + ledger.updatedAt + '**. Rama: **' + ledger.branch + '**. Base: **' + ledger.baselineCommit + '**.';
const guide = [
  'Fuente editable: [production-tasks.json](production-tasks.json). Regenerar con **node scripts/update-production-progress.mjs**; comprobar sincronización con **node scripts/update-production-progress.mjs --check**. El script no compila, prueba ni publica el juego.',
  'Estados: **PENDING**, **IN_PROGRESS**, **BLOCKED**, **IN_REVIEW**, **DONE**. DONE exige todos los criterios, SHA de implementación, pruebas ejecutadas y evidencia; la presencia de un archivo o dato no basta. Dependencias indican orden de producción, no certificación automática. SHA y pruebas vacíos significan que no existe cierre verificado en este registro.'
].join('\n\n');
const canonical = ledger.tasks.filter(task => task.canonicalPhase);
const canonicalOverview = canonical.length ? [
  '## Mandato rector vigente — campaña espacial 10 × 10',
  'Referencia: [PRODUCT_VISION.md](PRODUCT_VISION.md). Las tablas B03–B10 y el catálogo conservan evidencia histórica y backlog; las rutas N-7 no equivalen a las nuevas etapas. El registro anterior tenía 22/267 tareas cerradas: ese cociente no mide el nuevo juego. Los cambios de denominador quedan en production-tasks.json.',
  [row(['ID / puerta', 'Entrega', 'Estado de trabajo', 'Técnica', 'Artística', 'Física']), row(Array(6).fill('---')),
    ...canonical.map(task => row([task.id + ' / ' + task.canonicalPhase, safe(task.name), task.status,
      safe(task.acceptanceStatus?.technical), safe(task.acceptanceStatus?.artistic), safe(task.acceptanceStatus?.physical)]))].join('\n'),
  'La demostración comprimida P1 anterior queda recuperable y recibió cambios solicitados por el propietario. Prioridad actual: integración de nave y experiencia natural del clásico; no expansión del prototipo. La decisión del motor y la aceptación estética permanecen reservadas al propietario. El resto de las tareas sigue siendo recuperable.'
].join('\n\n') : '';
const checklist = [
  '# NEON CATCHER — Checklist maestra de producción', header, guide,
  canonicalOverview,
  'Este registro cubre los Bloques 03–10 del mandato. Los avances históricos permanecen en [CODEX_STATUS.md](CODEX_STATUS.md) y [continuity-100/](continuity-100/); no se convierten automáticamente en cierres de los criterios más amplios de esta etapa.',
  '## Organigrama y responsabilidades',
  ...ledger.organization.map((division) => '### ' + division.division + '\n\n' + Object.entries(division.responsibilities).map(([name, refs]) => '- ' + name + ': ' + refs.join(', ') + '.').join('\n')),
  '## Resumen de estados',
  summary(tasks) + '. Total: ' + tasks.length + ' tareas.',
  ...blockEntries.map(([block, name]) => {
    const entries = ledger.tasks.filter((task) => task.block === block);
    const parts = [
      '## Bloque ' + block + ' — ' + name,
      summary(block === '05' ? [...entries, ...assetTasks] : entries) + '.',
      table(entries),
      '### Criterios verificables',
      criteria(entries)
    ];
    if (block === '05') parts.push(
      '### Entregas individuales de assets',
      'Catálogo real: **' + catalogCounts + '**. Los tamaños/fotogramas del catálogo son objetivos hasta verificarlos en archivos reales. A001–A150 son seguimiento, no archivos gráficos producidos. Los lotes cubren jugador/combate, Gaia, Vulkar, Cryon, Aether, Titan Omega, interfaz/VFX y recursos adicionales ya definidos en el catálogo.',
      'Todos los assets deben superar estos doce criterios: ' + ledger.assetGate.join('; ') + '.',
      table(assetTasks),
      'Actualizar un recurso en **assetTasks.overrides[asset.id]** con estado, archivos reales, commit, pruebas, evidencia y errores. Ningún estado READY del catálogo concede DONE en este registro.'
    );
    return parts.join('\n\n');
  }),
  '## Cómo cerrar una tarea',
  [
    '1. Comprobar todos sus criterios en el juego y guardar resultados con códigos de salida, alcance y entorno.',
    '2. Editar estado, archivos, SHA de implementación (no necesariamente el commit de documentación), pruebas y evidencia. Con un error abierto mantener IN_REVIEW o BLOCKED.',
    '3. Actualizar fecha, regenerar ambos Markdown y ejecutar --check.',
    '4. Actualizar CODEX_STATUS, CODEX_NEXT_ORDERS y el informe del bloque sin borrar registros anteriores.',
    '5. Publicar únicamente en la rama autorizada y comprobar SHA remoto.'
  ].join('\n'),
  'No modificar main/PR3, activar EngineV1, duplicar RAF, publicar producción ni distribuir App Store/TestFlight sin autorización específica.'
].join('\n\n') + '\n';
const progress = [
  '# NEON CATCHER — Progreso verificable de producción', header, guide,
  canonicalOverview,
  '## Método y alcance',
  '**' + ledger.measure + '** Cada porcentaje se refiere exclusivamente a criterios de esta checklist, no al porcentaje comercial, artístico o técnico del juego terminado. El denominador incluye trabajo futuro y queda visible; las áreas se solapan y no deben sumarse. Reorganizar el alcance cambia el denominador y debe documentarse.',
  'El registro inicial no hereda DONE de declaraciones previas. Un 0% no significa ausencia de implementación: significa que ninguna tarea completa de este mandato ha sido cerrada todavía con todos sus criterios y evidencia en este registro. El código previo se detalla en el historial.',
  '## Indicadores por área',
  [
    row(['Área', 'Verificadas / total', 'PENDING', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW']), row(Array(6).fill('---')),
    ...ledger.areas.map((area) => {
      const entries = tasks.filter((task) => task.areas.includes(area));
      const values = count(entries);
      return row([area, ratio(entries), values.PENDING, values.IN_PROGRESS, values.BLOCKED, values.IN_REVIEW]);
    })
  ].join('\n'),
  '## Indicadores por bloque',
  [
    row(['Bloque', 'Criterios cerrados / total', 'Estados']), row(Array(3).fill('---')),
    ...blockEntries.map(([block, name]) => {
      const entries = tasks.filter((task) => task.block === block);
      return row([block + ' · ' + name, ratio(entries), summary(entries)]);
    })
  ].join('\n'),
  '## Assets: catálogo frente a entrega',
  'Catálogo: **' + catalogCounts + '**; ' + catalog.assets.length + ' identificadores. Cierre de los doce requisitos: **' + ratio(assetTasks) + '**. Un PNG/WebP, prompt o definición de animación no certifica integración visual.',
  '## Evidencias históricas separadas',
  ledger.historicalEvidence.map((entry) => '- **' + entry.scope + '**, commit **' + entry.commit + '**: ' + link(entry.evidence) + '. ' + entry.note).join('\n'),
  '## Bloqueos actuales del registro',
  tasks.filter((task) => task.status === 'BLOCKED').map((task) => '- **' + task.id + ' — ' + task.name + ':** ' + task.openErrors.join(' ')).join('\n'),
  '## Orden de continuidad',
  [
    '1. Cerrar preview-dist, navegación, combate, guardados, caché y procedencia.',
    '2. Conservar paquete comprobado; resolver acceso externo Netlify sin detener tareas independientes.',
    '3. Versionar y mejorar generación/equilibrio; producir e integrar CH-01 en un lote pequeño verificable.',
    '4. Completar jefes, historia, audio, rendimiento y pruebas físicas según dependencias.'
  ].join('\n'),
  'Consultar [PRODUCTION_MASTER_CHECKLIST.md](PRODUCTION_MASTER_CHECKLIST.md) para cada ID, criterio y evidencia. Este resumen se genera del mismo registro; no debe editarse manualmente.'
].join('\n\n') + '\n';
const outputs = new Map([
  ['docs/PRODUCTION_MASTER_CHECKLIST.md', checklist],
  ['docs/PRODUCTION_PROGRESS.md', progress]
]);
const args = new Set(process.argv.slice(2));
for (const argument of args) if (!['--check', '--validate'].includes(argument)) fail('Opción no reconocida: ' + argument);
if (!args.has('--validate')) for (const [path, contents] of outputs) {
  if (args.has('--check')) {
    let actual;
    try { actual = await readFile(join(root, path), 'utf8'); } catch { fail('Falta ' + path + '; ejecutar el generador.'); }
    if (actual !== contents) fail(path + ' desactualizado; ejecutar el generador.');
  } else await writeFile(join(root, path), contents);
}
console.log(JSON.stringify({ status: 'passed', mode: args.has('--validate') ? 'validate' : args.has('--check') ? 'check' : 'write', tasks: tasks.length, assets: assetTasks.length, states: count(tasks) }));

