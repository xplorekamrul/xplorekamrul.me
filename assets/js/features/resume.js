import { content } from '../core/content.js';
import { $ } from '../core/env.js';
import { toast } from '../core/toast.js';

/* ------------------------------------------------------------------
   Resume: the PDF is not downloaded with the page. It is fetched in
   the background only when the visitor gets near the button (or hovers
   it), so that the click itself saves the file instantly.
------------------------------------------------------------------ */
export const Resume = (() => {
  /* from content.json: resume.file (path) and resume.saveAs (name of the saved file) */
  const FILE_PATH = () => content.resume.file, SAVE_AS_NAME = () => content.resume.saveAs;
  let link, note, state = 'idle', pending = null, size = 0;

  function warm() {
    if (pending) return pending;
    state = 'loading';
    pending = fetch(encodeURI(FILE_PATH()))
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then(b => {
        if (b.type && !/pdf|octet-stream/i.test(b.type)) throw new Error('not a pdf');
        if (link) link.href = URL.createObjectURL(b);          /* from now on the click saves from memory */
        size = b.size;
        state = 'ready';
        if (note) note.textContent = `PDF, ${(b.size / 1048576).toFixed(1)} MB`;
      })
      /* a server answer (404, wrong type) means the file is missing; a failed fetch usually means
         the page was opened from disk, where a plain link still works */
      .catch(e => { state = /^\d+$|not a pdf/.test(e && e.message) ? 'missing' : 'offline'; pending = null; });
    return pending;
  }
  const missing = () => toast(`Resume file not found: ${FILE_PATH()}`, 5200);
  function direct() {
    const a = document.createElement('a');
    a.href = encodeURI(FILE_PATH()); a.download = SAVE_AS_NAME(); a.target = '_blank'; a.rel = 'noopener';
    document.body.append(a); a.click(); a.remove();
  }
  /* resolves to 'ready' (saved), 'opened' (handed to the browser) or 'missing' */
  function download() {
    if (!link) { direct(); return Promise.resolve('opened'); }
    if (state === 'ready') { link.click(); return Promise.resolve('ready'); }
    return warm().then(() => {
      if (state === 'ready') { link.click(); return 'ready'; }
      if (state === 'offline') { direct(); return 'opened'; }
      missing(); return 'missing';
    });
  }
  function open() {
    window.open(state === 'ready' && link ? link.href : encodeURI(FILE_PATH()), '_blank', 'noopener');
  }
  const info = () => ({ file: FILE_PATH().split('/').pop(), saveAs: SAVE_AS_NAME(), size, state });
  function init() {
    link = $('#resumeBtn'); note = $('#resumeNote');
    if (!link) return;
    link.addEventListener('click', e => {
      if (state === 'ready') return;                 /* already in memory: the browser saves it right away */
      e.preventDefault();
      download();
    });
    ['pointerenter', 'focus', 'touchstart'].forEach(ev => link.addEventListener(ev, () => { warm(); }, { passive: true }));
    const near = $('#contact');
    if (near && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { warm(); io.disconnect(); } }, { rootMargin: '120% 0px' });
      io.observe(near);
    }
  }
  return { init, download, open, warm, info };
})();
