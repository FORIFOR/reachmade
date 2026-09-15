import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from '../src/products.mjs';
import { copy } from '../src/copy.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productTotal = String(products.length).padStart(2, '0');
const strip = s => String(s).replace(/<br\s*\/?\s*>/g,' ').replace(/<[^>]*>/g,'');
const pageKeys = ['home','products','services','work','about','contact','privacy'];
const href = (lang, page='home') => `${lang === 'en' ? '/en' : ''}${page === 'home' ? '/' : `/${page}/`}`;
const e = escapeHTML;
const link = (url, text, cls='text-link', extra='') => `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer" ${extra}>${text}<span aria-hidden="true">↗</span></a>`;
const arrow = '<span aria-hidden="true">↗</span>';

export function validateConfig(config) {
  const u = new URL(config.origin);
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw new Error('origin must be an HTTPS origin without credentials, path, query or fragment');
  if (!config.name || !config.owner || !config.checkedAt) throw new Error('Missing site identity');
  if (!['external','email'].includes(config.contact.mode)) throw new Error('Unknown contact mode');
  if (config.contact.mode === 'external') {
    const target = new URL(config.contact.url);
    if (target.protocol !== 'https:' || target.username || target.password) throw new Error('Contact URL must be HTTPS without credentials');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact.email || '')) throw new Error('A verified email address is required for email mode');
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id)) throw new Error('Invalid product ID');
    for (const field of ['repo','site','source','evidence','demo']) {
      if (!product[field]?.startsWith('https://')) throw new Error(`Invalid URL: ${product.id}.${field}`);
    }
    if (product.preview && (!product.preview.startsWith('/assets/') || product.preview.includes('..'))) throw new Error(`Invalid local preview: ${product.id}.preview`);
    for (const lang of ['ja','en']) for (const field of ['headline','short','description','scope','status','proof','license','previewLabel','demoLabel']) {
      if (!product[lang]?.[field]) throw new Error(`Missing ${product.id}.${lang}.${field}`);
    }
  }
  return config;
}

function mark(extra='') {
 return `<svg class="brand-mark ${extra}" aria-hidden="true" viewBox="0 0 36 36"><path d="M3 30V6h10v14h10V6h10v24H23v-8H13v8Z" fill="currentColor"/></svg>`;
}
function icon(id) {
 const shapes = {
  genie:'<path d="M8 9h30v26H8zM8 16h30M14 22h17M14 27h11"/>',
  'ai-meeting':'<path d="M8 23v2M13 18v12M18 12v24M23 18v12M28 9v30M33 15v18M38 21v6"/>',
  oathra:'<path d="M11 7l7 3-3 7c3 6 6 9 12 12l7-3 3 7c-1 5-8 7-14 3C13 30 6 20 6 13c0-3 2-5 5-6zM26 8h12v12M27 19L38 8"/>',
  aisecure:'<circle cx="12" cy="12" r="4"/><circle cx="33" cy="13" r="4"/><circle cx="23" cy="34" r="4"/><path d="M16 12h13M14 16l7 14M31 17l-6 13"/>',
  'agent-team':'<path d="M6 8h13v10H6zM28 8h13v10H28zM17 31h13v10H17zM12 18v7h22v-7M23 25v6"/>',
  launchloom:'<path d="M5 10h26v24H5zM36 6h8v33h-8zM16 18l8 5-8 5zM9 39h18"/>'
 };
 return `<svg class="product-icon" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${shapes[id]}</svg>`;
}
function identityStudy(c,lang) {
 const featured=products.find(p=>p.hero && p.preview) || products.find(p=>p.featured && p.preview) || products.find(p=>p.preview) || products[0];
 const t=featured[lang];
 const heroCaption=lang==='ja'?`${featured.name}の実画面。自主開発で検証中。`:`${featured.name} in use — a product under independent evaluation.`;
 if (!featured.preview) return `<figure class="identity-study" aria-label="${e(t.previewLabel)}"><div class="study-head"><span>WORKING PREVIEW / ${e(featured.name)}</span><span>${featured.index} / ${productTotal}</span></div>${productIllustration(featured,lang)}<figcaption>${heroCaption}</figcaption></figure>`;
 const featuredLink=featured.labSite?link(featured.labSite,lang==='ja'?'製品サイトを見る':'Open the product site','text-link'):'';
 return `<figure class="identity-study hero-proof" aria-label="${e(t.previewLabel)}"><div class="study-head"><span>WORKING PREVIEW / ${e(featured.name)}</span><span>${featured.index} / ${productTotal}</span></div><div class="hero-proof-image"><img src="${e(featured.preview)}" alt="${e(t.previewLabel)}" fetchpriority="high"><span class="proof-badge">${lang==='ja'?'実画面の記録':'Recorded product screen'}</span></div><figcaption><span>${heroCaption}</span>${featuredLink}</figcaption></figure>`;
}
function nav(lang, current, config) {
 const c=copy[lang];
 const navItems=['products','services','work','about'];
 return `<a class="skip-link" href="#main">${lang==='ja'?'本文へ移動':'Skip to content'}</a><header class="site-header"><div class="container header-inner"><a class="brand" href="${href(lang)}" aria-label="${e(config.name)} — ${lang==='ja'?'トップ':'home'}">${mark()}<span>Reachmade<span class="brand-lab">Lab</span></span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">${c.menu}<span aria-hidden="true">＋</span></button><nav id="main-nav" class="main-nav" aria-label="${lang==='ja'?'メインナビゲーション':'Main navigation'}">${navItems.map((p,i)=>`<a href="${href(lang,p)}"${p===current?' aria-current="page"':''}>${c.nav[i]}</a>`).join('')}<div class="nav-tail"><a class="language-switch" lang="${lang==='ja'?'en':'ja'}" hreflang="${lang==='ja'?'en':'ja'}" href="${href(lang==='ja'?'en':'ja',pageKeys.includes(current)?current:'home')}">${lang==='ja'?'EN':'日本語'}</a><a class="button button-small" href="${href(lang,'contact')}">${c.contact}${arrow}</a></div></nav></div></header>`;
}
function contactCTA(lang, small=false) {
 const c=copy[lang];
 return `<section class="contact-band ${small?'compact':''}"><div class="container contact-band-inner"><div><p class="eyebrow">START A CONVERSATION</p><h2>${c.footerCTA}</h2><p>${c.footerText}</p></div><a class="big-arrow-link" href="${href(lang,'contact')}" aria-label="${c.contact}"><span>${c.contact}</span><b aria-hidden="true">↗</b></a></div></section>`;
}
function footer(lang,config) {
 const c=copy[lang];
 return `<footer class="site-footer"><div class="container footer-main"><div><a class="brand footer-brand" href="${href(lang)}">${mark()}<span>Reachmade<span class="brand-lab">Lab</span></span></a><p>${c.footerBrand}<br>${c.footerNote}</p></div><nav aria-label="${lang==='ja'?'フッターナビゲーション':'Footer navigation'}"><a href="${href(lang,'products')}">Products</a><a href="${href(lang,'services')}">For companies</a><a href="${href(lang,'about')}">About</a>${link(config.github,'GitHub')}</nav></div><div class="container footer-bottom"><small>© 2026 Reachmade Lab / Shuhei Horio</small><div><a href="${href(lang,'privacy')}">${c.privacy}</a><a href="${href(lang==='ja'?'en':'ja')}">${lang==='ja'?'English':'日本語'}</a><a href="#top" class="to-top" aria-label="${lang==='ja'?'ページ先頭へ':'Back to top'}">↑</a></div></div></footer>`;
}
function pageIntro(label,title,lead,extra='') {
 return `<section class="page-intro container"><p class="eyebrow">${label}</p><h1>${title}</h1><p class="lead">${lead}</p>${extra}</section>`;
}
function productIllustration(p,lang) {
 const t=p[lang];
 if (p.preview) {
   return `<figure class="product-preview preview-${p.id}"><div class="preview-frame"><img src="${e(p.preview)}" alt="${e(t.previewLabel)}" loading="lazy"><span class="proof-badge">${e(t.previewLabel)}</span></div><figcaption><span>${lang==='ja'?'実際の画面記録':'Recorded product screen'}</span><span>${lang==='ja'?'GitHub公開記録から':'From a public GitHub record'}</span></figcaption></figure>`;
 }
 // Fallback for future products that have not supplied a local preview yet.
 const sub=lang==='ja'?'公開資料に基づく、設計の要約':'Design summary from the public documentation';
 const parts=t.outcome.split(' → ');
 return `<div class="product-notation notation-${p.id}"><div class="notation-top"><span>${p.discipline}</span><span>${p.index} / ${productTotal}</span></div><div class="notation-center">${icon(p.id)}<span class="notation-name">${p.name}</span><span class="notation-rule"></span><div class="notation-flow">${parts.map((s,i)=>`<span>${e(s)}</span>${i<parts.length-1?'<i aria-hidden="true">↗</i>':''}`).join('')}</div></div><div class="notation-bottom"><span>${sub}</span><span aria-hidden="true">↗</span></div></div>`;
}
function productRow(p,lang,full=false) {
 const c=copy[lang],t=p[lang];
 return `<article class="project-row${full?' project-full':''}" id="${p.id}" data-category="${p.category}"><div class="project-visual">${productIllustration(p,lang)}</div><div class="project-content"><div class="project-heading"><span class="eyebrow">${p.index} — ${p.name}</span><span class="status-label">${t.status}</span></div><h${full?'2':'3'}>${t.headline}</h${full?'2':'3'}><p>${t.description}</p><div class="project-actions">${p.labSite?link(p.labSite,c.productSite,'button button-outline'):''}${link(p.demo,t.demoLabel,'button button-outline')}${link(p.repo,'GitHub','text-link')}</div><p class="project-scope">${t.scope}</p>${full?`<details class="project-detail"><summary>${lang==='ja'?'検証・導入条件を確認する':'Evidence & reuse conditions'}<span aria-hidden="true">＋</span></summary><div><h3>${c.proof}</h3><p>${t.proof}</p><h3>${lang==='ja'?'再利用の条件':'Reuse conditions'}</h3><p>${t.license}</p><h3>${lang==='ja'?'この技術を活かせる相談':'Potential project scope'}</h3><p>${t.consult}</p><div class="project-detail-links">${link(p.source,c.readSource)}${link(p.evidence,c.evidence)}<a class="text-link" href="${href(lang,'contact')}?product=${p.id}">${c.inquiry}${arrow}</a></div></div></details>`:''}</div></article>`;
}
function compactProduct(p,lang) {
 const c=copy[lang],t=p[lang];
 return `<article class="compact-product"><div class="compact-product-meta"><span class="eyebrow">${p.index} — ${e(p.name)}</span><span class="status-label">${e(t.status)}</span></div><h3>${e(t.short)}</h3><p>${e(t.description)}</p><div class="compact-product-actions">${p.labSite?link(p.labSite,c.productSite):''}${link(p.repo,'GitHub')}</div></article>`;
}
function home(lang,config) {
 const c=copy[lang];
 const featured=products.filter(p=>p.featured).slice(0,2);
 const featuredIds=new Set(featured.map(p=>p.id));
 const compact=products.filter(p=>!featuredIds.has(p.id) && !p.hero);
 const caseProduct=products.find(p=>p.id==='oathra' && p.preview) || products.find(p=>p.preview) || products[0];
 const caseVisual=caseProduct.preview ? `<img src="${e(caseProduct.preview)}" alt="${e(caseProduct[lang].previewLabel)}" loading="lazy">` : productIllustration(caseProduct,lang);
 return `<section class="hero container"><div class="hero-copy"><p class="eyebrow"><span class="label-square" aria-hidden="true"></span>${c.heroLabel}</p><h1>${c.tagline}</h1><p class="hero-description">${c.heroText}</p><div class="hero-actions"><a class="button" href="${href(lang,'products')}">${c.heroPrimary}${arrow}</a><a class="text-link" href="${href(lang,'contact')}">${c.heroSecondary}${arrow}</a></div><div class="hero-footnote"><span>APPLIED RESEARCH</span><span>PRODUCT ENGINEERING</span></div></div>${identityStudy(c,lang)}</section>
<section class="selected-work container" id="products"><div class="section-title"><div><p class="eyebrow">${c.selectedLabel}</p><h2>${c.selectedTitle}</h2></div><p>${c.selectedText}</p></div>${featured.map(p=>productRow(p,lang)).join('')}<div class="compact-products" aria-label="${e(c.moreProducts)}"><div class="compact-products-heading"><h3>${c.moreProducts}</h3><a class="text-link" href="${href(lang,'products')}">${c.allProducts}${arrow}</a></div>${compact.map(p=>compactProduct(p,lang)).join('')}</div></section>
<section class="service-preview"><div class="container service-preview-grid"><div><p class="eyebrow">${c.supportEyebrow}</p><h2>${c.supportTitle}</h2><p>${c.supportText}</p><a class="button button-light" href="${href(lang,'services')}">${c.servicesLink}${arrow}</a></div><div class="service-preview-list">${c.serviceCards.map(x=>`<a href="${href(lang,'services')}#service-${x[0]}"><span>${x[0]}</span><h3>${x[1]}</h3>${arrow}</a>`).join('')}</div></div></section>
<section class="build-note container"><div class="build-note-copy"><p class="eyebrow">${c.caseLabel}</p><h2>${c.caseTitle}</h2><p>${c.caseText}</p><div class="build-note-actions">${link(caseProduct.evidence,c.caseLink)}${caseProduct.labSite?link(caseProduct.labSite,c.productSite):''}</div></div><figure class="build-note-visual">${caseVisual}<figcaption>${lang==='ja'?'公開検証記録から掲載':'Sourced from the public evaluation record'}</figcaption></figure></section>
<section class="principles container"><p class="eyebrow">HOW WE BUILD</p><h2>${c.philosophy}</h2><div class="principle-grid">${c.principles.map((x,i)=>`<article><span class="principle-number">0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></section>${contactCTA(lang)}`;
}
function productsPage(lang) {
 const c=copy[lang];
 return `${pageIntro(`PRODUCTS / 01—${productTotal}`, c.productsTitle,c.productsLead)}<section class="container product-directory"><div class="filter-bar"><div class="product-filters" role="group" aria-label="${lang==='ja'?'分野で絞り込む':'Filter by category'}">${c.filters.map(([value,label],i)=>`<button type="button" data-filter="${value}" aria-pressed="${i===0}">${label}</button>`).join('')}</div><p class="filter-count" role="status" aria-live="polite" data-count-suffix="${c.countSuffix}">${products.length} ${c.countSuffix}</p></div><p class="source-notice">${c.productNotice}</p>${products.map(p=>productRow(p,lang,true)).join('')}</section>${contactCTA(lang,true)}`;
}
function services(lang) {
 const c=copy[lang];
 return `${pageIntro('FOR COMPANIES',c.servicesTitle,c.servicesLead)}<section class="container service-introduction"><span class="eyebrow">FROM PROTOTYPE TO PRACTICE</span><p>${c.serviceIntro}</p></section><section class="container service-details">${c.serviceCards.map(x=>`<article id="service-${x[0]}" class="service-item"><div class="service-number">${x[0]}</div><div><h2>${x[1]}</h2><p>${x[2]}</p><div class="service-deliverables"><h3>${c.deliverables}</h3><p>${x[3]}</p></div><p class="related-work">${c.related} — <a href="${href(lang,'products')}">${x[4]}</a></p></div><a class="round-link" href="${href(lang,'contact')}?service=${x[0]}" aria-label="${x[1]} — ${c.contact}">↗</a></article>`).join('')}</section><section class="process-section"><div class="container"><p class="eyebrow">THE PROCESS</p><h2>${c.processTitle}</h2><div class="process-grid">${c.process.map((x,i)=>`<article><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></div></section><section class="container engagement-scope"><h2>${c.scopeTitle}</h2><p>${c.scopeText}</p></section><section class="container faq"><p class="eyebrow">QUESTIONS, ANSWERED</p><h2>${lang==='ja'?'相談の前に。':'Before we start.'}</h2>${c.faq.map(x=>`<details><summary>${x[0]}<span aria-hidden="true">＋</span></summary><p>${x[1]}</p></details>`).join('')}</section>${contactCTA(lang,true)}`;
}
function work(lang,config) {
 const c=copy[lang];
 return `${pageIntro('WORK NOTES',c.workTitle,c.workLead)}<section class="container work-records"><p class="source-notice">${c.workNote}<br><span>${lang==='ja'?'資料確認日':'Source review date'}: ${config.checkedAt}</span></p>${products.map(p=>`<article class="work-record" id="${p.id}"><div class="work-record-name"><span class="eyebrow">NOTE ${p.index}</span><h2>${p.name}</h2><span class="status-label">${p[lang].status}</span></div><div class="work-record-body"><h3>${c.proof}</h3><p>${p[lang].proof}</p><h3>${c.limits}</h3><p>${p[lang].scope}</p><div class="record-links">${link(p.evidence,c.evidence)}${link(p.demo,p[lang].demoLabel)}${link(p.source,c.readSource)}</div></div></article>`).join('')}</section>${contactCTA(lang,true)}`;
}
function about(lang,config) {
 const c=copy[lang];
 const projectNames=products.map(p=>e(p.name)).join(lang==='ja'?'、':' · ');
 const projectTrail=lang==='ja'?`${c.ownerText}${projectNames}。コードや設計、検証記録をGitHubで公開しています。`:`${c.ownerText}${projectNames}. Code, design notes, and evaluation records are published on GitHub.`;
 return `${pageIntro('ABOUT REACHMADE',c.aboutTitle,c.aboutLead)}<section class="container about-story"><div class="about-emblem" aria-hidden="true">${mark()}<span>REACH<br>MADE.</span></div><div class="about-prose"><p>${c.aboutBody}</p><p>${c.aboutBody2}</p><div class="name-note"><h2>Reach / made</h2><p>${c.identity}</p></div></div></section><section class="container founder"><div><p class="eyebrow">THE PERSON BEHIND THE WORK</p><h2>${e(config.owner)}</h2><span>${c.ownerRole}</span></div><div><p>${projectTrail}</p>${link(config.github,lang==='ja'?'FORIFORのGitHubを見る':'Explore FORIFOR on GitHub','button button-outline')}<p class="source-notice">${c.aboutNotice}</p></div></section><section class="principles container"><p class="eyebrow">HOW WE BUILD</p><h2>${c.philosophy}</h2><div class="principle-grid">${c.principles.map((x,i)=>`<article><span class="principle-number">0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></section>${contactCTA(lang,true)}`;
}
function contact(lang,config) {
 const c=copy[lang];
 const dest=config.contact.mode==='email'?`mailto:${config.contact.email}`:config.contact.url;
 const primary=config.contact.mode==='email'?(lang==='ja'?'メールで相談する':'Send an email'):c.contactPrimary;
 const note=config.contact.mode==='email'?(lang==='ja'?'メールアプリを開きます。送信はご自身の操作で行ってください。':'Opens your mail app. You decide whether to send.'):c.contactNote;
 return `${pageIntro('LET’S MAKE SOMETHING',c.contactTitle,c.contactLead)}<section class="container contact-layout"><div class="contact-route"><p class="eyebrow">PRIVATE INQUIRY</p><h2>${lang==='ja'?'まずは、相談から。':'Start a conversation.'}</h2>${link(dest,primary,'button')}<p class="contact-route-note">${note}</p><div class="contact-side-note"><p>${c.githubNote}</p>${link(config.github,'GitHub / FORIFOR')}</div></div><div class="brief-composer"><h2>${c.draftTitle}</h2><p>${c.draftNote}</p><div class="brief-fields"><label for="topic">${c.topicLabel}</label><select id="topic" name="topic">${[...c.serviceCards.map(x=>x[1]),lang==='ja'?'その他・共同開発':'Other / collaboration'].map(x=>`<option>${e(x)}</option>`).join('')}</select><label for="brief">${c.detailLabel} <span class="required">${lang==='ja'?'必須':'Required'}</span></label><textarea id="brief" name="brief" rows="5" maxlength="2000" required placeholder="${c.detailPlaceholder}" aria-describedby="brief-warning"></textarea><label for="timing">${c.timingLabel}</label><input id="timing" name="timing" type="text" maxlength="200" autocomplete="off"><p id="brief-warning" class="brief-warning">${c.draftWarning}</p><button class="button button-outline" type="button" id="copy-brief">${c.draftButton}<span aria-hidden="true">⧉</span></button><p class="copy-status" role="status" aria-live="polite"></p><textarea id="copy-fallback" readonly hidden rows="7" aria-label="${lang==='ja'?'手動コピー用の相談文':'Project brief for manual copying'}"></textarea><noscript><p>${lang==='ja'?'下書きのコピー機能はJavaScriptが必要です。左の相談フォームはそのまま利用できます。':'Copying the brief needs JavaScript. The external inquiry link works without it.'}</p></noscript></div></div></section>`;
}
function privacy(lang) {
 const c=copy[lang];
 return `${pageIntro('PRIVACY',c.privacyTitle,lang==='ja'?'現在の公開仕様に合わせて、情報の扱いを説明します。':'How information is handled by this version of the website.')}<div class="container"><article class="legal-content">${c.privacySections.map(x=>`<section><h2>${x[0]}</h2><p>${x[1]}</p></section>`).join('')}<a class="text-link" href="${href(lang,'contact')}">${c.contact}${arrow}</a></article></div>`;
}
function shell(body,lang,page,config) {
 const c=copy[lang],titleBase=page==='home'?(lang==='ja'?'できることの、その先をつくる。':'Make room for possible.'):({products:lang==='ja'?'プロダクト':'Products',services:lang==='ja'?'企業向けAI実装・FDE支援':'AI implementation for companies',work:lang==='ja'?'開発・検証記録':'Work notes',about:lang==='ja'?'ラボについて':'About',contact:lang==='ja'?'共同開発の相談':'Discuss a project',privacy:lang==='ja'?'プライバシー':'Privacy','404':'404'})[page];
 const title=`${titleBase} | ${config.name}`;
 const desc=strip(page==='home'?c.heroText:(c[`${page}Lead`] || c.footerBrand));
 const route=href(lang,pageKeys.includes(page)?page:'home');
 const canonical=config.origin.replace(/\/$/,'')+route;
 return `<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(desc)}"><meta name="theme-color" content="#f6f5f0"><meta name="color-scheme" content="light">${page==='404'?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="ja" href="${config.origin}${href('ja',page)}"><link rel="alternate" hreflang="en" href="${config.origin}${href('en',page)}"><link rel="alternate" hreflang="x-default" href="${config.origin}${href('ja',page)}">`}<meta property="og:type" content="website"><meta property="og:site_name" content="${e(config.name)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${lang==='ja'?'ja_JP':'en_US'}"><meta property="og:image" content="${config.origin}/assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="/assets/mark.svg"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script></head><body id="top" data-page="${page}">${nav(lang,page,config)}<main id="main">${body}</main>${footer(lang,config)}</body></html>\n`;
}
export async function build() {
 const config=validateConfig(JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8')));
 const dist=path.join(root,'dist');
 await fs.rm(dist,{recursive:true,force:true});
 await fs.mkdir(dist,{recursive:true});
 await fs.cp(path.join(root,'public'),dist,{recursive:true});
 const renderer={home,products:productsPage,services,work,about,contact,privacy};
 const routes=[];
 for(const lang of ['ja','en']) for(const page of pageKeys) {
   const route=href(lang,page), target=path.join(dist,route,'index.html');
   await fs.mkdir(path.dirname(target),{recursive:true});
   await fs.writeFile(target,shell(renderer[page](lang,config),lang,page,config));
   routes.push({route,lang,page});
 }
 const notfound=`<section class="container not-found"><p class="eyebrow">404 / NOT FOUND</p><h1>${copy.ja.notFound}</h1><p>${copy.ja.notFoundBody}</p><a class="button" href="/">${copy.ja.back}${arrow}</a></section>`;
 await fs.writeFile(path.join(dist,'404.html'),shell(notfound,'ja','404',config));
 const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r=>`<url><loc>${config.origin}${r.route}</loc></url>`).join('\n')}\n</urlset>\n`;
 await fs.writeFile(path.join(dist,'sitemap.xml'),sitemap);
 await fs.writeFile(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${config.origin}/sitemap.xml\n`);
 // Machine-readable claims inventory; nothing private is exported.
 await fs.writeFile(path.join(root,'docs','content-sources.json'),JSON.stringify({checkedAt:config.checkedAt,method:'Read public READMEs with the GitHub connector; applications were not rerun.',products:products.map(p=>({id:p.id,repo:p.repo,source:p.source,sourceBlobSha:p.sourceSha??null,evidence:p.evidence,preview:p.preview??null,previewSource:p.previewSource??null,status:p.ja.status,scope:p.ja.scope}))},null,2)+'\n');
 await fs.writeFile(path.join(root,'docs','routes.json'),JSON.stringify(routes,null,2)+'\n');
 console.log(`Built ${routes.length} localized pages + 404 into dist/. No network or API keys required.`);
 return routes;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build();
