/** Progressive enhancement only. Existing sample and recording owners are retained. */
export function initOutcome(doc=document){
 const film=doc.querySelector('[data-outcome-real-film]');
 if(film){film.addEventListener('play',()=>doc.querySelectorAll('video').forEach(v=>{if(v!==film)v.pause();}));doc.addEventListener('visibilitychange',()=>{if(doc.hidden)film.pause();});}
 const workbench=doc.querySelector('.studio-workbench');
 if(workbench){
  const sync=()=>{
   const id=workbench.dataset.product;
   const selected=[...workbench.querySelectorAll('[data-studio-choice]')].find(a=>a.dataset.studioChoice===id);
   const link=workbench.querySelector('[data-outcome-start-link]'),note=workbench.querySelector('[data-outcome-start-note]');
   if(!selected||!link||!note)return;
   const url=selected.dataset.outcomeStart;
   if(!/^(https:\/\/|\/(?!\/))/.test(url||''))return;
   link.href=url;link.textContent=selected.dataset.outcomeLabel+' ↗';note.textContent=selected.dataset.outcomeNote;
  };
  sync();new MutationObserver(sync).observe(workbench,{attributes:true,attributeFilter:['data-product']});
 }
 const entry=doc.querySelector('[data-outcome-sample]');if(!entry)return;
 const wire=()=>{
  const target=doc.querySelector('.owned-film [data-lab-try]');if(!target)return false;
  if(entry.dataset.ready)return true;
  entry.dataset.ready='true';
  // The link already works without JavaScript; with it, stay on the page.
  entry.addEventListener('click',event=>{event.preventDefault();target.click();});
  return true;
 };
 if(!wire()){
  const observer=new MutationObserver(()=>{if(wire())observer.disconnect();});
  observer.observe(doc.body,{childList:true,subtree:true});
  doc.defaultView.setTimeout(()=>observer.disconnect(),15000);
 }
}
if(typeof document!=='undefined')initOutcome();
