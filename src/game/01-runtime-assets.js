  const storage = NeonCore.createStorageService();

  function migrateLegacyStorage() {
    if (N7_CAMPAIGN || JOURNEY_DEMO) return false;
    // A denied read is not an absent score: do not overwrite an unreadable
    // current record with a smaller historical one while writes still work.
    const legacyRead = storage.readRaw(LEGACY_KEYS.best);
    const currentRead = storage.readRaw(KEYS.best);
    if (!legacyRead.ok || !currentRead.ok) return false;
    const scoreFromRaw = raw => {
      const value = Number(raw);
      return Number.isFinite(value) ? Math.max(0, value) : null;
    };
    const legacyBest = scoreFromRaw(legacyRead.value);
    const currentBest = scoreFromRaw(currentRead.value);
    if (legacyBest === null || currentBest === null) return false;
    if (legacyBest <= currentBest) return false;
    return storage.set(KEYS.best, legacyBest);
  }

  migrateLegacyStorage();
  let settings = loadSettings();
  // Cosmetic loadout has its own key; campaign checkpoints and collision stay intact.
  const savedShipFleet = storage.getJSON(NeonCampaign.SHIP_FLEET_SAVE_KEY, null);
  // The accepted modular fleet is the single live identity. Old profiles keep
  // their loadout and progress; a historical render-mode flag cannot revive the
  // retired illustration. The next explicit hangar save normalizes the flag.
  let shipRenderMode = "modular";
  let shipLoadout = NeonCampaign.normalizeShipLoadout(savedShipFleet?.loadout);
  let shipHangarDraft = null;
  let shipPresentationSignature = "";

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
  let classicScoutTimer = 0;
  let classicScoutAnnounced = false;
  let atlasBoss = null;
  // Old Atlas AUTO was on by default, so its key is not evidence of consent.
  // Explicit opt-in now belongs to Settings; no encounter-local override.
  let atlasFireTimer = 0;
  let atlasReentryGrace = 0;
  let atlasLastStatus = "";
  let warpTimer = 0;
  let score = 0;
  let hull = 100;
  let combo = 1;
  let maxCombo = 1;
  let comboTimer = 0;
  let collected = 0;
  let currentLevel = Math.max(0, Math.min(LEVELS.length - 1, getUnlocked() - 1));
  let encounterDirector = null;
  let journey = null;
  let journeyView = null;
  let journeyCanSave = true;
  let journeyAutoFire = true;
  let journeyAutoTimer = 0;
  let journeyShieldCooldown = 0;
  let journeyTractorCooldown = 0;
  let journeyPointerLast = null;
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
  let classicWeapons = null;
  let classicFlight = null;
  let classicFlightView = null;
  let classicFlightBounds = null;
  let classicFlightAnchorY = null;
  const classicFlightInput = NeonCampaign.createRelativeFlightInput();
  let classicEquipment = {version:1, recoveredTwin:false, unlocked:['pulse'], selected:'pulse'};
  let classicEquipmentWritable = true;
  let classicShieldAge = 0;
  let classicShieldImpact = 0;
  let classicPatrolTimer = 0;
  let classicPatrolSequence = 0;
  let classicPursuitAnnounced = new Set();
  let classicCometSequence = 0;
  let classicCometWarning = -1;
  let classicVoyageRecord = null;
  let classicVoyageWritable = true;
  let completionJournal = null;
  let completionPersistenceBlocked = false;
  let classicVoyageRequestedStage = null;
  let classicVoyageSpawnTimer = 0;
  let classicVoyageHazardTimer = 0;
  let classicVoyageStageId = "";
  let classicThreatSequence = 0;
  let flightDockReturn = 'menu';
  let flightHudSignature = '';
  let flightTransmission = null;


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
    image._loadError = false;
    image.onerror = () => { image._loadError = true; };
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
    // Historical poses remain on disk for recovery and the reserved engine's
    // references, but are not requested by the live modular presentation.
    ship: [0,1,2,3,4,5].map((index) => loadSprite(`assets/ship_frame_${String(index).padStart(2,"0")}.webp`, false)),
    core: [0,1,2,3,4,5].map((index) => loadSprite(`assets/core_frame_${String(index).padStart(2,"0")}.webp`, true)),
    phaser: [0,1,2,3,4,5].map((index) => loadSprite(`assets/phaser_frame_${String(index).padStart(2,"0")}.webp`)),
    tractor: [0,1,2,3,4,5].map((index) => loadSprite(`assets/tractor_frame_${String(index).padStart(2,"0")}.webp`)),
    impact: [0,1,2,3].map((index) => loadSprite(`assets/impact_frame_${String(index).padStart(2,"0")}.webp`)),
    smoke: [0,1,2].map((index) => loadSprite(`assets/smoke_frame_${String(index).padStart(2,"0")}.webp`)),
    explosion: [0,1,2,3,4,5,6,7].map((index) => loadSprite(`assets/explosion_frame_${String(index).padStart(2,"0")}.webp`))
  };

  const SPRITES = {
    flightKit: loadSprite("assets/chronos_flight_atlas_v1.webp", false),
    chronosDestruction: loadSprite("assets/chronos_destruction_atlas_v1.webp", false),
    flightSpace: loadSprite("assets/chronos_flight_space_v1.webp", false),
    flightWeapons: loadSprite("assets/chronos_flight_weapons_v1.webp", false),
    c9Station: loadSprite("assets/c9_station_v1.webp", false),

    shipFallback: SPRITE_GROUPS.ship[0],
    meteorSmall: loadSprite("assets/meteor_small.webp", true),
    meteorSmallAlt: loadSprite("assets/meteor_small_alt.webp"),
    meteorMedium: loadSprite("assets/meteor_medium.webp", true),
    meteorMediumAlt: loadSprite("assets/meteor_medium_alt.webp"),
    meteorLarge: loadSprite("assets/meteor_large.webp"),
    ch01: loadSprite("assets/ch01_atlas_v1.webp", false),
    ch02: loadSprite("assets/ch02_interceptor_atlas_v1.webp", false),
    chronosModule: loadSprite("assets/chronos_detached_module_v1.webp", false),
    modularShip: loadSprite("assets/ship_modular_atlas_v1.webp", true),
    shipIdentity: loadSprite("assets/player_ship_identity_v1.webp", true),
    guardianAtlas: loadSprite("assets/guardian_atlas_states_v1.webp", false),
    atlasVfx: loadSprite("assets/atlas_combat_vfx_v1.webp", false),
    arcadePulse: loadSprite("assets/arcade_pulse_atlas_v2.webp", false),
    comet: loadSprite("assets/comet_flight_atlas_v2.webp"),
    debrisMetal: loadSprite("assets/debris_metal.webp"),
    debrisPanel: loadSprite("assets/debris_panel.webp"),
    debrisHot0: loadSprite("assets/debris_hot_00.webp"),
    debrisHot1: loadSprite("assets/debris_hot_01.webp"),
    satellite: loadSprite("assets/satellite_old.webp"),
    repairDrone: loadSprite("assets/repair_drone.webp"),
    shieldEffect: loadSprite("assets/shield_effect.webp"),
    forceShieldAtlas: loadSprite("assets/force_shield_atlas_v1.webp", false),
    shieldIdle: loadSprite("assets/shield_idle.webp"),
    explosionSmall: loadSprite("assets/explosion_small.webp"),
    croniumFragment: loadSprite("assets/cronium_fragment_v1.webp", true),
    cronosBackground: loadSprite("assets/cronos_level1_background.webp", true),
    chronosShockwave: loadSprite("assets/chronos_shockwave_atlas_v1.webp", false),
    atlasBackground: loadSprite("assets/atlas_perimeter_background_v1.webp", false),
    vulkarBackground: loadSprite("assets/vulkar_descent_background_v1.webp", false),
    vulkarOrbitBackground: loadSprite("assets/vulkar_orbit_background_v1.webp", false),
    vulkarOrbitPlanet: loadSprite("assets/vulkar_orbit_planet_v1.webp", false),
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
  let resumeAudioAfterAd = false;
