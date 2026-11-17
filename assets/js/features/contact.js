import { content } from '../core/content.js';
import { $, finePointer } from '../core/env.js';

/* ------------------------------------------------------------------
   Contact + clock
------------------------------------------------------------------ */
export function contact() {
  const EMAIL = content.profile.email;
  const copy = $('#copyMail');
  if (copy) {
    const text = copy.textContent;
    const reset = () => setTimeout(() => { copy.textContent = text; }, 2400);
    copy.addEventListener('click', () => {
      const ok = () => { copy.textContent = 'Copied'; reset(); };
      const fail = () => {
        const r = document.createRange(); r.selectNodeContents($('#mail'));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        copy.textContent = 'Selected, press Ctrl+C'; reset();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(ok, fail); else fail();
    });
  }
  const clock = $('#clock');
  try {
    const f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: content.profile.timeZone });
    const t = () => { clock.textContent = `${f.format(new Date())} local time`; };
    t(); setInterval(t, 20000);
  } catch (e) { }
  const hint = $('#heroHint');
  if (hint && !finePointer) hint.textContent = content.hero.hintTouch;
}
