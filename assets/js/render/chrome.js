/* ==========================================================================
   The parts around the sections: brand, navigation, keyboard shortcuts,
   loader label and footer. index.html has an empty element for each,
   marked with data-render="name"; render/index.js fills them in.
   ========================================================================== */
import { list, keys, bug } from './helpers.js';

export const brand = ({ profile }) =>
  `<span class="brand__full">${profile.name}</span><span class="brand__short">${profile.initials}</span>`;

export const navHeader = ({ nav }) => list(nav.header, l => `<a href="#${l.id}">${l.label}</a>`);
export const navMenu = ({ nav }) => list(nav.menu, l => `<a href="#${l.id}">${l.label}</a>`);
export const navDots = ({ nav }) => list(nav.dots, l => `<a href="#${l.id}" aria-label="${l.label}"></a>`);

export const loaderWho = ({ profile, loader }) => `<b>${profile.name}</b>${loader.label}`;

export const shortcutsTitle = ({ shortcuts }) => shortcuts.title;
export const shortcutsList = ({ shortcuts }) =>
  list(shortcuts.items, s => `<div><dt>${s.label}</dt><dd>${keys(s.keys)}</dd></div>`);

export const footer = ({ profile, footer: f }) => `
<span>© <span id="year">${new Date().getFullYear()}</span> ${profile.name}</span>
<button type="button" id="keysBtn">${f.shortcutsButton}</button>
<a href="#home">${f.backToTop}</a>
${bug(7)}`;
