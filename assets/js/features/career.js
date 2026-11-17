import { $, $$, reduce } from '../core/env.js';
import { Field } from './field.js';
import { Hover } from './hover.js';

/* ------------------------------------------------------------------
   Career: every job has details (place, type, time, stack, what was
   built). Click a job to open them. With a mouse on a wide screen,
   hovering also turns the particles into a globe pinned on the
   company's city and shows the details on a card that leans in 3D.
------------------------------------------------------------------ */
export function career() {
  const jobs = $$('.job');
  if (!jobs.length) return;

  /* how long each job lasted, from its data-from / data-to months */
  jobs.forEach(job => {
    const el = $('[data-from]', job);
    if (!el) return;
    const [y1, m1] = el.dataset.from.split('-').map(Number);
    const now = new Date();
    const [y2, m2] = el.dataset.to ? el.dataset.to.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
    const months = Math.max(1, (y2 - y1) * 12 + (m2 - m1) + 1);
    const yr = Math.floor(months / 12), mo = months % 12;
    const text = [yr ? `${yr} yr` : '', mo ? `${mo} mo` : ''].filter(Boolean).join(' ');
    el.textContent = el.dataset.to ? text : `${text} so far`;
  });

  /* click (or the button) opens the details in place */
  jobs.forEach(job => {
    const btn = $('.job__toggle', job);
    if (!btn) return;
    const set = on => {
      job.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
      btn.textContent = on ? 'Hide details' : 'Show details';
    };
    btn.addEventListener('click', () => set(!job.classList.contains('is-open')));
    job.addEventListener('click', e => { if (!e.target.closest('a, button')) set(!job.classList.contains('is-open')); });
  });

  /* project names inside the details open that project in the work list */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    const row = b && $$('.row')[Number(b.dataset.open) - 1];
    if (!row) return;
    if (!row.classList.contains('is-open')) $('.row__btn', row).click();
    row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    $('.row__btn', row).focus({ preventScroll: true });
  });

  /* the hover view */
  const card = $('#jobCard'), inner = $('#jobCardIn'), col = $('.career .col');
  if (!card || !col) return;
  let current = null;
  const hide = () => { if (!current) return; current = null; card.classList.remove('is-on'); Hover.hide(); };
  jobs.forEach(job => {
    job.addEventListener('pointerenter', () => {
      const free = col.getBoundingClientRect().left;        /* empty space to the left of the column */
      if (!Hover.ok() || free < 380 || !job.dataset.pins) return;
      current = job;
      const H = innerHeight;

      /* the card: company, role, and a copy of the job's details */
      const more = $('.job__more', job).cloneNode(true);
      more.removeAttribute('id'); more.className = '';
      $$('button, a', more).forEach(el => el.replaceWith(document.createTextNode(el.textContent)));
      const h = document.createElement('h3'); h.textContent = $('.job__co', job).textContent;
      const when = $('.job__when', job).textContent.trim();
      const p = document.createElement('p'); p.textContent = `${$('.job__role', job).textContent}, ${when === 'Now' ? 'now' : when}`;
      inner.textContent = '';

      
      inner.append(h, p, more);
      const width = Math.min(352, free - 56);
      card.style.width = `${width}px`;
      card.style.left = `${(free - width) / 2}px`;
      card.style.top = `${Math.round(H * 0.58)}px`;
      inner.style.maxHeight = `${Math.round(H * 0.42 - 18)}px`;
      card.classList.add('is-on');

      /* the particles: a globe with a pin on the city, and the city's name */
      const pins = job.dataset.pins.split(';').map(s => s.split(',').map(Number));
      const box = { cx: free / 2, cy: (84 + H * 0.56) / 2, w: free * 0.84, h: H * 0.56 - 84 };
      Hover.show(() => { if (current === job) Field.place(pins, job.dataset.label, box, Number(job.dataset.hue)); });
    });
    job.addEventListener('pointermove', e => {
      if (current !== job) return;
      inner.style.setProperty('--ry', `${(((e.clientX / innerWidth) - 0.5) * 16).toFixed(2)}deg`);
      inner.style.setProperty('--rx', `${((0.5 - e.clientY / innerHeight) * 12).toFixed(2)}deg`);
    });
    job.addEventListener('pointerleave', hide);
  });
  addEventListener('scroll', () => { if (current && !current.matches(':hover')) hide(); }, { passive: true });
}
