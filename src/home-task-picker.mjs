import {esc} from '../public/assets/lab-core.mjs';

const entries = [
  {id:'ai-meeting', ja:'話したことを、やることに。', en:'Turn discussion into tasks.', icon:'<path d="M5 5h14v11H9l-4 4V5Z"/><path d="M9 9h6M9 12h4"/>'},
  {id:'agent-team', ja:'制作を、チームで進める。', en:'Create with a team.', icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M14 6h4v5M10 18H6v-5"/>'},
  {id:'launchloom', ja:'作ったものを、伝える。', en:'Show what you built.', icon:'<path d="m4 10 15-6v16L4 14v-4ZM7 15v5h4l-1-4M19 9l3 1v4l-3 1"/>'}
];

/** Navigation only: all product facts come from the ledger; no simulated work. */
export function renderTaskPicker(products, lang) {
  if(!['ja','en'].includes(lang))throw new TypeError('Unsupported locale');
  const ja=lang==='ja',prefix=ja?'':'/en';
  const rows=entries.map(entry=>{
    const product=products.find(p=>p.id===entry.id);
    if(!product)throw new Error(`Task picker product missing: ${entry.id}`);
    return `<li><a class="rm-task-link" href="${prefix}/products/${entry.id}/"><span class="rm-task-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${entry.icon}</svg></span><span class="rm-task-body"><strong>${esc(entry[lang])}</strong><span class="rm-task-result">${esc(product[lang].outcome)}</span><span class="rm-task-product">${esc(product.name)}</span></span><span class="rm-task-go" aria-hidden="true">→</span></a></li>`;
  }).join('');
  return `<nav class="rm-task-picker" data-home-task-picker aria-labelledby="rm-task-title"><div class="rm-task-heading"><span class="rm-task-eyebrow">${ja?'仕事から選ぶ':'START WITH YOUR TASK'}</span><h2 id="rm-task-title">${ja?'いま、何をしたい？':'What are you working on?'}</h2><p>${ja?'目的に合う道具を、ひとつから。':'Find a tool for the work in front of you.'}</p></div><ul class="rm-task-list">${rows}</ul><div class="rm-task-footer"><span>${ja?'それぞれ独立した製品です。':'Each is a separate product.'}</span><a href="#explore">${ja?'全6製品を見る':'Explore all six'}<span aria-hidden="true"> →</span></a></div></nav>`;
}
