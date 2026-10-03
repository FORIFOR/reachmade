/* 2026-10 redesign — progressive enhancement only. Without this file every section, link and video works as written.
 * Nothing plays by itself: the only video started here is the Agent Team preview while a pointer rests on its row.
 * No storage, tracking or network calls besides images and the video a visitor points at. */
const root = document.body;
if (root?.dataset.rd) {
  const doc = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* Scroll progress */
  const bar = document.querySelector('.rd-progress');
  const reels = $$('[data-rd-reel]').map(section => ({section, frame: section.querySelector('[data-rd-frame]'), from: Number(section.dataset.rdFilmScale || .5)}));
  const scaleOn = () => !reduced && matchMedia('(min-width:760px)').matches;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const h = doc.scrollHeight - doc.clientHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, doc.scrollTop / h) : 0})`;
    for (const {section, frame, from} of reels) {
      if (!frame) continue;
      if (!scaleOn()) { frame.style.transform = ''; frame.style.borderRadius = ''; continue; }
      const r = section.getBoundingClientRect();
      let t = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / innerHeight));
      t = 1 - Math.pow(1 - t, 3);
      frame.style.transform = `scale(${from + (1 - from) * t})`;
      frame.style.borderRadius = `${12 - 8 * t}px`;
    }
  };
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', requestScroll, {passive: true});
  addEventListener('resize', requestScroll);
  onScroll();

  /* Tokyo clock (home) */
  const clock = document.querySelector('[data-rd-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('ja-JP', {timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
    const tick = () => { clock.textContent = `TOKYO ${fmt.format(new Date())}`; };
    tick(); clock.hidden = false; setInterval(tick, 1000);
  }

  /* Hero capsule: cycles through the product screens (static under reduced motion) */
  const rows = $$('[data-rd-row]');
  const capImg = document.querySelector('[data-rd-cap-img]'), capLabel = document.querySelector('[data-rd-cap-label]');
  if (capImg && rows.length && !reduced) {
    const items = rows.map(a => ({src: a.dataset.rdPreview, label: `${a.querySelector('.rd-row-index')?.textContent || ''} ${a.querySelector('.rd-row-name')?.textContent || ''}`.trim()}));
    let i = 0;
    setInterval(() => { i = (i + 1) % items.length; capImg.src = items[i].src; if (capLabel) capLabel.textContent = items[i].label; }, 1800);
  }

  if (!reduced) {
    /* Intro */
    $$('[data-rd-line]').forEach((el, i) => el.animate([{transform: 'translateY(110%)'}, {transform: 'translateY(0)'}], {duration: 1300, delay: 150 + i * 260, easing: ease, fill: 'both'}));
    $$('[data-rd-arrow]').forEach(el => el.animate([{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 1400, delay: 420, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'both'}));
    $$('.rd-arrow .rd-head').forEach(el => el.animate([{opacity: 0, transform: 'translateX(-24px)'}, {opacity: 1, transform: 'none'}], {duration: 700, delay: 1600, easing: ease, fill: 'both'}));
    $$('[data-rd-capsule]').forEach(el => el.animate([{opacity: 0, transform: 'scale(.6)'}, {opacity: 1, transform: 'none'}], {duration: 900, delay: 1500, easing: ease, fill: 'both'}));
    $$('[data-rd-fade]').forEach((el, i) => el.animate([{opacity: 0, transform: 'translateY(16px)'}, {opacity: 1, transform: 'none'}], {duration: 1000, delay: 1100 + i * 120, easing: ease, fill: 'both'}));

    /* Scroll reveal: only elements that start below the fold are hidden, and only from here. */
    if ('IntersectionObserver' in window) {
      const pending = $$('[data-rd-reveal]').filter(el => el.getBoundingClientRect().top > innerHeight);
      pending.forEach(el => el.setAttribute('data-rd-hidden', ''));
      let batch = 0, frame = 0;
      const io = new IntersectionObserver(entries => {
        const now = performance.now();
        if (now - frame > 120) { batch = 0; frame = now; }
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          io.unobserve(el);
          el.removeAttribute('data-rd-hidden');
          el.animate([{opacity: 0, transform: 'translateY(40px)'}, {opacity: 1, transform: 'none'}], {duration: 1100, delay: (batch++) * 75, easing: ease, fill: 'backwards'});
        }
      }, {rootMargin: '0px 0px -6% 0px'});
      pending.forEach(el => io.observe(el));
    }
  }

  /* Cursor preview on the home product list: fine pointers with hover only, never under reduced motion. */
  const list = document.querySelector('[data-rd-rows]');
  if (list && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(forced-colors: active)').matches) {
    const card = document.createElement('div');
    card.className = 'rd-cursor'; card.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img'); img.alt = '';
    const label = document.createElement('span');
    card.append(img, label);
    document.body.append(card);
    let film = null, hovering = false, active = null;
    const P = {x: -999, y: -999, tx: -999, ty: -999, show: 0};
    const stopFilm = () => { if (film) { film.pause(); film.hidden = true; } };
    const activate = row => {
      if (row === active) return;
      active = row;
      img.src = row.dataset.rdPreview;
      const filmSrc = row.dataset.rdFilm;
      label.textContent = filmSrc && !saveData ? row.dataset.rdFilmLabel : row.dataset.rdLabel;
      if (filmSrc && !saveData) {
        if (!film) {
          film = document.createElement('video');
          film.muted = true; film.loop = true; film.playsInline = true; film.preload = 'none';
          film.setAttribute('muted', ''); film.setAttribute('playsinline', '');
          card.insertBefore(film, label);
        }
        if (film.getAttribute('src') !== filmSrc) film.src = filmSrc;
        film.hidden = false;
        film.play().catch(stopFilm);
      } else stopFilm();
    };
    for (const row of rows) row.addEventListener('pointerenter', () => { hovering = true; activate(row); });
    list.addEventListener('pointerleave', () => { hovering = false; stopFilm(); active = null; });
    addEventListener('pointermove', e => { P.tx = e.clientX; P.ty = e.clientY; }, {passive: true});
    const loop = () => {
      if (P.x < -900) { P.x = P.tx; P.y = P.ty; }
      P.x += (P.tx - P.x) * .14; P.y += (P.ty - P.y) * .14;
      P.show += ((hovering ? 1 : 0) - P.show) * .16;
      const rot = Math.max(-8, Math.min(8, (P.tx - P.x) * .05));
      card.style.opacity = P.show.toFixed(3);
      card.style.transform = `translate3d(${P.x + 28}px, ${P.y - 120}px, 0) rotate(${rot}deg) scale(${.86 + .14 * P.show})`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
