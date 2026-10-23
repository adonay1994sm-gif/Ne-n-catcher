export const PLAYER_GEOMETRY = Object.freeze({
  visualWidth: 132,
  visualHeight: 92,
  collisionHalfWidth: 106,
  minX: 78
});

export function createPlayerModel(width = 720, height = 1280) {
  const player = { x: width / 2, y: height - 150, w: PLAYER_GEOMETRY.visualWidth, h: PLAYER_GEOMETRY.visualHeight, target: width / 2, drift: 0 };
  return player;
}
