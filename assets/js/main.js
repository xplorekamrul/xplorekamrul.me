/* ==========================================================================
   main.js: the one entry point of the site.

   1. load   assets/data/content.json        (core/content.js)
   2. render the page from it                (render/index.js)
   3. start  the features, in order          (features/*)
   4. later  load the 3D particles when idle (features/lazy-3d.js)

   To change what the site says, edit content.json. To change how a part
   looks, edit its CSS file in assets/css. To change how a part behaves,
   edit its file in assets/js/features.
   ========================================================================== */
import { root, hasST } from './core/env.js';
import { loadContent } from './core/content.js';
import { renderPage } from './render/index.js';

import { Theme } from './features/theme.js';
import { Game } from './features/game.js';
import { Terminal } from './features/terminal.js';
import { Spell } from './features/spell.js';
import { Resume } from './features/resume.js';
import { dynamic } from './features/dynamic.js';
import { keys } from './features/keys.js';
import { titles } from './features/titles.js';
import { nav } from './features/nav.js';
import { work } from './features/work.js';
import { career } from './features/career.js';
import { school } from './features/school.js';
import { skills } from './features/skills.js';
import { caseStudy } from './features/case-study.js';
import { github } from './features/github.js';
import { cursor } from './features/cursor.js';
import { contact } from './features/contact.js';
import { motion } from './features/motion.js';
import { loader } from './features/loader.js';
import { lazy3D } from './features/lazy-3d.js';

/* The order matters: dynamic() fills in numbers before motion() animates them,
   and loader() goes last because it reveals the page. */
const FEATURES = [Theme.init, Game.init, dynamic, Terminal.init, Spell.init, Resume.init, keys, titles, nav, work, career, school, skills, caseStudy, github, cursor, contact, motion, loader];

function showError(err) {
  console.error(err);
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `<p class="boot-error">The content could not be loaded (${err.message}).<br>
      If you opened index.html straight from your disk, run it through a local server instead,
      for example VS Code "Live Server" or <code>npx serve</code>.</p>`;
  }
  root.classList.add('is-ready', 'no-3d');
}

async function start() {
  try {
    renderPage(await loadContent());
  } catch (err) {
    showError(err);
    return;
  }
  FEATURES.forEach(init => {
    try { init(); } catch (err) { console.error(err); root.classList.add('is-ready'); }
  });
  lazy3D();
  if (hasST) {
    const refresh = () => window.ScrollTrigger.refresh();
    if (document.readyState === 'complete') refresh(); else addEventListener('load', refresh);
  }
}

start();
