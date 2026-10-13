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
