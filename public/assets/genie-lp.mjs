/* Genie LP — progressive enhancement. Nothing plays by itself; no storage, tracking or requests beyond media the visitor presses. */
const body = document.body;
if (body.dataset.genieLp) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('glp-ready')));
  const pauseAll = except => document.querySelectorAll('video').forEach(v => { if (v !== except && !v.paused) v.pause(); });
  document.querySelectorAll('video').forEach(v => v.addEventListener('play', () => pauseAll(v)));

  // 01 · Each ledger feature card selects its real frame.
  const cards = [...document.querySelectorAll('.owned-features__grid .owned-feature-card')];
  const frames = [...document.querySelectorAll('[data-glp-how-frame]')];
  if (cards.length === frames.length && cards.length) {
    const pick = i => {
      cards.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.setAttribute('aria-pressed', String(k === i)); });
      frames.forEach((f, k) => f.classList.toggle('is-on', k === i));
    };
    cards.forEach((c, i) => {
      c.tabIndex = 0; c.setAttribute('role', 'button');
      c.addEventListener('click', () => pick(i));
      c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(i); } });
      if (!reduced) c.addEventListener('mouseenter', () => pick(i));
    });
    pick(0);
  }

  // 02 · One large player; the three requests switch it.
  const demos = [...document.querySelectorAll('[data-glp-demo]')];
  const choose = i => demos.forEach((d, k) => {
    const on = k === i;
    d.classList.toggle('is-on', on);
    d.querySelector('[data-glp-demo-pick]')?.setAttribute('aria-pressed', String(on));
    if (!on) d.querySelector('video')?.pause();
  });
  demos.forEach((d, i) => d.querySelector('[data-glp-demo-pick]')?.addEventListener('click', () => choose(i)));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
}
