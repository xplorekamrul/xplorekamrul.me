import { $, reduce } from '../core/env.js';

/* ------------------------------------------------------------------
   Code: numbers, languages and recent repositories, read live from
   the public GitHub API when the section comes near. Kept for an hour
   in this tab so it is not asked again on every visit to the section.
------------------------------------------------------------------ */
export function github() {
  const box = $('#gh'), state = $('#ghState');
  if (!box || !state) return;
  const user = box.dataset.user, KEY = `mk3-gh-${user}`, HOUR = 3600e3;
  const ago = iso => {
    const d = (Date.now() - new Date(iso)) / 864e5;
    return d < 1 ? 'today' : d < 2 ? 'yesterday' : d < 30 ? `${Math.floor(d)} days ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
  };
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };

  function render(d) {
    const repos = d.repos;
    const stats = $('#ghStats');
    stats.textContent = '';
    [[d.user.repos, 'public repositories'], [d.user.followers, 'followers'], [new Date(d.user.since).getFullYear(), 'on GitHub since'], [repos.length ? ago(repos[0].pushed) : 'none yet', 'last push']]
      .forEach(([v, label]) => { const li = el('li'); li.append(el('b', String(v)), el('span', label)); stats.append(li); });
    stats.hidden = false;

    const tally = {};
    repos.forEach(r => { if (r.lang) tally[r.lang] = (tally[r.lang] || 0) + 1; });
    const langs = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = Object.values(tally).reduce((s, v) => s + v, 0);
    const list = $('#ghLangs');
    list.textContent = '';
    langs.forEach(([name, n]) => {
      const row = el('div'), bar = el('i');
      bar.style.setProperty('--v', (n / total).toFixed(3));
      row.append(el('span', name), bar, el('small', `${Math.round((n / total) * 100)}%`));
      list.append(row);
    });
    $('#ghLangWrap').hidden = !langs.length;

    const out = $('#ghRepos');
    out.textContent = '';
    repos.slice(0, 6).forEach(r => {
      const li = el('li'), a = el('a', r.name, 'ext');
      a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
      const meta = [r.lang, r.stars ? `${r.stars} star${r.stars === 1 ? '' : 's'}` : '', `pushed ${ago(r.pushed)}`].filter(Boolean).join(', ');
      li.append(a, el('small', meta));
      if (r.desc) li.append(el('p', r.desc));
      out.append(li);
    });
    $('#ghRepoWrap').hidden = !repos.length;
    state.textContent = Date.now() - d.at < 60000 ? 'Live from GitHub, read just now.' : 'Live from GitHub, read a few minutes ago.';
  }


  /* ---- the contribution calendar, the green squares from the profile ----
     The last year comes from a public mirror of the profile graph. If that is down, the last
     90 days of public events from GitHub's own API fill in, and failing both it stays hidden. */
  const CAL_KEY = `${KEY}-cal`;
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const DAY = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const MON = new Intl.DateTimeFormat('en', { month: 'short' });

  function renderCal(c) {
    const wrap = $('#ghCalWrap'), grid = $('#ghCal'), scroller = $('#ghCalScroll');
    if (!wrap || !grid || !c || !c.days || !c.days.length) return;
    const map = new Map(c.days.map(d => [d[0], d]));
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(start.getDate() - 364 - end.getDay());     /* back to a Sunday: 53 weeks */
    grid.textContent = '';
    const frag = document.createDocumentFragment();
    [['Mon', 3], ['Wed', 5], ['Fri', 7]].forEach(([name, row]) => {
      const s = el('span', name, 'cal__day'); s.style.gridRow = row; frag.append(s);
    });
    let i = 0, total = 0, run = 0, best = 0, top = null, lastMonthCol = -9;
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1), i++) {
      const col = Math.floor(i / 7), key = ymd(d), rec = map.get(key);
      const n = rec ? rec[1] : 0, lvl = rec ? rec[2] : 0;
      if (d.getDay() === 0 && d.getDate() <= 7 && col - lastMonthCol > 2 && col < 52) {
        const m = el('span', MON.format(d), 'cal__month'); m.style.gridColumn = `${col + 2} / span 3`; frag.append(m);
        lastMonthCol = col;
      }
      const cell = el('i');
      cell.dataset.l = lvl; cell.dataset.n = n; cell.dataset.d = DAY.format(d);
      cell.style.gridColumn = col + 2; cell.style.gridRow = d.getDay() + 2;
      cell.style.setProperty('--w', col);
      frag.append(cell);
      total += n;
      run = n ? run + 1 : 0; best = Math.max(best, run);
      if (n && (!top || n > top[1])) top = [d.getTime(), n];
    }
    grid.append(frag);
    const weeks = Math.ceil(i / 7);
    grid.style.setProperty('--weeks', weeks);
    const sum = c.src === 'year' && typeof c.total === 'number' ? c.total : total;
    $('#ghCalHead').textContent = c.src === 'year'
      ? `${sum.toLocaleString('en')} contribution${sum === 1 ? '' : 's'} in the last year`
      : `${sum.toLocaleString('en')} public event${sum === 1 ? '' : 's'} in the last 90 days`;
    const notes = [];
    if (best > 1) notes.push(`Longest streak ${best} days`);
    if (run > 1) notes.push(`current streak ${run} days`);
    if (top) notes.push(`busiest day ${MON.format(new Date(top[0]))} ${new Date(top[0]).getDate()} with ${top[1]}`);
    $('#ghCalNote').textContent = notes.length ? `${notes.join(', ')}.`.replace(/^./, s => s.toUpperCase()) : 'A quiet stretch. Check back soon.';
    grid.setAttribute('aria-label', `${$('#ghCalHead').textContent}. ${$('#ghCalNote').textContent}`);
    wrap.hidden = false;
    requestAnimationFrame(() => { if (scroller) scroller.scrollLeft = scroller.scrollWidth; });

    /* the squares fill in week by week once they are on screen */
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { io.disconnect(); grid.classList.add('is-in'); } }, { threshold: 0.35 });
      io.observe(grid);
    } else grid.classList.add('is-in');

    /* one shared tip that follows the pointer from square to square */
    const tip = $('#ghCalTip');
    grid.onpointerover = e => {
      const c2 = e.target.closest('i');
      if (!c2 || !tip) return;
      const n = +c2.dataset.n;
      tip.textContent = `${n ? n : 'No'} contribution${n === 1 ? '' : 's'} on ${c2.dataset.d}`;
      tip.hidden = false;
      const r = c2.getBoundingClientRect(), box = wrap.getBoundingClientRect(), half = tip.offsetWidth / 2;
      tip.style.left = `${Math.max(half, Math.min(box.width - half, r.left - box.left + r.width / 2))}px`;
      tip.style.top = `${r.top - box.top}px`;
    };
    grid.onpointerleave = () => { if (tip) tip.hidden = true; };
  }

  function fromEvents() {
    const pages = [1, 2, 3].map(p => fetch(`https://api.github.com/users/${user}/events/public?per_page=100&page=${p}`, { headers: { Accept: 'application/vnd.github+json' } })
      .then(r => (r.ok ? r.json() : [])).catch(() => []));
    return Promise.all(pages).then(lists => {
      const tally = {};
      lists.flat().forEach(e => {
        if (!e || !e.created_at) return;
        const key = ymd(new Date(e.created_at));
        tally[key] = (tally[key] || 0) + (e.type === 'PushEvent' && e.payload && e.payload.size ? e.payload.size : 1);
      });
      const max = Math.max(0, ...Object.values(tally));
      if (!max) throw new Error('no events');
      const days = Object.entries(tally).sort().map(([d, n]) => [d, n, Math.min(4, Math.ceil((n / max) * 4))]);
      return { src: 'events', days };
    });
  }

  function loadCal() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CAL_KEY) || 'null');
      if (saved && Date.now() - saved.at < HOUR) { renderCal(saved); return; }
    } catch (e) { }
    fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(j => {
        if (!j || !Array.isArray(j.contributions)) throw new Error('shape');
        return { src: 'year', total: j.total && j.total.lastYear, days: j.contributions.map(c => [c.date, c.count, c.level]) };
      })
      .catch(fromEvents)
      .then(c => {
        c.at = Date.now();
        try { sessionStorage.setItem(CAL_KEY, JSON.stringify(c)); } catch (e) { }
        renderCal(c);
      })
      .catch(() => { });
  }

  function load() {
    loadCal();
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (saved && Date.now() - saved.at < HOUR) { render(saved); return; }
    } catch (e) { }
    state.textContent = 'Reading from GitHub.';
    const get = path => fetch(`https://api.github.com/users/${user}${path}`, { headers: { Accept: 'application/vnd.github+json' } })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    Promise.all([get(''), get('/repos?per_page=100&sort=pushed')])
      .then(([u, list]) => {
        const d = {
          at: Date.now(),
          user: { repos: u.public_repos, followers: u.followers, since: u.created_at },
          repos: list.filter(r => !r.fork).map(r => ({ name: r.name, url: r.html_url, desc: r.description, lang: r.language, stars: r.stargazers_count, pushed: r.pushed_at }))
        };
        try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { }
        render(d);
      })
      .catch(() => { state.textContent = 'GitHub could not be reached just now. Everything is on the profile:'; });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '100% 0px' });
    io.observe(box);
  } else load();
}
