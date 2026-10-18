  function render(t) {
    syncShipPresentation();
    drawShipHangar(t);
    drawClassicDock(t);
    ctx.save();
    if (!settings.reduceEffects) {
      ctx.translate(cameraKickX, -cameraKickY);
      if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    background(t);
    drawWarp();
    drawTractorCable();
    for (const gate of gates) drawGate(gate);
    for (const item of items) {
      if (item.guardianProjectile || (isUnifiedClassic() && item.n7Projectile)) drawAtlasProjectile(item);
      else if (item.type === "salvage") drawSalvagePickup(item);
      else if (item.type === "flightModule") drawFlightModule(item);
      else if (item.type === "journeyPart") drawJourneyPart(item);
      else if (item.type === "energy") drawEnergy(item);
      else if (item.type === "meteor" || item.type === "scout") drawMeteor(item);
      else if (item.type === "debris") drawDebris(item);
      else if (item.type === "satellite") drawSatellite(item);
      else drawPower(item);
    }
    drawGuardianAtlas();
    drawPlayer(t);
    drawShots();
    drawClassicProjectiles();
    drawExplosions();
    drawImpactEffects();
    drawRings();
    drawParts();
    drawCombo();
    drawClassicChapterOpening();
    if (powers.slow > 0) {
      ctx.fillStyle = "rgba(75,125,255,.055)";
      ctx.fillRect(0, 0, W, H);
    }
    if (flash > 0 && !settings.reduceEffects) {
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
    // Holding the action thumb uses the existing simulation owner. Weapon
    // cooldown and the rechargeable battery still decide whether a shot fires.
    if (state !== "playing") resetGameInput();
    else if (fireInput && !ui.fire.disabled) fireManualShot();
    update(dt);
    if (!legacyRunning) return;
    const servicing = ui.flightDock?.classList.contains("show");
    signalScoreContext(servicing ? "station" : state === "complete" ? "arrival"
      : atlasBoss && !atlasBoss.resolved ? "atlas" : "transit");
    updateScore(dt, document.hidden || (state === "paused" && !servicing)
      || state === "gameover" || state === "destroying");
    render(now);
    if (legacyRunning) legacyFrameId = requestAnimationFrame(frame);
  }

  function pointerX(event, point = event.touches?.[0] || event) {
    const rect = canvas.getBoundingClientRect();
    return (point.clientX - rect.left) * W / rect.width;
  }

  function pointerY(event, point = event.touches?.[0] || event) {
    const rect = canvas.getBoundingClientRect();
    return (point.clientY - rect.top) * H / rect.height;
  }

  let legacyPilotId = null;
  let fireInput = null;
  let suppressNextFireClick = false;

  function releaseInputCapture(element, id) {
    if (typeof id !== "number") return;
    try { element.releasePointerCapture?.(id); } catch { /* Capture may already have ended. */ }
  }

  // Lifecycle callers use this as well as blur/cancellation. An action thumb
  // must never survive a pause, restart or return to the menu.
  function resetGameInput() {
    const pilotId = classicFlightInput.active ? classicFlightInput.id : legacyPilotId;
    const previousFire = fireInput;
    legacyPilotId = null;
    journeyPointerLast = null;
    fireInput = null;
    NeonCampaign.endFlightInput(classicFlightInput);
    releaseInputCapture(canvas, pilotId);
    if (previousFire?.kind === "pointer") releaseInputCapture(ui.fire, previousFire.id);
  }

  function moveClassicFlight(event) {
    if(classicChapterControlsLocked())return;
    if (event.type.startsWith("touch") && window.PointerEvent) return;
    const press = event.type === "pointerdown" || event.type === "touchstart";
    let point = event;
    let id = event.pointerId ?? "mouse";
    if (event.touches) {
      const candidates = press ? event.changedTouches : event.touches;
      point = press || !classicFlightInput.active ? candidates?.[0]
        : Array.from(candidates || []).find(touch => touch.identifier === classicFlightInput.id);
      if (!point) return;
      id = point.identifier;
    }
    const x = pointerX(event, point), y = pointerY(event, point);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const bounds = classicFlightBounds || refreshClassicFlightBounds();
    if (!bounds) return;
    if (press) {
      // A press only anchors relative input, regardless of where the finger
      // touches. Captured movement remains continuous outside the canvas.
      const started = NeonCampaign.beginFlightInput(classicFlightInput, { id, x, y });
      if (started && event.pointerId !== undefined) {
        try { canvas.setPointerCapture?.(event.pointerId); } catch { /* Synthetic events cannot capture. */ }
      }
      return;
    }
    const factor = settings.sensitivity / 100;
    const mouseHover = !event.touches && (!event.pointerType || event.pointerType === "mouse") &&
      !event.buttons && !classicFlightInput.active;
    if (mouseHover) {
      // Desktop hover retains the original accessible horizontal alternative;
      // vertical control requires dragging or the up/down keys.
      player.target = clamp(player.x + (x - player.x) * factor, bounds.minX, bounds.maxX);
      return;
    }
    const next = NeonCampaign.moveFlightInput(classicFlightInput, {
      id, x, y, targetX: player.target, targetY: player.targetY,
      sensitivity: factor, bounds
    });
    player.target = next.targetX;
    player.targetY = next.targetY;
  }

  function move(event) {
    if (state !== "playing") return;
    if (event.type.startsWith("touch") && window.PointerEvent) return;
    event.preventDefault();
    if (isUnifiedClassic()) { moveClassicFlight(event); return; }
    const press = event.type === "pointerdown" || event.type === "touchstart";
    let point = event;
    let id = event.pointerId ?? "mouse";
    if (event.touches) {
      point = press ? event.changedTouches?.[0]
        : Array.from(event.touches).find(touch => touch.identifier === legacyPilotId);
      if (!point) return;
      id = point.identifier;
    }
    const mouseHover = !event.touches && (!event.pointerType || event.pointerType === "mouse") &&
      !event.buttons && legacyPilotId === null;
    if (press) {
      if (legacyPilotId !== null) return;
      legacyPilotId = id;
      if (event.pointerId !== undefined) {
        try { canvas.setPointerCapture?.(event.pointerId); } catch { /* Synthetic events cannot capture. */ }
      }
    } else if (id !== legacyPilotId && !mouseHover) return;
    const x = pointerX(event, point);
    if (!Number.isFinite(x)) return;
    const factor = settings.sensitivity / 100;
    if (JOURNEY_DEMO) {
      if (press) {
        journeyPointerLast = x;
        return;
      }
      if (journeyPointerLast === null) return;
      player.target = clamp(player.target + (x - journeyPointerLast) * factor, 70, W - 70);
      journeyPointerLast = x;
      return;
    }
    player.target = clamp(player.x + (x - player.x) * factor, 70, W - 70);
  }

  canvas.addEventListener("pointerdown", move, { passive: false });
  canvas.addEventListener("pointermove", move, { passive: false });
  canvas.addEventListener("touchstart", move, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  function finishFlightInput(event) {
    let ids;
    if (event.type.startsWith("touch")) {
      if (window.PointerEvent) return;
      ids = Array.from(event.changedTouches || [], touch => touch.identifier);
    } else ids = [event.pointerId ?? "mouse"];
    for (const id of ids) {
      if (id === legacyPilotId) {
        legacyPilotId = null;
        journeyPointerLast = null;
      }
      NeonCampaign.endFlightInput(classicFlightInput, id);
    }
  }
  for (const event of ["pointerup", "pointercancel", "lostpointercapture", "touchend", "touchcancel"]) {
    canvas.addEventListener(event, finishFlightInput);
    // Pointer capture is not available in every embedded/Safari fallback. A
    // release over a control must still end only its own pilot contact.
    if (event !== "lostpointercapture") addEventListener(event, finishFlightInput, {capture: true});
  }
  addEventListener("blur", resetGameInput);

  function startFireInput(event) {
    const touchFallback = event.type === "touchstart";
    if (touchFallback && window.PointerEvent) return;
    if (state !== "playing" || ui.fire.disabled) return;
    if (!touchFallback && event.pointerType === "mouse" && event.button !== 0) return;
    const id = touchFallback ? event.changedTouches?.[0]?.identifier : event.pointerId ?? "mouse";
    if (id === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    if (fireInput) return;
    fireInput = {id, kind: touchFallback ? "touch" : "pointer"};
    suppressNextFireClick = true;
    if (!touchFallback && event.pointerId !== undefined) {
      try { ui.fire.setPointerCapture?.(event.pointerId); } catch { /* Synthetic events cannot capture. */ }
    }
    fireManualShot();
  }

  function finishFireInput(event) {
    if (!fireInput) return;
    const touchFallback = event.type.startsWith("touch");
    if (touchFallback && window.PointerEvent) return;
    const ended = touchFallback
      ? Array.from(event.changedTouches || []).some(touch => touch.identifier === fireInput.id)
      : (event.pointerId ?? "mouse") === fireInput.id;
    if (ended) fireInput = null;
  }

  ui.fire.addEventListener("pointerdown", startFireInput, {passive: false});
  ui.fire.addEventListener("touchstart", startFireInput, {passive: false});
  for (const event of ["pointerup", "pointercancel", "lostpointercapture", "touchend", "touchcancel"]) {
    ui.fire.addEventListener(event, finishFireInput);
    if (event !== "lostpointercapture") addEventListener(event, finishFireInput, {capture: true});
  }

  addEventListener("keydown", (event) => {
    if (isUnifiedClassic()) {
      if (state === "playing" && !classicChapterControlsLocked() && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const bounds = classicFlightBounds || refreshClassicFlightBounds();
        if (bounds) {
          const dx = event.key === "ArrowLeft" ? -85 : event.key === "ArrowRight" ? 85 : 0;
          const dy = event.key === "ArrowUp" ? -85 : event.key === "ArrowDown" ? 85 : 0;
          player.target = clamp(player.target + dx, bounds.minX, bounds.maxX);
          player.targetY = clamp(player.targetY + dy, bounds.minY, bounds.maxY);
        }
      }
    } else {
      if (event.key === "ArrowLeft") player.target -= 85;
      if (event.key === "ArrowRight") player.target += 85;
    }
    if (event.key === " " && state === "playing") {
      event.preventDefault();
      fireManualShot();
    }
    if(event.key.toLowerCase()==="m"&&state==="playing"&&isUnifiedClassic())fireClassicMissile();
    if (event.key === "Escape") {
      resetGameInput();
      state === "paused" ? resumeGame() : pauseGame();
    }
  });

  $("play").onclick = () => {
    if (JOURNEY_DEMO) { startJourney(); return; }
    if(isUnifiedClassic()&&classicVoyageRecord&&!classicVoyageRecord.completed){prepareLevel(0,"menu");return;}
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
  ui.fire.onclick = (event) => {
    // Pointer/touch presses have fired already. Their compatibility click must
    // not consume a second battery charge; keyboard/assistive clicks still work.
    if (event?.detail && (window.PointerEvent || suppressNextFireClick)) {
      suppressNextFireClick = false;
      return;
    }
    fireManualShot();
  };
  $("resume").onclick = resumeGame;
  $("pauseSettings").onclick = () => openSettings("paused");
  $("restart").onclick = () => JOURNEY_DEMO ? startJourney() : startLevel(currentLevel);
  $("quit").onclick = goHome;
  $("home").onclick = goHome;
  $("completeHome").onclick = goHome;
  $("retry").onclick = () => JOURNEY_DEMO ? startJourney() : startLevel(currentLevel);
  $("replayLevel").onclick = () => JOURNEY_DEMO ? startJourney() : startLevel(currentLevel);
  ui.nextLevel.onclick = () => {
    if(isUnifiedClassic()&&currentLevel===0&&state==="complete"&&getUnlocked()>=2) {
      startLevel(1);
      showStoryTransmission("IRIA · MANDO GAIA","Tu autorización es válida. Sigue la señal por el corredor orbital; el registro apunta hacia Vulkar.",5.5);
      return;
    }
    prepareLevel(Math.min(LEVELS.length - 1, currentLevel + 1), "complete");
  };

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
  ui.autoFire.onchange = (event) => {
    const previous = settings.autoFire;
    settings.autoFire = event.target.checked;
    if (!saveSettings()) {
      settings.autoFire = previous; event.target.checked = previous;
      toast("No se pudo guardar el modo de disparo");
    }
  };
  ui.vibration.onchange = (event) => {
    settings.vibration = event.target.checked;
    if (settings.vibration) vibrate(20);
  };
  ui.effectsQuality.onchange = (event) => {
    settings.effectsQuality = ["low", "normal", "high"].includes(event.target.value) ? event.target.value : "normal";
    settings.effects = settings.effectsQuality !== "low";
  };
  ui.reduceEffects.onchange = (event) => {
    settings.reduceEffects = event.target.checked;
    document.body.classList.toggle("reduced-effects", settings.reduceEffects);
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
    resetGameInput();
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

  recoverCampaignCompletion();
  currentLevel=Math.max(0,Math.min(LEVELS.length-1,getUnlocked()-1));
  setupClassicFlight();
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
  console.info(`[NEON CRONIUM] build ${BUILD_VERSION}`);
  setupJourneyUI();
  setupShipHangar();
  setupAtlasEncounter();
  updateMenu();
  hud();
  resetPowers();
  overlay(ui.menu);
  legacyFrameId = requestAnimationFrame(frame);
})();
