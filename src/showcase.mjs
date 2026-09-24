/** Product-led presentation. Build-time HTML, no network, no invented proof. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { artDirectProductHero, writeArtDirectionStyles } from './product-art-direction.mjs';
const e = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const showcase = Object.freeze({
  genie:{ja:['作業を止めない','いまの作業から離れず、問いかけて結果を戻す。','TaskDock・画面・結果'],en:['Stay in the work','Ask about what is already in front of you.','TaskDock · screen · result'],theme:'workspace'},
  'ai-meeting':{ja:['話したことを残す','割り込める会話から、確認済みタスクへ。','会話・割り込み・確認・タスク'],en:['Speak, interrupt, keep it','An interruptible conversation that leaves confirmed tasks.','Conversation · interruption · confirmation · tasks'],theme:'conversation'},
  oathra:{ja:['「できた」を確かめる','AIの自己申告ではなく、相手の言葉で結果を検証する。','通話・相手の発言・検証'],en:['Verify “done”','Judge the result from the other party’s words, not the agent’s self-report.','Call · other-party evidence · verdict'],theme:'evidence'},
  aisecure:{ja:['送る前に確かめる','文書を外へ出す前に、ローカルで検査して理由と範囲を残す。','文書・ローカル検査・レポート'],en:['Check before sending','Inspect a document locally, then keep the decision, reasons and coverage.','Document · local preflight · report'],theme:'investigation'},
  'agent-team':{ja:['ひとつ頼む','チームが作り、確かめ、直す。','作成・レビュー・修正・再確認'],en:['One request','The team drafts, checks, and revises.','Draft · review · revise · re-check'],theme:'editorial'},
  launchloom:{ja:['作ったものを届ける','ひとつの実録画から、公開前の素材一式へ。','横動画・縦動画・LP・投稿案'],en:['Show what you built','One real recording becomes pre-publish launch material.','Landscape · vertical · page · social drafts'],theme:'cinema'}
});
const route=(id,lang)=>`${lang==='en'?'/en':''}/products/${id}/`;
const root=lang=>lang==='en'?'/en/':'/';
const arrow='<span aria-hidden="true">↗</span>';
const external=(url,label,cls='text-link')=>`<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)}${arrow}</a>`;
function image(p,lang,priority=false){
 return `<img src="${e(p.preview)}" alt="${e(p[lang].previewLabel)}" width="1600" height="1000" ${priority?'fetchpriority="high" decoding="async"':'loading="lazy" decoding="async"'}>`;
}
function productLink(p,lang,label,cls='button'){return `<a class="${cls}" href="${route(p.id,lang)}">${e(label)}${arrow}</a>`;}
function picker(products,lang){
 const ja=lang==='ja',p=products.find(p=>p.id==='genie')||products[0];
 return `<div class="studio-workbench" data-product="${e(p.id)}">
 <nav class="studio-picker" aria-label="${ja?'見たい製品を選ぶ':'Choose a product'}">${products.map(q=>`<a href="${route(q.id,lang)}" data-studio-choice="${q.id}" data-name="${e(q.name)}" data-poster="${e(q.preview)}" data-alt="${e(q[lang].previewLabel)}" data-caption="${e(q[lang].proof)}" data-description="${e(showcase[q.id][lang][1])}"><span class="studio-picker-number">${e(q.index)}</span><span><strong>${e(q.name)}</strong><small>${e(showcase[q.id][lang][0])}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</nav>
 <figure class="studio-player" id="studio-player"><div class="studio-player-bar"><span data-studio-name>WORKING PREVIEW / ${e(p.name)}</span><span>${ja?'実際の製品画面':'ACTUAL PRODUCT SCREEN'}</span></div>
 <div class="studio-player-screen">${image(p,lang,true)}<video muted playsinline controls preload="none" hidden aria-label="${e(p.name)} ${ja?'実演録画':'recorded workflow'}"></video><button class="studio-play" type="button" hidden><span aria-hidden="true">▶</span> ${ja?'実演を見る':'Play the recording'}</button></div>
 <figcaption><div><strong data-studio-description>${e(showcase[p.id][lang][1])}</strong><p data-studio-caption>${e(p[lang].proof)}</p></div><a href="${route(p.id,lang)}" data-studio-link>${ja?'製品を詳しく見る':'Explore the product'}${arrow}</a></figcaption><p class="studio-media-status" role="status" hidden></p></figure>
 </div>`;
}
function feature(p,lang){
 const ja=lang==='ja',t=p[lang];
 return `<article class="project-row" id="${p.id}" data-category="${p.category}"><a class="studio-project-cover" href="${route(p.id,lang)}" aria-label="${e(p.name)} ${ja?'の詳細':'details'}">${image(p,lang)}<span>${e(p.name)} ${arrow}</span></a><div class="project-content"><div class="project-heading"><span class="eyebrow">${p.index} — ${e(p.name)}</span><span class="status-label">${e(t.status)}</span></div><h3>${e(showcase[p.id][lang][1])}</h3><p>${e(t.description)}</p><div class="project-actions">${productLink(p,lang,ja?'できることを見る':'See what it does')}${external(p.repo,'GitHub')}</div><details class="studio-conditions"><summary>${ja?'利用条件と現在の範囲':'Access and current scope'}</summary><p>${e(t.scope)}</p></details></div></article>`;
}
function compact(p,lang){
 const ja=lang==='ja',t=p[lang];
 return `<article class="compact-product" data-product="${p.id}"><a class="studio-project-cover" href="${route(p.id,lang)}" aria-label="${e(p.name)} ${ja?'の詳細':'details'}">${image(p,lang)}</a><div class="compact-product-meta"><span class="eyebrow">${p.index} — ${e(p.name)}</span><span class="status-label">${e(t.status)}</span></div><h3>${e(showcase[p.id][lang][1])}</h3><p>${e(t.description)}</p><div class="compact-product-actions">${productLink(p,lang,ja?'製品を見る':'Explore','text-link')}${external(p.repo,'GitHub')}</div></article>`;
}
export function renderStudioHome(products,lang){
 if(!['ja','en'].includes(lang)||products.some(p=>!Object.hasOwn(showcase,p.id)))throw new TypeError('Unknown showcase locale or product');
 const ja=lang==='ja',base=root(lang),featured=products.filter(p=>p.featured).slice(0,2),other=products.filter(p=>!p.featured&&!p.hero);
 const oathra=products.find(p=>p.id==='oathra');
 return `<section class="hero container"><div class="hero-copy"><p class="eyebrow">REACHMADE / 6 WORKING AI PRODUCTS</p><h1>${ja?'AIを、<br>動く製品に。':'AI, built into<br>working products.'}</h1></div><div class="studio-intro"><p class="hero-description">${ja?'会話を、次のタスクに。<br>メモを、使える成果物に。<br>操作録画を、伝わる紹介素材に。':'Turn conversations into tasks.<br>Notes into useful artifacts.<br>Recordings into launch material.'}</p><p class="studio-intro-note">${ja?'6つの自主開発プロダクト。実際の画面から、あなたの仕事に合うものを。':'Six independently built products. Find the one that fits your work, starting with the actual screen.'}</p><div class="hero-actions"><a class="button" href="${base}products/">${ja?'プロダクトを選ぶ':'Explore products'}${arrow}</a><a class="text-link" href="${base}contact/">${ja?'開発を相談する':'Discuss a project'}${arrow}</a></div></div>${picker(products,lang)}</section>
 <section class="selected-work container" id="products"><div class="section-title"><div><p class="eyebrow">SELECTED PRODUCTS / 01—06</p><h2>${ja?'あなたの仕事に、<br>ちょうどいい一つを。':'Find a tool.<br>Make it your own.'}</h2></div><p>${ja?'会話、電話、調査、制作。<br>それぞれの仕事に、それぞれの道具。':'Conversation, calls, investigation, creation.<br>Different work deserves different tools.'}</p></div>${featured.map(p=>feature(p,lang)).join('')}<div class="compact-products"><div class="compact-products-heading"><h3>${ja?'調べる。協働する。届ける。':'Investigate. Collaborate. Launch.'}</h3><a class="text-link" href="${base}products/">${ja?'すべてを見る':'See all products'}${arrow}</a></div><div class="studio-product-grid">${other.map(p=>compact(p,lang)).join('')}</div></div></section>
 <section class="service-preview"><div class="container service-preview-grid"><div><p class="eyebrow">BUILT HERE. BUILT WITH YOU.</p><h2>${ja?'次は、あなたの<br>仕事のために。':'Next, build something<br>for your work.'}</h2><p>${ja?'自主開発で培った実装を、実際の業務へ。小さく試し、確かめながら、使える形を一緒につくります。':'Bring the engineering behind these products to a real workflow. Start small, evaluate it, and build something useful together.'}</p><a class="button button-light" href="${base}services/">${ja?'支援内容を見る':'How we work'}${arrow}</a></div><div class="service-preview-list">${(ja?['業務AI・エージェント実装','音声・電話AIの開発','新しいAIプロダクトの試作']:['Applied AI & agent workflows','Voice & phone AI','New product prototyping']).map((text,i)=>`<a href="${base}services/#service-0${i+1}"><span>0${i+1}</span><h3>${e(text)}</h3>${arrow}</a>`).join('')}</div></div></section>
 <section class="build-note container"><div><p class="eyebrow">INSIDE THE PRODUCT / OATHRA</p><h2>${ja?'「できました」の、<br>その先をつくる。':'Build beyond<br>“Done.”'}</h2><p>${ja?'電話の相手は、何と言ったのか。外部のシステムには、何が残ったのか。Oathraでは、会話の合意と実際の登録を分けて扱います。':'What did the other party actually say? What exists in the external system? Oathra keeps spoken agreement separate from a recorded booking.'}</p>${external(oathra.evidence,ja?'設計と開発記録を読む':'Read the engineering notes')}</div><div class="studio-principles"><article><span>01</span><h3>${ja?'実物で話す。':'Show the actual work.'}</h3><p>${ja?'実画面とコードを公開。説明と実装を切り離しません。':'Screens and source code, alongside the explanation.'}</p></article><article><span>02</span><h3>${ja?'結果を確かめる。':'Check the result.'}</h3><p>${ja?'AIの返答と、確認できた事実を分けます。':'An AI response is not the same as a verified result.'}</p></article><article><span>03</span><h3>${ja?'決定権は、使う人に。':'Keep people in control.'}</h3><p>${ja?'送信、費用、権限。判断が必要な境界を明確に。':'Clear boundaries for sending, cost and permissions.'}</p></article></div></section>
 <section class="contact-band"><div class="container contact-band-inner"><div><p class="eyebrow">LET’S MAKE IT REAL</p><h2>${ja?'その「できたら」を、<br>一緒に。':'Something on your mind?<br>Let’s make it real.'}</h2><p>${ja?'まだ構想の段階でも。変えたい仕事から聞かせてください。':'An early idea is enough. Tell us about the work you want to change.'}</p></div><a class="big-arrow-link" href="${base}contact/"><span>${ja?'開発を相談する':'Start a conversation'}</span><b aria-hidden="true">↗</b></a></div></section>`;
}
function decorate(html){
 if(html.includes('data-showcase="20260918"'))return html;
 return html.replace(/<link rel="stylesheet" href="\/assets\/(?:site|site-experience|product-landings)\.css">/g,'')
 .replace(/<script src="\/assets\/(?:site|product-landings)\.js" defer><\/script>/,'<script type="module" src="/assets/showcase.mjs"></script>')
 .replace('</head>','<link rel="stylesheet" href="/assets/showcase.css"></head>')
 .replace('<body ','<body data-showcase="20260918" ');
}
export function refineProductPage(html,product,lang){
 const ja=lang==='ja',id=product.id;
 if(!Object.hasOwn(showcase,id)||!['ja','en'].includes(lang))throw new TypeError('Unknown product or locale');
 html=decorate(html);
 html=html.replace('<div class="owned-film__screen"><video',`<div class="owned-film__screen">${image(product,lang,true)}<video hidden`);
 html=html.replace('class="owned-film__play"','class="owned-film__play" hidden');
 // Preserve the recording, links, scope, access notes and source evidence. No generated UI is sold as a real screen.
 html=html.replace('<p class="owned-lead">',`<p class="studio-product-line">${e(showcase[id][lang][2])}</p><p class="owned-lead">`);
 html=html.replace(/<p class="owned-requirements">([\s\S]*?)<\/p>/,`<details class="owned-access"><summary>${ja?'動作条件・ライセンスを確認':'Setup, scope & license'}</summary><p class="owned-requirements">$1</p></details>`);
 html=html.replace(/<section class="container owned-outcome">[\s\S]*?<\/section>/,'');
 const next=Object.keys(showcase).filter(key=>key!==id).slice(0,3);
 const links=`<section class="container studio-related"><p class="owned-kicker">${ja?'ほかの仕事にも、別の道具を。':'DIFFERENT WORK. DIFFERENT TOOLS.'}</p><nav aria-label="${ja?'関連する製品':'More products'}">${next.map(key=>`<a href="${route(key,lang)}"><span>${e(showcase[key][lang][0])}</span><strong>${e(key==='ai-meeting'?'AI Meeting':key==='agent-team'?'Agent Team':key==='aisecure'?'AI Secure':key==='genie'?'Genie':key==='oathra'?'Oathra':'Launchloom')}</strong>${arrow}</a>`).join('')}</nav></section>`;
 return artDirectProductHero(html.replace('<footer class="container owned-footer">',links+'<footer class="container owned-footer">'),product,lang);
}
export async function writeShowcase(dist,products){
 for(const lang of ['ja','en']){
  const homePath=path.join(dist,lang==='en'?'en/index.html':'index.html');
  let html=await fs.readFile(homePath,'utf8');
  if(!/<main id="main">[\s\S]*?<\/main>/.test(html))throw new Error('Homepage structure changed; refusing a partial presentation update');
  html=decorate(html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${renderStudioHome(products,lang)}</main>`));
  await fs.writeFile(homePath,html);
  for(const p of products){
   const file=path.join(dist,lang==='en'?'en':'','products',p.id,'index.html');
   await fs.writeFile(file,refineProductPage(await fs.readFile(file,'utf8'),p,lang));
  }
 }
 await writeArtDirectionStyles(dist);
}
