/* ==========================================================================
   Puts the content on the page.
   - <main id="main"> gets every section (render/sections.js, in PAGE order)
   - every element with data-render="name" gets chrome.name(content)
   - the <title>, description and brand label follow content.meta / profile
   ========================================================================== */
import { PAGE } from './sections.js';
import * as chrome from './chrome.js';

export function renderPage(content) {
  const main = document.getElementById('main');
  main.innerHTML = PAGE.map(section => section(content)).join('\n');

  document.querySelectorAll('[data-render]').forEach(el => {
    const render = chrome[el.dataset.render];
    if (!render) throw new Error(`No renderer called "${el.dataset.render}" in render/chrome.js`);
    el.innerHTML = render(content);
  });

  const { meta, profile } = content;
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  document.getElementById('brand')?.setAttribute('aria-label', `${profile.name}, back to the top`);
}
