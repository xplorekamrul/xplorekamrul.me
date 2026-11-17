import { $, $$, finePointer } from '../core/env.js';
import { toast, cheer } from '../core/toast.js';
import { burst, fireworks } from '../core/celebrate.js';
import { Field } from './field.js';

/* ------------------------------------------------------------------
   The game: XP and levels across the whole site.
   Bugs to squash, a word to write, a terminal and secrets all pay
   into one score. Everything is saved in this browser.
------------------------------------------------------------------ */
export const Game = (() => {
  const KEY = 'mk3-game';
  const FIXES = {
    1: 'fix: particle escaped the hero',
    2: 'fix: off-by-one in years of experience',
    3: 'fix: z-index war in the work list',
    4: 'fix: time zone drift in the timeline',
    5: 'fix: CGPA rendered as NaN',
    6: 'fix: missing semicolon in skills',
    7: 'fix: footer was not sticky enough'
  };
  const BUGS = 7, MAX = 1000, BUG_XP = 40;
  const SINGLE = { ship: 120, spell: 100, term: 100, secret: 120, open3: 100, theme: 60, end: 120 };
  const QUESTS = [
    { id: 'bugs', name: 'Bug hunt', hint: 'Squash the 7 bugs crawling around the page.' },
    { id: 'ship', name: 'Ship it', hint: 'Fix all seven and the build goes out.' },
    { id: 'spell', name: 'Write with particles', hint: finePointer ? 'Just start typing your name, anywhere.' : 'Type your name in the box on the first screen.' },
    { id: 'term', name: 'Hello, terminal', hint: 'Open the terminal and run a command.' },
    { id: 'secret', name: 'Secret', hint: 'Type dhaka, stack or boom. Or try sudo in the terminal.' },
    { id: 'open3', name: 'Code review', hint: 'Open three projects.' },
    { id: 'theme', name: 'Night shift', hint: 'Switch the theme.' },
    { id: 'end', name: 'Say hello', hint: 'Scroll until the particles say HELLO.' }
  ];
  const LEVELS = [[0, 'Intern'], [150, 'Junior'], [350, 'Mid-level'], [600, 'Senior'], [850, 'Lead']];
  const done = new Set();
  const resets = [];
  let prismOn = true;
  const el = {};

  const count = prefix => [...done].filter(id => id.startsWith(prefix) && /\d$/.test(id)).length;
  const total = () => count('bug') * BUG_XP + Object.keys(SINGLE).reduce((s, id) => s + (done.has(id) ? SINGLE[id] : 0), 0);
  const levelOf = xp => { let i = 0; LEVELS.forEach((l, k) => { if (xp >= l[0]) i = k; }); return i; };

  function save() { try { localStorage.setItem(KEY, JSON.stringify({ done: [...done], prism: prismOn })); } catch (e) { } }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || '{}');
      (s.done || []).forEach(id => { if (/^bug[1-7]$/.test(id) || SINGLE[id]) done.add(String(id)); });
      if (typeof s.prism === 'boolean') prismOn = s.prism;
    } catch (e) { }
  }

  function paint() {
    const xp = total(), li = levelOf(xp), next = LEVELS[li + 1], bugs = count('bug'), shipped = bugs === BUGS;
    el.lv.textContent = String(li + 1);
    el.name.textContent = LEVELS[li][1];
    el.count.textContent = shipped ? 'Shipped' : `${bugs}/${BUGS}`;
    el.btn.setAttribute('aria-label', `Your progress: level ${li + 1}, ${LEVELS[li][1]}, ${xp} of ${MAX} XP, ${bugs} of ${BUGS} bugs fixed`);
    el.title.textContent = `Level ${li + 1}, ${LEVELS[li][1]}`;
    el.sub.textContent = next ? `${xp} of ${MAX} XP. ${next[0] - xp} XP to ${next[1]}.` : `${xp} of ${MAX} XP. Top level reached.`;
    el.fill.style.width = `${Math.round((xp / MAX) * 100)}%`;
    $$('li', el.quests).forEach(li2 => {
      const id = li2.dataset.id, value = li2.lastChild;
      if (id === 'bugs') { li2.classList.toggle('is-done', shipped); value.textContent = `${bugs}/${BUGS}, ${BUG_XP} XP each`; }
      else { li2.classList.toggle('is-done', done.has(id)); value.textContent = `${SINGLE[id]} XP`; }
    });
    el.bugSub.textContent = shipped ? 'All 7 fixed. Build passing, shipped to production.'
      : bugs ? `${BUGS - bugs} still crawling around. They are small and they move.`
        : '7 bugs are crawling around this site. Find them and squash them.';
    $$('li', el.list).forEach(li2 => {
      const id = Number(li2.dataset.id), fixed = done.has(`bug${id}`);
      li2.classList.toggle('is-fixed', fixed);
      li2.lastChild.textContent = fixed ? FIXES[id] : `bug #${id}`;
    });
    el.reward.hidden = !shipped;
    el.prism.checked = prismOn;
    Field.prism(shipped && prismOn);
  }

  /* Gives the XP once. Shows a plain toast unless quiet; returns { xp, levelUp } or false. */
  function award(id, label, quiet = false) {
    if (!el.btn || done.has(id)) return false;
    const before = levelOf(total());
    done.add(id);
    save();
    paint();
    const xp = /^bug\d/.test(id) ? BUG_XP : SINGLE[id];
    const after = levelOf(total());
    const quest = QUESTS.find(q => q.id === id);
    const levelUp = after > before ? LEVELS[after][1] : null;
    let text = `+${xp} XP  ${label || (quest ? quest.name : id)}`;
    if (levelUp) {
      text += `  |  Level up: ${levelUp}`;
      el.btn.classList.remove('is-up'); void el.btn.offsetWidth; el.btn.classList.add('is-up');
      if (after === LEVELS.length - 1) setTimeout(() => { toast('Lead level. You have seen nearly everything here, so let\'s talk.', 4600); Field.boom(); }, quiet ? 4600 : 1900);
    }
    if (!quiet) toast(text, 3600);
    return { xp, levelUp };
  }

  /* What the congrats card says, by how many bugs are left */
  const CHEERS = ['Squashed!', 'Nice catch!', 'Clean hit!', 'Bug down!', 'Sharp eyes!', 'Debugger mode: on'];
  const nudge = left => (left === 1 ? 'Just one left. It is hiding somewhere, find it!'
    : left <= 3 ? `Only ${left} left. You are close, keep hunting!`
      : `${left} more are crawling around. Keep hunting!`);

  function squash(btn) {
    const n = Number(btn.dataset.bug);
    if (done.has(`bug${n}`)) return;
    btn.classList.add('is-fixed');
    setTimeout(() => btn.classList.add('is-gone'), 700);

    /* a confetti blast right where the bug was */
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 1);

    const got = award(`bug${n}`, FIXES[n], true);
    const fixed = count('bug'), left = BUGS - fixed;
    if (left > 0) {
      cheer({
        title: CHEERS[(fixed - 1) % CHEERS.length], xp: got && got.xp,
        text: nudge(left), extra: got && got.levelUp ? `Level up: you are now ${got.levelUp}` : FIXES[n],
        done: fixed, total: BUGS
      });
      return;
    }
    /* the last one: the build ships, with fireworks */
    cheer({ title: 'All 7 bugs squashed!', xp: got && got.xp, text: 'Every test passing. You are a real debugger.', extra: FIXES[n], done: fixed, total: BUGS });
    setTimeout(() => {
      const shipped = award('ship', 'All tests passing. Shipped to production.', true);
      fireworks();
      Field.boom();
      cheer({
        title: 'Shipped to production!', xp: shipped && shipped.xp, big: true, ms: 6000,
        text: 'All tests passing. Prismatic particles unlocked in your progress panel.',
        extra: shipped && shipped.levelUp ? `Level up: you are now ${shipped.levelUp}` : null,
        done: BUGS, total: BUGS
      });
    }, 1500);
  }

  function init() {
    Object.assign(el, {
      btn: $('#bugBtn'), lv: $('#xpLv'), name: $('#xpName'), count: $('#bugCount'), panel: $('#bugLog'), title: $('#xpTitle'), sub: $('#xpSub'), fill: $('#xpFill'),
      quests: $('#questList'), bugSub: $('#bugSub'), list: $('#bugList'), reward: $('#bugReward'), prism: $('#prismToggle')
    });
    if (!el.btn) return;
    QUESTS.forEach(q => {
      const li = document.createElement('li');
      li.dataset.id = q.id;
      const b = document.createElement('b'); b.textContent = q.name;
      const s = document.createElement('span'); s.textContent = q.hint;
      const e = document.createElement('em');
      li.append(b, s, e);
      el.quests.append(li);
    });
    for (let id = 1; id <= BUGS; id++) {
      const li = document.createElement('li');
      li.dataset.id = String(id);
      li.append(document.createTextNode(''));
      el.list.append(li);
    }
    load();
    $$('.bug').forEach(b => {
      if (done.has(`bug${b.dataset.bug}`)) b.classList.add('is-fixed', 'is-gone');
      b.addEventListener('click', e => { e.stopPropagation(); squash(b); });
    });
    paint();
    const open = on => { el.panel.hidden = !on; el.btn.setAttribute('aria-expanded', String(on)); };
    el.btn.addEventListener('click', () => open(el.panel.hidden));
    $('#bugClose').addEventListener('click', () => { open(false); el.btn.focus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.panel.hidden) { open(false); el.btn.focus(); } });
    document.addEventListener('click', e => { if (!el.panel.hidden && !e.target.closest('#bugLog, #bugBtn')) open(false); });
    el.prism.addEventListener('change', () => { prismOn = el.prism.checked; save(); paint(); });
    $('#bugReset').addEventListener('click', () => {
      done.clear(); save();
      $$('.bug').forEach(b => b.classList.remove('is-fixed', 'is-gone'));
      resets.forEach(fn => fn());
      paint();
    });

    /* reaching the last chapter is a quest too */
    const end = $('#contact');
    if (end && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { award('end'); io.disconnect(); } }, { threshold: 0.45 });
      io.observe(end);
    }
  }

  return {
    init, award,
    status: () => ({ xp: total(), max: MAX, level: LEVELS[levelOf(total())][1], bugs: count('bug') })
  };
})();
