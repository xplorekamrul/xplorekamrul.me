import { content } from '../core/content.js';
import { $, clamp, reduce, root } from '../core/env.js';
import { Field } from './field.js';

/* ------------------------------------------------------------------
   Loader, then the intro
------------------------------------------------------------------ */
export function loader() {
  const n = $('#loadN'), bar = $('#loadBar'), log = $('#loadLog');
  const lines = content.loader.lines;
  const done = () => { root.classList.add('is-ready'); Field.start(); };
  if (reduce || !n) { done(); return; }
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  let fontsIn = false;
  Promise.race([fonts, new Promise(r => setTimeout(r, 900))]).then(() => { fontsIn = true; }, () => { fontsIn = true; });
  const t0 = performance.now(), DUR = 700;
  (function tick(now) {
    let p = clamp((now - t0) / DUR);
    p = 1 - Math.pow(1 - p, 2.2);
    if (!fontsIn) p = Math.min(p, 0.92);          /* wait at 92 until the type is in */
    const v = Math.round(p * 100);
    n.textContent = String(v);
    bar.style.width = `${v}%`;
    log.textContent = lines[Math.min(lines.length - 1, Math.floor(p * lines.length))];
    if (v >= 100) setTimeout(done, 220); else requestAnimationFrame(tick);
  })(t0);
}
