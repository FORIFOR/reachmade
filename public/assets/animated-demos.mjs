/* Reachmade animated product demos — deterministic UI stories, not recordings. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const stories = {
  genie:{label:'GENIE / WORKSPACE',steps:[['input','競合を調べて、LPの構成を作って'],['work','Researching sources'],['work','Structuring the page'],['result','Landing page draft ready']]},
  'ai-meeting':{label:'AI MEETING / VOICE',steps:[['voice','新サービスの料金を決めたいです'],['work','Listening · organizing'],['result','料金案を3つ比較'],['result','Task saved']]},
  oathra:{label:'OATHRA / CALL',steps:[['call','Calling · 予約窓口'],['voice','明日の14時なら大丈夫です'],['work','Checking spoken evidence'],['result','14:00 · Confirmed by voice']]},
  aisecure:{label:'AI SECURE / INVESTIGATION',steps:[['input','このAI実行ログを調査'],['work','Correlating observations'],['work','Testing hypotheses'],['result','2 findings · 1 unknown']]},
  'agent-team':{label:'AGENT TEAM / COLLABORATION',steps:[['input','新機能の発表文を作って'],['work','Writer · drafting'],['work','Reviewer · checking'],['result','Revision approved']]},
  launchloom:{label:'LAUNCHLOOM / CREATION',steps:[['input','このデモからローンチ素材を作る'],['work','Cutting product story'],['work','Writing launch copy'],['result','Film · LP · social drafts ready']]}
};
function mount(host,id){
  let root=host.querySelector('.rm-live-demo');
  if(!root){root=document.createElement('div');root.className='rm-live-demo';root.innerHTML='<div class="rm-demo-top"><span></span><button type="button" aria-label="Pause animation">Ⅱ</button></div><div class="rm-demo-canvas"><div class="rm-demo-orb"></div><p class="rm-demo-line"></p><div class="rm-demo-progress"><i></i></div><div class="rm-demo-result"></div></div><small>UI STORY · ILLUSTRATIVE</small>';host.append(root);}
  let stopped=false,timer=0,index=0;
  const label=root.querySelector('.rm-demo-top span'), line=root.querySelector('.rm-demo-line'), result=root.querySelector('.rm-demo-result'), bar=root.querySelector('.rm-demo-progress i'), button=root.querySelector('button');
  const clear=()=>{clearTimeout(timer);timer=0};
  const render=()=>{
    const story=stories[id]||stories.genie, step=story.steps[index%story.steps.length];
    label.textContent=story.label; root.dataset.kind=step[0]; line.textContent=step[1];
    result.textContent=step[0]==='result'?'✓ '+step[1]:''; bar.style.setProperty('--p',((index%story.steps.length)+1)/story.steps.length);
    index++;
    if(!stopped&&!reduce.matches) timer=setTimeout(render,index%story.steps.length===0?2100:1450);
  };
  const setPaused=v=>{stopped=v;clear();button.textContent=v?'▶':'Ⅱ';button.setAttribute('aria-label',v?'Resume animation':'Pause animation');if(!v)render();};
  button.onclick=()=>setPaused(!stopped);
  root._rmStop=()=>{stopped=true;clear()};
  root._rmStart=()=>{if(stopped){stopped=false;render()}};
  index=0; clear(); render();
  if(reduce.matches){clear(); root.dataset.reduced='true';}
  return root;
}
const workbench=document.querySelector('.studio-workbench');
if(workbench){
 const screen=workbench.querySelector('.studio-player-screen');
 const image=screen?.querySelector(':scope > img');
 if(screen&&image){
   image.classList.add('rm-demo-poster');
   let current=mount(screen,workbench.dataset.product||'genie');
   const sync=()=>{const id=workbench.dataset.product||'genie';current?._rmStop?.();current=mount(screen,id);};
   for(const choice of workbench.querySelectorAll('[data-studio-choice]')) choice.addEventListener('click',()=>queueMicrotask(sync));
   const io=new IntersectionObserver(entries=>{const visible=entries[0]?.isIntersecting; visible?current?._rmStart?.():current?._rmStop?.();},{threshold:.25});
   io.observe(screen);
 }
}
