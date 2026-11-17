/* ==========================================================================
   Content: everything the site says lives in assets/data/content.json.
   loadContent() fetches it once; afterwards any module can read it through
   the `content` object exported here.
   ========================================================================== */

export const CONTENT_URL = 'assets/data/content.json';

/** Filled by loadContent(). Read it after main.js has started the app. */
export const content = {};

export async function loadContent(url = CONTENT_URL) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  Object.assign(content, await res.json());
  return content;
}
