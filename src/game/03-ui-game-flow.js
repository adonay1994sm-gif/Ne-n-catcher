  function setupJourneyUI() {
    if (!JOURNEY_DEMO) return;
    document.body.classList.add("journey-mode");
    const mount = document.createElement("div");
    mount.innerHTML = `<div id="journeyRoute" class="journey-route hidden"><small>CRONOS → GAIA NOVA</small><b id="journeyDestination"></b><progress id="journeyDistance" max="1" value="0" aria-label="Recorrido hasta Gaia"></progress><span id="journeyObjective"></span></div>
      <div id="journeySkills" class="journey-skills hidden"><button id="journeyShield" type="button">ESCUDO <small>LISTO</small></button><button id="journeyTractor" type="button">TRACTOR <small>LISTO</small></button></div>
      <div id="journeyStation" class="overlay"><section class="panel journey-service"><small>BALIZA DE SERVICIO C9</small><img src="assets/repair_drone.webp" alt="Mira, robot del taller"><h2>Un momento de respiro.</h2><p>«Soy Mira. Ese módulo rescatado aún puede volar. Te lo monto y sello el casco.»</p><div class="journey-piece"><img src="assets/debris_panel.webp" alt="Aleta de propulsión recuperada"><div><b>Aleta vectorial C9</b><p>Respuesta lateral +20 % y propulsión ámbar visible. Instalación con la pieza recuperada; sin créditos.</p></div></div><button id="journeyInstall" class="primary" type="button">INSTALAR PIEZA Y REPARAR</button><button id="journeyContinue" class="secondary" type="button" disabled>CONTINUAR HACIA GAIA</button><button id="journeyStationHome" class="link" type="button">Guardar y volver</button></section></div>
      <div id="journeyComplete" class="overlay"><section class="panel journey-service"><small>ACCESO ATLAS · TRAYECTO COMPLETO</small><h2>Gaia nos recibe.</h2><p>Has salido de Chronos, recuperado e instalado una pieza y abierto el paso. El siguiente viaje todavía está en producción.</p><p id="journeyReward"></p><button id="journeyAgain" class="primary" type="button">REPETIR TRAVESÍA</button><button id="journeyHome" class="secondary" type="button">VOLVER AL MENÚ</button></section></div>`;
    canvas.parentElement.append(mount);
    for (const id of ["journeyRoute", "journeyDestination", "journeyDistance", "journeyObjective", "journeySkills", "journeyShield", "journeyTractor", "journeyStation", "journeyInstall", "journeyContinue", "journeyComplete"]) ui[id] = $(id);
    $("journeyInstall").onclick = () => {
      if (!journey?.serviceInstall()) return;
      hull = 100;
      persistJourney();
      showJourneyStation();
      tone(780, .16, "triangle", .06);
    };
    $("journeyContinue").onclick = () => {
      if (!journey?.resumeFromStation()) return;
      persistJourney();
      setState("playing"); overlay(); last = performance.now();
      ui.fire.classList.remove("hidden"); ui.journeySkills.classList.remove("hidden");
      ui.journeyRoute.classList.remove("hidden");
      syncJourneyHud();
      showStoryTransmission("MIRA · C9", "Aleta conectada. Prueba el empuje hacia Gaia.", 3.2);
    };
    $("journeyStationHome").onclick = goHome;
    $("journeyHome").onclick = goHome;
    $("journeyAgain").onclick = () => startJourney(true);
    ui.journeyShield.onclick = () => useJourneyAbility("shield");
    ui.journeyTractor.onclick = () => useJourneyAbility("tractor");
    const choice = document.createElement("label");
    choice.className = "journey-auto-choice";
    choice.innerHTML = '<input id="journeyAuto" type="checkbox">Disparo básico automático · también puedes disparar manualmente';
    $("play").after(choice);
    journeyAutoFire = storage.getJSON("neon-journey-demo-autofire-v1", true) !== false;
    $("journeyAuto").checked = journeyAutoFire;
    $("journeyAuto").onchange = event => {
      journeyAutoFire = event.target.checked;
      storage.setJSON("neon-journey-demo-autofire-v1", journeyAutoFire);
    };
    ui.menu.querySelector("h2").textContent = "Un viaje entre mundos.";
    ui.menu.querySelector(".menu-panel > p").textContent = "Evacúa Chronos, rescata una pieza y cruza hacia Gaia. Desliza sin soltar para pilotar; tu nave dispara al encontrar una amenaza.";
  }

  function persistJourney() {
    if (journey && (!journeyCanSave || !storage.setJSON(NeonCampaign.JOURNEY_DEMO_SAVE_KEY, journey.checkpoint()))) toast("Guardado no disponible. Mantén esta partida abierta.");
    journeyView = journey?.snapshot() || null;
  }

  function startJourney(fresh = false) {
    let saved = null;
    journeyCanSave = true;
    if (!fresh) saved = storage.getRaw(NeonCampaign.JOURNEY_DEMO_SAVE_KEY);
    journey = NeonCampaign.createJourneyDemo(saved);
    if (saved !== null && journey.snapshot().recovery === "invalid-save") {
      const backupKey = `${NeonCampaign.JOURNEY_DEMO_SAVE_KEY}:invalid-backups`;
      const previous = storage.getJSON(backupKey, []);
      const copies = Array.isArray(previous) ? previous : [previous];
      journeyCanSave = copies.includes(saved) || storage.setJSON(backupKey, [...copies, saved]);
    }
    if (journey.snapshot().phase === "complete") journey = NeonCampaign.createJourneyDemo();
    journeyView = journey.snapshot();
    journeyAutoTimer = 0; journeyShieldCooldown = 0; journeyTractorCooldown = 0;
    startLevel(0);
    warpTimer = .45;
    ui.bannerName.textContent = "CHRONOS → GAIA NOVA";
    ui.bannerGoal.textContent = "Desliza para pilotar. Rescata el módulo señalado.";
    ui.banner.classList.remove("show"); bannerTimer = 0;
    ui.journeyRoute.classList.remove("hidden");
    ui.journeySkills.classList.remove("hidden");
    ui.powerHud.classList.add("hidden");
    persistJourney(); syncJourneyHud();
    if (journeyView.phase === "station") showJourneyStation();
  }

  function showJourneyStation() {
    journeyView = journey.snapshot();
    journey.setPaused(false); // service actions are allowed; the route itself is stopped.
    if (state === "playing") setState("paused");
    items = []; clearTransientEffects(); hideStoryTransmission();
    ui.fire.classList.add("hidden"); ui.journeySkills.classList.add("hidden");
    ui.journeyRoute.classList.add("hidden");
    ui.banner.classList.remove("show");
    ui.journeyInstall.disabled = journeyView.partInstalled;
    ui.journeyInstall.textContent = journeyView.partInstalled ? "ALETA MONTADA · CASCO SELLADO" : "INSTALAR PIEZA Y REPARAR";
    ui.journeyContinue.disabled = !journeyView.partInstalled;
    overlay(ui.journeyStation); syncJourneyHud();
  }

  function useJourneyAbility(name) {
    if (!JOURNEY_DEMO || !journey || state !== "playing") return;
    const cooldown = name === "shield" ? journeyShieldCooldown : journeyTractorCooldown;
    if (cooldown > 0) return;
    powers[name] = 4;
    if (name === "shield") journeyShieldCooldown = 11;
    else journeyTractorCooldown = 8;
    activatePower(name, {x: player.x, y: player.y});
  }

  function syncJourneyHud() {
    if (!JOURNEY_DEMO || !journey) return;
    journeyView = journey.snapshot();
    ui.journeyDestination.textContent = journeyView.destination;
    ui.journeyDistance.value = journeyView.routeProgress;
    ui.journeyObjective.textContent = journeyView.phase === "station" ? "Instala la pieza recuperada" : journeyView.waitingFor === "part" ? "Recupera el módulo · usa TRACTOR si lo necesitas" : journeyView.borderActive && !journeyView.borderResolved ? "Desactiva al guardián CH-01 para abrir el paso" : journeyView.partCollected ? "Pieza a bordo · sigue el corredor" : "Rescata la aleta vectorial señalizada";
    for (const [name, cooldown] of [["journeyShield", journeyShieldCooldown], ["journeyTractor", journeyTractorCooldown]]) {
      ui[name].disabled = cooldown > 0 || state !== "playing";
      const label = cooldown > 0 ? `${Math.ceil(cooldown)} s` : "LISTO";
      if (ui[name].querySelector("small").textContent !== label) ui[name].querySelector("small").textContent = label;
    }
    ui.goal.textContent = `${Math.round(journeyView.routeProgress * 100)}%`;
    ui.goal.previousElementSibling.textContent = "RECORRIDO";
    ui.hudLevel.textContent = `1.${journeyView.segmentIndex + 1}`;
    ui.hudLevel.previousElementSibling.textContent = "TRAMO";
  }

  function journeyEvent(event) {
    if (event.type === "partAvailable") {
      items.push({type: "journeyPart", x: W * .68, baseX: W * .68, y: H * .35, r: 27, s: 120, rot: 0, rs: .2, p: 0, phase: 0, alpha: 1});
      showStoryTransmission("BALIZA C9", "Aleta vectorial intacta. Acércate o activa el tractor.", 3.8);
    } else if (event.type === "enemy" || event.type === "border") {
      const enemy = createThreat("scout", level());
      enemy.x = enemy.baseX = event.type === "border" ? W * .5 : W * .28;
      enemy.classicScout.baseX = enemy.x;
      enemy.journeyEntry = {targetX: enemy.x};
      enemy.y = H * .22;
      enemy.s = event.type === "border" ? 0 : 95;
      if (event.type === "border") {
        enemy.journeyBorder = true; enemy.hp = enemy.maxHp = 3;
        showStoryTransmission("ACCESO ATLAS", "Identificación alterada. Desactiva el bloqueo y cruza.", 3.6);
      }
      items.push(enemy);
    } else if (event.type === "station") {
      persistJourney(); showJourneyStation();
    } else if (event.type === "segmentStart") {
      items = []; persistJourney();
    } else if (event.type === "complete") {
      persistJourney();
      setState("complete");
      ui.hud.classList.add("hidden"); ui.fire.classList.add("hidden");
      ui.journeySkills.classList.add("hidden");
      ui.journeyRoute.classList.add("hidden");
      $("journeyReward").textContent = `${journey.snapshot().credits} créditos registrados · recompensa única del trayecto`;
      hideStoryTransmission(); overlay(ui.journeyComplete);
    }
  }

  function updateMenu() {
    if (JOURNEY_DEMO) {
      const saved = NeonCampaign.createJourneyDemo(storage.getJSON(NeonCampaign.JOURNEY_DEMO_SAVE_KEY, null)).snapshot();
      ui.playLabel.textContent = saved.phase === "complete" ? "REPETIR VIAJE" : "CONTINUAR VIAJE";
      ui.playSector.textContent = `${saved.origin} → ${saved.destination}`;
      return;
    }
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
    if (JOURNEY_DEMO) syncJourneyHud();
  }

  function updateAmmoHud() {
    if (!ui.fire || !ui.ammo) return;
    if (JOURNEY_DEMO) {
      ui.ammo.textContent = manualShotCooldown > 0 ? "RECARGA" : "PULSO BÁSICO · ∞";
      ui.fire.disabled = state !== "playing" || manualShotCooldown > 0 || warpTimer > 0;
      ui.fire.setAttribute("aria-label", "Disparar pulso básico sin munición limitada");
      return;
    }
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
    if (storyTimer > 0) {
      storyTimer = Math.max(0, storyTimer - dt);
      if (storyTimer === 0) hideStoryTransmission();
    }
    if (N7_CAMPAIGN || JOURNEY_DEMO || currentLevel !== 0 || state !== "playing" || warpTimer > 0) return;
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
    classicScoutTimer = !N7_CAMPAIGN && currentLevel === 1 ? 3.8 : 0;
    classicScoutAnnounced = false;
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
    journey?.setPaused(true);
    setState("paused");
    hideWarning();
    overlay(ui.paused);
  }

  function resumeGame() {
    if (state !== "paused") return;
    if (JOURNEY_DEMO && journey?.snapshot().phase === "station") { showJourneyStation(); return; }
    journey?.setPaused(false);
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
    if (JOURNEY_DEMO) {
      persistJourney();
      ui.journeyRoute.classList.add("hidden");
      ui.journeySkills.classList.add("hidden");
    }
    overlay(ui.menu);
    updateMenu();
  }

  function registerRun() {
    if (JOURNEY_DEMO) return;
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
    if (JOURNEY_DEMO) return;
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
