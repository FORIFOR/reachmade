/**
 * Final homepage composition.
 *
 * Earlier passes each own a slice of the page and append their own stylesheet
 * layer. On the home route those layers collided: the Request→Result signature
 * rules turned the outcome hero back into a two-column grid, which squeezed the
 * opening copy and the recorded-result stage into unreadable columns. This pass
 * owns the finished home: one deliberate hero, the six-product Lab untouched,
 * and the three answers a first-time visitor still had to leave the page for —
 * how to get each product, the questions everyone asks, and a real footer.
 *
 * Every fact rendered here comes from the product ledger or from the published
 * privacy page. No customer proof, user count, benchmark or performance claim
 * is introduced.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {esc} from '../public/assets/lab-core.mjs';
import {renderRecordedResult} from './outcome-first.mjs';
import {renderMarquee} from './signature-scene.mjs';

import {renderTaskPicker} from './home-task-picker.mjs';

export const HOME_VERSION = '20260919-flagship-1';
const MARK = '/* REACHMADE_HOME_FLAGSHIP */';
const LOCALES = ['ja', 'en'];
const arrow = '<span aria-hidden="true">↗</span>';
const check = lang => { if (!LOCALES.includes(lang)) throw new TypeError('Unsupported locale'); };
const ledger = products => {
  if (!Array.isArray(products) || products.length < 1) throw new TypeError('Expected the product ledger');
  if (new Set(products.map(p => p.id)).size !== products.length) throw new TypeError('Duplicate product identifier');
  return products;
};
const base = lang => (lang === 'ja' ? '' : '/en');
const product = (lang, id) => `${base(lang)}/products/${id}/`;

/** Opening: one claim, one action, and the original recorded artifact beside it. */
export function renderHero(products, lang) {
  check(lang);
  const list = ledger(products), ja = lang === 'ja', t = (a, b) => (ja ? a : b);
  const total = String(list.length).padStart(2, '0');
  // Both lines below are already asserted elsewhere on this page: the source-check
  // date is repeated in the access note, and the three kinds of evidence are what
  // the proof band, the product pages and /work/ actually publish.
  const badge = t('公開情報の確認日 2026-09-15 / 実録画と検証記録を公開', 'Sources checked 2026-09-15 / recordings and evidence published');
  const evidence = ja
    ? ['実アプリの録画', '保存済みの成果物', '検証記録とBLOCKED項目']
    : ['Real app recordings', 'Saved artifacts', 'Evidence, BLOCKED items included'];
  const facts = [
    [total, t('自主開発プロダクト', 'products built here')],
    [total, t('公開リポジトリ', 'public repositories')],
    ['JA / EN', t('実演と検証資料', 'recordings & evidence')]
  ];
  return `<section class="hero container lab-hero rm-hero"><div class="rm-hero-grid"><div class="rm-hero-copy"><p class="rm-hero-badge"><span aria-hidden="true">●</span> ${esc(badge)}</p><p class="eyebrow">REACHMADE / INDEPENDENT AI STUDIO</p><h1>${t('思いついたら、<br>使えるかたちに。', 'From an idea.<br>To something real.')}</h1><p class="rm-hero-lead">${t('メモを、計画に。会話を、タスクに。<br>録画を、伝わる紹介素材に。', 'Notes into plans. Conversations into tasks.<br>Recordings into launch material.')}</p><div class="rm-hero-actions"><a class="rm-primary" href="#explore">${t('プロダクトを選ぶ', 'Explore the products')} <span aria-hidden="true">↓</span></a><a class="rm-secondary" href="${product(lang, 'genie')}">${t('まずはGenieから', 'Start with Genie')} <span aria-hidden="true">→</span></a></div><ul class="rm-hero-evidence">${evidence.map(item => `<li>${esc(item)}</li>`).join('')}</ul><ul class="rm-hero-facts">${facts.map(([value, label]) => `<li><b>${esc(value)}</b><span>${esc(label)}</span></li>`).join('')}</ul></div><div class="rm-hero-stage">${renderTaskPicker(list, lang)}</div></div><div class="rm-proof"><div class="rm-proof-head"><p class="eyebrow">${t('REAL RECORDING / GENIE', 'REAL RECORDING / GENIE')}</p><p>${t('実際に何ができるか、録画と保存された成果物で確かめてください。', 'See what the app does in a real recording, then open its saved artifact.')}</p></div>${renderRecordedResult(lang)}</div><div class="rm-bridge"><span>${t('「使えるかたち」を、まずは手元で。', 'Something real, right in your browser.')}</span><p>${t('実演、保存した作例、導入手順まで。6つの製品を、実物から選べます。', 'Recording, saved artifact, and setup. Choose between six products, starting with the real work.')}</p><a href="#explore">${t('プロダクトを見る', 'Meet the products')} <span aria-hidden="true">↓</span></a></div></section>${renderMarquee(list, lang)}`;
}

/** The access question, answered from the ledger instead of a pricing table. */
export function renderAccess(products, lang) {
  check(lang);
  const list = ledger(products), ja = lang === 'ja', t = (a, b) => (ja ? a : b);
  const heads = ja
    ? ['プロダクト', '入力 → 成果物', '今の状態', 'ライセンス', '入口']
    : ['Product', 'Input → result', 'Stage', 'License', 'Entry'];
  const rows = list.map(p => {
    const c = p[lang];
    return `<tr><th scope="row"><span class="rm-access-index">${esc(p.index)}</span><a href="${product(lang, p.id)}">${esc(p.name)}</a></th><td data-label="${esc(heads[1])}">${esc(c.outcome)}</td><td data-label="${esc(heads[2])}"><span class="rm-stage-tag">${esc(c.status)}</span></td><td data-label="${esc(heads[3])}">${esc(c.license)}</td><td data-label="${esc(heads[4])}"><a class="rm-access-link" href="${product(lang, p.id)}">${t('詳しく見る', 'Open')} ${arrow}</a></td></tr>`;
  }).join('');
  return `<section class="rm-band rm-access" id="access"><div class="container"><div class="rm-band-head"><div><p class="eyebrow">ACCESS AT A GLANCE</p><h2>${t('「試せるのか」に、<br>先に答える。', 'Can you actually<br>try it? Yes — here.')}</h2></div><p>${t('6つとも自主開発です。今の状態、成果物、ライセンス、入口を、ひとつの表に。<br>言えないことは、ここにも書きません。', 'All six are built here. Stage, result, license and entry point in one table.<br>What has not been verified is not claimed here either.')}</p></div><div class="rm-access-scroll"><table class="rm-access-table"><caption class="rm-sr">${t('プロダクトごとの状態・ライセンス・入口の一覧', 'Stage, license and entry point for each product')}</caption><thead><tr>${heads.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="rm-access-note">${t('公開情報の確認日は2026年9月15日です。各製品の動作条件・未検証の範囲は、製品ページと検証資料に記載しています。実運用の性能や安全性を保証するものではありません。', 'Public sources were checked on 15 September 2026. Setup requirements and unverified scope are stated on each product page and in its evidence. This is not a guarantee of production performance or safety.')}</p></div></section>`;
}

const QUESTIONS = {
  ja: [
    ['いますぐ試せますか？', 'プロダクトごとに違います。AI Meetingは登録なしでタスク画面を、Oathraは公開サンプルの照合を、AI Secureは合成データの調査を、Agent TeamとLaunchloomは既存の実行記録と生成済み素材を、そのまま開けます。Genieはローカル設定が必要な開発者プレビューです。'],
    ['料金はかかりますか？', 'このサイトの閲覧と、ここから開けるサンプルに費用はかかりません。ライセンスは製品ごとに異なり、Apache-2.0のものと、まだ全体ライセンスを設定していないものがあります。外部のAIモデルを使う構成では、その利用料はご自身の契約によります。'],
    ['導入実績や利用者数は？', '掲載していません。確かめられた事実だけを載せる方針のため、顧客事例・利用者数・性能比較は、検証が済むまで書きません。代わりに、コード、実演の録画、検証資料を公開しています。'],
    ['入力した内容はどう扱われますか？', '広告・アクセス解析タグと外部フォントは読み込みません。相談フォームの送信内容は同じドメインの受付経路から運営者の受付システムへ保存し、対応にのみ使います。AI・広告・解析サービスへは送りません。'],
    ['企業の開発を頼めますか？', 'はい。ひとつの業務の自動化から、新しいプロダクトの設計・試作・検証まで。自主開発で使っている実装を、そのまま持ち込みます。'],
    ['動きや音を止められますか？', '自動再生はしません。録画は押したときだけ再生し、音声もその操作で初めて鳴ります。OSの「視差効果を減らす」設定では登場演出を止めます。JavaScriptを無効にしても、全ページの内容とリンクは使えます。']
  ],
  en: [
    ['Can I try it right now?', 'It depends on the product. AI Meeting opens account-free text tasks, Oathra opens a public transcript check, AI Secure opens a synthetic investigation, and Agent Team and Launchloom open existing run records and generated material. Genie is a developer preview that needs local setup.'],
    ['Does it cost anything?', 'Browsing this site and opening the samples linked here is free. Licenses differ per product: some are Apache-2.0, some have no project-wide license yet. If a setup uses an external AI model, that usage is billed under your own account.'],
    ['Do you have customers or user numbers?', 'None are published. Only verified facts are stated here, so customer stories, user counts and performance comparisons stay out until they are verified. What is published instead is the source code, the recordings and the evidence documents.'],
    ['What happens to what I type?', 'No advertising or analytics tags and no external fonts are loaded. An inquiry is sent through a same-origin route to the operator’s existing intake, stored there, and used only to answer you. It is not sent to an AI, advertising or analytics service.'],
    ['Can you build something for our company?', 'Yes — from automating a single workflow to designing, prototyping and evaluating a new product, using the same engineering as the products above.'],
    ['Can I stop the motion and sound?', 'Nothing plays by itself. A recording starts only when you press play, and sound arrives only with that action. Reduced-motion settings disable the entrance animations, and every page keeps its content and links with JavaScript turned off.']
  ]
};

/** Plain details/summary: readable, keyboard-operable and complete without script. */
export function renderFaq(lang) {
  check(lang);
  const ja = lang === 'ja', t = (a, b) => (ja ? a : b);
  const items = QUESTIONS[lang].map(([q, a], i) => `<details class="rm-faq-item"${i === 0 ? ' open' : ''}><summary><span class="rm-faq-number">${String(i + 1).padStart(2, '0')}</span><span>${esc(q)}</span><i aria-hidden="true">+</i></summary><p>${esc(a)}</p></details>`).join('');
  return `<section class="rm-band rm-faq" id="faq"><div class="container rm-faq-grid"><div class="rm-faq-intro"><p class="eyebrow">BEFORE YOU ASK</p><h2>${t('よくある質問に、<br>そのまま答えます。', 'The questions,<br>answered plainly.')}</h2><p>${t('答えにくいものほど、先に書いておきます。<br>もっと具体的な話は、相談から。', 'The awkward ones first.<br>Anything more specific: start a conversation.')}</p><a class="rm-secondary" href="${base(lang)}/contact/">${t('開発を相談する', 'Start a conversation')} ${arrow}</a></div><div class="rm-faq-list">${items}</div></div></section>`;
}

/** A footer that can actually navigate the site, not two rows of leftovers. */
export function renderFooter(products, lang) {
  check(lang);
  const list = ledger(products), ja = lang === 'ja', t = (a, b) => (ja ? a : b), b = base(lang);
  const column = (title, links) => `<div class="rm-foot-col"><h2>${esc(title)}</h2><ul>${links.map(([label, href, external]) => `<li><a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(label)}${external ? ` ${arrow}` : ''}</a></li>`).join('')}</ul></div>`;
  return `<footer class="site-footer rm-footer"><div class="container rm-foot-top"><div class="rm-foot-brand"><a class="brand footer-brand" href="${b}/" aria-label="${t('Reachmade Lab — トップ', 'Reachmade Lab — home')}"><svg class="brand-mark" aria-hidden="true" viewBox="0 0 36 36"><path d="M3 30V6h10v14h10V6h10v24H23v-8H13v8Z" fill="currentColor"/></svg><span>Reachmade<span class="brand-lab">Lab</span></span></a><p>${t('AIの応用研究と、自主開発のプロダクト。<br>できることと、まだできないことを、同じ場所に。', 'Applied AI research and independently built products.<br>What works and what does not, in the same place.')}</p></div><div class="rm-foot-cols">${column(t('プロダクト', 'Products'), list.map(p => [p.name, product(lang, p.id)]))}${column(t('ラボ', 'Lab'), [[t('プロダクト一覧', 'All products'), `${b}/products/`], [t('開発・検証記録', 'Work notes'), `${b}/work/`], [t('ラボについて', 'About the lab'), `${b}/about/`]])}${column(t('確かめる', 'Verify'), [[t('入手方法の一覧', 'How to get each product'), '#access'], [t('よくある質問', 'FAQ'), '#faq'], ['GitHub', 'https://github.com/FORIFOR', true], [t('プライバシー', 'Privacy'), `${b}/privacy/`]])}${column(t('相談する', 'Talk to us'), [[t('開発を相談する', 'Start a conversation'), `${b}/contact/`], [t('企業向け支援', 'For companies'), `${b}/services/`]])}</div></div><div class="container rm-foot-bottom"><small>© 2026 Reachmade Lab / Shuhei Horio</small><div class="rm-foot-end"><a href="${ja ? '/en/' : '/'}" lang="${ja ? 'en' : 'ja'}" hreflang="${ja ? 'en' : 'ja'}">${ja ? 'English' : '日本語'}</a><a href="#top" class="rm-to-top" aria-label="${t('ページ先頭へ', 'Back to top')}">${t('先頭へ', 'Top')} <span aria-hidden="true">↑</span></a></div></div></footer>`;
}

const HERO = /<section class="hero container lab-hero outcome-hero">[\s\S]*?<\/section>/;
const FOOTER = /<footer class="site-footer">[\s\S]*?<\/footer>/;
const EVIDENCE = '<section class="lab-evidence-band">';
const WORK_WITH = '<section class="container lab-work-with"';

/** Fail closed: every anchor below depends on a structure an earlier pass built. */
export function refineHome(html, products, lang) {
  check(lang);
  const list = ledger(products);
  if (html.includes(`data-home-flagship="${HOME_VERSION}"`)) return html;
  if (!html.includes('data-outcome-first="20260919-outcome-1"')) throw new Error('The outcome pass must run before the final home composition');
  if (!HERO.test(html)) throw new Error('Unknown homepage hero; refusing a partial rewrite');
  if (!FOOTER.test(html) || !html.includes(EVIDENCE) || !html.includes(WORK_WITH)) throw new Error('Unknown homepage shell; refusing a partial rewrite');
  const title = lang === 'ja' ? 'Reachmade Lab — 思いついたら、使えるかたちに。' : 'Reachmade Lab — From an idea, to something real.';
  return html
    .replace(HERO, () => renderHero(list, lang))
    .replace(EVIDENCE, () => renderAccess(list, lang) + EVIDENCE)
    .replace(WORK_WITH, () => renderFaq(lang) + WORK_WITH)
    .replace(FOOTER, () => renderFooter(list, lang))
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${esc(title)}$2`)
    .replace('<body ', `<body data-home-flagship="${HOME_VERSION}" `);
}

export async function writeHomeFlagship(dist, products) {
  const list = ledger(products);
  const pages = await Promise.all(LOCALES.map(async lang => {
    const file = path.join(dist, lang === 'ja' ? '' : 'en', 'index.html');
    return [file, refineHome(await fs.readFile(file, 'utf8'), list, lang)];
  }));
  const assets = path.join(dist, 'assets');
  const layers = ['home-flagship.css', 'home-task-picker.css', 'home-editorial.css'];
  const [css, ...parts] = await Promise.all(['showcase.css', ...layers].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!parts[0].includes('[data-home-flagship]')) throw new Error('Final home stylesheet incomplete');
  if (!parts[2].includes('.rm-hero-badge')) throw new Error('Editorial home layer is missing or stale');
  for (const [file, html] of pages) await fs.writeFile(file, html);
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(MARK)[0].trimEnd() + `\n${MARK}\n${parts.join('\n')}`);
}
