import { Camera2D } from './Camera2D.js';

/** Asset-backed 2.5D composition for EngineCore.drawScene. Never owns RAF or gameplay. */
const finite = (value, label) => {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function normalizeLayer(layer, index) {
  if (!layer || typeof layer !== 'object') throw new TypeError('Layer must be an object');
  if (typeof layer.id !== 'string' || !layer.id) throw new TypeError('Layer id required');
  const mode = layer.mode ?? 'sprite';
  if (mode !== 'sprite' && mode !== 'cover') throw new RangeError(`Invalid layer mode: ${mode}`);
  const result = {
    id: layer.id, image: layer.image ?? null, mode, visible: layer.visible !== false,
    z: finite(layer.z ?? 0, 'z'), x: finite(layer.x ?? 0, 'x'), y: finite(layer.y ?? 0, 'y'),
    parallax: finite(layer.parallax ?? 1, 'parallax'),
    scale: finite(layer.scale ?? 1, 'scale'), opacity: finite(layer.opacity ?? 1, 'opacity'),
    rotation: finite(layer.rotation ?? 0, 'rotation'),
    anchorX: finite(layer.anchorX ?? 0.5, 'anchorX'),
    anchorY: finite(layer.anchorY ?? 0.5, 'anchorY'),
    width: layer.width == null ? null : finite(layer.width, 'width'),
    height: layer.height == null ? null : finite(layer.height, 'height'),
    source: layer.source ? { ...layer.source } : null, index
  };
  if (result.scale <= 0 || result.opacity < 0 || result.opacity > 1 || result.parallax < 0 ||
      result.anchorX < 0 || result.anchorX > 1 || result.anchorY < 0 || result.anchorY > 1 ||
      (result.width !== null && result.width <= 0) || (result.height !== null && result.height <= 0)) {
    throw new RangeError(`Invalid geometry or opacity for layer ${layer.id}`);
  }
  if (result.source) {
    const s = result.source;
    for (const key of ['x', 'y', 'width', 'height']) finite(s[key], `source.${key}`);
    if (s.x < 0 || s.y < 0 || s.width <= 0 || s.height <= 0) throw new RangeError('Invalid atlas rectangle');
  }
  return result;
}

export class SceneCompositor {
  constructor({ layers = [], camera = new Camera2D() } = {}) {
    if (!camera || typeof camera.worldToScreen !== 'function') throw new TypeError('Camera required');
    this.camera = camera;
    this.setLayers(layers);
  }

  setLayers(layers) {
    if (!Array.isArray(layers)) throw new TypeError('Layers must be an array');
    const next = layers.map(normalizeLayer);
    if (new Set(next.map(layer => layer.id)).size !== next.length) throw new Error('Duplicate layer id');
    this.layers = next.sort((a, b) => a.z - b.z || a.index - b.index);
    return this;
  }

  /** Replace a single layer's metadata without replacing its image or reloading assets. */
  updateLayer(id, patch) {
    const previous = this.layers.find(layer => layer.id === id);
    if (!previous) return false;
    const { index, ...old } = previous;
    const updated = normalizeLayer({ ...old, ...patch, id }, index);
    this.layers = this.layers.map(layer => layer.id === id ? updated : layer)
      .sort((a, b) => a.z - b.z || a.index - b.index);
    return true;
  }

  render(ctx, viewport) {
    if (!ctx?.drawImage || !ctx.save || !ctx.restore) throw new TypeError('Canvas 2D context required');
    if (!viewport || !(viewport.width > 0) || !(viewport.height > 0) ||
        !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height)) {
      throw new RangeError('Invalid logical viewport');
    }
    const result = { drawn: 0, skipped: 0, culled: 0 };
    for (const layer of this.layers) {
      const image = layer.image;
      const iw = image?.naturalWidth || image?.width || 0;
      const ih = image?.naturalHeight || image?.height || 0;
      if (!layer.visible || layer.opacity === 0 || image?.complete === false || !(iw > 0 && ih > 0)) {
        result.skipped++;
        continue;
      }
      if (layer.source && (layer.source.x + layer.source.width > iw || layer.source.y + layer.source.height > ih)) {
        result.skipped++;
        continue;
      }
      const source = layer.source;
      const nativeW = source?.width ?? iw;
      const nativeH = source?.height ?? ih;
      let x, y, w, h;
      if (layer.mode === 'cover') {
        const fit = Math.max(viewport.width / nativeW, viewport.height / nativeH);
        const zoom = Math.max(1, this.camera.zoom);
        w = nativeW * fit * Math.max(1, layer.scale) * zoom;
        h = nativeH * fit * Math.max(1, layer.scale) * zoom;
        const offsetX = (layer.x - this.camera.x * layer.parallax) * this.camera.zoom;
        const offsetY = (layer.y - this.camera.y * layer.parallax) * this.camera.zoom;
        x = viewport.width / 2 + clamp(offsetX, -Math.max(0, (w - viewport.width) / 2), Math.max(0, (w - viewport.width) / 2));
        y = viewport.height / 2 + clamp(offsetY, -Math.max(0, (h - viewport.height) / 2), Math.max(0, (h - viewport.height) / 2));
      } else {
        const point = this.camera.worldToScreen(layer.x, layer.y, viewport, layer.parallax);
        x = point.x; y = point.y;
        w = (layer.width ?? nativeW) * layer.scale * this.camera.zoom;
        h = (layer.height ?? nativeH) * layer.scale * this.camera.zoom;
        // Conservative pivot-radius culling: rotated and off-centre sprites stay visible.
        const radius = Math.hypot(Math.max(layer.anchorX, 1 - layer.anchorX) * w,
                                  Math.max(layer.anchorY, 1 - layer.anchorY) * h);
        if (x + radius < 0 || y + radius < 0 || x - radius > viewport.width || y - radius > viewport.height) {
          result.culled++;
          continue;
        }
      }
      ctx.save();
      try {
        ctx.globalAlpha *= layer.opacity;
        ctx.translate(x, y);
        if (layer.rotation) ctx.rotate(layer.rotation);
        const dx = -layer.anchorX * w;
        const dy = -layer.anchorY * h;
        if (source) ctx.drawImage(image, source.x, source.y, source.width, source.height, dx, dy, w, h);
        else ctx.drawImage(image, dx, dy, w, h);
        result.drawn++;
      } finally {
        ctx.restore();
      }
    }
    return result;
  }
}
