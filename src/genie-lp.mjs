/**
 * Genie landing page (Japanese product page only): "明るいアトリエ × 青い魔法 × 本物のTaskDock".
 *
 * Runs last on /products/genie/ and RE-COMPOSES the existing owned page instead of replacing it, so every
 * contract the product page already carries (13-second real recording, ledger features, try-now, action note,
 * scope/proof, next-UI design frames, 15-second film, related products) stays in place:
 *   hero (new headline)  →  01 仕事を止めない (the three ledger features + real frames)
 *   →  02 何を頼みますか (three requests, each as a request screen and its result, cut from the published films)
 *   →  03 仕事は残る (saved Markdown + HTML)
 *   →  15-second film → flow → 04 任せる範囲 (ledger facts) → start (「最初の仕事は、小さくていい。」) → boundaries …
 *
 * - Every still is cut from the published product film (real app screens, fictional demo data).
 * - The top film is the 01 TaskDock reconstruction written out as a video (media/films/genie-taskdock-13s.mp4), labelled as
 *   a reconstruction of the next version in development, never as a recording. Nothing autoplays; preload="none".
 * - 02 shows stills, not the films (2026-09-30: the films read as unfinished). The films stay on /products/genie/demos/.
 * - Complete without JavaScript: every request and result is an image with alt text; the HTML artifact opens in a new tab.
 * - Claims come from src/products.mjs only. English page is untouched.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {products as ledgerProducts} from './products.mjs';

export const GENIE_LP_VERSION = '20260930-genie-lp-3';
const CSS_MARK = '/* REACHMADE_GENIE_LP */';
const JS_MARK = '// REACHMADE_GENIE_LP';
const PAGE = 'products/genie/index.html';
const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext = (href, label, cls) => `<a${cls ? ` class="${cls}"` : ''} href="${e(href)}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
const A = '/assets/products/genie/';
const O = '/media/originals/genie/';

// Stills cut from genie-product-film-web.mp4 / genie-web-proposal-web.mp4 / genie-orbit-web.mp4 (published films).
export const FRAMES = Object.freeze({
  moment: {src: `${A}lp-moment.jpg`, alt: '作業中のダッシュボードに、スクリーンショットの通知が出ている画面'},
  ask: {src: `${A}lp-ask.jpg`, alt: '「この画像について質問」の入力欄が開いた画面'},
  question: {src: `${A}lp-question.jpg`, alt: 'スクリーンショットを添えて依頼文を入力している画面'},
  answer: {src: `${A}lp-answer.jpg`, alt: '優先順位3つの回答が表示された画面'},
  result: {src: `${A}lp-result.jpg`, alt: 'コピーと保存のボタンがある回答画面'},
  save: {src: `${A}lp-save.jpg`, alt: '回答をMarkdownファイルとして保存するダイアログ'},
  proposal: {src: `${A}lp-proposal.jpg`, alt: '「ともに、未来へ。」という見出しのWebページと、依頼の説明'},
  orbit: {src: `${A}lp-orbit.jpg`, alt: 'Genieが生成した、惑星が公転するHTML'},
  // 01 の背景。TaskDock が写っていない実画面（紹介映像から切り出し）。
  work: {src: `${A}lp-work.jpg`, alt: '作業中のダッシュボード（Pulse）の画面'},
  // Genie の印（白）。GenieMark-source.png を切り詰めたもの。197×120。
  mark: {src: `${A}genie-mark-white.png`, alt: ''}
});
// 01 は同じ作業画面の上で、TaskDock（次の版・1b）だけが姿を変える。
const HOW = [['01', '呼び出す', 'idle'], ['02', '必要な情報を渡す', 'listen'], ['03', '結果を使う', 'done']];
// Each request is shown as two stills cut from its published film: the request as typed, then the result on screen.
const still = (file, width, height, alt) => ({src: `${A}${file}`, width, height, alt});
export const DEMOS = Object.freeze([
  {id: 'proposal', ask: 'このページの見出しを、もっと伝わる言葉にして', shows: '元のページ → 依頼 → 見出しとボタンの案と理由', title: 'Webページの伝え方を見直す',
    steps: [still('lp-02-proposal-ask.jpg', 1280, 440, '「このWebサイトの見出しとボタンの改善案を1つ」と、字数と条件を添えて入力した依頼欄'),
      still('lp-02-proposal-result.jpg', 1280, 468, '理由・見出し「中小企業向けコーポレートサイト制作・改善」・ボタン「詳細を見る」が表示された回答')],
    note: 'Ollamaのローカルモデルで生成。画面にない価格・実績は追加しない指示つき。'},
  {id: 'priorities', ask: 'この数字から、次に何をするべきか整理して', shows: '元の数字 → 優先順位 → 次の一手', title: '次にすることを決める',
    steps: [still('lp-question.jpg', 1600, 900, FRAMES.question.alt), still('lp-answer.jpg', 1600, 900, FRAMES.answer.alt)],
    note: 'デモ用の架空データ。回答は暫定順位で、改善効果まではこの数字だけでは分からないと明記されています。'},
  {id: 'prototype', ask: 'このアイデアを、動く試作品にして', shows: '依頼 → 生成したHTML → 実際に操作できる結果', title: '小さなHTMLを作る',
    steps: [still('lp-02-prototype-ask.jpg', 1280, 380, '「この落書きを、触れる小さな宇宙にして」と、作り方の条件を添えて入力した依頼欄'),
      still('lp-02-prototype-result.jpg', 1280, 720, '惑星が公転するHTML「ORBIT PLAYGROUND」を、ブラウザーで操作している画面')],
    note: '実演映像内の表記では、完成版の作成にはCodexを使っています。作例のHTMLは、下の「仕事は残る」から操作できます。'}
]);
const SETUP = [
  ['01', '必要環境を確かめる', 'macOS 14以降。ローカルサービスと、使うモデルを用意します。'],
  ['02', '手順どおりに設定する', 'GitHubのセットアップ手順に沿って、アプリとモデル接続を設定します。'],
  ['03', '最初の依頼を送る', '⌥+Spaceで呼び出し、手元のメモをひとつ頼んでみてください。']
];

function genie(products) {
  const p = products.find(x => x.id === 'genie');
  if (!p?.ja?.features?.length || p.ja.features.length !== 3 || p.ja.highlights?.length !== 3) throw new TypeError('Genie ledger entry is incomplete');
  return p;
}
const img = (f, cls, lazy = true) => `<img class="${cls}" src="${f.src}" width="1600" height="900" ${lazy ? 'loading="lazy" ' : ''}decoding="async" alt="${e(f.alt)}">`;

const mark = () => `<span class="glp-mark"><img src="${FRAMES.mark.src}" width="30" height="18" alt=""><i></i></span>`;
/** TaskDock（1b）を静的な HTML で描く。動きは CSS だけ（Reduce Motion では止まる）。 */
function dock(state) {
  if (state === 'idle') return `<div class="glp-dock glp-dock--idle">${mark()}<span class="glp-dock__name">Genie</span><span class="glp-dock__rec"><i></i>録音</span></div>`;
  if (state === 'listen') return `<div class="glp-dock glp-dock--listen"><div class="glp-dock__row">${mark()}<span class="glp-dock__text"><small>聞いています</small><b>「この数字、要点だけまとめて」</b></span><span class="glp-wave">${'<i></i>'.repeat(7)}</span></div><p class="glp-dock__context"><span>Pulse — Launch overview</span>見ている画面 · 送信するまで渡しません</p></div>`;
  return `<div class="glp-dock glp-dock--done"><div class="glp-dock__row">${mark()}<span class="glp-dock__text"><small>要点ができました · 保存済み</small><b>3つの要点にまとめました</b></span></div><p class="glp-dock__file"><span><b>Genie-要点.md</b><small>書類 · たった今</small></span><span>開く</span><span>コピー</span></p></div>`;
}
const HOW_ALT = {
  idle: '作業中のダッシュボードの上端に、Genie の小さな入口がある',
  listen: 'TaskDock が開き、「この数字、要点だけまとめて」という発話を聞いている',
  done: 'TaskDock に、保存した Markdown ファイルと「開く」「コピー」が出ている'
};
function howFrames() {
  return `<figure class="glp-how" data-glp-how><div class="glp-how__screen">${HOW.map(([n, t, k], i) => `<div class="glp-how__frame${i === 0 ? ' is-on' : ''}" data-glp-how-frame="${i}" role="img" aria-label="${e(HOW_ALT[k])}">${img(FRAMES.work, 'glp-shot')}${dock(k)}${k === 'idle' ? '<span class="glp-keys" aria-hidden="true"><kbd>⌥</kbd><kbd>Space</kbd>どのアプリの上からでも</span>' : ''}<span class="glp-how__label">${n} ${e(t)}</span></div>`).join('')}</div><figcaption>次の版の TaskDock（開発中）の動きを再現した図です。背景は実アプリの紹介映像から切り出した画面 · デモ用の架空データ</figcaption></figure>`;
}
// 最後の導線: ページを通ってきた青い流線が、小さな印に戻る。
const RETURN = `<div class="glp-return" data-glp-return aria-hidden="true"><span class="glp-return__line"></span><img class="glp-return__mark" src="${FRAMES.mark.src}" width="59" height="36" alt=""></div>`;

function demosSection() {
  const shot = (x, label) => `<div class="glp-demo__step"><span class="glp-demo__tag">${label}</span><a class="glp-demo__zoom" href="${x.src}" target="_blank" rel="noopener noreferrer"><img src="${x.src}" width="${x.width}" height="${x.height}" loading="lazy" decoding="async" alt="${e(x.alt)}"><span class="glp-demo__zoom-note">拡大して見る <span aria-hidden="true">↗</span></span></a></div>`;
  const items = DEMOS.map((d, i) => `<article class="glp-demo${i === 0 ? ' is-on' : ''}" id="demo-${d.id}" data-glp-demo="${i}"><button class="glp-demo__ask" type="button" aria-pressed="${i === 0}" data-glp-demo-pick="${i}"><strong>「${e(d.ask)}」</strong><span>${e(d.shows)}</span></button><figure class="glp-demo__player"><div class="glp-demo__steps">${shot(d.steps[0], '依頼')}${shot(d.steps[1], '結果')}</div><figcaption><span><b>${e(d.title)}</b> — 実アプリの公開実演から切り出した画面です。入力は架空の例です。</span><span>${e(d.note)}</span></figcaption></figure></article>`).join('');
  return `<section class="container glp-demos" id="demos" aria-labelledby="glp-demos-title"><div class="glp-head"><p class="owned-kicker">02 · REAL WORKFLOWS</p><h2 id="glp-demos-title">あなたなら、<br>何を頼みますか。</h2><p>選ぶと、その依頼と結果の画面に切り替わります。押しても新しいAI処理は行いません。</p></div><div class="glp-demos__list">${items}</div><p class="glp-more"><a href="/products/genie/demos/">実演を動画で見る <span aria-hidden="true">→</span></a></p></section>`;
}

function artifactsSection() {
  return `<section class="container glp-artifacts" id="artifacts" aria-labelledby="glp-artifacts-title"><div class="glp-head"><p class="owned-kicker">03 · WHAT STAYS</p><h2 id="glp-artifacts-title">会話が終わっても、<br><span class="glp-trace">仕事は残る</span>。</h2><p>読んで終わりではなく、開き直して、直して、次の作業へ。実演で作った成果物を、そのまま置いています。</p></div><div class="glp-artifacts__grid"><article class="glp-doc"><p class="glp-doc__bar"><span>Genie-Next-Steps.md</span><span>MARKDOWN · 保存済み</span></p><div class="glp-doc__body"><h3>この数字から、改善の優先順位を3つ教えて</h3><ol><li><b>初回行動への誘導</b>：登録1,872人のうち初回行動は374人、到達率20.0%。次の一手：登録後のどの操作で離脱するか調べ、案内を改善する。</li><li><b>登録導線</b>：訪問12,480人のうち登録は15.0%。次の一手：登録開始から完了までの離脱を測り、フォームや訴求を見直す。</li><li><b>集客の質</b>：訪問は+24% this week。次の一手：流入元別に初回行動の到達率を比較し、成果につながる流入を増やす。</li></ol><p class="glp-doc__note">これは暫定順位です。離脱原因や各施策の改善効果は、この数字だけでは分かりません。</p></div><p class="glp-doc__foot"><span>デモ用の架空データから作成</span><a href="${O}assets/Genie-Next-Steps.md">Markdownを開く <span aria-hidden="true">→</span></a></p></article><article class="glp-doc glp-doc--dark"><p class="glp-doc__bar"><span>orbit.html</span><span>HTML · 操作できる作例</span></p><div class="glp-doc__art">${img(FRAMES.orbit, 'glp-shot')}</div><p class="glp-doc__foot"><span>「小さな宇宙にして」から生成 · 別タブで開きます</span>${ext(`${O}orbit.html`, 'できたものを動かす')}</p></article></div></section>`;
}

function trustSection(p) {
  const t = p.ja, f = t.features, h = t.highlights;
  const items = [
    ['使うモデルを選ぶ。', `${h[1].value} — ${h[1].label}`],
    ['画面を渡すのは、頼むときだけ。', f[1].body],
    ['必要な準備を先に知る。', t.scope]
  ];
  return `<section class="container glp-trust" id="trust" aria-labelledby="glp-trust-title"><div class="glp-head"><p class="owned-kicker">04 · YOUR CALL</p><h2 id="glp-trust-title">任せる範囲は、<br>あなたが決める。</h2>${ext(p.evidence, '詳しい条件を読む')}</div><dl class="glp-trust__list">${items.map(([q, a]) => `<div><dt>${e(q)}</dt><dd>${e(a)}</dd></div>`).join('')}</dl></section>`;
}

// The top film: 01's TaskDock reconstruction, written out as a 13-second video. Never called a recording.
export const TOP_FILM = Object.freeze({src: '/media/films/genie-taskdock-13s.mp4', poster: '/media/films/genie-taskdock-13s.jpg',
  note: '次の版のTaskDock（開発中）の動きを再現した約13秒の映像です。背景は実アプリの紹介映像から切り出した画面で、データは架空です。実アプリの録画ではありません。'});
const HERO_FILM = /<figure class="owned-film owned-film--hero" id="recording">[\s\S]*?<\/figure>/;
const heroFilm = proof => `<figure class="owned-film owned-film--hero" id="recording"><div class="owned-film__bar"><span>Genie</span><span>再現映像 · 開発中の次の版 / 約13秒</span></div><div class="owned-film__screen"><img src="${TOP_FILM.poster}" alt="作業中のダッシュボードの上端に、Genie の小さな入口がある（再現）" width="1280" height="720" fetchpriority="high" decoding="async"><video hidden controls muted playsinline preload="none" poster="${TOP_FILM.poster}" data-recording-src="${TOP_FILM.src}" aria-label="Genie 次の版のTaskDockの動き（再現映像）"></video><button type="button" class="owned-film__play" hidden>13秒で動きを見る <span aria-hidden="true">▶</span></button></div><figcaption><span>${e(TOP_FILM.note)}</span><span>この映像とは別に確認できるもの — ${e(proof)}</span><a href="/products/genie/demos/">実演を動画で見る <span aria-hidden="true">→</span></a></figcaption><p class="owned-film__status" role="status" aria-live="polite" hidden></p></figure>`;
const HEAD_OLD = '<div class="owned-section-head"><p class="owned-kicker">主要機能・できること</p><h2>いま確かめられる、<br>主な機能。</h2></div>';
const HEAD_NEW = '<div class="owned-section-head glp-head"><p class="owned-kicker">01 · HOW IT FEELS</p><h2>AIのために、<br>仕事を止めない。</h2><p>別の場所で説明し直すより、いまの作業のそばで、ひとつ頼む。呼び出し、必要な情報を渡し、返ってきた結果をそのまま使います。</p></div>';
const H1 = /(<h1><img class="owned-product-icon"[^>]*>)[\s\S]*?(<\/h1>)/;
const START_H2 = /(<section class="container owned-start" id="start"><div><p class="owned-kicker">)試す(<\/p>)<h2>[\s\S]*?<\/h2>/;
const once = (html, needle, label) => {
  const at = html.indexOf(needle);
  if (at < 0 || html.indexOf(needle, at + 1) >= 0) throw new Error(`Genie LP: expected exactly one ${label}`);
  return at;
};
const before = (html, needle, label, insert) => { const at = once(html, needle, label); return html.slice(0, at) + insert + html.slice(at); };

/** Fail closed: every anchor below is built by an earlier pass; a missing one stops the build. */
export function refineGenieLp(html, products = ledgerProducts) {
  if (html.includes(`data-genie-lp="${GENIE_LP_VERSION}"`)) return html;
  const p = genie(products);
  if (!/<html lang="ja">/.test(html) || !html.includes('data-product-id="genie"')) throw new Error('Genie LP: not the Japanese Genie page');
  if (!H1.test(html)) throw new Error('Genie LP: expected the Genie heading with its icon');
  if (!START_H2.test(html)) throw new Error('Genie LP: expected the start section');
  once(html, HEAD_OLD, 'features heading');
  const films = html.match(new RegExp(HERO_FILM.source, 'g')) || [];
  if (films.length !== 1 || !films[0].includes('data-recording-src="/media/products/genie.mp4"')) throw new Error('Genie LP: expected exactly one top recording');
  once(html, '<a href="#recording">実演</a>', 'recording nav link');
  once(html, '<p class="ad-label">録画の見どころ</p>', 'recording highlight label');
  const lead = '<p class="glp-lead">いま見ている画面の相談から、次に使う下書きまで。Genieは、作業のそばで呼び出せるMacのAIアシスタントです。</p>';
  html = html.replace(H1, (_, a, b) => `${a}頼むだけで、<br>仕事が<span class="glp-trace">動き出す</span>。${b}${lead}`);
  html = html.replace(HEAD_OLD, () => HEAD_NEW);
  html = html.replace(HERO_FILM, () => heroFilm(p.ja.proof)).replace('<a href="#recording">実演</a>', '<a href="#recording">動き</a>').replace('<p class="ad-label">録画の見どころ</p>', '<p class="ad-label">映像の見どころ</p>');
  html = before(html, '<p class="owned-features__source">', 'features source', howFrames());
  html = before(html, '<section class="container rm-film15 rm-film15--genie"', '15-second film', demosSection() + artifactsSection());
  html = before(html, '<section class="container owned-start" id="start"', 'start section', trustSection(p));
  html = html.replace(START_H2, (_, a, b) => `${a.replace('<p class="owned-kicker">', RETURN + '<p class="owned-kicker">')}05 · START${b}<h2>最初の仕事は、<br>小さくていい。</h2><p class="glp-start-lead">いま抱えているメモをひとつ。Genieと、次の一歩に変えてみてください。</p>`);
  html = before(html, '<div class="owned-start__actions">', 'start actions', `<ol class="glp-setup">${SETUP.map(([n, t, b]) => `<li><span>${n}</span><strong>${e(t)}</strong><small>${e(b)}</small></li>`).join('')}</ol>`);
  return html.replace('<body ', `<body data-genie-lp="${GENIE_LP_VERSION}" `);
}

export async function writeGenieLp(dist, products = ledgerProducts) {
  const required = [...Object.values(FRAMES).map(f => f.src), ...DEMOS.flatMap(d => d.steps.map(x => x.src)), TOP_FILM.src, TOP_FILM.poster, `${O}orbit.html`, `${O}assets/Genie-Next-Steps.md`, '/assets/genie-lp.mjs'];
  for (const asset of required) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Genie LP: missing ${asset}`); });
  const file = path.join(dist, PAGE);
  const html = refineGenieLp(await fs.readFile(file, 'utf8'), products);
  const assets = path.join(dist, 'assets');
  const [css, js, layer] = await Promise.all(['showcase.css', 'showcase.mjs', 'genie-lp.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-genie-lp]')) throw new Error('Genie LP stylesheet is missing or stale');
  await fs.writeFile(file, html);
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CSS_MARK)[0].trimEnd() + `\n${CSS_MARK}\n${layer}`);
  await fs.writeFile(path.join(assets, 'showcase.mjs'), js.split(JS_MARK)[0].trimEnd() + `\n${JS_MARK}\nif(document.body.dataset.genieLp)import('./genie-lp.mjs').catch(()=>{document.documentElement.dataset.genieLp='unavailable';});\n`);
}
