import { $, $$, clamp, reduce } from '../core/env.js';
import { ui } from '../core/ui.js';
import { Resume } from './resume.js';
import { Spell } from './spell.js';
import { Terminal } from './terminal.js';

/* ------------------------------------------------------------------
   Keyboard: shortcuts for the whole page
------------------------------------------------------------------ */
export function keys() {
  const panel = $('#keys');
  const order = ['home', 'about', 'work', 'case', 'services', 'career', 'skills', 'github', 'contact'];
  let back = null;
  const show = on => {
    const open = typeof on === 'boolean' ? on : panel.hidden;
    if (open) back = document.activeElement;
    panel.hidden = !open;
    if (open) $('#keysClose').focus(); else if (back && back.focus) back.focus();
  };
  ui.showKeys = show;
  $('#keysBtn').addEventListener('click', () => show(true));
  $('#keysClose').addEventListener('click', () => show(false));
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#keys, #keysBtn, .term')) show(false); });

  const here = () => { let k = 0; order.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= innerHeight * 0.4) k = i; }); return k; };
  const jump = i => { const el = document.getElementById(order[clamp(i, 0, order.length - 1)]); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };

  addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyK') { e.preventDefault(); Terminal.toggle(); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === 'KeyT') { e.preventDefault(); $('#themeBtn').click(); }
      else if (e.code === 'KeyR') { e.preventDefault(); Resume.download(); }
      else if (e.code === 'KeyP') { e.preventDefault(); $('#bugBtn').click(); }
      return;
    }
    if (e.key === 'Escape' && !panel.hidden) { show(false); return; }
    if (typing || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); jump(here() + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); jump(here() - 1); }
    else if (!Spell.busy() && /^[1-9]$/.test(e.key)) { e.preventDefault(); jump(Number(e.key) - 1); }
    else if (!Spell.busy() && e.key === '?') { e.preventDefault(); show(); }
  });

  /* up and down walk the project list; Enter opens the focused one */
  const btns = $$('.row__btn');
  btns.forEach((b, i) => b.addEventListener('keydown', e => {
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : -1;
    if (to < 0 || to >= btns.length || to === i) return;
    e.preventDefault();
    btns[to].focus();
  }));
}
