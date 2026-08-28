import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modulesDirectory = join(root, "src", "game");
const outputFile = join(root, "game.js");

export async function buildGameBundle() {
  const moduleFiles = (await readdir(modulesDirectory))
    .filter((name) => /^\d{2}-[a-z0-9-]+\.js$/i.test(name))
    .sort();

  if (moduleFiles.length !== 9) {
    throw new Error(`Se esperaban 9 módulos de juego y se encontraron ${moduleFiles.length}.`);
  }

  const chunks = await Promise.all(
    moduleFiles.map((name) => readFile(join(modulesDirectory, name), "utf8"))
  );
  const bundle = chunks.join("");

  if (!bundle.startsWith("(() => {\n  \"use strict\";")) {
    throw new Error("El primer módulo no abre correctamente el ámbito protegido del juego.");
  }
  if (!bundle.endsWith("})();\n")) {
    throw new Error("El último módulo no cierra correctamente el ámbito protegido del juego.");
  }

  await writeFile(outputFile, bundle, "utf8");
  return { moduleFiles, bytes: Buffer.byteLength(bundle) };
}
