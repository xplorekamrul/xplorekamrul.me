import { content } from '../core/content.js';
import { $, $$ } from '../core/env.js';

/* ------------------------------------------------------------------
   Figures that work themselves out: years of experience, number of
   projects, the "Now" block's clock and dates.
------------------------------------------------------------------ */
export function dynamic() {
  const now = new Date();
  const since = $('[data-since]');
  if (since) {
    const [y, m] = since.dataset.since.split('-').map(Number);
    const years = Math.max(1, Math.floor(((now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)) / 12));
    since.dataset.count = String(years);
    since.textContent = String(years);
  }
  const count = $('[data-rows]');
  if (count) { const n = $$('.row').length; count.dataset.count = String(n); count.textContent = String(n); }

  const stamp = $('#nowStamp');
  if (stamp) {
    const [y, m] = stamp.getAttribute('datetime').split('-').map(Number);
    try { stamp.textContent = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1)); } catch (e) { }
  }
  const clock = $('#nowTime');
  if (clock) {
    try {
      const f = new Intl.DateTimeFormat('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: content.profile.timeZone });
      const tick = () => { clock.textContent = `${f.format(new Date()).replace(',', '')} in ${content.profile.city}`; };
      tick(); setInterval(tick, 20000);
    } catch (e) { }
  }
}
