  function isAtlasMission() {
    return !N7_CAMPAIGN && !JOURNEY_DEMO && currentLevel === 1;
  }

  function setupAtlasEncounter() {
    const mount = document.createElement("section");
    mount.id = "atlasEncounter"; mount.className = "atlas-encounter hidden";
    mount.setAttribute("aria-label", "Encuentro Guardian Atlas");
    mount.innerHTML = `<div class="atlas-identity"><b>GUARDIAN ATLAS</b><span id="atlasPhase">CONTENCIÓN ORBITAL</span><progress id="atlasHealth" max="1" value="1" aria-label="Integridad de Guardian Atlas"></progress></div><button id="atlasAutoFire" type="button" aria-pressed="true">PULSO AUTO · SÍ</button><p id="atlasStatus" role="status">Recupera el CRONIUM antes de cruzar el perímetro.</p>`;
    canvas.parentElement.append(mount);
    for (const id of ["atlasEncounter", "atlasHealth", "atlasPhase", "atlasStatus", "atlasAutoFire"]) ui[id] = $(id);
    ui.atlasAutoFire.onclick = () => {
      const next = !atlasAutoFire;
      if (!storage.setJSON("neonCatcher.atlasAutoFire.v1", next)) { toast("No se pudo guardar el modo de disparo"); return; }
      atlasAutoFire = next; syncAtlasHud();
    };
    syncAtlasHud();
  }

  function positionAtlasArena() {
    if (!atlasBoss) return;
    const rect = canvas.getBoundingClientRect();
    const horizontal = rect.height < 500;
    atlasBoss.width = W; atlasBoss.height = H; atlasBoss.playerY = player.y;
    atlasBoss.visualSize = horizontal ? 300 : 350;
    const headerClearance = (horizontal ? 104 : 144) * H / Math.max(1, rect.height);
    atlasBoss.targetY = Math.min(player.y - 360, Math.max(H * .30, headerClearance + atlasBoss.visualSize / 2));
    if (atlasBoss.state !== "entry") atlasBoss.y = atlasBoss.targetY;
  }

  function beginAtlasEncounter() {
    if (!isAtlasMission() || atlasBoss || collected < level().goal || state !== "playing") return false;
    cancelSupplyFailureTimer();
    atlasBoss = NeonCampaign.createGuardianAtlas({width: W, height: H, playerY: player.y});
    positionAtlasArena();
    atlasFireTimer = 0; atlasReentryGrace = 0; atlasLastStatus = "";
    items = []; gates = []; shots = []; tractorTarget = null;
    ensureSprite(SPRITES.guardianAtlas); ensureSprite(SPRITES.atlasVfx);
    hideWarning(); hideStoryTransmission(); ui.banner.classList.remove("show");
    document.body.classList.add("atlas-combat");
    ui.atlasEncounter.classList.remove("hidden");
    ui.goal.previousElementSibling.textContent = "CRONIUM A SALVO";
    ui.goal.textContent = `${collected}/${level().goal}`;
    syncAtlasHud(); updateAmmoHud();
    tone(135, .28, "triangle", .065);
    return true;
  }

  function syncAtlasHud() {
    if (!ui.atlasEncounter) return;
    const pressed = String(atlasAutoFire);
    const autoLabel = `PULSO AUTO · ${atlasAutoFire ? "SÍ" : "NO"}`;
    if (ui.atlasAutoFire.getAttribute("aria-pressed") !== pressed) ui.atlasAutoFire.setAttribute("aria-pressed", pressed);
    if (ui.atlasAutoFire.textContent !== autoLabel) ui.atlasAutoFire.textContent = autoLabel;
    if (!atlasBoss) return;
    const health = atlasBoss.hp / atlasBoss.maxHp;
    const phaseLabel = atlasBoss.disabled ? "PROTOCOLO RESTAURADO" : `FASE ${atlasBoss.phase} · ${atlasBoss.vulnerability ? "NÚCLEO EXPUESTO" : "BLINDAJE CERRADO"}`;
    if (ui.atlasHealth.value !== health) ui.atlasHealth.value = health;
    if (ui.atlasPhase.textContent !== phaseLabel) ui.atlasPhase.textContent = phaseLabel;
    let status;
    if (!spriteReady(SPRITES.guardianAtlas) || !spriteReady(SPRITES.atlasVfx)) status = "Atlas no se ha cargado. Pausa y vuelve al menú para reintentar.";
    else if (atlasReentryGrace > 0) status = "Enlace recuperado. Retoma el control.";
    else if (atlasBoss.state === "entry") status = "Tu carga activa la contención. Desactiva el núcleo para abrir el paso.";
    else if (atlasBoss.state === "disabled") status = "Atlas: «Identidad confirmada. Gaia autoriza el acceso».";
    else if (atlasBoss.state === "phaseBreak") status = "N-7: «Es un bucle de contención. Rompe el enlace, salva al guardián».";
    else if (atlasBoss.telegraph?.safeGap) status = "DOBLE CORTINA · atraviesa la franja iluminada.";
    else if (atlasBoss.state === "charge") status = "SALVA FIJADA · cambia de posición antes del disparo.";
    else status = "NÚCLEO EXPUESTO · alinea la nave y abre fuego.";
    if (status !== atlasLastStatus) { ui.atlasStatus.textContent = status; atlasLastStatus = status; }
  }

  function consumeAtlasEvent(event) {
    if (event.type === "projectile") items.push(event.projectile);
    if (event.clearProjectiles || event.type === "shutdown") {
      items = items.filter(item => !item.guardianProjectile);
    }
    if (event.type === "warning") tone(event.phase === 1 ? 290 : 380, .16, "triangle", .045);
    if (event.type === "volley") tone(95, .12, "sawtooth", .045);
    if (event.type === "phase") { cameraKickY = Math.max(cameraKickY, 3); tone(180, .3, "triangle", .055); }
    if (event.type === "shutdown") { score += 250; tone(640, .28, "sine", .06); }
    if (event.type === "disabled") completeLevel();
  }

  function updateAtlasEncounter(dt) {
    if (!atlasBoss || dt <= 0) return;
    if (!spriteReady(SPRITES.guardianAtlas) || !spriteReady(SPRITES.atlasVfx)) { syncAtlasHud(); return; }
    if (atlasReentryGrace > 0) { atlasReentryGrace = Math.max(0, atlasReentryGrace - dt); syncAtlasHud(); return; }
    // Slow affects both the guardian's warning/recovery clock and its bullets.
    // A different clock could announce a new corridor over an older curtain.
    NeonCampaign.advanceGuardianAtlas(atlasBoss, dt * (powers.slow > 0 ? .5 : 1), player, consumeAtlasEvent);
    if (state !== "playing") return;
    atlasFireTimer = Math.max(0, atlasFireTimer - dt);
    if (atlasAutoFire && atlasFireTimer === 0 && atlasBoss.vulnerability && Math.abs(atlasBoss.x - player.x) < 115) {
      if (fireManualShot()) atlasFireTimer = .42;
    }
    syncAtlasHud();
  }

  function fireAtlasPulse(kind) {
    if (!atlasBoss || atlasBoss.disabled || !spriteReady(SPRITES.guardianAtlas) || Math.abs(atlasBoss.x - player.x) >= 115) return false;
    if (shots.length >= EFFECT_LIMITS.shots) shots.shift();
    shots.push({x1: player.x, y1: player.y - (shipRenderMode === "modular" ? 114 : SHIP_VISUAL.phaserMuzzleOffset),
      x2: atlasBoss.x, y2: atlasBoss.y, life: .24, duration: .24,
      hit: false, destroyed: false, impactX: atlasBoss.x, impactY: atlasBoss.y,
      impactScale: .7, kind, atlasPulse: true, atlasTarget: atlasBoss});
    tone(740, .04, "triangle", .025);
    return true;
  }

  function resolveAtlasPulse(shot) {
    if (state !== "playing" || shot.atlasTarget !== atlasBoss || atlasBoss.disabled) return;
    const result = NeonCampaign.hitGuardianAtlas(atlasBoss, 1);
    for (const event of result.events) consumeAtlasEvent(event);
    if (result.accepted) {
      score += 3;
      if (settings.effects) {
        if (impactEffects.length >= EFFECT_LIMITS.impacts) impactEffects.shift();
        impactEffects.push({x: atlasBoss.x, y: atlasBoss.y, angle: 0, scale: 1,
          life: .24, duration: .24, atlasImpact: true});
      }
      tone(620, .055, "triangle", .035);
    } else tone(180, .04, "square", .025);
    syncAtlasHud();
  }

  function setupShipHangar() {
    if ($("shipHangar")) return;
    const menuActions = ui.menu.querySelector(".menu-actions");
    if (!menuActions) return;

    const openButton = document.createElement("button");
    openButton.id = "openHangar";
    openButton.type = "button";
    openButton.className = "secondary";
    openButton.innerHTML = '<span class="button-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 4 7 5 8-7-2-2 3-2-3-7 2 5-8Z"/></svg></span>HANGAR';
    menuActions.classList.add("has-hangar");
    menuActions.append(openButton);

    const hangar = document.createElement("div");
    hangar.id = "shipHangar";
    hangar.className = "overlay ship-hangar hidden";
    hangar.setAttribute("role", "dialog");
    hangar.setAttribute("aria-modal", "true");
    hangar.setAttribute("aria-labelledby", "shipHangarTitle");
    hangar.setAttribute("aria-describedby", "shipHangarRules");
    hangar.innerHTML = `<section class="panel ship-hangar-panel" tabindex="-1">
      <header class="ship-hangar-header"><small>FLOTA · CONFIGURACIÓN DE NAVE</small><h2 id="shipHangarTitle">Tu nave, a tu manera.</h2><p id="shipHangarRules">Configuración visual · mismas reglas de vuelo.</p></header>
      <div class="ship-hangar-layout">
        <figure class="ship-hangar-preview"><canvas id="shipHangarCanvas" width="512" height="512" role="img" aria-label="Vista previa de la nave seleccionada">Vista previa de la configuración de nave.</canvas><figcaption id="shipHangarName">Nave seleccionada</figcaption><p id="shipAtlasNotice" class="hidden" role="status">No se ha cargado la nave nueva. Puedes usar la original.</p></figure>
        <div class="ship-hangar-controls">
          <div class="ship-preset-list" role="group" aria-label="Naves disponibles"><button type="button" data-ship-preset="aster" aria-pressed="false"><b>ASTÉR</b><span>Exploradora</span></button><button type="button" data-ship-preset="bastion" aria-pressed="false"><b>BASTIÓN</b><span>Interceptora</span></button></div>
          <fieldset class="ship-components"><legend>Combina sus componentes</legend><label for="shipHull">Fuselaje<select id="shipHull"><option value="aster">Astér</option><option value="bastion">Bastión</option></select></label><label for="shipWings">Alas<select id="shipWings"><option value="aster">Astér</option><option value="bastion">Bastión</option></select></label><label for="shipEngines">Propulsores<select id="shipEngines"><option value="aster">Astér</option><option value="bastion">Bastión</option></select></label></fieldset>
          <button id="shipLegacy" class="ship-legacy" type="button" aria-pressed="false">Usar la nave original</button>
          <p id="shipHangarStatus" class="ship-hangar-status" role="status">Los cambios se guardan al aplicar.</p>
        </div>
      </div>
      <footer class="ship-hangar-actions"><button id="shipApply" class="primary" type="button">APLICAR CONFIGURACIÓN</button><button id="shipHangarBack" class="secondary" type="button">VOLVER SIN CAMBIAR</button></footer>
    </section>`;
    canvas.closest(".game").append(hangar);
    ui.shipHangar = hangar;
    const panel = hangar.querySelector(".ship-hangar-panel");
    const presetButtons = [...hangar.querySelectorAll("[data-ship-preset]")];
    const components = [["hull", $("shipHull")], ["wings", $("shipWings")], ["engines", $("shipEngines")]];
    const sameLoadout = (first, second) => components.every(([key]) => first[key] === second[key]);

    function refreshDraft() {
      const modular = shipHangarDraft.mode === "modular";
      for (const [key, select] of components) {
        select.value = shipHangarDraft.loadout[key];
        select.disabled = !modular;
      }
      for (const button of presetButtons) {
        const preset = NeonCampaign.SHIP_FLEET.find(entry => entry.id === button.dataset.shipPreset);
        button.setAttribute("aria-pressed", String(modular && Boolean(preset) && sameLoadout(shipHangarDraft.loadout, preset.loadout)));
      }
      $("shipLegacy").setAttribute("aria-pressed", String(!modular));
      const selected = NeonCampaign.SHIP_FLEET.find(entry => sameLoadout(shipHangarDraft.loadout, entry.loadout));
      $("shipHangarName").textContent = !modular ? "Nave original" : selected?.name || "Configuración combinada";
      $("shipHangarCanvas").setAttribute("aria-label", `Vista previa: ${$("shipHangarName").textContent}`);
      $("shipHangarStatus").textContent = "Vista previa · aplica para guardar tu elección.";
    }

    function closeHangar() {
      hangar.classList.remove("show");
      hangar.classList.add("hidden");
      shipHangarDraft = null;
      overlay(ui.menu);
      openButton.focus({ preventScroll: true });
    }

    openButton.onclick = () => {
      if (state !== "menu" || !(ui.menu.classList.contains("show") || ui.briefing.classList.contains("show"))) return;
      shipHangarDraft = { mode: shipRenderMode, loadout: { ...NeonCampaign.normalizeShipLoadout(shipLoadout) } };
      refreshDraft();
      overlay();
      hangar.classList.remove("hidden");
      hangar.classList.add("show");
      panel.focus({ preventScroll: true });
    };
    for (const button of presetButtons) button.onclick = () => {
      if (!shipHangarDraft) return;
      const preset = NeonCampaign.SHIP_FLEET.find(entry => entry.id === button.dataset.shipPreset);
      if (!preset) return;
      shipHangarDraft = { mode: "modular", loadout: { ...NeonCampaign.normalizeShipLoadout(preset.loadout) } };
      refreshDraft();
    };
    for (const [key, select] of components) select.onchange = () => {
      if (!shipHangarDraft) return;
      shipHangarDraft = { mode: "modular", loadout: { ...NeonCampaign.normalizeShipLoadout({ ...shipHangarDraft.loadout, [key]: select.value }) } };
      refreshDraft();
    };
    $("shipLegacy").onclick = () => {
      if (!shipHangarDraft) return;
      shipHangarDraft = { mode: "legacy", loadout: { ...shipHangarDraft.loadout } };
      refreshDraft();
    };
    $("shipApply").onclick = () => {
      if (!shipHangarDraft) return;
      const loadout = NeonCampaign.normalizeShipLoadout(shipHangarDraft.loadout);
      if (!storage.setJSON(NeonCampaign.SHIP_FLEET_SAVE_KEY, { version: 1, mode: shipHangarDraft.mode, loadout })) {
        $("shipHangarStatus").textContent = "No se pudo guardar. Tu nave anterior sigue seleccionada.";
        return;
      }
      shipRenderMode = shipHangarDraft.mode;
      shipLoadout = loadout;
      syncShipPresentation();
      closeHangar();
      toast("Configuración de nave guardada");
    };
    $("shipHangarBack").onclick = closeHangar;
    hangar.addEventListener("keydown", event => {
      // Keep preview keyboard navigation out of the campaign's global controls.
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        closeHangar();
      } else if (event.key === "Tab") {
        const controls = [...hangar.querySelectorAll("button,select")].filter(element => !element.disabled);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
  }

  function setupJourneyUI() {
    if (!JOURNEY_DEMO) return;
    document.body.classList.add("journey-mode");
    const mount = document.createElement("div");
    mount.innerHTML = `<div id="journeyRoute" class="journey-route hidden"><small>CRONOS → GAIA NOVA</small><b id="journeyDestination"></b><progress id="journeyDistance" max="1" value="0" aria-label="Recorrido hasta Gaia"></progress><span id="journeyObjective"></span></div>
      <div id="journeySkills" class="journey-skills hidden"><button id="journeyShield" type="button">ESCUDO <small>LISTO</small></button><button id="journeyTractor" type="button">TRACTOR <small>LISTO</small></button></div>
      <div id="journeyStation" class="overlay"><section class="panel journey-service"><small>BALIZA DE SERVICIO C9</small><img src="assets/repair_drone.webp" alt="Mira, robot del taller"><h2>Un momento de respiro.</h2><p>«Soy Mira. Ese módulo rescatado aún puede volar. Te lo monto y sello el casco.»</p><div class="journey-piece"><canvas id="journeyModulePreview" width="240" height="150" role="img" aria-label="Propulsor C9 recuperado">Propulsor C9 recuperado.</canvas><div><b>Propulsor C9</b><p>Respuesta lateral +20 % y propulsión ámbar visible. Instalación con la pieza recuperada; sin créditos.</p></div></div><button id="journeyInstall" class="primary" type="button">INSTALAR PIEZA Y REPARAR</button><button id="journeyContinue" class="secondary" type="button" disabled>CONTINUAR HACIA GAIA</button><button id="journeyStationHome" class="link" type="button">Guardar y volver</button></section></div>
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
      showStoryTransmission("MIRA · C9", "Propulsor conectado. Prueba el empuje hacia Gaia.", 3.2);
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
    ui.journeyInstall.textContent = journeyView.partInstalled ? "PROPULSOR MONTADO · CASCO SELLADO" : "INSTALAR PIEZA Y REPARAR";
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
    ui.journeyObjective.textContent = journeyView.phase === "station" ? "Instala la pieza recuperada" : journeyView.waitingFor === "part" ? "Recupera el módulo · usa TRACTOR si lo necesitas" : journeyView.borderActive && !journeyView.borderResolved ? "Desactiva al guardián CH-01 para abrir el paso" : journeyView.partCollected ? "Pieza a bordo · sigue el corredor" : "Rescata el propulsor C9 señalizado";
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
      showStoryTransmission("BALIZA C9", "Propulsor C9 intacto. Acércate o activa el tractor.", 3.8);
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
    if (JOURNEY_DEMO || atlasBoss) {
      ui.fire.classList.remove("empty");
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
    atlasBoss = null;
    atlasFireTimer = atlasReentryGrace = 0;
    atlasLastStatus = "";
    ui.goal.previousElementSibling.textContent = "NÚCLEOS";
    document.body.classList.remove("atlas-combat");
    ui.atlasEncounter?.classList.add("hidden");
    if (isAtlasMission()) { ensureSprite(SPRITES.guardianAtlas); ensureSprite(SPRITES.atlasVfx); }
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
    atlasBoss = null;
    ui.atlasEncounter?.classList.add("hidden");
    document.body.classList.remove("atlas-combat");
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
    if (isAtlasMission() && collected >= level().goal) {
      if (!atlasBoss) { beginAtlasEncounter(); return; }
      if (!atlasBoss.resolved) return;
    }
    if (N7_CAMPAIGN && (!encounterDirector?.finished || items.some(isThreat))) return;
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("complete");
    ui.atlasEncounter?.classList.add("hidden");
    document.body.classList.remove("atlas-combat");
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
    if (isAtlasMission() && atlasBoss?.resolved) ui.completeTitle.textContent = "Atlas ha abierto el paso";
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
    ui.atlasEncounter?.classList.add("hidden");
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
    if (atlasBoss) {
      atlasReentryGrace = 1.25;
      ui.atlasEncounter?.classList.remove("hidden");
    }
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
