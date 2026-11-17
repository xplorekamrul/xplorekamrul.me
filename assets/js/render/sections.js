/* ==========================================================================
   Page sections, rendered from assets/data/content.json.
   One function per section. Each takes the whole content object and
   returns HTML. The class names and ids are what the CSS and the
   features (assets/js/features) look for, so keep them as they are.
   ========================================================================== */
import { list, attr, extLink, shortUrl, bug, openButton, projectRef, sentence } from './helpers.js';

/* ---------------------------------------------------------------- 0 Hero */
export const hero = ({ hero: h, profile }) => `
<section class="hero" id="home" data-chapter="0" aria-labelledby="heroName">
  <div class="hero__meta plate">
    <p><b>${h.tagline.title}</b>${h.tagline.text}</p>
    <p><b>${h.place}</b><span id="clock">${profile.utc}</span></p>
  </div>
  <h1 class="hero__name" id="heroName">${profile.name}</h1>
  <div class="hero__foot">
    <div class="plate">
      <p class="hero__lead">${h.lead} <span>${h.leadNote}</span></p>
      <div class="hero__cta">
        ${list(h.buttons, b => `<a class="btn${b.solid ? ' btn--solid' : ''} magnet" href="${attr(b.href)}">${b.label}</a>`)}
      </div>
    </div>
    <div class="hero__side plate">
      <p class="hero__hint" id="heroHint">${h.hint}</p>
      <div class="spell" id="spell">
        <label class="sr" for="spellIn">${h.spell.label}</label>
        <input id="spellIn" type="text" enterkeyhint="done" maxlength="14" placeholder="${attr(h.spell.placeholder)}" autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button class="btn" type="button" id="spellGo">${h.spell.button}</button>
      </div>
    </div>
  </div>
  ${bug(1)}
</section>`;

/* --------------------------------------------------------------- 1 About */
const stat = (s, content) => {
  if (s.text) return `<li><b>${s.text}</b><span>${s.label}</span></li>`;
  if (s.since) return `<li><b><span data-count="${s.value}" data-since="${s.since}">${s.value}</span>${s.suffix || ''}</b><span>${s.label}</span></li>`;
  if (s.countProjects) {
    const n = content.work.projects.length;
    return `<li><b data-count="${n}" data-rows>${n}</b><span>${s.label}</span></li>`;
  }
  return `<li><b data-count="${s.value}"${s.decimals ? ` data-dec="${s.decimals}"` : ''}>${s.value}</b><span>${s.label}</span></li>`;
};

export const about = content => {
  const a = content.about;
  return `
<section class="sec about" id="about" data-chapter="1" aria-labelledby="about-h">
  <h2 class="sec__title split" id="about-h">${a.title}</h2>
  <div class="col plate">
    <p class="say" id="say">${a.text}</p>
  </div>
  <ul class="stats plate">
    ${list(a.stats, s => stat(s, content))}
  </ul>
  <div class="nowbox" id="now">
    <h3>${a.now.title}</h3>
    <dl class="facts">
      ${list(a.now.items, f => `<div><dt>${f.label}</dt><dd${f.clock ? ' id="nowTime"' : ''}>${f.text}</dd></div>`)}
    </dl>
    <p class="nowbox__stamp">Updated <time id="nowStamp" datetime="${a.now.updated}">${a.now.updated}</time></p>
  </div>
  ${bug(2, { style: 'right:14%;top:5.5rem' })}
</section>`;
};

/* The two scrolling rows of stack names. Each row is written twice so the loop is seamless. */
export const marquee = ({ marquee: rows }) => `
<div class="marquee" aria-hidden="true">
  ${list(rows, (row, i) => `<div class="marquee__row${i % 2 ? ' marquee__row--out' : ''}" id="mq${i + 1}">${list([...row, ...row], t => `<span>${t}</span>`)}</div>`)}
</div>`;

/* ---------------------------------------------------------------- 2 Work */
const project = (p, i) => `
<li class="row" data-hue="${p.hue}" data-ini="${attr(p.initials)}" data-url="${attr(shortUrl(p.url))}">
  <h3><button class="row__btn" type="button" aria-expanded="false" aria-controls="w${i + 1}"><span class="row__name">${p.name}</span><span class="row__kind">${p.kind}</span><span class="row__plus" aria-hidden="true"></span></button></h3>
  <div class="row__body" id="w${i + 1}">
    <div class="row__in">
      <div class="row__grid">
        <div>
          <h4>What it does</h4>
          <p>${p.what}</p>
        </div>
        <div>
          <h4>What was hard</h4>
          <p>${p.hard}</p>
        </div>
        <div class="row__meta">
          <ul class="chips" aria-label="Stack">${list(p.stack, s => `<li>${s}</li>`)}</ul>${extLink(p.url, `Open ${shortUrl(p.url)}`, 'row__link ext')}
        </div>
      </div>
    </div>
  </div>
</li>`;

export const work = ({ work: w }) => `
<section class="sec work" id="work" data-chapter="2" aria-labelledby="work-h">
  <h2 class="sec__title split" id="work-h">${w.title}</h2>
  <p class="filter" id="workFilter" hidden><span id="filterText"></span><button type="button" id="filterClear">Show all projects</button></p>
  <ol class="work__list plate" id="workList">
    ${list(w.projects, project)}
  </ol>
  <p class="work__more plate">${w.more.text} ${extLink(w.more.href, w.more.link)}</p>
  ${bug(3)}
</section>`;

/* ---------------------------------------------------------- 3 Case study */
export const caseStudy = content => {
  const c = content.caseStudy;
  const { project: p, n } = projectRef(content, c.project);
  return `
<section class="sec case" id="case" data-chapter="3" aria-labelledby="case-h">
  <div class="col col--r">
    <h2 class="sec__title sec__title--sm split" id="case-h">${c.title}</h2>
    <div class="plate">
      <p class="lede">${c.lede}</p>
      <dl class="case__meta">
        ${list(c.facts, f => `<div><dt>${f.label}</dt><dd>${f.href ? extLink(f.href, f.text) : f.text}</dd></div>`)}
      </dl>

      <h3 class="sub">${c.groupsTitle}</h3>
      <div class="groups">
        ${list(c.groups, g => `<div><h4>${g.title}</h4><p>${g.text}</p></div>`)}
      </div>

      <h3 class="sub">${c.archTitle}</h3>
      <dl class="arch" id="arch">
        ${list(c.arch, a => `<div class="arch__item"><dt><button type="button">${a.name}</button></dt><dd>${a.text}</dd></div>`)}
      </dl>
      <p class="arch__note" id="archNote" aria-live="polite"></p>

      <h3 class="sub">${c.hardTitle}</h3>
      <ul class="hard">
        ${list(c.hard, t => `<li>${t}</li>`)}
      </ul>

      <div class="case__links">
        ${extLink(p.url, c.liveButton, 'btn btn--solid ext')}
        <button class="btn" type="button" data-open="${n}">${c.listButton}</button>
      </div>
    </div>
  </div>
</section>`;
};

/* ------------------------------------------------------------ 4 Services */
export const services = content => {
  const s = content.services;
  return `
<section class="sec services" id="services" data-chapter="4" aria-labelledby="services-h">
  <h2 class="sec__title split" id="services-h">${s.title}</h2>
  <div class="col plate">
    <p class="lede">${s.lede}</p>
    <ul class="svcs">
      ${list(s.items, item => `
      <li class="svc">
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <p class="svc__proof">Proof: ${item.proof.map(id => openButton(content, id)).join(' ')}</p>
      </li>`)}
    </ul>
    <div class="case__links">
      <a class="btn btn--solid magnet" href="${attr(s.button.href)}">${s.button.label}</a>
    </div>
  </div>
</section>`;
};

/* -------------------------------------------------------------- 5 Career */
/* "Built" lists: "@id" is a project from the work list, { text, href } a link, anything else plain text. */
const built = (content, items) => sentence(items.map(item => {
  if (typeof item === 'object') return extLink(item.href, item.text);
  if (item.startsWith('@')) return openButton(content, item.slice(1));
  return item;
})) + '.';

const detail = (content, d) => {
  const dd = d.built ? built(content, d.built) : d.text;
  const range = `${d.from ? ` data-from="${d.from}"` : ''}${d.to ? ` data-to="${d.to}"` : ''}`;
  return `<div${d.stack ? ' data-k="stack"' : ''}><dt>${d.label}</dt><dd${range}>${dd}</dd></div>`;
};

const job = (content, j, i) => `
<li class="job" data-pins="${attr(j.pins)}" data-label="${attr(j.label)}" data-hue="${j.hue}">
  <span class="job__when">${j.current ? `<span class="now">${j.when}</span>` : j.when}</span>
  <div>
    <h3 class="job__co">${j.company}</h3>
    <p class="job__role">${j.role}</p>
  </div>
  <p class="job__what">${j.what}</p>
  <button class="job__toggle" type="button" aria-expanded="false" aria-controls="job${i + 1}">Show details</button>
  <dl class="job__more" id="job${i + 1}">
    ${list(j.details, d => detail(content, d))}
  </dl>
</li>`;

const ring = e => `<em class="ring" style="--p:${String(+(e.grade / e.outOf).toFixed(4)).replace(/^0/, '')}"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="ring__bg" cx="22" cy="22" r="20" /><circle class="ring__fg" cx="22" cy="22" r="20" pathLength="100" /></svg><strong>${e.grade}</strong> <small>of ${e.outOf}</small></em>`;
const progress = e => `<em>${e.status}</em><div class="edu__bar" data-from="${e.from}" data-to="${e.to}" aria-hidden="true"><i></i><small>${e.from}</small><small class="edu__now">Now</small><small>${e.to}</small></div>`;

export const career = content => {
  const c = content.career;
  return `
<section class="sec career" id="career" data-chapter="5" aria-labelledby="career-h">
  <div class="col col--r">
    <h2 class="sec__title split" id="career-h">${c.title}</h2>
    <div class="plate" style="position:relative">
      <ol class="jobs">
        ${list(c.jobs, (j, i) => job(content, j, i))}
      </ol>
      ${bug(4, { cls: 'bug--jobs' })}

      <div class="edu">
        <h3>${c.education.title}</h3>
        <ol class="edu__list">
          ${list(c.education.items, e => `<li data-word="${attr(e.word)}"><b>${e.degree}</b><span>${e.place}</span>${e.grade ? ring(e) : progress(e)}</li>`)}
        </ol>
        <div class="award">
          <b>${c.award.title}</b>
          <span>${c.award.text}</span>
          ${bug(5)}
        </div>
      </div>
    </div>
  </div>
</section>`;
};

/* -------------------------------------------------------------- 6 Skills */
export const skills = ({ skills: s }) => `
<section class="sec skills" id="skills" data-chapter="6" aria-labelledby="skills-h">
  <h2 class="sec__title split" id="skills-h">${s.title}</h2>
  <div class="col plate">
    <div class="kit">
      ${list(s.groups, g => `<div class="kit__row"><h3>${g.name}</h3><ul>${list(g.items, t => `<li>${t}</li>`)}</ul></div>`)}
      ${bug(6)}
    </div>
    <p class="kit__note" id="skillNote" aria-live="polite"></p>
    <div class="soft">
      ${list(s.soft, x => `<div><h3>${x.title}</h3><p>${x.text}</p></div>`)}
    </div>
  </div>
</section>`;

/* ---------------------------------------------------------------- 7 Code */
/* The numbers, calendar and repositories are filled in live from GitHub by features/github.js. */
export const github = ({ github: g, profile }) => `
<section class="sec code" id="github" data-chapter="7" aria-labelledby="gh-h">
  <div class="col col--r">
    <h2 class="sec__title split" id="gh-h">${g.title}</h2>
    <div class="plate gh" id="gh" data-user="${attr(profile.githubUser)}">
      <p class="gh__state"><span id="ghState">${g.intro}</span> ${extLink(profile.links.github, shortUrl(profile.links.github))}</p>
      <ul class="gh__stats" id="ghStats" hidden></ul>
      <div class="gh__cal" id="ghCalWrap" hidden>
        <h3 class="sub" id="ghCalHead">Contributions in the last year</h3>
        <div class="gh__scroll" id="ghCalScroll">
          <div class="cal" id="ghCal" role="img" aria-label="Contributions in the last year"></div>
        </div>
        <div class="cal__foot"><span id="ghCalNote"></span><span class="cal__key" aria-hidden="true">Less <i data-l="0"></i><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i> More</span></div>
        <p class="cal__tip" id="ghCalTip" aria-hidden="true" hidden></p>
      </div>
      <div id="ghLangWrap" hidden>
        <h3 class="sub">Languages across public repositories</h3>
        <div class="gh__langs" id="ghLangs"></div>
      </div>
      <div id="ghRepoWrap" hidden>
        <h3 class="sub">Recently pushed</h3>
        <ol class="gh__repos" id="ghRepos"></ol>
      </div>
    </div>
  </div>
</section>`;

/* ------------------------------------------------- What people say (optional) */
/* Hidden while content.voices.items is empty. Each item: { "quote", "name", "role" } */
export const voices = ({ voices: v }) => `
<section class="sec voices" id="voices" aria-labelledby="voices-h"${v.items.length ? '' : ' hidden'}>
  <h2 class="sec__title sec__title--sm" id="voices-h">${v.title}</h2>
  <div class="voices__list" id="voicesList">
    ${list(v.items, q => `<figure class="voice"><blockquote>${q.quote}</blockquote><figcaption><b>${q.name}</b>${q.role ? `, ${q.role}` : ''}</figcaption></figure>`)}
  </div>
</section>`;

/* ------------------------------------------------------------- 8 Contact */
export const contact = ({ contact: c, profile, resume }) => `
<section class="sec contact" id="contact" data-chapter="8" aria-labelledby="contact-h">
  <div class="plate">
    <h2 class="split" id="contact-h">${c.title}</h2>
    <a class="mail" id="mail" href="mailto:${attr(profile.email)}">${profile.email.replace('@', '<wbr>@')}</a>
    <div class="contact__row">
      <a class="btn btn--solid magnet" id="resumeBtn" href="${attr(encodeURI(resume.file))}" download="${attr(resume.saveAs)}">${resume.button}</a>
      <button class="btn magnet" id="copyMail" type="button">${c.copyButton}</button>
      ${list(c.buttons, b => extLink(profile.links[b.link], b.label, 'btn ext magnet'))}
    </div>
    <dl class="reach">
      ${list(c.reach, r => `<div><dt>${r.label}</dt><dd>${r.href ? `<a href="${attr(r.href)}">${r.text}</a>` : r.text}</dd></div>`)}
    </dl>
  </div>
</section>`;

/** Every section of <main>, in page order. */
export const PAGE = [hero, about, marquee, work, caseStudy, services, career, skills, github, voices, contact];
