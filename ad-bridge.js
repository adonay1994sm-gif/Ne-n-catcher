(() => {
  "use strict";

  const config = window.MONETIZATION_CONFIG || {};
  const webConfig = config.web || {};
  const nativeConfig = config.native || {};
  const nativeBridge = window.NeonNativeAds;
  const adWrap = document.getElementById("adWrap");
  const notify = (message) => window.dispatchEvent(new CustomEvent("game-toast", { detail: message }));
  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
  let initialized = false;
  let adInProgress = false;
  let adState = "idle";

  const isNative = Boolean(nativeBridge?.isAvailable?.());

  function setAdState(next, detail = {}) {
    adState = next;
    emit("neon-ad-state", { state: next, ...detail });
  }

  async function withAdLifecycle(kind, operation) {
    if (adInProgress) return false;
    adInProgress = true;
    setAdState("loading", { kind });
    emit("neon-ad-opening", { kind });
    try {
      if (navigator.onLine === false) {
        setAdState("offline", { kind });
        return false;
      }
      setAdState("show", { kind });
      const completed = Boolean(await operation());
      setAdState(completed ? "completed" : "no-fill", { kind });
      return completed;
    } catch (error) {
      setAdState("failed", { kind, message: String(error?.message || error) });
      return false;
    } finally {
      emit("neon-ad-closed", { kind });
      setAdState("closed", { kind });
      adInProgress = false;
    }
  }

  async function initializeWebBanner() {
    adWrap?.classList.add("hidden");
    return false;
  }

  async function simulateRewardedForWeb() {
    if (!webConfig.testRewardedSimulator) return false;
    const delay = Math.max(250, Number(webConfig.simulatorDelayMs) || 900);
    notify("Anuncio de prueba: verificando recompensa…");
    await new Promise((resolve) => setTimeout(resolve, delay));
    emit("neon-test-ad-rewarded", { testOnly: true });
    notify("Recompensa de prueba confirmada");
    return true;
  }

  window.AdBridge = Object.freeze({
    isNative,
    getState: () => adState,

    async initialize() {
      if (initialized) return isNative;
      initialized = true;
      if (isNative && nativeConfig.enabled) {
        try {
          return await nativeBridge.initialize(nativeConfig);
        } catch (error) {
          console.warn("[NEON CRONIUM] AdMob de prueba no pudo inicializarse", error);
          return false;
        }
      }
      return initializeWebBanner();
    },

    async showBanner() {
      if (!isNative || !nativeConfig.enabled) return false;
      return nativeBridge.showBanner(nativeConfig);
    },

    async hideBanner() {
      if (!isNative || !nativeConfig.enabled) return false;
      return nativeBridge.hideBanner();
    },

    async showInterstitial() {
      if (!isNative || !nativeConfig.enabled) return false;
      return withAdLifecycle("interstitial", () => nativeBridge.showInterstitial(nativeConfig));
    },

    async showRewarded() {
      if (isNative && nativeConfig.enabled) {
        return withAdLifecycle("rewarded", () => nativeBridge.showRewarded(nativeConfig));
      }
      return withAdLifecycle("rewarded-test", simulateRewardedForWeb);
    }
  });

  addEventListener("DOMContentLoaded", () => {
    window.AdBridge.initialize().catch(() => adWrap?.classList.add("hidden"));
  });
})();
