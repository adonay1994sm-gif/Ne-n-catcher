import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log(`PASS ${String(passed).padStart(2,"0")} · ${name}`); }
const text = (path) => readFile(join(root,path),"utf8");
await test("núcleo ES compilado y cargado antes del juego", async()=>{
  const html=await text("index.html");
  assert.ok(html.indexOf("core-runtime.js") < html.indexOf("game.js"));
  new vm.Script(await text("core-runtime.js"));
});
await test("estado central integrado", async()=>{
  const source=(await text("game.js"));
  assert.match(source,/createGameState/);
  assert.match(source,/function setState/);
  assert.doesNotMatch(source,/^\s*state = "(?:menu|briefing|playing|paused|destroying|gameover|complete)";/m);
});
await test("daño resuelto por servicio aislado", async()=>{
  assert.match(await text("game.js"),/NeonCore\.resolveDamage/);
});
await test("partículas reutilizadas mediante object pool", async()=>{
  const source=await text("game.js");
  assert.match(source,/createObjectPool/);
  assert.match(source,/particlePool\.acquire/);
  assert.match(source,/particlePool\.release/);
});
await test("geometría del jugador separada del runtime", async()=>{
  const source=await text("game.js");
  assert.match(source,/createPlayerModel/);
  assert.match(source,/PLAYER_GEOMETRY\.collisionHalfWidth/);
});
await test("versión técnica 7.2 pre-release alineada", async()=>{
  const pkg=JSON.parse(await text("package.json"));
  assert.equal(pkg.version,"7.2.0");
  assert.match(await text("game.js"),/BUILD_VERSION = "7\.2\.0"/);
});
console.log(`\nArquitectura V7.2 verificada: ${passed} pruebas superadas.`);
