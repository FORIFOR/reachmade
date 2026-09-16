/* Reachmade product films. Progressive enhancement; no tracking or persistence.
 * The homepage has one automatic signature moment: the real hero recording.
 * Other recordings are manual. Media is served through a fixed, same-origin allowlist.
 */
(() => {
  'use strict';
  if (window.__reachmadeFilms) return;
  const ja = document.documentElement.lang.startsWith('ja');
  const words = ja ? {
    play:'再生', pause:'一時停止', loading:'読み込み中', expand:'全編を大きく見る', close:'閉じる',
    preview:'無音プレビュー', recorded:'公開済みの実画面から',
    error:'動画を読み込めませんでした。', original:'製品サイトで実演を見る',
    hint:'画面内の動画だけを無音再生します。停止・拡大できます。',
    motion:'自動再生はオフです。再生ボタンからご覧ください。',
    homeAuto:'最初の実演1本だけを無音再生します。ほかの動画は再生ボタンからご覧ください。',
  } : {
    play:'Play', pause:'Pause', loading:'Loading', expand:'Watch the full film', close:'Close',
    preview:'Silent preview', recorded:'From the published recording',
    error:'The film could not be loaded.', original:'View the original demonstration',
    hint:'Only the film in view plays, without sound. Pause or open the full recording.',
    motion:'Autoplay is off. Use Play to watch a film.',
    homeAuto:'Only the first real product recording plays automatically. Use Play for the remaining films.',
  };
  const films = [
    {id:'genie',name:'Genie',repo:'genie',start:0,end:14,
      demo:'https://genie-forifor.forifor.chatgpt.site/#demo',
      note:ja?'実アプリの録画。待ち時間を短縮しています。':'Real app capture; waiting is condensed.'},
    {id:'ai-meeting',name:'AI Meeting',repo:'AI-meeting',start:4,end:18,
      demo:'https://ai-meeting.forifor.chatgpt.site/#full-film',
      note:ja?'合成した日本語入力と実際のAI応答による録画。録画用レイアウトを使用。':'Recorded with synthetic Japanese input, real AI responses and a recording layout.'},
    {id:'oathra',name:'Oathra',repo:'oathra',start:6,end:20,
      demo:'https://forifor.github.io/oathra/',
      note:ja?'シミュレーターの録画。実電話や店舗への登録完了を示すものではありません。':'Simulator recording; not a live call or proof of a booking-system entry.'},
    {id:'aisecure',name:'AI Secure',repo:'AISecure',start:0,end:14,
      demo:'https://forifor.github.io/AISecure/',
      note:ja?'合成データによる調査画面。実環境の監視・遮断は行いません。':'Investigation UI on synthetic data; no live monitoring or blocking.'},
    {id:'agent-team',name:'Agent Team',repo:'Multibot',start:5,end:19,
      demo:'https://forifor.github.io/Multibot/ja/#record',
      note:ja?'実モデル実行の編集リプレイ。元の実行は約24分、出典照合を残して部分完了。':'Edited replay of a real model run: about 24 minutes, ending partial with source verification unfinished.'},
    {id:'launchloom',name:'Launchloom',repo:'Launchloom',start:3,end:17,
      demo:'https://forifor.github.io/Launchloom/',
      note:ja?'実録画からLaunchloomで作成した紹介映像。外部SNSへの投稿実演ではありません。':'A product film made by Launchloom from real footage; not a live social-publishing demo.'},
  ];
  const isHome = !!document.querySelector('.hero') && !!document.querySelector('.selected-work');
  const targets = [];
  for (const film of films) {
    const row = document.getElementById(film.id);
    const visual = row?.querySelector('.project-visual');
    if (visual) { row.classList.add('rm-film-row'); targets.push({film,host:visual}); }
    if (!isHome) {
      for (const card of document.querySelectorAll('.compact-product')) {
        if ([...card.querySelectorAll('a[href]')].some(a => a.href === `https://github.com/FORIFOR/${film.repo}`)) {
          card.classList.add('rm-film-card');
          const host = document.createElement('div'); host.className='rm-film-card-visual';
          card.prepend(host); targets.push({film,host});
        }
      }
    }
    const hero = document.querySelector(`.hero-proof-image img[src$="/${film.id}.jpg"]`);
    if (hero) {hero.parentElement.classList.add('rm-film-hero');targets.push({film,host:hero.parentElement});}
  }
  if (!targets.length) return;
  window.__reachmadeFilms = true;
  const style = document.createElement('link');
  style.rel='stylesheet'; style.href='/assets/product-films.css?v=20260916-premium1'; document.head.append(style);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 1181px)');
  const connection = navigator.connection;
  const canAuto = () => wide.matches && !reduced.matches && !connection?.saveData && 'IntersectionObserver' in window;
  const states = [];
  let active=null, opened=false, opener=null, sequence=0;
  const el = (tag,cls,text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const button = (text,cls) => {const b=el('button',cls,text);b.type='button';return b;};
  const source = film => `/media/products/${film.id}.mp4`;

  const dialog=el('dialog','rm-film-dialog');
  dialog.setAttribute('aria-labelledby','rm-film-dialog-title');
  dialog.setAttribute('aria-describedby','rm-film-dialog-note');
  const dialogHead=el('div','rm-film-dialog-head');
  const dialogTitle=el('h2','');dialogTitle.id='rm-film-dialog-title';
  const close=button(words.close,'rm-film-close');dialogHead.append(dialogTitle,close);
  const full=el('video','rm-film-full');full.controls=true;full.playsInline=true;full.preload='none';full.muted=true;
  const dialogNote=el('p','rm-film-dialog-note');dialogNote.id='rm-film-dialog-note';
  const original=el('a','rm-film-original',words.original);original.target='_blank';original.rel='noopener noreferrer';
  const fullError=el('p','rm-film-error',words.error);fullError.hidden=true;fullError.setAttribute('role','status');
  dialog.append(dialogHead,full,fullError,dialogNote,original);document.body.append(dialog);
  const isVisible = s => !s.host.closest('[hidden]') && s.ratio >= .35;
  const setLabel = s => {
    s.toggle.textContent=s.want ? words.pause : words.play;
    s.toggle.setAttribute('aria-label',`${s.film.name}: ${s.want ? words.pause : words.play}`);
    s.stage.dataset.playing=String(!s.video.paused);
    s.status.textContent=s.starting ? words.loading : words.preview;
  };
  function stop(s) {s.want=false;s.video.pause();setLabel(s);}
  function stopAll() {for(const s of states)stop(s);active=null;}
  function fail(s) {
    const disclose = s.manual === true;
    s.failed=true;s.starting=false;s.want=false;s.video.pause();
    if (!disclose) {s.video.removeAttribute('src');s.video.load();}
    s.error.hidden=!disclose;s.fallback.hidden=!disclose;setLabel(s);
    if(active===s)active=null;
  }
  function start(s) {
    if(s.failed||s.want||s.starting)return;
    s.want=true;s.starting=true;setLabel(s);
    if(!s.video.hasAttribute('src')) {s.video.src=source(s.film);s.video.load();}
    s.video.muted=true;
    let result;try {result=s.video.play();} catch {s.starting=false;s.want=false;setLabel(s);return;}
    Promise.resolve(result).then(()=>{
      s.starting=false;if(!s.want)s.video.pause();setLabel(s);
    }).catch(error=>{
      s.starting=false;s.want=false;setLabel(s);
      if(error.name==='NotAllowedError')s.manual=false;
      else if(error.name!=='AbortError')fail(s);
    });
  }
  function choose() {
    if(document.hidden||opened){stopAll();return;}
    const eligible=states.filter(s=>!s.failed&&isVisible(s)&&(s.manual===true||(s.autoEligible&&s.manual!==false&&canAuto())));
    eligible.sort((a,b)=>(b.manual===true?1:0)-(a.manual===true?1:0)||(b.manualOrder-a.manualOrder)||(b.ratio-a.ratio));
    const next=eligible[0]||null;
    for(const s of states)if(s!==next&&s.want)stop(s);
    active=next;if(next)start(next);
  }
  function openFilm(s,from) {
    if(typeof dialog.showModal!=='function'){window.open(s.film.demo,'_blank','noopener,noreferrer');return;}
    opened=true;opener=from;stopAll();
    dialogTitle.textContent=s.film.name;dialogNote.textContent=s.film.note;original.href=s.film.demo;
    fullError.hidden=true;full.poster=s.poster;full.src=source(s.film);full.muted=true;full.load();
    dialog.showModal();close.focus();full.play().catch(()=>{});
  }
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{opened=false;full.pause();full.removeAttribute('src');full.load();fullError.hidden=true;opener?.focus();choose();});
  full.addEventListener('error',()=>{if(opened)fullError.hidden=false;});

  for (const {film,host} of targets) {
    const poster=host.querySelector('img')?.getAttribute('src')||`/assets/products/${film.id}.jpg`;
    const frame=el('figure','rm-film');frame.dataset.productFilm=film.id;
    const stage=el('div','rm-film-stage');
    const video=el('video','rm-film-preview');video.playsInline=true;video.muted=true;video.defaultMuted=true;
    video.preload='none';video.poster=poster;video.setAttribute('aria-label',`${film.name}: ${words.preview}`);
    const progress=el('progress','rm-film-progress');progress.max=1;progress.value=0;progress.setAttribute('aria-hidden','true');
    stage.append(video,progress);
    const toolbar=el('div','rm-film-toolbar');
    const toggle=button(words.play,'rm-film-toggle');
    const status=el('span','rm-film-state',words.preview);
    const expand=button(words.expand,'rm-film-expand');expand.setAttribute('aria-haspopup','dialog');expand.setAttribute('aria-label',`${film.name}: ${words.expand}`);
    toolbar.append(toggle,status,expand);
    const note=el('figcaption','rm-film-note',film.note);
    const error=el('p','rm-film-error',words.error);error.hidden=true;error.setAttribute('role','status');
    const fallback=el('a','rm-film-original',words.original);fallback.href=film.demo;fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.hidden=true;
    frame.append(stage,toolbar,note,error,fallback);host.replaceChildren(frame);
    const s={film,host,frame,stage,video,progress,toggle,status,error,fallback,poster,ratio:0,manual:null,manualOrder:0,want:false,starting:false,failed:false,autoEligible:!!host.closest('.hero')};
    states.push(s);setLabel(s);
    video.addEventListener('loadedmetadata',()=>{if(Number.isFinite(video.duration)&&video.duration>film.start+1)video.currentTime=film.start;});
    video.addEventListener('timeupdate',()=>{
      const end=Math.min(film.end,Number.isFinite(video.duration)?video.duration:film.end);
      const begin=film.start<end?film.start:0;
      progress.value=Math.max(0,Math.min(1,(video.currentTime-begin)/Math.max(1,end-begin)));
      if(s.want&&video.currentTime>=end-.1)video.currentTime=begin;
    });
    video.addEventListener('ended',()=>{if(s.want){video.currentTime=0;video.play().catch(()=>{s.want=false;setLabel(s);});}});
    video.addEventListener('playing',()=>{s.starting=false;setLabel(s);});
    video.addEventListener('pause',()=>setLabel(s));
    video.addEventListener('error',()=>fail(s));
    toggle.addEventListener('click',()=>{
      if(s.want){s.manual=false;stop(s);if(active===s)active=null;}
      else {s.manual=true;s.manualOrder=++sequence;s.failed=false;s.error.hidden=true;s.fallback.hidden=true;
        for(const other of states)if(other!==s)stop(other);
        if(s.video.error){s.video.removeAttribute('src');s.video.load();}
        active=s;start(s);
      }
    });
    expand.addEventListener('click',()=>openFilm(s,expand));
  }
  const intro=document.querySelector('.selected-work .section-title')||document.querySelector('.page-intro');
  const hint=el('p','rm-film-hint');
  const explain=()=>{hint.textContent=isHome?(canAuto()?words.homeAuto:words.motion):(canAuto()?words.hint:words.motion);};explain();intro?.append(hint);
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){const s=states.find(x=>x.stage===entry.target);if(s)s.ratio=entry.isIntersecting?entry.intersectionRatio:0;}
      choose();
    },{threshold:[0,.35,.5,.75,1]});
    for(const s of states)observer.observe(s.stage);
  }
  reduced.addEventListener?.('change',()=>{explain();choose();});
  wide.addEventListener?.('change',()=>{explain();choose();});
  connection?.addEventListener?.('change',()=>{explain();choose();});
  document.addEventListener('visibilitychange',choose);
  window.addEventListener('pagehide',stopAll);
  window.addEventListener('pageshow',choose);
  document.addEventListener('click',e=>{if(e.target.closest('[data-filter]'))requestAnimationFrame(choose);});
  window.addEventListener('hashchange',()=>requestAnimationFrame(choose));
})();
