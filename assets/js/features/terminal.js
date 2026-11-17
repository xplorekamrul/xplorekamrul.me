import { content } from '../core/content.js';
import { $, $$, clamp, reduce } from '../core/env.js';
import { ui } from '../core/ui.js';
import { Field } from './field.js';
import { Game } from './game.js';
import { Resume } from './resume.js';
import { Spell } from './spell.js';
import { Theme } from './theme.js';

/* ------------------------------------------------------------------
   Terminal: the portfolio as a command line that also understands
   plain questions. Answers are read from the page itself, so they
   stay in step with the content. Open with >_, Ctrl+K or the ` key.
------------------------------------------------------------------ */
export const Terminal = (() => {
  const T = () => content.terminal;            /* the terminal's own text in content.json */
  const EMAIL = () => content.profile.email;
  let box, out, input, btn, opened = false, greeted = false, pumping = false, block = null;
  const history = [], queue = [];
  let cursor = 0;

  /* ---- output, coloured like a real shell ----
     Text may carry explicit colour marks, [[g:text]], and everything else is highlighted
     automatically: links, emails, numbers, "strings", and the first column of a table. */
  const TAG = { g: 't-ok', k: 't-key', p: 't-purple', w: 't-warn', e: 't-err', c: 't-cyan', s: 't-str', n: 't-num', m: 't-dim', b: 't-bold', h: 't-head' };
  const AUTO = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(https?:\/\/[^\s)]+|\b(?:[\w-]+\.)+(?:com|org|app|io|dev|me|bd)\b(?:\/[^\s)]*)?)|("[^"\n]*")|(\b\d+(?:[.,:/]\d+)*%?)/g;
  const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; return s; };
  function auto(parent, text) {
    let last = 0, m;
    AUTO.lastIndex = 0;
    while ((m = AUTO.exec(text))) {
      if (m.index > last) parent.append(text.slice(last, m.index));
      if (m[1] || m[2]) {
        const a = document.createElement('a');
        a.textContent = m[0];
        a.href = m[1] ? `mailto:${m[1]}` : /^https?:/.test(m[2]) ? m[2] : `https://${m[2]}`;
        if (!m[1]) { a.target = '_blank'; a.rel = 'noopener'; }
        parent.append(a);
      } else parent.append(span(m[3] ? 't-str' : 't-num', m[0]));
      last = AUTO.lastIndex;
    }
    if (last < text.length) parent.append(text.slice(last));
  }
  function rich(parent, text) {
    const t = text.trim();
    /* a lone heading: all capitals, or a short sentence ending in a colon */
    if (/^[A-Z][A-Z &()/-]{3,}$/.test(t) || /^[A-Z][^:\[]{3,60}:$/.test(t)) { parent.append(span('t-head', text)); return; }
    /* a table row: colour its first column */
    const col = !/\[\[/.test(text) && text.match(/^(\s*)(\S(?:.{0,22}?\S)?)(\s{2,})(?=\S)/);
    if (col) { parent.append(col[1], span('t-key', col[2]), col[3]); text = text.slice(col[0].length); }
    const re = /\[\[(\w):([\s\S]*?)\]\]/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      auto(parent, text.slice(last, m.index));
      parent.append(span(TAG[m[1]] || '', m[2]));
      last = re.lastIndex;
    }
    auto(parent, text.slice(last));
  }
  /* the echoed command line, with the prompt in front */
  function prompt(p, text) {
    p.append(span('t-ok', 'visitor'), span('t-dim', '@'), span('t-key', 'kamruzzaman'), span('t-dim', ':'), span('t-purple', '~'), span('t-dim', '$ '));
    const [first, ...rest] = text.split(' ');
    const known = Object.keys(COMMANDS).concat(Object.keys(ALIAS)).includes(first.toLowerCase());
    p.append(span(known ? 't-ok t-bold' : 't-bold', first));
    if (rest.length) p.append(span(known ? 't-str' : 't-bold', ' ' + rest.join(' ')));
  }
  function line(text, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.classList.add('is-new');
    if (cls === 'cmd') {
      /* each command starts a block: its line, then everything it prints */
      block = document.createElement('div');
      block.className = 'term__block';
      const cmdText = document.createElement('span');   /* keeps the prompt in one piece inside the flex row */
      prompt(cmdText, text);
      p.append(cmdText, copyButton(block));
      block.append(p);
      out.append(block);
    } else {
      if (!text) p.textContent = ' ';
      else rich(p, text);
      (block || out).append(p);
    }
    out.scrollTop = out.scrollHeight;
    return p;
  }
  /* copies a command's result: every line printed after it, as plain text */
  const ICON_COPY = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M5 1.5A1.5 1.5 0 0 1 6.5 0h7A1.5 1.5 0 0 1 15 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 10.5v-9Zm1.5-.25a.25.25 0 0 0-.25.25v9c0 .14.11.25.25.25h7a.25.25 0 0 0 .25-.25v-9a.25.25 0 0 0-.25-.25h-7ZM1 5.5A1.5 1.5 0 0 1 2.5 4H3v1.25h-.5a.25.25 0 0 0-.25.25v9c0 .14.11.25.25.25h7a.25.25 0 0 0 .25-.25V14H11v.5A1.5 1.5 0 0 1 9.5 16h-7A1.5 1.5 0 0 1 1 14.5v-9Z"/></svg>';
  const ICON_DONE = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';
  function copyButton(owner) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'term__copy';
    b.title = 'Copy the result';
    b.setAttribute('aria-label', 'Copy the result of this command');
    b.innerHTML = ICON_COPY;
    let reset = 0;
    b.addEventListener('click', e => {
      e.stopPropagation();
      const text = [...owner.children].slice(1).map(p => p.textContent.replace(/\s+$/, '')).join('\n').replace(/^\n+|\n+$/g, '');
      const done = ok => {
        b.innerHTML = ok ? ICON_DONE : ICON_COPY;
        b.classList.toggle('is-done', ok);
        b.title = ok ? 'Copied' : 'Copy failed';
        clearTimeout(reset);
        reset = setTimeout(() => { b.innerHTML = ICON_COPY; b.classList.remove('is-done'); b.title = 'Copy the result'; }, 1600);
      };
      if (!text) { done(false); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), () => done(fallbackCopy(text)));
      else done(fallbackCopy(text));
    });
    return b;
  }
  /* for pages opened from disk, where the clipboard API is not allowed */
  function fallbackCopy(text) {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.append(t); t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { }
    t.remove(); input.focus();
    return ok;
  }
  /* output arrives line by line, like a real shell. Queue entries are lines, or steps
     (functions) such as a spinner or a progress bar that hold the queue until they finish. */
  function pump() {
    if (!queue.length) { pumping = false; return; }
    pumping = true;
    const it = queue.shift();
    if (typeof it === 'function') { Promise.resolve(it()).then(() => setTimeout(pump, 30), () => setTimeout(pump, 30)); return; }
    line(...it);
    setTimeout(pump, reduce ? 0 : 22);
  }
  function print(text, cls) {
    String(text).split('\n').forEach(t => queue.push([t, cls]));
    if (!pumping) pump();
  }
  function later(fn) { queue.push(fn); if (!pumping) pump(); }
  const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
  /* a braille spinner while "thinking" */
  function think(label = 'thinking', ms = 420) {
    if (reduce) return;
    later(() => new Promise(done => {
      const p = line('', 'dim');
      let k = 0;
      const tick = () => { p.textContent = ''; p.append(span('t-cyan', SPIN[k++ % SPIN.length]), span('t-dim', ` ${label}…`)); };
      tick();
      const iv = setInterval(tick, 80);
      setTimeout(() => { clearInterval(iv); p.remove(); done(); }, ms);
    }));
  }
  /* a progress bar that fills while the work runs; then() gets the work's result */
  function progress(label, work, then) {
    later(() => new Promise(done => {
      const p = line('', 'bar');
      let pct = 0, finished = false, k = 0, result;
      const draw = () => {
        const n = 24, full = Math.round((pct / 100) * n);
        p.textContent = '';
        p.append(span(finished ? 't-ok' : 't-cyan', finished ? '✔' : SPIN[k++ % SPIN.length]), ` ${label}  [`);
        const fill = document.createElement('i'); fill.textContent = '█'.repeat(full);
        const rest = document.createElement('b'); rest.textContent = '░'.repeat(n - full);
        p.append(fill, rest, '] ', span('t-num', `${String(Math.round(pct)).padStart(3)}%`));
      };
      const iv = setInterval(() => { if (!finished) { pct += (92 - pct) * 0.08; draw(); } }, 60);
      draw();
      Promise.resolve(work()).then(r => { result = r; }, () => { result = 'missing'; }).then(() => {
        const end = () => {
          pct = Math.min(100, pct + 9);
          draw();
          if (pct < 100) { setTimeout(end, 25); return; }
          finished = result !== 'missing'; clearInterval(iv); draw();
          if (!finished) { p.firstChild.textContent = '✖'; p.firstChild.className = 't-err'; }
          if (then) then(result);
          done();
        };
        setTimeout(end, reduce ? 0 : 250);
      });
    }));
  }
  const started = performance.now();
  const uptime = () => { const s = Math.round((performance.now() - started) / 1000); return s < 60 ? `${s} sec` : `${Math.floor(s / 60)} min, ${s % 60} sec`; };

  const go = id => { const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
  const projects = () => $$('.row').map((r, i) => ({
    n: i + 1, r, name: $('.row__name', r).textContent, kind: $('.row__kind', r).textContent, url: r.dataset.url,
    stack: $$('.chips li', r).map(l => l.textContent), what: $('.row__grid p', r).textContent
  }));
  const groups = () => $$('.kit__row').map(r => ({ group: $('h3', r).textContent, items: $$('li', r).map(l => l.dataset.name || l.textContent) }));
  const jobs = () => $$('.job').map(j => ({ when: $('.job__when', j).textContent.trim(), co: $('.job__co', j).textContent, role: $('.job__role', j).textContent, what: $('.job__what', j).textContent }));
  const dhaka = () => { try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: content.profile.timeZone }).format(new Date()); } catch (e) { return ''; } };
  const describe = p => `${p.name} (${p.kind})\n${p.what}\nStack: ${p.stack.join(', ')}\nLive: ${p.url}\nType open ${p.n} to see it in the list.`;

  /* ---- what it can say ---- */
  const SAY = {
    whoami: () => T().whoami.join('\n'),
    projects: () => projects().map(p => `${p.n}  ${p.name}  (${p.kind}, ${p.url})`).join('\n') + '\nType open <number>, or ask about one: "tell me about the courier system".',
    skills: () => groups().map(g => `${g.group.padEnd(11)} ${g.items.join(', ')}`).join('\n') + '\nAsk about any of them: "which projects use Prisma?"',
    career: () => jobs().map(j => `${j.when.padEnd(20)} ${j.co}, ${j.role}`).join('\n'),
    job: () => { const j = jobs()[0]; return `Right now: ${j.role} at ${j.co}.\n${j.what}`; },
    education: () => $$('.edu__list li').map(li => `${$('b', li).textContent.padEnd(15)} ${$('em', li).textContent.padEnd(9)} ${$('span', li).textContent}`).join('\n'),
    award: () => `${$('.award b').textContent}. ${$('.award span').textContent}.\n${T().awardNote}`,
    spoken: () => T().spoken,
    soft: () => T().soft,
    contact: () => {
      const p = content.profile, bare = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return [`email     ${p.email}`, `phone     ${p.phone}`, ...Object.entries(p.links).map(([k, u]) => `${k.padEnd(9)} ${bare(u)}`), 'Type email to copy the address.'].join('\n');
    },
    hire: () => `${T().hire}\nThe fastest way is email: ${EMAIL()}\nType resume to download the CV, or email to copy the address.`,
    rate: () => `${T().rate} ${EMAIL()}.`,
    location: () => `${T().location}. It is ${dhaka()} there now (${content.profile.utc}).`,
    time: () => `${dhaka()} in ${content.profile.city} (${content.profile.utc}).`,
    greet: () => T().greet.join('\n'),
    bye: () => T().bye,
    joke: () => T().joke,
    can: () => T().can.join('\n'),
    resume: () => { COMMANDS.resume(''); return null; }
  };

  /* the resume, as text: content.terminal.cv */
  const CV = () => T().cv.join('\n');

  /* a tiny file system for ls and cat */
  const FILES = {
    'about.txt': () => SAY.whoami(),
    'contact.md': () => SAY.contact(),
    'resume.pdf': () => CV()
  };
  const DIRS = { projects: () => SAY.projects(), skills: () => SAY.skills() };

  /* plain-language questions, most specific first */
  const INTENTS = [
    [/\b(resume|cv|curriculum)\b/, 'resume'],
    [/\b(hire|hiring|available|availability|freelance|recruit|open to|job offer)\b/, 'hire'],
    [/\b(rate|rates|salary|price|pricing|cost|charge|budget)\b/, 'rate'],
    [/\b(email|mail|phone|number|call|whatsapp|contact|reach|linkedin|github|social)\b/, 'contact'],
    [/\b(current|currently|now|adzoic|employer|company|job|where (do|are) you work\w*|working at)\b/, 'job'],
    [/\b(experience|years|career|worked|history|background|companies|jobs)\b/, 'career'],
    [/\b(education|study|studied|studying|degree|university|college|cgpa|gpa|diploma|bsc|ssc)\b/, 'education'],
    [/\b(award|awards|achievement|achievements|topper|rank|proud)\b/, 'award'],
    [/\b(speak|spoken|english|bengali|bangla|hindi|urdu)\b/, 'spoken'],
    [/\b(strength|strengths|soft|teamwork|leadership)\b/, 'soft'],
    [/\b(skill|skills|stack|tech|technology|technologies|tools?|frameworks?|languages?|databases?)\b/, 'skills'],
    [/\b(projects?|portfolio|built|build|apps?|platforms?|work|made)\b/, 'projects'],
    [/\b(where|location|live|based|city|country|from|address)\b/, 'location'],
    [/\b(time|date|clock)\b/, 'time'],
    [/\b(what can you do|how does this work|commands?)\b/, 'can'],
    [/\b(who|name|yourself|about|introduce|kamruzzaman|what do you do)\b/, 'whoami'],
    [/\b(joke|funny)\b/, 'joke'],
    [/\b(thanks|thank|thx|bye|goodbye)\b/, 'bye'],
    [/\b(hi|hello|hey|salam|assalamu|yo)\b/, 'greet']
  ];
  const STOP = new Set('a an the is are was am be do does did you your yours me my i we in on of to for with and or what which who whom how tell about show have has had use used uses using know can could any some it its this that list give please work worked works there here any all much many really ever with experience project projects stack tech skill skills good at built build made'.split(' '));
  const NOT_MINE = ['java', 'python', 'php', 'golang', 'rust', 'flutter', 'angular', 'vue', 'svelte', 'django', 'laravel', 'kotlin', 'swift', 'ruby', 'docker', 'kubernetes', 'graphql', 'firebase', 'wordpress'];
  const SHORT = { ts: 'typescript', js: 'javascript', pg: 'postgresql', aws: 'awsec2', mongo: 'mongodb', postgres: 'postgresql' };
  const EXTRA = [
    ['school', 'classroom', 'lms', 'birbd'], ['hr', 'hrm', 'hris', 'attendance', 'employee'], ['obokash', 'travel', 'tour', 'visa', 'hajj', 'flight'],
    ['dynamic', 'tenant', 'multitenant', 'institute'], ['courier', 'logistics', 'delivery', 'tracking'], ['ighotok', 'matrimonial', 'matrimony', 'marriage', 'matchmaking'],
    ['ecommerce', 'commerce', 'shop', 'store', 'birl']
  ];
  const GENERIC = new Set(['web', 'app', 'system', 'website', 'site', 'com']);

  const same = (item, word) => {
    const a = norm(item), b = SHORT[word] || norm(word);
    if (!a || !b) return false;
    return a === b || (b.length >= 4 && a.startsWith(b)) || (a.length >= 4 && b.startsWith(a));
  };

  function ask(text) {
    const q = text.toLowerCase();
    const words = q.split(/[\s,;:!?()"']+/).map(w => w.replace(/\.+$/, '')).filter(w => w && !STOP.has(w));

    /* 1. a technology that is not in the stack */
    const nope = words.find(w => NOT_MINE.includes(norm(w)));
    if (nope) return `No, ${nope} is not something I list.\nWhat I do use: ${groups().slice(0, 3).map(g => g.items.slice(0, 4).join(', ')).join('; ')}.\nType skills for the full list.`;

    /* 2. a technology that is: say where it is used */
    const all = projects();
    for (const w of words) {
      let item = '', group = '';
      groups().some(g => g.items.some(it => (same(it, w) ? ((item = it), (group = g.group), true) : false)));
      const users = all.filter(p => p.stack.some(c => same(c, w)));
      if (!item && users.length) item = users[0].stack.find(c => same(c, w));
      if (!item) continue;
      const where = users.length ? `Projects that list it: ${users.map(p => `${p.name} (${p.n})`).join(', ')}.` : 'It is part of the toolkit, though no project in the list names it.';
      return `${group ? `Yes. ${item} is in the stack, under ${group.toLowerCase()}.` : `${item} shows up in the project stacks.`}\n${where}`;
    }

    /* 3. one of the projects */
    const scored = all.map((p, i) => {
      const own = p.name.toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !GENERIC.has(t)).concat(EXTRA[i] || []);
      return [words.filter(w => own.includes(norm(w))).length, p];
    }).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]);
    if (scored.length) {
      const best = scored.filter(x => x[0] === scored[0][0]).map(x => x[1]);
      return best.length === 1 ? describe(best[0]) : `${best.length} projects match:\n${best.map(p => `${p.n}  ${p.name}  (${p.kind})`).join('\n')}\nType open <number> to see one.`;
    }

    /* 4. a general question */
    const hit = INTENTS.find(([re]) => re.test(q));
    if (hit) return SAY[hit[1]]();
    return '';
  }

  /* ---- commands ---- */
  const COMMANDS = {
    help() {
      const c = s => s.split(' ').map(w => (/^[<\[]/.test(w) ? `[[m:${w}]]` : `[[g:${w}]]`)).join(' ');
      print([
        'Ask in plain words, for example:',
        '  [[s:"which projects use PostgreSQL?"]]   [[s:"tell me about the HR system"]]',
        '  [[s:"where do you work?"]]               [[s:"are you available?"]]',
        '',
        'ABOUT',
        `  ${c('whoami')}  ${c('neofetch')}  ${c('now')}  ${c('career')}  ${c('education')}  ${c('awards')}`,
        'WORK',
        `  ${c('projects')}  ${c('open <1-7>')}  ${c('skills')}  ${c('services')}`,
        'RESUME',
        `  ${c('resume')} [[m:download]]   ${c('cat resume')} [[m:read it here]]   ${c('open resume')} [[m:view the PDF]]`,
        'CONTACT',
        `  ${c('contact')}  ${c('email')} [[m:copy the address]]`,
        'SHELL',
        `  ${c('ls')}  ${c('cat <file>')}  ${c('pwd')}  ${c('date')}  ${c('uptime')}  ${c('history')}  ${c('clear')}  ${c('exit')}`,
        'PAGE',
        `  ${c('goto <section>')}  ${c('next')}  ${c('prev')}  ${c('top')}  ${c('theme <dark|light>')}`,
        `  ${c('spell <word>')}  ${c('shape <globe|stack|graph|cube|helix|code|git|hello>')}  ${c('xp')}  ${c('shortcuts')}`,
        '',
        '[[m:Tab completes a command. ↑ ↓ walk the history. Ctrl+L clears.]]'
      ].join('\n'));
    },
    neofetch() {
      const ps = projects(), j = jobs()[0];
      const art = [
        '[[c:  __  __ _  __ ]]',
        '[[c: |  \\/  | |/ / ]]',
        '[[c: | |\\/| | \' /  ]]',
        '[[c: | |  | | . \\  ]]',
        '[[c: |_|  |_|_|\\_\\ ]]',
        '                ',
        '                ',
        '                ',
        '                ',
        '                ',
        '                '
      ];
      const info = [
        '[[g:visitor]]@[[k:kamruzzaman]]',
        '[[m:───────────────────]]',
        `[[k:OS]]       Portfolio OS (web)`,
        `[[k:Host]]     ${content.profile.area}, ${content.profile.country}  [[m:${dhaka()} ${content.profile.utc}]]`,
        `[[k:Role]]     ${content.profile.role}`,
        j ? `[[k:Now]]      ${j.role} @ ${j.co}` : '',
        `[[k:Stack]]    ${T().stack}`,
        `[[k:Projects]] ${ps.length} shipped  [[m:(type projects)]]`,
        `[[k:Uptime]]   ${uptime()}`,
        `[[k:Shell]]    kzsh 1.0  [[m:· resume: ${Resume.info().file}]]`,
        '[[e:███]][[w:███]][[g:███]][[c:███]][[k:███]][[p:███]][[n:███]]'
      ].filter(Boolean);
      const side = innerWidth >= 760;
      print(side ? info.map((l, i) => `${art[i] || ''.padEnd(16)}  ${l}`).join('\n') : art.slice(0, 5).concat(info).join('\n'));
    },
    ls(arg) {
      if (DIRS[arg]) { print(DIRS[arg]()); return; }
      if (arg && !FILES[arg]) { print(`ls: cannot access '${arg}': No such file or directory`, 'err'); return; }
      if (arg) { print(arg); return; }
      print('[[k:projects/]]   [[k:skills/]]   about.txt   contact.md   [[w:resume.pdf]]');
    },
    cat(arg) {
      const f = arg.replace(/^\.\//, '');
      const key = { resume: 'resume.pdf', cv: 'resume.pdf', about: 'about.txt', contact: 'contact.md' }[f] || f;
      if (!f) { print('usage: cat <file>   [[m:try]] [[g:cat resume.pdf]]'); return; }
      if (DIRS[key]) { print(`cat: ${key}: Is a directory`, 'err'); return; }
      if (!FILES[key]) { print(`cat: ${f}: No such file or directory`, 'err'); return; }
      if (key === 'resume.pdf') think('extracting text from resume.pdf', 600);
      print(FILES[key]());
    },
    cd(arg) {
      if (!arg || arg === '~' || arg === '/') { print('[[m:already home: ~]]'); return; }
      if (DIRS[arg]) { print(DIRS[arg]()); return; }
      print(`cd: no such file or directory: ${arg}`, 'err');
    },
    pwd() { print('/home/visitor/kamruzzaman'); },
    uptime() { print(`up ${uptime()}, 1 visitor, load average: [[n:0.42]], [[n:0.17]], [[n:0.07]]`); },
    date() { print(new Date().toString()); },
    whoami() { print(SAY.whoami()); },
    now() { print($$('#now .facts div').map(d => `${$('dt', d).textContent.padEnd(12)} ${$('dd', d).textContent}`).join('\n')); },
    services() { print($$('.svc').map((v, i) => `${i + 1}  ${$('h3', v).textContent}\n   ${$('p', v).textContent}`).join('\n') + '\nType goto services to see the proof for each.'); },
    projects() { print(SAY.projects()); },
    open(arg) {
      if (/^(resume|cv|resume\.pdf)$/.test(arg)) { Resume.open(); print('Opening [[w:resume.pdf]] in a new tab.', 'ok'); return; }
      const p = projects()[Number(arg) - 1];
      if (!p) { print('usage: open <1-7|resume>'); return; }
      go('work');
      if (!p.r.classList.contains('is-open')) $('.row__btn', p.r).click();
      setTimeout(() => p.r.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 500);
      print(`Opened ${p.name} in the work list.`, 'ok');
    },
    skills() { print(SAY.skills()); },
    career() { print(SAY.career()); },
    education() { print(SAY.education()); },
    awards() { print(SAY.award()); },
    contact() { print(SAY.contact()); },
    email() {
      const ok = () => print(`Copied ${EMAIL()}`, 'ok'), fail = () => print(EMAIL());
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL()).then(ok, fail); else fail();
    },
    resume(arg) {
      if (/^(view|read|cat|text|-v|--view)$/.test(arg)) { COMMANDS.cat('resume.pdf'); return; }
      if (/^(open|-o|--open)$/.test(arg)) { COMMANDS.open('resume'); return; }
      const { file, saveAs } = Resume.info();
      print(`[[m:fetching]] [[w:${file}]]`);
      progress('downloading', () => Resume.download(), r => {
        const mb = Resume.info().size ? ` ([[n:${(Resume.info().size / 1048576).toFixed(1)}]] MB)` : '';
        if (r === 'ready') print(`[[g:✔]] Saved as [[w:${saveAs}]]${mb}\n[[m:Read it here with]] [[g:cat resume]][[m:, or view it with]] [[g:open resume]][[m:.]]`);
        else if (r === 'opened') print(`[[g:✔]] Handed [[w:${file}]] to the browser.\n[[m:Read it here with]] [[g:cat resume]][[m:.]]`);
        else print(`resume: ${file}: not found next to index.html`, 'err');
      });
    },
    goto(arg) {
      const id = { home: 'home', top: 'home', about: 'about', now: 'now', work: 'work', projects: 'work', case: 'case', services: 'services', career: 'career', skills: 'skills', code: 'github', github: 'github', contact: 'contact' }[arg];
      if (!id) { print('usage: goto <about|work|case|services|career|skills|code|contact>'); return; }
      go(id); print(`Scrolling to ${arg}.`, 'ok');
    },
    top() { go('home'); print('Back at the top.', 'ok'); },
    next() { step(1); },
    prev() { step(-1); },
    theme(arg) {
      const t = arg === 'dark' || arg === 'light' ? arg : Theme.current() === 'dark' ? 'light' : 'dark';
      Theme.set(t); Game.award('theme'); print(`Theme set to ${t}.`, 'ok');
    },
    spell(arg, rest) {
      if (!rest) { print('usage: spell <word>'); return; }
      print(Spell.set(rest) ? `The particles are writing ${rest.toUpperCase().slice(0, 14)}.` : 'The particle field is not running on this device.', 'ok');
    },
    shape(arg) {
      const word = { globe: 'DHAKA', stack: 'STACK', graph: 'GRAPH', cube: 'CUBE', helix: 'DNA', code: 'CODE', git: 'GIT', hello: 'HELLO' }[arg];
      if (!word) { print('usage: shape <globe|stack|graph|cube|helix|code|git|hello>'); return; }
      Spell.set(word); print(`Calling up the ${arg}.`, 'ok');
    },
    boom() { Spell.set('BOOM'); print('Boom.', 'ok'); },
    xp() { const s = Game.status(); print(`Level: ${s.level}\nXP: ${s.xp} of ${s.max}\nBugs fixed: ${s.bugs} of 7`); },
    shortcuts() { ui.showKeys(true); print('Opened the list of keyboard shortcuts.', 'ok'); },
    time() { print(SAY.time()); },
    history() { print(history.length > 1 ? history.slice(0, -1).map((h, i) => `${String(i + 1).padStart(2)}  ${h}`).join('\n') : 'Nothing yet.'); },
    echo(arg, rest) { print(rest || ''); },
    sudo(arg, rest) {
      if (rest.replace(/\s+/g, ' ') === 'hire kamruzzaman') {
        print('Permission granted. Good decision.\nOpening the contact section.', 'ok');
        Game.award('secret', 'Secret found: sudo hire kamruzzaman');
        Field.boom(); go('contact');
      } else print('visitor is not in the sudoers file.\nTry: sudo hire kamruzzaman');
    },
    clear() { queue.length = 0; out.textContent = ''; block = null; },
    exit() { toggle(false); }
  };
  const ALIAS = { dir: 'ls', fetch: 'neofetch', sysinfo: 'neofetch', cv: 'resume', exp: 'career', experience: 'career', stack: 'skills', edu: 'education', award: 'awards', keys: 'shortcuts', cls: 'clear', quit: 'exit', q: 'exit', links: 'contact', social: 'contact', about: 'whoami', me: 'whoami', home: 'top', bugs: 'xp', level: 'xp', man: 'help' };
  const ORDER = ['home', 'about', 'work', 'case', 'services', 'career', 'skills', 'github', 'contact'];
  function step(d) {
    let k = 0;
    ORDER.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= innerHeight * 0.4) k = i; });
    const to = ORDER[clamp(k + d, 0, ORDER.length - 1)];
    go(to); print(`Scrolling to ${to === 'home' ? 'the top' : to}.`, 'ok');
  }

  /* smallest number of edits between two words, for "did you mean" */
  function distance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0]; row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const keep = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = keep;
      }
    }
    return row[b.length];
  }

  function run(raw) {
    const text = raw.trim();
    if (!text) return;
    print(text, 'cmd');
    history.push(text); cursor = history.length;
    const [first, ...args] = text.split(/\s+/);
    const name = first.toLowerCase().replace(/\?+$/, '') || 'help';
    const fn = COMMANDS[name] || COMMANDS[ALIAS[name]];
    if (fn && (args.length === 0 || /^(open|goto|theme|spell|shape|echo|sudo|resume|cat|ls|cd)$/.test(ALIAS[name] || name))) {
      fn((args[0] || '').toLowerCase(), args.join(' ').toLowerCase());
    } else {
      const answer = ask(text);
      if (answer === null) { /* the answer ran a command itself */ }
      else if (answer) { if (args.length) think(); print(answer); }
      else {
        const names = Object.keys(COMMANDS).concat(Object.keys(ALIAS));
        const near = args.length ? '' : names.find(n => distance(n, name) <= (name.length > 4 ? 2 : 1));
        if (near) print(`kzsh: command not found: ${name}\n[[m:did you mean]] [[g:${near}]][[m:?]]`, 'err');
        else if (!args.length) print(`kzsh: command not found: ${name}\n[[m:Type]] [[g:help]] [[m:for the list, or ask in plain words.]]`, 'err');
        else { think(); print('I do not have an answer for that one.\nTry: [[g:projects]], [[g:skills]], [[g:career]], [[g:education]], [[g:contact]]. Or type [[g:help]].'); }
      }
    }
    if (name !== 'exit') Game.award('term');
  }

  function complete() {
    const v = input.value.toLowerCase();
    if (!v || /\s/.test(v)) return;
    const hits = Object.keys(COMMANDS).filter(n => n.startsWith(v));
    if (hits.length === 1) input.value = `${hits[0]} `;
    else if (hits.length > 1) print(hits.join('   '));
  }

  function toggle(on) {
    if (!box) return;
    opened = typeof on === 'boolean' ? on : !opened;
    box.hidden = !opened;
    btn.setAttribute('aria-expanded', String(opened));
    if (opened) {
      if (!greeted) {
        greeted = true;
        const d = new Date();
        print(`[[m:Last login: ${d.toDateString()} ${d.toTimeString().slice(0, 8)} on ttys001]]`);
        COMMANDS.neofetch();
        print('');
        print('Welcome. This portfolio also speaks command line.\nAsk a question in plain words, or type [[g:help]].');
        Resume.warm();                          /* so "resume" saves at once */
      }
      input.focus();
    } else if (document.activeElement === input) btn.focus();
  }

  function init() {
    box = $('#term'); out = $('#termOut'); input = $('#termIn'); btn = $('#termBtn');
    if (!box || !btn) { box = null; return; }
    btn.addEventListener('click', () => toggle());
    $('#termClose').addEventListener('click', () => toggle(false));
    const submit = () => { const v = input.value; input.value = ''; run(v); input.focus(); };
    $('#termRun').addEventListener('click', submit);

    const tips = $('#termTips');
    let typing = null;
    const typeIn = t => {
      if (reduce) { run(t); input.focus(); return; }
      clearInterval(typing);
      input.value = ''; input.focus();
      let k = 0;
      typing = setInterval(() => {
        input.value = t.slice(0, ++k);
        if (k >= t.length) { clearInterval(typing); setTimeout(() => { input.value = ''; run(t); }, 140); }
      }, 26);
    };
    T().suggestions.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = t;
      b.addEventListener('click', () => typeIn(t));
      tips.append(b);
    });
    /* the clock in the title bar */
    const clock = $('#termClock');
    if (clock) { const tick = () => { if (opened) clock.textContent = new Date().toTimeString().slice(0, 5); }; tick(); setInterval(tick, 10000); btn.addEventListener('click', tick); }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Tab' && input.value && !e.shiftKey) { e.preventDefault(); complete(); }
      else if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); cursor = Math.max(0, cursor - 1); input.value = history[cursor]; }
      else if (e.key === 'ArrowDown' && history.length) { e.preventDefault(); cursor = Math.min(history.length, cursor + 1); input.value = history[cursor] || ''; }
      else if (e.key.toLowerCase() === 'l' && e.ctrlKey) { e.preventDefault(); COMMANDS.clear(); }
    });
    addEventListener('keydown', e => {
      if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target !== input) return;
        e.preventDefault(); toggle();
      } else if (e.key === 'Escape' && opened) toggle(false);
    });
  }
  return { init, isOpen: () => opened, toggle };
})();
