/**
 * Japanese home, v4 composition ("ランディングページ全体改修案").
 *
 * Runs after every other home pass and replaces the contents of <main> on the Japanese home:
 * hero → six real recordings → six product chapters (with a sticky stage on wide screens)
 * → principles → services → access table → FAQ → contact. The flagship access table, FAQ and
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

// The hero states when the public sources were last checked. That is site.config.json checkedAt, not the
// later capability check in products.mjs (capabilitiesCheckedAt), which covered the product-page cards only.
const {checkedAt: sourcesCheckedAt} = JSON.parse(await fs.readFile(new URL('../site.config.json', import.meta.url), 'utf8'));

export const HOME_V4_VERSION = '20260928-home-v4-1';
const CSS_MARK = '/* REACHMADE_HOME_V4 */';
const JS_MARK = '// REACHMADE_HOME_V4';
const arrow = '<span aria-hidden="true">↗</span>';

// Clip labels match public/media/products/manifest.json (edit.label.ja).
const CLIP = Object.freeze({genie:'依頼から成果物へ','ai-meeting':'会話からタスクへ',oathra:'会話から証拠へ',aisecure:'兆候から調査へ','agent-team':'依頼から、確かめた版へ',launchloom:'録画から公開素材へ',noa:'管理画面と仕組み'});
const CAT = Object.freeze({genie:'WORK','ai-meeting':'VOICE',oathra:'PHONE',aisecure:'SECURITY','agent-team':'AGENTS',launchloom:'MEDIA',noa:'LIVE'});
// What each product's footage is. Launchloom's source is a film the tool made about itself (ledger proof:
// 自身で作った紹介映像), not a screen recording of the app, so it is never called a recording.
const KIND = Object.freeze({launchloom:'Launchloomが作った紹介映像',noa:'紹介映像（画面は再現・演出を含む）'});
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
  const n = list.length;
  return `<section class="v4-hero v4-wrap"><div class="v4-meta"><span><i class="v4-live" aria-hidden="true"></i>公開情報の確認日 ${esc(sourcesCheckedAt)} · 実録画と検証記録を公開</span></div><h1 class="v4-title"><span class="v4-line"><span>思いついたら、</span></span><span class="v4-line"><span>使えるかたちに<em>。</em></span></span></h1><div class="v4-lead"><p><span class="v4-ph">メモを計画に、</span><span class="v4-ph">会話をタスクに、</span><span class="v4-ph">録画を紹介素材に。</span><small><span class="v4-ph">AIで「できること」を広げる、</span><span class="v4-ph">${n}つの自主開発プロダクトです。</span></small></p><div class="v4-actions"><a class="v4-btn" href="#reel" data-v4-play><span class="v4-disc" aria-hidden="true"></span>${n}つの製品映像を見る</a><a class="v4-link" href="#access">一覧で比べる <span aria-hidden="true">↓</span></a></div></div></section>`;
}

function reel(list) {
  const first = list[0], total = String(list.length).padStart(2, '0');
  const stills = list.map((p, i) => `<img class="v4-crop v4-still${i === 0 ? ' is-on' : ''}" src="${still(p.id)}" alt="" width="1280" height="720" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-v4-still="${esc(p.id)}">`).join('');
  const rail = list.map((p, i) => `<a class="v4-choice${i === 0 ? ' is-on' : ''}" href="#${esc(p.id)}" data-studio-choice="${esc(p.id)}" data-v4-choice data-kind="${esc(kind(p.id))}" data-name="${esc(p.name)}" data-clip="${esc(CLIP[p.id])}" data-disc="${esc(p.discipline)}" data-index="${esc(p.index)}"><i class="v4-fill" aria-hidden="true"></i><span class="v4-choice-meta">${esc(p.index)} · ${esc(CAT[p.id])}</span><strong>${esc(p.name)}</strong><small>${esc(CLIP[p.id])}</small></a>`).join('');
  return `<section class="v4-reel v4-wrap" id="reel" aria-label="${list.length}つのプロダクトの映像"><div class="v4-frame" data-v4-reel><div class="v4-screen" id="v4-reel-screen">${stills}<video class="v4-crop v4-reel-video" controls muted playsinline preload="none" poster="${still(first.id)}" aria-label="${esc(first.name)} ${esc(kind(first.id))}（無音・編集あり）"><source src="${rec(first.id)}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video><div class="v4-hud" aria-hidden="true"><b data-v4-reel-index>${esc(first.index)}</b> / ${total}<i></i><span data-v4-reel-disc>${esc(first.discipline)}</span></div><span class="v4-tag" data-v4-reel-tag><i aria-hidden="true"></i><span>STILL · 製品映像から</span></span><button class="v4-start" type="button" hidden data-v4-reel-start><span class="v4-disc v4-disc--xl" aria-hidden="true"></span><strong>${list.length}つのプロダクトを、実際の画面で。</strong><small>約13秒 · 無音 · 押したときだけ再生</small></button><div class="v4-cap" hidden data-v4-reel-cap><span><strong data-v4-reel-name>${esc(first.name)}</strong><small data-v4-reel-clip>${esc(CLIP[first.id])}</small></span><span class="v4-time" data-v4-reel-time>00:00 / 00:00</span></div></div><nav class="v4-rail" aria-label="製品映像を選ぶ">${rail}</nav></div><p class="v4-note">各プロダクトの公開している映像から区間を選んで編集し、画面上端のメニューバーをトリミングして表示しています（各約13秒・無音・速度変更なし）。Launchloomの映像は、Launchloom自身が作った紹介映像です。夜澄ノアの映像は、画面構成を再現した紹介映像（演出を含む）です。一部の元映像には、製品側の字幕が最初から入っています。${list.length}つは独立したプロダクトで、互いに自動連携しません。</p></section>`;
}

function next() {
  const items = NEXT.map((n, i) => `<li${i === 0 ? ' class="is-on"' : ''}><button type="button" data-v4-next="${i}" aria-pressed="${i === 0}"><img src="${n.src}" alt="TaskDock設計プレビュー：${esc(n.title)}" width="1600" height="900" loading="lazy" decoding="async"><span>${esc(n.title)}</span></button><p><b>${esc(n.title)}</b> — ${esc(n.body)}</p></li>`).join('');
  return `<div class="v4-next" data-v4-next-root><div class="v4-next-head"><strong>次のTaskDock</strong><span>設計プレビュー · 未リリース</span></div><ol class="v4-next-list">${items}</ol><p class="v4-next-desc" hidden data-v4-next-desc></p><p class="v4-next-note">各コマは設計ファイルを撮影した再現図で、実アプリの録画ではありません。開発ブランチで試作中・実機未確認。</p></div>`;
}

function chapter(p) {
  const t = p.ja, id = esc(p.id), f = FILM[p.id];
  const steps = String(t.outcome).split('→').map(s => s.trim()).filter(Boolean);
  const icon = ICON[p.id] ? `<img class="v4-icon" src="${ICON[p.id]}" alt="" width="128" height="128" loading="lazy" title="開発中のアイコン（現行版アプリには未搭載）">` : '';
  const film = f ? `<a class="v4-film-link" href="${route(p.id)}#film15-${id}-title">15秒の紹介映像（演出を含む）を見る <span aria-hidden="true">→</span></a>` : '';
  return `<article class="v4-chapter" id="${id}" data-v4-chapter="${id}" data-kind="${esc(kind(p.id))}" data-proof="${esc(t.proof)}" data-name="${esc(p.name)}" data-index="${esc(p.index)}" data-disc="${esc(p.discipline)}" data-clip="${esc(CLIP[p.id])}"${f ? ` data-v4-film-src="${f.src}" data-v4-film-poster="${f.poster}"` : ''} aria-labelledby="v4-${id}-title" data-v4-reveal><figure class="v4-figure"><div class="v4-screen v4-screen--sm"><video class="v4-crop" controls muted playsinline preload="none" poster="${still(p.id)}" aria-label="${esc(p.name)} ${esc(kind(p.id))}（無音・編集あり）"><source src="${rec(p.id)}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video></div><figcaption>${esc(CLIP[p.id])} · ${esc(kind(p.id))}（無音・編集あり）<span class="v4-proof">${esc(t.proof)}</span></figcaption></figure><div class="v4-chip-row"><span class="v4-num">${esc(p.index)}</span><i aria-hidden="true"></i><span>${esc(p.discipline)}</span><span class="v4-pill">${esc(t.status)}</span></div><div><p class="v4-name">${icon}${esc(p.name)} <span>${esc(t.short)}</span>${ICON[p.id] ? '<small class="v4-dev">開発中のアイコン · 現行版のアプリには未搭載</small>' : ''}</p><h3 id="v4-${id}-title">${esc(t.headline)}</h3></div><p class="v4-desc">${esc(t.description)}</p><ol class="v4-flow">${steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol><dl class="v4-points">${(t.highlights || []).map(h => `<div><dt>${esc(h.value)}</dt><dd>${esc(h.label)}</dd></div>`).join('')}</dl><div class="v4-cta">${link(p.demo, 'v4-btn v4-btn--sm', `${esc(t.demoLabel)} ${arrow}`)}<a class="v4-link" href="${route(p.id)}">製品ページ <span aria-hidden="true">→</span></a>${film}${p.id === 'noa' ? `<a class="v4-film-link" href="${route(p.id)}#watch">5:48の解説（演出を含む）を見る <span aria-hidden="true">→</span></a>` : ''}</div>${p.id === 'genie' ? next() : ''}<details class="v4-scope"><summary><span>現在の範囲と条件</span><span class="v4-lic">${esc(t.license)} <i aria-hidden="true">＋</i></span></summary><p>${esc(t.scope)}</p><p><b>EVIDENCE</b>${esc(t.proof)}</p></details></article>`;
}

function stage(list) {
  const first = list[0], total = String(list.length).padStart(2, '0');
  const stills = list.map((p, i) => `<img class="v4-crop v4-still${i === 0 ? ' is-on' : ''}" src="${still(p.id)}" alt="" width="1280" height="720" loading="lazy" decoding="async" data-v4-stage-still="${esc(p.id)}">`).join('')
    + Object.entries(FILM).filter(([id]) => list.some(p => p.id === id)).map(([id, f]) => `<img class="v4-full v4-still" src="${f.poster}" alt="" width="1280" height="720" loading="lazy" decoding="async" data-v4-stage-still="${id}-film">`).join('');
  return `<div class="v4-stage" hidden data-v4-stage><div class="v4-switch" role="group" aria-label="映像の種類" hidden data-v4-switch><button type="button" aria-pressed="true" data-v4-mode="rec">実録画 · 約13秒</button><button type="button" aria-pressed="false" data-v4-mode="film">紹介映像 · 15秒</button></div><div class="v4-screen v4-screen--stage">${stills}<video class="v4-crop" muted playsinline preload="none" data-v4-stage-video aria-label="${esc(first.name)} ${esc(kind(first.id))}"></video><div class="v4-hud" aria-hidden="true"><b data-v4-stage-index>${esc(first.index)}</b> / ${total}<i></i><span data-v4-stage-disc>${esc(first.discipline)}</span></div><span class="v4-tag" data-v4-stage-tag><i aria-hidden="true"></i><span>${esc(kind(first.id))} · 約13秒 · 1× · 編集あり</span></span><div class="v4-bar"><button class="v4-toggle" type="button" data-v4-stage-toggle aria-label="再生"><span class="v4-tri" aria-hidden="true"></span></button><div class="v4-bar-body"><div class="v4-bar-line"><span><strong data-v4-stage-name>${esc(first.name)}</strong><small data-v4-stage-clip>${esc(CLIP[first.id])}</small></span><span class="v4-time" data-v4-stage-time>00:00 / 00:--</span></div><div class="v4-progress"><i data-v4-stage-fill></i></div></div></div><p class="v4-status" role="status" hidden data-v4-stage-status></p></div><p class="v4-proof v4-stage-proof" data-v4-stage-proof>${esc(first.ja.proof)}</p><nav class="v4-dots" aria-label="プロダクトへ移動">${list.map((p, i) => `<a href="#${esc(p.id)}" aria-label="${esc(p.name)}" data-v4-dot="${esc(p.id)}"${i === 0 ? ' class="is-on"' : ''}><i></i></a>`).join('')}</nav></div>`;
}

const PRINCIPLES = [
  ['実物で話す。','自主開発のプロダクト、コード、実行記録。言葉だけでなく、確認できるものを見せます。'],
  ['結果を確かめる。','AIの「できました」を、成功の証拠にしない。実行と確認を分け、未完了も残します。'],
  ['使う人に決定権を。','外部への送信、費用、権限、人の承認。使う人が判断できるよう、設計に組み込みます。']
];
const SERVICES = [
  ['業務AI・エージェント実装','調査、下書き、レビュー、承認。人とAIの分担を設計し、結果を追える業務フローを試作します。','関連 — Genie · Agent Team'],
  ['音声・電話AIの開発','対話型の練習、音声入力、電話業務。自然さだけでなく、誤認識・同意・人への引き継ぎまで設計します。','関連 — AI Meeting · Oathra · 夜澄ノア'],
  ['新しいAIプロダクトの試作','まだ言葉だけのアイデアを、操作できる試作へ。使い勝手と成立条件を確かめ、次に作る範囲を整理します。','関連 — 複数プロダクトの自主開発経験']
];

export function renderHomeV4(products, lang = 'ja') {
  if (lang !== 'ja') throw new TypeError('The v4 home exists in Japanese only');
  const list = ledger(products);
  const n = String(list.length).padStart(2, '0');
  return `<div class="v4" data-home-v4-root>${hero(list)}${reel(list)}${renderAccess(list, 'ja')}<section class="v4-products" id="products" aria-labelledby="v4-products-title"><div class="v4-wrap v4-head" data-v4-reveal><div><p class="v4-kicker">プロダクト</p><h2 id="v4-products-title">自主開発プロダクト。<br><span>ひとつの問い。</span></h2></div><p>AIで、人が実現できることをどこまで広げられるか。できることと、まだ検証中のことを分けて載せています。</p></div><div class="v4-wrap v4-chapters" data-v4-chapters><div class="v4-list">${list.map(chapter).join('')}</div>${stage(list)}</div></section><section class="v4-principles" id="principles" aria-labelledby="v4-principles-title"><div class="v4-wrap" data-v4-reveal><p class="v4-kicker">約束</p><h2 id="v4-principles-title">設計に残す、<br>三つの約束。</h2><ol class="v4-three">${PRINCIPLES.map(([h, b], i) => `<li><span>0${i + 1}</span><h3>${h}</h3><p>${b}</p></li>`).join('')}</ol></div></section><section class="v4-services" id="services" aria-labelledby="v4-services-title"><div class="v4-wrap" data-v4-reveal><div class="v4-head v4-head--flush"><div><p class="v4-kicker">企業向け支援</p><h2 id="v4-services-title">ひとつの業務から、<br>一緒に変えていく。</h2></div><div class="v4-services-lead"><p>試して終わりにしないために、最初に何を確かめるかを決める。設計・試作・評価から、必要な連携の実装まで支援します。</p><a class="v4-link v4-link--light" href="/services/">支援内容と進め方を見る <span aria-hidden="true">→</span></a></div></div><ol class="v4-grid">${SERVICES.map(([h, b, r], i) => `<li><span>0${i + 1}</span><h3>${h}</h3><p>${b}</p><small>${r}</small></li>`).join('')}</ol></div></section>${renderFaq('ja')}<section class="v4-contact" id="contact" aria-labelledby="v4-contact-title"><div class="v4-wrap" data-v4-reveal><h2 id="v4-contact-title">その「できたら」を、<br>一緒につくりませんか<em>。</em></h2><div class="v4-contact-row"><p>構想が固まる前の段階から。対象の業務と、試してみたいことを聞かせてください。</p><a class="v4-btn v4-btn--lg" href="/contact/">開発を相談する ${arrow}</a></div></div></section></div>`;
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
