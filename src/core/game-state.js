export const GAME_STATES = Object.freeze({
  MENU: "menu", BRIEFING: "briefing", PLAYING: "playing", PAUSED: "paused",
  DESTROYING: "destroying", GAME_OVER: "gameover", COMPLETE: "complete"
});

export function createGameState(initial = GAME_STATES.MENU) {
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
