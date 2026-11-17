import { $ } from './env.js';

/* Toast */
export const toastEl = $('#toast');
export let toastTimer = 0;
export function toast(text, ms = 3200) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
}
