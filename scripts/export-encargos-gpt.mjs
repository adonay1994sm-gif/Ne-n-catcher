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
const OUT = new URL('../docs/art/', import.meta.url);
const RAW = 'https://raw.githubusercontent.com/adonay1994sm-gif/Ne-n-catcher/claude/preparar-publicacion-rtfl9q/docs/art';

const tasks = [];
for (const name of (await readdir(folder)).filter(file => file.endsWith('.json')).sort()) {
  const doc = JSON.parse(await readFile(join(folder, name), 'utf8'));
  const data = doc.data || doc;
  // Fuera: lo hecho y lo que ya tiene el arte entregado (falta solo el código).
  if (data.prompt && data.estado !== 'hecho' && data.arteRecibido !== true) tasks.push({...data, id: String(doc.id || name.replace(/\.json$/, ''))});
}
tasks.sort((a, b) => (Number(a.prioridad) || 2) - (Number(b.prioridad) || 2) || a.id.localeCompare(b.id));

const oneLine = text => String(text).replace(/\s*[\r\n]+\s*/g, ' ');
const encargos = tasks.map(task => ({
  id: task.id, titulo: oneLine(task.titulo || task.id), prioridad: Number(task.prioridad) || 2,
  archivo: `encargo-${task.id}-v1.png`, prompt: String(task.prompt), nota: oneLine(task.nota || '')
}));
const updated = new Date().toISOString().slice(0, 10);

await writeFile(new URL('encargos-gpt.json', OUT), JSON.stringify({
  proyecto: 'NEON CRONIUM', actualizado: updated, baul: BAUL,
  instrucciones: 'Antes de nada lee GUIA_GPT.md (misma carpeta): explica el juego, los modelos de referencia y las reglas. Genera cada encargo por orden de prioridad (1 primero), súbelo al baúl con el nombre de "archivo" en la carpeta encargos/ y añádelo a catalog.json con el campo "encargo" igual a su id. Si un encargo pide varias imágenes, numéralas: encargo-<id>-v1-1.png, -2.png… No cambies medidas, rejilla ni el fondo que pide cada prompt. Revisa esta lista cada 10 minutos y no repitas un encargo que ya esté en catalog.json del baúl.',
  encargos
}, null, 2) + '\n');

const md = [`# Encargos de arte para GPT · NEON CRONIUM`, '',
  `Actualizado: ${updated}. Lista pública que Claude mantiene al día desde el tablero del proyecto.`,
  `Versión para máquinas: ${RAW}/encargos-gpt.json`, '',
  `**Antes de nada lee la guía:** ${RAW}/GUIA_GPT.md (qué es el juego, modelos de referencia y reglas).`, '',
  '## Cómo trabajar', '',
  '1. Haz los encargos por orden: prioridad 1 primero.',
  `2. Sube cada resultado al baúl (${BAUL}) en la carpeta \`encargos/\` con el nombre indicado en «Archivo».`,
  '3. Añádelo a `catalog.json` con el campo `"encargo"` igual al id del encargo.',
  '4. Si pide varias imágenes, numéralas: `encargo-<id>-v1-1.png`, `-2.png`…',
  '5. Respeta medidas, rejilla y fondo (transparente salvo que el prompt pida opaco): el juego recorta las celdas por tamaño exacto.',
  '6. Revisa esta lista cada 10 minutos. Antes de empezar un encargo, mira `catalog.json` del baúl: si ya hay un archivo con su id en `"encargo"`, no lo repitas.', ''];
for (const item of encargos) {
  md.push(`## ${item.titulo}`, '', `- **Id:** \`${item.id}\` · **Prioridad:** ${item.prioridad} · **Archivo:** \`${item.archivo}\``);
  if (item.nota) md.push(`- **Para qué:** ${item.nota}`);
  // Valla más larga que cualquier serie de ` del prompt, para que no cierre el bloque.
  const fence = '`'.repeat(Math.max(3, ...(item.prompt.match(/`+/g) || []).map(run => run.length + 1)));
  md.push('', fence + 'text', item.prompt, fence, '');
}
if (!encargos.length) md.push('No hay encargos pendientes.', '');
await writeFile(new URL('ENCARGOS_GPT.md', OUT), md.join('\n'));
console.log(`${encargos.length} encargos → docs/art/ENCARGOS_GPT.md y docs/art/encargos-gpt.json`);
