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
    return item && ["meteor", "debris", "satellite", "scout"].includes(item.type);
  }

  function overlay(el) {
    [ui.menu, ui.briefing, ui.levelSelect, ui.settingsPanel, ui.instructions, ui.paused, ui.complete, ui.over, ui.journeyStation, ui.journeyComplete, ui.shipHangar, ui.flightDock].filter(Boolean)
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

  // DOM geometry is sampled on layout changes, never from the drawing loop.
  // All returned coordinates use the same logical Canvas units as collisions.
  function refreshClassicFlightBounds(reset = false) {
    if (!isUnifiedClassic()) return null;
    const canvasRect = canvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return classicFlightBounds;
    const verticalScale = H / canvasRect.height;
    const horizontal = canvasRect.height < 500;
    const visibleRect = (node) => {
      if (!node || node.classList.contains("hidden")) return null;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return null;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? rect : null;
    };
    // Reserve room for brief transmissions before they appear, avoiding a
    // sudden displacement of the ship when the first message is displayed.
    let hudBottomCss = canvasRect.top + (horizontal ? 126 : 182);
    for (const node of [ui.hud, $("flightRoute"),
      ui.storyTransmission?.classList.contains("show") ? ui.storyTransmission : null]) {
      const rect = visibleRect(node);
      if (rect) hudBottomCss = Math.max(hudBottomCss, rect.bottom);
    }
    let controlsTopCss = canvasRect.bottom - 104;
    const fireRect = visibleRect(ui.fire);
    if (fireRect) controlsTopCss = Math.min(controlsTopCss, fireRect.top);
    const powersRect = visibleRect(ui.powerHud);
    if (powersRect) {
      // Existing N-7 uses an upper power row; the unified classic moves it
      // above the fire control. Never mistake an upper row for a bottom edge.
      if (powersRect.top >= canvasRect.top + canvasRect.height / 2) {
        controlsTopCss = Math.min(controlsTopCss, powersRect.top);
      } else hudBottomCss = Math.max(hudBottomCss, powersRect.bottom);
    }
    const hudBottom = clamp((hudBottomCss - canvasRect.top) * verticalScale, 0, H);
    const controlsTop = clamp((controlsTopCss - canvasRect.top) * verticalScale, hudBottom, H);
    const base = NeonCampaign.calculateFlightBounds({ width: W, height: H, hudBottom, controlsTop });
    let minY = base.minY, maxY = base.maxY, yFits = base.yFits;
    if (atlasBoss) {
      const bossBottom = atlasBoss.targetY + (atlasBoss.visualSize || 350) * .52;
      minY = Math.max(minY, bossBottom + 158);
      if (minY > maxY) {
        // Keep the ship within the measured UI envelope even if the boss must
        // be resized by its presentation owner; report that the arena is tight.
        const center = clamp(minY / 2 + maxY / 2, base.minY, base.maxY);
        minY = center; maxY = center; yFits = false;
      }
    }
    classicFlightBounds = Object.freeze({ ...base, minY, maxY, yFits, fits: base.xFits && yFits });
    classicFlightAnchorY = maxY;
    player.x = clamp(player.x, classicFlightBounds.minX, classicFlightBounds.maxX);
    player.target = clamp(player.target, classicFlightBounds.minX, classicFlightBounds.maxX);
    if (reset || !Number.isFinite(player.y)) player.y = classicFlightAnchorY;
    else player.y = clamp(player.y, minY, maxY);
    if (reset || !Number.isFinite(player.targetY)) player.targetY = player.y;
    else player.targetY = clamp(player.targetY, minY, maxY);
    return classicFlightBounds;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const previousBounds = classicFlightBounds;
    const fractionY = previousBounds && previousBounds.maxY > previousBounds.minY
      ? clamp((player.y - previousBounds.minY) / (previousBounds.maxY - previousBounds.minY), 0, 1) : 1;
    const targetFractionY = previousBounds && previousBounds.maxY > previousBounds.minY && Number.isFinite(player.targetY)
      ? clamp((player.targetY - previousBounds.minY) / (previousBounds.maxY - previousBounds.minY), 0, 1) : fractionY;
    W = 720;
    H = Math.max(1180, Math.round(W * rect.height / rect.width));
    canvas.width = W;
    canvas.height = H;
    if (isUnifiedClassic()) {
      refreshClassicFlightBounds(!previousBounds);
      // Atlas derives its arena from a stable lower anchor, not from the
      // player's current vertical maneuver; refresh never calls back into it.
      positionAtlasArena();
      const next = refreshClassicFlightBounds();
      if (next) {
        player.y = next.minY + fractionY * (next.maxY - next.minY);
        player.targetY = next.minY + targetFractionY * (next.maxY - next.minY);
      }
    } else {
      // Preserve the experimental campaigns' existing horizontal flight line.
      const controlBandCss = JOURNEY_DEMO ? 136 : 104;
      const clearance = 110 + controlBandCss * H / rect.height;
      player.y = H - Math.max(JOURNEY_DEMO ? 360 : 260, clearance);
      player.x = clamp(player.x, 80, W - 80);
      player.target = clamp(player.target, 80, W - 80);
      positionAtlasArena();
    }
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
