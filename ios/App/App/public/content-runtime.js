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
    CHRONOS_FLIGHT_VERSION: () => CHRONOS_FLIGHT_VERSION,
    CHRONOS_VOYAGE_KEY: () => CHRONOS_VOYAGE_KEY,
    CHRONOS_VOYAGE_STAGES: () => CHRONOS_VOYAGE_STAGES,
    CHRONOS_VOYAGE_VERSION: () => CHRONOS_VOYAGE_VERSION,
    CLASSIC_WEAPON_RULES: () => CLASSIC_WEAPON_RULES,
    EncounterDirector: () => EncounterDirector,
    GENERATOR_VERSION: () => GENERATOR_VERSION,
    GUARDIAN_ATLAS_RULES: () => GUARDIAN_ATLAS_RULES,
    JOURNEY_DEMO_SAVE_KEY: () => JOURNEY_DEMO_SAVE_KEY,
    JOURNEY_DEMO_VERSION: () => JOURNEY_DEMO_VERSION,
    LEVELS: () => LEVELS,
    SHIP_FLEET: () => SHIP_FLEET,
    SHIP_FLEET_SAVE_KEY: () => SHIP_FLEET_SAVE_KEY,
    advanceClassicScout: () => advanceClassicScout,
    advanceClassicWeapons: () => advanceClassicWeapons,
    advanceEnemy: () => advanceEnemy,
    advanceGuardianAtlas: () => advanceGuardianAtlas,
    beginFlightInput: () => beginFlightInput,
    calculateFlightBounds: () => calculateFlightBounds,
    classicWeaponSnapshot: () => classicWeaponSnapshot,
    createChronosFlight: () => createChronosFlight,
    createChronosVoyage: () => createChronosVoyage,
    createChronosVoyageCheckpoint: () => createChronosVoyageCheckpoint,
    createClassicScout: () => createClassicScout,
    createClassicWeapons: () => createClassicWeapons,
    createCompletionJournal: () => createCompletionJournal,
    createGuardianAtlas: () => createGuardianAtlas,
    createJourneyDemo: () => createJourneyDemo,
    createRelativeFlightInput: () => createRelativeFlightInput,
    createVoyageScore: () => createVoyageScore,
    endFlightInput: () => endFlightInput,
    getChronosDestructionPose: () => getChronosDestructionPose,
    guardianAtlasAnimation: () => guardianAtlasAnimation,
    hitClassicProjectile: () => hitClassicProjectile,
    hitGuardianAtlas: () => hitGuardianAtlas,
    makeLegacyEntity: () => makeLegacyEntity,
    moveFlightInput: () => moveFlightInput,
    n7Dialogue: () => n7Dialogue,
    normalizeChronosVoyageCheckpoint: () => normalizeChronosVoyageCheckpoint,
    normalizeShipLoadout: () => normalizeShipLoadout,
    selectClassicWeapon: () => selectClassicWeapon,
    shipAssemblyPose: () => shipAssemblyPose,
    shipPartFrame: () => shipPartFrame,
    triggerClassicWeapon: () => triggerClassicWeapon,
    unlockClassicWeapon: () => unlockClassicWeapon
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

  // src/game/audio/voyage-score.js
  var VOYAGE_SCORE_VERSION = "chronos-score-v1";
  var SCORE_VOICE_LIMIT = 12;
  var note = (beat, midi, length, voice = "glass", level = 0.095) => Object.freeze({ beat, midi, length, voice, level });
  var phrase = (bpm, beats, notes) => Object.freeze({
    bpm,
    beats,
    notes: Object.freeze([...notes].sort((a, b) => a.beat - b.beat))
  });
  var transit = phrase(84, 32, [
    ...[38, 34, 41, 36].flatMap((root, bar) => [
      note(bar * 8, root, 3.5, "hull", 0.13),
      note(bar * 8 + 4, root + 12, 2.8, "hull", 0.075)
    ]),
    note(0, 62, 2.6, "air", 0.055),
    note(0, 69, 2.6, "air", 0.045),
    note(8, 65, 2.6, "air", 0.055),
    note(8, 69, 2.6, "air", 0.045),
    note(16, 65, 2.6, "air", 0.055),
    note(16, 72, 2.6, "air", 0.045),
    note(24, 64, 2.6, "air", 0.055),
    note(24, 67, 2.6, "air", 0.045),
    ...[
      [1.5, 74],
      [3, 69],
      [5.5, 77],
      [7, 76],
      [10, 74],
      [13, 69],
      [17.5, 77],
      [19, 79],
      [21.5, 81],
      [23, 77],
      [26, 76],
      [29, 74]
    ].map(([beat, midi]) => note(beat, midi, 0.85))
  ]);
  var atlas = phrase(120, 16, [
    ...[0, 2, 4, 6, 8, 10, 12, 14].map((beat, index) => note(beat, [38, 38, 41, 39, 38, 45, 39, 45][index], 0.65, "hull", 0.14)),
    ...[0, 1.5, 3, 4, 5.5, 7, 8, 9.5, 11, 12, 13.5, 15].map((beat, index) => note(beat, [62, 69, 65, 63, 69, 65, 62, 72, 69, 63, 69, 74][index], 0.34, "pulse", 0.075)),
    note(2.5, 74, 1, "glass", 0.085),
    note(6.5, 75, 1, "glass", 0.085),
    note(10.5, 77, 1, "glass", 0.085),
    note(14.5, 76, 0.8, "glass", 0.085)
  ]);
  var station = phrase(76, 16, [
    note(0, 41, 3.5, "hull", 0.1),
    note(4, 48, 2.5, "hull", 0.075),
    note(8, 46, 3.5, "hull", 0.1),
    note(12, 48, 2.5, "hull", 0.075),
    ...[[0, 65], [0, 69], [8, 62], [8, 69]].map(([beat, midi]) => note(beat, midi, 2.5, "air", 0.045)),
    ...[[1, 72], [3, 69], [5, 67], [7, 65], [9, 69], [11, 72], [14, 74]].map(([beat, midi]) => note(beat, midi, 1.1, "glass", 0.07))
  ]);
  var arrival = phrase(92, 16, [
    note(0, 38, 3.5, "hull", 0.11),
    note(4, 41, 3.5, "hull", 0.11),
    note(8, 36, 3.5, "hull", 0.1),
    note(12, 38, 3.5, "hull", 0.11),
    ...[[0, 62], [0, 69], [4, 65], [4, 72], [8, 64], [8, 67], [12, 66], [12, 69]].map(([beat, midi]) => note(beat, midi, 2.8, "air", 0.045)),
    ...[[0.5, 74], [2, 77], [4.5, 79], [6, 81], [8.5, 79], [10, 76], [12.5, 78], [14, 81]].map(([beat, midi]) => note(beat, midi, 1.15, "glass", 0.09))
  ]);
  var VOYAGE_SCORE_PHRASES = Object.freeze({ transit, atlas, station, arrival });
  var safeDisconnect = (node) => {
    try {
      node.disconnect();
    } catch {
    }
  };
  function createVoyageScore({ context, output }) {
    if (!context || !output) throw new TypeError("A shared AudioContext and music output are required");
    const active = /* @__PURE__ */ new Set();
    let selected = "transit", beat = 0, cursor = 0, cycles = 0;
    let enabled = true, paused = false, disposed = false, totalVoices = 0;
    function release(record) {
      if (!active.delete(record)) return;
      safeDisconnect(record.oscillator);
      safeDisconnect(record.gain);
      safeDisconnect(record.filter);
    }
    function stopVoices() {
      for (const record of [...active]) {
        try {
          record.oscillator.stop(context.currentTime);
        } catch {
        }
        release(record);
      }
    }
    function play(event2, delay) {
      if (active.size >= SCORE_VOICE_LIMIT) return;
      const now = context.currentTime + Math.max(0, delay);
      const seconds = Math.min(4, Math.max(0.07, event2.length * 60 / VOYAGE_SCORE_PHRASES[selected].bpm));
      const oscillator = context.createOscillator(), gain = context.createGain(), filter = context.createBiquadFilter();
      const hull = event2.voice === "hull", air = event2.voice === "air";
      oscillator.type = hull ? "triangle" : air ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(440 * 2 ** ((event2.midi - 69) / 12), now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(hull ? 360 : air ? 1400 : event2.voice === "pulse" ? 1700 : 3500, now);
      filter.Q.setValueAtTime(0.65, now);
      const attack = Math.min(seconds * 0.25, air ? 0.25 : hull ? 0.035 : 0.012);
      gain.gain.setValueAtTime(1e-4, now);
      gain.gain.linearRampToValueAtTime(event2.level, now + attack);
      gain.gain.exponentialRampToValueAtTime(1e-4, now + seconds);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      const record = { oscillator, gain, filter, end: now + seconds + 0.015 };
      active.add(record);
      totalVoices++;
      oscillator.onended = () => release(record);
      oscillator.start(now);
      oscillator.stop(record.end);
    }
    function advance(seconds) {
      if (disposed || !enabled || paused || context.state !== "running") return;
      const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(0.1, seconds)) : 0;
      if (!dt) return;
      for (const record of [...active]) if (record.end <= context.currentTime) release(record);
      const phrase2 = VOYAGE_SCORE_PHRASES[selected], beatsPerSecond = phrase2.bpm / 60;
      const endBeat = beat + dt * beatsPerSecond;
      while (cursor < phrase2.notes.length && phrase2.notes[cursor].beat <= endBeat) {
        const event2 = phrase2.notes[cursor++];
        play(event2, Math.max(0, event2.beat - beat) / beatsPerSecond);
      }
      beat = endBeat;
      if (beat >= phrase2.beats) {
        beat -= phrase2.beats;
        cursor = 0;
        cycles++;
      }
    }
    return Object.freeze({
      advance,
      setContext(value) {
        if (disposed || !Object.prototype.hasOwnProperty.call(VOYAGE_SCORE_PHRASES, value) || value === selected) return false;
        stopVoices();
        selected = value;
        beat = 0;
        cursor = 0;
        cycles = 0;
        return true;
      },
      setEnabled(value) {
        const next = value === true;
        if (disposed || enabled === next) return;
        enabled = next;
        if (!enabled) stopVoices();
      },
      setPaused(value) {
        const next = value === true;
        if (disposed || paused === next) return;
        paused = next;
        if (paused) stopVoices();
      },
      snapshot: () => Object.freeze({
        version: VOYAGE_SCORE_VERSION,
        context: selected,
        beat,
        cycles,
        activeVoices: active.size,
        totalVoices,
        enabled,
        paused,
        disposed
      }),
      dispose() {
        if (!disposed) {
          stopVoices();
          disposed = true;
        }
      }
    });
  }

  // src/game/progression/completion-journal.js
  function createCompletionJournal({
    storage,
    keys,
    levelCount,
    checkpointKey = null,
    validateCheckpoint = null
  } = {}) {
    const names = ["stars", "unlocked", "best", "levelBest"];
    if (!storage || !["readRaw", "set", "setJSON"].every((name) => typeof storage[name] === "function")) {
      throw new TypeError("Storage facade with tagged readRaw/set/setJSON required");
    }
    if (!Number.isSafeInteger(levelCount) || levelCount < 1 || !keys || !names.every((name) => typeof keys[name] === "string" && keys[name])) {
      throw new TypeError("Existing campaign keys and positive levelCount required");
    }
    keys = Object.freeze(Object.fromEntries(names.map((name) => [name, keys[name]])));
    const targets = names.map((name) => keys[name]);
    if (new Set(targets).size !== names.length || checkpointKey !== null && (typeof checkpointKey !== "string" || !checkpointKey || targets.includes(checkpointKey))) {
      throw new TypeError("Save keys must be distinct");
    }
    if (checkpointKey !== null && typeof validateCheckpoint !== "function") {
      throw new TypeError("Checkpoint writes require the runtime validator");
    }
    const journalKey = `${keys.unlocked}:completion-journal:v1`;
    if (targets.includes(journalKey) || checkpointKey === journalKey) throw new TypeError("Journal key collision");
    const scope = JSON.stringify([...targets, checkpointKey, levelCount]);
    const unreadable = Object.freeze({});
    const integer = (value, min = 0) => Number.isSafeInteger(value) && value >= min;
    const result = (ok, status, extra = {}) => ({ ok, status, ...extra });
    const blocked = (reason, key) => result(false, "blocked", { reason, key });
    const read = (key) => {
      try {
        const outcome = storage.readRaw(key);
        return outcome?.ok === true && (outcome.value === null || typeof outcome.value === "string") ? outcome.value : unreadable;
      } catch {
        return unreadable;
      }
    };
    const write = (key, value, json = false) => {
      try {
        return (json ? storage.setJSON(key, value) : storage.set(key, value)) === true;
      } catch {
        return false;
      }
    };
    const checkpointValid = (value) => {
      try {
        return validateCheckpoint(value) === true;
      } catch {
        return false;
      }
    };
    function parseNumber(raw, fallback, min = 0) {
      if (raw === null || raw === "") return fallback;
      const value = Number(raw);
      return integer(value, min) ? value : null;
    }
    function parseMap(raw) {
      if (raw === null) return {};
      try {
        const value = JSON.parse(raw);
        return value && typeof value === "object" && !Array.isArray(value) ? value : null;
      } catch {
        return null;
      }
    }
    function readSave2() {
      const raw = {};
      for (const name of names) {
        raw[name] = read(keys[name]);
        if (raw[name] === unreadable) return { error: blocked("storage-read-denied", keys[name]) };
      }
      const save = {
        raw,
        stars: parseMap(raw.stars),
        levelBest: parseMap(raw.levelBest),
        unlocked: parseNumber(raw.unlocked, 1, 1),
        best: parseNumber(raw.best, 0)
      };
      for (const name of names) if (save[name] === null) return { error: blocked("invalid-existing-save", keys[name]) };
      return save;
    }
    function validRecord(record) {
      if (!record || typeof record !== "object" || record.version !== 1 || record.scope !== scope || !["pending", "committed"].includes(record.phase) || typeof record.id !== "string" || record.id.length < 1 || record.id.length > 200 || !integer(record.level, 1) || record.level > levelCount || !integer(record.stars, 1) || record.stars > 3 || !integer(record.score) || !integer(record.unlockTo, 1) || record.unlockTo > levelCount) return false;
      if (record.checkpoint === null) return true;
      return checkpointKey !== null && record.checkpoint && (record.checkpoint.before === null || typeof record.checkpoint.before === "string") && checkpointValid(record.checkpoint.after);
    }
    function readRecord() {
      const raw = read(journalKey);
      if (raw === unreadable) return { error: blocked("storage-read-denied", journalKey) };
      if (raw === null) return { record: null };
      try {
        const record = JSON.parse(raw);
        return validRecord(record) ? { record } : { error: blocked("invalid-journal", journalKey) };
      } catch {
        return { error: blocked("invalid-journal", journalKey) };
      }
    }
    function replay(record) {
      const save = readSave2();
      if (save.error) return save.error;
      const key = String(record.level);
      const oldStars = parseNumber(save.stars[key] === void 0 ? null : save.stars[key], 0);
      const oldBest = parseNumber(save.levelBest[key] === void 0 ? null : save.levelBest[key], 0);
      if (oldStars === null || oldStars > 3) return blocked("invalid-existing-save", keys.stars);
      if (oldBest === null) return blocked("invalid-existing-save", keys.levelBest);
      let checkpointRaw = null, checkpointAfter = null;
      if (record.checkpoint !== null) {
        checkpointRaw = read(checkpointKey);
        if (checkpointRaw === unreadable) return blocked("storage-read-denied", checkpointKey);
        checkpointAfter = JSON.stringify(record.checkpoint.after);
        if (checkpointRaw !== record.checkpoint.before && checkpointRaw !== checkpointAfter) {
          return blocked("checkpoint-conflict", checkpointKey);
        }
      }
      const stars = { ...save.stars, [key]: Math.max(oldStars, record.stars) };
      const bests = { ...save.levelBest, [key]: Math.max(oldBest, record.score) };
      const writes = [
        [keys.stars, stars, true, save.raw.stars],
        [keys.levelBest, bests, true, save.raw.levelBest],
        [keys.best, Math.max(save.best, record.score), false, save.raw.best],
        ...record.checkpoint === null ? [] : [[checkpointKey, record.checkpoint.after, true, checkpointRaw]],
        [keys.unlocked, Math.max(save.unlocked, record.unlockTo), false, save.raw.unlocked]
      ];
      for (const [target, value, json, current] of writes) {
        if ((json ? JSON.stringify(value) : String(value)) === current) continue;
        if (!write(target, value, json)) return result(false, "pending", { reason: "storage-write-denied", key: target, completionId: record.id });
      }
      if (!write(journalKey, { ...record, phase: "committed" }, true)) {
        return result(false, "pending", { reason: "receipt-write-denied", key: journalKey, completionId: record.id });
      }
      return result(true, "committed", {
        completionId: record.id,
        newlyUnlocked: record.unlockTo > save.unlocked
      });
    }
    function recover() {
      const loaded = readRecord();
      if (loaded.error) return loaded.error;
      if (!loaded.record) return result(true, "idle");
      if (loaded.record.phase === "committed") return result(true, "committed", {
        completionId: loaded.record.id,
        duplicate: true
      });
      return { ...replay(loaded.record), recovered: true };
    }
    function complete({ completionId, level, stars, score, checkpoint = null } = {}) {
      if (typeof completionId !== "string" || !completionId || completionId.length > 200 || !integer(level, 1) || level > levelCount || !integer(stars, 1) || stars > 3 || !integer(score)) {
        throw new TypeError("Valid completionId, campaign level, stars and score required");
      }
      const recovery = recover();
      if (!recovery.ok || recovery.completionId === completionId) return recovery;
      const save = readSave2();
      if (save.error) return save.error;
      if (save.unlocked > levelCount) return blocked("unsupported-campaign-progress", keys.unlocked);
      let checkpointIntent = null;
      if (checkpoint !== null) {
        if (!checkpointKey || !checkpointValid(checkpoint)) throw new TypeError("Invalid completion checkpoint");
        const before = read(checkpointKey);
        if (before === unreadable) return blocked("storage-read-denied", checkpointKey);
        if (before !== null) {
          try {
            if (!checkpointValid(JSON.parse(before))) return blocked("invalid-existing-checkpoint", checkpointKey);
          } catch {
            return blocked("invalid-existing-checkpoint", checkpointKey);
          }
        }
        let after;
        try {
          after = JSON.parse(JSON.stringify(checkpoint));
        } catch {
          throw new TypeError("Checkpoint must be JSON data");
        }
        if (!checkpointValid(after)) throw new TypeError("Invalid JSON checkpoint");
        checkpointIntent = { before, after };
      }
      const record = {
        version: 1,
        scope,
        phase: "pending",
        id: completionId,
        level,
        stars,
        score,
        unlockTo: save.unlocked === level ? Math.min(levelCount, level + 1) : save.unlocked,
        checkpoint: checkpointIntent
      };
      if (!write(journalKey, record, true)) return result(false, "blocked", {
        reason: "intent-write-denied",
        key: journalKey,
        completionId
      });
      return replay(record);
    }
    return Object.freeze({ complete, recover, journalKey });
  }

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
    const events = Object.freeze((definition.events || []).map((event2) => {
      if (!Number.isInteger(event2.frameOffset) || event2.frameOffset < 0 || event2.frameOffset >= definition.frames.length) {
        throw new RangeError(`Invalid CH-01 event: ${name}`);
      }
      return Object.freeze({ ...event2, atMs: durations.slice(0, event2.frameOffset).reduce((sum, value) => sum + value, 0) });
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
          const event2 = definition.events[eventCursor++];
          if (event2.name === "fire") attackFired = true;
          emitted.push({
            name: event2.name,
            state,
            frameIndex: definition.frames[event2.frameOffset],
            atMs: event2.atMs,
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
        const event2 = this.events[this.cursor];
        spawn(makeLegacyEntity(event2, this.plan));
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
  function makeLegacyEntity(event2, plan) {
    const spec = event2.data;
    const pickup = event2.kind === "pickup";
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
    for (const event2 of animationEvents) {
      if (event2.name === "attackCanceled" && !event2.fired) {
        behavior.attackScheduled = false;
        behavior.nextFire = behavior.age + Math.max(0.8, behavior.telegraphSeconds);
      }
    }
    if (!inRange) {
      behavior.telegraph = 0;
      return;
    }
    behavior.telegraph = clamp2(1 - (behavior.nextFire - behavior.age) / behavior.telegraphSeconds, 0, 1);
    if (behavior.fired >= 3 || animator && !animationEvents.some((event2) => event2.name === "fire") || !animator && behavior.age + 1e-9 < behavior.nextFire) return;
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
    for (const event2 of events) {
      if (event2.name === "attackCanceled" && !event2.fired) {
        scout.attackScheduled = false;
        scout.nextFire = scout.age + 1.1;
      }
    }
    scout.telegraph = inRange && scout.attackScheduled ? clamp3(1 - (scout.nextFire - scout.age) / 0.46, 0, 1) : 0;
    if (!inRange || scout.fired >= 2 || !events.some((event2) => event2.name === "fire")) return;
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

  // src/game/progression/journey-demo.js
  var JOURNEY_DEMO_VERSION = "chronos-gaia-demo-v1";
  var JOURNEY_DEMO_SAVE_KEY = "neonCatcher.journeyDemo.v1";
  var JOURNEY_DEMO_MAX_DELTA = 0.034;
  var JOURNEY_DEMO_REWARD = 120;
  var freezeEvent = (event2) => Object.freeze(event2);
  var JOURNEY_DEMO_SEGMENTS = Object.freeze([
    Object.freeze({
      id: "departure",
      chapter: 1,
      stage: "demo-departure",
      name: "Salida de Chronos",
      origin: "Centro Chronos",
      destination: "Baliza de servicio C-9",
      duration: 20,
      events: Object.freeze([
        freezeEvent({ id: "departure-scout", type: "enemy", at: 4, entityId: "chronos-scout", entry: "left", pattern: "scout" }),
        freezeEvent({ id: "recovered-propulsion", type: "partAvailable", at: 10, partId: "relay-drive", name: "Propulsor de relevo" })
      ])
    }),
    Object.freeze({
      id: "transit",
      chapter: 1,
      stage: "demo-transit",
      name: "Corredor hacia Gaia",
      origin: "Baliza de servicio C-9",
      destination: "Aproximaci\xF3n a Gaia Nova",
      duration: 24,
      events: Object.freeze([
        freezeEvent({ id: "transit-scout", type: "enemy", at: 8, entityId: "relay-scout", entry: "right", pattern: "scout" })
      ])
    }),
    Object.freeze({
      id: "border",
      chapter: 1,
      stage: "demo-border",
      name: "Frontera Atlas",
      origin: "Aproximaci\xF3n a Gaia Nova",
      destination: "Acceso Atlas de Gaia Nova",
      duration: 20,
      events: Object.freeze([
        freezeEvent({ id: "atlas-guardian", type: "border", at: 3, entityId: "atlas-guardian", entry: "top", pattern: "guardian" })
      ])
    })
  ]);
  var TOTAL_DURATION = JOURNEY_DEMO_SEGMENTS.reduce((sum, segment) => sum + segment.duration, 0);
  var NOOP = () => {
  };
  var CHECKPOINT_IDS = Object.freeze(["chronos-departure", "relay-station", "relay-transit", "atlas-border", "gaia-arrival"]);
  function makeSave(checkpointId, partInstalled = false, collectedAtDeparture = false) {
    const index = CHECKPOINT_IDS.indexOf(checkpointId), complete = index === 4;
    return Object.freeze({
      schemaVersion: 1,
      contentVersion: JOURNEY_DEMO_VERSION,
      checkpointId,
      partCollected: index > 0 || collectedAtDeparture,
      partInstalled: index > 1 || partInstalled,
      borderResolved: complete,
      completionRewardGranted: complete,
      credits: complete ? JOURNEY_DEMO_REWARD : 0
    });
  }
  function readSave(saved) {
    if (saved === void 0 || saved === null) return { value: makeSave(CHECKPOINT_IDS[0]), recovery: "new" };
    let value = saved;
    try {
      if (typeof value === "string") value = JSON.parse(value);
    } catch {
      return { value: makeSave(CHECKPOINT_IDS[0]), recovery: "invalid-save" };
    }
    if (!value || typeof value !== "object" || Array.isArray(value) || value.schemaVersion !== 1 || value.contentVersion !== JOURNEY_DEMO_VERSION || !CHECKPOINT_IDS.includes(value.checkpointId)) {
      return { value: makeSave(CHECKPOINT_IDS[0]), recovery: "invalid-save" };
    }
    const canonical = makeSave(
      value.checkpointId,
      value.checkpointId === "relay-station" && value.partInstalled === true,
      value.checkpointId === "chronos-departure" && value.partCollected === true
    );
    if (Object.keys(canonical).some((key) => value[key] !== canonical[key])) {
      return { value: makeSave(CHECKPOINT_IDS[0]), recovery: "invalid-save" };
    }
    return { value: canonical, recovery: "checkpoint" };
  }
  function createJourneyDemo(saved) {
    const restored = readSave(saved);
    let save = restored.value, segmentIndex = 0, elapsed = 0, phase = "travel", paused = false;
    let partCollected = save.partCollected, partInstalled = save.partInstalled, partAvailable = false;
    let borderResolved = save.borderResolved, borderActive = false, credits = save.credits;
    const fired = /* @__PURE__ */ new Set();
    if (save.checkpointId === "relay-station") {
      phase = "station";
      elapsed = JOURNEY_DEMO_SEGMENTS[0].duration;
    } else if (save.checkpointId === "relay-transit") {
      segmentIndex = 1;
    } else if (save.checkpointId === "atlas-border") {
      segmentIndex = 2;
    } else if (save.checkpointId === "gaia-arrival") {
      segmentIndex = 2;
      elapsed = JOURNEY_DEMO_SEGMENTS[2].duration;
      phase = "complete";
    }
    function routeElapsed() {
      let total = elapsed;
      for (let index = 0; index < segmentIndex; index++) total += JOURNEY_DEMO_SEGMENTS[index].duration;
      return total;
    }
    function snapshot() {
      const segment = JOURNEY_DEMO_SEGMENTS[segmentIndex];
      return Object.freeze({
        version: JOURNEY_DEMO_VERSION,
        segmentId: segment.id,
        segmentIndex,
        segment,
        origin: segment.origin,
        destination: segment.destination,
        elapsed,
        segmentProgress: elapsed / segment.duration,
        routeElapsed: routeElapsed(),
        routeDuration: TOTAL_DURATION,
        routeProgress: routeElapsed() / TOTAL_DURATION,
        phase,
        paused,
        partAvailable,
        partCollected,
        partInstalled,
        engineBoost: partInstalled,
        propulsionMultiplier: partInstalled ? 1.2 : 1,
        borderActive,
        borderResolved,
        credits,
        completionRewardGranted: save.completionRewardGranted,
        waitingFor: phase === "station" ? partInstalled ? "continue" : "install" : phase === "travel" && segmentIndex === 0 && elapsed === segment.duration && !partCollected ? "part" : phase === "travel" && segmentIndex === 2 && elapsed === segment.duration && !borderResolved ? "border" : null,
        checkpointId: save.checkpointId,
        recovery: restored.recovery
      });
    }
    function emitEvent(emit, event2) {
      if (fired.has(event2.id)) return;
      fired.add(event2.id);
      emit(Object.freeze({ ...event2, segmentId: JOURNEY_DEMO_SEGMENTS[segmentIndex].id, version: JOURNEY_DEMO_VERSION }));
    }
    function advance(dt, emit = NOOP) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Finite nonnegative delta required");
      if (typeof emit !== "function") throw new TypeError("emit must be a function");
      if (paused || phase !== "travel") return snapshot();
      const segment = JOURNEY_DEMO_SEGMENTS[segmentIndex];
      elapsed = Math.min(segment.duration, elapsed + Math.min(dt, JOURNEY_DEMO_MAX_DELTA));
      for (const event2 of segment.events) {
        if (elapsed < event2.at || fired.has(event2.id) || event2.type === "partAvailable" && partCollected) continue;
        if (event2.type === "partAvailable" && !partCollected) partAvailable = true;
        if (event2.type === "border") borderActive = true;
        emitEvent(emit, event2);
      }
      if (elapsed === segment.duration) {
        if (segmentIndex === 0 && partCollected) {
          phase = "station";
          save = makeSave("relay-station", partInstalled);
          emitEvent(emit, { id: "relay-arrival", type: "station", at: 20, stationId: "relay-c9" });
        } else if (segmentIndex === 1) {
          segmentIndex = 2;
          elapsed = 0;
          save = makeSave("atlas-border");
          emitEvent(emit, { id: "border-start", type: "segmentStart", at: 0 });
        } else if (segmentIndex === 2 && borderResolved) {
          phase = "complete";
          credits = JOURNEY_DEMO_REWARD;
          save = makeSave("gaia-arrival");
          emitEvent(emit, { id: "gaia-arrival", type: "complete", at: 20, reward: JOURNEY_DEMO_REWARD });
        }
      }
      return snapshot();
    }
    return Object.freeze({
      snapshot,
      checkpoint: () => save,
      setPaused(value) {
        if (typeof value !== "boolean") throw new TypeError("paused must be boolean");
        paused = value;
        return snapshot();
      },
      advance,
      collectPart() {
        if (paused || phase !== "travel" || segmentIndex !== 0 || !partAvailable || partCollected) return false;
        partCollected = true;
        partAvailable = false;
        save = makeSave("chronos-departure", false, true);
        return true;
      },
      serviceInstall() {
        if (paused || phase !== "station" || !partCollected || partInstalled) return false;
        partInstalled = true;
        save = makeSave("relay-station", true);
        return true;
      },
      resumeFromStation() {
        if (paused || phase !== "station" || !partInstalled) return false;
        phase = "travel";
        segmentIndex = 1;
        elapsed = 0;
        save = makeSave("relay-transit");
        return true;
      },
      resolveBorder() {
        if (paused || phase !== "travel" || segmentIndex !== 2 || !borderActive || borderResolved) return false;
        borderResolved = true;
        borderActive = false;
        return true;
      }
    });
  }

  // src/game/combat/guardian-atlas.js
  var clamp4 = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  var finite2 = (value, name) => {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
    return value;
  };
  var GUARDIAN_ATLAS_RULES = Object.freeze({
    version: "guardian-atlas-v2",
    maxHp: 36,
    maxDelta: 0.05,
    entrySeconds: 2.2,
    arrivalSeconds: 1.35,
    phaseBreakSeconds: 1.65,
    shutdownSeconds: 1.55,
    hurtSeconds: 0.16,
    phaseOne: Object.freeze({
      chargeSeconds: 1.05,
      fireSeconds: 0.28,
      recoverySeconds: 1.25,
      projectileSpeed: 340,
      projectileDamage: 14
    }),
    phaseTwo: Object.freeze({
      chargeSeconds: 1.2,
      fireSeconds: 0.64,
      secondVolleyAt: 0.36,
      recoverySeconds: 1.45,
      projectileSpeed: 315,
      projectileDamage: 12
    })
  });
  function createGuardianAtlas({
    width = 720,
    height = 1280,
    playerY = height - 135,
    seed = 1096043585
  } = {}) {
    finite2(width, "width");
    finite2(height, "height");
    finite2(playerY, "playerY");
    if (width < 280 || height < 540 || playerY < 430 || playerY > height - 24 || !Number.isInteger(seed)) throw new RangeError("Invalid Guardian Atlas arena");
    const radius = Math.min(104, width * 0.19);
    const targetY = Math.min(height * 0.22, playerY - 360);
    return {
      type: "guardianAtlas",
      version: GUARDIAN_ATLAS_RULES.version,
      width,
      height,
      playerY,
      seed: seed >>> 0 || 1,
      x: width / 2,
      y: -radius * 1.6,
      baseX: width / 2,
      targetY,
      r: radius,
      s: 0,
      rot: 0,
      rs: 0,
      p: 0,
      amp: 0,
      alpha: 1,
      hp: GUARDIAN_ATLAS_RULES.maxHp,
      maxHp: GUARDIAN_ATLAS_RULES.maxHp,
      age: 0,
      state: "entry",
      stateTime: 0,
      phase: 1,
      vulnerability: false,
      telegraph: null,
      disabled: false,
      resolved: false,
      attackId: 0,
      volley: 0,
      lastGapIndex: -1,
      phaseTwoAttacks: 0,
      attackClearanceSeconds: 0,
      flash: 0,
      resumeState: null,
      resumeTime: 0
    };
  }
  function nextRandom(boss) {
    let value = boss.seed;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    boss.seed = value >>> 0;
    return boss.seed / 4294967296;
  }
  function rules(boss) {
    return boss.phase === 1 ? GUARDIAN_ATLAS_RULES.phaseOne : GUARDIAN_ATLAS_RULES.phaseTwo;
  }
  function transition(boss, next, events) {
    boss.state = next;
    boss.stateTime = 0;
    boss.vulnerability = next === "idle" || next === "fire" || next === "hurt";
    events.push({ type: "state", state: next, phase: boss.phase, attackId: boss.attackId });
  }
  function beginCharge(boss, player, events) {
    boss.attackId++;
    boss.volley = 0;
    boss.attackClearanceSeconds = 0;
    const timing = rules(boss);
    const originY = boss.y + boss.r * 0.7;
    if (boss.phase === 2) boss.phaseTwoAttacks++;
    const curtain = boss.phase === 2 && (boss.width < 600 || boss.phaseTwoAttacks % 2 === 1);
    let safeGap = null;
    if (curtain) {
      let index = Math.floor(nextRandom(boss) * 3);
      if (index === boss.lastGapIndex) index = (index + 1) % 3;
      boss.lastGapIndex = index;
      const halfWidth = Math.min(Math.max(135, boss.width * 0.17), boss.width / 2 - 14);
      const center = clamp4(
        boss.width * [0.28, 0.5, 0.72][index],
        halfWidth + 14,
        boss.width - halfWidth - 14
      );
      safeGap = { left: center - halfWidth, right: center + halfWidth, center };
    }
    boss.telegraph = {
      kind: curtain ? "openCorridor" : "aimedSalvo",
      pattern: curtain ? "curtain" : boss.phase === 2 ? "crossfire" : "focusedSalvo",
      progress: 0,
      targetX: clamp4(player.x, 24, boss.width - 24),
      targetY: clamp4(Number.isFinite(player.y) ? player.y : boss.playerY, 24, boss.height - 24),
      originX: boss.x,
      originY,
      seconds: timing.chargeSeconds,
      safeGap,
      attackId: boss.attackId
    };
    transition(boss, "charge", events);
    events.push({
      type: "warning",
      phase: boss.phase,
      ...boss.telegraph,
      safeGap: safeGap && { ...safeGap }
    });
  }
  function projectile(boss, x, y, vx, vy, ordinal) {
    const timing = rules(boss);
    return {
      type: "meteor",
      guardianProjectile: true,
      pattern: boss.telegraph.kind,
      attackId: boss.attackId,
      volley: boss.volley,
      projectileId: `${boss.attackId}:${boss.volley}:${ordinal}`,
      x,
      baseX: x,
      y,
      vx,
      vy,
      s: vy,
      r: boss.phase === 1 ? 10 : 11,
      damage: timing.projectileDamage,
      duration: 7,
      life: 7,
      telegraphSeconds: timing.chargeSeconds,
      safeGap: boss.telegraph.safeGap && { ...boss.telegraph.safeGap },
      targetX: boss.telegraph.targetX,
      targetY: boss.telegraph.targetY,
      rot: Math.atan2(vy, vx) - Math.PI / 2,
      rs: 0,
      p: 0,
      phase: 0,
      amp: 0,
      special: "",
      alpha: 1,
      hp: 1,
      maxHp: 1
    };
  }
  function fireVolley(boss, events) {
    const timing = rules(boss);
    const aim = boss.telegraph;
    const shots = [];
    if (aim.kind === "aimedSalvo") {
      const originX = aim.originX + (boss.phase === 2 ? (boss.volley === 0 ? -1 : 1) * boss.r * 0.72 : 0);
      const direction = Math.atan2(aim.targetY - aim.originY, aim.targetX - originX);
      const spread = boss.phase === 1 ? 0.085 : 0.075;
      for (const [index, offset] of [-spread, -spread / 2, 0, spread / 2, spread].entries()) {
        const angle = direction + offset;
        const shot = projectile(
          boss,
          originX,
          aim.originY,
          Math.cos(angle) * timing.projectileSpeed,
          Math.sin(angle) * timing.projectileSpeed,
          index
        );
        shots.push(shot);
      }
    } else {
      for (let index = 0; index < 9; index++) {
        const x = 12 + (boss.width - 24) * index / 8;
        if (x >= aim.safeGap.left - 12 && x <= aim.safeGap.right + 12) continue;
        const shot = projectile(boss, x, aim.originY, 0, timing.projectileSpeed, index);
        shots.push(shot);
      }
    }
    for (const shot of shots) {
      boss.attackClearanceSeconds = Math.max(
        boss.attackClearanceSeconds,
        boss.stateTime + (boss.playerY + 104 + shot.r - shot.y) / shot.vy
      );
      events.push({ type: "projectile", projectile: shot });
    }
    events.push({ type: "volley", attackId: boss.attackId, phase: boss.phase, volley: boss.volley });
    boss.volley++;
  }
  function stateDuration(boss) {
    if (boss.state === "entry") return GUARDIAN_ATLAS_RULES.entrySeconds;
    if (boss.state === "phaseBreak") return GUARDIAN_ATLAS_RULES.phaseBreakSeconds;
    if (boss.state === "disabled") return GUARDIAN_ATLAS_RULES.shutdownSeconds;
    if (boss.state === "hurt") return GUARDIAN_ATLAS_RULES.hurtSeconds;
    if (boss.state === "charge") return rules(boss).chargeSeconds;
    if (boss.state === "fire") return rules(boss).fireSeconds;
    if (boss.attackId === 0) return GUARDIAN_ATLAS_RULES.arrivalSeconds;
    const timing = rules(boss);
    return Math.max(
      timing.recoverySeconds,
      boss.attackClearanceSeconds + 0.3 - timing.fireSeconds
    );
  }
  function finishState(boss, player, events) {
    if (boss.state === "entry") {
      boss.y = boss.targetY;
      transition(boss, "idle", events);
      events.push({ type: "arrival", phase: 1 });
    } else if (boss.state === "idle") {
      beginCharge(boss, player, events);
    } else if (boss.state === "charge") {
      transition(boss, "fire", events);
      boss.telegraph.progress = 1;
      fireVolley(boss, events);
    } else if (boss.state === "fire") {
      boss.telegraph = null;
      transition(boss, "idle", events);
    } else if (boss.state === "phaseBreak") {
      transition(boss, "idle", events);
    } else if (boss.state === "hurt") {
      transition(boss, boss.resumeState || "idle", events);
      boss.stateTime = boss.resumeTime;
      boss.resumeState = null;
      boss.resumeTime = 0;
    } else if (boss.state === "disabled" && !boss.resolved) {
      boss.resolved = true;
      events.push({ type: "disabled", phase: boss.phase, rewardId: "guardian-atlas-access" });
    }
  }
  function advanceGuardianAtlas(boss, dt, player, emit = () => {
  }) {
    finite2(dt, "delta");
    if (dt < 0) throw new RangeError("Finite nonnegative delta required");
    if (typeof emit !== "function") throw new TypeError("Event callback required");
    if (!player || !Number.isFinite(player.x)) throw new TypeError("Player x must be finite");
    if (dt === 0 || boss.resolved) return [];
    const events = [];
    let remaining = Math.min(dt, GUARDIAN_ATLAS_RULES.maxDelta);
    boss.age += remaining;
    boss.flash = Math.max(0, boss.flash - remaining);
    while (remaining > 1e-10 && !boss.resolved) {
      const duration = stateDuration(boss);
      const step = Math.min(remaining, Math.max(0, duration - boss.stateTime));
      const before = boss.stateTime;
      boss.stateTime += step;
      remaining -= step;
      if (boss.state === "entry") {
        const progress = clamp4(boss.stateTime / duration, 0, 1);
        boss.y = -boss.r * 1.6 + (boss.targetY + boss.r * 1.6) * (1 - (1 - progress) ** 3);
      } else if (boss.state === "idle" || boss.state === "hurt") {
        boss.x = clamp4(
          boss.width / 2 + Math.sin(boss.age * 0.64) * boss.width * 0.11,
          boss.r + 12,
          boss.width - boss.r - 12
        );
      } else if (boss.state === "charge") {
        boss.telegraph.progress = clamp4(boss.stateTime / duration, 0, 1);
      } else if (boss.state === "fire" && boss.phase === 2 && boss.volley === 1 && before < rules(boss).secondVolleyAt && boss.stateTime >= rules(boss).secondVolleyAt) {
        fireVolley(boss, events);
      }
      if (boss.stateTime + 1e-10 >= duration) finishState(boss, player, events);
      else break;
    }
    for (const event2 of events) emit(event2);
    return events;
  }
  function hitGuardianAtlas(boss, damage = 1) {
    finite2(damage, "damage");
    if (damage <= 0) throw new RangeError("Damage must be positive");
    if (boss.disabled || !boss.vulnerability) return {
      accepted: false,
      damage: 0,
      events: [],
      reason: boss.disabled ? "disabled" : "armored"
    };
    const lost = Math.min(boss.hp, damage);
    boss.hp -= lost;
    boss.flash = 0.14;
    const events = [{ type: "hit", damage: lost, hp: boss.hp, maxHp: boss.maxHp }];
    if (boss.hp === 0) {
      boss.disabled = true;
      boss.telegraph = null;
      boss.resumeState = null;
      transition(boss, "disabled", events);
      events.push({ type: "shutdown", rewardId: "guardian-atlas-access" });
    } else if (boss.phase === 1 && boss.hp <= boss.maxHp / 2) {
      boss.phase = 2;
      boss.telegraph = null;
      boss.resumeState = null;
      transition(boss, "phaseBreak", events);
      events.push({ type: "phase", phase: 2, clearProjectiles: true });
    } else if (boss.state !== "hurt") {
      boss.resumeState = boss.state;
      boss.resumeTime = boss.stateTime;
      transition(boss, "hurt", events);
    }
    return { accepted: true, damage: lost, events };
  }

  // src/game/animation/guardian-atlas-animator.js
  var states = /* @__PURE__ */ new Set(["entry", "idle", "charge", "fire", "hurt", "phaseBreak", "disabled"]);
  var clamp5 = (value) => Math.max(0, Math.min(1, value));
  function pose(frame, previousFrame = null, blend = 1) {
    const opacity = clamp5(blend);
    return {
      frame,
      previousFrame: opacity < 1 ? previousFrame : null,
      blend: opacity,
      columns: 4,
      rows: 2
    };
  }
  function guardianAtlasAnimation(boss) {
    if (!boss || !states.has(boss.state)) throw new RangeError("Unknown Guardian Atlas animation state");
    if (!Number.isFinite(boss.stateTime) || boss.stateTime < 0) {
      throw new RangeError("Guardian Atlas animation time must be finite and nonnegative");
    }
    if (boss.phase !== 1 && boss.phase !== 2) throw new RangeError("Unknown Guardian Atlas animation phase");
    const { state, stateTime, phase } = boss;
    if (state === "entry") {
      const revealAt = GUARDIAN_ATLAS_RULES.entrySeconds - 0.25;
      return stateTime < revealAt ? pose(0) : pose(1, 0, (stateTime - revealAt) / 0.25);
    }
    if (state === "phaseBreak") return pose(5, 4, stateTime / 0.5);
    if (state === "disabled") return pose(7, phase === 2 ? 5 : 4, stateTime / 0.6);
    if (phase === 2) {
      return pose(state === "fire" ? 6 : 5);
    }
    if (state === "hurt") return pose(4);
    if (state === "charge") return pose(2, 1, stateTime / 0.18);
    if (state === "fire") return pose(3);
    return pose(1);
  }

  // src/game/ship/modular-ship.js
  var SHIP_FLEET_SAVE_KEY = "neonCatcher.shipFleet.v1";
  var SLOTS = Object.freeze(["hull", "wings", "engines"]);
  var VARIANTS = Object.freeze(["aster", "bastion"]);
  var preset = (id) => Object.freeze({ hull: id, wings: id, engines: id });
  var SHIP_FLEET = Object.freeze([
    Object.freeze({ id: "aster", name: "Aster", loadout: preset("aster") }),
    Object.freeze({ id: "bastion", name: "Bastion", loadout: preset("bastion") })
  ]);
  function ownValue(input, key) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return void 0;
    try {
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      return descriptor && Object.hasOwn(descriptor, "value") ? descriptor.value : void 0;
    } catch {
      return void 0;
    }
  }
  function variantAt(input, slot) {
    const value = ownValue(input, slot);
    return VARIANTS.includes(value) ? value : "aster";
  }
  function normalizeShipLoadout(input) {
    return Object.freeze(Object.fromEntries(SLOTS.map((slot) => [slot, variantAt(input, slot)])));
  }
  var FRAME_LAYOUTS = Object.freeze({
    hull: [
      { source: { x: 146, y: 16, width: 156, height: 409 }, destination: { x: -70, y: -235, width: 140, height: 440 } },
      { source: { x: 136, y: 453, width: 175, height: 410 }, destination: { x: -88, y: -235, width: 176, height: 440 } }
    ],
    wings: [
      { source: { x: 447, y: 165, width: 439, height: 192 }, destination: { x: -242, y: -50, width: 484, height: 212 } },
      { source: { x: 423, y: 572, width: 488, height: 218 }, destination: { x: -242, y: -50, width: 484, height: 216 } }
    ],
    engines: [
      { source: { x: 995, y: 229, width: 232, height: 213 }, destination: { x: -138, y: 20, width: 276, height: 228 } },
      { source: { x: 961, y: 618, width: 306, height: 265 }, destination: { x: -138, y: 20, width: 276, height: 228 } }
    ],
    flames: [
      { source: { x: 1455, y: 143, width: 210, height: 300 }, destination: { x: -135, y: 173, width: 294, height: 145 } },
      { source: { x: 1450, y: 518, width: 216, height: 369 }, destination: { x: -115, y: 173, width: 250, height: 145 } }
    ]
  });
  var FRAMES = Object.freeze(Object.fromEntries(["hull", "wings", "engines", "flames"].map((part, column) => [
    part,
    Object.freeze(VARIANTS.map((_, row) => Object.freeze({
      column,
      row,
      columns: 4,
      rows: 2,
      sourceWidth: 1774,
      sourceHeight: 887,
      source: Object.freeze(FRAME_LAYOUTS[part][row].source),
      destination: Object.freeze(FRAME_LAYOUTS[part][row].destination)
    })))
  ])));
  function shipPartFrame(loadout, part) {
    if (!Object.hasOwn(FRAMES, part)) throw new RangeError("Unknown ship part");
    const variant = variantAt(loadout, part === "flames" ? "engines" : part);
    return FRAMES[part][VARIANTS.indexOf(variant)];
  }
  var bounded = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  function shipAssemblyPose(input = {}) {
    const elapsed = bounded(ownValue(input, "elapsedSeconds"), 0, 0, Number.MAX_VALUE);
    const steering = bounded(ownValue(input, "steering"), 0, -1, 1);
    const impact = bounded(ownValue(input, "impactSeconds"), 0, 0, 1);
    const health = bounded(ownValue(input, "hull"), 100, 0, 100);
    const wave = (frequency) => Math.sin(elapsed % (Math.PI * 2 / frequency) * frequency);
    const turn = steering * (1.5 - 0.5 * steering * steering);
    const intensity = Math.abs(turn), damage = 1 - health / 100;
    return Object.freeze({
      bankScaleX: 1 - intensity * 0.12,
      bankRotation: turn * 0.1 + wave(43) * impact * 0.018,
      wingSweep: turn * 0.055,
      enginePulse: (1 + wave(17) * 0.075 + intensity * 0.12) * (1 - damage * 0.08)
    });
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
  function n7Dialogue(event2, { level, hull, perfectStreak = false } = {}) {
    if (event2 === "sectorStart") {
      if (!Number.isInteger(level) || level < 1 || level > 100) return null;
      return (level - 1) % 20 === 0 ? N7_DIALOGUES.sectorStart[Math.floor((level - 1) / 20) + 1] : null;
    }
    if (event2 === "bossWarning") return N7_DIALOGUES.bossWarning[level] ?? null;
    if (event2 === "criticalHull") return Number.isFinite(hull) && hull <= 20 ? N7_DIALOGUES.criticalHull : null;
    if (event2 === "perfectStreak") return perfectStreak ? N7_DIALOGUES.perfectStreak : null;
    return null;
  }

  // src/game/progression/chronos-flight.js
  var CHRONOS_FLIGHT_VERSION = "chronos-flight-v1";
  var CHRONOS_FLIGHT_MIN_DURATION = 60;
  var CHRONOS_FLIGHT_MAX_DELTA = 0.034;
  var clamp6 = (value, min, max) => Math.max(min, Math.min(max, value));
  var smooth = (value, start, end) => {
    const t = clamp6((value - start) / (end - start), 0, 1);
    return t * t * (3 - 2 * t);
  };
  var immutable = (object) => Object.freeze(object);
  var NOOP2 = () => {
  };
  var CHRONOS_FLIGHT_EVENTS = immutable([
    immutable({ id: "chronos-intruder", type: "attack", at: 0.025, attackerId: "cronium-raider", targetId: "chronos-reactor" }),
    immutable({ id: "chronos-breach", type: "rupture", at: 0.1, resourceId: "cronium", cause: "hostile-reactor-strike" }),
    immutable({ id: "chronos-perimeter-exit", type: "departure", at: 0.3, originId: "chronos-scientific-centre" }),
    immutable({ id: "chronos-recovered-module", type: "twin-module-marker", at: 0.6, moduleId: "twin-emitter", resourceId: "cronium" }),
    immutable({ id: "gaia-navigation-beacon", type: "gaia-beacon", at: 0.83, destinationId: "gaia-atlas-approach" }),
    immutable({ id: "chronos-flight-arrival", type: "arrival", at: 1, destinationId: "gaia-atlas-approach" })
  ]);
  var PHASES = immutable([
    immutable({ id: "emergency", from: 0, to: 0.1, name: "Emergencia en Chronos" }),
    immutable({ id: "recovery", from: 0.1, to: 0.3, name: "Recuperar el CRONIUM disperso" }),
    immutable({ id: "departure", from: 0.3, to: 0.52, name: "Salir del per\xEDmetro orbital" }),
    immutable({ id: "deep-space", from: 0.52, to: 0.82, name: "Rastro de CRONIUM en espacio profundo" }),
    immutable({ id: "gaia-approach", from: 0.82, to: 1, name: "Aproximaci\xF3n a la baliza de Gaia" })
  ]);
  function createChronosFlight({ goal = 36, minDuration = CHRONOS_FLIGHT_MIN_DURATION } = {}) {
    if (!Number.isInteger(goal) || goal < 1) throw new RangeError("goal must be a positive integer");
    if (!Number.isFinite(minDuration) || minDuration < 20) throw new RangeError("minDuration must be at least 20 seconds");
    let elapsed = 0, routeProgress = 0, collected = 0;
    const fired = /* @__PURE__ */ new Set();
    function snapshot() {
      const p = routeProgress, phase = PHASES.find((candidate) => p < candidate.to) || PHASES[PHASES.length - 1];
      const departure = smooth(p, 0.08, 0.6), approach = smooth(p, 0.58, 1);
      const attackApproach = smooth(p, 0.015, 0.055), attackExit = smooth(p, 0.12, 0.24);
      const objectiveComplete = collected >= goal, canFinish = objectiveComplete && p === 1;
      const reactorState = p < 0.07 ? "stable" : p < 0.1 ? "struck" : "ruptured";
      const attackerState = p < 0.055 ? "approach" : p < 0.07 ? "charge" : p < 0.1 ? "fire" : "retreat";
      return immutable({
        version: CHRONOS_FLIGHT_VERSION,
        elapsed,
        minDuration,
        routeProgress: p,
        phase: canFinish ? "arrived" : phase.id,
        stageName: canFinish ? "Acceso a Gaia localizado" : phase.name,
        origin: "Centro Chronos",
        destination: "Baliza de acceso a Gaia Nova",
        collected,
        goal,
        remaining: Math.max(0, goal - collected),
        collectionFraction: collected / goal,
        objectiveComplete,
        canFinish,
        recoveryActive: p >= 0.1 && !canFinish,
        waitingFor: !objectiveComplete && p >= 0.66 + 0.2 * (collected / goal) - 1e-10 ? "cronium" : null,
        // The origin physically retreats and becomes smaller; alpha stays one.
        // Keep the reactor below the tactical HUD during its rupture. Its exit
        // endpoint and route timing stay unchanged; this is backdrop framing.
        station: immutable({
          x: 0.48 - 0.72 * departure,
          y: 0.43 + 0.94 * departure,
          scale: 1.12 * Math.pow(0.075, departure),
          rotation: -0.1 * departure,
          visible: p < 0.62,
          alpha: 1,
          state: reactorState
        }),
        // Gaia is a distant destination that grows during the approach.
        planet: immutable({
          x: 0.79 - 0.15 * approach,
          y: 0.06 + 0.03 * approach,
          scale: 0.035 + 0.69 * approach * approach,
          rotation: 0.06 * p,
          visible: true,
          alpha: 1
        }),
        beacon: immutable({
          x: 0.54 + 0.08 * (1 - approach),
          y: 0.16 + 0.1 * approach,
          scale: 0.018 + 0.21 * approach,
          visible: p >= 0.78,
          alpha: 1,
          active: p >= 0.83
        }),
        attacker: immutable({
          x: 1.12 - 0.48 * attackApproach - 0.95 * attackExit,
          y: 0.13 + 0.11 * attackApproach - 0.15 * attackExit,
          scale: 0.1 + 0.07 * attackApproach - 0.05 * attackExit,
          rotation: -0.18 - 0.65 * attackExit,
          visible: p >= 0.015 && p < 0.24,
          state: attackerState
        }),
        deepSpace: immutable({
          travel: p,
          offsetX: -0.09 * p,
          offsetY: 0.54 * p,
          speed: 0.22 + 0.78 * smooth(p, 0.25, 0.56),
          alpha: 1
        }),
        debris: immutable({
          visible: p >= 0.1 && !canFinish,
          travel: p,
          directionX: -0.28,
          directionY: 0.96,
          depth: smooth(p, 0.1, 0.45)
        }),
        distance: immutable({ unit: "tramo", covered: p, total: 1 })
      });
    }
    function advance(dt, collectionCount = collected, emit = NOOP2) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Finite nonnegative delta required");
      if (!Number.isFinite(collectionCount) || collectionCount < 0) throw new RangeError("collectionCount must be nonnegative");
      if (typeof emit !== "function") throw new TypeError("emit must be a function");
      if (dt === 0 || routeProgress === 1) return snapshot();
      const step = Math.min(dt, CHRONOS_FLIGHT_MAX_DELTA);
      elapsed += step;
      collected = Math.min(goal, Math.max(collected, Math.floor(collectionCount)));
      const collectionCap = collected >= goal ? 1 : 0.66 + 0.2 * (collected / goal);
      const target = Math.min(1, elapsed / minDuration, collectionCap);
      routeProgress = Math.min(target, routeProgress + step / minDuration);
      if (collected >= goal && 1 - routeProgress < 1e-10 && elapsed >= minDuration - 1e-8) routeProgress = 1;
      for (const event2 of CHRONOS_FLIGHT_EVENTS) {
        if (routeProgress + 1e-10 < event2.at || fired.has(event2.id)) continue;
        fired.add(event2.id);
        emit(immutable({ ...event2, version: CHRONOS_FLIGHT_VERSION, elapsed, routeProgress }));
      }
      return snapshot();
    }
    return immutable({ advance, snapshot });
  }
  var CHRONOS_VOYAGE_VERSION = "chronos-voyage-v2";
  var CHRONOS_VOYAGE_KEY = "neonCatcher.chronosVoyage.v2";
  var CHRONOS_VOYAGE_ROUTE_ID = "chronos-to-gaia";
  var VOYAGE_STAGE_DATA = [
    ["Emergencia en Chronos", 36, 4, "Recupera los primeros fragmentos del reactor", "Chronos \xB7 reactor", "Per\xEDmetro destruido", "reactor-strike", 0.18, 0.7, 0.36],
    ["Per\xEDmetro destruido", 36, 8, "Cruza los restos y recupera el rastro de CRONIUM", "Per\xEDmetro destruido", "Campo de restos", "wreckage-crossing", 0.15, 0.8, 0.48],
    ["Campo de restos", 36, 12, "Sigue el rastro y rescata el emisor si lo encuentras", "Campo de restos", "Salida orbital", "recoverable-module", 0.12, 0.72, 0.56],
    ["Salida orbital", 36, 16, "Abandona la \xF3rbita de Chronos sin perder la se\xF1al", "Salida orbital", "Corredor exterior", "origin-retreat", 0.08, 0.52, 0.42],
    ["El gran vac\xEDo", 38, 18, "Atraviesa el vac\xEDo; observa el cometa anunciado", "Corredor exterior", "Baliza C9", "comet-crossing", 0.025, 0.26, 0.22],
    ["Refugio C9", 32, 18, "Llega al taller y decide qu\xE9 instalar antes de seguir", "Baliza C9", "Taller C9", "service-stop", 0.035, 0.34, 0.12],
    ["Estela de regreso", 38, 24, "Prueba tu nave y recupera la se\xF1al en espacio abierto", "Taller C9", "Ruta de Gaia", "equipment-trial", 0.025, 0.28, 0.44],
    ["Gaia en la distancia", 36, 28, "Mant\xE9n la ruta hacia el planeta que crece al frente", "Ruta de Gaia", "Baliza exterior de Gaia", "destination-reveal", 0.06, 0.4, 0.52],
    ["Se\xF1ales de Atlas", 36, 32, "Cruza la patrulla y localiza el acceso orbital", "Baliza exterior de Gaia", "Acceso orbital de Gaia", "atlas-identification", 0.12, 0.52, 0.72],
    ["Llegada a Gaia", 36, 36, "Completa el rastro y alcanza la baliza de llegada", "Acceso orbital de Gaia", "Baliza de acceso a Gaia Nova", "persistent-arrival", 0.18, 0.62, 0.82]
  ];
  var voyageOffset = 0;
  var CHRONOS_VOYAGE_STAGES = immutable(VOYAGE_STAGE_DATA.map((data, index) => {
    const [name, duration, goal, objective, origin, destination, event2, nebulaOpacity, starDensity, threatRate] = data;
    const stage = immutable({
      id: `1.${index + 1}`,
      stageId: `1.${index + 1}`,
      number: index + 1,
      stageNumber: index + 1,
      chapter: 1,
      contentVersion: CHRONOS_VOYAGE_VERSION,
      routeId: CHRONOS_VOYAGE_ROUTE_ID,
      name,
      duration,
      goal,
      objective,
      origin,
      destination,
      event: event2,
      offset: voyageOffset,
      nebulaOpacity,
      starDensity,
      threatRate
    });
    voyageOffset += duration;
    return stage;
  }));
  var CHRONOS_VOYAGE_MIN_DURATION = voyageOffset;
  var voyageGoal = (stage, goal) => Math.ceil(stage.goal * goal / 36);
  var validateVoyageGoal = (goal) => {
    if (!Number.isInteger(goal) || goal < 1) throw new RangeError("goal must be a positive integer");
  };
  var entryEventId = (number) => `chronos-voyage:1.${number}:start`;
  var checkpointEventId = (number) => `chronos-voyage:1.${number}:checkpoint`;
  var completionEventId = (number) => `chronos-voyage:1.${number}:complete`;
  var VOYAGE_EVENTS = immutable([
    immutable({ id: "chronos-voyage-intruder", type: "attack", at: 2.25, attackerId: "cronium-raider", targetId: "chronos-reactor" }),
    immutable({ id: "chronos-voyage-breach", type: "rupture", at: 9, resourceId: "cronium", cause: "hostile-reactor-strike" }),
    immutable({ id: "chronos-voyage-perimeter-exit", type: "departure", at: 108, originId: "chronos-scientific-centre" }),
    immutable({ id: "chronos-voyage-recovered-module", type: "twin-module-marker", at: 90, moduleId: "twin-emitter", resourceId: "cronium" }),
    immutable({ id: "chronos-voyage-gaia-beacon", type: "gaia-beacon", at: 292, destinationId: "gaia-atlas-approach" })
  ]);
  var SERVICE_EVENT_ID = "chronos-voyage:1.6:service";
  var SERVICE_COMPLETE_ID = "chronos-voyage:1.6:service-complete";
  var ARRIVAL_EVENT_ID = "chronos-voyage-arrival";
  var validVoyageEventIds = /* @__PURE__ */ new Set([
    ...VOYAGE_EVENTS.map((event2) => event2.id),
    SERVICE_EVENT_ID,
    SERVICE_COMPLETE_ID,
    ARRIVAL_EVENT_ID,
    ...CHRONOS_VOYAGE_STAGES.flatMap((stage) => [entryEventId(stage.number), checkpointEventId(stage.number), completionEventId(stage.number)])
  ]);
  function checkpointForStage(stageNumber, goal, collected, eventIds = [], serviceWaiting = false) {
    const stage = CHRONOS_VOYAGE_STAGES[stageNumber - 1];
    return immutable({
      version: 2,
      contentVersion: CHRONOS_VOYAGE_VERSION,
      routeId: CHRONOS_VOYAGE_ROUTE_ID,
      stageIndex: stageNumber - 1,
      stageId: stage.id,
      stageNumber,
      goal,
      collected,
      eventIds: immutable([...new Set(eventIds)]),
      ...serviceWaiting ? { serviceWaiting: true } : {}
    });
  }
  function createChronosVoyageCheckpoint(stageNumber = 1, { goal = 36, collected } = {}) {
    validateVoyageGoal(goal);
    if (!Number.isInteger(stageNumber) || stageNumber < 1 || stageNumber > 10) throw new RangeError("stageNumber must be between 1 and 10");
    const minimum = stageNumber === 1 ? 0 : voyageGoal(CHRONOS_VOYAGE_STAGES[stageNumber - 2], goal);
    const count = collected === void 0 ? minimum : collected;
    if (!Number.isFinite(count) || count < minimum) throw new RangeError("collected is below the stage entry requirement");
    const boundary = CHRONOS_VOYAGE_STAGES[stageNumber - 1].offset;
    const events = VOYAGE_EVENTS.filter((event2) => event2.at <= boundary).map((event2) => event2.id);
    for (let number = 1; number < stageNumber; number++) events.push(entryEventId(number), checkpointEventId(number), completionEventId(number));
    if (stageNumber > 6) events.push(SERVICE_EVENT_ID, SERVICE_COMPLETE_ID);
    return checkpointForStage(stageNumber, goal, Math.min(goal, Math.floor(count)), events);
  }
  function normalizeChronosVoyageCheckpoint(value, { goal = 36 } = {}) {
    validateVoyageGoal(goal);
    if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 2 || value.contentVersion !== CHRONOS_VOYAGE_VERSION || value.routeId !== CHRONOS_VOYAGE_ROUTE_ID || value.goal !== goal || !Number.isInteger(value.stageNumber) || value.stageNumber < 1 || value.stageNumber > 10 || value.stageIndex !== value.stageNumber - 1 || value.stageId !== `1.${value.stageNumber}` || !Number.isFinite(value.collected) || value.collected < 0 || !Array.isArray(value.eventIds) || value.eventIds.some((id) => typeof id !== "string" || !validVoyageEventIds.has(id)) || value.serviceWaiting !== void 0 && typeof value.serviceWaiting !== "boolean" || value.serviceWaiting && value.stageNumber !== 6) return null;
    const collected = Math.min(goal, Math.floor(value.collected));
    const minimum = value.stageNumber === 1 ? 0 : voyageGoal(CHRONOS_VOYAGE_STAGES[value.stageNumber - 2], goal);
    if (collected < minimum || value.serviceWaiting && collected < voyageGoal(CHRONOS_VOYAGE_STAGES[5], goal)) return null;
    const canonical = createChronosVoyageCheckpoint(value.stageNumber, { goal, collected });
    const currentIds = value.eventIds.filter((id) => id === entryEventId(value.stageNumber) || id === checkpointEventId(value.stageNumber));
    return checkpointForStage(value.stageNumber, goal, collected, [
      ...canonical.eventIds,
      ...currentIds,
      ...value.serviceWaiting ? [SERVICE_EVENT_ID] : []
    ], Boolean(value.serviceWaiting));
  }
  function createChronosVoyage({ goal = 36, checkpoint = null } = {}) {
    validateVoyageGoal(goal);
    const restored = checkpoint === null ? null : normalizeChronosVoyageCheckpoint(checkpoint, { goal });
    if (checkpoint !== null && !restored) throw new TypeError("Invalid Chronos voyage checkpoint");
    let stageIndex = restored?.stageIndex || 0, collected = restored?.collected || 0;
    let stageElapsed = restored?.serviceWaiting ? CHRONOS_VOYAGE_STAGES[stageIndex].duration : 0;
    let serviceWaiting = Boolean(restored?.serviceWaiting), arrived = false;
    const fired = new Set(restored?.eventIds || []);
    let entryCheckpoint = restored || createChronosVoyageCheckpoint(1, { goal });
    function exportCheckpoint() {
      if (serviceWaiting) return checkpointForStage(6, goal, collected, [...fired], true);
      return entryCheckpoint;
    }
    function snapshot() {
      const stage = CHRONOS_VOYAGE_STAGES[stageIndex], stageProgress = clamp6(stageElapsed / stage.duration, 0, 1);
      const elapsed = stage.offset + stageElapsed, p = elapsed / CHRONOS_VOYAGE_MIN_DURATION;
      const departure = smooth(p, 0.025, 0.43), approach = smooth(p, 0.7, 1), stageGoal = voyageGoal(stage, goal);
      const attackApproach = smooth(elapsed, 1.35, 4.95), attackExit = smooth(elapsed, 10.8, 21.6);
      const objectiveComplete = collected >= goal, quotaComplete = collected >= stageGoal;
      const reactorState = elapsed < 6.3 ? "stable" : elapsed < 9 ? "struck" : "ruptured";
      const attackerState = elapsed < 4.95 ? "approach" : elapsed < 6.3 ? "charge" : elapsed < 9 ? "fire" : "retreat";
      const phase = arrived ? "arrived" : stageIndex === 0 ? elapsed < 9 ? "emergency" : "recovery" : stageIndex < 3 ? "recovery" : stageIndex === 3 ? "departure" : stageIndex < 7 ? "deep-space" : "gaia-approach";
      const relayArrival = smooth(p, 0.45, 0.53), relayExit = smooth(p, 0.58, 0.65);
      return immutable({
        version: CHRONOS_VOYAGE_VERSION,
        contentVersion: CHRONOS_VOYAGE_VERSION,
        routeId: CHRONOS_VOYAGE_ROUTE_ID,
        chapter: 1,
        elapsed,
        minDuration: CHRONOS_VOYAGE_MIN_DURATION,
        cinematicDuration: 90,
        routeProgress: p,
        phase,
        stageId: stage.id,
        stageNumber: stage.number,
        stageName: stage.name,
        stageProgress,
        stageElapsed,
        stageDuration: stage.duration,
        stageGoal,
        stageObjective: stage.objective,
        stageOrigin: stage.origin,
        stageDestination: stage.destination,
        stageEvent: stage.event,
        stageQuotaComplete: quotaComplete,
        threatRate: stage.threatRate,
        origin: "Centro Chronos",
        destination: "Baliza de acceso a Gaia Nova",
        collected,
        goal,
        remaining: Math.max(0, goal - collected),
        collectionFraction: collected / goal,
        objectiveComplete,
        canFinish: arrived,
        recoveryActive: elapsed >= 9 && !arrived,
        waitingFor: serviceWaiting ? "service" : stageProgress === 1 && !quotaComplete ? "cronium" : null,
        station: immutable({
          x: 0.48 - 0.72 * departure,
          y: 0.43 + 0.94 * departure,
          scale: 1.12 * Math.pow(0.032, departure),
          rotation: -0.1 * departure,
          visible: p < 0.44,
          alpha: 1,
          state: reactorState
        }),
        planet: immutable({
          x: 0.79 - 0.15 * approach,
          y: 0.06 + 0.03 * approach,
          scale: 0.014 + 0.71 * approach * approach,
          rotation: 0.06 * p,
          visible: true,
          alpha: 1
        }),
        beacon: immutable({
          x: 0.54 + 0.08 * (1 - approach),
          y: 0.16 + 0.1 * approach,
          scale: 0.012 + 0.216 * approach,
          visible: p >= 0.8,
          alpha: 1,
          active: p >= 292 / 360
        }),
        relay: immutable({
          visible: p >= 0.45 && p < 0.65,
          x: 0.68 - 0.48 * relayExit,
          y: 0.24 + 0.84 * relayExit,
          scale: (0.035 + 0.14 * relayArrival) * (1 - 0.85 * relayExit),
          alpha: 1,
          active: serviceWaiting
        }),
        attacker: immutable({
          x: 1.12 - 0.48 * attackApproach - 0.95 * attackExit,
          y: 0.13 + 0.11 * attackApproach - 0.15 * attackExit,
          scale: 0.1 + 0.07 * attackApproach - 0.05 * attackExit,
          rotation: -0.18 - 0.65 * attackExit,
          visible: elapsed >= 1.35 && elapsed < 21.6,
          state: attackerState
        }),
        deepSpace: immutable({
          travel: p,
          offsetX: -0.16 * p,
          offsetY: 2.4 * p,
          speed: 0.2 + 0.8 * smooth(p, 0.25, 0.46),
          alpha: 1,
          nebulaOpacity: stage.nebulaOpacity,
          starDensity: stage.starDensity,
          dustDensity: stageIndex >= 4 && stageIndex <= 6 ? 0.1 : 0.32
        }),
        debris: immutable({
          visible: elapsed >= 9 && !arrived,
          travel: p,
          directionX: -0.28,
          directionY: 0.96,
          depth: smooth(p, 0.025, 0.35),
          density: stageIndex >= 4 && stageIndex <= 6 ? 0.22 : 0.7
        }),
        distance: immutable({ unit: "tramo", covered: p, total: 1, stage: stage.number, stages: 10 })
      });
    }
    function emitOnce(event2, emit) {
      if (fired.has(event2.id)) return;
      fired.add(event2.id);
      if (event2.type === "checkpoint") entryCheckpoint = checkpointForStage(stageIndex + 1, goal, collected, [...fired]);
      emit(immutable({
        ...event2,
        version: CHRONOS_VOYAGE_VERSION,
        stageId: `1.${stageIndex + 1}`,
        stageNumber: stageIndex + 1,
        elapsed: CHRONOS_VOYAGE_STAGES[stageIndex].offset + stageElapsed,
        routeProgress: snapshot().routeProgress,
        ...event2.type === "checkpoint" ? { checkpoint: entryCheckpoint } : {}
      }));
    }
    function ensureEntryEvents(emit) {
      emitOnce({ id: entryEventId(stageIndex + 1), type: "stage-start" }, emit);
      emitOnce({ id: checkpointEventId(stageIndex + 1), type: "checkpoint" }, emit);
    }
    function enterNextStage(emit) {
      stageIndex++;
      stageElapsed = 0;
      entryCheckpoint = checkpointForStage(stageIndex + 1, goal, collected, [...fired]);
      ensureEntryEvents(emit);
    }
    function resolveService(emit = NOOP2) {
      if (typeof emit !== "function") throw new TypeError("emit must be a function");
      if (!serviceWaiting) return snapshot();
      serviceWaiting = false;
      emitOnce({ id: SERVICE_COMPLETE_ID, type: "service-complete" }, emit);
      enterNextStage(emit);
      return snapshot();
    }
    function advance(dt, collectionCount = collected, emit = NOOP2) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Finite nonnegative delta required");
      if (!Number.isFinite(collectionCount) || collectionCount < 0) throw new RangeError("collectionCount must be nonnegative");
      if (typeof emit !== "function") throw new TypeError("emit must be a function");
      if (dt === 0 || arrived || serviceWaiting) return snapshot();
      ensureEntryEvents(emit);
      collected = Math.min(goal, Math.max(collected, Math.floor(collectionCount)));
      const stage = CHRONOS_VOYAGE_STAGES[stageIndex];
      stageElapsed = Math.min(stage.duration, stageElapsed + Math.min(dt, CHRONOS_FLIGHT_MAX_DELTA));
      if (stage.duration - stageElapsed < 1e-8) stageElapsed = stage.duration;
      const elapsed = stage.offset + stageElapsed;
      for (const event2 of VOYAGE_EVENTS) {
        if (elapsed + 1e-10 >= event2.at) emitOnce(event2, emit);
      }
      if (stageElapsed === stage.duration && collected >= voyageGoal(stage, goal)) {
        emitOnce({ id: completionEventId(stage.number), type: "stage-complete" }, emit);
        if (stage.number === 6) {
          serviceWaiting = true;
          emitOnce({ id: SERVICE_EVENT_ID, type: "service", stationId: "c9" }, emit);
        } else if (stage.number === 10) {
          arrived = true;
          emitOnce({ id: ARRIVAL_EVENT_ID, type: "arrival", destinationId: "gaia-atlas-approach" }, emit);
        } else enterNextStage(emit);
      }
      return snapshot();
    }
    return immutable({ advance, snapshot, exportCheckpoint, resolveService });
  }

  // src/game/animation/chronos-destruction.js
  var DEFAULT_MIN_DURATION = 90;
  var RUPTURE_POSITION = 0.1;
  var WAVE_DURATION = 7.2;
  var WAVE_FADE_DURATION = 1.2;
  var WAVE_FRAME_DURATION = WAVE_DURATION / 4;
  var FRAME_ENDS = Object.freeze([0, 0.45, 1.25, 2.4, 4.4]);
  var STATES = Object.freeze(["intact", "impact", "fracture", "rupture", "dispersion", "aftermath"]);
  var clamp7 = (value, min, max) => Math.max(min, Math.min(max, value));
  function getChronosDestructionPose(view) {
    const elapsed = Number.isFinite(view?.elapsed) && view.elapsed >= 0 ? view.elapsed : 0;
    const duration = view?.cinematicDuration ?? view?.minDuration;
    const minDuration = Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_MIN_DURATION;
    const ruptureAt = minDuration * RUPTURE_POSITION;
    const beforeRupture = elapsed < ruptureAt;
    const age = Math.max(0, elapsed - ruptureAt);
    let frame = 0;
    while (frame < FRAME_ENDS.length && elapsed >= ruptureAt + FRAME_ENDS[frame]) frame++;
    let waveFrame = 0;
    while (waveFrame < 3 && elapsed >= ruptureAt + (waveFrame + 1) * WAVE_FRAME_DURATION) waveFrame++;
    const waveVisible = !beforeRupture && elapsed < ruptureAt + WAVE_DURATION;
    const waveProgress = clamp7(age / WAVE_DURATION, 0, 1);
    const waveAlpha = waveVisible ? 0.55 * clamp7((WAVE_DURATION - age) / WAVE_FADE_DURATION, 0, 1) : 0;
    return Object.freeze({
      frame,
      age,
      state: STATES[frame],
      waveFrame,
      waveScale: 0.34 + waveProgress * 1.9,
      waveAlpha,
      waveVisible
    });
  }

  // src/game/combat/classic-weapons.js
  var finite3 = (value, name) => {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
    return value;
  };
  var weapon = (definition) => Object.freeze({
    ...definition,
    barrels: Object.freeze(definition.barrels.map((barrel) => Object.freeze({ ...barrel })))
  });
  var CLASSIC_WEAPON_RULES = Object.freeze({
    version: "classic-weapons-v1",
    maxCharges: 3,
    rechargeSeconds: 3.6,
    maxDelta: 0.05,
    maxProjectiles: 32,
    boundsMargin: 80,
    types: Object.freeze({
      pulse: weapon({
        id: "pulse",
        label: "Pulso",
        damageMultiplier: 1,
        description: "Da\xF1o \xD71: un pulso de 1 de da\xF1o por carga.",
        cooldown: 0.24,
        speed: 920,
        damage: 1,
        radius: 9,
        duration: 2.4,
        barrels: [{ offset: 0, spread: 0 }]
      }),
      twin: weapon({
        id: "twin",
        label: "Gemelo",
        damageMultiplier: 2,
        description: "Da\xF1o \xD72: dos pulsos centrados de 1 de da\xF1o por carga.",
        cooldown: 0.3,
        speed: 900,
        damage: 1,
        radius: 7,
        duration: 2.4,
        barrels: [{ offset: -10, spread: 0 }, { offset: 10, spread: 0 }]
      }),
      lance: weapon({
        id: "lance",
        label: "Lanza",
        damageMultiplier: 3,
        description: "Da\xF1o \xD73: una lanza de 3 de da\xF1o que atraviesa hasta dos objetivos distintos.",
        cooldown: 0.48,
        speed: 1280,
        damage: 3,
        radius: 6,
        duration: 1.8,
        pierce: 2,
        barrels: [{ offset: 0, spread: 0 }]
      })
    })
  });
  function knownType(type) {
    if (!Object.hasOwn(CLASSIC_WEAPON_RULES.types, type)) {
      throw new RangeError(`Unknown classic weapon: ${String(type)}`);
    }
    return type;
  }
  function createClassicWeapons({
    type = "pulse",
    unlocked = ["pulse"],
    width = 720,
    height = 1280
  } = {}) {
    finite3(width, "width");
    finite3(height, "height");
    knownType(type);
    if (width < 240 || height < 240) throw new RangeError("Invalid weapon arena");
    if (!Array.isArray(unlocked) || unlocked.length === 0) {
      throw new TypeError("At least one unlocked weapon is required");
    }
    const available = [...new Set(unlocked.map(knownType))];
    if (!available.includes(type)) throw new RangeError("Selected weapon must be unlocked");
    return {
      version: CLASSIC_WEAPON_RULES.version,
      width,
      height,
      selected: type,
      unlocked: available,
      charges: CLASSIC_WEAPON_RULES.maxCharges,
      recharge: 0,
      cooldown: 0,
      elapsed: 0,
      projectileSequence: 0,
      eventSequence: 0,
      shotSequence: 0,
      projectiles: []
    };
  }
  function event(state, type, details = {}) {
    return { id: `${state.version}:event:${++state.eventSequence}`, type, ...details };
  }
  function unlockClassicWeapon(state, type) {
    knownType(type);
    if (state.unlocked.includes(type)) return { accepted: false, reason: "unlocked", events: [] };
    state.unlocked.push(type);
    return { accepted: true, events: [event(state, "unlocked", { weapon: type })] };
  }
  function selectClassicWeapon(state, type) {
    knownType(type);
    if (!state.unlocked.includes(type)) return { accepted: false, reason: "locked", events: [] };
    if (state.selected === type) return { accepted: false, reason: "selected", events: [] };
    state.selected = type;
    return { accepted: true, events: [event(state, "selected", { weapon: type })] };
  }
  function triggerClassicWeapon(state, { x, y, angle = -Math.PI / 2 } = {}) {
    finite3(x, "origin x");
    finite3(y, "origin y");
    finite3(angle, "angle");
    if (state.charges === 0) return { accepted: false, reason: "empty", events: [], projectiles: [] };
    if (state.cooldown > 1e-9) return { accepted: false, reason: "cooldown", events: [], projectiles: [] };
    const definition = CLASSIC_WEAPON_RULES.types[state.selected];
    if (state.projectiles.length + definition.barrels.length > CLASSIC_WEAPON_RULES.maxProjectiles) {
      return { accepted: false, reason: "capacity", events: [], projectiles: [] };
    }
    const wasFull = state.charges === CLASSIC_WEAPON_RULES.maxCharges;
    state.charges--;
    if (wasFull) state.recharge = 0;
    state.cooldown = definition.cooldown;
    const shotId = `${state.version}:shot:${++state.shotSequence}`;
    const events = [event(state, "fired", {
      shotId,
      weapon: state.selected,
      charges: state.charges,
      barrels: definition.barrels.length
    })];
    const projectiles = definition.barrels.map((barrel, barrelIndex) => {
      const direction = angle + barrel.spread;
      const projectile2 = {
        id: `${state.version}:projectile:${++state.projectileSequence}`,
        shotId,
        weapon: state.selected,
        barrel: barrelIndex,
        x: x - Math.sin(angle) * barrel.offset,
        y: y + Math.cos(angle) * barrel.offset,
        vx: Math.cos(direction) * definition.speed,
        vy: Math.sin(direction) * definition.speed,
        damage: definition.damage,
        radius: definition.radius,
        pierce: definition.pierce || 1,
        duration: definition.duration,
        life: definition.duration,
        hitTargets: []
      };
      events.push(event(state, "projectile", { projectile: { ...projectile2, hitTargets: [] } }));
      return projectile2;
    });
    state.projectiles.push(...projectiles);
    return { accepted: true, shotId, events, projectiles };
  }
  function advanceClassicWeapons(state, delta) {
    finite3(delta, "delta");
    if (delta < 0) throw new RangeError("Finite nonnegative delta required");
    if (delta === 0) return [];
    const dt = Math.min(delta, CLASSIC_WEAPON_RULES.maxDelta);
    const events = [];
    state.elapsed += dt;
    state.cooldown = Math.max(0, state.cooldown - dt);
    if (state.charges < CLASSIC_WEAPON_RULES.maxCharges) {
      state.recharge += dt;
      while (state.recharge + 1e-9 >= CLASSIC_WEAPON_RULES.rechargeSeconds && state.charges < CLASSIC_WEAPON_RULES.maxCharges) {
        state.charges++;
        state.recharge = Math.max(0, state.recharge - CLASSIC_WEAPON_RULES.rechargeSeconds);
        events.push(event(state, "recharged", { charges: state.charges }));
      }
    }
    if (state.charges === CLASSIC_WEAPON_RULES.maxCharges) state.recharge = 0;
    const margin = CLASSIC_WEAPON_RULES.boundsMargin;
    for (let index = state.projectiles.length - 1; index >= 0; index--) {
      const projectile2 = state.projectiles[index];
      projectile2.x += projectile2.vx * dt;
      projectile2.y += projectile2.vy * dt;
      projectile2.life = Math.max(0, projectile2.life - dt);
      const outside = projectile2.x < -margin || projectile2.x > state.width + margin || projectile2.y < -margin || projectile2.y > state.height + margin;
      if (projectile2.life <= 1e-9 || outside) {
        state.projectiles.splice(index, 1);
        events.push(event(state, "expired", {
          projectileId: projectile2.id,
          reason: outside ? "bounds" : "lifetime"
        }));
      }
    }
    return events;
  }
  function hitClassicProjectile(state, projectileId, targetId) {
    if (typeof projectileId !== "string" || !projectileId) throw new TypeError("Projectile ID required");
    if (!(typeof targetId === "string" && targetId.length > 0 || Number.isSafeInteger(targetId))) {
      throw new TypeError("Stable target ID required");
    }
    const index = state.projectiles.findIndex((projectile3) => projectile3.id === projectileId);
    if (index < 0) return { accepted: false, reason: "inactive", damage: 0, events: [] };
    const projectile2 = state.projectiles[index];
    const key = `${typeof targetId}:${targetId}`;
    if (projectile2.hitTargets.includes(key)) {
      return { accepted: false, reason: "duplicate", damage: 0, events: [] };
    }
    projectile2.hitTargets.push(key);
    projectile2.pierce--;
    if (projectile2.pierce <= 0) state.projectiles.splice(index, 1);
    return {
      accepted: true,
      damage: projectile2.damage,
      events: [event(state, "hit", {
        projectileId,
        shotId: projectile2.shotId,
        targetId,
        damage: projectile2.damage,
        x: projectile2.x,
        y: projectile2.y,
        weapon: projectile2.weapon
      })]
    };
  }
  function classicWeaponSnapshot(state) {
    const definition = CLASSIC_WEAPON_RULES.types[state.selected];
    return {
      ...state,
      unlocked: [...state.unlocked],
      label: definition.label,
      description: definition.description,
      damageMultiplier: definition.damageMultiplier,
      rechargeProgress: state.charges === CLASSIC_WEAPON_RULES.maxCharges ? 0 : Math.min(1, state.recharge / CLASSIC_WEAPON_RULES.rechargeSeconds),
      projectiles: state.projectiles.map((projectile2) => ({
        ...projectile2,
        hitTargets: [...projectile2.hitTargets]
      }))
    };
  }

  // src/game/ship/flight-controls.js
  var SIDE_CLEARANCE = 119;
  var NOSE_CLEARANCE = 158;
  var TAIL_CLEARANCE = 104;
  function finite4(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new RangeError(`${name} must be finite`);
    }
    return value;
  }
  function pointerId(value) {
    if (typeof value === "number" && Number.isSafeInteger(value) || typeof value === "string" && value.length > 0) return value;
    throw new TypeError("A finite integer or nonempty string pointer id is required");
  }
  function inputState(state) {
    if (!state || typeof state !== "object" || typeof state.active !== "boolean") {
      throw new TypeError("A relative flight input state is required");
    }
    if (state.active) {
      pointerId(state.id);
      finite4(state.lastX, "lastX");
      finite4(state.lastY, "lastY");
    }
  }
  function checkedBounds(bounds) {
    if (!bounds || typeof bounds !== "object") throw new TypeError("Flight bounds are required");
    for (const key of ["minX", "maxX", "minY", "maxY"]) finite4(bounds[key], key);
    if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
      throw new RangeError("Flight bounds must be ordered");
    }
    return bounds;
  }
  var clamp8 = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  function calculateFlightBounds({ width, height, hudBottom, controlsTop }) {
    finite4(width, "width");
    finite4(height, "height");
    finite4(hudBottom, "hudBottom");
    finite4(controlsTop, "controlsTop");
    if (width <= 0 || height <= 0 || hudBottom < 0 || controlsTop > height || hudBottom > controlsTop) {
      throw new RangeError("A positive viewport and ordered HUD/control boundaries are required");
    }
    const firstX = SIDE_CLEARANCE, lastX = width - SIDE_CLEARANCE;
    const firstY = hudBottom + NOSE_CLEARANCE, lastY = controlsTop - TAIL_CLEARANCE;
    const xFits = firstX <= lastX, yFits = firstY <= lastY;
    const centerY = clamp8(firstY / 2 + lastY / 2, 0, height);
    return Object.freeze({
      minX: xFits ? firstX : width / 2,
      maxX: xFits ? lastX : width / 2,
      minY: yFits ? firstY : centerY,
      maxY: yFits ? lastY : centerY,
      fits: xFits && yFits,
      xFits,
      yFits
    });
  }
  function createRelativeFlightInput() {
    return { active: false, id: null, lastX: null, lastY: null };
  }
  function beginFlightInput(state, { id, x, y }) {
    inputState(state);
    pointerId(id);
    finite4(x, "x");
    finite4(y, "y");
    if (state.active) return false;
    state.active = true;
    state.id = id;
    state.lastX = x;
    state.lastY = y;
    return true;
  }
  function moveFlightInput(state, {
    id,
    x,
    y,
    targetX,
    targetY,
    sensitivity = 1,
    bounds
  }) {
    inputState(state);
    pointerId(id);
    finite4(x, "x");
    finite4(y, "y");
    finite4(targetX, "targetX");
    finite4(targetY, "targetY");
    finite4(sensitivity, "sensitivity");
    checkedBounds(bounds);
    if (sensitivity <= 0) throw new RangeError("Sensitivity must be positive");
    if (!state.active || state.id !== id) {
      return {
        targetX: clamp8(targetX, bounds.minX, bounds.maxX),
        targetY: clamp8(targetY, bounds.minY, bounds.maxY),
        moved: false
      };
    }
    const nextX = targetX + (x - state.lastX) * sensitivity;
    const nextY = targetY + (y - state.lastY) * sensitivity;
    finite4(nextX, "computed targetX");
    finite4(nextY, "computed targetY");
    const moved = x !== state.lastX || y !== state.lastY;
    state.lastX = x;
    state.lastY = y;
    return {
      targetX: clamp8(nextX, bounds.minX, bounds.maxX),
      targetY: clamp8(nextY, bounds.minY, bounds.maxY),
      moved
    };
  }
  function endFlightInput(state, id = null) {
    inputState(state);
    if (id !== null) pointerId(id);
    if (!state.active || id !== null && state.id !== id) return false;
    state.active = false;
    state.id = null;
    state.lastX = null;
    state.lastY = null;
    return true;
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
