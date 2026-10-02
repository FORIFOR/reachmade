/* Localized home v4 — progressive enhancement only. Nothing plays by itself; no storage, tracking or network calls besides
 * the video files a visitor asks to play. Without this file every video keeps its native controls. */
const root = document.querySelector('[data-home-v4-root]');
if (root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const $ = (s, el = root) => el.querySelector(s), $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const pauseAll = except => document.querySelectorAll('video').forEach(v => { if (v !== except && !v.paused) v.pause(); });
  const play = (v, onFail) => { const p = v.play(); if (p) p.catch(onFail); };
  // A native player started by the visitor pauses any other recording on this page.
  document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => pauseAll(video)));
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

  /* Scroll reveal */
  const reveal = $$('[data-v4-reveal]');
  if (reduced || !('IntersectionObserver' in window)) reveal.forEach(el => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), {rootMargin: '0px 0px -10% 0px'});
    reveal.forEach(el => io.observe(el));
  }

  /* Reel: choose a still first, then start its recording explicitly. */
  const frame = $('[data-v4-reel]');
  if (frame) {
    const video = $('.v4-reel-video', frame), start = $('[data-v4-reel-start]', frame), cap = $('[data-v4-reel-cap]', frame);
    const tag = $('[data-v4-reel-tag] span', frame), rail = $('.v4-rail', frame), choices = $$('[data-v4-choice]', frame), stills = $$('[data-v4-still]', frame);
    const panel = $('#v4-reel-panel', frame);
    let selected = 0, started = false, timer, epoch = 0;
    video.controls = true;
    video.tabIndex = -1;
    if (saveData) video.preload = 'none';
    start.hidden = false;
    tag.setAttribute('role', 'status');
    rail.setAttribute('role', 'tablist');
    panel.setAttribute('role', 'tabpanel');
    const show = i => {
      const c = choices[i];
      stills.forEach((s, k) => s.classList.toggle('is-on', k === i));
      choices.forEach((choice, k) => {
        const on = k === i;
        choice.classList.toggle('is-on', on);
        choice.setAttribute('aria-selected', String(on));
        choice.tabIndex = on ? 0 : -1;
        choice.style.setProperty('--fill', '0');
      });
      panel.setAttribute('aria-labelledby', c.id);
      video.poster = c.dataset.poster || stills[i].currentSrc || stills[i].getAttribute('src');
      $('[data-v4-reel-index]', frame).textContent = c.dataset.index;
      $('[data-v4-reel-disc]', frame).textContent = c.dataset.disc;
      $('[data-v4-reel-name]', frame).textContent = c.dataset.name;
      $('[data-v4-reel-proof]').textContent = c.dataset.proof;
      $('[data-v4-reel-clip]', frame).textContent = c.dataset.clip;
      $('[data-v4-reel-time]', frame).textContent = '00:00 / 00:--';
      video.setAttribute('aria-label', c.dataset.videoLabel);
      start.setAttribute('aria-label', c.dataset.playLabel);
      $('strong', start).textContent = c.dataset.playCopy;
    };
    const reset = () => {
      ++epoch;
      clearTimeout(timer);
      started = false;
      video.pause();
      video.tabIndex = -1;
      frame.classList.remove('is-started', 'is-playing');
      video.classList.remove('is-fading');
      cap.hidden = false;
      start.hidden = false;
    };
    const select = i => {
      reset();
      selected = i;
      show(i);
      tag.textContent = choices[i].dataset.stillLabel;
    };
    const fail = () => {
      reset();
      tag.textContent = root.dataset.reelError;
      if (document.activeElement === video) start.focus({preventScroll: true});
    };
    const begin = () => {
      const thisEpoch = ++epoch, c = choices[selected];
      const source = c.dataset.src || c.dataset.v4Rec;
      if (!source) { fail(); return; }
      pauseAll(video);
      started = true;
      frame.classList.add('is-started');
      start.hidden = true;
      cap.hidden = false;
      video.tabIndex = 0;
      tag.textContent = c.dataset.playingLabel;
      video.src = source;
      clearTimeout(timer); timer = setTimeout(fail, 10000);
      play(video, () => { if (thisEpoch === epoch) fail(); });
      video.focus({preventScroll: true});
    };
    start.addEventListener('click', begin);
    // Native controls own play, pause, seeking and full screen; never intercept video clicks.
    video.addEventListener('playing', () => { clearTimeout(timer); if (started) frame.classList.add('is-playing'); });
    video.addEventListener('pause', () => { clearTimeout(timer); frame.classList.remove('is-playing'); });
    video.addEventListener('waiting', () => { if (started && !video.paused) { clearTimeout(timer); timer = setTimeout(fail, 10000); } });
    video.addEventListener('error', () => { if (started) fail(); });
    video.addEventListener('timeupdate', () => {
      if (!started || !Number.isFinite(video.duration) || !video.duration) return;
      choices[selected].style.setProperty('--fill', String(video.currentTime / video.duration));
      $('[data-v4-reel-time]', frame).textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    });
    video.addEventListener('ended', () => {
      // Keep the native controls available for replay and seeking. No next recording starts.
      clearTimeout(timer);
      frame.classList.remove('is-playing');
    });
    choices.forEach((c, i) => {
      c.id ||= `v4-reel-choice-${i}`;
      c.setAttribute('role', 'tab'); c.setAttribute('aria-controls', 'v4-reel-panel');
      c.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault(); select(i);
      });
      c.addEventListener('keydown', e => {
        const move = {ArrowRight: 1, ArrowLeft: -1}[e.key];
        const n = e.key === 'Home' ? 0 : e.key === 'End' ? choices.length - 1 : move ? (i + move + choices.length) % choices.length : e.key === ' ' ? i : null;
        if (n !== null) { e.preventDefault(); select(n); choices[n].focus(); }
      });
    });
    const heroPlay = $('[data-v4-play]');
    heroPlay?.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({top: frame.getBoundingClientRect().top + scrollY - 84, behavior: reduced ? 'auto' : 'smooth'});
      begin();
    });
    select(0);
    frame.classList.add('is-enhanced');
  }

  /* Closing a product's native disclosure also stops its now-hidden recording. */
  $$('[data-v4-chapter] details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (!details.open) $$('video', details).forEach(video => video.pause());
    });
  });
}
