import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const root = resolve(process.env.V7_ROOT || ".");
let passed = 0;
const text = (path) => readFile(join(root, path), "utf8");
const exists = (path) => stat(join(root, path)).then(() => true, () => false);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const withoutQuery = (path) => path.replace(/[?#].*$/, "").replace(/^\.\//, "");

async function test(name, operation) {
  await operation();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} · ${name}`);
}

const [indexHtml, gameSource, serviceWorkerSource, styles, coreSource] = await Promise.all([
  text("index.html"), text("game.js"), text("sw.js"), text("styles.css"), text("core-runtime.js")
]);

await test("JavaScript principal, runtime y service worker tienen sintaxis válida", async () => {
  new vm.Script(gameSource, { filename: "game.js" });
  new vm.Script(coreSource, { filename: "core-runtime.js" });
  new vm.Script(serviceWorkerSource, { filename: "sw.js" });
});

await test("V7.2.0 pre-release está alineada en pantalla, juego y caché", async () => {
  assert.match(indexHtml, /V7\.2\.0/);
  assert.match(indexHtml, /Compilación V7\.2\.0 · Pre-Release/);
  assert.match(gameSource, /BUILD_VERSION = "7\.2\.0"/);
  assert.match(serviceWorkerSource, /neon-catcher-pre-release-7-2-0/);
  assert.doesNotMatch(indexHtml, /[?&]v=6\.8\.0/);
});

await test("HTML conserva todas sus referencias locales", async () => {
  const references = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|data:|#)/.test(reference)) continue;
    assert.equal(await exists(withoutQuery(reference)), true, `referencia rota: ${reference}`);
  }
});

const swContext = {
  self: { addEventListener() {}, skipWaiting() {}, clients: { claim() {} }, location: { origin: "https://neon.test" } },
  caches: {}, fetch() {}, URL
};
vm.runInNewContext(`${serviceWorkerSource}\nglobalThis.__SW_TEST__ = { CACHE, CORE };`, swContext);

await test("PWA precarga código, legales, sprites y fondo de Cronos", async () => {
  const paths = new Set(swContext.__SW_TEST__.CORE.map(withoutQuery));
  for (const path of [
    "index.html", "styles.css", "game.js", "core-runtime.js", "manifest.webmanifest",
    "privacy.html", "terms.html", "analytics-manager.js", "assets/ship_frame_00.webp", "assets/core_frame_00.webp",
    "assets/cronium_fragment_v1.webp", "assets/cronos_level1_background.webp",
    "assets/chronos_shockwave_atlas_v1.webp", "assets/atlas_perimeter_background_v1.webp",
    "assets/vulkar_descent_background_v1.webp", "assets/vulkar_magma_tunnel_background_v1.webp",
    "assets/cryon_whiteout_background_v1.webp", "assets/cryon_leviathan_rift_background_v1.webp",
    "assets/aether_echo_cemetery_background_v1.webp", "assets/aether_phantom_threshold_background_v1.webp",
    "assets/titan_omega_graveyard_background_v1.webp", "assets/chronos_collapse_background_v1.webp"
  ]) assert.ok(paths.has(path), path);
});

await test("parallax V7 reemplaza la antigua rejilla", async () => {
  assert.match(gameSource, /const spaceDust = Array\.from/);
  assert.match(gameSource, /const foregroundParticles = Array\.from/);
  assert.match(gameSource, /Capa lejana/);
  assert.doesNotMatch(gameSource, /const horizon = H \* 0\.72/);
});

await test("núcleo, tractor, phaser, pulso, motores y HUD tienen respuesta multietapa", async () => {
  for (const marker of [
    "directionalBurst", "distanceToShip", "const targetWidth", "const volume = ctx.createLinearGradient",
    "flashPhase", "muzzle.addColorStop", 'style === "pulse"', "enginePulse", "updateHudVisual"
  ]) assert.ok(gameSource.includes(marker), marker);
  assert.match(styles, /@keyframes hudPop/);
  assert.match(styles, /@keyframes hudDamage/);
});

function createCanvasContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, property) {
      if (property in target) return target[property];
      if (property === "createLinearGradient" || property === "createRadialGradient") return () => gradient;
      if (property === "measureText") return (value) => ({ width: String(value).length * 14 });
      return () => {};
    },
    set(target, property, value) { target[property] = value; return true; }
  });
}

async function loadHarness() {
  const dom = new JSDOM(indexHtml, { url: "https://neon.test/", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  window.HTMLCanvasElement.prototype.getContext = () => createCanvasContext();
  window.requestAnimationFrame = () => 1;
  window.cancelAnimationFrame = () => {};
  window.navigator.vibrate = () => true;
  window.AdBridge = { showRewarded: async () => true, showInterstitial: async () => false };
  window.Image = class FakeImage {
    constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
    set src(value) { this._src = value; this.complete = true; this.naturalWidth = 720; this.naturalHeight = 1280; }
    get src() { return this._src || ""; }
  };
  window.localStorage.setItem("neon-unlocked-v2", "10");
  window.eval(coreSource);
  const marker = "  legacyFrameId = requestAnimationFrame(frame);\n})();";
  assert.ok(gameSource.includes(marker), "punto de instrumentación ausente");
  const hooks = `
  window.__NEON_V7_TEST__ = {
    snapshot: () => ({
      state, hull, score, collected, currentLevel, energyBudget, powerBudget, ammo, manualShotCooldown, warpTimer,
      displayedScore, hudScoreTarget, visualSpeed, shake, levelOneShockwave,
      player: { ...player }, powers: { ...powers },
      counts: { items: items.length, shots: shots.length, rings: rings.length, parts: parts.length }
    }),
    levels: LEVELS.map((entry) => ({ ...entry })),
    keys: { ...KEYS },
    collisionOutline: SHIP_COLLISION_OUTLINE.map((point) => [...point]),
    startLevel, damageShip, update, render, firePhaser, fireManualShot, pulseRing,
    setManualFireReady: () => { warpTimer = 0; manualShotCooldown = 0; },
    setPower: (name, value) => { powers[name] = value; },
    seedThreat: () => items.push({ type: "meteor", x: player.x, baseX: player.x, y: player.y - 260, r: 32, s: 0, rot: 0, rs: 0, p: 0, phase: 0, amp: 0, alpha: 1, hp: 1, damage: 25, spriteKey: "meteorMedium" })
  };
  legacyFrameId = requestAnimationFrame(frame);
})();`;
  window.eval(gameSource.replace(marker, hooks));
  return { dom, window, api: window.__NEON_V7_TEST__ };
}

const harness = await loadHarness();
const { api } = harness;

await test("campaña, guardados, balance y tamaño visual permanecen compatibles", async () => {
  assert.equal(api.levels.length, 10);
  assert.deepEqual(Array.from(api.levels, (entry) => entry.goal), [36,45,60,75,90,105,120,135,150,165]);
  assert.deepEqual({ ...api.keys }, {
    best: "neon-best-v2", unlocked: "neon-unlocked-v2", stars: "neon-stars-v2",
    levelBest: "neon-level-best-v2", games: "neon-games-v2", settings: "neon-settings-v5"
  });
  assert.match(gameSource, /SHIP_VISUAL_SCALE = 0\.8/);
});

await test("hitbox estable no fue modificada", async () => {
  assert.equal(api.collisionOutline.length, 30);
  assert.equal(sha256(JSON.stringify(api.collisionOutline)), "997fed2f9a050e08eca8c68d0b43486bc2f67a3243519e4f425bfb928ebb4841");
});

await test("arranque de nivel conserva presupuestos y estados limpios", async () => {
  api.startLevel(0);
  const snapshot = api.snapshot();
  assert.equal(snapshot.state, "playing");
  assert.equal(snapshot.hull, 100);
  assert.equal(snapshot.energyBudget, 45);
  assert.equal(snapshot.powerBudget, 2);
  assert.equal(snapshot.displayedScore, 0);
  assert.equal(snapshot.ammo, 3);
});

await test("control táctil consume tres disparos y bloquea el cuarto", async () => {
  api.startLevel(0);
  for (let shot = 0; shot < 3; shot++) {
    api.setManualFireReady();
    assert.equal(api.fireManualShot(), true);
  }
  api.setManualFireReady();
  assert.equal(api.snapshot().ammo, 0);
  assert.equal(api.fireManualShot(), false);
});

await test("daño activa respuesta de cámara/HUD sin alterar la lógica de casco", async () => {
  let snapshot = api.snapshot();
  api.damageShip(25, snapshot.player.x + 20, snapshot.player.y);
  snapshot = api.snapshot();
  assert.equal(snapshot.hull, 75);
  assert.ok(snapshot.shake > 0);
});

await test("phaser y pulso V7 se ejecutan sin errores en el Canvas", async () => {
  api.startLevel(0);
  api.setPower("phaser", 2);
  api.seedThreat();
  api.firePhaser();
  api.pulseRing(360, 640, "#a5faff", 245, 0.56, "pulse");
  api.update(0.016);
  api.render(1000);
  const snapshot = api.snapshot();
  assert.ok(snapshot.counts.shots >= 1);
  assert.ok(snapshot.counts.rings >= 1);
});

await test("simulación prolongada mantiene efectos y entidades bajo control", async () => {
  api.startLevel(0);
  for (let frame = 0; frame < 900; frame++) {
    api.update(1 / 60);
    api.render(frame * (1000 / 60));
  }
  const snapshot = api.snapshot();
  assert.ok(["playing", "destroying", "gameover"].includes(snapshot.state));
  assert.ok(snapshot.counts.parts <= 320, `partículas fuera de pool: ${snapshot.counts.parts}`);
  assert.ok(snapshot.counts.items < 80, `entidades sin limpiar: ${snapshot.counts.items}`);
});

harness.dom.window.close();
console.log(`\nRESULTADO V7: ${passed} pruebas aprobadas.`);
