(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 720;
  let H = 1280;
  const BUILD_VERSION = "7.2.0";
  // Local development route; preserves the original campaign and its save keys.
  const N7_CAMPAIGN = new URLSearchParams(location.search).get("campaign") === "n7";
  const INITIAL_AMMO = 3;
  const MAX_AMMO = 3;
  const SHIP_VISUAL_SCALE = 0.8;
  const SHIP_VISUAL = Object.freeze({
    scale: SHIP_VISUAL_SCALE,
    spriteSize: 248 * SHIP_VISUAL_SCALE,
    fallbackWidth: 232 * SHIP_VISUAL_SCALE,
    fallbackHeight: 265 * SHIP_VISUAL_SCALE,
    shieldSize: 294 * SHIP_VISUAL_SCALE,
    centerYOffset: -24 * SHIP_VISUAL_SCALE,
    tractorMuzzleOffset: 76 * SHIP_VISUAL_SCALE,
    phaserMuzzleOffset: 78 * SHIP_VISUAL_SCALE
  });

  const ui = {
    hud: $("hud"),
    powerHud: $("powerHud"),
    encounterProgress: $("encounterProgress"),
    score: $("score"),
    goal: $("goal"),
    hull: $("hull"),
    hullBar: $("hullBar"),
    hudLevel: $("hudLevel"),
    fire: $("fire"),
    ammo: $("ammo"),
    best: $("best"),
    unlockedText: $("unlockedText"),
    totalStars: $("totalStars"),
    campaignPercent: $("campaignPercent"),
    campaignFill: $("campaignFill"),
    campaignNodes: $("campaignNodes"),
    playLabel: $("playLabel"),
    playSector: $("playSector"),
    menu: $("menu"),
    briefing: $("briefing"),
    briefingPanel: $("briefingPanel"),
    briefingSector: $("briefingSector"),
    briefingVisual: $("briefingVisual"),
    briefingName: $("briefingName"),
    briefingZone: $("briefingZone"),
    briefingGoal: $("briefingGoal"),
    briefingThreat: $("briefingThreat"),
    briefingSupply: $("briefingSupply"),
    briefingMission: $("briefingMission"),
    levelSelect: $("levelSelect"),
    settingsPanel: $("settingsPanel"),
    instructions: $("instructions"),
    paused: $("paused"),
    complete: $("complete"),
    over: $("over"),
    levelGrid: $("levelGrid"),
    result: $("result"),
    final: $("finalScore"),
    supplyStatus: $("supplyStatus"),
    newBest: $("newBest"),
    reward: $("reward"),
    toast: $("toast"),
    install: $("install"),
    banner: $("levelBanner"),
    bannerSector: $("bannerSector"),
    bannerName: $("bannerName"),
    bannerGoal: $("bannerGoal"),
    hazardWarning: $("hazardWarning"),
    warningText: $("warningText"),
    storyTransmission: $("storyTransmission"),
    storySpeaker: $("storySpeaker"),
    storyText: $("storyText"),
    completeLabel: $("completeLabel"),
    completeTitle: $("completeTitle"),
    starsAwarded: $("starsAwarded"),
    levelScore: $("levelScore"),
    levelHull: $("levelHull"),
    maxCombo: $("maxCombo"),
    unlockMessage: $("unlockMessage"),
    nextLevel: $("nextLevel"),
    powerShield: $("powerShield"),
    powerTractor: $("powerTractor"),
    powerSlow: $("powerSlow"),
    powerDouble: $("powerDouble"),
    powerPhaser: $("powerPhaser"),
    musicVolume: $("musicVolume"),
    fxVolume: $("fxVolume"),
    sensitivity: $("sensitivity"),
    vibration: $("vibration"),
    effectsQuality: $("effectsQuality"),
    musicValue: $("musicValue"),
    fxValue: $("fxValue"),
    sensitivityValue: $("sensitivityValue")
  };

  const ORIGINAL_LEVELS = [
    {
      name: "La Onda de Choque", goal: 36, speed: 0.92, spawn: 0.69, meteor: 0.105, power: 0.072,
      accent: "#57f4ff", top: "#173460", mid: "#07172f", hazard: "shockwave", scene: "cronos",
      world: "CRONOS / GAIA NOVA", enemyCue: "Restos temporales",
      zone: "Perímetro exterior del Centro Cronos", desc: "Cruza la zona de impacto",
      mission: "Alcanza el perímetro, recupera 36 fragmentos temporales y localiza la señal de emergencia del Centro Cronos.",
      threatLabel: "Roca y restos orbitales", threatPool: ["meteor", "meteor", "debris"], gate: 0
    },
    {
      name: "Perímetro Atlas", goal: 45, speed: 0.94, spawn: 0.72, meteor: 0.095, power: 0.068,
      accent: "#4da2ff", top: "#14245c", mid: "#0a1035", hazard: "fast", scene: "rift",
      world: "GAIA NOVA", enemyCue: "Red defensiva CH",
      zone: "Anillo defensivo de Gaia Nova", desc: "La red Atlas despierta",
      mission: "Recupera energía mientras evitas las patrullas CH y confirma quién reprogramó las defensas orbitales.",
      threatLabel: "Drones y restos Atlas", threatPool: ["meteor", "meteor", "meteor", "debris"], gate: 0
    },
    {
      name: "Descenso Ígneo", goal: 60, speed: 1.02, spawn: 0.67, meteor: 0.115, power: 0.066,
      accent: "#ffb35c", top: "#3b2437", mid: "#17101f", hazard: "wave", scene: "belt",
      world: "VULKAR", enemyCue: "Lava Core / Plasma Mine",
      zone: "Caldera orbital de Vulkar", desc: "CRONIUM sobrecalentado",
      mission: "Sigue los fragmentos incandescentes entre núcleos de lava y minas de plasma antes de que se desintegren.",
      threatLabel: "Lava Core y chatarra", threatPool: ["meteor", "meteor", "debris", "debris"], gate: 0
    },
    {
      name: "Rastro de la Serpiente", goal: 75, speed: 1.09, spawn: 0.62, meteor: 0.135, power: 0.064,
      accent: "#ff734d", top: "#342364", mid: "#15102d", hazard: "dart", scene: "ion",
      world: "VULKAR", enemyCue: "Magma Serpent",
      zone: "Túneles magmáticos de Vulkar", desc: "La serpiente abre una ruta",
      mission: "Persigue el rastro de Magma Serpent y atraviesa sus cometas vivos sin quedar encerrado en la caldera.",
      threatLabel: "Cometas y Plasma Mine", threatPool: ["meteor", "meteor", "debris", "satellite"], gate: 0
    },
    {
      name: "Blanco Absoluto", goal: 90, speed: 1.16, spawn: 0.58, meteor: 0.155, power: 0.062,
      accent: "#7ddfff", top: "#552034", mid: "#210b18", hazard: "storm", scene: "crimson",
      world: "CRYON", enemyCue: "Frost Crystal / Ice Drone",
      zone: "Planicie nocturna de Cryon", desc: "Visibilidad mínima",
      mission: "Recupera los registros congelados del Centro Cronos entre cristales vivos y drones blindados.",
      threatLabel: "Frost Crystal e Ice Drone", threatPool: ["meteor", "meteor", "satellite", "debris"], gate: 0
    },
    {
      name: "Fractura Leviatán", goal: 105, speed: 1.22, spawn: 0.54, meteor: 0.175, power: 0.060,
      accent: "#47ffd1", top: "#16463f", mid: "#09241f", hazard: "gravity", scene: "gravity",
      world: "CRYON", enemyCue: "Cryo Mine / señal Leviathan",
      zone: "Grieta glacial Leviatán", desc: "Una señal llega del futuro",
      mission: "Cruza el campo de Cryo Mines y rastrea la silueta que protege una transmisión imposible.",
      threatLabel: "Cryo Mine y hielo orbital", threatPool: ["meteor", "debris", "debris", "satellite"], gate: 15
    },
    {
      name: "Ecos Imposibles", goal: 120, speed: 1.28, spawn: 0.51, meteor: 0.195, power: 0.058,
      accent: "#c48aff", top: "#3a2856", mid: "#160d25", hazard: "phantom", scene: "ghost",
      world: "AETHER", enemyCue: "Time Echo / Rift Orb",
      zone: "Cementerio temporal de Aether", desc: "La realidad se duplica",
      mission: "Distingue los ecos de las amenazas reales y reúne pruebas de las duplicaciones humanas.",
      threatLabel: "Time Echo y Rift Orb", threatPool: ["meteor", "debris", "satellite", "satellite"], gate: 14
    },
    {
      name: "Umbral Fantasma", goal: 135, speed: 1.35, spawn: 0.47, meteor: 0.215, power: 0.056,
      accent: "#fff06b", top: "#514916", mid: "#211d08", hazard: "overdrive", scene: "overdrive",
      world: "AETHER", enemyCue: "Chrono Phantom",
      zone: "Umbral espectral de Aether", desc: "Nada permanece visible",
      mission: "Sobrevive a los saltos del Chrono Phantom y localiza el protocolo oculto CRONOS PRIME.",
      threatLabel: "Chrono Phantom y fisuras", threatPool: ["meteor", "debris", "satellite", "debris"], gate: 12
    },
    {
      name: "Cementerio Gravitatorio", goal: 150, speed: 1.42, spawn: 0.44, meteor: 0.235, power: 0.054,
      accent: "#fb66ff", top: "#40183f", mid: "#190918", hazard: "chaos", scene: "dark",
      world: "TITAN OMEGA", enemyCue: "Gravity Mine / Scrap Collector",
      zone: "Cementerio industrial de Titan Omega", desc: "La gravedad tritura el corredor",
      mission: "Recupera las piezas del retorno mientras las minas gravitatorias atraen toda la chatarra hacia ti.",
      threatLabel: "Gravity Mine y Scrap Collector", threatPool: ["meteor", "meteor", "debris", "satellite"], gate: 11
    },
    {
      name: "Colapso Cronos", goal: 165, speed: 1.50, spawn: 0.40, meteor: 0.255, power: 0.052,
      accent: "#63fff1", top: "#45184b", mid: "#12071e", hazard: "final", scene: "collapse",
      world: "RETORNO A CRONOS", enemyCue: "Todas las firmas detectadas",
      zone: "Reactor CRONIUM en colapso", desc: "Todas las líneas temporales convergen",
      mission: "Combina todos los sistemas para estabilizar el reactor y descubre por qué el incidente no fue accidental.",
      threatLabel: "Colapso total", threatPool: ["meteor", "debris", "satellite", "meteor"], gate: 9
    }
  ];

  const LEVELS = N7_CAMPAIGN ? NeonCampaign.LEVELS : ORIGINAL_LEVELS;
  const KEYS = {
    best: "neon-best-v2",
    unlocked: "neon-unlocked-v2",
    stars: "neon-stars-v2",
    levelBest: "neon-level-best-v2",
    games: "neon-games-v2",
    settings: "neon-settings-v5"
  };
  if (N7_CAMPAIGN) {
    for (const key of ["best", "unlocked", "stars", "levelBest", "games"]) KEYS[key] = `neon-n7-${key}-v1`;
  }
  const LEGACY_KEYS = { best: "neon-best-v1" };
  const DEFAULT_SETTINGS = { music: 35, fx: 70, sensitivity: 100, vibration: true, effectsQuality: "normal", effects: true };
  const storage = NeonCore.createStorageService();

  function migrateLegacyStorage() {
    if (N7_CAMPAIGN) return false;
    const legacyBest = Math.max(0, storage.getNumber(LEGACY_KEYS.best, 0));
    const currentBest = Math.max(0, storage.getNumber(KEYS.best, 0));
    if (legacyBest <= currentBest) return false;
    return storage.set(KEYS.best, legacyBest);
  }

  migrateLegacyStorage();
  let settings = loadSettings();

  const stateMachine = NeonCore.createGameState(NeonCore.GAME_STATES.MENU);
  let state = stateMachine.value;
  function setState(next, metadata = {}) {
    state = stateMachine.transition(next, metadata);
    return state;
  }
  let settingsReturn = "menu";
  let briefingReturn = "menu";
  let pendingLevel = 0;
  let last = performance.now();
  let elapsed = 0;
  let spawnTimer = 0;
  let warpTimer = 0;
  let score = 0;
  let hull = 100;
  let combo = 1;
  let maxCombo = 1;
  let comboTimer = 0;
  let collected = 0;
  let currentLevel = Math.max(0, Math.min(LEVELS.length - 1, getUnlocked() - 1));
  let encounterDirector = null;
  let encounterWave = 0;
  let continued = false;
  let shake = 0;
  let flash = 0;
  let stormPulse = 0;
  let bannerTimer = 0;
  let deferred = null;
  let destructionTimer = 0;
  let destructionStage = 0;
  let playerVisible = true;
  let damageSmokeSide = 1;
  let damageSmokeLocked = false;
  let impactReactionTimer = 0;
  let impactReactionSide = 1;
  let storyStep = 0;
  let storyTimer = 0;
  let levelOneShockwave = 0;
  let levelOneShockwaveTriggered = false;
  let visualSpeed = 1;
  let cameraKickX = 0;
  let cameraKickY = 0;
  let displayedScore = 0;
  let hudScoreTarget = 0;
  let lastHudCollected = 0;
  let lastHudHull = 100;
  let ammo = INITIAL_AMMO;
  let manualShotCooldown = 0;

  let items = [];
  let gates = [];
  let parts = [];
  const EFFECT_LIMITS = Object.freeze({
    particles: 320,
    shots: 24,
    rings: 32,
    explosions: 20,
    impacts: 24
  });
  const particlePool = NeonCore.createObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 0, kind: "cyan" }),
    (part) => { part.life = 0; part.vx = 0; part.vy = 0; },
    EFFECT_LIMITS.particles
  );
  let shots = [];
  let rings = [];
  let explosions = [];
  let impactEffects = [];

  let energySpawned = 0;
  let energyBudget = 0;
  let powerSpawned = 0;
  let powerBudget = 0;
  let repairAllowance = 0;
  let repairSpawned = 0;
  let supplyFailed = false;
  let supplyFailureScheduled = false;
  let supplyFailureTimer = 0;
  let runToken = 0;
  let phaserCooldown = 0;
  let tractorTarget = null;
  let gateCountdown = Infinity;

  const powers = { shield: 0, tractor: 0, slow: 0, double: 0, phaser: 0 };
  const player = NeonCore.createPlayerModel(W, H);

  // Silueta de colisión aproximada al sprite de la nave.
  // Está ligeramente metida hacia dentro para que los roces mínimos no sean injustos,
  // pero incluye morro, fuselaje, alas y motores.
  const SHIP_COLLISION_OUTLINE = [
    [0, -148],
    [18, -137], [28, -112], [34, -91], [44, -74],
    [55, -56], [77, -38], [103, -12], [109, 20],
    [103, 46], [82, 51], [66, 42], [56, 72],
    [41, 94], [28, 73], [0, 92],
    [-28, 73], [-41, 94], [-56, 72], [-66, 42],
    [-82, 51], [-103, 46], [-109, 20], [-103, -12],
    [-77, -38], [-55, -56], [-44, -74], [-34, -91],
    [-28, -112], [-18, -137]
  ];

  const SHIP_COLLISION_HALF_WIDTH = NeonCore.PLAYER_GEOMETRY.collisionHalfWidth;
  const CORRIDOR_REQUIRED_CLEARANCE = 14;
  const CORRIDOR_TOP = -170;
  const CORRIDOR_BOTTOM_PADDING = 94;
  const FORMATION_SPRITE_KEYS = ["debrisMetal", "debrisPanel", "debrisHot0", "debrisHot1", "meteorSmall", "meteorMedium"];

  // Assets visuales V6.4. Cada imagen tiene respaldo vectorial para que el juego siga
  // funcionando aunque un archivo tarde en cargar.
  function loadSprite(path, eager = true) {
    const image = new Image();
    image.decoding = "async";
    image._assetPath = path;
    if (eager) image.src = path;
    return image;
  }

  function ensureSprite(image) {
    if (image && !image.src && image._assetPath) image.src = image._assetPath;
    return image;
  }

  function spriteReady(image) {
    ensureSprite(image);
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  const SPRITE_GROUPS = {
    ship: [0,1,2,3,4,5].map((index) => loadSprite(`assets/ship_frame_${String(index).padStart(2,"0")}.webp`, true)),
    core: [0,1,2,3,4,5].map((index) => loadSprite(`assets/core_frame_${String(index).padStart(2,"0")}.webp`, true)),
    phaser: [0,1,2,3,4,5].map((index) => loadSprite(`assets/phaser_frame_${String(index).padStart(2,"0")}.webp`)),
    tractor: [0,1,2,3,4,5].map((index) => loadSprite(`assets/tractor_frame_${String(index).padStart(2,"0")}.webp`)),
    impact: [0,1,2,3].map((index) => loadSprite(`assets/impact_frame_${String(index).padStart(2,"0")}.webp`)),
    smoke: [0,1,2].map((index) => loadSprite(`assets/smoke_frame_${String(index).padStart(2,"0")}.webp`)),
    explosion: [0,1,2,3,4,5,6,7].map((index) => loadSprite(`assets/explosion_frame_${String(index).padStart(2,"0")}.webp`))
  };

  const SPRITES = {
    shipFallback: SPRITE_GROUPS.ship[0],
    meteorSmall: loadSprite("assets/meteor_small.webp", true),
    meteorSmallAlt: loadSprite("assets/meteor_small_alt.webp"),
    meteorMedium: loadSprite("assets/meteor_medium.webp", true),
    meteorMediumAlt: loadSprite("assets/meteor_medium_alt.webp"),
    meteorLarge: loadSprite("assets/meteor_large.webp"),
    ch01: loadSprite("assets/ch01_atlas_v1.webp", false),
    comet: loadSprite("assets/comet_animation_sheet_v1.webp"),
    debrisMetal: loadSprite("assets/debris_metal.webp"),
    debrisPanel: loadSprite("assets/debris_panel.webp"),
    debrisHot0: loadSprite("assets/debris_hot_00.webp"),
    debrisHot1: loadSprite("assets/debris_hot_01.webp"),
    satellite: loadSprite("assets/satellite_old.webp"),
    repairDrone: loadSprite("assets/repair_drone.webp"),
    shieldEffect: loadSprite("assets/shield_effect.webp"),
    shieldIdle: loadSprite("assets/shield_idle.webp"),
    explosionSmall: loadSprite("assets/explosion_small.webp"),
    croniumFragment: loadSprite("assets/cronium_fragment_v1.webp", true),
    cronosBackground: loadSprite("assets/cronos_level1_background.webp", true),
    chronosShockwave: loadSprite("assets/chronos_shockwave_atlas_v1.webp", false),
    atlasBackground: loadSprite("assets/atlas_perimeter_background_v1.webp", false),
    vulkarBackground: loadSprite("assets/vulkar_descent_background_v1.webp", false),
    magmaTunnelBackground: loadSprite("assets/vulkar_magma_tunnel_background_v1.webp", false),
    cryonWhiteoutBackground: loadSprite("assets/cryon_whiteout_background_v1.webp", false),
    cryonRiftBackground: loadSprite("assets/cryon_leviathan_rift_background_v1.webp", false),
    aetherEchoBackground: loadSprite("assets/aether_echo_cemetery_background_v1.webp", false),
    aetherThresholdBackground: loadSprite("assets/aether_phantom_threshold_background_v1.webp", false),
    titanGraveyardBackground: loadSprite("assets/titan_omega_graveyard_background_v1.webp", false),
    chronosCollapseBackground: loadSprite("assets/chronos_collapse_background_v1.webp", false)
  };

  function frameFrom(group, index) {
    const frames = SPRITE_GROUPS[group] || [];
    if (!frames.length) return null;
    const frame = frames[((index % frames.length) + frames.length) % frames.length];
    return spriteReady(frame) ? frame : null;
  }

  function drawImageCentered(image, width, height, rotation = 0, alpha = 1, flipX = false) {
    if (!spriteReady(image)) return false;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.rotate(rotation);
    ctx.scale(flipX ? -1 : 1, 1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }
  const stars = Array.from({ length: 118 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.35 + Math.random() * 1.55,
    a: 0.18 + Math.random() * 0.7,
    s: 8 + Math.random() * 20,
    layer: 0.35 + Math.random() * 1.25,
    tint: Math.random() > 0.82 ? "#8eeeff" : "#e8f3ff"
  }));
  const spaceDust = Array.from({ length: 46 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.7 + Math.random() * 2.2,
    a: 0.035 + Math.random() * 0.12,
    s: 20 + Math.random() * 42,
    drift: (Math.random() - 0.5) * 8
  }));
  const foregroundParticles = Array.from({ length: 12 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 2.5 + Math.random() * 5.5,
    a: 0.025 + Math.random() * 0.08,
    s: 78 + Math.random() * 115,
    drift: (Math.random() - 0.5) * 22
  }));

  let audioCtx = null;
  let musicGain = null;
  let musicNodes = [];
  let resumeAudioAfterAd = false;
  function loadSettings() {
    const saved = storage.getJSON(KEYS.settings, {});
    const source = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    const finite = (value, fallback, minimum, maximum) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
    };
    const savedQuality = ["low", "normal", "high"].includes(source.effectsQuality)
      ? source.effectsQuality
      : source.effects === false ? "low" : DEFAULT_SETTINGS.effectsQuality;
    return {
      music: Math.round(finite(source.music, DEFAULT_SETTINGS.music, 0, 100)),
      fx: Math.round(finite(source.fx, DEFAULT_SETTINGS.fx, 0, 100)),
      sensitivity: Math.round(finite(source.sensitivity, DEFAULT_SETTINGS.sensitivity, 60, 150) / 5) * 5,
      vibration: typeof source.vibration === "boolean" ? source.vibration : DEFAULT_SETTINGS.vibration,
      effectsQuality: savedQuality,
      effects: savedQuality !== "low"
    };
  }

  function saveSettings() {
    return storage.setJSON(KEYS.settings, settings);
  }

  function getUnlocked() {
    return Math.trunc(Math.max(1, Math.min(LEVELS.length, storage.getNumber(KEYS.unlocked, 1))));
  }

  function getStars() {
    const saved = storage.getJSON(KEYS.stars, {});
    const source = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    const normalized = {};
    for (let levelIndex = 1; levelIndex <= LEVELS.length; levelIndex++) {
      const value = Number(source[levelIndex]);
      if (Number.isFinite(value) && value > 0) normalized[levelIndex] = Math.trunc(Math.min(3, value));
    }
    return normalized;
  }

  function getLevelBest() {
    const saved = storage.getJSON(KEYS.levelBest, {});
    const source = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    const normalized = {};
    for (let levelIndex = 1; levelIndex <= LEVELS.length; levelIndex++) {
      const value = Number(source[levelIndex]);
      if (Number.isFinite(value) && value > 0) {
        normalized[levelIndex] = Math.trunc(Math.min(Number.MAX_SAFE_INTEGER, value));
      }
    }
    return normalized;
  }

  function bestScore() {
    return Math.trunc(Math.max(0, storage.getNumber(KEYS.best, 0)));
  }

  function totalStars() {
    return Object.values(getStars()).reduce((a, b) => a + (+b || 0), 0);
  }

  function level() {
    return LEVELS[currentLevel];
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function isThreat(item) {
    return item && ["meteor", "debris", "satellite"].includes(item.type);
  }

  function overlay(el) {
    [ui.menu, ui.briefing, ui.levelSelect, ui.settingsPanel, ui.instructions, ui.paused, ui.complete, ui.over]
      .forEach((node) => node.classList.remove("show"));
    if (el) el.classList.add("show");
  }

  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ui.toast.classList.remove("show"), 1650);
  }

  addEventListener("game-toast", (event) => toast(event.detail));

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    W = 720;
    H = Math.max(1180, Math.round(W * rect.height / rect.width));
    canvas.width = W;
    canvas.height = H;
    player.y = H - 135;
    player.x = clamp(player.x, 80, W - 80);
    player.target = clamp(player.target, 80, W - 80);
    for (const star of stars) {
      star.x = clamp(star.x, 0, W);
      star.y = clamp(star.y, 0, H);
    }
  }

  addEventListener("resize", resizeCanvas, { passive: true });

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
    return audioCtx;
  }

  function startMusic() {
    const ac = ensureAudio();
    if (!ac) return;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    if (musicNodes.length) {
      updateAudioVolumes();
      return;
    }
    [55, 82.41, 110].forEach((frequency, index) => {
      const oscillator = ac.createOscillator();
      const gain = ac.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.33 : 0.11;
      oscillator.connect(gain).connect(musicGain);
      oscillator.start();
      musicNodes.push(oscillator, gain);
    });
    updateAudioVolumes();
  }

  async function suspendAudio() {
    if (audioCtx?.state === "running") await audioCtx.suspend().catch(() => {});
  }

  async function resumeAudio() {
    if (audioCtx?.state === "suspended" && (settings.music > 0 || settings.fx > 0)) {
      await audioCtx.resume().catch(() => {});
    }
    updateAudioVolumes();
  }

  function updateAudioVolumes() {
    if (musicGain && audioCtx) {
      const value = (settings.music / 100) * 0.09;
      musicGain.gain.setTargetAtTime(value, audioCtx.currentTime, 0.08);
    }
  }

  function tone(frequency = 440, duration = 0.06, type = "sine", base = 0.06) {
    if (settings.fx <= 0) return;
    const ac = ensureAudio();
    if (!ac) return;
    const oscillator = ac.createOscillator();
    const gain = ac.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = base * (settings.fx / 100);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    oscillator.connect(gain).connect(ac.destination);
    oscillator.start();
    oscillator.stop(ac.currentTime + duration);
  }

  function vibrate(pattern) {
    if (settings.vibration) navigator.vibrate?.(pattern);
  }

  function syncSettingsUI() {
    ui.musicVolume.value = settings.music;
    ui.fxVolume.value = settings.fx;
    ui.sensitivity.value = settings.sensitivity;
    ui.vibration.checked = settings.vibration;
    ui.effectsQuality.value = settings.effectsQuality;
    ui.musicValue.textContent = `${settings.music}%`;
    ui.fxValue.textContent = `${settings.fx}%`;
    ui.sensitivityValue.textContent = `${settings.sensitivity}%`;
  }

  function openSettings(from = "menu") {
    settingsReturn = from;
    syncSettingsUI();
    overlay(ui.settingsPanel);
    startMusic();
  }

  function closeSettings() {
    saveSettings();
    updateAudioVolumes();
    overlay(settingsReturn === "paused" ? ui.paused : ui.menu);
  }
  function updateMenu() {
    const unlocked = getUnlocked();
    const starsMap = getStars();
    const completed = LEVELS.reduce((total, _, index) => total + (+(starsMap[index + 1] || 0) > 0 ? 1 : 0), 0);
    const percent = Math.round((completed / LEVELS.length) * 100);
    const finished = completed === LEVELS.length;
    const target = finished ? LEVELS.length - 1 : Math.max(0, unlocked - 1);

    ui.best.textContent = bestScore();
    ui.unlockedText.textContent = `${unlocked}/${LEVELS.length}`;
    ui.totalStars.textContent = `${totalStars()}/${LEVELS.length * 3}`;
    ui.campaignPercent.textContent = `${percent}%`;
    ui.campaignFill.style.width = `${percent}%`;
    ui.playLabel.textContent = finished ? "REPETIR CAMPAÑA" : "CONTINUAR CAMPAÑA";
    ui.playSector.textContent = `${N7_CAMPAIGN ? "RUTA" : "SECTOR"} ${target + 1} · ${LEVELS[target].name.toUpperCase()}`;
    ui.campaignNodes.innerHTML = LEVELS.map((_, index) =>
      `<span class="${index < completed ? "done " : ""}${index === target ? "current" : ""}"></span>`
    ).join("");
    buildLevelGrid();
  }

  function hud() {
    hudScoreTarget = score;
    if (state !== "playing") displayedScore = score;
    ui.score.textContent = Math.round(displayedScore);
    ui.goal.textContent = `${collected}/${level().goal}`;
    ui.hull.textContent = `${Math.max(0, Math.ceil(hull))}%`;
    ui.hudLevel.textContent = currentLevel + 1;
    ui.hudLevel.previousElementSibling.textContent = N7_CAMPAIGN ? "RUTA" : "SECTOR";
    ui.hullBar.style.width = `${clamp(hull, 0, 100)}%`;
    ui.hullBar.style.background = hull > 66
      ? "linear-gradient(90deg,#63ffc4,#64e9ff)"
      : hull > 33
        ? "linear-gradient(90deg,#ffe166,#ff9f55)"
        : "linear-gradient(90deg,#ff5b7c,#ff2e55)";

    if (collected > lastHudCollected) animateHud(ui.goal, "hud-pop");
    if (hull < lastHudHull) {
      animateHud(ui.hull, "hud-damage");
      animateHud(ui.hullBar?.parentElement, "hud-damage");
    }
    lastHudCollected = collected;
    lastHudHull = hull;
    updateAmmoHud();
  }

  function updateAmmoHud() {
    if (!ui.fire || !ui.ammo) return;
    ui.ammo.textContent = `${ammo}/${MAX_AMMO}`;
    const unavailable = state !== "playing" || ammo <= 0 || manualShotCooldown > 0 || warpTimer > 0;
    ui.fire.disabled = unavailable;
    ui.fire.classList.toggle("empty", ammo <= 0);
    ui.fire.setAttribute("aria-label", ammo > 0
      ? `Disparar. Munición ${ammo} de ${MAX_AMMO}`
      : "Sin munición");
  }

  function animateHud(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function updateHudVisual(dt) {
    const difference = hudScoreTarget - displayedScore;
    if (Math.abs(difference) < 0.5) displayedScore = hudScoreTarget;
    else displayedScore += difference * Math.min(1, dt * 11);
    ui.score.textContent = Math.round(displayedScore);
  }

  function updatePowerHud() {
    const map = [
      ["shield", ui.powerShield],
      ["tractor", ui.powerTractor],
      ["slow", ui.powerSlow],
      ["double", ui.powerDouble],
      ["phaser", ui.powerPhaser]
    ];
    for (const [name, element] of map) {
      const active = powers[name] > 0;
      element.dataset.power = name;
      element.classList.toggle("active", active);
      element.querySelector("em").textContent = active ? Math.ceil(powers[name]) : "0";
    }
  }

  function updateEncounterHud() {
    ui.encounterProgress.classList.toggle("active", Boolean(encounterDirector));
    if (encounterDirector) {
      ui.encounterProgress.querySelector("em").textContent = `${encounterWave}/${encounterDirector.plan.waves.length}`;
    }
  }

  function buildLevelGrid() {
    const unlocked = getUnlocked();
    const starsMap = getStars();
    const bests = getLevelBest();
    ui.levelGrid.innerHTML = "";

    LEVELS.forEach((lv, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `level-card${index === currentLevel ? " current" : ""}`;
      button.style.setProperty("--level-accent", lv.accent);
      button.dataset.scene = lv.scene;
      button.disabled = index + 1 > unlocked;
      const earned = +(starsMap[index + 1] || 0);
      const starText = "★".repeat(earned) + "☆".repeat(3 - earned);
      button.innerHTML = `
        <small>${N7_CAMPAIGN ? "RUTA" : "SECTOR"} ${index + 1}</small>
        <strong>${lv.name}</strong>
        <span>${lv.world} · ${lv.goal} núcleos</span>
        <div class="level-stars">${button.disabled ? "" : starText}</div>
        ${button.disabled ? '<div class="lock">🔒</div>' : ""}
      `;
      if (!button.disabled) button.onclick = () => prepareLevel(index, "levels");
      ui.levelGrid.appendChild(button);
    });
  }

  function prepareLevel(index, returnTo = "menu") {
    pendingLevel = clamp(index, 0, getUnlocked() - 1);
    briefingReturn = returnTo;
    const lv = LEVELS[pendingLevel];
    ui.briefingSector.textContent = `${N7_CAMPAIGN ? "RUTA" : "SECTOR"} ${pendingLevel + 1}`;
    ui.briefingName.textContent = lv.name;
    ui.briefingZone.textContent = `${lv.world} · ${lv.zone}`;
    ui.briefingGoal.textContent = `${lv.goal} núcleos`;
    ui.briefingThreat.textContent = lv.threatLabel;
    ui.briefingSupply.textContent = `${lv.goal + Math.ceil(lv.goal * 0.25)} disponibles`;
    ui.briefingMission.textContent = lv.mission;
    ui.briefingVisual.dataset.scene = lv.scene;
    ui.briefingPanel.style.setProperty("--brief-accent", lv.accent);
    overlay(ui.briefing);
  }

  function closeBriefing() {
    if (briefingReturn === "levels") overlay(ui.levelSelect);
    else if (briefingReturn === "complete") overlay(ui.complete);
    else overlay(ui.menu);
  }

  function showBanner() {
    ui.bannerSector.textContent = `${N7_CAMPAIGN ? "RUTA" : "SECTOR"} ${currentLevel + 1}`;
    ui.bannerName.textContent = level().name.toUpperCase();
    ui.bannerGoal.textContent = `Recupera ${level().goal} núcleos · ${level().desc}`;
    ui.banner.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => ui.banner.classList.remove("show"), 2500);
  }

  function resetPowers() {
    for (const key in powers) powers[key] = 0;
    tractorTarget = null;
    updatePowerHud();
  }

  function hideWarning() {
    ui.hazardWarning.classList.remove("show");
  }

  const LEVEL_ONE_STORY = [
    { at: 2.8, speaker: "IA N-7", text: "Centro Cronos, responda. Repito: Centro Cronos, responda." },
    { at: 18, speaker: "IA N-7", text: "Sin respuesta. Detecto fragmentos temporales dentro del corredor." },
    { at: 42, speaker: "IA N-7", text: "La radiación no coincide con ningún accidente registrado." }
  ];

  function hideStoryTransmission() {
    ui.storyTransmission?.classList.remove("show");
  }

  function showStoryTransmission(speaker, text, duration = 4.6) {
    if (!ui.storyTransmission) return;
    ui.storySpeaker.textContent = speaker;
    ui.storyText.textContent = text;
    ui.storyTransmission.classList.add("show");
    storyTimer = duration;
    tone(315, 0.06, "sine", 0.035);
  }

  function updateLevelStory(dt) {
    if (N7_CAMPAIGN) {
      if (storyTimer > 0) {
        storyTimer = Math.max(0, storyTimer - dt);
        if (storyTimer === 0) hideStoryTransmission();
      }
      return;
    }
    if (currentLevel !== 0 || state !== "playing" || warpTimer > 0) return;
    if (storyTimer > 0) {
      storyTimer = Math.max(0, storyTimer - dt);
      if (storyTimer === 0) hideStoryTransmission();
    }
    const next = LEVEL_ONE_STORY[storyStep];
    if (next && elapsed >= next.at) {
      showStoryTransmission(next.speaker, next.text);
      storyStep++;
    }
    if (elapsed >= 31 && !levelOneShockwaveTriggered) {
      levelOneShockwaveTriggered = true;
      levelOneShockwave = 0.62;
      stormPulse = Math.max(stormPulse, 0.42);
      shake = Math.max(shake, 12);
      cameraKickY = 8;
      pulseRing(player.x, player.y + SHIP_VISUAL.centerYOffset, "#a5faff", 245, 0.56, "pulse");
      burst(player.x, player.y + SHIP_VISUAL.centerYOffset, 38, "cyan");
      tone(78, 0.8, "sawtooth", 0.055);
      showStoryTransmission("IA N-7", "Onda expansiva. Mantén el rumbo.", 3.2);
    }
  }

  function startLevel(index = currentLevel) {
    runToken += 1;
    cancelSupplyFailureTimer();
    startMusic();
    currentLevel = clamp(index, 0, getUnlocked() - 1);
    encounterDirector = N7_CAMPAIGN ? new NeonCampaign.EncounterDirector(currentLevel + 1) : null;
    encounterWave = 0;
    setState("playing");
    score = 0;
    displayedScore = 0;
    hudScoreTarget = 0;
    hull = 100;
    combo = 1;
    maxCombo = 1;
    comboTimer = 0;
    collected = 0;
    ammo = INITIAL_AMMO;
    manualShotCooldown = 0;
    elapsed = 0;
    continued = false;
    spawnTimer = 0.35;
    warpTimer = 1.25;
    supplyFailed = false;
    shake = 0;
    flash = 0;
    stormPulse = 0;
    destructionTimer = 0;
    destructionStage = 0;
    playerVisible = true;
    damageSmokeSide = 1;
    damageSmokeLocked = false;
    impactReactionTimer = 0;
    impactReactionSide = 1;
    storyStep = 0;
    storyTimer = 0;
    levelOneShockwave = 0;
    levelOneShockwaveTriggered = false;
    cameraKickX = 0;
    cameraKickY = 0;
    lastHudCollected = 0;
    lastHudHull = 100;
    hideStoryTransmission();
    items = [];
    gates = [];
    clearTransientEffects();
    player.x = player.target = W / 2;
    player.drift = 0;
    resetPowers();

    energySpawned = 0;
    energyBudget = level().goal + Math.ceil(level().goal * 0.25);
    powerSpawned = 0;
    powerBudget = 2 + Math.floor(currentLevel / 3);
    repairAllowance = currentLevel >= 3 && Math.random() < 0.45 ? 1 : 0;
    repairSpawned = 0;
    phaserCooldown = 0;
    gateCountdown = level().gate ? 8.5 + Math.random() * 3 : Infinity;

    ui.reward.classList.remove("hidden");
    ui.reward.disabled = false;
    ui.newBest.classList.add("hidden");
    ui.supplyStatus.textContent = "";
    hideWarning();
    overlay();
    ui.hud.classList.remove("hidden");
    ui.powerHud.classList.remove("hidden");
    ui.fire.classList.remove("hidden");
    hud();
    updateEncounterHud();
    showBanner();
    if (N7_CAMPAIGN) {
      const opening = NeonCampaign.n7Dialogue("sectorStart", {level: currentLevel + 1});
      if (opening) showStoryTransmission("N-7", opening);
    }
    tone(540 + currentLevel * 22, 0.11, "triangle", 0.07);
    window.AnalyticsManager?.track("game_start", { level: currentLevel + 1 });
    window.AnalyticsManager?.track("level_start", { level: currentLevel + 1, continued: false });
  }

  function pauseGame() {
    if (state !== "playing") return;
    setState("paused");
    hideWarning();
    overlay(ui.paused);
  }

  function resumeGame() {
    if (state !== "paused") return;
    setState("playing");
    overlay();
    last = performance.now();
    resumeAudio();
  }

  function goHome() {
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("menu");
    ui.hud.classList.add("hidden");
    ui.powerHud.classList.add("hidden");
    ui.fire.classList.add("hidden");
    ui.banner.classList.remove("show");
    hideWarning();
    hideStoryTransmission();
    overlay(ui.menu);
    updateMenu();
  }

  function registerRun() {
    const games = Math.trunc(Math.max(0, storage.getNumber(KEYS.games, 0))) + 1;
    storage.set(KEYS.games, games);
    const interval = Math.trunc(Math.max(0, Number(window.MONETIZATION_CONFIG?.native?.interstitialEveryRuns) || 0));
    if (interval > 0 && games % interval === 0) window.AdBridge?.showInterstitial?.().catch(() => {});
  }

  function saveScore() {
    let saved = true;
    if (score > bestScore()) saved = storage.set(KEYS.best, score) && saved;
    const bests = getLevelBest();
    if (score > (+bests[currentLevel + 1] || 0)) {
      bests[currentLevel + 1] = score;
      saved = storage.setJSON(KEYS.levelBest, bests) && saved;
    }
    return saved;
  }

  function completeLevel() {
    if (state !== "playing") return;
    if (N7_CAMPAIGN && (!encounterDirector?.finished || items.some(isThreat))) return;
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("complete");
    hideWarning();
    ui.hud.classList.add("hidden");
    ui.powerHud.classList.add("hidden");
    ui.fire.classList.add("hidden");
    ui.banner.classList.remove("show");

    const missed = energySpawned - collected;
    const earned = hull >= 90 && missed <= Math.ceil(energyBudget * 0.1) ? 3 : hull >= 55 ? 2 : 1;
    const starsMap = getStars();
    const oldStars = +(starsMap[currentLevel + 1] || 0);
    starsMap[currentLevel + 1] = Math.max(oldStars, earned);
    let progressSaved = storage.setJSON(KEYS.stars, starsMap);

    const oldUnlocked = getUnlocked();
    let newlyUnlocked = false;
    if (currentLevel + 1 === oldUnlocked && oldUnlocked < LEVELS.length) {
      progressSaved = storage.set(KEYS.unlocked, oldUnlocked + 1) && progressSaved;
      newlyUnlocked = true;
    }

    progressSaved = saveScore() && progressSaved;
    registerRun();
    ui.completeLabel.textContent = currentLevel === LEVELS.length - 1 ? "CAMPAÑA ACTUAL COMPLETADA" : N7_CAMPAIGN ? "RUTA SUPERADA" : "SECTOR SUPERADO";
    ui.completeTitle.textContent = currentLevel === LEVELS.length - 1
      ? (N7_CAMPAIGN ? "Has atravesado las cien rutas" : "Has estabilizado el Colapso Neon")
      : `${level().name} completado`;
    ui.starsAwarded.innerHTML = [1, 2, 3]
      .map((value) => `<span class="${value <= earned ? "" : "off"}">★</span>`)
      .join("");
    ui.levelScore.textContent = score;
    ui.levelHull.textContent = `${Math.ceil(hull)}%`;
    ui.maxCombo.textContent = `x${maxCombo}`;
    ui.unlockMessage.textContent = currentLevel === LEVELS.length - 1
      ? (N7_CAMPAIGN ? "Puedes volver a cada ruta para mejorar tus estrellas" : "La siguiente expansión podrá añadir más sectores")
      : newlyUnlocked
        ? `${N7_CAMPAIGN ? "Ruta" : "Sector"} ${currentLevel + 2} desbloqueado`
        : "Puedes repetirlo para mejorar el resultado";
    ui.nextLevel.classList.toggle("hidden", currentLevel === LEVELS.length - 1);
    overlay(ui.complete);
    tone(760, 0.12, "triangle", 0.08);
    setTimeout(() => tone(980, 0.18, "sine", 0.07), 120);
    vibrate([30, 40, 70]);
    updateMenu();
    if (!progressSaved) toast("No se pudo guardar el progreso en este dispositivo");
    window.AnalyticsManager?.track("level_complete", {
      level: currentLevel + 1, score, hull: Math.ceil(hull), stars: earned, maxCombo
    });
    window.AnalyticsManager?.track("progression", { unlocked: getUnlocked(), totalStars: totalStars() });
  }

  function finishGame(reason = "hull") {
    if (state === "gameover" || state === "complete") return;
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("gameover");
    supplyFailed = reason === "supply";
    hideWarning();
    ui.hud.classList.add("hidden");
    ui.powerHud.classList.add("hidden");
    ui.fire.classList.add("hidden");
    ui.banner.classList.remove("show");
    const oldBest = bestScore();
    const scoreSaved = saveScore();
    ui.result.textContent = supplyFailed ? "No quedan núcleos suficientes" : "El casco ha cedido";
    ui.supplyStatus.textContent = supplyFailed
      ? `Recuperaste ${collected} de ${level().goal}. El suministro del sector era limitado.`
      : "";
    if (score > oldBest) ui.newBest.classList.remove("hidden");
    ui.final.textContent = score;
    ui.reward.classList.toggle("hidden", continued || supplyFailed);
    overlay(ui.over);
    registerRun();
    tone(110, 0.30, "sawtooth", 0.06);
    updateMenu();
    if (!scoreSaved) toast("No se pudo guardar el récord en este dispositivo");
    window.AnalyticsManager?.track("death", { level: currentLevel + 1, score, elapsed: Math.round(elapsed) });
    window.AnalyticsManager?.track("death_reason", { level: currentLevel + 1, reason });
  }

  function resumeReward() {
    if (continued || state !== "gameover" || supplyFailed) return false;
    runToken += 1;
    cancelSupplyFailureTimer();
    // Restaura por completo el estado visual y lógico tras la destrucción.
    // La pantalla de derrota se abre después de la animación final, por lo que
    // hay que cancelar cualquier resto de ese estado antes de volver a jugar.
    hull = Math.max(hull, 35);
    continued = true;
    setState("playing");
    last = performance.now();
    playerVisible = true;
    destructionTimer = 0;
    destructionStage = 0;
    shake = 0;
    flash = 0;
    stormPulse = 0;

    // La nave reaparece centrada y estable; conserva daño medio al 35 %,
    // pero no reutiliza inclinaciones ni efectos de la explosión anterior.
    player.x = clamp(player.x, 78, W - 78);
    player.target = player.x;
    player.drift = 0;
    damageSmokeSide = 1;
    damageSmokeLocked = true;
    impactReactionTimer = 0;
    impactReactionSide = 1;
    storyTimer = 0;
    levelOneShockwave = 0;
    hideStoryTransmission();

    // Elimina amenazas próximas y todos los residuos visuales de destrucción.
    items = items.filter((item) => !isThreat(item) || item.y < H * 0.38);
    gates = [];
    clearTransientEffects();
    tractorTarget = null;
    gateCountdown = level().gate ? 7 : Infinity;

    // Breve protección para evitar morir de nuevo en el mismo instante.
    powers.shield = Math.max(powers.shield, 4);
    ammo = Math.max(ammo, 1);
    manualShotCooldown = 0;

    overlay();
    ui.hud.classList.remove("hidden");
    ui.powerHud.classList.remove("hidden");
    ui.fire.classList.remove("hidden");
    hud();
    updatePowerHud();
    showBanner();
    window.AnalyticsManager?.track("continue_used", { level: currentLevel + 1, elapsed: Math.round(elapsed) });
    return true;
  }
  function availablePowers() {
    const available = ["shield"];
    if (currentLevel >= 1) available.push("tractor");
    if (currentLevel >= 2) available.push("slow");
    if (currentLevel >= 3) available.push("double");
    if (currentLevel >= 4) available.push("phaser");
    return available;
  }

  function choosePower() {
    if (repairAllowance > repairSpawned && hull <= 66 && Math.random() < 0.18) {
      repairSpawned++;
      return "repair";
    }
    const available = availablePowers();
    return available[(Math.random() * available.length) | 0];
  }

  function meteorShape() {
    const count = 8 + ((Math.random() * 3) | 0);
    return Array.from({ length: count }, () => 0.72 + Math.random() * 0.34);
  }

  function makeCraters(radius) {
    return Array.from({ length: 2 + ((Math.random() * 3) | 0) }, () => ({
      x: (Math.random() - 0.5) * radius * 0.85,
      y: (Math.random() - 0.5) * radius * 0.7,
      r: radius * (0.10 + Math.random() * 0.14)
    }));
  }

  function chooseThreatType(lv) {
    return lv.threatPool[(Math.random() * lv.threatPool.length) | 0];
  }

  function chooseThreatSprite(type, radius, special) {
    if (special === "comet") return "comet";
    if (type === "meteor") {
      if (radius < 36) return Math.random() < 0.55 ? "meteorSmall" : "meteorSmallAlt";
      if (radius < 40) return Math.random() < 0.58 ? "meteorMedium" : "meteorMediumAlt";
      return "meteorLarge";
    }
    if (type === "satellite") return "satellite";
    const basic = ["debrisMetal", "debrisPanel"];
    const hot = ["debrisHot0", "debrisHot1"];
    const pool = currentLevel >= 4 ? basic.concat(hot) : basic;
    return pool[(Math.random() * pool.length) | 0];
  }

  function threatHitPoints(type, spriteKey, special) {
    if (special === "comet") return 2;
    if (type === "satellite") return 3;
    if (type === "debris") {
      if (spriteKey === "debrisPanel") return 1;
      if (spriteKey && spriteKey.includes("Hot")) return 3;
      return 2;
    }
    if (spriteKey === "meteorLarge") return 3;
    if (spriteKey && spriteKey.includes("Medium")) return 2;
    return 1;
  }

  function createThreat(type, lv) {
    const x = 55 + Math.random() * (W - 110);
    let radius = 36;
    let speed = (245 + Math.random() * 110) * lv.speed;
    let damage = 34;
    let special = "";

    if (type === "debris") {
      radius = 27 + Math.random() * 8;
      speed *= 1.08;
      damage = 24;
    } else if (type === "satellite") {
      radius = 39 + Math.random() * 7;
      speed *= 0.92;
      damage = 31;
    } else {
      radius = 33 + Math.random() * 9;
    }

    if (lv.hazard === "dart" && type === "meteor" && Math.random() < 0.34) {
      speed *= 1.72;
      special = "comet";
      damage = 42;
    }
    if (lv.hazard === "overdrive") speed *= 1.10;
    if (lv.hazard === "final" && type === "meteor" && Math.random() < 0.35) {
      speed *= 1.45;
      special = "comet";
      damage = 42;
    }

    const spriteKey = chooseThreatSprite(type, radius, special);
    const hitPoints = threatHitPoints(type, spriteKey, special);

    return {
      type,
      x,
      baseX: x,
      y: -85,
      r: radius,
      s: speed,
      damage,
      rot: special === "comet" ? 0 : Math.random() * Math.PI * 2,
      rs: special === "comet" ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * (type === "debris" ? 6 : 3.6),
      p: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      amp: 35 + Math.random() * 55,
      special,
      alpha: 1,
      spriteKey,
      hp: hitPoints,
      maxHp: hitPoints,
      shape: type === "meteor" ? meteorShape() : null,
      craters: type === "meteor" ? makeCraters(radius) : null,
      variant: type === "debris" ? (Math.random() < 0.5 ? "panel" : "strut") : ""
    };
  }

  function addItem() {
    const lv = level();
    const roll = Math.random();
    const canEnergy = energySpawned < energyBudget;
    const canPower = powerSpawned < powerBudget;
    let type;

    if (roll < lv.meteor) {
      type = chooseThreatType(lv);
    } else if (canPower && roll < lv.meteor + lv.power) {
      type = choosePower();
      powerSpawned++;
    } else if (canEnergy) {
      type = "energy";
      energySpawned++;
    } else {
      type = chooseThreatType(lv);
    }

    if (["meteor", "debris", "satellite"].includes(type)) {
      const threat = createThreat(type, lv);
      // Una formación activa reserva su abertura desde la parte superior de la
      // pantalla hasta la nave. Las amenazas que nacen dentro no llegan a
      // insertarse y, por tanto, nunca pueden taponar la única ruta válida.
      if (!threatOverlapsProtectedCorridor(threat)) items.push(threat);
      return;
    }

    const isPower = type !== "energy";
    // Los núcleos se reducen un 15 % para que la nave conserve protagonismo visual.
    const radius = isPower ? 30 : 22;
    const x = 55 + Math.random() * (W - 110);
    items.push({
      type,
      x,
      baseX: x,
      y: -70,
      r: radius,
      s: (245 + Math.random() * 110) * lv.speed,
      rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 3.6,
      p: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      amp: 35 + Math.random() * 55,
      special: "",
      alpha: 1
    });
  }

  function pointInsidePolygon(x, y, polygon) {
    let inside = false;
    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
      const [xCurrent, yCurrent] = polygon[current];
      const [xPrevious, yPrevious] = polygon[previous];
      const crosses = (yCurrent > y) !== (yPrevious > y) &&
        x < (xPrevious - xCurrent) * (y - yCurrent) / ((yPrevious - yCurrent) || 0.000001) + xCurrent;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function squaredDistanceToSegment(px, py, ax, ay, bx, by) {
    const segmentX = bx - ax;
    const segmentY = by - ay;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    if (lengthSquared === 0) {
      const dx = px - ax;
      const dy = py - ay;
      return dx * dx + dy * dy;
    }
    const projection = clamp(((px - ax) * segmentX + (py - ay) * segmentY) / lengthSquared, 0, 1);
    const closestX = ax + projection * segmentX;
    const closestY = ay + projection * segmentY;
    const dx = px - closestX;
    const dy = py - closestY;
    return dx * dx + dy * dy;
  }

  function collisionCircles(item) {
    if (item.type === "energy") return [{ x: 0, y: 0, r: item.r * 1.10 }];
    if (!isThreat(item)) {
      const factor = item.type === "repair" ? 1.05 : (item.type === "tractor" || item.type === "phaser") ? 0.92 : 1.0;
      return [{ x: 0, y: 0, r: item.r * factor }];
    }
    if (item.special === "comet") return [{ x: 0, y: 0, r: item.r * 0.94 }];
    if (item.type === "satellite") {
      return [
        { x: -item.r * 0.92, y: 0, r: item.r * 0.58 },
        { x: 0, y: 0, r: item.r * 0.70 },
        { x: item.r * 0.92, y: 0, r: item.r * 0.58 }
      ];
    }
    if (item.type === "debris" && item.spriteKey === "debrisPanel") {
      return [
        { x: -item.r * 0.68, y: 0, r: item.r * 0.62 },
        { x: 0, y: 0, r: item.r * 0.66 },
        { x: item.r * 0.68, y: 0, r: item.r * 0.62 }
      ];
    }
    if (item.type === "debris") return [{ x: 0, y: 0, r: item.r * 1.08 }];
    if (item.spriteKey === "meteorLarge") return [{ x: 0, y: 0, r: item.r * 1.22 }];
    if (item.spriteKey && item.spriteKey.includes("Medium")) return [{ x: 0, y: 0, r: item.r * 1.12 }];
    return [{ x: 0, y: 0, r: item.r * 1.04 }];
  }

  function circleHitsShip(localX, localY, radius) {
    if (localX + radius < -112 || localX - radius > 112 ||
        localY + radius < -151 || localY - radius > 98) return false;
    if (pointInsidePolygon(localX, localY, SHIP_COLLISION_OUTLINE)) return true;
    const radiusSquared = radius * radius;
    for (let index = 0; index < SHIP_COLLISION_OUTLINE.length; index++) {
      const [ax, ay] = SHIP_COLLISION_OUTLINE[index];
      const [bx, by] = SHIP_COLLISION_OUTLINE[(index + 1) % SHIP_COLLISION_OUTLINE.length];
      if (squaredDistanceToSegment(localX, localY, ax, ay, bx, by) <= radiusSquared) return true;
    }
    return false;
  }

  function hit(item) {
    const cos = Math.cos(item.rot || 0);
    const sin = Math.sin(item.rot || 0);
    for (const circle of collisionCircles(item)) {
      const offsetX = circle.x * cos - circle.y * sin;
      const offsetY = circle.x * sin + circle.y * cos;
      const localX = item.x + offsetX - player.x;
      const localY = item.y + offsetY - player.y;
      if (circleHitsShip(localX, localY, circle.r)) return true;
    }
    return false;
  }

  function addParticle(seed) {
    if (parts.length >= EFFECT_LIMITS.particles) return false;
    parts.push(particlePool.acquire(seed));
    return true;
  }

  function clearTransientEffects() {
    for (const part of parts) particlePool.release(part);
    parts.length = 0;
    shots.length = 0;
    rings.length = 0;
    explosions.length = 0;
    impactEffects.length = 0;
  }

  function cancelSupplyFailureTimer() {
    if (supplyFailureTimer) clearTimeout(supplyFailureTimer);
    supplyFailureTimer = 0;
    supplyFailureScheduled = false;
  }

  function burst(x, y, count, kind) {
    const factor = settings.effectsQuality === "high" ? 1 : settings.effectsQuality === "normal" ? 0.72 : 0.42;
    const amount = Math.ceil(count * factor);
    for (let index = 0; index < amount; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 65 + Math.random() * 245;
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.55,
        size: 3 + Math.random() * 8,
        kind
      });
    }
  }

  function directionalBurst(x, y, targetX, targetY, count, kind = "cyan") {
    const factor = settings.effectsQuality === "high" ? 1 : settings.effectsQuality === "normal" ? 0.76 : 0.46;
    const amount = Math.ceil(count * factor);
    const baseAngle = Math.atan2(targetY - y, targetX - x);
    for (let index = 0; index < amount; index++) {
      const angle = baseAngle + (Math.random() - 0.5) * 0.62;
      const speed = 150 + Math.random() * 280;
      addParticle({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.34 + Math.random() * 0.34,
        size: 2 + Math.random() * 5,
        kind
      });
    }
  }

  function engineTrail() {
    if (!settings.effects || state !== "playing" || Math.random() > 0.48) return;
    const hardTurn = Math.abs(player.target + player.drift - player.x) > 65;
    const x = player.x + (hardTurn ? (player.target > player.x ? -1 : 1) * 28 : (Math.random() - 0.5) * 30) * SHIP_VISUAL.scale;
    const y = player.y + 61 * SHIP_VISUAL.scale;
    addParticle({
      x, y, vx: (Math.random() - 0.5) * 28, vy: 125 + Math.random() * 120,
      life: 0.22 + Math.random() * 0.24, size: 2 + Math.random() * 4, kind: "cyan"
    });
  }

  function pulseRing(x, y, color, max = 85, duration = 0.48, style = "single") {
    if (rings.length >= EFFECT_LIMITS.rings) rings.shift();
    rings.push({ x, y, color, max, duration, life: duration, style });
  }

  function addExplosion(x, y, scale = 1, duration = 0.52) {
    if (explosions.length >= EFFECT_LIMITS.explosions) explosions.shift();
    explosions.push({ x, y, scale, life: duration, duration, rotation: Math.random() * Math.PI * 2 });
  }

  function addImpactEffect(x, y, scale = 1, angle = 0) {
    if (impactEffects.length >= EFFECT_LIMITS.impacts) impactEffects.shift();
    impactEffects.push({ x, y, scale, angle, life: 0.24, duration: 0.24, variant: (Math.random() * SPRITE_GROUPS.impact.length) | 0 });
  }

  function activatePower(type, item) {
    const durations = { shield: 7, tractor: 8, slow: 6, double: 7, phaser: 7 };
    if (type === "repair") {
      const restored = Math.min(34, 100 - hull);
      hull += restored;
      burst(item.x, item.y, 24, "green");
      pulseRing(item.x, item.y, "#78ff9c", 105, 0.62);
      toast(`Drone de reparación: +${Math.round(restored)}%`);
      tone(690, 0.18, "sine", 0.08);
      vibrate(30);
      hud();
      window.AnalyticsManager?.track("ability_used", { level: currentLevel + 1, ability: "repair" });
      return;
    }

    powers[type] = Math.max(powers[type], durations[type]);
    const effectKind = type === "double" ? "gold" : type === "phaser" ? "green" : "violet";
    const effectColor = type === "double" ? "#ffe66c" : type === "phaser" ? "#78ff9c" : "#c58aff";
    burst(item.x, item.y, 20, effectKind);
    pulseRing(item.x, item.y, effectColor, 105, 0.58);
    const names = {
      shield: "Escudo operativo",
      tractor: "Rayo tractor conectado",
      slow: "Estabilizador activo",
      double: "Sobrecarga de núcleos",
      phaser: "Phaser automático activo"
    };
    toast(names[type]);
    tone(type === "phaser" ? 920 : 780, 0.15, "triangle", 0.075);
    vibrate(22);
    updatePowerHud();
    window.AnalyticsManager?.track("ability_used", { level: currentLevel + 1, ability: type });
  }

  function damageShip(amount, x = player.x, y = player.y) {
    if (state === "destroying" || state === "gameover") return;
    const impactAngle = Math.atan2(y - player.y, x - player.x);
    const damageResult = NeonCore.resolveDamage({ hull, amount, shieldActive: powers.shield > 0 });
    if (damageResult.absorbed) {
      score += 10;
      burst(x, y, 18, "cyan");
      pulseRing(x, y, "#62fff1", 90, 0.42);
      addImpactEffect(x, y, 0.85, impactAngle);
      tone(230, 0.08, "square", 0.045);
      return;
    }

    hull = damageResult.hull;
    impactReactionTimer = 0.32;
    impactReactionSide = x >= player.x ? 1 : -1;
    if (!damageSmokeLocked && hull < 67) {
      damageSmokeSide = x >= player.x ? 1 : -1;
      damageSmokeLocked = true;
    }
    combo = 1;
    comboTimer = 0;
    shake = 16;
    flash = 0.26;
    burst(x, y, 28, "red");
    pulseRing(x, y, "#ff496f", 110, 0.48);
    addImpactEffect(x, y, 1.05, impactAngle);
    tone(95, 0.22, "sawtooth", 0.08);
    vibrate([45, 35, 60]);
    hud();

    if (damageResult.destroyed) {
      // Estado intermedio: detiene la partida, centra visualmente la nave y deja
      // terminar la destrucción antes de abrir la pantalla de derrota.
      setState("destroying");
      destructionTimer = 1.18;
      destructionStage = 0;
      playerVisible = true;
      player.target = player.x;
      player.drift = 0;
      tractorTarget = null;
      for (const key in powers) powers[key] = 0;
      ui.powerHud.classList.add("hidden");
      hideWarning();
      items = [];
      gates = [];
      shots.length = 0;
      addExplosion(player.x, player.y + SHIP_VISUAL.centerYOffset, 1.65, 0.92);
      addImpactEffect(player.x - 34 * SHIP_VISUAL.scale, player.y - 8 * SHIP_VISUAL.scale, 1.15, -0.5);
      addImpactEffect(player.x + 36 * SHIP_VISUAL.scale, player.y + 4 * SHIP_VISUAL.scale, 1.15, 0.5);
      burst(player.x, player.y - 20 * SHIP_VISUAL.scale, 42, "red");
      tone(70, 0.48, "sawtooth", 0.095);
      vibrate([70, 35, 90, 40, 120]);
    }
  }

  function collectItem(item) {
    if (item.type === "energy") {
      const multiplier = powers.double > 0 ? 2 : 1;
      score += 10 * combo * multiplier;
      collected++;
      combo = Math.min(12, combo + 1);
      maxCombo = Math.max(maxCombo, combo);
      comboTimer = 2.35;
      directionalBurst(item.x, item.y, player.x, player.y - 18, 20, "cyan");
      burst(item.x, item.y, 9, "cyan");
      pulseRing(item.x, item.y, "#55f6ff", 76, 0.38, "capture");
      stormPulse = Math.max(stormPulse, 0.08);
      tone(500 + combo * 28, 0.06, "triangle", 0.055);
      if (collected >= level().goal) completeLevel();
    } else if (isThreat(item)) {
      damageShip(item.damage, item.x, item.y);
    } else {
      activatePower(item.type, item);
    }
    hud();
  }

  function updateEffects(dt) {
    for (let index = parts.length - 1; index >= 0; index--) {
      const part = parts[index];
      part.life -= dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vx *= Math.pow(0.04, dt);
      part.vy = part.vy * Math.pow(0.12, dt) + 160 * dt;
      if (part.life <= 0) {
        parts.splice(index, 1);
        particlePool.release(part);
      }
    }
    for (let index = shots.length - 1; index >= 0; index--) {
      const shot = shots[index];
      shot.life -= dt;
      if (shot.life <= 0) {
        if (shot.hit) {
          burst(shot.impactX, shot.impactY, shot.destroyed ? 18 : 8, "green");
          pulseRing(shot.impactX, shot.impactY, "#78ff9c", shot.destroyed ? 70 : 42, 0.28);
          if (shot.destroyed) addExplosion(shot.impactX, shot.impactY, shot.impactScale || 1);
          addImpactEffect(shot.impactX, shot.impactY, shot.destroyed ? 0.8 : 0.55);
        }
        shots.splice(index, 1);
      }
    }
    for (let index = rings.length - 1; index >= 0; index--) {
      rings[index].life -= dt;
      if (rings[index].life <= 0) rings.splice(index, 1);
    }
    for (let index = explosions.length - 1; index >= 0; index--) {
      explosions[index].ch01Animator?.update(dt);
      explosions[index].life -= dt;
      if (explosions[index].life <= 0) explosions.splice(index, 1);
    }
    for (let index = impactEffects.length - 1; index >= 0; index--) {
      impactEffects[index].life -= dt;
      if (impactEffects[index].life <= 0) impactEffects.splice(index, 1);
    }
  }

  function selectTractorTarget() {
    const candidates = items
      .filter((item) => !isThreat(item) && item.y < player.y && Math.hypot(item.x - player.x, item.y - player.y) < 360)
      .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    tractorTarget = candidates[0] || null;
  }

  function animateN7EnemyHit(target, destroyed) {
    const animator = target.n7?.ch01Animator;
    if (!animator) return;
    animator.request(destroyed ? "destroy" : "hurt");
    if (destroyed) {
      if (explosions.length >= EFFECT_LIMITS.explosions) explosions.shift();
      explosions.push({x: target.x, y: target.y, ch01Animator: animator,
        life: .49, duration: .49, scale: 1, rotation: 0});
    }
  }

  function firePhaser() {
    phaserCooldown = 0.34;
    cameraKickY = Math.max(cameraKickY, 3.5);
    shake = Math.max(shake, 2.2);
    const candidates = items
      .filter(isThreat)
      .filter((item) => item.y < player.y && Math.abs(item.x - player.x) < 95)
      .sort((a, b) => b.y - a.y);
    const target = candidates[0];

    if (target) {
      target.hp = Math.max(0, (target.hp || 1) - 1);
      const destroyed = target.hp <= 0;
      animateN7EnemyHit(target, destroyed);
      if (shots.length >= EFFECT_LIMITS.shots) shots.shift();
      shots.push({
        x1: player.x, y1: player.y - SHIP_VISUAL.phaserMuzzleOffset, x2: target.x, y2: target.y,
        life: 0.20, duration: 0.20, hit: true, destroyed, impactX: target.x, impactY: target.y,
        impactScale: target.type === "satellite" ? 1.25 : target.r > 39 ? 1.15 : 0.85,
        kind: "phaser"
      });
      score += destroyed ? (target.type === "satellite" ? 12 : 8) : 2;
      if (destroyed) {
        const targetIndex = items.indexOf(target);
        if (targetIndex >= 0) items.splice(targetIndex, 1);
      }
      tone(destroyed ? 980 : 760, 0.07, "sawtooth", 0.045);
    } else {
      if (shots.length >= EFFECT_LIMITS.shots) shots.shift();
      shots.push({ x1: player.x, y1: player.y - SHIP_VISUAL.phaserMuzzleOffset, x2: player.x, y2: 90, life: 0.18, duration: 0.18, hit: false, kind: "phaser" });
    }
  }

  function fireManualShot() {
    if (state !== "playing" || ammo <= 0 || manualShotCooldown > 0 || warpTimer > 0) return false;

    ammo -= 1;
    manualShotCooldown = 0.28;
    cameraKickY = Math.max(cameraKickY, 5);
    shake = Math.max(shake, 3.2);

    const candidates = items
      .filter(isThreat)
      .filter((item) => item.y < player.y && Math.abs(item.x - player.x) < 145)
      .sort((a, b) => {
        const aAim = Math.abs(a.x - player.x) * 1.4 + (player.y - a.y) * 0.08;
        const bAim = Math.abs(b.x - player.x) * 1.4 + (player.y - b.y) * 0.08;
        return aAim - bAim;
      });
    const target = candidates[0];
    const muzzleY = player.y - SHIP_VISUAL.phaserMuzzleOffset;

    if (target) {
      target.hp = Math.max(0, (target.hp || 1) - 1);
      const destroyed = target.hp <= 0;
      animateN7EnemyHit(target, destroyed);
      if (shots.length >= EFFECT_LIMITS.shots) shots.shift();
      shots.push({
        x1: player.x, y1: muzzleY, x2: target.x, y2: target.y,
        life: 0.24, duration: 0.24, hit: true, destroyed,
        impactX: target.x, impactY: target.y,
        impactScale: target.type === "satellite" ? 1.2 : target.r > 39 ? 1.1 : 0.82,
        kind: "pulse"
      });
      score += destroyed ? (target.type === "satellite" ? 15 : 10) : 3;
      if (destroyed) {
        const targetIndex = items.indexOf(target);
        if (targetIndex >= 0) items.splice(targetIndex, 1);
      }
      tone(destroyed ? 1040 : 820, 0.09, "square", 0.055);
    } else {
      if (shots.length >= EFFECT_LIMITS.shots) shots.shift();
      shots.push({
        x1: player.x, y1: muzzleY, x2: player.x, y2: 86,
        life: 0.22, duration: 0.22, hit: false, kind: "pulse"
      });
      tone(780, 0.07, "square", 0.045);
    }

    vibrate(18);
    updateAmmoHud();
    window.AnalyticsManager?.track("ability_used", {
      ability: "pulse_shot", level: currentLevel + 1, ammoRemaining: ammo
    });
    return true;
  }

  function checkSupplyFailure() {
    if (supplyFailureScheduled || energySpawned < energyBudget || collected >= level().goal) return;
    const energyRemaining = items.some((item) => item.type === "energy");
    if (!energyRemaining) {
      supplyFailureScheduled = true;
      const scheduledRun = runToken;
      supplyFailureTimer = setTimeout(() => {
        supplyFailureTimer = 0;
        supplyFailureScheduled = false;
        if (scheduledRun === runToken && state === "playing" && collected < level().goal && !items.some((item) => item.type === "energy")) {
          finishGame("supply");
        }
      }, 420);
    }
  }
  function createFormationSide(start, end, side) {
    const pieces = [];
    let edge = side < 0 ? end : start;
    let guard = 0;

    while ((side < 0 ? edge > start : edge < end) && guard < 24) {
      const size = 46 + Math.random() * 18;
      const step = size * (0.68 + Math.random() * 0.10);
      // Usa el radio de la caja rotada, no solo media anchura: incluso una
      // pieza a 45° queda fuera del pasillo visual.
      const halfExtent = size * Math.SQRT1_2;
      const x = side < 0 ? edge - halfExtent : edge + halfExtent;
      pieces.push({
        x,
        y: (Math.random() - 0.5) * 18,
        size,
        halfExtent,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.42,
        spriteKey: FORMATION_SPRITE_KEYS[(Math.random() * FORMATION_SPRITE_KEYS.length) | 0],
        side
      });
      edge += side * step;
      guard++;
    }
    return pieces;
  }

  function createDebrisFormation(gapXOverride) {
    const gapW = clamp(282 - currentLevel * 4, 246, 282);
    const margin = gapW / 2 + 32;
    const randomGapX = margin + Math.random() * (W - margin * 2);
    const gapX = Number.isFinite(gapXOverride) ? clamp(gapXOverride, margin, W - margin) : randomGapX;
    const gapLeft = gapX - gapW / 2;
    const gapRight = gapX + gapW / 2;
    return {
      kind: "debris-formation",
      y: -62,
      h: 50,
      s: (210 + currentLevel * 10) * level().speed,
      gapX,
      gapW,
      checked: false,
      phase: Math.random() * Math.PI * 2,
      pieces: [
        ...createFormationSide(-12, gapLeft, -1),
        ...createFormationSide(gapRight, W + 12, 1)
      ]
    };
  }

  function gateProtectsPassage(gate) {
    return Boolean(gate && gate.y + gate.h / 2 >= CORRIDOR_TOP &&
      gate.y - gate.h / 2 <= player.y + player.h * 0.80);
  }

  function gateCorridorBounds(gate) {
    return {
      left: gate.gapX - gate.gapW / 2,
      right: gate.gapX + gate.gapW / 2,
      top: CORRIDOR_TOP,
      bottom: player.y + CORRIDOR_BOTTOM_PADDING
    };
  }

  function threatBounds(item) {
    const cos = Math.cos(item.rot || 0);
    const sin = Math.sin(item.rot || 0);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const circle of collisionCircles(item)) {
      const x = item.x + circle.x * cos - circle.y * sin;
      const y = item.y + circle.x * sin + circle.y * cos;
      left = Math.min(left, x - circle.r);
      right = Math.max(right, x + circle.r);
      top = Math.min(top, y - circle.r);
      bottom = Math.max(bottom, y + circle.r);
    }
    return { left, right, top, bottom };
  }

  function threatOverlapsGateCorridor(item, gate) {
    if (!isThreat(item) || !gateProtectsPassage(gate)) return false;
    const threat = threatBounds(item);
    const corridor = gateCorridorBounds(gate);
    return threat.right > corridor.left && threat.left < corridor.right &&
      threat.bottom > corridor.top && threat.top < corridor.bottom;
  }

  function threatOverlapsProtectedCorridor(item) {
    return gates.some((gate) => threatOverlapsGateCorridor(item, gate));
  }

  function clearProtectedCorridors(onlyGate = null) {
    const protectedGates = onlyGate ? [onlyGate] : gates;
    let removed = 0;
    items = items.filter((item) => {
      if (!isThreat(item) || !protectedGates.some((gate) => threatOverlapsGateCorridor(item, gate))) return true;
      removed++;
      if (item === tractorTarget) tractorTarget = null;
      return false;
    });
    return removed;
  }

  function spawnGate() {
    const formation = createDebrisFormation();
    gates.push(formation);
    clearProtectedCorridors(formation);
    tone(180, 0.12, "square", 0.045);
  }

  function updateGateSystem(dt, scale) {
    const interval = level().gate;
    if (!interval) {
      hideWarning();
      return;
    }

    gateCountdown -= dt;
    if (gateCountdown <= 2.4 && gateCountdown > 0) {
      ui.warningText.textContent = `Pasillo seguro en ${gateCountdown.toFixed(1)} s`;
      ui.hazardWarning.classList.add("show");
    } else if (gateCountdown > 2.4) {
      hideWarning();
    }

    if (gateCountdown <= 0) {
      spawnGate();
      hideWarning();
      gateCountdown = interval * (0.88 + Math.random() * 0.24);
    }

    for (let index = gates.length - 1; index >= 0; index--) {
      const gate = gates[index];
      gate.y += gate.s * dt * scale;
      const crossing = gate.y + gate.h / 2 >= player.y - player.h * 0.34 &&
        gate.y - gate.h / 2 <= player.y + player.h * 0.34;

      if (crossing && !gate.checked) {
        gate.checked = true;
        const gapLeft = gate.gapX - gate.gapW / 2;
        const gapRight = gate.gapX + gate.gapW / 2;
        const safe = player.x - SHIP_COLLISION_HALF_WIDTH > gapLeft && player.x + SHIP_COLLISION_HALF_WIDTH < gapRight;
        if (safe) {
          score += 25;
          pulseRing(player.x, player.y, level().accent, 120, 0.48);
          tone(760, 0.08, "triangle", 0.055);
          toast("Paso orbital limpio: +25");
        } else {
          damageShip(38, player.x, player.y - 15);
        }
        hud();
      }

      if (gate.y - gate.h / 2 > H + 30) gates.splice(index, 1);
    }
  }

  function update(dt) {
    const lv = level();
    const starBoost = state === "playing" ? lv.speed * (warpTimer > 0 ? 5.5 : 1) : 1;
    visualSpeed += (starBoost - visualSpeed) * Math.min(1, dt * 4.5);
    for (const star of stars) {
      star.y += star.s * star.layer * dt * starBoost;
      if (star.y > H + 8) {
        star.y = -8;
        star.x = Math.random() * W;
      }
    }
    for (const dust of spaceDust) {
      dust.y += dust.s * dt * starBoost;
      dust.x += dust.drift * dt;
      if (dust.y > H + 12) { dust.y = -12; dust.x = Math.random() * W; }
      if (dust.x < -20) dust.x = W + 20;
      if (dust.x > W + 20) dust.x = -20;
    }
    for (const mote of foregroundParticles) {
      mote.y += mote.s * dt * Math.max(0.8, starBoost);
      mote.x += mote.drift * dt;
      if (mote.y > H + 28) { mote.y = -28; mote.x = Math.random() * W; }
    }
    updateHudVisual(dt);
    cameraKickX *= Math.pow(0.001, dt);
    cameraKickY *= Math.pow(0.001, dt);

    if (state === "destroying") {
      elapsed += dt;
      destructionTimer = Math.max(0, destructionTimer - dt);

      if (destructionTimer < 0.88 && destructionStage === 0) {
        destructionStage = 1;
        playerVisible = false;
        addExplosion(player.x - 42 * SHIP_VISUAL.scale, player.y - 18 * SHIP_VISUAL.scale, 1.05, 0.62);
        addExplosion(player.x + 46 * SHIP_VISUAL.scale, player.y + 8 * SHIP_VISUAL.scale, 1.12, 0.66);
        burst(player.x, player.y, 34, "gold");
      }
      if (destructionTimer < 0.48 && destructionStage === 1) {
        destructionStage = 2;
        addExplosion(player.x, player.y - 10 * SHIP_VISUAL.scale, 1.35, 0.58);
        pulseRing(player.x, player.y, "#ff9b42", 170, 0.55);
      }

      updateEffects(dt);
      if (destructionTimer <= 0) finishGame("hull");
      return;
    }

    if (state !== "playing") {
      updateEffects(dt);
      return;
    }

    elapsed += dt;
    if (manualShotCooldown > 0) {
      const previousCooldown = manualShotCooldown;
      manualShotCooldown = Math.max(0, manualShotCooldown - dt);
      if (previousCooldown > 0 && manualShotCooldown === 0) updateAmmoHud();
    }
    updateLevelStory(dt);
    if (levelOneShockwave > 0) levelOneShockwave = Math.max(0, levelOneShockwave - dt);
    impactReactionTimer = Math.max(0, impactReactionTimer - dt);
    if (lv.hazard === "gravity") player.drift = Math.sin(elapsed * 0.8) * 22;
    else player.drift = 0;

    const follow = 9 + (settings.sensitivity / 100) * 8;
    player.x += (player.target + player.drift - player.x) * Math.min(1, dt * follow);
    player.x = clamp(player.x, player.w / 2 + 18, W - player.w / 2 - 18);
    engineTrail();

    if (warpTimer > 0) {
      warpTimer = Math.max(0, warpTimer - dt);
      if (warpTimer === 0) updateAmmoHud();
      updateEffects(dt);
      return;
    }

    if (encounterDirector) {
      encounterDirector.advance(dt, (item) => {
        items.push(item);
        if (item.type === "energy") energySpawned++;
      });
      if (encounterDirector.wave !== encounterWave) {
        encounterWave = encounterDirector.wave;
        ammo = MAX_AMMO;
        updateAmmoHud();
        updateEncounterHud();
      }
    } else {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        addItem();
        let interval = lv.spawn * (0.86 + Math.random() * 0.30);
        if (lv.hazard === "storm" && Math.sin(elapsed * 0.75) > 0.68) interval *= 0.58;
        if (lv.hazard === "final" && Math.sin(elapsed * 0.95) > 0.60) interval *= 0.62;
        spawnTimer = Math.max(0.23, interval);
      }
    }

    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) combo = 1;
    }

    for (const key in powers) {
      if (powers[key] > 0) powers[key] = Math.max(0, powers[key] - dt);
    }
    if (powers.tractor <= 0) tractorTarget = null;
    updatePowerHud();

    if (powers.phaser > 0) {
      phaserCooldown -= dt;
      if (phaserCooldown <= 0) firePhaser();
    }

    if (shake > 0) shake = Math.max(0, shake - dt * 48);
    if (flash > 0) flash -= dt;
    if ((lv.hazard === "storm" || lv.hazard === "final") && Math.random() < dt * 0.22) stormPulse = 0.18;
    if (stormPulse > 0) stormPulse -= dt;

    if (powers.tractor > 0 && (!tractorTarget || !items.includes(tractorTarget))) selectTractorTarget();

    const scale = powers.slow > 0 ? 0.50 : 1;
    updateGateSystem(dt, scale);

    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index];
      item.y += item.s * dt * scale;
      item.rot += item.rs * dt;
      item.p += dt * 4;
      if (item.n7) NeonCampaign.advanceEnemy(item, dt * scale, player, (shot) => items.push(shot));

      const wave = lv.hazard === "wave" || lv.hazard === "chaos" || lv.hazard === "final";
      if (wave && isThreat(item)) {
        item.x = item.baseX + Math.sin(elapsed * (lv.hazard === "chaos" ? 3.2 : 2.15) + item.phase) * item.amp;
      }
      if (lv.hazard === "phantom" && isThreat(item)) {
        item.alpha = 0.20 + 0.80 * Math.abs(Math.sin(elapsed * 1.8 + item.phase));
      } else {
        item.alpha = 1;
      }

      // La comprobación se repite después de aplicar ondas y órbitas: una
      // amenaza nacida fuera tampoco puede serpentear dentro del pasillo.
      if (isThreat(item) && threatOverlapsProtectedCorridor(item)) {
        items.splice(index, 1);
        if (item === tractorTarget) tractorTarget = null;
        continue;
      }

      if (powers.tractor > 0 && item === tractorTarget) {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        item.x += dx * dt * 5.8;
        item.y += dy * dt * 5.8;
      }

      if (hit(item)) {
        collectItem(item);
        const actualIndex = items.indexOf(item);
        if (actualIndex >= 0) items.splice(actualIndex, 1);
        if (item === tractorTarget) tractorTarget = null;
        if (state !== "playing") break;
        continue;
      }

      if (item.y - item.r > H) {
        if (item.type === "energy") {
          combo = 1;
          comboTimer = 0;
        }
        items.splice(index, 1);
        if (item === tractorTarget) tractorTarget = null;
        hud();
      }
    }

    checkSupplyFailure();
    if (encounterDirector?.finished && collected >= level().goal && !items.some(isThreat)) completeLevel();
    if (hull < 67 && settings.effects && Math.random() < dt * (hull < 34 ? 7 : 2.4)) {
      burst(
        player.x + (Math.random() - 0.5) * 70 * SHIP_VISUAL.scale,
        player.y + (Math.random() - 0.5) * 35 * SHIP_VISUAL.scale,
        1,
        hull < 34 ? "red" : "gold"
      );
    }
    updateEffects(dt);
  }
  function rounded(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function drawPlanet(x, y, radius, colors, ring = false) {
    ctx.save();
    if (ring) {
      ctx.strokeStyle = colors[1] + "88";
      ctx.lineWidth = Math.max(5, radius * 0.10);
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.55, radius * 0.34, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    const gradient = ctx.createRadialGradient(x - radius * 0.34, y - radius * 0.32, radius * 0.05, x, y, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.38, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowColor = colors[1] + "66";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSectorEnvironment(t, lv) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    if (lv.scene === "cronos") {
      // The authored Chronos painting is the scene. Avoid artificial bars
      // and geometry that obscure the station, especially on small screens.
      const sx = W * 0.50;
      const sy = H * 0.40;
      const pulse = 1 + Math.sin(t * 0.0025) * 0.025;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 178 * pulse);
      glow.addColorStop(0, "rgba(214,250,255,.48)");
      glow.addColorStop(0.18, "rgba(78,199,255,.22)");
      glow.addColorStop(0.55, "rgba(50,105,210,.065)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H * 0.55);
    } else if (lv.scene === "orbit") {
      drawPlanet(W * 0.78, H * 0.19, 105, ["#e9ffff", "#4eb9ff", "#15245f"], true);
    } else if (lv.scene === "rift") {
      const band = ctx.createLinearGradient(W * 0.28, 0, W * 0.72, H);
      band.addColorStop(0, "rgba(65,190,255,0)");
      band.addColorStop(0.46, "rgba(58,166,255,.18)");
      band.addColorStop(0.52, "rgba(158,249,255,.28)");
      band.addColorStop(0.58, "rgba(70,81,255,.13)");
      band.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    } else if (lv.scene === "belt") {
      ctx.globalAlpha = 0.22;
      for (let index = 0; index < 9; index++) {
        const x = (index * 103 + 42) % W;
        const y = H * 0.15 + ((index * 157 + t * 0.018) % (H * 0.55));
        ctx.fillStyle = index % 2 ? "#b77355" : "#84605e";
        ctx.beginPath();
        ctx.arc(x, y, 7 + (index % 4) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (lv.scene === "ion" && (N7_CAMPAIGN || currentLevel !== 3)) {
      ctx.strokeStyle = "rgba(191,126,255,.34)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#a96cff";
      for (let index = 0; index < 3; index++) {
        const y = H * (0.18 + index * 0.17) + Math.sin(t * 0.003 + index) * 28;
        ctx.beginPath();
        ctx.moveTo(-20, y);
        ctx.bezierCurveTo(W * 0.25, y - 70, W * 0.62, y + 75, W + 30, y - 25);
        ctx.stroke();
      }
    } else if (lv.scene === "crimson" && (N7_CAMPAIGN || currentLevel !== 4)) {
      drawPlanet(W * 0.19, H * 0.16, 92, ["#fff5c7", "#ff744f", "#761737"], false);
      ctx.globalAlpha = 0.14 + Math.sin(t * 0.004) * 0.03;
      ctx.fillStyle = "#ff4965";
      ctx.beginPath();
      ctx.arc(W * 0.19, H * 0.16, 145, 0, Math.PI * 2);
      ctx.fill();
    } else if (lv.scene === "gravity" && (N7_CAMPAIGN || currentLevel !== 5)) {
      const x = W * 0.74;
      const y = H * 0.20;
      ctx.strokeStyle = "rgba(80,255,208,.48)";
      ctx.lineWidth = 12;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#47ffd1";
      ctx.beginPath();
      ctx.ellipse(x, y, 135, 38, -0.25 + Math.sin(t * 0.0005) * 0.04, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#010207";
      ctx.beginPath();
      ctx.arc(x, y, 61, 0, Math.PI * 2);
      ctx.fill();
    } else if (lv.scene === "ghost" && (N7_CAMPAIGN || currentLevel !== 6)) {
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = "#b99bea";
      ctx.fillRect(W * 0.10, H * 0.17, W * 0.80, 12);
      ctx.fillRect(W * 0.27, H * 0.12, 18, 115);
      ctx.fillRect(W * 0.68, H * 0.10, 16, 132);
      const fog = ctx.createLinearGradient(0, H * 0.18, W, H * 0.65);
      fog.addColorStop(0, "rgba(174,132,232,0)");
      fog.addColorStop(0.5, "rgba(174,132,232,.11)");
      fog.addColorStop(1, "rgba(174,132,232,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.12, W, H * 0.62);
    } else if (lv.scene === "overdrive" && (N7_CAMPAIGN || currentLevel !== 7)) {
      ctx.globalAlpha = 0.20;
      ctx.strokeStyle = "#fff27b";
      ctx.lineWidth = 2;
      for (let index = 0; index < 12; index++) {
        const x = (index * 67 + t * 0.08) % (W + 180) - 90;
        ctx.beginPath();
        ctx.moveTo(x, H * 0.08);
        ctx.lineTo(x - 130, H * 0.70);
        ctx.stroke();
      }
    } else if (lv.scene === "dark" && (N7_CAMPAIGN || currentLevel !== 8)) {
      drawPlanet(W * 0.73, H * 0.18, 112, ["#6d2d73", "#27102f", "#05030a"], false);
      ctx.fillStyle = "rgba(255,92,233,.12)";
      ctx.beginPath();
      ctx.arc(W * 0.73, H * 0.18, 130, 0, Math.PI * 2);
      ctx.fill();
    } else if (lv.scene === "collapse" && (N7_CAMPAIGN || currentLevel !== 9)) {
      const x = W * 0.50;
      const y = H * 0.20;
      ctx.strokeStyle = "rgba(93,255,236,.58)";
      ctx.lineWidth = 9;
      ctx.shadowBlur = 28;
      ctx.shadowColor = "#66fff1";
      ctx.beginPath();
      ctx.ellipse(x, y, 128 + Math.sin(t * 0.003) * 7, 54, t * 0.0005, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(220,87,255,.45)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(x, y, 92, 92, -t * 0.0007, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function background(t) {
    const lv = level();
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, lv.top);
    gradient.addColorStop(0.42, lv.mid);
    gradient.addColorStop(0.78, "#050712");
    gradient.addColorStop(1, "#02030a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // NEON VISUAL PASS: broad animated nebula ribbons replace the flat empty void.
    // Deterministic phase by sector, bounded gradients, no additional image downloads.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sectorHue = [195, 220, 28, 265, 355, 280, 175, 30, 250, 325][currentLevel] ?? 195;
    const visualTier = settings.effectsQuality === "low" ? 1 : 3;
    for (let ribbon = 0; ribbon < visualTier; ribbon++) {
      const phase = t * (0.00006 + ribbon * 0.000018) + currentLevel * 1.41 + ribbon * 2.3;
      const cx = W * (0.52 + Math.sin(phase) * 0.31);
      const cy = H * (0.22 + ribbon * 0.19 + Math.cos(phase * 0.8) * 0.075);
      const radius = W * (0.49 + ribbon * 0.11);
      const cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const hue = (sectorHue + ribbon * 34) % 360;
      cloud.addColorStop(0, `hsla(${hue},95%,57%,0.18)`);
      cloud.addColorStop(0.35, `hsla(${hue},90%,43%,0.075)`);
      cloud.addColorStop(1, `hsla(${hue},80%,30%,0)`);
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    if (!N7_CAMPAIGN && currentLevel === 1) ensureSprite(SPRITES.atlasBackground);
    if (!N7_CAMPAIGN && currentLevel === 2) ensureSprite(SPRITES.vulkarBackground);
    if (!N7_CAMPAIGN && currentLevel === 3) ensureSprite(SPRITES.magmaTunnelBackground);
    if (!N7_CAMPAIGN && currentLevel === 4) ensureSprite(SPRITES.cryonWhiteoutBackground);
    if (!N7_CAMPAIGN && currentLevel === 5) ensureSprite(SPRITES.cryonRiftBackground);
    if (!N7_CAMPAIGN && currentLevel === 6) ensureSprite(SPRITES.aetherEchoBackground);
    if (!N7_CAMPAIGN && currentLevel === 7) ensureSprite(SPRITES.aetherThresholdBackground);
    if (!N7_CAMPAIGN && currentLevel === 8) ensureSprite(SPRITES.titanGraveyardBackground);
    if (!N7_CAMPAIGN && currentLevel === 9) ensureSprite(SPRITES.chronosCollapseBackground);
    if (lv.scene === "cronos" && spriteReady(SPRITES.cronosBackground)) {
      const image = SPRITES.cronosBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      ctx.save();
      ctx.globalAlpha = 0.62;
      ctx.drawImage(image, (W - width) / 2, (H - height) / 2 - H * 0.08, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(3,9,24,.06)");
      readability.addColorStop(0.45, "rgba(3,8,20,.32)");
      readability.addColorStop(1, "rgba(2,3,10,.76)");
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 1 && spriteReady(SPRITES.atlasBackground)) {
      const image = SPRITES.atlasBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.04;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00018) * W * 0.018;
      const driftY = Math.cos(t * 0.00011) * H * 0.009;
      ctx.save();
      ctx.globalAlpha = 0.86;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 - H * 0.025 + driftY,
        width, height);
      ctx.globalAlpha = 1;
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(3,8,23,.12)");
      readability.addColorStop(0.58, "rgba(2,7,20,.16)");
      readability.addColorStop(1, "rgba(2,4,11,.36)");
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 2 && spriteReady(SPRITES.vulkarBackground)) {
      const image = SPRITES.vulkarBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.025;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00014) * W * 0.012;
      const driftY = Math.cos(t * 0.00009) * H * 0.008;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(18,4,4,.08)");
      readability.addColorStop(0.48, "rgba(14,3,4,.19)");
      readability.addColorStop(1, "rgba(9,2,3,.42)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 3 && spriteReady(SPRITES.magmaTunnelBackground)) {
      const image = SPRITES.magmaTunnelBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.025;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00013) * W * 0.012;
      const driftY = Math.cos(t * 0.00008) * H * 0.008;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(14,4,3,.12)");
      readability.addColorStop(0.55, "rgba(12,3,3,.18)");
      readability.addColorStop(1, "rgba(10,2,3,.42)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 4 && spriteReady(SPRITES.cryonWhiteoutBackground)) {
      const image = SPRITES.cryonWhiteoutBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.035;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00011) * W * 0.011;
      const driftY = Math.cos(t * 0.00008) * H * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.86;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(4,10,28,.12)");
      readability.addColorStop(0.53, "rgba(4,12,31,.13)");
      readability.addColorStop(1, "rgba(2,6,19,.43)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 5 && spriteReady(SPRITES.cryonRiftBackground)) {
      const image = SPRITES.cryonRiftBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.035;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00010) * W * 0.010;
      const driftY = Math.cos(t * 0.00007) * H * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.87;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(3,11,29,.1)");
      readability.addColorStop(0.50, "rgba(3,11,29,.13)");
      readability.addColorStop(1, "rgba(2,7,20,.47)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 6 && spriteReady(SPRITES.aetherEchoBackground)) {
      const image = SPRITES.aetherEchoBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.035;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00010) * W * 0.013;
      const driftY = Math.cos(t * 0.00007) * H * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.86;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(9,3,23,.08)");
      readability.addColorStop(0.55, "rgba(8,3,21,.16)");
      readability.addColorStop(1, "rgba(4,2,15,.43)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 7 && spriteReady(SPRITES.aetherThresholdBackground)) {
      const image = SPRITES.aetherThresholdBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.035;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00009) * W * 0.011;
      const driftY = Math.cos(t * 0.00007) * H * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.87;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(12,4,25,.10)");
      readability.addColorStop(0.55, "rgba(11,4,26,.16)");
      readability.addColorStop(1, "rgba(4,2,17,.43)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 8 && spriteReady(SPRITES.titanGraveyardBackground)) {
      const image = SPRITES.titanGraveyardBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.035;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00010) * W * 0.012;
      const driftY = Math.cos(t * 0.00007) * H * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.87;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(10,5,14,.09)");
      readability.addColorStop(0.55, "rgba(7,3,12,.14)");
      readability.addColorStop(1, "rgba(3,2,8,.38)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (!N7_CAMPAIGN && currentLevel === 9 && spriteReady(SPRITES.chronosCollapseBackground)) {
      const image = SPRITES.chronosCollapseBackground;
      const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * 1.035;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const driftX = Math.sin(t * 0.00012) * W * 0.013;
      const driftY = Math.cos(t * 0.00008) * H * 0.006;
      ctx.save();
      ctx.globalAlpha = 0.86;
      ctx.drawImage(image, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
      const readability = ctx.createLinearGradient(0, 0, 0, H);
      readability.addColorStop(0, "rgba(3,5,19,.26)");
      readability.addColorStop(0.50, "rgba(3,5,19,.10)");
      readability.addColorStop(1, "rgba(1,3,12,.39)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = readability;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Start the authored VFX download while the level is still in its menu;
    // the scripted reactor accident happens thirty-one seconds into play.
    if (!N7_CAMPAIGN && currentLevel === 0) ensureSprite(SPRITES.chronosShockwave);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const nebula = ctx.createRadialGradient(W * 0.5, H * 0.27, 0, W * 0.5, H * 0.27, W * 0.78);
    nebula.addColorStop(0, lv.accent + "42");
    nebula.addColorStop(0.28, lv.accent + "15");
    nebula.addColorStop(1, "#0000");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    // Capa lejana: puntos diminutos, lentos y con un parpadeo apenas visible.
    for (const star of stars) {
      const streak = visualSpeed > 2.4 ? Math.min(18, (visualSpeed - 2.2) * star.layer * 3.8) : 0;
      ctx.globalAlpha = star.a * (0.70 + 0.30 * Math.sin(t * 0.001 + star.x));
      ctx.fillStyle = star.tint;
      ctx.beginPath();
      if (streak > 1) ctx.roundRect(star.x - star.r * 0.5, star.y - streak, Math.max(0.7, star.r), streak + star.r, star.r);
      else ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawSectorEnvironment(t, lv);

    // Capa media: polvo y restos minúsculos con una deriva independiente.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const dust of spaceDust) {
      ctx.globalAlpha = dust.a;
      ctx.fillStyle = Math.floor(dust.x + dust.y) % 3 ? lv.accent : "#b5c8dd";
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Primer plano: partículas escasas, rápidas y suavizadas por glow.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 12;
    ctx.shadowColor = lv.accent;
    for (const mote of foregroundParticles) {
      ctx.globalAlpha = mote.a * (state === "playing" ? 1 : 0.45);
      ctx.fillStyle = "#dffcff";
      ctx.beginPath();
      ctx.ellipse(mote.x, mote.y, mote.r * 0.55, mote.r * (1.2 + Math.min(2.2, visualSpeed * 0.3)), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.46, W * 0.2, W * 0.5, H * 0.46, W * 0.95);
    vignette.addColorStop(0.6, "#0000");
    vignette.addColorStop(1, "rgba(0,0,0,.45)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (!N7_CAMPAIGN && currentLevel === 0 && levelOneShockwave > 0) {
      const progress = clamp(1 - levelOneShockwave / 0.62, 0, 1);
      const sx = W * 0.50;
      const sy = H * 0.40;
      const strength = Math.sin(progress * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const size = Math.min(W, H) * (0.36 + progress * 1.45);
      ctx.globalAlpha = strength * 0.62;
      if (spriteReady(SPRITES.chronosShockwave)) {
        const atlas = SPRITES.chronosShockwave;
        const cellWidth = atlas.naturalWidth / 2;
        const cellHeight = atlas.naturalHeight / 2;
        const frame = Math.min(3, Math.floor(progress * 4));
        ctx.drawImage(atlas, (frame % 2) * cellWidth, Math.floor(frame / 2) * cellHeight,
          cellWidth, cellHeight, sx - size / 2, sy - size / 2, size, size);
      } else if (spriteReady(SPRITES.shieldEffect)) {
        // A short-lived fallback if the atlas is still downloading.
        ctx.drawImage(SPRITES.shieldEffect, sx - size / 2, sy - size / 2, size, size);
      }
      ctx.restore();
    }

    if (stormPulse > 0) {
      ctx.fillStyle = `rgba(255,255,255,${stormPulse * 0.28})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawWarp() {
    if (warpTimer <= 0) return;
    const progress = clamp(1 - warpTimer / 1.25, 0, 1);
    const intensity = Math.sin(progress * Math.PI);
    const centerX = W * 0.5;
    const centerY = H * 0.42;
    const count = settings.effectsQuality === "high" ? 30 : settings.effectsQuality === "normal" ? 23 : 14;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = level().accent;
    ctx.shadowColor = level().accent;
    ctx.shadowBlur = 8;
    ctx.lineCap = "round";
    for (let index = 0; index < count; index++) {
      const angle = index * 2.3999632297 + (index % 3) * 0.19;
      const seed = ((index * 37) % count) / count;
      const travel = (seed + progress * (0.72 + (index % 5) * 0.035)) % 1;
      const radius = 42 + Math.pow(travel, 1.65) * Math.max(W, H) * 0.72;
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      const x = centerX + directionX * radius;
      const y = centerY + directionY * radius;
      const length = 5 + travel * travel * 38;
      ctx.globalAlpha = intensity * (0.12 + travel * 0.42);
      ctx.lineWidth = 0.8 + travel * 1.4;
      ctx.beginPath();
      ctx.moveTo(x - directionX * length, y - directionY * length);
      ctx.lineTo(x + directionX * length * 0.18, y + directionY * length * 0.18);
      ctx.stroke();
    }
    ctx.globalAlpha = intensity * 0.34;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24 + progress * 74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTractorCable() {
    if (powers.tractor <= 0 || !tractorTarget) return;
    const startX = player.x;
    const startY = player.y - SHIP_VISUAL.tractorMuzzleOffset;
    const dx = tractorTarget.x - startX;
    const dy = tractorTarget.y - startY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const frame = frameFrom("tractor", Math.floor(elapsed * 13));
    const intensity = clamp(1 - distance / 430, 0.25, 1);
    const targetWidth = Math.max(20, tractorTarget.r * 1.25);

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 18 + intensity * 18;
    ctx.shadowColor = "#45eaff";

    const volume = ctx.createLinearGradient(0, 0, distance, 0);
    volume.addColorStop(0, `rgba(210,255,255,${0.18 + intensity * 0.18})`);
    volume.addColorStop(0.48, `rgba(57,225,255,${0.08 + intensity * 0.12})`);
    volume.addColorStop(1, `rgba(102,137,255,${0.22 + intensity * 0.16})`);
    ctx.fillStyle = volume;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(distance, -targetWidth);
    ctx.lineTo(distance, targetWidth);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(distance, -targetWidth); ctx.lineTo(distance, targetWidth); ctx.lineTo(0, 9); ctx.closePath();
    ctx.clip();
    for (let index = 0; index < 13; index++) {
      const travel = (elapsed * (0.82 + intensity * 0.55) + index / 13) % 1;
      const x = distance * (1 - travel);
      const spread = 6 + (x / Math.max(1, distance)) * targetWidth * 0.72;
      const y = Math.sin(index * 2.43 + elapsed * 7.5) * spread;
      ctx.globalAlpha = 0.22 + intensity * 0.55;
      ctx.fillStyle = index % 3 ? "#7df5ff" : "#ffffff";
      ctx.beginPath(); ctx.arc(x, y, 1.4 + intensity * 1.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = `rgba(210,255,255,${0.22 + intensity * 0.42})`;
    ctx.lineWidth = 1.2 + intensity;
    for (let arc = 0; arc < 2; arc++) {
      ctx.beginPath();
      for (let segment = 0; segment <= 8; segment++) {
        const x = distance * segment / 8;
        const y = Math.sin(elapsed * 18 + segment * 2.2 + arc * 3.1) * (4 + x / Math.max(1, distance) * targetWidth * 0.34);
        if (segment) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    if (frame) {
      ctx.globalAlpha = 0.18 + intensity * 0.16;
      ctx.drawImage(frame, 0, -targetWidth, distance, targetWidth * 2);
    } else {
      ctx.strokeStyle = "#55eaff";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -elapsed * 60;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(distance, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.58 + intensity * 0.35;
    ctx.fillStyle = "#eaffff";
    ctx.beginPath(); ctx.arc(0, 0, 5 + intensity * 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function playerFrameState(t) {
    const desiredDelta = hull < 34 || state === "destroying" ? 0 : player.target + player.drift - player.x;
    const movingHard = Math.abs(desiredDelta) > 72;
    const moving = Math.abs(desiredDelta) > 16;
    let frameIndex;
    let flipX = false;

    if (hull < 34 || state === "destroying") {
      // El estado crítico y la destrucción usan una nave neutra para impedir que
      // una reacción de impacto quede congelada.
      frameIndex = 2;
    } else if (impactReactionTimer > 0) {
      // El frame 5 se usa solo durante la reacción breve de daño. Su orientación
      // sigue el lado golpeado y se cancela al reiniciar, continuar o agotarse.
      frameIndex = 5;
      flipX = impactReactionSide < 0;
    } else if (movingHard) {
      frameIndex = 4;
      flipX = desiredDelta > 0;
    } else if (moving) {
      frameIndex = 3;
      flipX = desiredDelta > 0;
    } else {
      const idleSequence = [0, 1, 2, 1];
      frameIndex = idleSequence[Math.floor(t / 115) % idleSequence.length];
    }

    return { frameIndex, flipX };
  }

  function drawPlayer(t) {
    if (state === "destroying" && !playerVisible) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    const bob = state === "destroying" ? 0 : Math.sin(t * 0.004) * 1.8;
    const { frameIndex, flipX } = playerFrameState(t);

    if (powers.shield > 0) {
      const shieldFrame = Math.sin(t * 0.012) > 0.45 ? SPRITES.shieldEffect : SPRITES.shieldIdle;
      ctx.save();
      ctx.translate(0, -26 * SHIP_VISUAL.scale + bob);
      ctx.globalCompositeOperation = "screen";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#4cffe9";
      drawImageCentered(shieldFrame, SHIP_VISUAL.shieldSize, SHIP_VISUAL.shieldSize, elapsed * 0.08, 0.42);
      ctx.restore();
    }

    const turnStrength = clamp(Math.abs(player.target + player.drift - player.x) / 95, 0, 1);
    const enginePulse = 0.78 + Math.sin(t * 0.026) * 0.16 + turnStrength * 0.20;
    ctx.save();
    ctx.translate(0, 53 * SHIP_VISUAL.scale + bob);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#56efff";
    for (const engineX of [-27, 27]) {
      const plume = ctx.createLinearGradient(engineX, 0, engineX, 48 * SHIP_VISUAL.scale * enginePulse);
      plume.addColorStop(0, "rgba(255,255,255,.96)");
      plume.addColorStop(0.25, "rgba(92,242,255,.82)");
      plume.addColorStop(1, "rgba(42,116,255,0)");
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo((engineX - 6) * SHIP_VISUAL.scale, 0);
      ctx.lineTo(engineX * SHIP_VISUAL.scale, 48 * SHIP_VISUAL.scale * enginePulse);
      ctx.lineTo((engineX + 6) * SHIP_VISUAL.scale, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const frame = frameFrom("ship", frameIndex);
    ctx.save();
    const criticalJitter = hull < 18 && state !== "destroying" ? Math.sin(elapsed * 19) * 1.6 : 0;
    ctx.translate(criticalJitter, bob + SHIP_VISUAL.centerYOffset);
    ctx.shadowBlur = 22;
    ctx.shadowColor = level().accent;
    if (!drawImageCentered(frame, SHIP_VISUAL.spriteSize, SHIP_VISUAL.spriteSize, 0, 1, flipX)) {
      if (!drawImageCentered(SPRITES.shipFallback, SHIP_VISUAL.fallbackWidth, SHIP_VISUAL.fallbackHeight)) {
        ctx.save();
        ctx.scale(SHIP_VISUAL.scale, SHIP_VISUAL.scale);
        const body = ctx.createLinearGradient(-75, -55, 75, 55);
        body.addColorStop(0, "#325ee0");
        body.addColorStop(0.48, "#79e7ff");
        body.addColorStop(1, "#7040e8");
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(0, -72); ctx.lineTo(34, -24); ctx.lineTo(88, 18); ctx.lineTo(48, 38);
        ctx.lineTo(0, 52); ctx.lineTo(-48, 38); ctx.lineTo(-88, 18); ctx.lineTo(-34, -24);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    if (hull < 67 && state !== "destroying") {
      // Los tres fotogramas comparten anclaje y estilo. El daño progresa mediante
      // tamaño/opacidad y una animación lenta que no cambia de motor.
      const smokeSequence = [0, 1, 2, 1];
      const smoke = frameFrom("smoke", smokeSequence[Math.floor(elapsed * 4.5) % smokeSequence.length]);
      if (smoke) {
        const severity = clamp((67 - hull) / 66, 0.12, 1);
        const sideX = damageSmokeSide * 40 * SHIP_VISUAL.scale;
        const driftY = (elapsed * (7 + severity * 5)) % 14;
        const pulse = 0.78 + severity * 0.38 + Math.sin(elapsed * 2.1) * 0.035;

        ctx.save();
        ctx.translate(sideX + Math.sin(elapsed * 1.25) * 2.5, 38 * SHIP_VISUAL.scale - driftY);
        ctx.globalAlpha = 0.24 + severity * 0.48;
        ctx.rotate(damageSmokeSide * 0.035 + Math.sin(elapsed * 0.9) * 0.035);
        ctx.scale(pulse * SHIP_VISUAL.scale, pulse * SHIP_VISUAL.scale);
        ctx.drawImage(smoke, -56, -50, 112, 100);
        ctx.restore();

        if (hull < 20) {
          ctx.save();
          ctx.translate(sideX * 0.78 - damageSmokeSide * 16 * SHIP_VISUAL.scale, 22 * SHIP_VISUAL.scale - ((elapsed * 8) % 10));
          ctx.globalAlpha = 0.30 + severity * 0.22;
          ctx.scale((0.70 + severity * 0.20) * SHIP_VISUAL.scale, (0.70 + severity * 0.20) * SHIP_VISUAL.scale);
          ctx.drawImage(smoke, -48, -43, 96, 86);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  function itemVisualAlpha(item) {
    return item.alpha * clamp((item.y - 95) / 85, 0, 1);
  }

  function drawEnergy(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    const distanceToShip = Math.hypot(player.x - item.x, player.y - item.y);
    const proximity = state === "playing" ? clamp(1 - distanceToShip / 330, 0, 1) : 0;
    const pulseSequence = [0,1,2,3,4,5,4,3,2,1];
    const frame = frameFrom("core", pulseSequence[Math.floor((elapsed * 9 + item.phase) % pulseSequence.length)]);
    const breath = 0.5 + 0.5 * Math.sin(elapsed * 3.4 + item.phase);
    const pulse = 1 + breath * 0.055 + proximity * 0.08;
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 24 + proximity * 24;
    ctx.shadowColor = "#33f4ff";

    const halo = ctx.createRadialGradient(0, 0, item.r * 0.15, 0, 0, item.r * (2.35 + proximity * 0.45));
    halo.addColorStop(0, `rgba(255,255,255,${0.62 + proximity * 0.25})`);
    halo.addColorStop(0.18, `rgba(98,246,255,${0.42 + proximity * 0.24})`);
    halo.addColorStop(0.54, "rgba(38,190,255,.16)");
    halo.addColorStop(1, "rgba(20,86,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, item.r * (2.35 + proximity * 0.45), 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = `rgba(126,247,255,${0.30 + breath * 0.25 + proximity * 0.25})`;
    ctx.lineWidth = 1.5 + proximity * 1.5;
    ctx.beginPath(); ctx.arc(0, 0, item.r * 1.35, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha *= 0.72;
    ctx.beginPath(); ctx.arc(0, 0, item.r * 1.72, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha /= 0.72;

    const crystalReady = spriteReady(SPRITES.croniumFragment);
    if (frame && crystalReady) {
      drawImageCentered(frame, item.r * 2.85, item.r * 2.85, -item.rot * 0.08, 0.34 + breath * 0.18);
    }
    if (crystalReady) {
      drawImageCentered(SPRITES.croniumFragment, item.r * 2.62, item.r * 2.62, item.rot * 0.06, 0.94);
    } else if (!drawImageCentered(frame, item.r * 2.85, item.r * 2.85, item.rot * 0.10)) {
      const gradient = ctx.createRadialGradient(-7, -8, 2, 0, 0, item.r);
      gradient.addColorStop(0, "#fff"); gradient.addColorStop(0.2, "#caffff");
      gradient.addColorStop(0.48, "#63efff"); gradient.addColorStop(1, "#1554d8");
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, item.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.96)";
    ctx.shadowBlur = 18 + proximity * 16;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(3, item.r * 0.22), 0, Math.PI * 2); ctx.fill();

    if (proximity > 0.05 && settings.effects) {
      for (let index = 0; index < 5; index++) {
        const travel = (elapsed * (0.65 + index * 0.06) + item.phase + index * 0.19) % 1;
        const radius = item.r * (2.7 - travel * 2.1);
        const angle = item.phase + index * 2.17 + elapsed * (1.2 + proximity);
        ctx.globalAlpha = proximity * (0.28 + travel * 0.55);
        ctx.fillStyle = index % 2 ? "#bfffff" : "#4ceaff";
        ctx.beginPath(); ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 1.2 + proximity * 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCh01Frame(animator) {
    if (!animator || !spriteReady(SPRITES.ch01)) return false;
    const frame = animator.getFrame();
    const {x, y, width, height} = frame.rect;
    ctx.shadowBlur = 17;
    ctx.shadowColor = frame.damaged ? "#ff6079" : "#50e8ff";
    ctx.drawImage(SPRITES.ch01, x, y, width, height,
      -frame.drawSize * frame.pivot.x, -frame.drawSize * frame.pivot.y,
      frame.drawSize, frame.drawSize);
    return true;
  }

  function drawMeteor(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);

    if (item.n7Projectile) {
      ctx.fillStyle = "#ff7bce";
      ctx.shadowColor = "#ff4bbb";
      ctx.shadowBlur = 12;
      ctx.fillRect(-4, -12, 8, 24);
      ctx.restore();
      return;
    }
    if (item.n7?.telegraph > 0) {
      ctx.strokeStyle = `rgba(255,130,100,${item.n7.telegraph})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(0, 160); ctx.stroke();
    }
    if (drawCh01Frame(item.n7?.ch01Animator)) {
      ctx.restore();
      return;
    }

    if (item.special === "comet" && spriteReady(SPRITES.comet)) {
      const size = item.r * 4.2;
      const frame = Math.floor(elapsed * 11 + item.phase) % 8;
      const sourceWidth = SPRITES.comet.naturalWidth / 4;
      const sourceHeight = SPRITES.comet.naturalHeight / 2;
      const sourceX = (frame % 4) * sourceWidth;
      const sourceY = Math.floor(frame / 4) * sourceHeight;
      ctx.rotate(item.rot + Math.PI / 2);
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#ff754f";
      // Ocho fotogramas reales: la cola, el humo y las fisuras cambian sin
      // modificar la silueta de colisión del núcleo rocoso.
      ctx.drawImage(
        SPRITES.comet,
        sourceX, sourceY, sourceWidth, sourceHeight,
        -size * 0.66, -size * 0.50, size, size
      );
      ctx.restore();
      return;
    }

    ctx.rotate(item.rot);
    const sprite = SPRITES[item.spriteKey] || SPRITES.meteorMedium;
    const sizeFactor = item.spriteKey === "meteorLarge" ? 2.95 : item.spriteKey && item.spriteKey.includes("Small") ? 2.45 : 2.70;
    const size = item.r * sizeFactor;
    ctx.shadowBlur = 17;
    ctx.shadowColor = "#ff754f";
    if (!drawImageCentered(sprite, size, size)) {
      ctx.fillStyle = "#43363a";
      ctx.beginPath(); ctx.arc(0, 0, item.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawDebris(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    ctx.shadowBlur = 16;
    ctx.shadowColor = item.spriteKey && item.spriteKey.includes("Hot") ? "#ff5b3d" : "#73a8ff";
    const sprite = SPRITES[item.spriteKey] || SPRITES.debrisMetal;
    const size = item.r * (item.spriteKey === "debrisPanel" ? 3.15 : 2.90);
    if (!drawImageCentered(sprite, size, size)) {
      ctx.strokeStyle = "#91a0b4"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-item.r, -item.r * 0.7); ctx.lineTo(item.r, item.r * 0.7); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSatellite(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#8ab7ff";
    const size = item.r * 3.55;
    if (!drawImageCentered(SPRITES.satellite, size, size)) {
      ctx.fillStyle = "#718096";
      rounded(-item.r * 0.34, -item.r * 0.68, item.r * 0.68, item.r * 1.36, 10); ctx.fill();
    }
    ctx.restore();
  }

  const POWER_STYLE = {
    shield: { color: "#5fffe8", dark: "#0d554d", glyph: "S" },
    tractor: { color: "#ff71f6", dark: "#5b1455", glyph: "T" },
    slow: { color: "#7ea9ff", dark: "#183d73", glyph: "E" },
    double: { color: "#ffe66c", dark: "#665714", glyph: "2X" },
    repair: { color: "#ff718f", dark: "#66172d", glyph: "+" },
    phaser: { color: "#8aff98", dark: "#185b24", glyph: "ϟ" }
  };

  function drawPower(item) {
    const style = POWER_STYLE[item.type];
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    const bob = Math.sin(item.p * 1.35) * 3;
    ctx.translate(0, bob);
    ctx.shadowBlur = 28;
    ctx.shadowColor = style.color;

    let usedSprite = false;
    if (item.type === "repair") {
      usedSprite = drawImageCentered(SPRITES.repairDrone, 78, 78, Math.sin(item.p) * 0.06);
    } else if (item.type === "shield") {
      usedSprite = drawImageCentered(SPRITES.shieldIdle, 72, 72, item.rot * 0.15, 0.88);
    } else if (item.type === "phaser") {
      const frame = frameFrom("phaser", Math.floor(elapsed * 12));
      usedSprite = drawImageCentered(frame, 62, 34, -Math.PI / 2);
    } else if (item.type === "tractor") {
      const frame = frameFrom("tractor", Math.floor(elapsed * 12));
      usedSprite = drawImageCentered(frame, 70, 28, Math.PI / 2);
    }

    if (!usedSprite) {
      ctx.rotate(item.rot * 0.28);
      ctx.beginPath();
      for (let index = 0; index < 6; index++) {
        const angle = index * Math.PI / 3 - Math.PI / 6;
        const x = Math.cos(angle) * 30; const y = Math.sin(angle) * 30;
        if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
      const gradient = ctx.createLinearGradient(-30, -30, 30, 30);
      gradient.addColorStop(0, style.color); gradient.addColorStop(1, style.dark);
      ctx.fillStyle = gradient; ctx.fill();
      ctx.strokeStyle = "#ffffffc9"; ctx.lineWidth = 2; ctx.stroke();
      ctx.rotate(-item.rot * 0.28);
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${style.glyph.length > 1 ? 18 : 27}px Inter,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(style.glyph, 0, 1);
    }
    ctx.restore();
  }

  function drawGate(gate) {
    const gapLeft = gate.gapX - gate.gapW / 2;
    const gapRight = gate.gapX + gate.gapW / 2;
    ctx.save();
    ctx.translate(0, gate.y);

    // La antigua viga sólida se representa ahora como basura espacial
    // compactada. Las piezas se crean una sola vez y nunca invaden el hueco.
    for (const piece of gate.pieces || []) {
      ctx.save();
      ctx.translate(piece.x, piece.y + Math.sin(elapsed * 1.7 + piece.rotation) * 2.2);
      ctx.rotate(piece.rotation + elapsed * piece.spin);
      ctx.globalAlpha = clamp((gate.y + 150) / 90, 0.18, 1);
      ctx.shadowBlur = 14;
      ctx.shadowColor = piece.spriteKey.includes("Hot") ? "#ff5b3d" : "#729dff";
      if (!drawImageCentered(SPRITES[piece.spriteKey], piece.size, piece.size)) {
        ctx.fillStyle = piece.spriteKey.includes("meteor") ? "#493b42" : "#667489";
        ctx.beginPath();
        ctx.moveTo(-piece.size * 0.46, -piece.size * 0.18);
        ctx.lineTo(-piece.size * 0.10, -piece.size * 0.45);
        ctx.lineTo(piece.size * 0.47, -piece.size * 0.12);
        ctx.lineTo(piece.size * 0.26, piece.size * 0.42);
        ctx.lineTo(-piece.size * 0.38, piece.size * 0.31);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    const guide = ctx.createLinearGradient(gapLeft, 0, gapRight, 0);
    guide.addColorStop(0, "rgba(69,255,238,.20)");
    guide.addColorStop(0.22, "rgba(69,255,238,.04)");
    guide.addColorStop(0.5, "rgba(255,255,255,.08)");
    guide.addColorStop(0.78, "rgba(69,255,238,.04)");
    guide.addColorStop(1, "rgba(69,255,238,.20)");
    ctx.fillStyle = guide;
    ctx.fillRect(gapLeft, -gate.h * 0.74, gate.gapW, gate.h * 1.48);

    ctx.strokeStyle = level().accent;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 16;
    ctx.shadowColor = level().accent;
    ctx.beginPath();
    ctx.moveTo(gapLeft, -gate.h * 0.72);
    ctx.lineTo(gapLeft, gate.h * 0.72);
    ctx.moveTo(gapRight, -gate.h * 0.72);
    ctx.lineTo(gapRight, gate.h * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  function drawParts() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const colors = { cyan: "#47f5ff", gold: "#ffe159", red: "#ff355f", violet: "#a858ff", green: "#78ff9c" };
    for (const part of parts) {
      ctx.globalAlpha = Math.max(0, part.life);
      ctx.fillStyle = colors[part.kind] || "#fff";
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size * Math.max(0.2, part.life), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const ring of rings) {
      const progress = 1 - ring.life / ring.duration;
      const fade = Math.pow(1 - progress, 1.35);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = ring.color;
      ctx.shadowBlur = ring.style === "pulse" ? 30 : 16;
      ctx.shadowColor = ring.color;
      ctx.lineWidth = (ring.style === "pulse" ? 16 : 6) * (1 - progress) + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 12 + ring.max * progress, 0, Math.PI * 2);
      ctx.stroke();
      if (ring.style === "pulse" || ring.style === "capture") {
        const delay = ring.style === "pulse" ? 0.14 : 0.08;
        const secondProgress = clamp((progress - delay) / (1 - delay), 0, 1);
        ctx.globalAlpha = fade * (ring.style === "pulse" ? 0.66 : 0.42);
        ctx.lineWidth = (ring.style === "pulse" ? 8 : 3) * (1 - secondProgress) + 1;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 8 + ring.max * secondProgress * 0.84, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const shot of shots) {
      const progress = 1 - shot.life / shot.duration;
      const dx = shot.x2 - shot.x1;
      const dy = shot.y2 - shot.y1;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const flashPhase = clamp(progress / 0.18, 0, 1);
      const fade = progress < 0.78 ? 1 : 1 - (progress - 0.78) / 0.22;
      const pulse = shot.kind === "pulse";
      const glowColor = pulse ? "#95f7ff" : "#78ff9c";
      const beamColor = pulse ? "#63eaff" : "#6dff9a";
      ctx.save();
      ctx.translate(shot.x1, shot.y1);
      ctx.rotate(angle);
      ctx.globalAlpha = clamp(flashPhase * fade, 0, 1);
      ctx.shadowBlur = 28;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = pulse ? "rgba(61,204,255,.40)" : "rgba(84,255,145,.34)";
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(distance, 0); ctx.stroke();
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(distance, 0); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.98)";
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(distance, 0); ctx.stroke();

      const muzzle = ctx.createRadialGradient(0, 0, 0, 0, 0, 24 * (1 - progress * 0.45));
      muzzle.addColorStop(0, "rgba(255,255,255,.98)");
      muzzle.addColorStop(0.3, pulse ? "rgba(84,235,255,.88)" : "rgba(105,255,153,.82)");
      muzzle.addColorStop(1, "rgba(40,120,255,0)");
      ctx.fillStyle = muzzle;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();

      if (shot.hit && progress > 0.45) {
        ctx.globalAlpha *= clamp((progress - 0.45) * 3.5, 0, 1);
        const impact = ctx.createRadialGradient(distance, 0, 0, distance, 0, shot.destroyed ? 34 : 22);
        impact.addColorStop(0, "rgba(255,255,255,1)");
        impact.addColorStop(0.28, "rgba(102,255,220,.86)");
        impact.addColorStop(1, "rgba(50,160,255,0)");
        ctx.fillStyle = impact;
        ctx.beginPath(); ctx.arc(distance, 0, shot.destroyed ? 34 : 22, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawExplosions() {
    for (const explosion of explosions) {
      if (explosion.ch01Animator) {
        ctx.save();
        ctx.translate(explosion.x, explosion.y);
        ctx.globalCompositeOperation = "screen";
        if (drawCh01Frame(explosion.ch01Animator)) { ctx.restore(); continue; }
        ctx.restore();
      }
      const progress = 1 - explosion.life / explosion.duration;
      const frameIndex = Math.min(SPRITE_GROUPS.explosion.length - 1, Math.floor(progress * SPRITE_GROUPS.explosion.length));
      const frame = frameFrom("explosion", frameIndex);
      const size = (70 + progress * 86) * explosion.scale;
      ctx.save();
      ctx.translate(explosion.x, explosion.y);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(1, explosion.life * 5);
      ctx.shadowBlur = 24; ctx.shadowColor = "#ff8d36";
      if (!drawImageCentered(frame || SPRITES.explosionSmall, size, size, explosion.rotation)) {
        ctx.fillStyle = "#ff9b42"; ctx.beginPath(); ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawImpactEffects() {
    for (const effect of impactEffects) {
      const progress = 1 - effect.life / effect.duration;
      const frame = frameFrom("impact", effect.variant);
      const size = (36 + progress * 28) * effect.scale;
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.max(0, effect.life / effect.duration);
      ctx.shadowBlur = 16; ctx.shadowColor = "#ff9b36";
      drawImageCentered(frame, size, size, effect.angle);
      ctx.restore();
    }
  }

  function drawCombo() {
    if (state !== "playing" || combo < 3) return;
    ctx.save();
    const label = `CADENA x${combo}`;
    const y = H - 245;
    ctx.font = "900 28px Inter,sans-serif";
    const width = ctx.measureText(label).width + 38;
    rounded(W / 2 - width / 2, y - 32, width, 42, 21);
    ctx.fillStyle = "rgba(7,10,22,.58)";
    ctx.fill();
    ctx.strokeStyle = powers.double > 0 ? "rgba(255,230,108,.55)" : "rgba(76,244,255,.35)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = powers.double > 0 ? "#ffe66c" : "#fff";
    ctx.fillText(label, W / 2, y - 3);
    ctx.restore();
  }
  function render(t) {
    ctx.save();
    ctx.translate(cameraKickX, -cameraKickY);
    if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    background(t);
    drawWarp();
    drawTractorCable();
    for (const gate of gates) drawGate(gate);
    for (const item of items) {
      if (item.type === "energy") drawEnergy(item);
      else if (item.type === "meteor") drawMeteor(item);
      else if (item.type === "debris") drawDebris(item);
      else if (item.type === "satellite") drawSatellite(item);
      else drawPower(item);
    }
    drawPlayer(t);
    drawShots();
    drawExplosions();
    drawImpactEffects();
    drawRings();
    drawParts();
    drawCombo();
    if (powers.slow > 0) {
      ctx.fillStyle = "rgba(75,125,255,.055)";
      ctx.fillRect(0, 0, W, H);
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,40,80,${Math.min(0.28, flash)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  // Synchronous, idempotent legacy RAF stop; default campaign stays active.
  let legacyRunning = true;
  let legacyFrameId = null;
  function stopLegacyLoop() {
    if (!legacyRunning) return true;
    legacyRunning = false;
    const pending = legacyFrameId;
    legacyFrameId = null;
    if (pending !== null) cancelAnimationFrame(pending);
    return true; // RAF already cancelled; adapter must not cancel twice.
  }
  // Explicit rollback hook for experimental Engine V1 handoff only.
  function restartLegacyLoop() {
    if (legacyRunning) return false;
    legacyRunning = true;
    last = performance.now();
    legacyFrameId = requestAnimationFrame(frame);
    return true;
  }
  // Read-only bridge reference; lifecycle changes require explicit method calls.
  // src/game is concatenated into a classic IIFE, so ES module exports are unavailable.
  Object.defineProperty(window, 'NeonLegacyLoopBridge', {
    value: Object.freeze({stopLegacyLoop, restartLegacyLoop}),
    writable: false,
    configurable: false
  });
  function frame(now) {
    if (!legacyRunning) return;
    legacyFrameId = null;
    // An input handler can reset last after this rendering opportunity began.
    // A queued RAF timestamp must never rewind the simulation or stop its loop.
    const dt = Math.max(0, Math.min(0.034, (now - last) / 1000));
    last = now;
    update(dt);
    if (!legacyRunning) return;
    render(now);
    if (legacyRunning) legacyFrameId = requestAnimationFrame(frame);
  }

  function pointerX(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    return (x - rect.left) * W / rect.width;
  }

  function move(event) {
    if (state !== "playing") return;
    event.preventDefault();
    const x = pointerX(event);
    const factor = settings.sensitivity / 100;
    player.target = clamp(player.x + (x - player.x) * factor, 70, W - 70);
  }

  canvas.addEventListener("pointerdown", move, { passive: false });
  canvas.addEventListener("pointermove", move, { passive: false });
  canvas.addEventListener("touchstart", move, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });

  addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") player.target -= 85;
    if (event.key === "ArrowRight") player.target += 85;
    if (event.key === " " && state === "playing") {
      event.preventDefault();
      fireManualShot();
    }
    if (event.key === "Escape") state === "paused" ? resumeGame() : pauseGame();
  });

  $("play").onclick = () => {
    const starsMap = getStars();
    const completed = LEVELS.reduce((total, _, index) => total + (+(starsMap[index + 1] || 0) > 0 ? 1 : 0), 0);
    prepareLevel(completed === LEVELS.length ? LEVELS.length - 1 : getUnlocked() - 1, "menu");
  };
  $("levels").onclick = () => { buildLevelGrid(); overlay(ui.levelSelect); };
  $("levelBack").onclick = () => overlay(ui.menu);
  $("launch").onclick = () => startLevel(pendingLevel);
  $("briefingBack").onclick = closeBriefing;
  $("how").onclick = () => overlay(ui.instructions);
  $("back").onclick = () => overlay(ui.menu);
  $("settings").onclick = () => openSettings("menu");
  $("quickSettings").onclick = () => openSettings("menu");
  $("settingsBack").onclick = closeSettings;
  $("pause").onclick = pauseGame;
  ui.fire.onclick = fireManualShot;
  $("resume").onclick = resumeGame;
  $("pauseSettings").onclick = () => openSettings("paused");
  $("restart").onclick = () => startLevel(currentLevel);
  $("quit").onclick = goHome;
  $("home").onclick = goHome;
  $("completeHome").onclick = goHome;
  $("retry").onclick = () => startLevel(currentLevel);
  $("replayLevel").onclick = () => startLevel(currentLevel);
  ui.nextLevel.onclick = () => prepareLevel(Math.min(LEVELS.length - 1, currentLevel + 1), "complete");

  ui.musicVolume.oninput = (event) => {
    settings.music = +event.target.value;
    ui.musicValue.textContent = `${settings.music}%`;
    startMusic();
    updateAudioVolumes();
  };
  ui.fxVolume.oninput = (event) => {
    settings.fx = +event.target.value;
    ui.fxValue.textContent = `${settings.fx}%`;
    tone(620, 0.05, "triangle", 0.04);
  };
  ui.sensitivity.oninput = (event) => {
    settings.sensitivity = +event.target.value;
    ui.sensitivityValue.textContent = `${settings.sensitivity}%`;
  };
  ui.vibration.onchange = (event) => {
    settings.vibration = event.target.checked;
    if (settings.vibration) vibrate(20);
  };
  ui.effectsQuality.onchange = (event) => {
    settings.effectsQuality = ["low", "normal", "high"].includes(event.target.value) ? event.target.value : "normal";
    settings.effects = settings.effectsQuality !== "low";
  };

  ui.reward.onclick = async () => {
    ui.reward.disabled = true;
    ui.reward.textContent = "CARGANDO ANUNCIO…";
    try {
      const ok = await window.AdBridge?.showRewarded?.();
      window.AnalyticsManager?.track("rewarded_ad", { level: currentLevel + 1, completed: Boolean(ok) });
      if (ok) resumeReward();
      else toast("Anuncio no disponible");
    } catch {
      toast("Anuncio no disponible");
    } finally {
      ui.reward.disabled = false;
      ui.reward.textContent = "▶ VER ANUNCIO Y REPARAR";
    }
  };

  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    ui.install.classList.remove("hidden");
  });

  ui.install.onclick = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    ui.install.classList.add("hidden");
  };

  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden) {
      last = performance.now();
      return;
    }
    if (state === "playing") pauseGame();
    await suspendAudio();
  });

  addEventListener("neon-ad-opening", async () => {
    last = performance.now();
    resumeAudioAfterAd = Boolean(audioCtx && audioCtx.state === "running");
    if (resumeAudioAfterAd) await suspendAudio();
  });

  addEventListener("neon-ad-closed", async () => {
    last = performance.now();
    if (resumeAudioAfterAd && audioCtx) {
      await resumeAudio();
    }
    resumeAudioAfterAd = false;
  });

  if ("serviceWorker" in navigator) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  resizeCanvas();
  syncSettingsUI();
  window.AnalyticsManager?.track("app_open", { build: BUILD_VERSION });
  addEventListener("pagehide", () => {
    window.AnalyticsManager?.track("session_duration", {
      seconds: Math.round(window.AnalyticsManager.sessionDurationSeconds())
    });
    if (["playing", "paused", "destroying"].includes(state)) {
      window.AnalyticsManager?.track("abandon", { level: currentLevel + 1, state });
    }
  }, { once: true });
  console.info(`[Neon Catcher] build ${BUILD_VERSION}`);
  updateMenu();
  hud();
  resetPowers();
  overlay(ui.menu);
  legacyFrameId = requestAnimationFrame(frame);
})();
