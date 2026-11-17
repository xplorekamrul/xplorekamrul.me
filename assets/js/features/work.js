import { $, $$, clamp, finePointer, reduce } from '../core/env.js';
import { Field } from './field.js';
import { Game } from './game.js';

/* ------------------------------------------------------------------
   Work: accordion, plus a preview card that chases the cursor and
   tints the particle cloud with the project's colour
------------------------------------------------------------------ */
export function work() {
  const rows = $$('.row');
  const seen = new Set();
  rows.forEach(row => {
    const btn = $('.row__btn', row);
    btn.addEventListener('click', () => {
      const open = !row.classList.contains('is-open');
      rows.forEach(r => { r.classList.remove('is-open'); $('.row__btn', r).setAttribute('aria-expanded', 'false'); });
      if (open) {
        row.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
        seen.add(row);
        if (seen.size >= 3) Game.award('open3');
      }
    });
  });

  const peek = $('#peek'), card = $('#peekCard');
  if (!finePointer || reduce || !peek) return;
  const pos = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, s: 0, ts: 0, r: 0 };
  let raf = 0;
  const tick = () => {
    raf = 0;
    const dx = pos.tx - pos.x, dy = pos.ty - pos.y;
    pos.x += dx * 0.14; pos.y += dy * 0.14; pos.s += (pos.ts - pos.s) * 0.16;
    pos.r += (clamp(dx * 0.12, -14, 14) - pos.r) * 0.2;
    peek.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) translate(-50%, -50%) rotate(${pos.r.toFixed(2)}deg) scale(${pos.s.toFixed(3)})`;
    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2 || Math.abs(pos.ts - pos.s) > 0.004) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  rows.forEach(row => {
    const btn = $('.row__btn', row);
    btn.addEventListener('pointerenter', () => {
      card.style.setProperty('--h', row.dataset.hue);
      $('#peekIni').textContent = row.dataset.ini;
      $('#peekUrl').textContent = row.dataset.url;
      peek.classList.add('is-on'); pos.ts = 1; kick();
      Field.tint(Number(row.dataset.hue));
    });
    btn.addEventListener('pointermove', e => { pos.tx = e.clientX + 190; pos.ty = e.clientY - 20; if (pos.tx > innerWidth - 170) pos.tx = e.clientX - 190; kick(); });
    btn.addEventListener('pointerleave', () => { peek.classList.remove('is-on'); pos.ts = 0; kick(); Field.tint(null); });
  });
}
