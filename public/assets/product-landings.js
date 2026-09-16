/* Only an explicit click loads a recording. No forms, analytics or AI calls. */
(() => {
  'use strict';
  const ja = document.documentElement.lang === 'ja';
  const allowed = new Set(['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']);
  const films = [...document.querySelectorAll('.owned-film')];
  for (const film of films) {
    const video = film.querySelector('video'), button = film.querySelector('.owned-film__play'), status = film.querySelector('.owned-film__status');
    if (!video || !button || !status) continue;
    let pending = false;
    const failed = () => {
      pending = false; button.disabled = false; button.hidden = false;
      button.textContent = ja ? 'もう一度再生する ▶' : 'Try playback again ▶';
      status.hidden = false;
      status.textContent = ja ? '録画を読み込めませんでした。再試行するか、元の録画から確認してください。' : 'The recording could not be loaded. Retry or open the source recording.';
    };
    button.addEventListener('click', async () => {
      if (pending) return;
      const src = video.dataset.recordingSrc || '';
      const match = /^\/media\/products\/([a-z0-9-]+)\.mp4$/.exec(src);
      if (!match || !allowed.has(match[1])) { failed(); return; }
      pending = true; button.disabled = true;
      status.hidden = false; status.textContent = ja ? '実録画を読み込んでいます…' : 'Loading the real recording…';
      try {
        if (!video.getAttribute('src') || video.error) { video.src = src; video.load(); }
        video.muted = true;
        await video.play();
        button.hidden = true; status.hidden = true;
      } catch { failed(); }
      finally { pending = false; button.disabled = false; }
    });
    video.addEventListener('error', failed);
    video.addEventListener('play', () => {
      films.forEach(other => { const v = other.querySelector('video'); if (v && v !== video) v.pause(); });
    });
  }
  const pause = () => films.forEach(film => film.querySelector('video')?.pause());
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
})();
