/* Japanese home v4 — progressive enhancement only. Nothing plays by itself; no storage, tracking or network calls besides
 * the video files a visitor asks to play. Without this file every video keeps its native controls. */
const root = document.querySelector('[data-home-v4-root]');
if (root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const $ = (s, el = root) => el.querySelector(s), $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const pauseAll = except => document.querySelectorAll('video').forEach(v => { if (v !== except && !v.paused) v.pause(); });
  const play = (v, onFail) => { const p = v.play(); if (p) p.catch(onFail); };
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

  /* Scroll reveal */
  const reveal = $$('[data-v4-reveal]');
  if (reduced || !('IntersectionObserver' in window)) reveal.forEach(el => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), {rootMargin: '0px 0px -10% 0px'});
    reveal.forEach(el => io.observe(el));
  }

  /* Reel: six recordings behind one tab rail. */
  const frame = $('[data-v4-reel]');
  if (frame) {
    const video = $('.v4-reel-video', frame), start = $('[data-v4-reel-start]', frame), cap = $('[data-v4-reel-cap]', frame);
    const tag = $('[data-v4-reel-tag] span', frame), rail = $('.v4-rail', frame), choices = $$('[data-v4-choice]', frame), stills = $$('[data-v4-still]', frame);
    const SLIDE_MS = 4200;
    let slide = 0, active = 0, started = false, timer, slideTimer, epoch = 0;
    video.removeAttribute('controls'); video.removeAttribute('poster');
    start.hidden = false;
    rail.setAttribute('role', 'tablist');
    const show = i => {
      stills.forEach((s, k) => s.classList.toggle('is-on', k === i));
      choices.forEach((c, k) => { const on = k === i; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', String(on)); c.tabIndex = on ? 0 : -1; if (!started) c.style.setProperty('--fill', '0'); });
      const c = choices[i];
      $('[data-v4-reel-index]', frame).textContent = c.dataset.index;
      $('[data-v4-reel-disc]', frame).textContent = c.dataset.disc;
    };
    const fail = () => {
      clearTimeout(timer); started = false; frame.classList.remove('is-started', 'is-playing'); cap.hidden = true; start.hidden = false;
      tag.textContent = '読み込めませんでした · 下の各製品から再生できます';
    };
    const load = i => {
      const thisEpoch = ++epoch; active = i; show(i);
      const c = choices[i];
      video.classList.add('is-fading');
      $('[data-v4-reel-name]', frame).textContent = c.dataset.name;
      $('[data-v4-reel-clip]', frame).textContent = c.dataset.clip;
      video.setAttribute('aria-label', `${c.dataset.name} ${c.dataset.kind || '実録画'}（無音・編集あり）`);
      setTimeout(() => {
        if (thisEpoch !== epoch) return;
        video.src = c.dataset.v4Rec;
        clearTimeout(timer); timer = setTimeout(fail, 10000);
        play(video, () => { if (thisEpoch === epoch) fail(); });
      }, started ? 380 : 0);
    };
    const begin = i => {
      pauseAll(video);
      started = true; frame.classList.add('is-started'); start.hidden = true; cap.hidden = false;
      tag.textContent = `${(choices[i] && choices[i].dataset.kind) || '実録画'} · 編集あり`;
      load(i);
    };
    const toggle = () => {
      if (!started) return begin(slide);
      if (video.paused) { pauseAll(video); play(video, fail); } else video.pause();
    };
    start.addEventListener('click', () => begin(slide));
    video.addEventListener('click', toggle);
    video.addEventListener('playing', () => { clearTimeout(timer); video.classList.remove('is-fading'); frame.classList.add('is-playing'); });
    video.addEventListener('pause', () => frame.classList.remove('is-playing'));
    video.addEventListener('waiting', () => { clearTimeout(timer); timer = setTimeout(fail, 10000); });
    video.addEventListener('error', () => { if (started) fail(); });
    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      choices.forEach((c, k) => c.style.setProperty('--fill', k === active ? String(video.currentTime / video.duration) : k < active ? '1' : '0'));
      $('[data-v4-reel-time]', frame).textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    });
    video.addEventListener('ended', () => {
      // Stop when the recording ends. The next product's recording starts only when the visitor chooses it:
      // nothing plays that the visitor did not start.
      started = false; slide = active; frame.classList.remove('is-started', 'is-playing'); cap.hidden = true; start.hidden = false;
      tag.textContent = 'STILL · 製品映像から'; show(slide);
    });
    choices.forEach((c, i) => {
      c.setAttribute('role', 'tab'); c.setAttribute('aria-controls', 'v4-reel-screen');
      c.addEventListener('click', e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); begin(i); });
      c.addEventListener('keydown', e => {
        const move = {ArrowRight: 1, ArrowLeft: -1}[e.key];
        if (move) { e.preventDefault(); const n = (i + move + choices.length) % choices.length; if (started) begin(n); else { slide = n; show(n); } choices[n].focus(); }
      });
    });
    const heroPlay = $('[data-v4-play]');
    heroPlay?.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({top: frame.getBoundingClientRect().top + scrollY - 84, behavior: reduced ? 'auto' : 'smooth'});
      begin(slide);
    });
    show(0);
    // Still-image slideshow before the first press: skipped for reduced motion and data saver.
    if (!reduced && !saveData) {
      const fillTo = () => { const c = choices[slide], f = $('.v4-fill', c); f.style.transition = 'none'; c.style.setProperty('--fill', '0'); requestAnimationFrame(() => requestAnimationFrame(() => { if (started) return; f.style.transition = `width ${SLIDE_MS}ms linear`; c.style.setProperty('--fill', '1'); })); };
      fillTo();
      slideTimer = setInterval(() => { if (started || document.hidden) return; slide = (slide + 1) % choices.length; show(slide); fillTo(); }, SLIDE_MS);
      video.addEventListener('play', () => choices.forEach(c => { const f = $('.v4-fill', c); f.style.transition = 'width .25s linear'; }), {once: false});
    }
  }

  /* Product chapters: each row plays its own inline native player; one video plays at a time. */
  $$('[data-v4-chapter] video').forEach(v => v.addEventListener('play', e => pauseAll(e.target)));

  /* TaskDock design preview frames */
  const next = $('[data-v4-next-root]');
  if (next) {
    const items = $$('li', next), desc = $('[data-v4-next-desc]', next);
    const pick = i => {
      items.forEach((li, k) => { li.classList.toggle('is-on', k === i); $('button', li).setAttribute('aria-pressed', String(k === i)); });
      desc.innerHTML = $('p', items[i]).innerHTML;
    };
    desc.hidden = false; pick(0);
    items.forEach((li, i) => $('button', li).addEventListener('click', () => pick(i)));
  }
}
