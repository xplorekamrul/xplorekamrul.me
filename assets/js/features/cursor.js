import { $, $$, finePointer, reduce, root } from '../core/env.js';

/* ------------------------------------------------------------------
   Custom cursor and magnetic buttons (fine pointers only)
------------------------------------------------------------------ */
export function cursor() {
  const el = $('#cursor'), label = $('#cursorLabel');
  if (!finePointer || reduce || !el) return;
  let x = -100, y = -100, tx = -100, ty = -100, raf = 0, shown = false;
  const tick = () => {
    raf = 0;
    x += (tx - x) * 0.22; y += (ty - y) * 0.22;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(tick);
  };
  addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; x = tx; y = ty; root.classList.add('has-cursor'); }
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    const bug = e.target.closest('.bug'), row = e.target.closest('.row__btn'), link = e.target.closest('a, button, input, .job');
    const text = bug ? 'Squash' : row ? (row.getAttribute('aria-expanded') === 'true' ? 'Close' : 'Open') : '';
    label.textContent = text;
    el.classList.toggle('is-label', !!text);
    el.classList.toggle('is-link', !text && !!link);
  });

  $$('.magnet').forEach(m => {
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      m.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1)}px)`;
    });
    m.addEventListener('pointerleave', () => { m.style.transform = ''; });
  });
}
