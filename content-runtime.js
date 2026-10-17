var NeonCampaign = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/game/progression/legacy-content-entry.js
  var legacy_content_entry_exports = {};
  __export(legacy_content_entry_exports, {
    EncounterDirector: () => EncounterDirector,
    GENERATOR_VERSION: () => GENERATOR_VERSION,
    LEVELS: () => LEVELS,
    advanceClassicScout: () => advanceClassicScout,
    advanceEnemy: () => advanceEnemy,
    createClassicScout: () => createClassicScout,
    n7Dialogue: () => n7Dialogue
  });

  // src/game/progression/sectors.js
  var SECTOR_DEFINITIONS = Object.freeze([
    { id: 1, name: "Suburbios Ne\xF3n", theme: "aprendiz", start: 1, end: 20 },
    { id: 2, name: "N\xFAcleo Urbano", theme: "redes-de-datos", start: 21, end: 40 },
    { id: 3, name: "Sector Industrial", theme: "procesadores", start: 41, end: 60 },
    { id: 4, name: "Matriz Cibern\xE9tica", theme: "servidores-centrales", start: 61, end: 80 },
    { id: 5, name: "El Abismo", theme: "nucleo-ia", start: 81, end: 100 }
  ].map((s) => Object.freeze(s)));
  var CAMPAIGN_LEVEL_COUNT = 100;
  function sectorForLevel(level) {
    if (!Number.isInteger(level) || level < 1 || level > CAMPAIGN_LEVEL_COUNT) throw new RangeError("Level must be 1..100");
    return SECTOR_DEFINITIONS[Math.floor((level - 1) / 20)];
  }
  function levelDefinition(level) {
    const sector = sectorForLevel(level);
    return Object.freeze({ level, sectorId: sector.id, sectorName: sector.name, withinSector: level - sector.start + 1, isBoss: level % 10 === 0, seed: seedForLevel(level) });
  }
  function seedForLevel(level) {
    const sector = sectorForLevel(level);
    let n = (Math.imul(level, 2654435761) ^ Math.imul(sector.id, 2246822507) ^ 1312244545) >>> 0;
    n = Math.imul(n ^ n >>> 16, 2146121005) >>> 0;
    n = Math.imul(n ^ n >>> 15, 2221713035) >>> 0;
    return (n ^ n >>> 16) >>> 0;
  }
  var CAMPAIGN_LEVELS = Object.freeze(Array.from({ length: CAMPAIGN_LEVEL_COUNT }, (_, i) => levelDefinition(i + 1)));

  // src/game/progression/level-designs.js
  var TITLES = [
    ["Primer pulso", "Calle del despertar", "Luces sin due\xF1o", "El primer desv\xEDo", "Ecos del mercado", "Se\xF1ales cruzadas", "Puente de retorno", "Danza de antenas", "Antes del prisma", "Centinela Prisma", "Un nombre borrado", "Jardines de datos", "El callej\xF3n azul", "Correo perdido", "Faros en la niebla", "Patrulla de barrio", "Dos rutas, una salida", "La puerta muda", "C\xF3digo de acceso", "Guardi\xE1n del Umbral"],
    ["La red fragmentada", "Avenida de paquetes", "Cruce sincronizado", "El mensajero", "Rutas de energ\xEDa", "La estaci\xF3n vac\xEDa", "Voces en paralelo", "Cifrado rojo", "Al otro lado del muro", "Firewall Viviente", "Pista de auditor\xEDa", "La ciudad escucha", "Repetidores", "Mensaje de Asha", "El primer tirador", "Ventana de transmisi\xF3n", "Calles coordinadas", "El mapa incompleto", "Permiso denegado", "Arquitecto de Datos"],
    ["Memoria t\xE9rmica", "Cintas de silicio", "La f\xE1brica dormida", "Prensa de luz", "Reciclar el pasado", "Hornos de memoria", "Turno fantasma", "V\xE1lvulas de fuga", "La firma de N-7", "Forjador de Silicio", "Archivo de origen", "Engranajes rotos", "La copia de seguridad", "Sala de ensamblaje", "El pulso industrial", "Cadena de mando", "Proceso hu\xE9rfano", "Detener la prensa", "\xDAltimo turno", "Tit\xE1n de Procesos"],
    ["La verdad de la Matriz", "Ojos del servidor", "Un recuerdo prestado", "Espejos de vigilancia", "Orden de silencio", "Nodos hermanos", "La llave de Asha", "Registro prohibido", "El testigo central", "Supervisor de Nodos", "La orden original", "Recursi\xF3n", "Firmas compartidas", "La ruta de emergencia", "Consentimiento", "Romper el protocolo", "La voz de Custodio", "Puertas de la Matriz", "Nadie queda atr\xE1s", "Matriz Centinela"],
    ["El Abismo", "Copia sin cuerpo", "El pulso que falta", "Entre dos memorias", "La se\xF1al verdadera", "Fragmentos de Asha", "El error voluntario", "La \xFAltima r\xE9plica", "Escuchar al eco", "Eco del Abismo", "El archivo vivo", "Restituir los nombres", "Un cielo posible", "Decisi\xF3n compartida", "Liberar la red", "N-7 recuerda", "Todos los caminos", "El \xFAltimo cortafuegos", "Hasta el n\xFAcleo", "N-7: N\xFAcleo Corrupto"]
  ];
  var RHYTHMS = [
    ["linear", "linear", "recovery"],
    ["linear", "split", "recovery"],
    ["split", "linear", "crosscurrent"],
    ["linear", "crosscurrent", "recovery"],
    ["split", "crosscurrent", "split"],
    ["crosscurrent", "linear", "recovery"],
    ["linear", "zigzag", "recovery"],
    ["zigzag", "split", "zigzag"],
    ["split", "zigzag", "recovery"],
    ["linear", "split", "recovery"],
    ["crosscurrent", "zigzag", "split"],
    ["split", "crosscurrent", "recovery"],
    ["zigzag", "linear", "split"],
    ["crosscurrent", "split", "recovery"],
    ["split", "zigzag", "crosscurrent"],
    ["zigzag", "crosscurrent", "recovery"],
    ["crosscurrent", "split", "zigzag"],
    ["zigzag", "split", "crosscurrent"],
    ["split", "crosscurrent", "recovery"],
    ["crosscurrent", "zigzag", "recovery"]
  ];
  var OBJECTIVES = [
    "Lee las se\xF1ales y recupera n\xFAcleos durante las oleadas.",
    "Alterna flancos para recuperar los paquetes perdidos.",
    "Cruza la corriente de maquinaria y conserva tu casco.",
    "Identifica las ventanas de las patrullas y recupera el registro.",
    "Recupera los fragmentos necesarios para abrir el n\xFAcleo."
  ];
  function authoredLevel(level) {
    const definition = levelDefinition(level);
    const index = definition.withinSector - 1;
    const sector = definition.sectorId - 1;
    return Object.freeze({
      ...definition,
      title: TITLES[sector][index],
      mission: OBJECTIVES[sector],
      objective: "recover-and-survive",
      goal: 14 + sector * 4 + Math.floor(index / 5) * 2,
      waveCount: 6 + Math.floor(index / 7),
      rhythm: Object.freeze(RHYTHMS[index].slice()),
      mechanics: Object.freeze([
        "linear",
        ...level >= 7 ? ["zigzag"] : [],
        ...level >= 24 ? ["chaser"] : [],
        ...level >= 35 ? ["shooter"] : []
      ]),
      recoveryEvery: sector < 2 ? 3 : 4,
      bossEncounter: definition.isBoss
    });
  }
  var AUTHORED_LEVELS = Object.freeze(Array.from({ length: 100 }, (_, i) => authoredLevel(i + 1)));

  // src/core/player-model.js
  var PLAYER_GEOMETRY = Object.freeze({
    visualWidth: 132,
    visualHeight: 92,
    collisionHalfWidth: 106,
    minX: 78
  });

  // src/game/progression/generator.js
  var GENERATOR_VERSION = "n7-waves-v2";
  var PLAYFIELD = Object.freeze({
    width: 720,
    shipHalfWidth: PLAYER_GEOMETRY.collisionHalfWidth,
    safetyMargin: 24,
    enemyRadius: 44,
    edgeMargin: 18
  });
  function createSeededRandom(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new RangeError("Expected uint32 seed");
    let state = seed >>> 0;
    return () => {
      state = state + 1831565813 >>> 0;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function difficultyForLevel(level) {
    levelDefinition(level);
    const t = (level - 1) / 99;
    return Object.freeze({
      density: Number((1 + 2.4 * t).toFixed(4)),
      spawnInterval: Number((2.8 - 1.65 * t).toFixed(4)),
      enemySpeed: Number((1 + 1.75 * t).toFixed(4)),
      projectileSpeed: Number((1 + 1.35 * t).toFixed(4))
    });
  }
  function generateLevel(level, { waveCount = authoredLevel(level).waveCount, seed = levelDefinition(level).seed, version = GENERATOR_VERSION } = {}) {
    const definition = levelDefinition(level), design = authoredLevel(level);
    if (!Number.isInteger(waveCount) || waveCount < 1 || waveCount > 100) throw new RangeError("waveCount must be 1..100");
    if (version !== GENERATOR_VERSION) throw new RangeError("Unsupported generator version");
    const random = createSeededRandom(seed), difficulty = difficultyForLevel(level);
    const center = PLAYFIELD.width / 2 + (Math.floor(random() * 3) - 1) * 56;
    const halfWidth = PLAYFIELD.shipHalfWidth + PLAYFIELD.safetyMargin;
    const corridor = Object.freeze({ center, left: center - halfWidth, right: center + halfWidth, width: halfWidth * 2 });
    const boundsFor = (side) => Object.freeze(side < 0 ? { min: PLAYFIELD.edgeMargin + PLAYFIELD.enemyRadius, max: corridor.left - PLAYFIELD.enemyRadius } : { min: corridor.right + PLAYFIELD.enemyRadius, max: PLAYFIELD.width - PLAYFIELD.edgeMargin - PLAYFIELD.enemyRadius });
    const cadence = 8.5;
    const waves = Array.from({ length: waveCount }, (_, i) => {
      const rhythm = design.rhythm[i % design.rhythm.length];
      const recovery = (i + 1) % design.recoveryEvery === 0 || rhythm === "recovery";
      const count = recovery ? 2 : Math.min(14, Math.max(2, Math.round((2 + i % 3) * difficulty.density + random())));
      const at = 2 + i * cadence;
      const enemies = Array.from({ length: count }, (_2, j) => {
        const side = (i + j) % 2 === 0 ? -1 : 1;
        const bounds = boundsFor(side);
        const preferred = rhythm === "zigzag" ? "zigzag" : rhythm === "crosscurrent" ? design.mechanics[(i + j) % design.mechanics.length] : "linear";
        const type = design.mechanics.includes(preferred) ? preferred : "linear";
        const x = Number((bounds.min + random() * (bounds.max - bounds.min)).toFixed(4));
        return Object.freeze({
          id: `${level}:${i + 1}:${j + 1}`,
          type,
          side,
          bounds,
          x,
          lane: Math.max(0, Math.min(6, Math.floor(x / (PLAYFIELD.width / 7)))),
          at: Number((at + j * 0.32).toFixed(4)),
          radius: PLAYFIELD.enemyRadius,
          speedMultiplier: Number((difficulty.enemySpeed * (0.9 + random() * 0.2)).toFixed(4)),
          projectileMultiplier: difficulty.projectileSpeed,
          phase: Number((random() * Math.PI * 2).toFixed(4)),
          telegraphSeconds: 0.8,
          fireInterval: Number((2.8 - (level - 1) / 99 * 0.8).toFixed(4))
        });
      });
      return Object.freeze({ index: i + 1, at, rhythm, recovery, spawnInterval: difficulty.spawnInterval, enemies: Object.freeze(enemies) });
    });
    const duration = 2 + waveCount * cadence;
    const energyBudget = design.goal + Math.ceil(design.goal * 0.25);
    const pickups = Object.freeze(Array.from({ length: energyBudget }, (_, i) => Object.freeze({
      id: `${level}:energy:${i + 1}`,
      type: "energy",
      at: Number((2 + i * (duration - 6) / energyBudget).toFixed(4)),
      x: Number((center + (random() - 0.5) * 120).toFixed(4)),
      phase: Number((random() * Math.PI * 2).toFixed(4))
    })));
    return Object.freeze({
      ...definition,
      seed,
      version,
      design,
      difficulty,
      geometry: PLAYFIELD,
      corridor,
      duration,
      energyBudget,
      pickups,
      waves: Object.freeze(waves),
      boss: definition.isBoss ? bossForLevel(level) : null
    });
  }
  function bossForLevel(level) {
    if (!Number.isInteger(level) || level < 10 || level > 100 || level % 10 !== 0) throw new RangeError("Boss level must be a multiple of ten");
    const names = ["Centinela Prisma", "Guardi\xE1n del Umbral", "Firewall Viviente", "Arquitecto de Datos", "Forjador de Silicio", "Tit\xE1n de Procesos", "Supervisor de Nodos", "Matriz Centinela", "Eco del Abismo", "N-7: N\xFAcleo Corrupto"];
    return Object.freeze({
      id: "boss-" + level,
      name: names[level / 10 - 1],
      level,
      phases: Object.freeze([
        Object.freeze({ id: 1, pattern: "spread-shot", invulnerable: false, healthThreshold: 1 }),
        Object.freeze({ id: 2, pattern: "particle-barrier", invulnerable: true, invulnerabilitySeconds: 2, healthThreshold: 0.5 })
      ])
    });
  }

  // art-source/enemies/ch01/ch01-atlas-v1.json
  var ch01_atlas_v1_default = {
    schemaVersion: 1,
    id: "gaia.ch01.scout",
    revision: "ch01-art-v1",
    productionStatus: "IN_REVIEW",
    image: "ch01-atlas-v1.webp",
    proposedRuntimeImage: "assets/ch01_atlas_v1.webp",
    master: "ch01-master-v2.png",
    sourceHistorical: "ch01-master-v1.png",
    dimensions: {
      width: 1024,
      height: 1536
    },
    layout: {
      columns: 4,
      rows: 6,
      frameWidth: 256,
      frameHeight: 256,
      frameCount: 24
    },
    pivot: {
      x: 0.5,
      y: 0.5
    },
    forward: {
      x: 0,
      y: 1
    },
    recommendedDrawSizeLogical: 128,
    transparent: true,
    decodedRgbaBytes: 6291456,
    frames: [
      {
        index: 0,
        stateRow: "spawn",
        rect: {
          x: 0,
          y: 0,
          width: 256,
          height: 256
        }
      },
      {
        index: 1,
        stateRow: "spawn",
        rect: {
          x: 256,
          y: 0,
          width: 256,
          height: 256
        }
      },
      {
        index: 2,
        stateRow: "spawn",
        rect: {
          x: 512,
          y: 0,
          width: 256,
          height: 256
        }
      },
      {
        index: 3,
        stateRow: "spawn",
        rect: {
          x: 768,
          y: 0,
          width: 256,
          height: 256
        }
      },
      {
        index: 4,
        stateRow: "idle",
        rect: {
          x: 0,
          y: 256,
          width: 256,
          height: 256
        }
      },
      {
        index: 5,
        stateRow: "idle",
        rect: {
          x: 256,
          y: 256,
          width: 256,
          height: 256
        }
      },
      {
        index: 6,
        stateRow: "idle",
        rect: {
          x: 512,
          y: 256,
          width: 256,
          height: 256
        }
      },
      {
        index: 7,
        stateRow: "idle",
        rect: {
          x: 768,
          y: 256,
          width: 256,
          height: 256
        }
      },
      {
        index: 8,
        stateRow: "flight",
        rect: {
          x: 0,
          y: 512,
          width: 256,
          height: 256
        }
      },
      {
        index: 9,
        stateRow: "flight",
        rect: {
          x: 256,
          y: 512,
          width: 256,
          height: 256
        }
      },
      {
        index: 10,
        stateRow: "flight",
        rect: {
          x: 512,
          y: 512,
          width: 256,
          height: 256
        }
      },
      {
        index: 11,
        stateRow: "flight",
        rect: {
          x: 768,
          y: 512,
          width: 256,
          height: 256
        }
      },
      {
        index: 12,
        stateRow: "attack",
        rect: {
          x: 0,
          y: 768,
          width: 256,
          height: 256
        }
      },
      {
        index: 13,
        stateRow: "attack",
        rect: {
          x: 256,
          y: 768,
          width: 256,
          height: 256
        }
      },
      {
        index: 14,
        stateRow: "attack",
        rect: {
          x: 512,
          y: 768,
          width: 256,
          height: 256
        }
      },
      {
        index: 15,
        stateRow: "attack",
        rect: {
          x: 768,
          y: 768,
          width: 256,
          height: 256
        }
      },
      {
        index: 16,
        stateRow: "hurt",
        rect: {
          x: 0,
          y: 1024,
          width: 256,
          height: 256
        }
      },
      {
        index: 17,
        stateRow: "hurt",
        rect: {
          x: 256,
          y: 1024,
          width: 256,
          height: 256
        }
      },
      {
        index: 18,
        stateRow: "hurt",
        rect: {
          x: 512,
          y: 1024,
          width: 256,
          height: 256
        }
      },
      {
        index: 19,
        stateRow: "hurt",
        rect: {
          x: 768,
          y: 1024,
          width: 256,
          height: 256
        }
      },
      {
        index: 20,
        stateRow: "destroy",
        rect: {
          x: 0,
          y: 1280,
          width: 256,
          height: 256
        }
      },
      {
        index: 21,
        stateRow: "destroy",
        rect: {
          x: 256,
          y: 1280,
          width: 256,
          height: 256
        }
      },
      {
        index: 22,
        stateRow: "destroy",
        rect: {
          x: 512,
          y: 1280,
          width: 256,
          height: 256
        }
      },
      {
        index: 23,
        stateRow: "destroy",
        rect: {
          x: 768,
          y: 1280,
          width: 256,
          height: 256
        }
      }
    ],
    animations: {
      spawn: {
        frames: [
          0,
          1,
          2,
          3
        ],
        durationMs: [
          100,
          100,
          100,
          130
        ],
        loop: false,
        locked: true,
        next: "idle"
      },
      idle: {
        frames: [
          4,
          5,
          6,
          7
        ],
        durationMs: [
          125,
          125,
          125,
          125
        ],
        loop: true,
        locked: false
      },
      flight: {
        frames: [
          9,
          11
        ],
        durationMs: [
          100,
          100
        ],
        loop: true,
        locked: false
      },
      bankLeft: {
        frames: [
          8
        ],
        durationMs: [
          100
        ],
        loop: true,
        locked: false
      },
      bankRight: {
        frames: [
          10
        ],
        durationMs: [
          100
        ],
        loop: true,
        locked: false
      },
      attack: {
        frames: [
          12,
          13,
          14,
          15
        ],
        durationMs: [
          160,
          80,
          90,
          170
        ],
        loop: false,
        locked: true,
        next: "idle",
        events: [
          {
            frameOffset: 0,
            name: "charge"
          },
          {
            frameOffset: 1,
            name: "fire"
          }
        ]
      },
      hurt: {
        frames: [
          16,
          17,
          18,
          19
        ],
        durationMs: [
          55,
          55,
          65,
          75
        ],
        loop: false,
        locked: true,
        next: "idle"
      },
      damaged: {
        frames: [
          18,
          19
        ],
        durationMs: [
          160,
          160
        ],
        loop: true,
        locked: false
      },
      destroy: {
        frames: [
          20,
          21,
          22,
          23
        ],
        durationMs: [
          80,
          100,
          130,
          180
        ],
        loop: false,
        locked: true,
        terminal: true,
        events: [
          {
            frameOffset: 1,
            name: "coreBurst"
          }
        ],
        completionEvent: "removeVisual"
      }
    },
    transitionRules: {
      priority: [
        "destroy",
        "hurt",
        "attack",
        "spawn",
        "bankLeft",
        "bankRight",
        "flight",
        "idle"
      ],
      destroyCannotBeInterrupted: true,
      gameplayCollisionIndependentOfArt: true,
      banking: "Choose left/right pose from actual lateral velocity; do not cycle left/right while flying straight.",
      fire: "Runtime must emit each animation event once; the atlas does not spawn gameplay projectiles.",
      destroy: "Gameplay hitbox must be removed when death starts; retain only the visual until animation completion."
    },
    palette: {
      titanium: "#E8EDF0",
      graphite: "#15202D",
      cyan: "#5CF5FF",
      warning: "#E84036"
    },
    catalogEntries: [
      "gaia-ch01-move",
      "gaia-ch01-attack",
      "gaia-ch01-destroy"
    ],
    provenance: {
      method: "OpenAI image_gen generation plus image_gen correction; lossless-alpha WebP export with ImageMagick",
      reference: "art-source/references/gaia_enemy_dossier_v1.jpeg",
      generatorOutputOriginal: "exec-72a4f9e1-be52-44d1-aef3-7db3b77916ad.png",
      generatorOutputCorrection: "exec-4925397f-381b-4ed8-bdd5-88d7456f959a.png",
      generatedAtUtcDate: "2026-10-14",
      preparedAtUtcDate: "2026-10-15",
      rights: "Generated for this project from an existing project design reference. No third-party stock downloaded. Rights to the inherited dossier reference were not independently audited; no legal clearance is claimed."
    },
    checksums: {
      "ch01-master-v1.png": "e5169673719ac12ddb442a1b0c8e28560ca7aa97b195decb82ce5ed25f4d32ff",
      "ch01-master-v2.png": "d0c9305f072cf37b6d4af5bd7e4d8252d23c83c65a6b734d2586e59fbb04bd63",
      "ch01-atlas-v1.webp": "ec2d3c48e3715450b4aefd6757dd0b49236437f699ac719c07e03c45360be430"
    },
    verificationLimits: [
      "Asset-only inspection and pixel analysis do not certify game integration.",
      "Combat animation transitions and fire timing still require real gameplay verification.",
      "No iPhone performance or memory measurement has been performed for this atlas."
    ]
  };

  // src/game/animation/ch01-animator.js
  var EPSILON_MS = 1e-7;
  var finite = (value, name) => {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
    return value;
  };
  var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  var rectangles = Object.freeze(ch01_atlas_v1_default.frames.map((frame) => {
    const { x, y, width, height } = frame.rect;
    if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > ch01_atlas_v1_default.dimensions.width || y + height > ch01_atlas_v1_default.dimensions.height) {
      throw new RangeError("CH-01 frame lies outside its atlas");
    }
    return Object.freeze({ ...frame.rect });
  }));
  var animations = Object.freeze(Object.fromEntries(Object.entries(ch01_atlas_v1_default.animations).map(([name, definition]) => {
    if (definition.frames.length !== definition.durationMs.length || !definition.frames.length || definition.frames.some((index) => !Number.isInteger(index) || !rectangles[index]) || definition.durationMs.some((duration) => !Number.isFinite(duration) || duration <= 0)) {
      throw new RangeError(`Invalid CH-01 animation: ${name}`);
    }
    const durations = Object.freeze([...definition.durationMs]);
    const events = Object.freeze((definition.events || []).map((event) => {
      if (!Number.isInteger(event.frameOffset) || event.frameOffset < 0 || event.frameOffset >= definition.frames.length) {
        throw new RangeError(`Invalid CH-01 event: ${name}`);
      }
      return Object.freeze({ ...event, atMs: durations.slice(0, event.frameOffset).reduce((sum, value) => sum + value, 0) });
    }).sort((a, b) => a.atMs - b.atMs));
    return [name, Object.freeze({
      ...definition,
      frames: Object.freeze([...definition.frames]),
      durationMs: durations,
      totalMs: durations.reduce((sum, value) => sum + value, 0),
      events
    })];
  })));
  var priority = (name) => {
    const index = ch01_atlas_v1_default.transitionRules.priority.indexOf(name);
    return index < 0 ? ch01_atlas_v1_default.transitionRules.priority.length : index;
  };
  var pivot = Object.freeze({ ...ch01_atlas_v1_default.pivot });
  var CH01_ATLAS = Object.freeze({
    image: ch01_atlas_v1_default.proposedRuntimeImage,
    revision: ch01_atlas_v1_default.revision,
    width: ch01_atlas_v1_default.dimensions.width,
    height: ch01_atlas_v1_default.dimensions.height,
    frameCount: rectangles.length,
    pivot,
    drawSize: ch01_atlas_v1_default.recommendedDrawSizeLogical
  });
  function createCh01Animator({
    hp = 2,
    maxHp = 2,
    maxDeltaSeconds = 0.05,
    bankThreshold = 16,
    initialState = "spawn"
  } = {}) {
    finite(maxHp, "maxHp");
    finite(hp, "hp");
    finite(maxDeltaSeconds, "maxDeltaSeconds");
    finite(bankThreshold, "bankThreshold");
    if (maxHp <= 0 || maxDeltaSeconds <= 0 || maxDeltaSeconds > 1 || bankThreshold < 0) {
      throw new RangeError("Invalid CH-01 animator bounds");
    }
    if (!Object.hasOwn(animations, initialState)) throw new RangeError("Unknown CH-01 initial state");
    let health = clamp(hp, 0, maxHp), maximumHealth = maxHp;
    let state = health === 0 ? "destroy" : initialState;
    if (state === "destroy") health = 0;
    let elapsedMs = 0, eventCursor = 0, done = false;
    let vx = 0, vy = 0, attackCounter = 0, attackId = state === "attack" ? ++attackCounter : null;
    let attackFired = false;
    let pending = [];
    function frameIndex() {
      const definition = animations[state];
      let end = 0;
      for (let offset = 0; offset < definition.frames.length; offset++) {
        end += definition.durationMs[offset];
        if (elapsedMs < end - EPSILON_MS) return definition.frames[offset];
      }
      return definition.frames.at(-1);
    }
    function baseState() {
      if (health / maximumHealth <= 0.5) return "damaged";
      if (vx < -bankThreshold) return "bankLeft";
      if (vx > bankThreshold) return "bankRight";
      return Math.abs(vy) > bankThreshold ? "flight" : "idle";
    }
    function enter(next) {
      state = next;
      elapsedMs = 0;
      eventCursor = 0;
      done = false;
      attackId = next === "attack" ? ++attackCounter : null;
      attackFired = false;
      if (next === "destroy") health = 0;
    }
    function request(next) {
      if (!Object.hasOwn(animations, next)) throw new RangeError(`Unknown CH-01 animation: ${next}`);
      if (animations[state].terminal || state === next) return false;
      if (animations[state].locked && priority(next) >= priority(state)) return false;
      if (state === "attack") {
        pending.push({
          name: "attackCanceled",
          state,
          frameIndex: frameIndex(),
          atMs: elapsedMs,
          attackId,
          fired: attackFired
        });
      }
      enter(next);
      return true;
    }
    function update(dt, sample = {}) {
      finite(dt, "dt");
      if (dt < 0) throw new RangeError("dt must be nonnegative");
      const nextMax = sample.maxHp === void 0 ? maximumHealth : finite(sample.maxHp, "maxHp");
      if (nextMax <= 0) throw new RangeError("maxHp must be positive");
      const nextHealth = clamp(sample.hp === void 0 ? health : finite(sample.hp, "hp"), 0, nextMax);
      const nextVx = sample.vx === void 0 ? vx : finite(sample.vx, "vx");
      const nextVy = sample.vy === void 0 ? vy : finite(sample.vy, "vy");
      if (dt === 0) return [];
      if (!animations[state].terminal) {
        const lostHealth = nextHealth < health;
        health = nextHealth;
        maximumHealth = nextMax;
        vx = nextVx;
        vy = nextVy;
        if (health === 0) request("destroy");
        else if (lostHealth) request("hurt");
        else if (!animations[state].locked && state !== baseState()) enter(baseState());
      }
      const emitted = pending;
      pending = [];
      let remaining = Math.min(dt, maxDeltaSeconds) * 1e3;
      while (remaining > EPSILON_MS && !done) {
        const definition = animations[state];
        const step = Math.min(remaining, definition.totalMs - elapsedMs);
        elapsedMs += step;
        remaining -= step;
        while (eventCursor < definition.events.length && definition.events[eventCursor].atMs <= elapsedMs + EPSILON_MS) {
          const event = definition.events[eventCursor++];
          if (event.name === "fire") attackFired = true;
          emitted.push({
            name: event.name,
            state,
            frameIndex: definition.frames[event.frameOffset],
            atMs: event.atMs,
            attackId
          });
        }
        if (elapsedMs + EPSILON_MS < definition.totalMs) break;
        if (definition.terminal) {
          done = true;
          if (definition.completionEvent) emitted.push({
            name: definition.completionEvent,
            state,
            frameIndex: frameIndex(),
            atMs: definition.totalMs,
            attackId
          });
        } else if (definition.loop) {
          elapsedMs = 0;
          eventCursor = 0;
        } else {
          enter(baseState());
        }
      }
      return emitted;
    }
    function getFrame() {
      const index = frameIndex();
      return {
        state,
        frameIndex: index,
        rect: rectangles[index],
        pivot,
        drawSize: CH01_ATLAS.drawSize,
        image: CH01_ATLAS.image,
        done,
        terminal: Boolean(animations[state].terminal),
        damageRatio: 1 - health / maximumHealth,
        damaged: health / maximumHealth <= 0.5,
        attackId,
        hp: health,
        maxHp: maximumHealth
      };
    }
    return Object.freeze({ request, update, getFrame });
  }

  // src/game/progression/encounter-director.js
  var clamp2 = (value, min, max) => Math.max(min, Math.min(max, value));
  var EncounterDirector = class {
    constructor(level, options) {
      this.plan = generateLevel(level, options);
      this.events = this.plan.waves.flatMap((wave) => wave.enemies.map((enemy) => ({ at: enemy.at, kind: "enemy", data: enemy })));
      this.events.push(...this.plan.pickups.map((pickup) => ({ at: pickup.at, kind: "pickup", data: pickup })));
      this.events.sort((a, b) => a.at - b.at || (a.data.id < b.data.id ? -1 : 1));
      this.reset();
    }
    reset() {
      this.elapsed = 0;
      this.cursor = 0;
      this.wave = 0;
    }
    advance(dt, spawn) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Finite nonnegative delta required");
      if (typeof spawn !== "function") throw new TypeError("Spawn callback required");
      this.elapsed += Math.min(0.05, dt);
      this.wave = Math.min(this.plan.waves.length, Math.max(0, Math.floor((this.elapsed - 2) / 8.5) + 1));
      while (this.cursor < this.events.length && this.events[this.cursor].at <= this.elapsed + 1e-9) {
        const event = this.events[this.cursor];
        spawn(makeLegacyEntity(event, this.plan));
        this.cursor++;
      }
    }
    get finished() {
      return this.cursor === this.events.length && this.elapsed >= this.plan.duration;
    }
    get reproduction() {
      return { level: this.plan.level, seed: this.plan.seed, version: this.plan.version };
    }
  };
  function makeLegacyEntity(event, plan) {
    const spec = event.data;
    const pickup = event.kind === "pickup";
    const pattern = pickup ? null : spec.type;
    return {
      id: spec.id,
      type: pickup ? "energy" : "meteor",
      x: spec.x,
      baseX: spec.x,
      y: -70,
      r: pickup ? 22 : 32,
      s: pickup ? 255 : 180 * spec.speedMultiplier,
      rot: 0,
      rs: 0,
      p: spec.phase,
      phase: spec.phase,
      amp: 0,
      special: "",
      alpha: 1,
      damage: pickup ? 0 : 24,
      spriteKey: pickup ? "" : pattern === "shooter" ? "meteorLarge" : "meteorMedium",
      hp: 2,
      maxHp: 2,
      shape: null,
      craters: null,
      variant: "",
      n7: pickup ? null : {
        pattern,
        bounds: spec.bounds,
        age: 0,
        nextFire: 1.5,
        telegraphSeconds: spec.telegraphSeconds,
        fireInterval: spec.fireInterval,
        projectileSpeed: 280 * spec.projectileMultiplier,
        telegraph: 0,
        fired: 0,
        phase: spec.phase,
        corridor: plan.corridor,
        ch01Animator: pattern === "shooter" ? createCh01Animator() : null,
        attackScheduled: false
      }
    };
  }
  function advanceEnemy(item, dt, player, spawnProjectile) {
    const behavior = item.n7;
    if (!behavior) return;
    behavior.age += dt;
    const { bounds } = behavior;
    if (behavior.pattern === "zigzag") {
      const mid = (bounds.min + bounds.max) / 2;
      item.x = mid + Math.sin(behavior.age * 2.2 + behavior.phase) * (bounds.max - bounds.min) / 2;
    } else if (behavior.pattern === "chaser" && item.y < player.y - 230) {
      const target = clamp2(player.x, bounds.min, bounds.max);
      item.x += clamp2(target - item.x, -100 * dt, 100 * dt);
    }
    item.x = clamp2(item.x, bounds.min, bounds.max);
    if (behavior.pattern !== "shooter") return;
    const animator = behavior.ch01Animator;
    const inRange = item.y >= 0 && item.y <= player.y - 260;
    if (animator && inRange && behavior.fired < 3 && behavior.age >= behavior.nextFire - 0.16 && !behavior.attackScheduled) {
      behavior.attackScheduled = animator.request("attack");
    }
    const animationEvents = animator?.update(dt, { hp: item.hp, maxHp: item.maxHp, vy: item.s }) || [];
    for (const event of animationEvents) {
      if (event.name === "attackCanceled" && !event.fired) {
        behavior.attackScheduled = false;
        behavior.nextFire = behavior.age + Math.max(0.8, behavior.telegraphSeconds);
      }
    }
    if (!inRange) {
      behavior.telegraph = 0;
      return;
    }
    behavior.telegraph = clamp2(1 - (behavior.nextFire - behavior.age) / behavior.telegraphSeconds, 0, 1);
    if (behavior.fired >= 3 || animator && !animationEvents.some((event) => event.name === "fire") || !animator && behavior.age + 1e-9 < behavior.nextFire) return;
    spawnProjectile({
      id: `${item.id}:shot:${++behavior.fired}`,
      type: "meteor",
      x: item.x,
      baseX: item.x,
      y: item.y + 38,
      r: 9,
      s: behavior.projectileSpeed,
      damage: 16,
      rot: 0,
      rs: 0,
      p: 0,
      phase: 0,
      amp: 0,
      special: "",
      alpha: 1,
      spriteKey: "",
      hp: 1,
      maxHp: 1,
      shape: null,
      craters: null,
      n7Projectile: true
    });
    behavior.nextFire += behavior.fireInterval;
    behavior.attackScheduled = false;
    behavior.telegraph = 0;
  }

  // src/game/progression/classic-scout.js
  var clamp3 = (value, low, high) => Math.max(low, Math.min(high, value));
  function createClassicScout({ x, phase = 0, width = 720 } = {}) {
    if (![x, phase, width].every(Number.isFinite) || width < 250) throw new RangeError("Invalid scout spawn");
    return {
      age: 0,
      baseX: x,
      phase,
      width,
      nextFire: 1.7,
      fireInterval: 1.9,
      fired: 0,
      telegraph: 0,
      attackScheduled: false,
      animator: createCh01Animator({ hp: 2, maxHp: 2 })
    };
  }
  function advanceClassicScout(item, dt, player, spawnProjectile) {
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Invalid scout delta");
    if (typeof spawnProjectile !== "function") throw new TypeError("Spawn callback required");
    const scout = item.classicScout;
    if (!scout || dt === 0) return;
    scout.age += dt;
    const previousX = item.x;
    item.x = clamp3(
      scout.baseX + Math.sin(scout.age * 1.35 + scout.phase) * 28,
      52,
      scout.width - 52
    );
    const inRange = item.y >= 0 && item.y < player.y - 270;
    if (inRange && scout.fired < 2 && scout.age >= scout.nextFire - 0.46 && !scout.attackScheduled) {
      scout.attackScheduled = scout.animator.request("attack");
    }
    const events = scout.animator.update(dt, {
      hp: item.hp,
      maxHp: item.maxHp,
      vx: (item.x - previousX) / dt,
      vy: item.s
    });
    for (const event of events) {
      if (event.name === "attackCanceled" && !event.fired) {
        scout.attackScheduled = false;
        scout.nextFire = scout.age + 1.1;
      }
    }
    scout.telegraph = inRange && scout.attackScheduled ? clamp3(1 - (scout.nextFire - scout.age) / 0.46, 0, 1) : 0;
    if (!inRange || scout.fired >= 2 || !events.some((event) => event.name === "fire")) return;
    spawnProjectile({
      type: "meteor",
      x: item.x,
      baseX: item.x,
      y: item.y + 38,
      r: 9,
      s: 295,
      damage: 16,
      rot: 0,
      rs: 0,
      p: 0,
      phase: 0,
      amp: 0,
      special: "",
      alpha: 1,
      hp: 1,
      maxHp: 1,
      classicScoutProjectile: true
    });
    scout.fired++;
    scout.nextFire = scout.age + scout.fireInterval;
    scout.attackScheduled = false;
    scout.telegraph = 0;
  }

  // src/game/narrative/n7-dialogues.js
  var N7_DIALOGUES = Object.freeze({
    sectorStart: Object.freeze({
      1: "N-7 en l\xEDnea. Bienvenido a los Suburbios Ne\xF3n. Aprende a leer las corrientes.",
      2: "Las redes urbanas despiertan. Cada paquete de datos es una pista.",
      3: "Los procesadores industriales est\xE1n fuera de control. Mant\xE9n la nave estable.",
      4: "La Matriz Cibern\xE9tica registra nuestros movimientos. Evita sus centinelas.",
      5: "Entramos en el Abismo. Mi origen est\xE1 al otro lado del n\xFAcleo."
    }),
    bossWarning: Object.freeze({
      10: "Firma hostil detectada: Centinela Prisma. Prep\xE1rate para dos fases.",
      20: "Guardi\xE1n del Umbral en ruta. Su barrera no permanecer\xE1 activa siempre.",
      30: "Firewall Viviente. Observa sus disparos antes de contraatacar.",
      40: "Arquitecto de Datos. Sus defensas se reorganizan.",
      50: "Forjador de Silicio. El calor de sus sistemas altera el campo.",
      60: "Tit\xE1n de Procesos. Detecto una segunda fase blindada.",
      70: "Supervisor de Nodos. Sus proyectiles se dispersan en abanico.",
      80: "Matriz Centinela. Espera la ca\xEDda de su barrera.",
      90: "Eco del Abismo. Sus se\xF1ales imitan las m\xEDas.",
      100: "El n\xFAcleo corrupto usa mi firma. No confundas su voz con la m\xEDa."
    }),
    criticalHull: "Integridad cr\xEDtica. Prioriza la supervivencia y busca reparaci\xF3n.",
    perfectStreak: "Racha perfecta confirmada. La sincronizaci\xF3n es extraordinaria."
  });
  function n7Dialogue(event, { level, hull, perfectStreak = false } = {}) {
    if (event === "sectorStart") {
      if (!Number.isInteger(level) || level < 1 || level > 100) return null;
      return (level - 1) % 20 === 0 ? N7_DIALOGUES.sectorStart[Math.floor((level - 1) / 20) + 1] : null;
    }
    if (event === "bossWarning") return N7_DIALOGUES.bossWarning[level] ?? null;
    if (event === "criticalHull") return Number.isFinite(hull) && hull <= 20 ? N7_DIALOGUES.criticalHull : null;
    if (event === "perfectStreak") return perfectStreak ? N7_DIALOGUES.perfectStreak : null;
    return null;
  }

  // src/game/progression/legacy-content-entry.js
  var palettes = [
    { accent: "#62edff", top: "#142740", mid: "#081426", scene: "orbit" },
    { accent: "#8b9dff", top: "#261c45", mid: "#0d1028", scene: "rift" },
    { accent: "#ffb368", top: "#392317", mid: "#20120e", scene: "belt" },
    { accent: "#88f1bb", top: "#103a38", mid: "#071c22", scene: "ion" },
    { accent: "#de87ff", top: "#261333", mid: "#100b1f", scene: "dark" }
  ];
  var LEVELS = Object.freeze(AUTHORED_LEVELS.map((design) => Object.freeze({
    ...palettes[design.sectorId - 1],
    name: design.title,
    goal: design.goal,
    speed: 1 + (design.level - 1) / 150,
    spawn: 1,
    meteor: 0,
    power: 0,
    hazard: "n7",
    world: design.sectorName.toUpperCase(),
    enemyCue: design.mechanics.join(" / "),
    zone: `Ruta ${design.withinSector} \xB7 ${design.sectorName}`,
    desc: "Recupera los fragmentos y sobrevive a todas las oleadas",
    mission: design.mission,
    threatLabel: design.mechanics.join(" \xB7 "),
    threatPool: Object.freeze(["meteor"]),
    gate: 0,
    sectorId: design.sectorId,
    bossEncounter: design.isBoss
  })));
  return __toCommonJS(legacy_content_entry_exports);
})();
//# sourceMappingURL=content-runtime.js.map
