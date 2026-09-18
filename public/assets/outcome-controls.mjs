/** Progressive enhancement only. Existing sample and recording owners are retained. */
import {initOrbit} from './orbit-study.mjs';
export function initOutcome(doc=document){
 initOrbit(doc);
 const workbench=doc.querySelector('.studio-workbench');
 if(workbench){
  const sync=()=>{
   const id=workbench.dataset.product;
   const selected=[...workbench.querySelectorAll('[data-studio-choice]')].find(a=>a.dataset.studioChoice===id);
   const link=workbench.querySelector('[data-outcome-start-link]'),note=workbench.querySelector('[data-outcome-start-note]');
   if(!selected||!link||!note)return;
   const url=selected.dataset.outcomeStart;
   // The destination registry is build-time only. Refuse tampered schemes.
   if(!/^https:\/\//.test(url||''))return;
   link.href=url;link.textContent=selected.dataset.outcomeLabel+' ↗';note.textContent=selected.dataset.outcomeNote;
  };
  sync();new MutationObserver(sync).observe(workbench,{attributes:true,attributeFilter:['data-product']});
 }
 const entry=doc.querySelector('[data-outcome-sample]');if(!entry)return;
 const wire=()=>{
  const target=doc.querySelector('.owned-film [data-lab-try]');if(!target)return false;
  if(entry.dataset.ready)return true;
  entry.dataset.ready='true';entry.hidden=false;
  entry.addEventListener('click',()=>{target.click();target.scrollIntoView({block:'center',behavior:'auto'});target.focus({preventScroll:true});});
  return true;
 };
 if(!wire()){
  const observer=new MutationObserver(()=>{if(wire())observer.disconnect();});
  observer.observe(doc.body,{childList:true,subtree:true});
  // No endless observer when a failed dependency cannot supply the sample.
  doc.defaultView.setTimeout(()=>observer.disconnect(),15000);
 }
}
if(typeof document!=='undefined')initOutcome();
