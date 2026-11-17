import { $ } from './env.js';

/* ==========================================================================
   Toasts: the small message at the bottom of the screen.
   toast(text)   a plain one-line message
   cheer({...})  a "congrats" card: title, a line of encouragement, XP and
                 a progress row (used when a bug is squashed)
   ========================================================================== */
export const toastEl = $('#toast');
export let toastTimer = 0;

function show(ms) {
  toastEl.classList.remove('is-on');
  void toastEl.offsetWidth;                         /* restart the pop-in animation */
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
}

export function toast(text, ms = 3200) {
  if (!toastEl) return;
  toastEl.classList.remove('toast--cheer', 'toast--big');
  toastEl.textContent = text;
  show(ms);
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/**
 * cheer({ title, text, xp, extra, done, total, big })
 *   title  "Squashed!"            text   "5 more are hiding. Keep hunting."
 *   xp     40 (shows "+40 XP")    extra  "Level up: Junior" (optional)
 *   done / total  draws a row of dots, the fixed ones lit
 *   big    true for the finale
 */
export function cheer({ title, text, xp, extra, done, total, big = false, ms = 4200 }) {
  if (!toastEl) return;
  toastEl.textContent = '';
  toastEl.classList.add('toast--cheer');
  toastEl.classList.toggle('toast--big', big);

  const badge = el('span', 'cheer__badge');
  badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#bug" /></svg>';
  const body = el('div', 'cheer__body');
  const head = el('p', 'cheer__title', title);
  if (xp) head.append(el('b', 'cheer__xp', `+${xp} XP`));
  body.append(head, el('p', 'cheer__text', text));
  if (extra) body.append(el('p', 'cheer__extra', extra));
  if (total) {
    const row = el('span', 'cheer__dots');
    row.setAttribute('aria-label', `${done} of ${total} bugs squashed`);
    for (let i = 0; i < total; i++) row.append(el('i', i < done ? `is-on${i === done - 1 ? ' is-new' : ''}` : ''));
    body.append(row);
  }
  toastEl.append(badge, body);
  show(ms);
}
