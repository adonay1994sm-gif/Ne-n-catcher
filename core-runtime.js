(()=>{
"use strict";
// src/core/game-state.js
const GAME_STATES = Object.freeze({
  MENU: "menu", BRIEFING: "briefing", PLAYING: "playing", PAUSED: "paused",
  DESTROYING: "destroying", GAME_OVER: "gameover", COMPLETE: "complete"
});

function createGameState(initial = GAME_STATES.MENU) {
  let value = initial;
  const listeners = new Set();
  return Object.freeze({
    get value() { return value; },
    transition(next, metadata = {}) {
      if (!Object.values(GAME_STATES).includes(next)) {
        throw new Error(`Estado de juego no válido: ${next}`);
      }
      const previous = value;
      if (previous === next) return value;
      value = next;
      for (const listener of listeners) listener({ previous, next, metadata });
      return value;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
}

// src/core/object-pool.js
function createObjectPool(factory = () => ({}), reset = (item) => item, maximum = 256) {
  const available = [];
  let created = 0;
  return Object.freeze({
    acquire(seed = {}) {
      const item = available.pop() || factory();
      if (!item.__poolCreated) {
        Object.defineProperty(item, "__poolCreated", { value: true, enumerable: false });
        created += 1;
      }
      Object.assign(item, seed);
      return item;
    },
    release(item) {
      if (!item || available.length >= maximum) return;
      reset(item);
      available.push(item);
    },
    stats() { return { created, available: available.length, maximum }; }
  });
}

// src/core/storage-service.js
function createStorageService(storage) {
  const safe = (operation, fallback) => {
    try { return operation(); } catch { return fallback; }
  };
  const resolveStorage = () => storage ?? globalThis.localStorage;
  return Object.freeze({
    getNumber(key, fallback = 0) {
      return safe(() => {
        const raw = resolveStorage().getItem(key);
        if (raw == null || raw === "") return fallback;
        const value = Number(raw);
        return Number.isFinite(value) ? value : fallback;
      }, fallback);
    },
    getJSON(key, fallback) {
      return safe(() => {
        const raw = resolveStorage().getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      }, fallback);
    },
    set(key, value) { return safe(() => (resolveStorage().setItem(key, String(value)), true), false); },
    setJSON(key, value) { return safe(() => (resolveStorage().setItem(key, JSON.stringify(value)), true), false); },
    remove(key) { return safe(() => (resolveStorage().removeItem(key), true), false); }
  });
}

// src/core/player-model.js
const PLAYER_GEOMETRY = Object.freeze({
  visualWidth: 132,
  visualHeight: 92,
  collisionHalfWidth: 106,
  minX: 78
});

function createPlayerModel(width = 720, height = 1280) {
  const player = { x: width / 2, y: height - 150, w: PLAYER_GEOMETRY.visualWidth, h: PLAYER_GEOMETRY.visualHeight, target: width / 2, drift: 0 };
  return player;
}

// src/core/damage-service.js
function resolveDamage({ hull, amount, shieldActive }) {
  const safeHull = Math.max(0, Number(hull) || 0);
  const safeAmount = Math.max(0, Number(amount) || 0);
  if (shieldActive) return Object.freeze({ hull: safeHull, absorbed: true, destroyed: false });
  const nextHull = Math.max(0, safeHull - safeAmount);
  return Object.freeze({ hull: nextHull, absorbed: false, destroyed: nextHull <= 0 });
}

// src/core/index.js
globalThis.NeonCore = Object.freeze({
  GAME_STATES, createGameState, createObjectPool, createStorageService,
  PLAYER_GEOMETRY, createPlayerModel, resolveDamage
});

})();
