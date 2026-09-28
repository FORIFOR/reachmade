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
        video.src = `/media/products/${c.dataset.studioChoice}.mp4`;
        clearTimeout(timer); timer = setTimeout(fail, 10000);
        play(video, () => { if (thisEpoch === epoch) fail(); });
      }, started ? 380 : 0);
    };
    const begin = i => {
      pauseAll(video); stage?.stop();
      started = true; frame.classList.add('is-started'); start.hidden = true; cap.hidden = false;
      tag.textContent = `${(choices[i] && choices[i].dataset.kind) || '実録画'} · 編集あり`;
      load(i);
    };
    const toggle = () => {
      if (!started) return begin(slide);
      if (video.paused) { pauseAll(video); stage?.stop(); play(video, fail); } else video.pause();
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

  /* Product chapters with a sticky stage on wide screens. */
  const section = $('.v4-products'), stageEl = $('[data-v4-stage]'), chapters = $$('[data-v4-chapter]');
  let stage = null;
  if (section && stageEl && chapters.length) {
    const v = $('[data-v4-stage-video]', stageEl), toggleBtn = $('[data-v4-stage-toggle]', stageEl), sw = $('[data-v4-switch]', stageEl);
    const status = $('[data-v4-stage-status]', stageEl), tag = $('[data-v4-stage-tag] span', stageEl);
    const modes = $$('[data-v4-mode]', stageEl), dots = $$('[data-v4-dot]', stageEl), stills = $$('[data-v4-stage-still]', stageEl);
    let cur = 0, mode = 'rec', timer;
    const ch = () => chapters[cur];
    const isFilm = () => mode === 'film' && Boolean(ch().dataset.v4FilmSrc);
    const paint = () => {
      const c = ch(), film = isFilm(), key = film ? `${c.dataset.v4Chapter}-film` : c.dataset.v4Chapter;
      chapters.forEach((a, k) => a.classList.toggle('is-current', k === cur));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === cur));
      stills.forEach(s => s.classList.toggle('is-on', s.dataset.v4StageStill === key));
      $('[data-v4-stage-index]', stageEl).textContent = c.dataset.index;
      $('[data-v4-stage-disc]', stageEl).textContent = c.dataset.disc;
      $('[data-v4-stage-name]', stageEl).textContent = c.dataset.name;
      $('[data-v4-stage-clip]', stageEl).textContent = film ? '15秒の紹介映像（演出を含む）' : c.dataset.clip;
      tag.textContent = film ? '紹介映像 · 演出を含む' : `${c.dataset.kind || '実録画'} · 約13秒 · 1× · 編集あり`;
      { const proof = document.querySelector('[data-v4-stage-proof]'); if (proof) proof.textContent = film ? '15秒の紹介映像です。演出を含み、実録画ではありません。' : (c.dataset.proof || ''); }
      sw.hidden = !c.dataset.v4FilmSrc;
      modes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v4Mode === mode)));
      v.classList.toggle('v4-crop', !film); v.classList.toggle('v4-full', film);
      v.setAttribute('aria-label', `${c.dataset.name} ${film ? '紹介映像（音声あり・演出を含む）' : `${c.dataset.kind || '実録画'}（無音・編集あり）`}`);
    };
    const stop = () => { clearTimeout(timer); if (!v.paused) v.pause(); };
    const reset = () => {
      stop(); v.removeAttribute('src'); v.load(); stageEl.classList.remove('is-live', 'is-playing'); status.hidden = true;
      stageEl.style.setProperty('--p', '0'); $('[data-v4-stage-fill]', stageEl).style.setProperty('--p', '0');
      $('[data-v4-stage-time]', stageEl).textContent = '00:00 / 00:--'; toggleBtn.setAttribute('aria-label', '再生');
    };
    const fail = () => { reset(); status.textContent = '映像を読み込めませんでした。製品ページからもご覧いただけます。'; status.hidden = false; };
    const setChap = i => { if (i === cur) return; cur = i; mode = 'rec'; reset(); paint(); };
    const toggle = () => {
      if (!v.paused) return v.pause();
      const c = ch(), src = isFilm() ? c.dataset.v4FilmSrc : `/media/products/${c.dataset.v4Chapter}.mp4`;
      if (!v.getAttribute('src')) v.src = src;
      v.muted = !isFilm();
      pauseAll(v); status.hidden = true;
      clearTimeout(timer); timer = setTimeout(fail, 10000);
      play(v, fail);
    };
    toggleBtn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    v.addEventListener('playing', () => { clearTimeout(timer); stageEl.classList.add('is-live', 'is-playing'); toggleBtn.setAttribute('aria-label', '一時停止'); });
    v.addEventListener('pause', () => { stageEl.classList.remove('is-playing'); toggleBtn.setAttribute('aria-label', '再生'); });
    v.addEventListener('waiting', () => { clearTimeout(timer); timer = setTimeout(fail, 10000); });
    v.addEventListener('error', () => { if (v.getAttribute('src')) fail(); });
    v.addEventListener('ended', () => { stageEl.classList.remove('is-playing'); v.currentTime = 0; });
    v.addEventListener('timeupdate', () => {
      if (!v.duration) return;
      $('[data-v4-stage-fill]', stageEl).style.setProperty('--p', String(v.currentTime / v.duration));
      $('[data-v4-stage-time]', stageEl).textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
    });
    modes.forEach(b => b.addEventListener('click', () => { if (b.dataset.v4Mode === mode) return; mode = b.dataset.v4Mode; reset(); paint(); }));
    stage = {stop: () => { if (!v.paused) v.pause(); }};

    const wide = matchMedia('(min-width:1000px)');
    let io;
    const apply = () => {
      const on = wide.matches && 'IntersectionObserver' in window;
      section.classList.toggle('v4-staged', on); stageEl.hidden = !on;
      io?.disconnect(); io = null;
      if (!on) { reset(); return; }
      io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setChap(chapters.indexOf(e.target)); }), {rootMargin: '-50% 0px -50% 0px'});
      chapters.forEach(a => io.observe(a));
      paint();
    };
    wide.addEventListener('change', apply);
    apply();
    // Narrow screens: inline native players; one plays at a time.
    chapters.forEach(a => $('video', a)?.addEventListener('play', e => pauseAll(e.target)));
  }

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
