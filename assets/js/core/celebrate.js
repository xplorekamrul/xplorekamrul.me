/* ==========================================================================
   Celebrations: a confetti blast at a point on the screen, and a fireworks
   finale. Drawn on one transparent canvas over the page that never takes
   clicks, and only runs while something is flying.
   ========================================================================== */
import { reduce } from './env.js';

let canvas = null, ctx = null, raf = 0, dpr = 1;
const bits = [], rings = [];

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  ctx = canvas.getContext('2d');
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  };
  size();
  addEventListener('resize', size);
}

const COLORS = ['#FFC766', '#66E0FF', '#B48CFF', '#66FFB0', '#FF7A8C', '#FFFFFF'];

function frame(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i], t = (now - r.t0) / r.life;
    if (t >= 1) { rings.splice(i, 1); continue; }
    if (t < 0) continue;                                  /* a delayed ring that has not started yet */
    const e = 1 - Math.pow(1 - t, 3);
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.strokeStyle = r.color; ctx.lineWidth = 3 * (1 - t) + 0.5;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.max * e, 0, Math.PI * 2); ctx.stroke();
  }

  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i];
    b.age++;
    if (b.age > b.life) { bits.splice(i, 1); continue; }
    b.vx *= b.drag; b.vy = b.vy * b.drag + b.gravity;
    b.x += b.vx; b.y += b.vy; b.rot += b.spin;
    ctx.globalAlpha = Math.min(1, (1 - b.age / b.life) * 1.6);
    ctx.fillStyle = b.color;
    if (b.kind === 'spark') {
      ctx.strokeStyle = b.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 3, b.y - b.vy * 3); ctx.stroke();
    } else {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.scale(1, Math.cos(b.rot * 1.7));                       /* the paper flips as it falls */
      if (b.kind === 'dot') { ctx.beginPath(); ctx.arc(0, 0, b.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  if (bits.length || rings.length) raf = requestAnimationFrame(frame);
  else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

/** A confetti blast from (x, y) in viewport pixels. power ~1 for one bug, more for big moments. */
export function burst(x, y, power = 1) {
  if (reduce) return;
  ensureCanvas();
  const n = Math.round(70 * power);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, speed = (3 + Math.random() * 7) * Math.sqrt(power);
    const kind = i % 7 === 0 ? 'spark' : i % 3 === 0 ? 'dot' : 'paper';
    bits.push({
      kind, x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 3.5 * Math.sqrt(power),   /* a little upward kick */
      gravity: kind === 'spark' ? 0.12 : 0.22, drag: kind === 'spark' ? 0.94 : 0.965,
      size: 6 + Math.random() * 7, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0], age: 0, life: 70 + Math.random() * 60
    });
  }
  const t0 = performance.now();
  rings.push({ x, y, t0, life: 650, max: 70 * Math.sqrt(power), color: '#FFC766' });
  rings.push({ x, y, t0: t0 + 90, life: 750, max: 110 * Math.sqrt(power), color: '#66E0FF' });
  run();
}

/** The finale: a few bursts across the screen, one after another. */
export function fireworks() {
  if (reduce) return;
  const spots = [[0.5, 0.45], [0.22, 0.35], [0.78, 0.35], [0.35, 0.65], [0.65, 0.62], [0.5, 0.25]];
  spots.forEach(([fx, fy], i) => setTimeout(() => burst(innerWidth * fx, innerHeight * fy, 1.6), i * 260));
}
