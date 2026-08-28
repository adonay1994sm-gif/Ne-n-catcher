import { access, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const output=join(root,"native-admob.js");
try {
  const { build } = await import("esbuild");
  await build({ entryPoints:[join(root,"src/native-admob-entry.js")], bundle:true, minify:true, format:"iife", platform:"browser", target:["safari15"], outfile:output, legalComments:"none" });
  console.log("[Neon Catcher] native-admob.js recompilado con esbuild");
} catch (error) {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
  await access(output);
  const info=await stat(output);
  if (info.size < 1000) throw new Error("native-admob.js existente no es válido");
  console.log("[Neon Catcher] esbuild no instalado; se conserva el puente nativo verificado incluido en el ZIP");
}
