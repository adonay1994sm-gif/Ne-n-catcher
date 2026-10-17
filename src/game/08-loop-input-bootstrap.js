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
      else if (item.type === "meteor" || item.type === "scout") drawMeteor(item);
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
