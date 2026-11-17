import { $, $$, clamp, hasST, reduce, root } from '../core/env.js';

/* ------------------------------------------------------------------
   Scroll-linked motion (GSAP + ScrollTrigger)
------------------------------------------------------------------ */
export function motion() {
  if (!hasST || reduce) return;

  /* the statement lights up word by word as you scroll through it */
  const say = $('#say');
  if (say) {
    const words = say.textContent.trim().split(/\s+/);
    say.setAttribute('aria-label', say.textContent.trim());
    say.textContent = '';
    words.forEach((w, k) => {
      const s = document.createElement('span');
      s.className = 'wd'; s.setAttribute('aria-hidden', 'true'); s.textContent = w;
      say.append(s);
      if (k < words.length - 1) say.append(' ');
    });
    root.classList.add('has-st');
    gsap.to('.say .wd', { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: say, start: 'top 82%', end: 'bottom 48%', scrub: 0.4 } });
  }

  /* numbers count up once */
  $$('[data-count]').forEach(el => {
    const end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0), o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } })
    });
  });

  /* marquee: always drifting, and scroll speed throws it */
  const rows = [[$('#mq1'), -1], [$('#mq2'), 1]].filter(r => r[0]);
  const tweens = rows.map(([el, dir]) => gsap.fromTo(el, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 34, ease: 'none', repeat: -1 }));
  const speed = { v: 1 };
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      const boost = 1 + Math.min(7, Math.abs(self.getVelocity()) / 260);
      gsap.to(speed, { v: boost, duration: 0.2, overwrite: true, onUpdate: () => tweens.forEach(t => t.timeScale(speed.v)) });
      gsap.to(speed, { v: 1, duration: 1.2, delay: 0.2, onUpdate: () => tweens.forEach(t => t.timeScale(speed.v)) });
      rows.forEach(([el]) => gsap.to(el, { skewX: clamp(self.getVelocity() / -260, -9, 9), duration: 0.3, overwrite: 'auto' }));
    },
    onLeave: () => rows.forEach(([el]) => gsap.to(el, { skewX: 0, duration: 0.5 })),
    onLeaveBack: () => rows.forEach(([el]) => gsap.to(el, { skewX: 0, duration: 0.5 }))
  });
  gsap.to(rows.map(r => r[0]), { skewX: 0, duration: 0.8, delay: 0.5 });
}
