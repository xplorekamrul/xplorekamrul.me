import { $, $$, finePointer, reduce } from '../core/env.js';
import { Field } from './field.js';
import { Hover, hueOf } from './hover.js';

/* ------------------------------------------------------------------
   Skills: each one is counted against the project stacks. A skill
   that a project names becomes a button: it shows the count, and a
   click filters the work list. Hovering writes the name in particles.
------------------------------------------------------------------ */
export function skills() {
  const rows = $$('.row'), list = $('#workList'), bar = $('#workFilter'), barText = $('#filterText'), note = $('#skillNote');
  const items = $$('.kit__row li');
  if (!items.length || !list || !bar || !note) return;
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
  const same = (a, b) => { a = norm(a); b = norm(b); return !!a && !!b && (a === b || (b.length >= 4 && a.startsWith(b)) || (a.length >= 4 && b.startsWith(a))); };
  const idle = finePointer ? 'Hover a skill to see where it is used. Click one with a number to filter the work list.' : 'Tap a skill with a number to see the projects that use it.';
  note.textContent = idle;

  const clear = () => {
    list.classList.remove('is-filtered');
    rows.forEach(r => r.classList.remove('is-dim'));
    $$('.chips li.is-hit').forEach(c => c.classList.remove('is-hit'));
    bar.hidden = true;
  };
  $('#filterClear').addEventListener('click', clear);

  function filter(name, hits) {
    clear();
    list.classList.add('is-filtered');
    rows.forEach((r, i) => {
      r.classList.toggle('is-dim', !hits.includes(i));
      if (hits.includes(i)) $$('.chips li', r).forEach(c => c.classList.toggle('is-hit', same(name, c.textContent)));
    });
    barText.textContent = `${hits.length} of ${rows.length} projects list ${name}. The others are dimmed.`;
    bar.hidden = false;
    $('#work').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    $('#filterClear').focus({ preventScroll: true });
  }

  const col = $('.skills .col');
  items.forEach(li => {
    const name = li.textContent.trim();
    li.dataset.name = name;
    const hits = rows.map((r, i) => ($$('.chips li', r).some(c => same(name, c.textContent)) ? i : -1)).filter(i => i >= 0);
    const say = hits.length
      ? `${name}: listed in ${hits.length} of the ${rows.length} projects here. Click to see ${hits.length === 1 ? 'it' : 'them'}.`
      : `${name}: part of the everyday toolkit.`;
    let target = li;
    if (hits.length) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'skill';
      b.setAttribute('aria-label', `${name}, listed in ${hits.length} project${hits.length === 1 ? '' : 's'}. Filter the work list.`);
      const n = document.createElement('sup'); n.textContent = String(hits.length); n.setAttribute('aria-hidden', 'true');
      b.append(name, n);
      b.addEventListener('click', () => filter(name, hits));
      li.textContent = '';
      li.append(b);
      target = b;
      b.addEventListener('focus', () => { note.textContent = say; });
      b.addEventListener('blur', () => { note.textContent = idle; });
    }
    li.addEventListener('pointerenter', () => {
      note.textContent = say;
      const right = col.getBoundingClientRect().right, free = innerWidth - right;
      if (!Hover.ok() || free < 320) return;
      const H = innerHeight;
      Hover.show(() => { if (li.matches(':hover')) Field.word(name.toUpperCase(), { cx: right + free / 2, cy: H / 2, w: free * 0.78, h: H * 0.26 }, hueOf(name)); });
    });
    li.addEventListener('pointerleave', () => { note.textContent = idle; Hover.hide(); });
    void target;
  });
}
