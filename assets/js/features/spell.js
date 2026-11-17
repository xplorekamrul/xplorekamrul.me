import { $, finePointer } from '../core/env.js';
import { Field } from './field.js';
import { Game } from './game.js';
import { Terminal } from './terminal.js';

/* ------------------------------------------------------------------
   Write with particles: whatever the visitor types, the cloud spells.
   A few words are secrets and call up a shape instead.
------------------------------------------------------------------ */
export const Spell = (() => {
  const SECRETS = { DHAKA: 1, STACK: 2, GRAPH: 3, CUBE: 4, DNA: 5, CODE: 6, GIT: 7, HELLO: 8 };
  let buf = '', applyT = 0, holdT = 0, chip, chipText, input;

  function reset() {
    buf = '';
    clearTimeout(applyT); clearTimeout(holdT);
    if (chip) chip.hidden = true;
    if (input) input.value = '';
    Field.clear('spell');
  }
  function commit() {
    const text = buf.trim();
    if (!text) { Field.clear('spell'); return; }
    if (text === 'BOOM') { Field.clear('spell'); Field.boom(); Game.award('secret', 'Secret found: boom'); }
    else if (SECRETS[text]) { Field.shape(SECRETS[text]); Game.award('secret', `Secret found: ${text.toLowerCase()}`); }
    else { Field.spell(text); if (text.length > 1) Game.award('spell'); }
    clearTimeout(holdT);
    holdT = setTimeout(reset, 8000);
  }
  function set(text, fromInput) {
    if (!Field.ready) return false;
    buf = String(text).toUpperCase().replace(/[^A-Z0-9 .!?&'+#@/<>-]/g, '').slice(0, 14);
    if (input && !fromInput) input.value = buf;
    if (chip) { chip.hidden = !buf || !finePointer; chipText.textContent = buf; }
    clearTimeout(applyT);
    if (!buf) { reset(); return true; }
    applyT = setTimeout(commit, 340);
    return true;
  }
  function init() {
    chip = $('#typed'); chipText = $('#typedText'); input = $('#spellIn');
    const form = $('#spell');
    if (!Field.ready) return;
    if (form) {
      input.addEventListener('input', () => set(input.value, true));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); set(input.value, true); input.blur(); } });
      $('#spellGo').addEventListener('click', () => set(input.value, true));
    }
    /* desktop: just start typing, anywhere on the page */
    addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || Terminal.isOpen()) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'Escape') { if (buf) reset(); return; }
      if (e.key === 'Backspace') { if (buf) { e.preventDefault(); set(buf.slice(0, -1)); } return; }
      if (e.key.length !== 1 || e.key === '`') return;
      if (!buf && /^[1-9?]$/.test(e.key)) return;            /* those are shortcuts */
      if (e.key === ' ') {
        if (!buf || e.target.closest('button, a')) return;   /* space still scrolls and still presses buttons */
        e.preventDefault();
      }
      set(buf + e.key);
    });
  }
  return { init, set, reset, busy: () => !!buf };
})();
