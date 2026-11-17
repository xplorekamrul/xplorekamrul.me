import { $, $$, clamp, finePointer, reduce } from '../core/env.js';
import { Field } from './field.js';
import { Hover } from './hover.js';

/* ------------------------------------------------------------------
   Education: grade rings that fill when seen, a marker on the degree
   in progress, a medal-like tilt on the award, and the particles
   write the grade of the row under the cursor.
------------------------------------------------------------------ */
export function school() {
  const list = $('.edu__list');
  if (!list) return;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { list.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(list);
  } else list.classList.add('is-in');

  /* where today falls between the start and the end of the degree (taken as mid-year to mid-year) */
  const bar = $('.edu__bar');
  if (bar) {
    const a = new Date(Number(bar.dataset.from), 6, 1), b = new Date(Number(bar.dataset.to), 6, 1);
    bar.style.setProperty('--now', clamp((Date.now() - a) / (b - a), 0.03, 0.97).toFixed(3));
  }

  const award = $('.award');
  if (award && finePointer && !reduce) {
    award.addEventListener('pointermove', e => {
      const r = award.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      award.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
      award.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
      award.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      award.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    award.addEventListener('pointerleave', () => { award.style.setProperty('--ry', '0deg'); award.style.setProperty('--rx', '0deg'); });
  }

  const col = $('.career .col');
  $$('li[data-word]', list).forEach(li => {
    li.addEventListener('pointerenter', () => {
      const free = col.getBoundingClientRect().left;
      if (!Hover.ok() || free < 380) return;
      const H = innerHeight;
      Hover.show(() => { if (li.matches(':hover')) Field.word(li.dataset.word, { cx: free / 2, cy: H / 2, w: free * 0.7, h: H * 0.3 }, 150); });
    });
    li.addEventListener('pointerleave', () => Hover.hide());
  });
}
