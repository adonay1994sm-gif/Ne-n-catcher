/** Logical-coordinate camera for the opt-in NEON engine. No RAF or gameplay state. */
function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
function viewportSize(viewport) {
  if (!viewport || !(viewport.width > 0) || !(viewport.height > 0) ||
      !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height)) {
    throw new RangeError('A positive finite logical viewport is required');
  }
  return viewport;
}
export class Camera2D {
  constructor({ x = 0, y = 0, zoom = 1, minZoom = 0.25, maxZoom = 4 } = {}) {
    finite(minZoom, 'minZoom'); finite(maxZoom, 'maxZoom');
    if (minZoom <= 0 || maxZoom < minZoom) throw new RangeError('Invalid zoom limits');
    this.minZoom = minZoom; this.maxZoom = maxZoom;
    this.setPosition(x, y); this.setZoom(zoom);
  }
  setPosition(x, y) {
    this.x = finite(x, 'camera x'); this.y = finite(y, 'camera y'); return this;
  }
  setZoom(zoom) {
    finite(zoom, 'zoom');
    if (zoom <= 0) throw new RangeError('Zoom must be positive');
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom)); return this;
  }
  /** Parallax 0 = screen-anchored plane; 1 = world motion; >1 = foreground. */
  worldToScreen(x, y, viewport, parallax = 1) {
    viewportSize(viewport); finite(parallax, 'parallax');
    return {
      x: viewport.width / 2 + (finite(x, 'world x') - this.x * parallax) * this.zoom,
      y: viewport.height / 2 + (finite(y, 'world y') - this.y * parallax) * this.zoom
    };
  }
  screenToWorld(x, y, viewport, parallax = 1) {
    viewportSize(viewport); finite(parallax, 'parallax');
    return {
      x: (finite(x, 'screen x') - viewport.width / 2) / this.zoom + this.x * parallax,
      y: (finite(y, 'screen y') - viewport.height / 2) / this.zoom + this.y * parallax
    };
  }
  /** Frame-rate-independent follow; paused simulation (dt=0) does not advance. */
  follow(x, y, dt, responsiveness = 5) {
    finite(x, 'target x'); finite(y, 'target y'); finite(dt, 'dt'); finite(responsiveness, 'responsiveness');
    if (dt < 0 || responsiveness < 0) throw new RangeError('Negative follow timing');
    const blend = 1 - Math.exp(-Math.min(dt, 0.25) * responsiveness);
    this.x += (x - this.x) * blend; this.y += (y - this.y) * blend;
    return this;
  }
}
