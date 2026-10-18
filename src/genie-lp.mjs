/**
 * Genie landing page (Japanese and English product pages): "明るいアトリエ × 青い魔法 × 本物のTaskDock".
 *
 * Runs last on /products/genie/ and /en/products/genie/ and RE-COMPOSES the existing owned page instead of replacing it,
 * so every contract the product page already carries (13-second real recording, ledger features, try-now, action note,
 * scope/proof, next-UI design frames, 15-second film, related products) stays in place:
 *   hero (invoke Genie during work) → 01 ask about the current screen (ledger features + real frames)
 *   → 02 three concrete work requests, each with its request and result cut from the published films
 *   → 03 take the answer as a file (saved Markdown + HTML)
 *   → 15-second film → flow → 04 input/model choices (ledger facts) → start with a note → boundaries …
 *
 * - Every still is cut from the published product film (real app screens, fictional demo data, Japanese UI).
 * - The top film is the 01 TaskDock reconstruction written out as a video (media/films/genie-taskdock-13s.mp4), labelled as
 *   a reconstruction of the next version in development, never as a recording. Nothing autoplays; preload="none".
 * - 02 shows stills, not the films (2026-09-30: the films read as unfinished). The films stay on /products/genie/demos/.
 * - Complete without JavaScript: every request and result is an image with alt text; the HTML artifact opens in a new tab.
 * - Claims come from src/products.mjs only. The English page (2026-10-19) follows the Japanese one section by section.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {products as ledgerProducts} from './products.mjs';

export const GENIE_LP_VERSION = '20261002-genie-lp-5';
const CSS_MARK = '/* REACHMADE_GENIE_LP */';
const JS_MARK = '// REACHMADE_GENIE_LP';
const PAGES = Object.freeze({ja: 'products/genie/index.html', en: 'en/products/genie/index.html'});
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
  orbit: {src: `${A}lp-orbit.jpg`, alt: 'Genieへの依頼から作り始め、完成版はCodexで仕上げた、惑星が公転するHTML'},
  // 01 の背景。TaskDock が写っていない実画面（紹介映像から切り出し）。
  work: {src: `${A}lp-work.jpg`, alt: '作業中のダッシュボード（Pulse）の画面'},
  // Genie の印（白）。GenieMark-source.png を切り詰めたもの。197×120。
  mark: {src: `${A}genie-mark-white.png`, alt: ''}
});
const FRAMES_EN = Object.freeze({
  question: 'Typing a request with a screenshot attached',
  answer: 'An answer listing three priorities',
  orbit: 'An HTML page of orbiting planets, started from a request to Genie and finished with Codex',
  work: 'A working dashboard (Pulse)'
});
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
    note: '実演映像内の表記では、完成版の作成にはCodexを使っています。作例のHTMLは、下にある「動かしてみる」から開けます。'}
]);
const DEMOS_EN = Object.freeze({
  proposal: {ask: 'Make this page’s headline say it better', shows: 'Original page → request → headline and button ideas, with reasons', title: 'Rework how a web page reads',
    alts: ['The request field asking for one improvement to the site’s headline and button, with a length and conditions',
      'The answer: a reason, the headline “中小企業向けコーポレートサイト制作・改善” (corporate sites for small businesses) and the button “詳細を見る” (See details)'],
    note: 'Generated with a local Ollama model, told not to add prices or track records that are not on the screen.'},
  priorities: {ask: 'Sort out what to do next from these numbers', shows: 'Original numbers → priorities → next step', title: 'Decide what to do next',
    alts: [FRAMES_EN.question, FRAMES_EN.answer],
    note: 'Fictional demo data. The answer says its order is provisional and that these numbers alone cannot show how much each change would help.'},
  prototype: {ask: 'Turn this idea into a working prototype', shows: 'Request → generated HTML → a result you can click through', title: 'Make a small HTML page',
    alts: ['The request field asking to turn a doodle into a small universe you can touch, with conditions for how to build it',
      'The orbiting-planet HTML “ORBIT PLAYGROUND” being used in a browser'],
    note: 'As labelled in the demonstration film, the final version was made with Codex. Open the example HTML from “Try it” below.'}
});

// Every visible string that is not a ledger fact, per language. Japanese is the original; English follows it section by section.
const COPY = Object.freeze({
  ja: {
    how: [['01', '呼び出す', 'idle'], ['02', '必要な情報を渡す', 'listen'], ['03', '結果を使う', 'done']],
    howAlt: {
      idle: '作業中のダッシュボードの上端に、Genie の小さな入口がある',
      listen: 'TaskDock が開き、「この数字、要点だけまとめて」という発話を聞いている',
      done: 'TaskDock に、保存した Markdown ファイルと「開く」「コピー」が出ている'
    },
    keys: 'どのアプリの上からでも',
    howCaption: '次の版の TaskDock（開発中）の動きを再現した図です。背景は実アプリの紹介映像から切り出した画面 · デモ用の架空データ',
    dock: {rec: '録音', listening: '聞いています', said: '「この数字、要点だけまとめて」', context: '見ている画面 · 送信するまで渡しません',
      ready: '要点ができました · 保存済み', summary: '3つの要点にまとめました', file: 'Genie-要点.md', fileMeta: '書類 · たった今', open: '開く', copy: 'コピー'},
    setup: [
      ['01', '必要環境を確かめる', 'macOS 14以降。ローカルサービスと、使うモデルを用意します。'],
      ['02', '手順どおりに設定する', 'GitHubのセットアップ手順に沿って、アプリとモデル接続を設定します。'],
      ['03', 'メモを添えて頼む', '⌥+Spaceで呼び出し、メモから実行計画を作ってみてください。']
    ],
    request: '依頼', result: '結果', zoom: '拡大して見る', demoCaption: '実アプリの公開実演から切り出した画面です。入力は架空の例です。', quote: s => `「${s}」`,
    demosTitle: 'たとえば、<br>こんな仕事の途中で。',
    demosLead: 'ページの言い回し、数字の読み方、小さな試作。依頼を選ぶと、実演時の入力と結果が見られます。押しても新しいAI処理は行いません。',
    demosPage: '/products/genie/demos/', demosLink: '実演を動画で見る',
    artifactsTitle: '答えは、<br><span class="glp-trace">ファイルで持ち帰る</span>。',
    artifactsLead: 'Markdownを開き直す。小さなHTMLを動かす。実演のファイルを、ここから開けます。',
    mdMeta: 'MARKDOWN · 保存済み', mdLang: '', mdFoot: 'デモ用の架空データから作成', mdOpen: 'Markdownを開く',
    orbitMeta: 'HTML · 操作できる作例', orbitFoot: '完成版はCodexで作成 · 別タブで開きます', orbitOpen: '動かしてみる',
    trust: ['使うモデルを選ぶ。', '画面を渡すのは、頼むときだけ。', '使う前に、用意するもの。'],
    trustTitle: '何を渡すか。<br>どのモデルに頼むか。', trustLink: '設定・送信先の条件を読む',
    filmNote: '次の版のTaskDock（開発中）の動きを再現した約13秒の映像です。背景は実アプリの紹介映像から切り出した画面で、データは架空です。実アプリの録画ではありません。',
    filmBar: '再現映像 · 開発中の次の版 / 約13秒', filmAlt: '作業中のダッシュボードの上端に、Genie の小さな入口がある（再現）',
    filmLabel: 'Genie 次の版のTaskDockの動き（再現映像）', filmPlay: '13秒で動きを見る', filmProof: 'この映像とは別に確認できるもの — ',
    headOld: '<div class="owned-section-head"><p class="owned-kicker">主要機能・できること</p><h2>いま確かめられる、<br>主な機能。</h2></div>',
    headNew: '<div class="owned-section-head glp-head"><p class="owned-kicker">01 · HOW IT FEELS</p><h2>この画面について、<br>ひとつ聞きたい。</h2><p>スクリーンショットを添えれば、見ている内容をもとに依頼できます。答えをコピーしたり、Markdownで保存したりして、元の作業を続けられます。</p></div>',
    h1: '作業の途中で、<br>Genieを<span class="glp-trace">呼び出す</span>。',
    lead: '<p class="glp-invocation"><kbd>⌥</kbd><kbd>Space</kbd><span>どのアプリからでも。</span></p><p class="glp-lead">見ているページについて聞きたい。数字の読み方を相談したい。Genieは、いまの画面を添えて頼めるMacのAIアシスタントです。</p>',
    startKicker: '試す', startTitle: 'まずは、<br>手元のメモから。',
    startLead: '設定が済んだら、短いメモをひとつ。実行計画を頼み、返ってきた結果を保存するところまで試せます。',
    nav: ['<a href="#recording">実演</a>', '<a href="#recording">動き</a>'],
    label: ['<p class="ad-label">録画の見どころ</p>', '<p class="ad-label">映像の見どころ</p>'],
    // The Japanese page carries the 15-second film; the English page gains it from fifteen-second-films.mjs as well.
    insertBefore: '<section class="container rm-film15 rm-film15--genie"'
  },
  en: {
    how: [['01', 'Call it up', 'idle'], ['02', 'Give it what it needs', 'listen'], ['03', 'Use the result', 'done']],
    howAlt: {
      idle: 'A small Genie entry point at the top edge of a working dashboard',
      listen: 'TaskDock open, listening to “Just the key points of these numbers”',
      done: 'TaskDock showing the saved Markdown file with Open and Copy'
    },
    keys: 'From any app',
    howCaption: 'A reconstruction of how TaskDock works in the next version (in development). The background is cut from the real app’s introduction film · fictional demo data',
    dock: {rec: 'Record', listening: 'Listening', said: '“Just the key points of these numbers”', context: 'The screen you are viewing · not shared until you send',
      ready: 'Key points ready · saved', summary: 'Summarised into three points', file: 'Genie-key-points.md', fileMeta: 'Document · just now', open: 'Open', copy: 'Copy'},
    setup: [
      ['01', 'Check the requirements', 'macOS 14 or later. Prepare the local service and the model you will use.'],
      ['02', 'Set it up as documented', 'Follow the setup steps on GitHub to connect the app and the model.'],
      ['03', 'Ask with a note', 'Call it up with ⌥+Space and ask for an action plan from a note.']
    ],
    request: 'Request', result: 'Result', zoom: 'View larger', demoCaption: 'Screens cut from a public demonstration of the real app (Japanese UI). The input is a fictional example.', quote: s => `“${s}”`,
    demosTitle: 'For example,<br>in the middle of tasks like these.',
    demosLead: 'The wording of a page, how to read numbers, a small prototype. Pick a request to see the input and result from the demonstration. Pressing it does not start any new AI processing.',
    demosPage: '/en/products/genie/demos/', demosLink: 'Watch the demonstrations',
    artifactsTitle: 'Take the answer<br>home <span class="glp-trace">as a file</span>.',
    artifactsLead: 'Reopen the Markdown. Run the small HTML. Open the files from the demonstration here.',
    mdMeta: 'MARKDOWN · saved', mdLang: ' lang="ja"', mdFoot: 'Made from fictional demo data · the saved file is in Japanese', mdOpen: 'Open the Markdown',
    orbitMeta: 'HTML · interactive example', orbitFoot: 'Final version made with Codex · opens in a new tab', orbitOpen: 'Try it',
    trust: ['Choose the model.', 'Your screen is sent only when you ask.', 'What to prepare first.'],
    trustTitle: 'What to hand over.<br>Which model to ask.', trustLink: 'Read the settings and where data goes',
    filmNote: 'An approximately 13-second reconstruction of how TaskDock works in the next version (in development). The background is cut from the real app’s introduction film, and the data is fictional. It is not a recording of the real app.',
    filmBar: 'Reconstruction · next version in development / ~13 s', filmAlt: 'A small Genie entry point at the top edge of a working dashboard (reconstruction)',
    filmLabel: 'Genie: how TaskDock works in the next version (reconstruction)', filmPlay: 'See it in 13 seconds', filmProof: 'What you can check apart from this film — ',
    headOld: '<div class="owned-section-head"><p class="owned-kicker">KEY CAPABILITIES</p><h2>From a quick question to a draft you can use.</h2></div>',
    headNew: '<div class="owned-section-head glp-head"><p class="owned-kicker">01 · HOW IT FEELS</p><h2>One question<br>about this screen.</h2><p>Attach a screenshot and ask about what you are looking at. Copy the answer or save it as Markdown, then carry on with your work.</p></div>',
    h1: 'In the middle of work,<br><span class="glp-trace">call up</span> Genie.',
    lead: '<p class="glp-invocation"><kbd>⌥</kbd><kbd>Space</kbd><span>From any app.</span></p><p class="glp-lead">A question about the page you are looking at. Advice on how to read some numbers. Genie is a Mac AI assistant you can ask with your current screen attached.</p>',
    startKicker: 'TRY IT', startTitle: 'Start with<br>a note you already have.',
    startLead: 'Once it is set up, write one short note. Ask for an action plan and save what comes back.',
    nav: ['<a href="#recording">Recording</a>', '<a href="#recording">Motion</a>'],
    label: ['<p class="ad-label">WHAT TO LOOK FOR</p>', '<p class="ad-label">WHAT TO LOOK FOR</p>'],
    insertBefore: '<section class="container rm-film15 rm-film15--genie"'
  }
});
// The saved Markdown is shown as it was written (Japanese); the English page marks it with lang="ja".
const MD_BODY = '<h3>この数字から、改善の優先順位を3つ教えて</h3><ol><li><b>初回行動への誘導</b>：登録1,872人のうち初回行動は374人、到達率20.0%。次の一手：登録後のどの操作で離脱するか調べ、案内を改善する。</li><li><b>登録導線</b>：訪問12,480人のうち登録は15.0%。次の一手：登録開始から完了までの離脱を測り、フォームや訴求を見直す。</li><li><b>集客の質</b>：訪問は+24% this week。次の一手：流入元別に初回行動の到達率を比較し、成果につながる流入を増やす。</li></ol><p class="glp-doc__note">これは暫定順位です。離脱原因や各施策の改善効果は、この数字だけでは分かりません。</p>';

function genie(products, lang) {
  const p = products.find(x => x.id === 'genie');
  if (!p?.[lang]?.features?.length || p[lang].features.length !== 3 || p[lang].highlights?.length !== 3) throw new TypeError('Genie ledger entry is incomplete');
  return p;
}
const img = (f, cls, alt, lazy = true) => `<img class="${cls}" src="${f.src}" width="1600" height="900" ${lazy ? 'loading="lazy" ' : ''}decoding="async" alt="${e(alt)}">`;
const frameAlt = (lang, key) => (lang === 'en' ? FRAMES_EN[key] : FRAMES[key].alt);

const mark = () => `<span class="glp-mark"><img src="${FRAMES.mark.src}" width="30" height="18" alt=""><i></i></span>`;
/** TaskDock（1b）を静的な HTML で描く。動きは CSS だけ（Reduce Motion では止まる）。 */
function dock(state, d) {
  if (state === 'idle') return `<div class="glp-dock glp-dock--idle">${mark()}<span class="glp-dock__name">Genie</span><span class="glp-dock__rec"><i></i>${d.rec}</span></div>`;
  if (state === 'listen') return `<div class="glp-dock glp-dock--listen"><div class="glp-dock__row">${mark()}<span class="glp-dock__text"><small>${d.listening}</small><b>${d.said}</b></span><span class="glp-wave">${'<i></i>'.repeat(7)}</span></div><p class="glp-dock__context"><span>Pulse — Launch overview</span>${d.context}</p></div>`;
  return `<div class="glp-dock glp-dock--done"><div class="glp-dock__row">${mark()}<span class="glp-dock__text"><small>${d.ready}</small><b>${d.summary}</b></span></div><p class="glp-dock__file"><span><b>${d.file}</b><small>${d.fileMeta}</small></span><span>${d.open}</span><span>${d.copy}</span></p></div>`;
}
function howFrames(c, lang) {
  return `<figure class="glp-how" data-glp-how><div class="glp-how__screen">${c.how.map(([n, t, k], i) => `<div class="glp-how__frame${i === 0 ? ' is-on' : ''}" data-glp-how-frame="${i}" role="img" aria-label="${e(c.howAlt[k])}">${img(FRAMES.work, 'glp-shot', frameAlt(lang, 'work'))}${dock(k, c.dock)}${k === 'idle' ? `<span class="glp-keys" aria-hidden="true"><kbd>⌥</kbd><kbd>Space</kbd>${c.keys}</span>` : ''}<span class="glp-how__label">${n} ${e(t)}</span></div>`).join('')}</div><figcaption>${c.howCaption}</figcaption></figure>`;
}
// 最後の導線: ページを通ってきた青い流線が、小さな印に戻る。
const RETURN = `<div class="glp-return" data-glp-return aria-hidden="true"><span class="glp-return__line"></span><img class="glp-return__mark" src="${FRAMES.mark.src}" width="59" height="36" alt=""></div>`;

function demosSection(c, lang) {
  const shot = (x, alt, label) => `<div class="glp-demo__step"><span class="glp-demo__tag">${label}</span><a class="glp-demo__zoom" href="${x.src}" target="_blank" rel="noopener noreferrer"><img src="${x.src}" width="${x.width}" height="${x.height}" loading="lazy" decoding="async" alt="${e(alt)}"><span class="glp-demo__zoom-note">${c.zoom} <span aria-hidden="true">↗</span></span></a></div>`;
  const items = DEMOS.map((d, i) => {
    const t = lang === 'en' ? DEMOS_EN[d.id] : {...d, alts: d.steps.map(x => x.alt)};
    return `<article class="glp-demo${i === 0 ? ' is-on' : ''}" id="demo-${d.id}" data-glp-demo="${i}"><button class="glp-demo__ask" type="button" aria-pressed="${i === 0}" data-glp-demo-pick="${i}" aria-controls="glp-result-${d.id}"><span class="glp-demo__index" aria-hidden="true">0${i + 1}<span>→</span></span><strong>${e(c.quote(t.ask))}</strong><span>${e(t.shows)}</span></button><figure class="glp-demo__player" id="glp-result-${d.id}"><div class="glp-demo__steps">${shot(d.steps[0], t.alts[0], c.request)}${shot(d.steps[1], t.alts[1], c.result)}</div><figcaption><span><b>${e(t.title)}</b> — ${c.demoCaption}</span><span>${e(t.note)}</span></figcaption></figure></article>`;
  }).join('');
  return `<section class="container glp-demos" id="demos" aria-labelledby="glp-demos-title"><div class="glp-head"><p class="owned-kicker">02 · REAL WORKFLOWS</p><h2 id="glp-demos-title">${c.demosTitle}</h2><p>${c.demosLead}</p></div><div class="glp-demos__list">${items}</div><p class="glp-more"><a href="${c.demosPage}">${c.demosLink} <span aria-hidden="true">→</span></a></p></section>`;
}

function artifactsSection(c, lang) {
  return `<section class="container glp-artifacts" id="artifacts" aria-labelledby="glp-artifacts-title"><div class="glp-head"><p class="owned-kicker">03 · WHAT STAYS</p><h2 id="glp-artifacts-title">${c.artifactsTitle}</h2><p>${c.artifactsLead}</p></div><div class="glp-artifacts__grid"><article class="glp-doc"><p class="glp-doc__bar"><span>Genie-Next-Steps.md</span><span>${c.mdMeta}</span></p><div class="glp-doc__body"${c.mdLang}>${MD_BODY}</div><p class="glp-doc__foot"><span>${c.mdFoot}</span><a href="${O}assets/Genie-Next-Steps.md">${c.mdOpen} <span aria-hidden="true">→</span></a></p></article><article class="glp-doc glp-doc--dark"><p class="glp-doc__bar"><span>orbit.html</span><span>${c.orbitMeta}</span></p><div class="glp-doc__art">${img(FRAMES.orbit, 'glp-shot', frameAlt(lang, 'orbit'))}</div><p class="glp-doc__foot"><span>${c.orbitFoot}</span>${ext(`${O}orbit.html`, c.orbitOpen)}</p></article></div></section>`;
}

function trustSection(p, c, lang) {
  const t = p[lang], f = t.features, h = t.highlights;
  const items = [
    [c.trust[0], `${h[1].value} — ${h[1].label}`],
    [c.trust[1], f[1].body],
    [c.trust[2], t.scope]
  ];
  return `<section class="container glp-trust" id="trust" aria-labelledby="glp-trust-title"><div class="glp-head"><p class="owned-kicker">04 · YOUR CALL</p><h2 id="glp-trust-title">${c.trustTitle}</h2>${ext(p.evidence, c.trustLink)}</div><dl class="glp-trust__list">${items.map(([q, a]) => `<div><dt>${e(q)}</dt><dd>${e(a)}</dd></div>`).join('')}</dl></section>`;
}

// The top film: 01's TaskDock reconstruction, written out as a 13-second video. Never called a recording.
export const TOP_FILM = Object.freeze({src: '/media/films/genie-taskdock-13s.mp4', poster: '/media/films/genie-taskdock-13s.jpg', note: COPY.ja.filmNote});
const HERO_FILM = /<figure class="owned-film owned-film--hero" id="recording">[\s\S]*?<\/figure>/;
const heroFilm = (proof, c) => `<figure class="owned-film owned-film--hero" id="recording"><div class="owned-film__bar"><span>Genie</span><span>${c.filmBar}</span></div><div class="owned-film__screen"><img src="${TOP_FILM.poster}" alt="${e(c.filmAlt)}" width="1280" height="720" fetchpriority="high" decoding="async"><video hidden controls muted playsinline preload="none" poster="${TOP_FILM.poster}" data-recording-src="${TOP_FILM.src}" aria-label="${e(c.filmLabel)}"></video><button type="button" class="owned-film__play" hidden>${c.filmPlay} <span aria-hidden="true">▶</span></button></div><figcaption><span>${e(c.filmNote)}</span><span>${c.filmProof}${e(proof)}</span><a href="${c.demosPage}">${c.demosLink} <span aria-hidden="true">→</span></a></figcaption><p class="owned-film__status" role="status" aria-live="polite" hidden></p></figure>`;
const H1 = /(<h1><img class="owned-product-icon"[^>]*>)[\s\S]*?(<\/h1>)/;
const startH2 = kicker => new RegExp(`(<section class="container owned-start" id="start"><div><p class="owned-kicker">)${kicker}(<\\/p>)<h2>[\\s\\S]*?<\\/h2>`);
const once = (html, needle, label) => {
  const at = html.indexOf(needle);
  if (at < 0 || html.indexOf(needle, at + 1) >= 0) throw new Error(`Genie LP: expected exactly one ${label}`);
  return at;
};
const before = (html, needle, label, insert) => { const at = once(html, needle, label); return html.slice(0, at) + insert + html.slice(at); };

/** Fail closed: every anchor below is built by an earlier pass; a missing one stops the build. */
export function refineGenieLp(html, products = ledgerProducts) {
  if (html.includes(`data-genie-lp="${GENIE_LP_VERSION}"`)) return html;
  const lang = /<html lang="(ja|en)">/.exec(html)?.[1];
  if (!lang || !html.includes('data-product-id="genie"')) throw new Error('Genie LP: not a Japanese or English Genie page');
  const p = genie(products, lang), c = COPY[lang], START_H2 = startH2(c.startKicker);
  if (!H1.test(html)) throw new Error('Genie LP: expected the Genie heading with its icon');
  if (!START_H2.test(html)) throw new Error('Genie LP: expected the start section');
  once(html, c.headOld, 'features heading');
  const films = html.match(new RegExp(HERO_FILM.source, 'g')) || [];
  if (films.length !== 1 || !films[0].includes('data-recording-src="/media/products/genie.mp4"')) throw new Error('Genie LP: expected exactly one top recording');
  once(html, c.nav[0], 'recording nav link');
  once(html, c.label[0], 'recording highlight label');
  html = html.replace(H1, (_, a, b) => `${a}${c.h1}${b}${c.lead}`);
  html = html.replace(c.headOld, () => c.headNew);
  html = html.replace(HERO_FILM, () => heroFilm(p[lang].proof, c)).replace(c.nav[0], c.nav[1]).replace(c.label[0], c.label[1]);
  html = before(html, '<p class="owned-features__source">', 'features source', howFrames(c, lang));
  html = before(html, c.insertBefore, '15-second film', demosSection(c, lang) + artifactsSection(c, lang));
  html = before(html, '<section class="container owned-start" id="start"', 'start section', trustSection(p, c, lang));
  html = html.replace(START_H2, (_, a, b) => `${a.replace('<p class="owned-kicker">', RETURN + '<p class="owned-kicker">')}05 · START${b}<h2>${c.startTitle}</h2><p class="glp-start-lead">${c.startLead}</p>`);
  html = before(html, '<div class="owned-start__actions">', 'start actions', `<ol class="glp-setup">${c.setup.map(([n, t, b]) => `<li><span>${n}</span><strong>${e(t)}</strong><small>${e(b)}</small></li>`).join('')}</ol>`);
  return html.replace('<body ', `<body data-genie-lp="${GENIE_LP_VERSION}" `);
}

export async function writeGenieLp(dist, products = ledgerProducts) {
  const required = [...Object.values(FRAMES).map(f => f.src), ...DEMOS.flatMap(d => d.steps.map(x => x.src)), TOP_FILM.src, TOP_FILM.poster, `${O}orbit.html`, `${O}assets/Genie-Next-Steps.md`, '/assets/genie-lp.mjs'];
  for (const asset of required) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Genie LP: missing ${asset}`); });
  for (const page of Object.values(PAGES)) {
    const file = path.join(dist, page);
    await fs.writeFile(file, refineGenieLp(await fs.readFile(file, 'utf8'), products));
  }
  const assets = path.join(dist, 'assets');
  const [css, js, layer] = await Promise.all(['showcase.css', 'showcase.mjs', 'genie-lp.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-genie-lp]')) throw new Error('Genie LP stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CSS_MARK)[0].trimEnd() + `\n${CSS_MARK}\n${layer}`);
  await fs.writeFile(path.join(assets, 'showcase.mjs'), js.split(JS_MARK)[0].trimEnd() + `\n${JS_MARK}\nif(document.body.dataset.genieLp)import('./genie-lp.mjs').catch(()=>{document.documentElement.dataset.genieLp='unavailable';});\n`);
}
