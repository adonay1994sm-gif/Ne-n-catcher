import { buildGameBundle } from "./game-bundle.mjs";

const result = await buildGameBundle();
console.log(`[NEON CRONIUM] game.js generado desde ${result.moduleFiles.length} módulos (${result.bytes} bytes)`);
