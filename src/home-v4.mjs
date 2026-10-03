/**
 * Japanese and English home, v4 composition ("ランディングページ全体改修案").
 *
 * Runs after every other home pass and replaces the contents of <main> on both homes:
 * hero + manually selected footage → services → compact product catalogue
 * → optional access table → principles → FAQ → contact. The flagship access table, FAQ and
 * footer are reused so every fact still comes from the product ledger.
 *
 * - Complete without JavaScript: every video has native controls, every product is a link.
 * - Nothing autoplays; every <video> is preload="none". Recordings are labelled as edited.
 * - The 15-second films (Genie, Oathra) are labelled as edited films with motion graphics.
 * - TaskDock frames are design-file captures, labelled as such, not app recordings.
 * - Interface copy is localized; product claims come from the matching ledger language.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {esc} from '../public/assets/lab-core.mjs';
import {renderAccess, renderFaq} from './home-flagship.mjs';
import {landingExperience} from './product-landings.mjs';
import {copyFor} from './home-v4-copy.mjs';

// The hero states when the public sources were last checked. That is site.config.json checkedAt, not the
// later capability check in products.mjs (capabilitiesCheckedAt), which covered the product-page cards only.
const {checkedAt: sourcesCheckedAt} = JSON.parse(await fs.readFile(new URL('../site.config.json', import.meta.url), 'utf8'));

export const HOME_V4_VERSION = '20260930-home-clarity-2';
const CSS_MARK = '/* REACHMADE_HOME_V4 */';
const CSS_END = '/* END_REACHMADE_HOME_V4 */';
const JS_MARK = '// REACHMADE_HOME_V4';
const JS_END = '// END_REACHMADE_HOME_V4';
const arrow = '<span aria-hidden="true">↗</span>';

// Clip labels match public/media/products/manifest.json (edit.label.ja); for Oathra and Agent Team, the home clips in
// public/media/films/manifest.json (HOME_REC).
const CAT = Object.freeze({genie:'WORK','ai-meeting':'VOICE',oathra:'PHONE',aisecure:'SECURITY','agent-team':'AGENTS',launchloom:'MEDIA',noa:'LIVE'});
// What each product's footage is. Launchloom's source is a film the tool made about itself (ledger proof:
// 自身で作った紹介映像), not a screen recording of the app, so it is never called a recording.
// Oathra and Agent Team: on the home only, the owner's 2026-09-30 films replace their recordings (see HOME_REC). Oathra's
// film marks itself イメージ映像（演出を含む）; Agent Team's is the design film (renders, partly not implemented).
const kind = (id, lang) => copyFor(lang).kinds[id] || copyFor(lang).recording;
const FILM = Object.freeze({
  genie: {src:'/media/films/genie-15s.mp4', poster:'/media/films/genie-15s.jpg'},
  oathra: {src:'/media/films/oathra-15s.mp4', poster:'/media/films/oathra-15s.jpg'}
});
// Reuse the Genie product page's icon and frames, so the two pages cannot drift apart.
const ICON = Object.freeze({genie:landingExperience.genie.ja.icon});
const NEXT = Object.freeze(landingExperience.genie.ja.nextUi.frames.map(({title, body, src}) => ({title, body, src})));
// Home-only clips cut from the owner's films (public/media/films/manifest.json). /media/products/<id>.mp4 stays the
// product recording, which the product pages, the studio player and the signature film still use.
const HOME_REC = Object.freeze({
  // Genie: the product page's 「01 · HOW IT FEELS」 TaskDock reconstruction, written out as a 13-second film.
  genie: {src:'/media/films/genie-taskdock-13s.mp4', poster:'/media/films/genie-taskdock-13s.jpg'},
  oathra: {src:'/media/films/home-oathra-13s.mp4', poster:'/media/films/home-oathra-13s.jpg'},
  'agent-team': {src:'/media/films/home-agent-team-13s.mp4', poster:'/media/films/home-agent-team-13s.jpg'}
});
// Under those two clips the caption says what the clip is; the ledger's evidence (t.proof) is not about this footage,
// so it moves to the EVIDENCE line in 映像と利用条件 only.
const clipNote = (p, lang) => copyFor(lang).clipNotes[p.id] || p[lang].proof;
const rec = id => HOME_REC[id]?.src || `/media/products/${id}.mp4`;
const still = id => HOME_REC[id]?.poster || `/media/products/${id}.jpg`;
const base = lang => lang === 'en' ? '/en' : '';
const route = (id, lang) => `${base(lang)}/products/${id}/`;
const displayName = (p, lang) => lang === 'en' && p.id === 'noa' ? 'Noa' : p.name;
const local = url => String(url).replace(/^https:\/\/reachmade\.com(?=\/)/, '');
const link = (url, cls, label) => {
  const href = local(url), ext = /^https:/.test(href);
  return `<a class="${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
};

function ledger(products, lang = 'ja') {
  const c = copyFor(lang);
  if (!Array.isArray(products) || products.length < 1) throw new TypeError('Expected the product ledger');
  if (new Set(products.map(p => p.id)).size !== products.length) throw new TypeError('Duplicate product identifier');
  for (const p of products) if (!Object.hasOwn(c.clips, p.id) || !p[lang]) throw new TypeError(`Unknown product for the ${lang} v4 home: ${p.id}`);
  return products;
}

function hero(lang) {
  const c = copyFor(lang);
  return `<section class="v4-hero"><p class="v4-eyebrow">${esc(c.eyebrow)}</p><h1 class="v4-title"><span class="v4-line">${esc(c.title[0])}</span><span class="v4-line">${esc(c.title[1])}<em>${esc(c.dot)}</em></span></h1><p class="v4-hero-lead">${c.lead}</p><div class="v4-actions"><a class="v4-btn" href="${base(lang)}/contact/">${esc(c.consult)} ${arrow}</a><a class="v4-link" href="#products">${esc(c.seeWork)} <span aria-hidden="true">↓</span></a></div><p class="v4-hero-note">${esc(c.heroNote)}</p><div class="v4-hero-foot"><span>REACHMADE LAB</span><span>${esc(c.heroFoot)}</span></div></section>`;
}

function filmLabels(p, lang) {
  const c = copyFor(lang), name = displayName(p, lang), k = kind(p.id, lang);
  return {still: c.stillLabel(k), playing: `${k} · ${c.edited}`, video: `${name} ${k}${c.silentEdited}`, play: c.playLabel(name), copy: c.playCopy(name)};
}

function reel(list, lang) {
  const c = copyFor(lang), first = list[0], total = String(list.length).padStart(2, '0'), firstLabels = filmLabels(first, lang);
  const stills = list.map((p, i) => `<img class="v4-crop v4-still${i === 0 ? ' is-on' : ''}" src="${still(p.id)}" alt="" width="1280" height="720" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-v4-still="${esc(p.id)}">`).join('');
  const rail = list.map((p, i) => {
    const labels = filmLabels(p, lang);
    return `<a class="v4-choice${i === 0 ? ' is-on' : ''}" href="#${esc(p.id)}" data-studio-choice="${esc(p.id)}" data-v4-choice data-kind="${esc(kind(p.id, lang))}" data-proof="${esc(clipNote(p, lang))}" data-src="${rec(p.id)}" data-poster="${still(p.id)}" data-v4-rec="${rec(p.id)}" data-name="${esc(displayName(p, lang))}" data-clip="${esc(c.clips[p.id])}" data-disc="${esc(p.discipline)}" data-index="${esc(p.index)}" data-still-label="${esc(labels.still)}" data-playing-label="${esc(labels.playing)}" data-video-label="${esc(labels.video)}" data-play-label="${esc(labels.play)}" data-play-copy="${esc(labels.copy)}"><i class="v4-fill" aria-hidden="true"></i><span class="v4-choice-meta">${esc(p.index)} · ${esc(CAT[p.id])}</span><strong>${esc(displayName(p, lang))}</strong><small>${esc(c.clips[p.id])}</small></a>`;
  }).join('');
  // Tabs precede their panel in keyboard order. CSS presents the picture/caption above the rail.
  // The proof stays outside the framed surface but belongs to the panel via aria-describedby.
  return `<section class="v4-reel" id="reel" aria-label="${esc(c.reelLabel(list.length))}"><p class="v4-reel-eyebrow">${esc(c.reelTitle)} <span>PRODUCT FILMS</span></p><div class="v4-frame" data-v4-reel><nav class="v4-rail" aria-label="${esc(c.selectFilm)}">${rail}</nav><div class="v4-panel" id="v4-reel-panel" aria-describedby="v4-reel-proof"><div class="v4-screen" id="v4-reel-screen">${stills}<video class="v4-crop v4-reel-video" controls muted playsinline preload="none" poster="${still(first.id)}" aria-label="${esc(firstLabels.video)}"><source src="${rec(first.id)}" type="video/mp4">${esc(c.videoFallback)}</video><div class="v4-hud" aria-hidden="true"><b data-v4-reel-index>${esc(first.index)}</b> / ${total}<i></i><span data-v4-reel-disc>${esc(first.discipline)}</span></div><span class="v4-tag" data-v4-reel-tag><i aria-hidden="true"></i><span>${esc(kind(first.id, lang))} · ${esc(c.treatment)}</span></span><button class="v4-start" type="button" hidden data-v4-reel-start aria-label="${esc(firstLabels.play)}"><span class="v4-disc v4-disc--xl" aria-hidden="true"></span><strong>${esc(firstLabels.copy)}</strong><small>${esc(c.excerpt)}</small></button></div><div class="v4-cap" data-v4-reel-cap><span><strong data-v4-reel-name>${esc(displayName(first, lang))}</strong><small data-v4-reel-clip>${esc(c.clips[first.id])}</small></span><span class="v4-time" data-v4-reel-time>00:00 / 00:00</span></div></div></div><p class="v4-reel-proof" id="v4-reel-proof" data-v4-reel-proof>${esc(clipNote(first, lang))}</p><details class="v4-reel-notes"><summary>${esc(c.recordingNotes)}</summary><p>${esc(c.recordingNote(list.length))}</p></details></section>`;
}

function entry(p, lang) {
  const c = copyFor(lang);
  if (p.id === 'genie') return {url: `${route(p.id, lang)}#start`, label: c.setup, note: c.setupNote};
  if (p.id === 'ai-meeting') return {url: landingExperience[p.id][lang].primary[1], label: c.tasks, note: c.tasksNote};
  // The English Agent Team and Launchloom entries have their own published destinations.
  const url = lang === 'en' ? landingExperience[p.id].en.primary[1] : p.demo;
  return {url, label: p[lang].demoLabel, note: c.entryNotes[p.id]};
}

function chapter(p, lang) {
  const c = copyFor(lang), t = p[lang], id = esc(p.id), name = displayName(p, lang), f = FILM[p.id], start = entry(p, lang);
  // Fifteen-second film sections and Noa's #watch are Japanese-only additions. English uses
  // the same real film asset and its existing localized start section, never a missing anchor.
  const extraFilm = f ? `<a class="v4-link" href="${lang === 'ja' ? `${route(p.id, lang)}#film15-${id}-title` : f.src}">${esc(c.film15)} ${arrow}</a>` : '';
  const extraNoa = p.id === 'noa' ? `<a class="v4-link" href="${route(p.id, lang)}#${lang === 'ja' ? 'watch' : 'start'}">${esc(c.noaExplainer)} →</a>` : '';
  const nextUi = p.id === 'genie' ? `<a class="v4-link" href="${route(p.id, lang)}#next-ui">${esc(c.nextUi)} →</a><p>${esc(c.nextUiNote)}</p>` : '';
  return `<article class="v4-chapter" id="${id}" data-v4-chapter="${id}" data-kind="${esc(kind(p.id, lang))}" data-proof="${esc(t.proof)}" data-name="${esc(name)}" data-index="${esc(p.index)}" data-disc="${esc(p.discipline)}" data-clip="${esc(c.clips[p.id])}"${f ? ` data-v4-film-src="${f.src}" data-v4-film-poster="${f.poster}"` : ''} aria-labelledby="v4-${id}-title"><div class="v4-card-top"><span class="v4-num">${esc(p.index)} / ${esc(name)}</span><span class="v4-pill">${esc(t.status)}</span></div><h3 id="v4-${id}-title">${esc(t.headline)}</h3><p class="v4-card-outcome">${esc(t.outcome)}</p><a class="v4-card-image" href="${route(p.id, lang)}" aria-label="${esc(c.productPage(name))}"><img src="${esc(p.preview)}" alt="${esc(t.previewLabel)}" width="1280" height="720" loading="lazy" decoding="async"><span>${esc(c.viewProduct)} ${arrow}</span></a><p class="v4-image-note">${esc(t.previewLabel)}</p><p class="v4-card-short">${esc(t.short)}</p><p class="v4-entry-note">${esc(start.note)}</p><div class="v4-cta">${link(start.url, 'v4-link', `${esc(start.label)} ${arrow}`)}<a class="v4-card-detail" href="${route(p.id, lang)}">${esc(c.productDetails)} <span aria-hidden="true">→</span></a></div><details class="v4-scope"><summary>${esc(c.scope)} <span aria-hidden="true">＋</span></summary><div class="v4-scope-body"><p>${esc(t.description)}</p><figure class="v4-figure"><div class="v4-screen v4-screen--sm"><video class="v4-crop" controls muted playsinline preload="none" poster="${still(p.id)}" aria-label="${esc(filmLabels(p, lang).video)}"><source src="${rec(p.id)}" type="video/mp4">${esc(c.videoFallback)}</video></div><figcaption>${esc(c.clips[p.id])} · ${esc(kind(p.id, lang))}${esc(c.silentEdited)}<span class="v4-proof">${esc(clipNote(p, lang))}</span></figcaption></figure>${c.clipNotes[p.id] ? `<p><b>${esc(c.publishedEvidence)}</b><br>${esc(t.proof)}</p>` : ''}<p>${esc(t.scope)}</p><p class="v4-lic">${esc(c.license)}${esc(t.license)}</p>${extraFilm}${extraNoa}${nextUi}</div></details><a class="v4-link" href="${base(lang)}/work/#${id}">${lang==='ja'?'検証記録と、相談できること':'Evaluation notes and project possibilities'} →</a></article>`;
}

function access(list, lang) {
  const c = copyFor(lang);
  const namedList = list.map(p => ({...p, name: displayName(p, lang)}));
  let html = renderAccess(namedList, lang);
  for (const p of list) {
    const start = entry(p, lang);
    html = html.replace(`<a class="rm-access-link" href="${route(p.id, lang)}">${c.accessOriginalLink} ${arrow}</a>`, link(start.url, 'rm-access-link', `${esc(start.label)} ${arrow}`));
  }
  return `<section class="v4-access v4-wrap" id="access"><details><summary><span>${esc(c.access)}</span><span class="v4-access-hint">${esc(c.accessHint)} <i aria-hidden="true">＋</i></span></summary>${html.replace(' id="access"', '')}</details></section>`;
}

export function renderHomeV4(products, lang = 'ja') {
  const c = copyFor(lang), list = ledger(products, lang), b = base(lang);
  const reelList = [...list.filter(p => p.id === 'ai-meeting'), ...list.filter(p => p.id !== 'ai-meeting')];
  return `<div class="v4" lang="${lang}" data-home-v4-root data-reel-error="${esc(c.reelError)}"><div class="v4-opening v4-wrap">${hero(lang)}${reel(reelList, lang)}</div><section class="v4-services" id="services" aria-labelledby="v4-services-title"><div class="v4-wrap"><div class="v4-head"><div><p class="v4-kicker">${esc(c.servicesKicker)}</p><h2 id="v4-services-title">${c.servicesTitle}</h2></div><div class="v4-services-lead"><p>${esc(c.servicesLead)}</p><a class="v4-link" href="${b}/services/">${esc(c.servicesLink)} <span aria-hidden="true">→</span></a></div></div><ol class="v4-grid">${c.services.map(([h,b,r],i)=>`<li><span>0${i+1}</span><h3>${esc(h)}</h3><p>${esc(b)}</p><small>${esc(r)}</small></li>`).join('')}</ol></div></section><section class="v4-products v4-wrap" id="products" aria-labelledby="v4-products-title"><div class="v4-head"><div><p class="v4-kicker">${esc(c.productsKicker)} / ${String(list.length).padStart(2,'0')}</p><h2 id="v4-products-title">${c.productsTitle}</h2></div><p>${c.productsLead}</p></div><div class="v4-list">${list.map(p => chapter(p, lang)).join('')}</div><p class="v4-source-note">${esc(c.sourceNote(sourcesCheckedAt))}</p></section>${access(list, lang)}<section class="v4-principles" id="principles" aria-labelledby="v4-principles-title"><div class="v4-wrap"><div class="v4-head"><div><p class="v4-kicker">${esc(c.principlesKicker)}</p><h2 id="v4-principles-title">${c.principlesTitle}</h2></div><div class="v4-about"><p>${c.principlesLead}</p><a class="v4-link" href="${b}/about/">${esc(c.about)} →</a><a class="v4-link" href="${b}/work/">${esc(c.work)} →</a></div></div><ol class="v4-three">${c.principles.map(([h,b],i)=>`<li><span>0${i+1}</span><h3>${esc(h)}</h3><p>${esc(b)}</p></li>`).join('')}</ol></div></section>${renderFaq(lang)}<section class="v4-contact" id="contact" aria-labelledby="v4-contact-title"><div class="v4-wrap"><p class="v4-kicker">LET’S MAKE SOMETHING</p><h2 id="v4-contact-title">${c.contactTitle}<em>${esc(c.dot)}</em></h2><div class="v4-contact-row"><p>${c.contactLead}</p><a class="v4-btn" href="${b}/contact/">${esc(c.consult)} ${arrow}</a></div></div></section></div>`;
}

const MAIN = /<main id="main">[\s\S]*?<\/main>/;

/** Fail closed: the flagship pass owns the shell (title, footer, access/FAQ renderers) this relies on. */
export function refineHomeV4(html, products, lang = 'ja') {
  copyFor(lang);
  if (html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] !== lang) throw new Error(`v4 home: document language must match ${lang}`);
  if (html.includes(`data-home-v4="${HOME_V4_VERSION}"`)) return html;
  if (!html.includes('data-home-flagship="')) throw new Error('The flagship pass must run before the v4 home');
  if ((html.match(/<main id="main">/g) || []).length !== 1 || !MAIN.test(html)) throw new Error('Unknown homepage shell; refusing a partial v4 rewrite');
  const body = renderHomeV4(products, lang);
  return html.replace(MAIN, () => `<main id="main">${body}</main>`).replace('<body ', `<body data-home-v4="${HOME_V4_VERSION}" `);
}

/** These existing modules still serve product pages. The v4 home has none of their UI. */
function guardUnusedHomeImports(js) {
  const statements = [
    "import('./animated-demos.mjs').catch(() => { document.documentElement.dataset.demoState = 'unavailable'; });",
    "import('./lab-explorer.mjs').catch(() => { document.documentElement.dataset.labState='unavailable'; });",
    "import('./lab-signature.mjs').catch(() => { document.documentElement.dataset.signatureState='unavailable'; });",
    "import('./outcome-controls.mjs').catch(()=>{document.documentElement.dataset.outcomeControls='unavailable';});"
  ];
  const lines = js.split('\n');
  for (const statement of statements) {
    const guarded = `if (!document.body.dataset.homeV4) ${statement}`;
    const matches = lines.flatMap((line, index) => line.trim() === statement || line.trim() === guarded ? [index] : []);
    if (matches.length !== 1) throw new Error(`v4 home: expected exactly one known legacy import: ${statement}`);
    lines[matches[0]] = guarded;
  }
  return lines.join('\n');
}

/** Replace only our own layer; later product-page layers must survive repeated writes. */
function replaceLayer(existing, start, end, layer) {
  const block = `${start}\n${layer.trimEnd()}\n${end}`;
  if (!existing.includes(start) && !existing.includes(end)) return `${existing.trimEnd()}\n${block}\n`;
  const from = existing.indexOf(start), to = existing.indexOf(end);
  if (from < 0 || to < from || existing.indexOf(start, from + start.length) !== -1 || existing.indexOf(end, to + end.length) !== -1) {
    throw new Error(`v4 home: missing or duplicate layer boundary ${start}`);
  }
  return existing.slice(0, from) + block + existing.slice(to + end.length);
}

export async function writeHomeV4(dist, products) {
  const list = ledger(products), assets = path.join(dist, 'assets');
  const required = [...list.flatMap(p => [rec(p.id), still(p.id)]), ...Object.values(FILM).flatMap(f => [f.src, f.poster]), ...Object.values(ICON), ...NEXT.map(n => n.src), '/assets/home-v4.mjs'];
  for (const asset of required) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`v4 home: missing ${asset}`); });
  // Read and validate both pages before writing either. Shared layers are appended exactly once.
  const pages = await Promise.all(['ja', 'en'].map(async lang => {
    const file = path.join(dist, lang === 'ja' ? 'index.html' : 'en/index.html');
    return {file, html: refineHomeV4(await fs.readFile(file, 'utf8'), list, lang)};
  }));
  const [css, js, layer] = await Promise.all(['showcase.css', 'showcase.mjs', 'home-v4.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-home-v4]')) throw new Error('v4 home stylesheet is missing or stale');
  const sharedJs = guardUnusedHomeImports(js);
  const homeImport = "if(document.body.dataset.homeV4)import('./home-v4.mjs').catch(()=>{document.documentElement.dataset.homeV4='unavailable';});";
  const nextCss = replaceLayer(css, CSS_MARK, CSS_END, layer);
  const nextJs = replaceLayer(sharedJs, JS_MARK, JS_END, homeImport);
  for (const {file, html} of pages) await fs.writeFile(file, html);
  await fs.writeFile(path.join(assets, 'showcase.css'), nextCss);
  await fs.writeFile(path.join(assets, 'showcase.mjs'), nextJs);
}
