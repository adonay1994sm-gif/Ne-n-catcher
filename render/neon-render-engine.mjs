/* NEON Render Engine — modular Canvas 2D foundation.
 * No global state, no gameplay mutations. Opt-in integration only.
 */
export const NEON_RENDER_VERSION = '0.1.0';
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function seededRandom(seed = 1) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function createStarfield({ width = 720, height = 1280, seed = 713, count = 90 } = {}) {
  const rand = seededRandom(seed);
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => ({
    x: rand() * width, y: rand() * height,
    depth: 0.2 + rand() * 0.8,
    radius: 0.45 + rand() * 1.35,
    phase: rand() * Math.PI * 2
  }));
}
export class NeonRenderEngine {
  constructor(canvas, { quality = 'normal', seed = 713 } = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('Canvas required');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.quality = quality;
    this.seed = seed;
    this.time = 0;
    this.stars = createStarfield({ width: canvas.width, height: canvas.height, seed, count: this.starCount });
    this.particles = [];
  }
  get starCount() { return ({ low: 48, normal: 90, high: 140 })[this.quality] ?? 90; }
  get particleLimit() { return ({ low: 70, normal: 150, high: 260 })[this.quality] ?? 150; }
  setQuality(quality) {
    if (!['low', 'normal', 'high'].includes(quality)) throw new RangeError('Invalid quality');
    this.quality = quality;
    this.stars = createStarfield({ width: this.canvas.width, height: this.canvas.height, seed: this.seed, count: this.starCount });
    this.particles.length = Math.min(this.particles.length, this.particleLimit);
  }
  resize(width, height) {
    if (!(width > 0 && height > 0)) throw new RangeError('Invalid dimensions');
    this.canvas.width = Math.round(width); this.canvas.height = Math.round(height);
    this.stars = createStarfield({ width: this.canvas.width, height: this.canvas.height, seed: this.seed, count: this.starCount });
  }
  update(dt) {
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.05);
    this.time += step;
    for (const p of this.particles) {
      p.x += p.vx * step; p.y += p.vy * step;
      p.life -= step;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }
  emit({ x, y, vx = 0, vy = 0, life = 0.5, radius = 2, color = '#63eaff' }) {
    if (![x, y, vx, vy, life, radius].every(Number.isFinite) || life <= 0 || radius <= 0) return false;
    if (this.particles.length >= this.particleLimit) return false;
    this.particles.push({ x, y, vx, vy, life, maxLife: life, radius, color });
    return true;
  }
  drawBackground({ speed = 0, tint = '#050916' } = {}) {
    const { ctx, canvas } = this;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    for (const star of this.stars) {
      const y = ((star.y + this.time * speed * star.depth) % h + h) % h;
      const glow = 0.45 + 0.25 * Math.sin(this.time * (0.7 + star.depth) + star.phase);
      ctx.globalAlpha = glow;
      ctx.fillStyle = star.depth > 0.7 ? '#a7ecff' : '#8396c7';
      ctx.beginPath(); ctx.arc(star.x, y, star.radius * star.depth, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawSprite(image, { x, y, width, height, rotation = 0, alpha = 1, frame = 0, columns = 1, rows = 1 } = {}) {
    if (!image || !image.width || !image.height || !(width > 0 && height > 0)) return false;
    const cols = Math.max(1, Math.floor(columns)), rs = Math.max(1, Math.floor(rows));
    const f = clamp(Math.floor(frame), 0, cols * rs - 1);
    const sw = image.width / cols, sh = image.height / rs;
    const { ctx } = this;
    ctx.save();
    try {
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.translate(x, y); ctx.rotate(rotation);
      ctx.drawImage(image, (f % cols) * sw, Math.floor(f / cols) * sh, sw, sh, -width / 2, -height / 2, width, height);
    } finally { ctx.restore(); }
    return true;
  }
}
