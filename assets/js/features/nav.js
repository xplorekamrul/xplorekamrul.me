import { $, $$, hasGSAP, reduce, root } from '../core/env.js';
import { Theme } from './theme.js';

/* ------------------------------------------------------------------
   Navigation
------------------------------------------------------------------ */
export function nav() {
  const top = $('#top'), menu = $('#menu'), menuBtn = $('#menuBtn');
  const links = $$('.nav a, .dots a');
  let queued = false;
  const onScroll = () => { queued = false; top.classList.toggle('is-stuck', scrollY > 40); };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const setMenu = open => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu');
    root.classList.toggle('menu-open', open);
    if (open && hasGSAP && !reduce) gsap.from('.menu a', { yPercent: 60, autoAlpha: 0, duration: 0.7, stagger: 0.06, ease: 'expo.out' });
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });

  const HUES = [[38, 16], [190, 224], [262, 322], [96, 150], [14, 44], [168, 200], [50, 92], [226, 268], [352, 318]];
  const setSectionHue = ch => {
    const k = Number(ch);
    if (isNaN(k) || !HUES[k]) return;
    const hue = (k === 0 && Theme.current() !== 'dark') ? 224 : HUES[k][0];
    root.style.setProperty('--hue', String(hue));
  };

  if (!('IntersectionObserver' in window)) return;
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) {
      links.forEach(l => l.setAttribute('aria-current', String(l.getAttribute('href') === `#${en.target.id}`)));
      if (en.target.dataset.chapter !== undefined) setSectionHue(en.target.dataset.chapter);
    }
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(s => spy.observe(s));

  Theme.onChange(() => {
    const cur = $$('main > section').find(s => {
      const r = s.getBoundingClientRect();
      return r.top <= innerHeight * 0.5 && r.bottom >= innerHeight * 0.5;
    });
    if (cur && cur.dataset.chapter !== undefined) setSectionHue(cur.dataset.chapter);
  });
}
