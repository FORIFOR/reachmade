/** Request → Result. Presentation only; the existing demo owns execution and playback. */
export const SIGNATURE_VERSION = '20260919-request-result-1';
export const MOMENTS = Object.freeze({
  genie: {ja:['このメモから、LPの下書きを。','landing-page.md','下書きを開く'],en:['Make a page from these notes.','landing-page.md','Open the draft']},
  'ai-meeting': {ja:['料金案を3つ、比較したい。','料金案を比較するタスク','変更を確認する'],en:['Compare three pricing options.','A task to compare pricing','Review the change']},
  oathra: {ja:['金曜日の14時に、予約を。','「金曜日の14時」 · 00:18','発言の根拠を見る'],en:['Book Friday at 14:00.','“Friday at 14:00” · 00:18','Inspect the words']},
  aisecure: {ja:['この3件のログを、調べて。','観測 / 仮説 / 不明点','調査メモを読む'],en:['Investigate these three logs.','Observed / hypothesis / unknown','Read the case notes']},
  'agent-team': {ja:['発表文を作って、見直して。','announcement.md · v2','修正の経緯を見る'],en:['Draft it. Review it. Revise it.','announcement.md · v2','Follow the revision']},
  launchloom: {ja:['この録画を、届ける素材に。','16:9 / 9:16 / Web','公開前に確認する'],en:['Turn this recording into a kit.','16:9 / 9:16 / Web','Review before publishing']}
});
export function momentFor(id, lang='ja') {
  if (!Object.hasOwn(MOMENTS,id) || !['ja','en'].includes(lang)) throw new TypeError('Unknown signature product or locale');
  const [request,result,action]=MOMENTS[id][lang];
  return {request,result,action,index:Object.keys(MOMENTS).indexOf(id)+1};
}
export function phaseProgress(phase) {
  return Number.isInteger(phase) && phase >= 0 && phase <= 4 ? phase / 4 : 0;
}
export function initSignature(doc=document) {
  if (!doc.body?.hasAttribute('data-lab-signature')) return null;
  if (doc.body.dataset.signatureReady) return null;
  const win=doc.defaultView, workbench=doc.querySelector('.studio-workbench');
  if (!workbench) return null;
  const picker=workbench.querySelector('.studio-picker'), screen=workbench.querySelector('.studio-player-screen');
  const signature=doc.querySelector('.lab-signature');
  if (!picker || !screen || !signature) return null;
  doc.body.dataset.signatureReady='pending';
  const locale=doc.documentElement.lang.startsWith('ja')?'ja':'en';
  const motion=win.matchMedia('(prefers-reduced-motion: reduce)');
  const abort=new win.AbortController(), animations=new Set();
  let frame=0, dead=false, lastId='', phase=-1, entered=false;
  const on=(node,type,fn)=>node.addEventListener(type,fn,{signal:abort.signal});
  const indicator=doc.createElement('span');
  indicator.className='lab-selection-line';indicator.setAttribute('aria-hidden','true');picker.append(indicator);
  const status=doc.createElement('p');status.className='rm-sr';status.setAttribute('role','status');workbench.append(status);
  function cancelAnimations() { animations.forEach(a=>a.cancel());animations.clear(); }
  function animate(node,keyframes,duration=360) {
    if (!node || motion.matches || doc.hidden || !node.animate) return;
    const a=node.animate(keyframes,{duration,easing:'cubic-bezier(.22,.68,0,1)'});
    animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));
  }
  function position() {
    const active=picker.querySelector('[aria-selected="true"]');
    if (!active) return;
    const a=active.getBoundingClientRect(), p=picker.getBoundingClientRect();
    indicator.style.width=`${a.width}px`;
    indicator.style.transform=`translate(${a.left-p.left+picker.scrollLeft}px,${a.bottom-p.top+picker.scrollTop-2}px)`;
  }
  function sync() {
    frame=0;if(dead)return;
    const id=workbench.dataset.product;
    if(!Object.hasOwn(MOMENTS,id))return;
    const root=workbench.querySelector('.rm-live-demo');
    const ready=root && root.querySelector('.rm-app')?.dataset.product===id;
    if(id!==lastId) {
      cancelAnimations();
      const m=momentFor(id,locale), changed=Boolean(lastId);
      signature.dataset.product=id;workbench.dataset.signatureProduct=id;
      signature.querySelector('[data-signature-request]').textContent=m.request;
      signature.querySelector('[data-signature-result]').textContent=m.result;
      signature.querySelector('[data-signature-index]').textContent=String(m.index).padStart(2,'0');
      const name=picker.querySelector(`[data-studio-choice="${id}"]`)?.dataset.name||id;
      signature.querySelector('[data-signature-name]').textContent=name;
      signature.querySelector('[data-signature-action]').textContent=m.action;
      if(changed) {
        status.textContent=locale==='ja'?`${name}を選択しました。`:`${name} selected.`;
        animate(screen.querySelector('.rm-demo-visual'),[{opacity:.55,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],420);
        animate(doc.querySelector('.lab-current'),[{opacity:.6,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],300);
        animate(signature.querySelector('.lab-signature-output'),[{opacity:.4,transform:'translateX(-6px)'},{opacity:1,transform:'translateX(0)'}],360);
      }
      lastId=id;phase=-1;
    }
    const next=ready?Number(root.dataset.phase):0;
    if(next!==phase){phase=next;signature.style.setProperty('--signature-progress',String(phaseProgress(next)));signature.dataset.phase=String(next);}
    const recording=workbench.querySelector('.studio-player')?.dataset.demoMode==='recording';
    signature.dataset.mode=recording?'recording':'sample';
    signature.querySelectorAll('[data-signature-cue]').forEach(b=>{b.hidden=!ready;});
    if(!entered && ready){doc.body.dataset.signatureReady='true';entered=true;}
    position();
  }
  function schedule(){if(!dead&&!frame)frame=win.requestAnimationFrame(sync);}
  const observer=new win.MutationObserver(records=>{
    if(records.some(r=>r.type==='attributes'||[...r.addedNodes].some(n=>n.nodeType===1 && (n.matches('.rm-live-demo,.rm-app')||n.querySelector('.rm-live-demo')))))schedule();
  });
  // Attribute filters avoid watching the range value and typewriter on every frame.
  observer.observe(workbench,{attributes:true,subtree:true,attributeFilter:['data-product','data-phase','data-demo-mode','aria-selected'],childList:true});
  const resize='ResizeObserver' in win?new win.ResizeObserver(schedule):null;
  resize?.observe(picker);
  on(win,'resize',schedule);on(picker,'scroll',schedule);
  on(signature,'click',event=>{
    const button=event.target.closest('[data-signature-cue]');if(!button)return;
    const root=workbench.querySelector('.rm-live-demo');if(!root)return;
    workbench.querySelector('[data-mode="story"]')?.click();
    root.querySelector(`[data-cue="${button.dataset.signatureCue}"]`)?.click();
    // Stay where the visitor is: no forced scrolling or focus movement.
    schedule();
  });
  on(motion,'change',()=>{cancelAnimations();schedule();});
  on(doc,'visibilitychange',()=>{if(doc.hidden)cancelAnimations();else schedule();});
  on(win,'pagehide',()=>{cancelAnimations();if(frame)win.cancelAnimationFrame(frame);frame=0;});
  on(win,'pageshow',schedule);
  schedule();
  return {destroy(){dead=true;abort.abort();observer.disconnect();resize?.disconnect();cancelAnimations();if(frame)win.cancelAnimationFrame(frame);indicator.remove();status.remove();delete doc.body.dataset.signatureReady;signature.querySelectorAll('[data-signature-cue]').forEach(b=>{b.hidden=true;});}};
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initSignature(),{once:true});
  else initSignature();
}
