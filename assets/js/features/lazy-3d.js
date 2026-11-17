import { root } from '../core/env.js';
import { Field } from './field.js';

/* ------------------------------------------------------------------
   Lazy 3D: the text, layout and terminal show first. three.js (600 KB)
   and the portrait data (400 KB) are fetched after the first paint and
   started when the browser is idle. Until then the hero shows the name
   as plain text; the particles take over when they are ready.
------------------------------------------------------------------ */
export function lazy3D() {
  const save = navigator.connection && navigator.connection.saveData;
  if (save) { root.classList.add('no-3d'); return; }        /* data saver: keep the light page */
  const load = src => new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = ok; s.onerror = no;
    document.head.append(s);
  });
  const idle = () => new Promise(r => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 1500 }) : setTimeout(r, 200)));
  const afterPaint = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  afterPaint()
    .then(() => Promise.all([load('assets/vendor/three.min.js'), load('assets/data/portrait.js').catch(() => { })]))
    .then(idle)
    .then(() => Field.boot())
    .catch(err => { console.error(err); root.classList.add('no-3d'); });
}
