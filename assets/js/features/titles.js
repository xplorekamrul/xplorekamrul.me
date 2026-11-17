import { $$ } from '../core/env.js';

/* ------------------------------------------------------------------
   Titles: split into letters, rise when first seen
------------------------------------------------------------------ */
export function titles() {
  const els = $$('.split');
  els.forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, k, all) => {
      const w = document.createElement('span');
      w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      [...word].forEach(ch => {
        const c = document.createElement('span');
        c.className = 'c'; c.style.setProperty('--i', String(i++)); c.textContent = ch;
        w.append(c);
      });
      el.append(w);
      if (k < all.length - 1) el.append(' ');
    });
  });
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  els.forEach(e => io.observe(e));
}
