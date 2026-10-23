import { GAME_STATES, createGameState } from "./game-state.js";
import { createObjectPool } from "./object-pool.js";
import { createStorageService } from "./storage-service.js";
import { PLAYER_GEOMETRY, createPlayerModel } from "./player-model.js";
import { resolveDamage } from "./damage-service.js";

globalThis.NeonCore = Object.freeze({
  GAME_STATES, createGameState, createObjectPool, createStorageService,
  PLAYER_GEOMETRY, createPlayerModel, resolveDamage
});
