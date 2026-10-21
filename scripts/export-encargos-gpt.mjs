#!/usr/bin/env node
// Convierte las tareas del tablero (una carpeta de JSON, una por tarea, como
// las guarda ArtifactData con out_dir) en la lista pública de encargos para
// GPT: docs/art/ENCARGOS_GPT.md y docs/art/encargos-gpt.json. GPT no puede
// entrar al tablero (es privado de Claude); estos archivos están en el
// repositorio público y los lee por su URL «raw» de GitHub.
//
// Uso: node scripts/export-encargos-gpt.mjs <carpeta-con-las-tareas>
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const folder = process.argv[2];
if (!folder) throw new Error('Uso: node scripts/export-encargos-gpt.mjs <carpeta-con-las-tareas>');
const BAUL = 'https://neon-cronium-video-referencia.chictide18.chatgpt.site';
const RAW = 'https://raw.githubusercontent.com/adonay1994sm-gif/Ne-n-catcher/continuity-assets-audit-20261013/docs/art';

const tasks = [];
for (const name of (await readdir(folder)).filter(file => file.endsWith('.json')).sort()) {
  const doc = JSON.parse(await readFile(join(folder, name), 'utf8'));
  const data = doc.data || doc;
  if (data.prompt && data.estado !== 'hecho') tasks.push({id: doc.id || name.replace(/\.json$/, ''), ...data});
}
tasks.sort((a, b) => (a.prioridad || 2) - (b.prioridad || 2) || a.id.localeCompare(b.id));

const encargos = tasks.map(task => ({
  id: task.id, titulo: task.titulo, prioridad: task.prioridad || 2,
  archivo: `encargo-${task.id}-v1.png`, prompt: task.prompt, nota: task.nota || ''
}));
const updated = new Date().toISOString().slice(0, 10);

await writeFile(join('docs/art', 'encargos-gpt.json'), JSON.stringify({
  proyecto: 'NEON CRONIUM', actualizado: updated, baul: BAUL,
  instrucciones: 'Genera cada encargo por orden de prioridad (1 primero), súbelo al baúl con el nombre de "archivo" en la carpeta encargos/ y añádelo a catalog.json con el campo "encargo" igual a su id. Si un encargo pide varias imágenes, numéralas: encargo-<id>-v1-1.png, -2.png… No cambies medidas, rejilla ni el fondo que pide cada prompt.',
  encargos
}, null, 2) + '\n');

const md = [`# Encargos de arte para GPT · NEON CRONIUM`, '',
  `Actualizado: ${updated}. Lista pública que Claude mantiene al día desde el tablero del proyecto.`,
  `Versión para máquinas: ${RAW}/encargos-gpt.json`, '',
  '## Cómo trabajar', '',
  '1. Haz los encargos por orden: prioridad 1 primero.',
  `2. Sube cada resultado al baúl (${BAUL}) en la carpeta \`encargos/\` con el nombre indicado en «Archivo».`,
  '3. Añádelo a `catalog.json` con el campo `"encargo"` igual al id del encargo.',
  '4. Si pide varias imágenes, numéralas: `encargo-<id>-v1-1.png`, `-2.png`…',
  '5. Respeta medidas, rejilla y fondo (transparente salvo que el prompt pida opaco): el juego recorta las celdas por tamaño exacto.', ''];
for (const item of encargos) {
  md.push(`## ${item.titulo}`, '', `- **Id:** \`${item.id}\` · **Prioridad:** ${item.prioridad} · **Archivo:** \`${item.archivo}\``);
  if (item.nota) md.push(`- **Para qué:** ${item.nota}`);
  md.push('', '```text', item.prompt, '```', '');
}
if (!encargos.length) md.push('No hay encargos pendientes.', '');
await writeFile(join('docs/art', 'ENCARGOS_GPT.md'), md.join('\n'));
console.log(`${encargos.length} encargos → docs/art/ENCARGOS_GPT.md y docs/art/encargos-gpt.json`);
