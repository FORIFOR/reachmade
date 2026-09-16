/* Progressive enhancement. No analytics, persistence, or hidden submissions.
 * Product previews load same-origin media only; see docs/PRODUCT_FILMS.ja.md.
 */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const lang = document.documentElement.lang;
  const ja = lang.startsWith('ja');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const closeNav = () => { nav?.classList.remove('open'); toggle?.setAttribute('aria-expanded','false'); };
  toggle?.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded',String(!isOpen));
    nav.classList.toggle('open',!isOpen);
  });
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {closeNav(); toggle.focus();}
  });
  nav?.addEventListener('click', event => { if(event.target.closest('a')) closeNav(); });
  document.addEventListener('click', event => {if(toggle && !event.target.closest('.site-header')) closeNav();});
  window.matchMedia('(min-width:901px)').addEventListener('change', closeNav);

  /* Horio Premium responsive composition: the same real proof is moved, never cloned.
   * Wide desktop = copy beside product. Narrow = promise, real product, explanation.
   */
  const hero = document.querySelector('.hero');
  const heroCopy = hero?.querySelector('.hero-copy');
  const heroProof = hero?.querySelector('.hero-proof');
  const heroTitle = heroCopy?.querySelector('h1');
  const narrowHero = window.matchMedia('(max-width:1180px)');
  const placeHeroProof = () => {
    if (!hero || !heroCopy || !heroProof || !heroTitle) return;
    if (narrowHero.matches) {
      if (heroProof.parentElement !== heroCopy || heroProof.previousElementSibling !== heroTitle) heroTitle.after(heroProof);
    } else if (heroProof.parentElement !== hero || heroProof.previousElementSibling !== heroCopy) {
      heroCopy.after(heroProof);
    }
  };
  placeHeroProof();
  narrowHero.addEventListener?.('change', placeHeroProof);

  /* One signature moment only: a 12-second hard-cut reel generated from the six
   * real product recordings. No synthetic frames, no speed changes, no tracking.
   */
  const signatureHost = heroProof?.querySelector('.hero-proof-image');
  if (hero && heroProof && signatureHost) {
    const head = heroProof.querySelector('.study-head');
    const headParts = head?.querySelectorAll('span');
    if (headParts?.[0]) headParts[0].textContent = 'SIGNATURE FILM / 6 REAL PRODUCTS';
    if (headParts?.[1]) headParts[1].textContent = '12 SEC / 1×';
    const caption = heroProof.querySelector('figcaption');
    const captionText = caption?.querySelector('span');
    if (captionText) captionText.textContent = ja
      ? 'Genie → AI Meeting → Oathra → AI Secure → Agent Team → Launchloom。各2秒の実録画を通常速度でつないでいます。'
      : 'Genie → AI Meeting → Oathra → AI Secure → Agent Team → Launchloom. Two real seconds from each product, at normal speed.';
    const captionLink = caption?.querySelector('a');
    if (captionLink) {
      captionLink.href = ja ? '/products/' : '/en/products/';
      captionLink.textContent = ja ? '6製品を見る' : 'Explore all six';
      captionLink.removeAttribute('target');
      captionLink.removeAttribute('rel');
    }

    const stage = document.createElement('div'); stage.className = 'rm-signature-stage';
    const video = document.createElement('video'); video.className = 'rm-signature-video';
    video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = true; video.preload = 'none';
    video.poster = '/assets/reachmade-signature.jpg';
    video.setAttribute('aria-label', ja ? 'Reachmade 6製品の実録画12秒リール' : 'Reachmade 12-second reel of six real product recordings');
    const play = document.createElement('button'); play.type = 'button'; play.className = 'rm-signature-play';
    play.textContent = ja ? '12秒の実演を見る ▶' : 'Watch the 12-second reel ▶';
    stage.append(video, play); signatureHost.replaceChildren(stage); heroProof.dataset.signatureReady = 'true';

    const wideSignature = window.matchMedia('(min-width:1181px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    let ratio = 0;
    const canAuto = () => wideSignature.matches && !reducedMotion.matches && !connection?.saveData && ratio >= .35 && !document.hidden;
    const ensureSource = () => {
      if (!video.hasAttribute('src')) { video.src = '/assets/reachmade-signature.mp4'; video.controls = true; video.load(); }
    };
    const start = () => {
      ensureSource();
      video.play().then(() => { play.hidden = true; }).catch(() => { play.hidden = false; });
    };
    const stopAuto = () => { if (!video.paused) video.pause(); };
    const reevaluate = () => { if (canAuto()) start(); else if (wideSignature.matches === false || reducedMotion.matches || connection?.saveData || document.hidden || ratio < .35) stopAuto(); };
    play.addEventListener('click', start);
    video.addEventListener('playing', () => { play.hidden = true; });
    video.addEventListener('pause', () => { play.hidden = false; play.textContent = ja ? '再開 ▶' : 'Resume ▶'; });
    video.addEventListener('error', () => { play.hidden = false; play.textContent = ja ? '6製品を見る' : 'Explore all six'; play.onclick = () => { location.href = ja ? '/products/' : '/en/products/'; }; });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { ratio = entries[0]?.isIntersecting ? entries[0].intersectionRatio : 0; reevaluate(); }, {threshold:[0,.35,.75,1]});
      observer.observe(stage);
    }
    wideSignature.addEventListener?.('change', reevaluate);
    reducedMotion.addEventListener?.('change', reevaluate);
    connection?.addEventListener?.('change', reevaluate);
    document.addEventListener('visibilitychange', reevaluate);
    window.addEventListener('pagehide', stopAuto);
  }

  const filters = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.product-directory [data-category]')];
  const count = document.querySelector('.filter-count');
  const setFilter = filter => {
    filters.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.filter === filter)));
    cards.forEach(card => {card.hidden = filter !== 'all' && card.dataset.category !== filter;});
    if(count) count.textContent = `${cards.filter(card=>!card.hidden).length} ${count.dataset.countSuffix}`;
  };
  filters.forEach(button => button.addEventListener('click',()=>setFilter(button.dataset.filter)));
  function revealHashTarget(){
    let id;
    try {id = decodeURIComponent(location.hash.slice(1));} catch {return;}
    const target = document.getElementById(id);
    if(target?.hasAttribute('data-category')) {setFilter('all');}
  }
  window.addEventListener('hashchange',revealHashTarget);
  revealHashTarget();

  const copy = document.getElementById('copy-brief');
  const topic = document.getElementById('topic');
  const brief = document.getElementById('brief');
  const timing = document.getElementById('timing');
  const status = document.querySelector('.copy-status');
  const fallback = document.getElementById('copy-fallback');
  const params = new URLSearchParams(location.search);
  const productNames = {'genie':'Genie','ai-meeting':'AI Meeting','oathra':'Oathra','aisecure':'AI Secure','agent-team':'Agent Team','launchloom':'Launchloom'};
  const chosenProduct = productNames[params.get('product')];
  const service = params.get('service');
  if(topic && /^(01|02|03)$/.test(service || '')) topic.selectedIndex = Number(service)-1;
  if(brief && chosenProduct) brief.value = lang==='ja'?`${chosenProduct}の技術を活かした開発について相談したいです。\n\n`:`I would like to discuss a project using the technology behind ${chosenProduct}.\n\n`;
  copy?.addEventListener('click', async () => {
    const text = brief.value.trim();
    if(!text) {
      status.textContent = lang==='ja'?'対象業務・実現したいことを入力してください。':'Please describe the workflow or idea.';
      brief.setAttribute('aria-invalid','true'); brief.focus(); return;
    }
    brief.removeAttribute('aria-invalid');
    const content = lang==='ja'
      ? `Reachmade Labへの開発相談\n\n【相談内容】${topic.value}\n\n【対象業務・実現したいこと】\n${text}\n\n【時期・現在の状況】\n${timing.value.trim() || '未定'}\n`
      : `Project inquiry for Reachmade Lab\n\nTopic: ${topic.value}\n\nWorkflow / idea:\n${text}\n\nTiming / stage:\n${timing.value.trim() || 'Not decided yet'}\n`;
    copy.disabled=true; fallback.hidden=true;
    try {
      if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      status.textContent = lang==='ja'?'コピーしました。まだ送信していません。相談フォームに貼り付けてください。':'Copied. Nothing has been sent. Paste this into the inquiry form.';
    } catch {
      fallback.value=content; fallback.hidden=false; fallback.focus(); fallback.select();
      status.textContent = lang==='ja'?'自動コピーを利用できません。下の文章を選択してコピーしてください。まだ送信していません。':'Automatic copying is unavailable. Select and copy the text below. Nothing has been sent.';
    } finally {copy.disabled=false;}
  });

  // Leave the existing static previews intact if scripts cannot be loaded.
  if (document.querySelector('.hero-proof-image, .project-visual, .compact-product')) {
    const films = document.createElement('script');
    films.src = '/assets/product-films.js?v=20260917-signature1';
    films.defer = true;
    films.addEventListener('load', () => {
      if (!hero) return;
      const hint = document.querySelector('.selected-work .rm-film-hint');
      if (hint) hint.textContent = ja
        ? '自動で動くのはトップの12秒Signature Filmだけです。個別製品の実録画は再生ボタンから確認できます。'
        : 'Only the 12-second Signature Film moves automatically. Individual product recordings remain manual.';
    });
    document.head.append(films);
  }
})();