/* Progressive enhancement. No analytics, persistence, or hidden submissions.
 * Product previews load same-origin media only; see docs/PRODUCT_FILMS.ja.md.
 */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const lang = document.documentElement.lang;
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
    films.src = '/assets/product-films.js?v=20260916-premium1';
    films.defer = true;
    document.head.append(films);
  }
})();
