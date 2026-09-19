/** Final presentation pass. Fail closed if the supported Product Lab shell changes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {SIGNATURE_VERSION,momentFor} from '../public/assets/lab-signature.mjs';
const marker='/* REACHMADE_REQUEST_RESULT */';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderSignature(lang='ja') {
 const m=momentFor('genie',lang), ja=lang==='ja';
 return `<aside class="lab-signature" data-product="genie" data-phase="0" aria-label="${ja?'依頼から成果物へ：説明用サンプル':'Request to result: illustrative sample'}"><div class="lab-signature-heading"><span>THE REACH → MADE MOMENT</span><span data-signature-index>01</span></div><div class="lab-signature-pair"><div class="lab-signature-input"><span class="lab-signature-word">Reach.</span><p data-signature-request>${esc(m.request)}</p><button type="button" data-signature-cue="0" hidden>${ja?'依頼を見る':'See the request'} <span aria-hidden="true">↗</span></button></div><div class="lab-signature-output"><span class="lab-signature-word">Made.</span><p data-signature-result>${esc(m.result)}</p><button type="button" data-signature-cue="4" hidden><span data-signature-action>${esc(m.action)}</span> <span aria-hidden="true">↗</span></button></div></div><div class="lab-signature-track" aria-hidden="true"><i></i><b></b></div><div class="lab-signature-foot"><span data-signature-name>Genie</span><span>${ja?'再現UI・サンプルデータ':'ILLUSTRATIVE UI · SAMPLE DATA'}</span></div></aside>`;
}
export function refineSignature(html,lang='ja') {
 if(!['ja','en'].includes(lang))throw new TypeError('Unknown locale');
 if(html.includes(`data-lab-signature="${SIGNATURE_VERSION}"`))return html;
 if(!html.includes('data-lab-experience="20260919-product-lab-1"'))throw new Error('Product Lab must be built first');
 const isHome=html.includes('class="hero container lab-hero"');
 html=html.replace('<body ',`<body data-lab-signature="${SIGNATURE_VERSION}" `);
 if(!isHome)return html;
 const ja=lang==='ja';
 const title=ja?'AIを、<br>動く仕事に。':'AI that moves<br>your work forward.';
 const heading=/<h1>[^]*?<\/h1>/;
 if(!heading.test(html)||!html.includes('</div></section>\n <section class="container lab-explorer"'))throw new Error('Unsupported Product Lab hero');
 html=html.replace(heading,`<h1>${title}</h1>`);
 html=html.replace('</div></section>\n <section class="container lab-explorer"',`</div>${renderSignature(lang)}</section>\n <section class="container lab-explorer"`);
 const pageTitle=ja?'Reachmade Lab — AIを、動く仕事に。':'Reachmade Lab — AI that moves your work forward.';
 html=html.replace(/<title>[^]*?<\/title>/,`<title>${pageTitle}</title>`).replace(/(<meta property="og:title" content=")[^"]*(">)/,`$1${pageTitle}$2`);
 return html;
}
export async function writeSignature(dist,products) {
 if(!Array.isArray(products)||products.length!==6)throw new TypeError('Expected six products');
 const routes=['','en/',...products.flatMap(p=>{
   momentFor(p.id);return [`products/${p.id}/`,`en/products/${p.id}/`];
 })];
 // Validate every page and asset before the first write.
 const pages=await Promise.all(routes.map(async route=>{
   const file=path.join(dist,route,'index.html');return [file,refineSignature(await fs.readFile(file,'utf8'),route.startsWith('en/')?'en':'ja')];
 }));
 const dir=path.join(dist,'assets');
 const [css,js,extra,client]=await Promise.all(['showcase.css','showcase.mjs','lab-signature.css','lab-signature.mjs'].map(f=>fs.readFile(path.join(dir,f),'utf8')));
 if(!extra.includes('[data-lab-signature]')||!client.includes(SIGNATURE_VERSION))throw new Error('Signature assets incomplete');
 for(const [file,html] of pages)await fs.writeFile(file,html);
 await fs.writeFile(path.join(dir,'showcase.css'),css.split(marker)[0].trimEnd()+'\n'+marker+'\n'+extra);
 await fs.writeFile(path.join(dir,'showcase.mjs'),js.split(marker)[0].trimEnd()+'\n'+marker+"\nimport('./lab-signature.mjs').catch(() => { document.documentElement.dataset.signatureState='unavailable'; });\n");
}
