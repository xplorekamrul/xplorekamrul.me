import { $, $$, finePointer } from '../core/env.js';

/* Case study: pick a part of the system to read what it does */
export function caseStudy() {
  const items = $$('.arch__item'), note = $('#archNote');
  if (!items.length || !note) return;
  const pick = item => {
    items.forEach(i => { const on = i === item; i.classList.toggle('is-on', on); $('button', i).setAttribute('aria-pressed', String(on)); });
    note.textContent = $('dd', item).textContent;
  };
  items.forEach(item => {
    const b = $('button', item);
    b.addEventListener('click', () => pick(item));
    if (finePointer) b.addEventListener('pointerenter', () => pick(item));
  });
  pick(items[0]);
}
