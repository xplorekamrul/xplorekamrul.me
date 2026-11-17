import { finePointer, reduce } from '../core/env.js';
import { Field } from './field.js';

/* ------------------------------------------------------------------
   Hover shapes: sections borrow the particle cloud while the cursor is
   on one of their items. Only on wide screens with a mouse.
------------------------------------------------------------------ */
export const Hover = (() => {
  let timer = 0;
  const ok = () => finePointer && !reduce && Field.ready && innerWidth / innerHeight >= 1.05;
  return {
    ok,
    show(fn) { clearTimeout(timer); timer = setTimeout(fn, 110); },   /* a short wait, so passing over items does not thrash the cloud */
    hide() { clearTimeout(timer); Field.clear('hover'); }
  };
})();
export const hueOf = text => { let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
