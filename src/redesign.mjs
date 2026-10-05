/**
 * 2026-10 redesign — final composition pass for the home (ja/en) and the fourteen product pages.
 *
 * Built from the owner's "Reachmade home redesign" handoff (Home + Product references). It runs after every other
 * layer and rewrites <body>: a new header, the new section sequence, and a new footer. The owner chose to keep the
 * existing content that the reference does not show, so:
 * - Home: the access table (#access) and FAQ (#faq) move into the new sequence unchanged.
 * - Product pages: every existing section stays (re-styled) except the ones the new template replaces — the generic
 *   hero, the ledger feature list, the consult band, related products and the old footer. A bespoke hero that carries
 *   other footage than the new film section (Genie's TaskDock reconstruction, Oathra's concept film, Agent Team's real
 *   recording) is kept with its heading demoted, so no recording or label disappears.
 *
 * Rules carried over from the earlier layers:
 * - Every claim comes from products.mjs (and home section copy from home-v4-copy.mjs). Interface labels only in
 *   redesign-copy.mjs.
 * - Nothing autoplays; every <video> has native controls and preload="none". Each film says what it is.
 * - Complete without JavaScript. Motion is added by /assets/redesign.mjs and disabled under reduced motion.
 * - One stylesheet and one script per page: CSS and the client import are appended to showcase.css/showcase.mjs
 *   between markers, idempotently. Fails closed on an unknown page shell.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {esc} from '../public/assets/lab-core.mjs';
import {copyFor as homeCopyFor} from './home-v4-copy.mjs';
import {redesignCopyFor} from './redesign-copy.mjs';
import {capabilitiesCheckedAt} from './products.mjs';
import {productNavigation} from './site-experience.mjs';
import {recordings} from './films.mjs';

const {checkedAt: sourcesCheckedAt} = JSON.parse(await fs.readFile(new URL('../site.config.json', import.meta.url), 'utf8'));

export const REDESIGN_VERSION = '20261003-redesign-1';
const CSS_MARK = '/* REACHMADE_REDESIGN */';
const CSS_END = '/* END_REACHMADE_REDESIGN */';
const JS_MARK = '// REACHMADE_REDESIGN';
const JS_END = '// END_REACHMADE_REDESIGN';

/** Owner-supplied Agent Team film (agent-team-lp-ja.mp4, sha256 c09914a3…) as already imported: audio removed. */
export const AGENT_TEAM_FILM = Object.freeze({src: '/media/films/agent-team-design-30s.mp4', poster: '/assets/products/agent-team/next-ui-01.jpg'});
const REEL = Object.freeze({src: '/media/films/reachmade-15s.mp4', poster: '/media/films/reachmade-15s.jpg'});
/** Owner's choice (2026-10-05): Agent Team's image in the redesign is a frame of its design film (21 s, 「4つとも、合格です」),
 * not the older run-record screenshot. p.preview stays the still of the kept real-recording block, so a design frame
 * never stands in for the recording. */
export const STILLS = Object.freeze({'agent-team': '/assets/products/agent-team/film-still.jpg'});
export const stillOf = (p, lang) => (Object.hasOwn(STILLS, p.id) ? {src: STILLS[p.id], label: redesignCopyFor(lang).stillLabels[p.id]} : {src: p.preview, label: p[lang].previewLabel});

/** The film each product page shows in its #film section, and what kind of footage it is. */
export function productFilm(id) {
  if (id === 'agent-team') return {...AGENT_TEAM_FILM, kind: 'agent-team'};
  // /media/products/noa.mp4 is a 13-second edit of the same introduction film.
  if (id === 'noa') return {src: '/media/originals/noa/lp-film.mp4', poster: '/media/products/noa.jpg', kind: 'noa', covers: ['/media/products/noa.mp4']};
  return {src: `/media/products/${id}.mp4`, poster: `/media/products/${id}.jpg`, kind: id === 'launchloom' ? 'launchloom' : 'recording'};
}

const base = lang => (lang === 'en' ? '/en' : '');
const route = (id, lang) => `${base(lang)}/products/${id}/`;
const displayName = (p, lang) => (lang === 'en' && p.id === 'noa' ? 'Noa' : p.name);
const local = url => String(url).replace(/^https:\/\/reachmade\.com(?=\/)/, '');
const external = href => /^https?:/.test(href);
const ext = href => (external(href) ? ' target="_blank" rel="noopener noreferrer"' : '');
const host = url => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return 'reachmade.com'; } };
const contactHref = (lang, fragment = '') => `${base(lang)}/contact/${fragment}`;
const markImg = '<img class="rd-mark" src="/assets/mark.svg" alt="" width="26" height="26">';
const arrowHead = (w, h) => `<svg class="rd-head" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><polyline points="2,2 ${w - 2},${h / 2} 2,${h - 2}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

function ledger(products) {
  if (!Array.isArray(products) || products.length < 1) throw new TypeError('Redesign: expected the product ledger');
  if (new Set(products.map(p => p.id)).size !== products.length) throw new TypeError('Redesign: duplicate product identifier');
  for (const p of products) {
    for (const lang of ['ja', 'en']) {
      const t = p[lang];
      if (!t || !Array.isArray(t.highlights) || t.highlights.length < 1 || !Array.isArray(t.features) || !t.outcome || !t.scope || !t.proof || !t.consult) {
        throw new TypeError(`Redesign: incomplete ledger entry ${p.id}/${lang}`);
      }
    }
    if (!p.preview) throw new TypeError(`Redesign: ${p.id} has no preview image`);
  }
  return products;
}

/* ---------- HTML structure helpers (fail closed) ---------- */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** Top-level elements of an HTML fragment, with their source ranges. Throws on unbalanced markup. */
export function topLevel(fragment) {
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const stack = [], out = [];
  let current = null, m;
  while ((m = re.exec(fragment))) {
    if (m[0].startsWith('<!--')) continue;
    const [, closing, rawTag, attrs] = m, tag = rawTag.toLowerCase();
    if (!closing) {
      const selfClosing = VOID.has(tag) || /\/\s*$/.test(attrs);
      if (!stack.length) current = {tag, start: m.index, open: m[0]};
      if (selfClosing) { if (!stack.length) out.push({...current, end: re.lastIndex}); }
      else stack.push(tag);
    } else {
      const top = stack.pop();
      if (top !== tag) throw new Error(`Redesign: unbalanced markup near </${tag}> (expected </${top}>)`);
      if (!stack.length) out.push({...current, end: re.lastIndex});
    }
  }
  if (stack.length) throw new Error(`Redesign: unclosed <${stack.at(-1)}>`);
  return out.map(n => ({...n, html: fragment.slice(n.start, n.end)}));
}

const classOf = node => (/\bclass="([^"]*)"/.exec(node.open)?.[1] || '').split(/\s+/);
const idOf = node => /\bid="([^"]*)"/.exec(node.open)?.[1] || '';

function mainOf(html) {
  const opens = html.match(/<main\b[^>]*>/g) || [];
  if (opens.length !== 1 || (html.match(/<\/main>/g) || []).length !== 1) throw new Error('Redesign: expected exactly one <main>');
  const start = html.indexOf(opens[0]) + opens[0].length, end = html.indexOf('</main>');
  return html.slice(start, end);
}

/** Find one element anywhere in a fragment by id, by walking nested top-level ranges. */
function findById(fragment, id) {
  for (const node of topLevel(fragment)) {
    if (idOf(node) === id) return node.html;
    const inner = node.html.slice(node.open.length, node.html.lastIndexOf('<'));
    if (inner.includes(`id="${id}"`)) { const hit = findById(inner, id); if (hit) return hit; }
  }
  return null;
}

/* ---------- Shared chrome ---------- */

function langLinks(lang, jaHref, enHref) {
  const r = redesignCopyFor(lang);
  return `<nav class="rd-lang" aria-label="${esc(r.langSwitch)}"><a href="${jaHref}" lang="ja" hreflang="ja"${lang === 'ja' ? ' aria-current="page"' : ''}>JA</a><span aria-hidden="true">/</span><a href="${enHref}" lang="en" hreflang="en"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a></nav>`;
}

function brand(lang) {
  const r = redesignCopyFor(lang);
  return `<a class="rd-brand" href="${base(lang)}/" aria-label="Reachmade Lab — ${esc(r.home)}">${markImg}<span class="rd-brand-name">Reachmade</span><span class="rd-brand-lab">Lab</span></a>`;
}

function homeHeader(lang) {
  const r = redesignCopyFor(lang);
  return `<header class="site-header rd-header" data-rd-header>${brand(lang)}<button class="nav-toggle rd-toggle" type="button" aria-expanded="false" aria-controls="main-nav">${esc(r.menu)}<span aria-hidden="true">＋</span></button><nav id="main-nav" class="main-nav rd-nav" aria-label="${lang === 'ja' ? 'メインナビゲーション' : 'Main navigation'}">${r.nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}</nav><div class="rd-header-end"><span class="rd-clock" data-rd-clock hidden></span>${langLinks(lang, '/', '/en/')}</div></header>`;
}

function productHeader(p, list, lang) {
  const r = redesignCopyFor(lang);
  const switcher = list.map(q => `<a href="${route(q.id, lang)}" title="${esc(displayName(q, lang))}" aria-label="${esc(`${q.index} ${displayName(q, lang)}`)}"${q.id === p.id ? ' aria-current="page"' : ''}>${esc(q.index)}</a>`).join('');
  return `<header class="site-header rd-header rd-header--product" data-rd-header>${brand(lang)}<button class="nav-toggle rd-toggle" type="button" aria-expanded="false" aria-controls="main-nav">${esc(r.menu)}<span aria-hidden="true">＋</span></button><nav id="main-nav" class="main-nav rd-nav rd-switcher" aria-label="${lang === 'ja' ? 'プロダクト一覧' : 'Products'}">${switcher}</nav><div class="rd-header-end"><a class="rd-header-link" href="${base(lang)}/#products">${esc(r.allProducts)}</a><a class="rd-header-link" href="#consult">${esc(r.consultNav)} <span aria-hidden="true">↗</span></a>${langLinks(lang, route(p.id, 'ja'), route(p.id, 'en'))}</div></header>`;
}

function footerColumns(lang, jaHref, enHref) {
  const r = redesignCopyFor(lang);
  const cols = r.footCols.map(([title, links]) => `<div><p>${title}</p>${links.map(([href, label]) => `<a href="${href}"${ext(href)}>${esc(label)}</a>`).join('')}</div>`).join('');
  return `<div class="rd-foot-cols">${cols}<div><p>${r.lang[0]}</p><a href="${jaHref}" lang="ja" hreflang="ja">${r.lang[1]}</a><a href="${enHref}" lang="en" hreflang="en">${r.lang[2]}</a></div></div>`;
}

function footerBottom(lang, middle) {
  const r = redesignCopyFor(lang);
  return `<div class="rd-foot-bottom"><span>${r.copyright}</span>${middle}<a href="#top">${r.top}</a></div>`;
}

function video({src, poster, label, cls = ''}, lang) {
  const r = redesignCopyFor(lang);
  return `<video class="${cls}" controls playsinline preload="none" poster="${esc(poster)}" aria-label="${esc(label)}"><source src="${esc(src)}" type="video/mp4">${esc(r.videoFallback)}</video>`;
}

/* ---------- Home ---------- */

function homeMain(products, lang, kept) {
  const c = homeCopyFor(lang), r = redesignCopyFor(lang), n = products.length;
  const first = products[0];
  const marqueeOnce = products.map(p => `<span class="rd-mq-item"><span class="rd-mq-index">${esc(p.index)}</span><span class="rd-mq-name">${esc(displayName(p, lang))}</span><span class="rd-mq-disc">${esc(p.discipline.toLowerCase())}</span><i></i></span>`).join('');
  const rows = products.map(p => {
    const t = p[lang], isAT = p.id === 'agent-team', still = stillOf(p, lang);
    const film = isAT ? ` data-rd-film="${AGENT_TEAM_FILM.src}" data-rd-film-label="${esc(`${p.index} — ${r.filmKinds['agent-team']}`)}"` : '';
    const choice = p.id === 'genie' ? ' data-studio-choice="genie"' : '';
    return `<li><a class="rd-row" href="${route(p.id, lang)}" data-rd-row data-rd-preview="${esc(still.src)}" data-rd-label="${esc(`${p.index} — ${still.label}`)}"${film}${choice}><span class="rd-row-index">${esc(p.index)}</span><span class="rd-row-name">${esc(displayName(p, lang))}</span><span class="rd-row-copy"><span class="rd-row-headline">${esc(t.headline)}</span><span class="rd-row-outcome">${esc(t.outcome)}</span></span><span class="rd-row-meta"><span>${esc(p.discipline)}</span><span class="rd-row-status">${esc(t.status)}</span></span><span class="rd-row-go" aria-hidden="true">↗</span></a></li>`;
  }).join('');
  const [svcFirst, svcSecond = ''] = c.servicesTitle.split('<br>');
  // Every product keeps a no-script route to its evidence record, and the two 15-second films stay one click away.
  const FILM15 = ['genie', 'oathra'];
  const records = `<div class="rd-records"><p class="rd-kicker">${esc(r.records)}</p><ul>${products.map(p => `<li><span>${esc(p.index)} ${esc(displayName(p, lang))}</span><a href="${base(lang)}/work/#${p.id}">${esc(r.recordLink)}</a>${lang === 'ja' && FILM15.includes(p.id) ? `<a href="/products/${p.id}/#film15-${p.id}-title">${esc(c.filmLabels[p.id] || c.film15)}</a>` : ''}</li>`).join('')}</ul></div>`;
  const services = c.services.map(([title, body, related], i) => `<article class="rd-svc" data-rd-reveal><div class="rd-svc-top"><span class="rd-svc-num">0${i + 1}</span><span class="rd-svc-rel">${esc(related)}</span></div><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('');
  const principles = c.principles.map(([title, body], i) => `<article class="rd-pr" data-rd-reveal><span class="rd-pr-num">/0${i + 1}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></article>`).join('');
  return `<section class="rd-hero">
<div class="rd-meta"><span>${esc(r.meta[0])}</span><span>${esc(r.meta[1](n))}</span><span class="rd-meta-jp">${esc(c.eyebrow)}</span></div>
<h1 class="rd-h1"><span class="rd-line"><span data-rd-line>${esc(c.title[0])}</span></span><span class="rd-arrow" aria-hidden="true"><span class="rd-arrow-line" data-rd-arrow></span><span class="rd-capsule" data-rd-capsule><img src="${esc(stillOf(first, lang).src)}" alt="" data-rd-cap-img></span><span class="rd-capsule-label" data-rd-capsule data-rd-cap-label>${esc(`${first.index} ${displayName(first, lang)}`)}</span>${arrowHead(22, 30)}</span><span class="rd-line rd-line--end"><span data-rd-line>${esc(c.title[1])}<em>${esc(c.dot)}</em></span></span></h1>
<div class="rd-hero-foot"><p class="rd-lead" data-rd-fade>${c.lead}</p><div class="rd-ctas" data-rd-fade><a class="rd-btn rd-btn--ink" href="${contactHref(lang)}">${esc(c.consult)}<span aria-hidden="true">↗</span></a><a class="rd-btn rd-btn--line" href="#products">${esc(c.seeWork)}<span aria-hidden="true">↓</span></a></div><p class="rd-scroll" data-rd-fade>${esc(r.scroll[0])}<br>${esc(r.scroll[1])}</p></div>
</section>
<div class="rd-marquee" aria-hidden="true"><div class="rd-mq-track">${marqueeOnce}${marqueeOnce}</div></div>
<section class="rd-reel" data-rd-reel aria-label="${esc(r.reelLabel)}"><div class="rd-reel-stage"><div class="rd-reel-frame" data-rd-frame>${video({...REEL, label: `${r.reelLabel} — ${r.reelCaption}`}, lang)}</div><div class="rd-reel-cap"><span>${esc(r.reelKicker)}</span><span>${esc(r.reelCaption)}</span></div></div></section>
<section class="rd-products" id="products" aria-labelledby="rd-products-title"><div class="rd-sec-head"><p class="rd-kicker">${esc(r.productsKicker)}</p><h2 id="rd-products-title" data-rd-reveal>${c.productsTitle}</h2><p data-rd-reveal>${c.productsLead}</p></div><ol class="rd-rows" data-rd-rows>${rows}</ol>${records}<p class="rd-footnote">${esc(c.sourceNote(sourcesCheckedAt))}</p></section>
<div class="rd-kept rd-kept--home"><p class="rd-kicker rd-kept-kicker">${esc(r.keptKicker)}</p>${kept.join('')}</div>
<section class="rd-services rd-forest" id="services" aria-labelledby="rd-services-title"><p class="rd-kicker">${esc(r.servicesKicker)}</p><h2 id="rd-services-title" data-rd-reveal>${svcFirst}<br><em>${svcSecond}</em></h2><p class="rd-services-lead" data-rd-reveal>${esc(c.servicesLead)}</p><div class="rd-svc-grid">${services}</div><div class="rd-services-cta"><a class="rd-btn rd-btn--amber" href="${base(lang)}/services/">${esc(c.servicesLink)}<span aria-hidden="true">→</span></a></div></section>
<section class="rd-principles rd-forest" id="principles" aria-labelledby="rd-principles-title"><div class="rd-card"><div class="rd-pr-side"><div class="rd-sticky"><p class="rd-kicker">${esc(r.principlesKicker)}</p><h2 id="rd-principles-title">${c.principlesTitle}</h2><p>${c.principlesLead}</p><div class="rd-pills"><a class="rd-pill" href="${base(lang)}/work/">${esc(c.work)} <span aria-hidden="true">↗</span></a><a class="rd-pill rd-pill--soft" href="${base(lang)}/about/">${esc(c.about)}</a></div></div></div><div class="rd-pr-list">${principles}</div></div></section>
<section class="rd-contact rd-forest" id="contact" aria-labelledby="rd-contact-title"><p class="rd-kicker">${esc(r.contactKicker)}</p><a class="rd-contact-link" href="${contactHref(lang)}" data-rd-reveal><h2 id="rd-contact-title">${c.contactTitle}<span class="rd-contact-dot" aria-hidden="true">↗</span></h2></a><p class="rd-contact-lead">${c.contactLead}</p></section>`;
}

function homeFooter(lang) {
  const c = homeCopyFor(lang);
  return `<footer class="rd-footer rd-forest">${footerColumns(lang, '/', '/en/')}<p class="rd-wordmark" aria-hidden="true">Reachmade<em>lab</em></p>${footerBottom(lang, `<span>${esc(c.heroFoot)}</span>`)}</footer>`;
}

/* ---------- Product page ---------- */

/** Remove a moved figure, and the wrapper it leaves empty (e.g. .ad-room-screen), so no blank frame remains. */
function withoutFigure(html, figure) {
  const at = html.indexOf(figure);
  if (at < 0) throw new Error('Redesign: figure to move not found');
  let out = html.slice(0, at) + html.slice(at + figure.length);
  const before = out.slice(0, at), after = out.slice(at);
  const open = /<div\b[^>]*>\s*$/.exec(before), close = /^\s*<\/div>/.exec(after);
  if (open && close) out = before.slice(0, open.index) + after.slice(close[0].length);
  return out;
}

/** The first <figure> (at any depth) whose markup satisfies the predicate, with its exact source text. */
function findFigure(fragment, test) {
  for (const node of topLevel(fragment)) {
    if (node.tag === 'figure' && test(node.html)) return node.html;
    const inner = node.html.slice(node.open.length, node.html.lastIndexOf('<'));
    if (inner.includes('<figure')) { const hit = findFigure(inner, test); if (hit) return hit; }
  }
  return null;
}

const filmSources = html => [...html.matchAll(/\b(?:src|data-recording-src)="([^"]+\.mp4)"/g)].map(m => m[1]);

/**
 * Split the existing product <main> into what the new template reuses:
 * - figure: the existing recording block for the same film (labels, play button, edit note, source link) — it moves
 *   into the new #film frame instead of being duplicated.
 * - source: the feature provenance line (README / private repository and check date) for the new features section.
 * - kept: every other section, in order. The old hero always stays (its h1 becomes an h2): it carries the first action,
 *   its boundary note, access details and any other footage.
 * Replaced by the new template: the ledger feature list (unless it has its own media), the consult band, related
 * products and the old footer.
 */
function splitProductMain(main, film, {filmInPlace = false} = {}) {
  const nodes = topLevel(main);
  if (!nodes.length) throw new Error('Redesign: empty product main');
  const HERO = ['owned-hero-grid', 'olp-hero', 'nlp-hero'];
  const DROP = ['owned-consult', 'studio-related', 'owned-footer'];
  const same = src => src === film.src || (film.covers || []).includes(src);
  const kept = [];
  let heroSeen = false, figure = null, source = null;
  for (const node of nodes) {
    const cls = classOf(node);
    let html = node.html;
    if (cls.some(c => HERO.includes(c))) {
      heroSeen = true;
      figure = findFigure(html, f => filmSources(f).some(same));
      if (figure) html = withoutFigure(html, figure);
      kept.push(html.replace(/<h1\b/g, '<h2').replace(/<\/h1>/g, '</h2>'));
      continue;
    }
    if (cls.some(c => DROP.includes(c)) || node.tag === 'footer') continue;
    if (cls.includes('owned-features') && !/<(img|video|figure)\b/.test(html)) {
      source = /<p class="owned-features__source">[\s\S]*?<\/p>/.exec(html)?.[0] || null;
      continue;
    }
    kept.push(html);
  }
  if (!heroSeen) throw new Error('Redesign: product hero not found; refusing a partial rewrite');
  // Otherwise the figure moves up from a later section (Agent Team's design film). A page composed from an owner brief
  // keeps its order (Japanese Oathra: 04 · 実録画): the #film section then links there instead of repeating the film.
  let filmAnchor = null;
  for (let i = 0; !figure && !filmInPlace && i < kept.length; i++) {
    const hit = findFigure(kept[i], f => filmSources(f).some(same));
    if (hit) { figure = hit; kept[i] = withoutFigure(kept[i], hit); }
  }
  if (!figure) {
    const at = kept.findIndex(k => filmSources(k).some(same));
    if (at >= 0) {
      filmAnchor = /\bid="([^"]+)"/.exec(topLevel(kept[at])[0].open)?.[1];
      if (!filmAnchor) throw new Error(`Redesign: ${film.src} sits in a section without an id`);
    }
  }
  return {kept, figure, source, filmAnchor};
}

function productMain(p, list, lang, {kept, figure, source, filmAnchor}) {
  const r = redesignCopyFor(lang), t = p[lang], name = displayName(p, lang), n = list.length;
  const film = productFilm(p.id), nav = productNavigation(p, lang), still = stillOf(p, lang);
  const long = name.length > 8 || p.id === 'noa';
  const steps = t.outcome.split(' → ');
  const outcome = steps.map((s, i) => `<li><span>${esc(s)}</span>${i < steps.length - 1 ? `<span class="rd-step-arrow" aria-hidden="true"><i></i>${arrowHead(12, 18)}</span>` : ''}</li>`).join('');
  const highlights = t.highlights.map((h, i) => `<article class="rd-hl" data-rd-reveal><span class="rd-hl-n">0${i + 1}</span><p class="rd-hl-value">${esc(h.value)}</p><p class="rd-hl-label">${esc(h.label)}</p></article>`).join('');
  const features = t.features.map(f => `<article class="rd-feat" data-rd-reveal><span class="rd-feat-code">${esc(f.code)}</span><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p><ul class="rd-tags">${f.tags.map(tag => `<li>${esc(tag)}</li>`).join('')}</ul></article>`).join('');
  const links = [
    ['demo', nav.demo, nav.demoLabel],
    ...(p.closedSource || !p.repo ? [] : [['source', p.repo, r.sourceLabel]]),
    ['evidence', p.evidence, t.evidenceLabel || r.evidenceLabel]
  ].map(([kind, url, label]) => { const href = local(url); return `<li><a class="rd-link-row" href="${esc(href)}"${ext(href)}><span class="rd-link-kind">${r.linkKinds[kind]}</span><span class="rd-link-label">${esc(label)}</span><span class="rd-link-host">${esc(external(href) ? host(href) : 'reachmade.com')} <span aria-hidden="true">↗</span></span></a></li>`; }).join('');
  // A moved figure carries its own labels (a recording block may open on its reconstruction view), so the
  // "recording" label is not repeated beside it. Non-recording kinds are always stated.
  const kind = r.filmKinds[film.kind];
  const keptHtml = kept.join('');
  // Oathra's status table already shows every highlight; the ledger values must not appear twice.
  const showHighlights = !t.highlights.every(h => keptHtml.includes(esc(h.label)));
  const note = r.filmNotes[p.id] || t.proof;
  const extra = p.id === 'agent-team' ? ` <a href="${esc(recordings['agent-team'])}" target="_blank" rel="noopener noreferrer">${esc(r.agentTeamRecording)} ↗</a>` : '';
  const next = list[(list.findIndex(q => q.id === p.id) + 1) % n];
  return `<section class="rd-phero">
<div class="rd-meta"><span>${esc(r.productOf(p.index, n))}</span><span>${esc(p.discipline)}</span><span class="rd-status"><i aria-hidden="true"></i>${esc(t.status)} · ${esc(t.license)}</span></div>
<h1 class="rd-pname${long ? ' rd-pname--long' : ''}"><span data-rd-line>${esc(name)}<em aria-hidden="true">.</em></span></h1>
<div class="rd-phero-body"><div class="rd-phero-copy" data-rd-fade><p class="rd-headline">${esc(t.headline)}</p><p class="rd-desc">${esc(t.description)}</p><div class="rd-ctas"><a class="rd-btn rd-btn--ink" href="#film">${esc(lang === 'ja' ? '映像を見る' : 'Watch the film')}<span aria-hidden="true">↓</span></a><a class="rd-btn rd-btn--line" href="${contactHref(lang, `#product-${p.id}`)}">${esc(r.consultHero)}<span aria-hidden="true">↗</span></a></div></div><figure class="rd-fig" data-rd-fade><div class="rd-fig-frame"><img src="${esc(still.src)}" alt="${esc(still.label)}" fetchpriority="high"></div><figcaption><span>${r.fig} ${esc(p.index)}</span><span>${esc(still.label)}</span></figcaption></figure></div>
</section>
<section class="rd-outcome" aria-label="${esc(r.whatItDoes)}"><p class="rd-kicker">${esc(r.whatItDoes)}</p><ol class="rd-steps">${outcome}</ol></section>
<section class="rd-film rd-reel" id="film" data-rd-reel data-rd-film-scale=".55" aria-labelledby="rd-film-title"><div class="rd-reel-stage">${figure ? `<div class="rd-reel-frame rd-reel-frame--figure" data-rd-frame>${figure}</div>` : filmAnchor ? `<a class="rd-reel-frame rd-film-link" data-rd-frame href="#${esc(filmAnchor)}"><img src="${esc(film.poster)}" alt="" loading="lazy"><span>${esc(r.filmBelow)} <span aria-hidden="true">↓</span></span></a>` : `<div class="rd-reel-frame" data-rd-frame>${video({...film, label: `${name} — ${kind}`}, lang)}</div>`}<div class="rd-reel-cap"><span id="rd-film-title">${esc(r.film(name))}</span>${figure && film.kind === 'recording' ? '' : `<span><b>${esc(filmAnchor ? r.stillKind : kind)}</b>${figure || filmAnchor ? '' : ` ${esc(note)}`}${extra}</span>`}</div></div></section>
${showHighlights ? `<section class="rd-highlights" aria-labelledby="rd-hl-title"><p class="rd-kicker" id="rd-hl-title">${esc(r.highlights)}</p><div class="rd-hl-grid">${highlights}</div></section>` : ''}
${kept.length ? `<div class="rd-kept rd-kept--product"><p class="rd-kicker rd-kept-kicker">${esc(r.detailKicker)}</p>${keptHtml}</div>` : ''}
<section class="rd-features rd-forest" id="capabilities" aria-labelledby="rd-feat-title"><div class="rd-feat-side"><div class="rd-sticky"><p class="rd-kicker">${esc(r.features)}</p><h2 id="rd-feat-title">${esc(t.short)}</h2>${source ? source : `<p class="rd-feat-note">${esc(r.featuresNote(capabilitiesCheckedAt))}</p>`}</div></div><div class="rd-feat-list">${features}</div></section>
<section class="rd-scope rd-forest" id="scope" aria-labelledby="rd-scope-title"><div class="rd-card"><div class="rd-scope-head"><div><p class="rd-kicker">${esc(r.scopeKicker)}</p><h2 id="rd-scope-title">${r.scopeTitle}</h2></div><p>${esc(r.scopeNote(sourcesCheckedAt))}</p></div><div class="rd-scope-cols"><div data-rd-reveal><p class="rd-scope-label">${esc(r.scopeLabel)}</p><p>${esc(t.scope)}</p></div><div data-rd-reveal><p class="rd-scope-label">${esc(r.proofLabel)}</p><p>${esc(t.proof)}</p></div></div><ul class="rd-links">${links}</ul></div></section>
<section class="rd-consult rd-forest" id="consult" aria-labelledby="rd-consult-title"><p class="rd-kicker">${esc(r.consultKicker)}</p><div class="rd-consult-row"><h2 id="rd-consult-title" data-rd-reveal>${esc(t.consult)}</h2><a class="rd-btn rd-btn--amber rd-btn--xl" href="${contactHref(lang, `#product-${p.id}`)}">${esc(r.consultCta)}<span aria-hidden="true">↗</span></a></div></section>
<nav class="rd-next rd-forest" aria-label="${esc(r.next)}"><a class="rd-next-link" href="${route(next.id, lang)}"><span class="rd-next-copy"><span class="rd-next-meta">${r.next} — ${esc(next.index)} / ${esc(next.discipline)}</span><span class="rd-next-name">${esc(displayName(next, lang))} <span aria-hidden="true">→</span></span><span class="rd-next-headline">${esc(next[lang].headline)}</span></span><span class="rd-next-thumb"><img src="${esc(stillOf(next, lang).src)}" alt="" loading="lazy"></span></a></nav>`;
}

function productFooter(p, lang) {
  const r = redesignCopyFor(lang);
  return `<footer class="rd-footer rd-footer--product rd-forest">${footerBottom(lang, `<a href="${base(lang)}/">${r.homeLink}</a>`)}</footer>`;
}

/* ---------- Page rewrite ---------- */

function rewriteBody(html, {lang, header, main, footer, product}) {
  if (html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1] !== lang) throw new Error(`Redesign: document language must be ${lang}`);
  const open = html.match(/<body\b[^>]*>/g);
  if (!open || open.length !== 1 || (html.match(/<\/body>/g) || []).length !== 1) throw new Error('Redesign: expected one <body>');
  let attrs = open[0].slice(5, -1);
  if (!/\bid="top"/.test(attrs)) attrs += ' id="top"';
  attrs = attrs.replace(/\s*data-rd(?:-product)?="[^"]*"/g, '');
  const bodyOpen = `<body data-rd="${REDESIGN_VERSION}"${product ? ` data-rd-product="${product}"` : ''}${attrs}>`;
  const r = redesignCopyFor(lang);
  const inner = `<a class="skip-link" href="#main">${esc(r.skip)}</a><div class="rd-progress" aria-hidden="true"></div>${header}<main id="main">${main}</main>${footer}`;
  const start = html.indexOf(open[0]), end = html.indexOf('</body>');
  return html.slice(0, start) + bodyOpen + inner + html.slice(end);
}

export function redesignHome(html, products, lang) {
  if (html.includes(`data-rd="${REDESIGN_VERSION}"`)) return html;
  if (!html.includes('data-home-v4="')) throw new Error('Redesign: the v4 home must run first');
  const list = ledger(products), main = mainOf(html);
  const kept = ['access', 'faq'].map(id => {
    const section = findById(main, id);
    if (!section) throw new Error(`Redesign: home section #${id} not found`);
    return section;
  });
  return rewriteBody(html, {lang, header: homeHeader(lang), main: homeMain(list, lang, kept), footer: homeFooter(lang)});
}

export function redesignProduct(html, p, products, lang) {
  if (html.includes(`data-rd="${REDESIGN_VERSION}"`)) return html;
  const list = ledger(products);
  if (!html.includes(`data-product-id="${p.id}"`)) throw new Error(`Redesign: page is not the ${p.id} product page`);
  const parts = splitProductMain(mainOf(html), productFilm(p.id), {filmInPlace: html.includes('data-oathra-lp="')});
  return rewriteBody(html, {lang, header: productHeader(p, list, lang), main: productMain(p, list, lang, parts), footer: productFooter(p, lang), product: p.id});
}

function replaceLayer(existing, start, end, layer) {
  const block = `${start}\n${layer.trimEnd()}\n${end}`;
  if (!existing.includes(start) && !existing.includes(end)) return `${existing.trimEnd()}\n${block}\n`;
  const from = existing.indexOf(start), to = existing.indexOf(end);
  if (from < 0 || to < from || existing.indexOf(start, from + start.length) !== -1 || existing.indexOf(end, to + end.length) !== -1) {
    throw new Error(`Redesign: missing or duplicate layer boundary ${start}`);
  }
  return existing.slice(0, from) + block + existing.slice(to + end.length);
}

export async function writeRedesign(dist, products) {
  const list = ledger(products), assets = path.join(dist, 'assets');
  const required = [REEL.src, REEL.poster, AGENT_TEAM_FILM.src, AGENT_TEAM_FILM.poster, '/assets/mark.svg', '/assets/redesign.mjs', ...Object.values(STILLS),
    ...list.flatMap(p => { const f = productFilm(p.id); return [p.preview, f.poster, ...(f.src.startsWith('/media/products/') ? [] : [f.src])]; })];
  for (const asset of required) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Redesign: missing ${asset}`); });
  const pages = [];
  for (const lang of ['ja', 'en']) {
    const homeFile = path.join(dist, lang === 'ja' ? '' : 'en', 'index.html');
    pages.push({file: homeFile, html: redesignHome(await fs.readFile(homeFile, 'utf8'), list, lang)});
    for (const p of list) {
      const file = path.join(dist, lang === 'ja' ? '' : 'en', 'products', p.id, 'index.html');
      pages.push({file, html: redesignProduct(await fs.readFile(file, 'utf8'), p, list, lang)});
    }
  }
  const here = path.dirname(new URL(import.meta.url).pathname);
  const [css, js, fonts, layer] = await Promise.all([
    fs.readFile(path.join(assets, 'showcase.css'), 'utf8'), fs.readFile(path.join(assets, 'showcase.mjs'), 'utf8'),
    fs.readFile(path.join(here, 'redesign', 'fonts.css'), 'utf8'), fs.readFile(path.join(here, 'redesign', 'redesign.css'), 'utf8')
  ]);
  if (!layer.includes('body[data-rd]')) throw new Error('Redesign: stylesheet is missing or stale');
  const nextCss = replaceLayer(css, CSS_MARK, CSS_END, `${fonts}\n${layer}`);
  const nextJs = replaceLayer(js, JS_MARK, JS_END, "if(document.body.dataset.rd)import('./redesign.mjs').catch(()=>{document.documentElement.dataset.rdState='unavailable';});");
  for (const {file, html} of pages) await fs.writeFile(file, html);
  await fs.writeFile(path.join(assets, 'showcase.css'), nextCss);
  await fs.writeFile(path.join(assets, 'showcase.mjs'), nextJs);
}
