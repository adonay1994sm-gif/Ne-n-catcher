import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildGameBundle } from "./game-bundle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "www");
const iosPublic = join(root, "ios", "App", "App", "public");
const webOnlyFiles = ["_headers"];
const publicFiles = [
  "index.html",
  "styles.css",
  "core-runtime.js",
  "core-runtime.js.map",
  "game.js",
  "ads-config.js",
  "ad-bridge.js",
  "analytics-manager.js",
  "native-admob.js",
  "manifest.webmanifest",
  "privacy.html",
  "terms.html",
  "sw.js"
];

const bundle = await buildGameBundle();
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) {
  await cp(join(root, file), join(output, file));
}
for (const file of webOnlyFiles) {
  await cp(join(root, file), join(output, file));
}
await cp(join(root, "assets"), join(output, "assets"), { recursive: true });

await rm(iosPublic, { recursive: true, force: true });
await mkdir(iosPublic, { recursive: true });
for (const file of publicFiles) {
  await cp(join(root, file), join(iosPublic, file));
}
await cp(join(root, "assets"), join(iosPublic, "assets"), { recursive: true });

console.log(`[Neon Catcher] game.js: ${bundle.moduleFiles.length} módulos; paquete web limpio: ${publicFiles.length + webOnlyFiles.length} archivos + assets`);
