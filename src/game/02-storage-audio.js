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
    [ui.menu, ui.briefing, ui.levelSelect, ui.settingsPanel, ui.instructions, ui.paused, ui.complete, ui.over]
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

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    W = 720;
    H = Math.max(1180, Math.round(W * rect.height / rect.width));
    canvas.width = W;
    canvas.height = H;
    player.y = H - 135;
    player.x = clamp(player.x, 80, W - 80);
    player.target = clamp(player.target, 80, W - 80);
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
