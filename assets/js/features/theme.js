import { $, reduce, root } from '../core/env.js';
import { Game } from './game.js';

/* ------------------------------------------------------------------
   Theme
------------------------------------------------------------------ */
export const Theme = (() => {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const subs = [];
  let btn = null, last = '';
  const current = () => root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
  function paint() {
    const t = current();
    if (btn) { btn.dataset.mode = t; btn.setAttribute('aria-label', t === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'); }
    if (t !== last) { last = t; subs.forEach(fn => fn(t)); }
  }
  function set(t) {
    const apply = () => { root.setAttribute('data-theme', t); try { localStorage.setItem('mk3-theme', t); } catch (e) { } paint(); };
    if (reduce || typeof document.startViewTransition !== 'function') {
      root.classList.add('theme-fade'); apply(); setTimeout(() => root.classList.remove('theme-fade'), 500); return;
    }
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);
    root.style.setProperty('--vt-r', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    root.classList.add('vt-theme');
    const end = () => root.classList.remove('vt-theme');
    try { document.startViewTransition(apply).finished.then(end, end); } catch (e) { apply(); end(); }
  }
  function init() {
    btn = $('#themeBtn');
    if (btn) btn.addEventListener('click', () => { set(current() === 'dark' ? 'light' : 'dark'); Game.award('theme'); });
    mq.addEventListener('change', paint);
    new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    paint();
  }
  return { init, current, set, onChange: fn => subs.push(fn) };
})();
