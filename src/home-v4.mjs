/**
 * Japanese home, v4 composition ("ランディングページ全体改修案").
 *
 * Runs after every other home pass and replaces the contents of <main> on the Japanese home:
 * hero + manually selected footage → services → compact product catalogue
 * → optional access table → principles → FAQ → contact. The flagship access table, FAQ and
 * footer are reused so every fact still comes from the product ledger.
 *
 * - Complete without JavaScript: every video has native controls, every product is a link.
 * - Nothing autoplays; every <video> is preload="none". Recordings are labelled as edited.
 * - The 15-second films (Genie, Oathra) are labelled as edited films with motion graphics.
 * - TaskDock frames are design-file captures, labelled as such, not app recordings.
 * - English home is untouched until an English v4 exists.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {esc} from '../public/assets/lab-core.mjs';
import {renderAccess, renderFaq} from './home-flagship.mjs';
import {landingExperience} from './product-landings.mjs';
import {publishedHomeLinks} from './products.mjs';

// The hero states when the public sources were last checked. That is site.config.json checkedAt, not the
// later capability check in products.mjs (capabilitiesCheckedAt), which covered the product-page cards only.
const {checkedAt: sourcesCheckedAt} = JSON.parse(await fs.readFile(new URL('../site.config.json', import.meta.url), 'utf8'));

export const HOME_V4_VERSION = '20260930-home-clarity-1';
const CSS_MARK = '/* REACHMADE_HOME_V4 */';
const JS_MARK = '// REACHMADE_HOME_V4';
const arrow = '<span aria-hidden="true">↗</span>';

// Clip labels match public/media/products/manifest.json (edit.label.ja).
const CLIP = Object.freeze({genie:'依頼から成果物へ','ai-meeting':'会話からタスクへ',oathra:'会話から証拠へ',aisecure:'兆候から調査へ','agent-team':'依頼から成果物へ',launchloom:'録画から公開素材へ'});
const CAT = Object.freeze({genie:'WORK','ai-meeting':'VOICE',oathra:'PHONE',aisecure:'SECURITY','agent-team':'AGENTS',launchloom:'MEDIA'});
// What each product's footage is. Launchloom's source is a film the tool made about itself (ledger proof:
// 自身で作った紹介映像), not a screen recording of the app, so it is never called a recording.
const KIND = Object.freeze({launchloom:'Launchloomが作った紹介映像'});
const kind = id => KIND[id] || '実録画';
const FILM = Object.freeze({
  genie: {src:'/media/films/genie-15s.mp4', poster:'/media/films/genie-15s.jpg'},
  oathra: {src:'/media/films/oathra-15s.mp4', poster:'/media/films/oathra-15s.jpg'}
});
// Reuse the Genie product page's icon and frames, so the two pages cannot drift apart.
const ICON = Object.freeze({genie:landingExperience.genie.ja.icon});
const NEXT = Object.freeze(landingExperience.genie.ja.nextUi.frames.map(({title, body, src}) => ({title, body, src})));
const rec = id => `/media/products/${id}.mp4`;
const still = id => `/media/products/${id}.jpg`;
const route = id => `/products/${id}/`;
const local = url => String(url).replace(/^https:\/\/reachmade\.com(?=\/)/, '');
const link = (url, cls, label) => {
  const href = local(url), ext = /^https:/.test(href);
  return `<a class="${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
};

function ledger(products) {
  if (!Array.isArray(products) || products.length < 1) throw new TypeError('Expected the product ledger');
  if (new Set(products.map(p => p.id)).size !== products.length) throw new TypeError('Duplicate product identifier');
  for (const p of products) if (!Object.hasOwn(CLIP, p.id) || !p.ja) throw new TypeError(`Unknown product for the v4 home: ${p.id}`);
  return products;
}

function hero(list) {
  return `<section class="v4-hero"><p class="v4-eyebrow">AIプロダクトの自主開発と、企業向け開発支援</p><h1 class="v4-title"><span class="v4-line">思いついたら、</span><span class="v4-line">使えるかたちに<em>。</em></span></h1><p class="v4-hero-lead"><span>業務の自動化、音声AI、</span><span>新しいプロダクト。</span><br>動く試作と検証から、<br class="v4-mobile-break">使えるかたちを一緒につくります。</p><div class="v4-actions"><a class="v4-btn" href="/contact/">開発を相談する ${arrow}</a><a class="v4-link" href="#products">つくったものを見る <span aria-hidden="true">↓</span></a></div><p class="v4-hero-note">構想が固まる前から、相談できます。</p><div class="v4-hero-foot"><span>REACHMADE LAB</span><span>つくる。確かめる。使えるかたちへ。</span></div></section>`;
}

function reel(list) {
  const first = list[0], total = String(list.length).padStart(2, '0');
  const stills = list.map((p, i) => `<img class="v4-crop v4-still${i === 0 ? ' is-on' : ''}" src="${still(p.id)}" alt="" width="1280" height="720" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-v4-still="${esc(p.id)}">`).join('');
  const rail = list.map((p, i) => `<a class="v4-choice${i === 0 ? ' is-on' : ''}" href="#${esc(p.id)}" data-studio-choice="${esc(p.id)}" data-v4-choice data-kind="${esc(kind(p.id))}" data-proof="${esc(p.ja.proof)}" data-name="${esc(p.name)}" data-clip="${esc(CLIP[p.id])}" data-disc="${esc(p.discipline)}" data-index="${esc(p.index)}"><i class="v4-fill" aria-hidden="true"></i><span class="v4-choice-meta">${esc(p.index)} · ${esc(CAT[p.id])}</span><strong>${esc(p.name)}</strong><small>${esc(CLIP[p.id])}</small></a>`).join('');
  return `<section class="v4-reel" id="reel" aria-label="${list.length}つのプロダクトの映像"><p class="v4-reel-eyebrow">実際につくったもの <span>PRODUCT FILMS</span></p><div class="v4-frame" data-v4-reel><div class="v4-screen" id="v4-reel-screen">${stills}<video class="v4-crop v4-reel-video" controls muted playsinline preload="none" poster="${still(first.id)}" aria-label="${esc(first.name)} ${esc(kind(first.id))}（無音・編集あり）"><source src="${rec(first.id)}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video><div class="v4-hud" aria-hidden="true"><b data-v4-reel-index>${esc(first.index)}</b> / ${total}<i></i><span data-v4-reel-disc>${esc(first.discipline)}</span></div><span class="v4-tag" data-v4-reel-tag><i aria-hidden="true"></i><span>${esc(kind(first.id))} · 無音・編集あり</span></span><button class="v4-start" type="button" hidden data-v4-reel-start><span class="v4-disc v4-disc--xl" aria-hidden="true"></span><strong>${esc(first.name)}の映像を見る</strong><small>元映像から約13秒を抜粋</small></button></div><div class="v4-cap" data-v4-reel-cap><span><strong data-v4-reel-name>${esc(first.name)}</strong><small data-v4-reel-clip>${esc(CLIP[first.id])}</small></span><span class="v4-time" data-v4-reel-time>00:00 / 00:00</span></div><nav class="v4-rail" aria-label="製品映像を選ぶ">${rail}</nav></div><p class="v4-reel-proof" data-v4-reel-proof>${esc(first.ja.proof)}</p><details class="v4-reel-notes"><summary>映像の収録・編集について</summary><p>公開映像から各約13秒を選び、無音・速度変更なしで編集しています。Launchloomは自身で作った紹介映像です。入力や検証の条件は各製品の「映像と利用条件」で確認できます。${list.length}つは独立した製品で、自動連携しません。</p></details></section>`;
}

function entry(p) {
  if (p.id === 'genie') return {url: `${route(p.id)}#start`, label: '利用条件・セットアップ', note: 'Macとローカル設定が必要'};
  if (p.id === 'ai-meeting') return {url: landingExperience['ai-meeting'].ja.primary[1], label: 'タスク画面を試す', note: '文字入力のタスク機能は登録不要'};
  return {url: p.demo, label: p.ja.demoLabel, note: ({oathra:'公開サンプルの照合',aisecure:'合成データの調査', 'agent-team':'既存の実行記録を閲覧',launchloom:'生成済み素材を閲覧'})[p.id]};
}

function chapter(p) {
  const t = p.ja, id = esc(p.id), f = FILM[p.id], start = entry(p);
  return `<article class="v4-chapter" id="${id}" data-v4-chapter="${id}" data-kind="${esc(kind(p.id))}" data-proof="${esc(t.proof)}" data-name="${esc(p.name)}" data-index="${esc(p.index)}" data-disc="${esc(p.discipline)}" data-clip="${esc(CLIP[p.id])}"${f ? ` data-v4-film-src="${f.src}" data-v4-film-poster="${f.poster}"` : ''} aria-labelledby="v4-${id}-title"><div class="v4-card-top"><span class="v4-num">${esc(p.index)} / ${esc(p.name)}</span><span class="v4-pill">${esc(t.status)}</span></div><h3 id="v4-${id}-title">${esc(t.headline)}</h3><p class="v4-card-outcome">${esc(t.outcome)}</p><a class="v4-card-image" href="${route(p.id)}" aria-label="${esc(p.name)}の製品ページ"><img src="${esc(p.preview)}" alt="${esc(t.previewLabel)}" width="1280" height="720" loading="lazy" decoding="async"><span>製品を見る ${arrow}</span></a><p class="v4-card-short">${esc(t.short)}</p><p class="v4-entry-note">${esc(start.note)}</p><div class="v4-cta">${link(start.url, 'v4-link', `${esc(start.label)} ${arrow}`)}<a class="v4-card-detail" href="${route(p.id)}">製品詳細 <span aria-hidden="true">→</span></a></div><details class="v4-scope"><summary>映像と利用条件 <span aria-hidden="true">＋</span></summary><div class="v4-scope-body"><p>${esc(t.description)}</p><figure class="v4-figure"><div class="v4-screen v4-screen--sm"><video class="v4-crop" controls muted playsinline preload="none" poster="${still(p.id)}" aria-label="${esc(p.name)} ${esc(kind(p.id))}（無音・編集あり）"><source src="${rec(p.id)}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video></div><figcaption>${esc(CLIP[p.id])} · ${esc(kind(p.id))}（無音・編集あり）<span class="v4-proof">${esc(t.proof)}</span></figcaption></figure><p>${esc(t.scope)}</p><p class="v4-lic">ライセンス：${esc(t.license)}</p>${f ? `<a class="v4-link" href="${route(p.id)}#film15-${id}-title">15秒の紹介映像（演出を含む） ${arrow}</a>` : ''}${p.id === 'genie' ? '<a class="v4-link" href="/products/genie/#next-ui">次のTaskDockの設計プレビューを見る →</a><p>設計プレビューは未リリースで、実アプリの録画ではありません。</p>' : ''}</div></details></article>`;
}

function publishedCard(p) {
  return `<article class="v4-published" id="${esc(p.id)}" aria-labelledby="v4-${esc(p.id)}-title"><div><p class="v4-kicker">配信・対話の実験</p><h3 id="v4-${esc(p.id)}-title">${esc(p.headline)}</h3><p>${esc(p.name)} — ${esc(p.description)}</p></div><div><p class="v4-entry-note">${esc(p.status)} · ${esc(p.license)}</p>${link(p.url, 'v4-link', `${esc(p.label)} ${arrow}`)}</div></article>`;
}

function access(list) {
  let html = renderAccess(list, 'ja');
  for (const p of list) {
    const start = entry(p);
    html = html.replace(`<a class="rm-access-link" href="${route(p.id)}">詳しく見る ${arrow}</a>`, link(start.url, 'rm-access-link', `${esc(start.label)} ${arrow}`));
  }
  return `<section class="v4-access v4-wrap" id="access"><details><summary><span>利用条件を一覧で比べる</span><span class="v4-access-hint">状態・ライセンス・入口 <i aria-hidden="true">＋</i></span></summary>${html.replace(' id="access"', '')}</details></section>`;
}

const PRINCIPLES = [
  ['実物で話す。','自主開発のプロダクト、コード、実行記録。言葉だけでなく、確認できるものを見せます。'],
  ['結果を確かめる。','AIの「できました」を、成功の証拠にしない。実行と確認を分け、未完了も残します。'],
  ['使う人に決定権を。','外部への送信、費用、権限、人の承認。使う人が判断できるよう、設計に組み込みます。']
];
const SERVICES = [
  ['業務AI・エージェント実装','調査、下書き、レビュー、承認。人とAIの分担を設計し、結果を追える業務フローを試作します。','関連 — Genie · Agent Team'],
  ['音声・電話AIの開発','対話型の練習、音声入力、電話業務。自然さだけでなく、誤認識・同意・人への引き継ぎまで設計します。','関連 — AI Meeting · Oathra'],
  ['新しいAIプロダクトの試作','まだ言葉だけのアイデアを、操作できる試作へ。使い勝手と成立条件を確かめ、次に作る範囲を整理します。','関連 — 複数プロダクトの自主開発経験']
];

export function renderHomeV4(products, lang = 'ja') {
  if (lang !== 'ja') throw new TypeError('The v4 home exists in Japanese only');
  const list = ledger(products);
  const reelList = [...list.filter(p => p.id === 'ai-meeting'), ...list.filter(p => p.id !== 'ai-meeting')];
  const published = publishedHomeLinks.filter(p => !list.some(owned => owned.id === p.id));
  return `<div class="v4" data-home-v4-root><div class="v4-opening v4-wrap">${hero(list)}${reel(reelList)}</div><section class="v4-services" id="services" aria-labelledby="v4-services-title"><div class="v4-wrap"><div class="v4-head"><div><p class="v4-kicker">企業向け開発支援</p><h2 id="v4-services-title">変えたい仕事から、<br>はじめましょう。</h2></div><div class="v4-services-lead"><p>設計・試作・評価から、必要な連携の実装まで。最初に何を確かめるかを決め、一緒に進めます。</p><a class="v4-link" href="/services/">支援内容と進め方を見る <span aria-hidden="true">→</span></a></div></div><ol class="v4-grid">${SERVICES.map(([h,b,r],i)=>`<li><span>0${i+1}</span><h3>${h}</h3><p>${b}</p><small>${r}</small></li>`).join('')}</ol></div></section><section class="v4-products v4-wrap" id="products" aria-labelledby="v4-products-title"><div class="v4-head"><div><p class="v4-kicker">自主開発プロダクト / ${String(list.length + published.length).padStart(2,'0')}</p><h2 id="v4-products-title">あなたの仕事に、<br>つながるものを。</h2></div><p>できることから選んで、実物を確かめる。<br>試せる範囲と、必要な準備も一緒に。</p></div><div class="v4-list">${list.map(chapter).join('')}</div>${published.map(publishedCard).join('')}<p class="v4-source-note">公開情報の確認日 ${esc(sourcesCheckedAt)}。各製品は独立しており、自動連携しません。最新の利用条件は製品ページをご確認ください。</p></section>${access(list)}<section class="v4-principles" id="principles" aria-labelledby="v4-principles-title"><div class="v4-wrap"><div class="v4-head"><div><p class="v4-kicker">REACHMADEのつくり方</p><h2 id="v4-principles-title">つくるだけでなく、<br>確かめるところまで。</h2></div><div class="v4-about"><p>自主開発で得た知見を、次の開発へ。<br>コード、実物、検証記録を公開しています。</p><a class="v4-link" href="/about/">ラボ・開発者について →</a><a class="v4-link" href="/work/">開発・検証記録を見る →</a></div></div><ol class="v4-three">${PRINCIPLES.map(([h,b],i)=>`<li><span>0${i+1}</span><h3>${h}</h3><p>${b}</p></li>`).join('')}</ol></div></section>${renderFaq('ja')}<section class="v4-contact" id="contact" aria-labelledby="v4-contact-title"><div class="v4-wrap"><p class="v4-kicker">LET’S MAKE SOMETHING</p><h2 id="v4-contact-title">その「できたら」を、<br>一緒につくりませんか<em>。</em></h2><div class="v4-contact-row"><p>構想が固まる前の段階から。<br>対象の業務と、試してみたいことを聞かせてください。</p><a class="v4-btn" href="/contact/">開発を相談する ${arrow}</a></div></div></section></div>`;
}

const MAIN = /<main id="main">[\s\S]*?<\/main>/;

/** Fail closed: the flagship pass owns the shell (title, footer, access/FAQ renderers) this relies on. */
export function refineHomeV4(html, products, lang = 'ja') {
  if (lang !== 'ja') throw new TypeError('The v4 home exists in Japanese only');
  if (html.includes(`data-home-v4="${HOME_V4_VERSION}"`)) return html;
  if (!html.includes('data-home-flagship="')) throw new Error('The flagship pass must run before the v4 home');
  if ((html.match(/<main id="main">/g) || []).length !== 1 || !MAIN.test(html)) throw new Error('Unknown homepage shell; refusing a partial v4 rewrite');
  const body = renderHomeV4(products, lang);
  return html.replace(MAIN, () => `<main id="main">${body}</main>`).replace('<body ', `<body data-home-v4="${HOME_V4_VERSION}" `);
}

export async function writeHomeV4(dist, products) {
  const list = ledger(products);
  const assets = path.join(dist, 'assets');
  const required = [...list.flatMap(p => [rec(p.id), still(p.id)]), ...Object.values(FILM).flatMap(f => [f.src, f.poster]), ...Object.values(ICON), ...NEXT.map(n => n.src), '/assets/home-v4.mjs'];
  for (const asset of required) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`v4 home: missing ${asset}`); });
  const file = path.join(dist, 'index.html');
  const html = refineHomeV4(await fs.readFile(file, 'utf8'), list, 'ja');
  const [css, js, layer] = await Promise.all(['showcase.css', 'showcase.mjs', 'home-v4.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-home-v4]')) throw new Error('v4 home stylesheet is missing or stale');
  await fs.writeFile(file, html);
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CSS_MARK)[0].trimEnd() + `\n${CSS_MARK}\n${layer}`);
  await fs.writeFile(path.join(assets, 'showcase.mjs'), js.split(JS_MARK)[0].trimEnd() + `\n${JS_MARK}\nif(document.body.dataset.homeV4)import('./home-v4.mjs').catch(()=>{document.documentElement.dataset.homeV4='unavailable';});\n`);
}
