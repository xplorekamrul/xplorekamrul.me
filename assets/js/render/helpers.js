/* ==========================================================================
   Small helpers shared by the renderers.
   Text from content.json is trusted (it is your own file), so simple inline
   HTML such as <b> or <wbr> inside a text field is allowed and kept.
   ========================================================================== */

/** Render every item of a list and join the result: list(items, item => `<li>${item}</li>`) */
export const list = (items = [], render) => items.map(render).join('');

/** Escape a value for use inside an HTML attribute. */
export const attr = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A link that opens in a new tab. */
export const extLink = (href, text, cls = 'ext') =>
  `<a class="${cls}" href="${attr(href)}" target="_blank" rel="noopener">${text}</a>`;

/** A URL without its protocol, "www." and trailing slash: https://www.ighotok.com/ -> ighotok.com */
export const shortUrl = url => String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

/** One of the seven bugs of the bug-hunt game. */
export const bug = (n, { cls = '', style = '' } = {}) =>
  `<button class="bug${cls ? ` ${cls}` : ''}" type="button" data-bug="${n}" aria-label="Squash bug ${n} of 7"${style ? ` style="${style}"` : ''}><svg aria-hidden="true"><use href="#bug" /></svg></button>`;

/** Keys written as [Ctrl][K] become <kbd>Ctrl</kbd><kbd>K</kbd>. */
export const keys = text => String(text).replace(/\[([^\]]+)\]/g, '<kbd>$1</kbd>');

/** Find a project by its id; returns { project, n } where n is its 1-based place in the work list. */
export const projectRef = (content, id) => {
  const i = content.work.projects.findIndex(p => p.id === id);
  if (i < 0) throw new Error(`content.json: no project with id "${id}"`);
  return { project: content.work.projects[i], n: i + 1 };
};

/** A button that opens a project in the work list. */
export const openButton = (content, id, label) => {
  const { project, n } = projectRef(content, id);
  return `<button class="linkbtn" type="button" data-open="${n}">${label || project.name}</button>`;
};

/** "a, b and c" */
export const sentence = parts => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`);
