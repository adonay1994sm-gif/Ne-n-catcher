(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 720;
  let H = 1280;
  const BUILD_VERSION = "7.1.0";
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
    score: $("score"),
    goal: $("goal"),
    hull: $("hull"),
    hullBar: $("hullBar"),
    hudLevel: $("hudLevel"),
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

  const LEVELS = [
    {
      name: "La Onda de Choque", goal: 36, speed: 0.92, spawn: 0.69, meteor: 0.105, power: 0.072,
      accent: "#57f4ff", top: "#173460", mid: "#07172f", hazard: "shockwave", scene: "cronos",
      zone: "Perímetro exterior del Centro Cronos", desc: "Cruza la zona de impacto",
      mission: "Alcanza el perímetro, recupera 36 fragmentos temporales y localiza la señal de emergencia del Centro Cronos.",
      threatLabel: "Roca y restos orbitales", threatPool: ["meteor", "meteor", "debris"], gate: 0
    },
    {
      name: "Grieta Azul", goal: 45, speed: 0.94, spawn: 0.72, meteor: 0.095, power: 0.068,
      accent: "#4da2ff", top: "#14245c", mid: "#0a1035", hazard: "fast", scene: "rift",
      zone: "Fractura de plasma azul", desc: "El campo acelera",
      mission: "Cruza la grieta antes de que la corriente arrastre los núcleos fuera de alcance.",
      threatLabel: "Rocas y restos", threatPool: ["meteor", "meteor", "meteor", "debris"], gate: 0
    },
    {
      name: "Carril Meteoro", goal: 60, speed: 1.02, spawn: 0.67, meteor: 0.115, power: 0.066,
      accent: "#ffb35c", top: "#3b2437", mid: "#17101f", hazard: "wave", scene: "belt",
      zone: "Cinturón de extracción abandonado", desc: "Trayectorias ondulantes",
      mission: "Navega entre roca y chatarra minera sin perder el suministro limitado del carril.",
      threatLabel: "Meteoros y chatarra", threatPool: ["meteor", "meteor", "debris", "debris"], gate: 0
    },
    {
      name: "Tormenta Iónica", goal: 75, speed: 1.09, spawn: 0.62, meteor: 0.135, power: 0.064,
      accent: "#ad72ff", top: "#342364", mid: "#15102d", hazard: "storm", scene: "ion",
      zone: "Nube de descarga iónica", desc: "Oleadas densas",
      mission: "Mantén estable la nave mientras las descargas ocultan satélites fuera de servicio.",
      threatLabel: "Satélites y roca", threatPool: ["meteor", "meteor", "debris", "satellite"], gate: 0
    },
    {
      name: "Zona Carmesí", goal: 90, speed: 1.16, spawn: 0.58, meteor: 0.155, power: 0.062,
      accent: "#ff536f", top: "#552034", mid: "#210b18", hazard: "dart", scene: "crimson",
      zone: "Corona de la estrella Carmesí", desc: "Cometas de alta velocidad",
      mission: "Atraviesa la corona estelar y anticipa los cometas antes de que alcancen el casco.",
      threatLabel: "Cometas y satélites", threatPool: ["meteor", "meteor", "satellite", "debris"], gate: 0
    },
    {
      name: "Pozo Gravitatorio", goal: 105, speed: 1.22, spawn: 0.54, meteor: 0.175, power: 0.060,
      accent: "#47ffd1", top: "#16463f", mid: "#09241f", hazard: "gravity", scene: "gravity",
      zone: "Órbita de una singularidad menor", desc: "Deriva y formaciones orbitales",
      mission: "Compensa la deriva y cruza las primeras formaciones de restos por el pasillo iluminado.",
      threatLabel: "Restos agrupados", threatPool: ["meteor", "debris", "debris", "satellite"], gate: 15
    },
    {
      name: "Sector Fantasma", goal: 120, speed: 1.28, spawn: 0.51, meteor: 0.195, power: 0.058,
      accent: "#c48aff", top: "#3a2856", mid: "#160d25", hazard: "phantom", scene: "ghost",
      zone: "Cementerio de naves", desc: "Amenazas de baja visibilidad",
      mission: "Rastrea objetos casi invisibles y atraviesa los restos de antiguas estaciones.",
      threatLabel: "Restos fantasma", threatPool: ["meteor", "debris", "satellite", "satellite"], gate: 14
    },
    {
      name: "Sobrecarga", goal: 135, speed: 1.35, spawn: 0.47, meteor: 0.215, power: 0.056,
      accent: "#fff06b", top: "#514916", mid: "#211d08", hazard: "overdrive", scene: "overdrive",
      zone: "Autopista solar inestable", desc: "Velocidad extrema",
      mission: "Aprovecha la corriente solar sin perder el control entre formaciones y restos acelerados.",
      threatLabel: "Campo hiperveloz", threatPool: ["meteor", "debris", "satellite", "debris"], gate: 12
    },
    {
      name: "Núcleo Oscuro", goal: 150, speed: 1.42, spawn: 0.44, meteor: 0.235, power: 0.054,
      accent: "#fb66ff", top: "#40183f", mid: "#190918", hazard: "chaos", scene: "dark",
      zone: "Órbita del núcleo eclipsado", desc: "Órbitas imprevisibles",
      mission: "Recupera los núcleos antes de que las órbitas caóticas cierren las rutas seguras.",
      threatLabel: "Órbitas caóticas", threatPool: ["meteor", "meteor", "debris", "satellite"], gate: 11
    },
    {
      name: "Colapso Neon", goal: 165, speed: 1.50, spawn: 0.40, meteor: 0.255, power: 0.052,
      accent: "#63fff1", top: "#45184b", mid: "#12071e", hazard: "final", scene: "collapse",
      zone: "Umbral del portal Neon", desc: "Prueba completa de navegación",
      mission: "Combina todos los sistemas de la nave para estabilizar el portal y cerrar la expedición.",
      threatLabel: "Colapso total", threatPool: ["meteor", "debris", "satellite", "meteor"], gate: 9
    }
  ];

  const KEYS = {
    best: "neon-best-v2",
    unlocked: "neon-unlocked-v2",
    stars: "neon-stars-v2",
    levelBest: "neon-level-best-v2",
    games: "neon-games-v2",
    settings: "neon-settings-v5"
  };
  const LEGACY_KEYS = { best: "neon-best-v1" };
  const DEFAULT_SETTINGS = { music: 35, fx: 70, sensitivity: 100, vibration: true, effectsQuality: "normal", effects: true };
