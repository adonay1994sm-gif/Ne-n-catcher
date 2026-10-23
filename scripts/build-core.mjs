import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["game-state.js","object-pool.js","storage-service.js","player-model.js","damage-service.js","index.js"];
const chunks=[];
for (const file of files) {
  let source=await readFile(join(root,"src/core",file),"utf8");
  source=source.replace(/^import .*;\n/gm,"").replace(/\bexport\s+/g,"");
  chunks.push(`\n// src/core/${file}\n${source.trim()}\n`);
}
const bundle=`(()=>{\n"use strict";${chunks.join("")}\n})();\n`;
await writeFile(join(root,"core-runtime.js"),bundle,"utf8");
await writeFile(join(root,"core-runtime.js.map"),JSON.stringify({version:3,file:"core-runtime.js",sources:files.map(f=>`src/core/${f}`),names:[],mappings:""}),"utf8");
console.log(`[NEON CRONIUM] core-runtime.js generado desde ${files.length} módulos ES`);
