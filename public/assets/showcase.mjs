/* Progressive enhancement: no autoplay, tracking, storage or third-party requests. */
const ja = document.documentElement.lang === 'ja';
document.documentElement.classList.add('js');
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#main-nav');
function closeNav(){nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav?.classList.toggle('open',open);});
nav?.addEventListener('click',event=>{if(event.target.closest('a'))closeNav();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){closeNav();toggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeNav();});
window.matchMedia('(min-width:901px)').addEventListener('change',closeNav);

/** A failed or slow recording leaves its real poster, retry, and source links intact. */
function enhancePlayer({host,video,play,image,status,source}){
 let epoch=0,timer,loading=false;
 const initial=play.textContent;
 const stopTimer=()=>{clearTimeout(timer);timer=undefined;};
 const fail=()=>{
  if(!loading&&!host.dataset.playing)return;
  loading=false;delete host.dataset.playing;stopTimer();video.pause();video.hidden=true;
  if(image)image.hidden=false;
  play.hidden=false;play.disabled=false;play.textContent=ja?'再生を再試行':'Retry the recording';
  status.textContent=ja?'録画を読み込めませんでした。再試行するか、製品ページ・元の録画をご覧ください。':'The recording could not be loaded. Retry, or use the product page or source recording.';
  status.hidden=false;host.dataset.mediaState='unavailable';
 };
 const reset=()=>{
  epoch++;loading=false;stopTimer();delete host.dataset.playing;video.pause();video.removeAttribute('src');video.load();video.hidden=true;
  if(image)image.hidden=false;
  play.hidden=false;play.disabled=false;play.textContent=initial;status.hidden=true;status.textContent='';host.dataset.mediaState='poster';
 };
 play.hidden=false;
 play.addEventListener('click',async()=>{
  const thisEpoch=++epoch,url=source();
  if(!/^\/media\/products\/[a-z0-9-]+\.mp4$/.test(url))return;
  loading=true;status.hidden=true;play.disabled=true;play.textContent=ja?'読み込み中…':'Loading…';
  host.dataset.mediaState='loading';stopTimer();timer=setTimeout(fail,10000);
  video.src=url;video.hidden=false;video.controls=true;video.muted=true;
  try{
   await video.play();
   if(thisEpoch!==epoch)return;
   loading=false;stopTimer();if(image)image.hidden=true;play.hidden=true;play.disabled=false;
   host.dataset.playing='true';host.dataset.mediaState='playing';
  }catch{if(thisEpoch===epoch)fail();}
 });
 video.addEventListener('error',fail);
 video.addEventListener('ended',()=>{stopTimer();delete host.dataset.playing;play.hidden=false;play.textContent=ja?'もう一度見る':'Play again';});
 video.addEventListener('waiting',()=>{if(host.dataset.playing){stopTimer();timer=setTimeout(fail,10000);}});
 video.addEventListener('playing',stopTimer);
 return {reset};
}
const workbench=document.querySelector('.studio-workbench');
if(workbench){
 const choices=[...workbench.querySelectorAll('[data-studio-choice]')];
 const panel=workbench.querySelector('.studio-player');
 const video=panel.querySelector('video'),image=panel.querySelector('.studio-player-screen>img');
 const play=panel.querySelector('.studio-play'),status=panel.querySelector('.studio-media-status');
 const player=enhancePlayer({host:panel,video,play,image,status,source:()=>`/media/products/${workbench.dataset.product}.mp4`});
 const tablist=workbench.querySelector('.studio-picker');tablist.setAttribute('role','tablist');
 panel.setAttribute('role','tabpanel');panel.tabIndex=0;
 const activate=(choice,focus=false)=>{
  player.reset();
  for(const item of choices){const active=item===choice;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;}
  workbench.dataset.product=choice.dataset.studioChoice;
  panel.setAttribute('aria-labelledby',choice.id);
  image.src=choice.dataset.poster;image.alt=choice.dataset.alt;
  panel.querySelector('[data-studio-name]').textContent=`WORKING PREVIEW / ${choice.dataset.name}`;
  panel.querySelector('[data-studio-caption]').textContent=choice.dataset.caption;
  panel.querySelector('[data-studio-description]').textContent=choice.dataset.description;
  panel.querySelector('[data-studio-link]').href=choice.href;
  video.setAttribute('aria-label',`${choice.dataset.name} ${ja?'実演録画':'recorded workflow'}`);
  if(focus)choice.focus();
 };
 choices.forEach((choice,index)=>{
  choice.id=`studio-tab-${choice.dataset.studioChoice}`;choice.setAttribute('role','tab');choice.setAttribute('aria-controls','studio-player');
  choice.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();activate(choice);});
  choice.addEventListener('keydown',event=>{
   const move={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
   if(move){event.preventDefault();activate(choices[(index+move+choices.length)%choices.length],true);}
   else if(event.key==='Home'||event.key==='End'){event.preventDefault();activate(choices[event.key==='Home'?0:choices.length-1],true);}
   else if(event.key===' '){event.preventDefault();activate(choice);}
  });
 });
 activate(choices[0]);
}
for(const host of document.querySelectorAll('.owned-film')){
 const video=host.querySelector('video'),play=host.querySelector('.owned-film__play'),status=host.querySelector('.owned-film__status');
 if(video&&play&&status)enhancePlayer({host,video,play,image:host.querySelector('.owned-film__screen>img'),status,source:()=>video.dataset.recordingSrc});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
// All page content and navigation remain available when JavaScript is disabled.
