/**
 * Japanese Oathra page, re-composed from the owner's design brief "Oathra LP 改善案" (2026-09-29).
 *
 * Runs as the last pass on dist/products/oathra/index.html and rebuilds <main> in the brief's order:
 *   1 first view (headline, one sentence, the 30-second image film, one button)
 *   2 the ring (the judgement: only the other party's words close a segment)
 *   3 from request to report (four stills of the design, labelled as not released)
 *   4 what the AI may decide (the design's three levels, labelled as not implemented)
 *   5 recordings (the existing 13-second recording and the 15-second film)
 *   6 where it stands (can / conditional / not claimed)
 *   7 try and consult (the existing sections, unchanged)
 *
 * Checked 2026-09-29 against FORIFOR/oathra: the judgement rules (2), the published runtime, CLI and
 * evaluation harness, and "real calls need setup and cost; the 100-call evaluation is not done" (6) are
 * implemented or documented. The request/approve/report app screens (3) and the approval, cost cap,
 * inbound handling and three-level delegation (4) exist only in the design film, so both sections say so.
 *
 * Existing pieces are moved, not rewritten, so the ledger text they carry stays as it was. Idempotent and
 * fail closed: if an expected piece is missing, the build stops instead of shipping a broken page.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {products as ledgerProducts} from './products.mjs';
import {landingExperience} from './product-landings.mjs';

export const OATHRA_LP_VERSION = '20261010-oathra-lp-4';
export const CONCEPT_DISCLAIMER = '構想デモ・実際の発信/予約は行いません';
const CSS_MARK = '/* REACHMADE_OATHRA_LP */';
const PAGE = 'products/oathra/index.html';
const A = '/assets/products/oathra/';
export const FILM = Object.freeze({src: '/media/films/oathra-30s.mp4', poster: '/media/films/oathra-30s.jpg'});
export const STEPS = Object.freeze([
  {src: `${A}lp-step-01.jpg`, title: '用件を書く', body: '電話の相手と、頼みたいことを、ふだんの言葉で書く。', alt: '「電話を頼む」画面。相手に焼肉 たけ、依頼に10月3日（土）19時から2名の予約、任せる範囲の3列が入っている'},
  {src: `${A}lp-step-02.jpg`, title: '確認して発信', body: '相手・内容・上限の費用・記録の扱いを見て、あなたが承認するまで電話はかからない。', alt: 'AIへの指示書と「相手・頼むこと・費用を確かめました」のチェック、「この内容で電話をかける」ボタン'},
  {src: `${A}lp-step-03.jpg`, title: '会話を見守る', body: '相手が答えた項目を、その場で確認する。いつでも通話を終えられる。', alt: '通話中の画面。輪が3/3で閉じ、日付・時刻・人数の3項目が相手の言葉で確認済みになっている'},
  {src: `${A}lp-step-04.jpg`, title: '決まったことを読む', body: '頼んだ内容との違いと、あなたが引き継ぐことも報告する。', alt: '「決まりました」の報告画面。日付・時刻・人数と、それぞれの根拠の発言と時刻'}
]);
const e = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const ext = (href, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(label)} ${arrow}</a>`;

/** Returns the outer HTML of the first element that starts with `open`, balancing tags of the same name. */
export function outer(html, open, what) {
  const start = html.indexOf(open);
  if (start < 0 || html.indexOf(open, start + 1) >= 0) throw new Error(`Oathra LP: expected exactly one ${what}`);
  const tag = open.match(/^<([a-z0-9]+)/)[1];
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  throw new Error(`Oathra LP: unbalanced ${what}`);
}

function oathra(products) {
  const p = products.find(x => x.id === 'oathra');
  if (!p?.ja?.highlights || p.ja.highlights.length !== 3) throw new TypeError('Oathra LP: the ledger entry is missing its highlights');
  return p;
}

function ring(closed) {
  // Three segments, as in the film. Green only for "confirmed in the other party's words".
  const arc = (i, on) => {
    const a0 = -90 + i * 120 + 4, a1 = a0 + 112, r = 44, c = 50;
    const pt = a => [c + r * Math.cos(a * Math.PI / 180), c + r * Math.sin(a * Math.PI / 180)].map(n => n.toFixed(2)).join(' ');
    return `<path class="olp-ring__seg${on ? ' is-closed' : ''}" d="M ${pt(a0)} A ${r} ${r} 0 0 1 ${pt(a1)}"/>`;
  };
  return `<svg class="olp-ring__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${[0, 1, 2].map(i => arc(i, i < closed)).join('')}<text x="50" y="55" text-anchor="middle">${closed}/3</text></svg>`;
}

function hero(p, x) {
  return `<section class="container olp-hero" aria-labelledby="olp-title"><div class="olp-hero__copy"><p class="owned-kicker">${e(p.index)} / ${e(p.discipline)} / ${e(p.ja.status)}</p><h1 id="olp-title">「できました」を、<br>根拠にしない。</h1><p class="olp-lead">その予約、相手は何と言った？ OathraはAIによる電話の結果を、相手の発言と時刻に結びつけて報告します。日時・人数・金額を、あとからたどれます。</p><div class="olp-actions">${ext(x.primary[1], x.primary[0], 'owned-primary')}${ext(p.repo, 'コードをGitHubで読む', 'olp-link')}</div><p class="owned-action-note">${e(x.actionNote)}</p></div>`
    + `<figure class="olp-film"><p class="olp-film__tag">イメージ映像（演出を含む）· 設計画面 · 未リリース</p><div class="olp-film__screen"><video controls playsinline preload="none" poster="${FILM.poster}" width="1920" height="1080" aria-label="Oathraのイメージ映像（30秒・音声なし・演出を含む）"><source src="${FILM.src}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video></div><figcaption>30秒・音声なし・押したときだけ再生。紹介のために作ったイメージ映像です。映像の中の画面はこれから作るアプリの設計で、現行のOathraにはまだありません。</figcaption></figure></section>`;
}

function ringSection() {
  const cards = [
    ['まず、確認する項目を決める', '日付・時刻・人数なら、輪を3つに区切ります。', 0, ''],
    ['相手が答えた項目を閉じる', '根拠になった相手の発言と、その開始・終了時刻を記録します。', 1, ' is-closed'],
    ['AIの言葉では閉じない', 'AIが「予約できました」と言っても、判定には数えません。', 1, ' is-open']
  ];
  return `<section class="container olp-ring" id="ring" aria-labelledby="olp-ring-title"><div class="olp-head"><p class="owned-kicker">01 · 輪のしくみ</p><h2 id="olp-ring-title">相手の言葉でだけ、<br>輪が閉じる。</h2><p>日時や人数がそろっていても、AIが言っただけでは確認済みにしません。その判定の考え方を、輪で表しています。</p></div><div class="olp-ring__body"><figure class="olp-ring__figure"><span class="olp-ring__eyebrow">CONFIRMED IN THEIR WORDS</span>${ring(3)}<figcaption>日付・時刻・人数の3項目が、相手の言葉で確認済み</figcaption></figure><ol class="olp-ring__cards">${cards.map(([t, b, count, cls], i) => `<li class="olp-ring__card${cls}"><div class="olp-ring__state" aria-hidden="true">${ring(count)}</div><div class="olp-ring__explanation"><span class="olp-ring__index">0${i + 1} / ${count === 0 ? '確認前' : i === 1 ? '相手が確認' : 'AIの発言'}</span><strong>${e(t)}</strong><span>${e(b)}</span></div></li>`).join('')}</ol></div><p class="olp-note">緑の区切りは、相手の言葉で確認できた項目です。店舗システムに登録されたことまでは示しません。</p></section>`;
}

export function conceptDemosSection(p) {
  if (!Array.isArray(p.conceptDemos) || p.conceptDemos.length !== 3) throw new Error('Oathra LP: expected three concept demos');
  return `<section class="container olp-demos" id="concept-demos" aria-labelledby="olp-demos-title"><div class="olp-head"><p class="owned-kicker">OATHRA / RINGZERO · 操作できる構想デモ</p><h2 id="olp-demos-title">電話を頼む前に、<br>ひとつ、試してみる。</h2><p>条件を決める。任せる範囲を承認する。相手の返答と結果を確かめる。3つの用件を、ブラウザーで操作できます。</p><p class="olp-demos__notice"><strong>${CONCEPT_DISCLAIMER}</strong><span>合成データ・架空の店舗、電話番号、予約番号のみ。料金・購入義務も発生しません。</span></p></div><div class="olp-demos__list">${p.conceptDemos.map((demo, i) => `<article class="olp-demo" aria-labelledby="olp-demo-${e(demo.id)}"><div class="olp-demo__copy"><p class="olp-demo__index">0${i + 1} / ${i === 0 ? '飲食店予約' : i === 1 ? '在庫と取り置き' : '予約の時間変更'}</p><h3 id="olp-demo-${e(demo.id)}">${e(demo.title)}</h3><p>${e(demo.body)}</p>${ext(demo.href, demo.linkLabel, 'olp-demo__action')}</div><figure class="olp-demo__film"><video controls playsinline preload="none" poster="${e(demo.poster)}" width="1440" height="900" aria-label="${e(demo.title)} 構想デモの操作動画・日本語字幕・音声なし"><source src="${e(demo.src)}" type="video/mp4">このブラウザーでは動画を再生できません。${ext(demo.src, '動画ファイルを開く')}</video><figcaption><strong>${CONCEPT_DISCLAIMER}</strong><span>${demo.durationSeconds}秒 · 操作できるデモUIの連続収録 · 日本語字幕 · 音声なし</span>${ext(demo.src, '動画ファイルを開く', 'olp-demo__file')}<details class="olp-demo__text"><summary>操作の流れをテキストで読む</summary><ol>${demo.steps.map(step => `<li>${e(step)}</li>`).join('')}</ol><p><strong>動画の結果：</strong>${e(demo.result)}</p><p>すべて架空データによる模擬の結果です。実際の発信・予約・購入は行いません。</p></details></figcaption></figure></article>`).join('')}</div><p class="olp-note">動画と操作画面は、合成の相手応答を使うシミュレーションです。下の従来の設計映像・判定記録とは別のデモで、実電話や店舗システムへの登録を検証したものではありません。条件外の費用、不通、拒否、曖昧な返答は、成功と分けて扱います。</p></section>`;
}

function stepsSection(prototypeLink) {
  return `<section class="container olp-steps" id="steps" aria-labelledby="olp-steps-title"><div class="olp-head"><p class="owned-kicker">02 · 頼んでから報告まで</p><h2 id="olp-steps-title">電話の前後に、<br>確認したいこと。</h2><p>相手、用件、費用を見てから発信し、終わったら報告を読む。その流れを考えた、これから作るアプリの設計画面です。4枚は上のイメージ映像から切り出しています。現行のOathra（CLIとシミュレーター）には、この画面はまだありません。</p></div><ol class="olp-steps__list">${STEPS.map((s, i) => `<li class="olp-steps__item"><figure><a href="${s.src}"><img src="${s.src}" width="1600" height="900" loading="lazy" decoding="async" alt="${e(s.alt)}"></a><figcaption><span class="olp-label">開発中の画面 · 未リリース</span><strong>${i + 1}. ${e(s.title)}</strong><span>${e(s.body)}</span></figcaption></figure></li>`).join('')}</ol><p class="olp-note">別公開の設計動画は、次のUIを考えるためのプレビューです。現行製品の実演や、新UIの実装完了を示すものではありません。 ${prototypeLink}</p></section>`;
}

function delegationSection() {
  const cols = [
    ['ok', '○ AIが決めてよい', '例：時間は第一希望から2時間以内'],
    ['hold', '△ 決めずに持ち帰る', '例：コースや前金が必要と言われた'],
    ['no', '✕ しない', '支払いの約束、AIであることを隠す']
  ];
  return `<section class="container olp-trust" id="trust" aria-labelledby="olp-trust-title"><div class="olp-head"><p class="owned-kicker">03 · 任せる範囲と承認</p><h2 id="olp-trust-title">任せていいのは、<br>ここまで。</h2><p class="olp-label olp-label--block">設計 · 実電話フローには未実装</p><p>従来の設計案です。実電話フローには、この3段階の指定、発信前の承認、費用の上限による打ち切り、着信の応対はまだありません。上の操作できる構想デモでは、承認と条件の確認をシミュレーション内で試せます。</p></div><div class="olp-trust__cols">${cols.map(([k, t, b]) => `<div class="olp-trust__col olp-trust__col--${k}"><strong>${e(t)}</strong><span>${e(b)}</span></div>`).join('')}</div><p class="olp-note">設計では、本番の電話は毎回承認が必要で、この設定は外せません。費用は1回ごとの上限つきです。電話がかかってきたときは、AIが用件だけを聞きます。</p></section>`;
}

function recordingsSection(p, heroFilm, film15) {
  const figure15 = outer(film15, '<figure class="rm-film15__figure"', '15-second film figure');
  const note15 = outer(film15, '<p class="rm-film15__note"', '15-second film note');
  return `<section class="container olp-rec" id="recordings" aria-labelledby="film15-oathra-title"><div class="olp-head"><p class="owned-kicker">04 · 実録画</p><h2 id="film15-oathra-title">どの一言で、<br>確定と判断したのか。</h2><p>現行版で確認できる判定の流れを、実録画と紹介映像でご覧ください。</p></div><div class="olp-rec__grid"><div class="olp-rec__item"><p class="olp-rec__kicker">判定画面 · 約13秒の実録画</p><p class="olp-note olp-rec__lead">最初に出るのは、判定の流れを説明する再現です。「実録画を見る」で、13秒の実録画に切り替わります。</p>${heroFilm}</div><div class="olp-rec__item" data-film15="oathra"><p class="olp-rec__kicker">15秒の紹介映像</p>${figure15}${note15}</div></div><p class="olp-note">${ext(p.repo, 'コードと記録をGitHubで見る')}</p></section>`;
}

function statusSection(p, source, access) {
  const [ms, speech, license] = p.ja.highlights;
  const rows = [
    ['現在できること', [`会話上の合意の判定 — ${speech.label}`, `根拠の区間の記録 — ${ms.label}`, `${license.value} — 開発者向けに、${license.label}`]],
    ['設定・費用が必要', ['実際の電話（設定と費用が必要）']],
    ['対象外・検証前', ['店舗システムへの登録', '100件の実電話検証']]
  ];
  return `<section class="container olp-status" id="status" aria-labelledby="olp-status-title"><div class="olp-head"><p class="owned-kicker">05 · 現在地</p><h2 id="olp-status-title">会話の合意と、<br>予約の登録は別です。</h2></div><div class="olp-status__table" role="table" aria-label="Oathraの現在地">${rows.map(([h, items]) => `<div class="olp-status__col" role="rowgroup"><p class="olp-status__head" role="columnheader">${e(h)}</p><ul role="row">${items.map(i => `<li role="cell">${e(i)}</li>`).join('')}</ul></div>`).join('')}</div><div class="olp-status__detail">${access}<p>${e(p.ja.proof)}</p>${ext(p.evidence, '検証資料を見る')}</div>${source}</section>`;
}

export function refineOathraLp(html, products = ledgerProducts) {
  if (html.includes(`data-oathra-lp="${OATHRA_LP_VERSION}"`)) return html;
  if (!/<html lang="ja">/.test(html) || !html.includes('data-product-id="oathra"')) throw new Error('Oathra LP: not the Japanese Oathra page');
  const p = oathra(products), x = landingExperience.oathra.ja;
  const mainStart = html.indexOf('<main id="main">'), mainEnd = html.lastIndexOf('</main>');
  if (mainStart < 0 || mainEnd < mainStart || html.indexOf('<main id="main">', mainStart + 1) >= 0) throw new Error('Oathra LP: expected one <main id="main">');
  const main = html.slice(mainStart, mainEnd);
  const heroFilm = outer(main, '<figure class="owned-film owned-film--hero"', 'hero recording');
  const film15 = outer(main, '<section class="container rm-film15 rm-film15--oathra"', '15-second film section');
  const start = outer(main, '<section class="container owned-start" id="start">', 'start section');
  const consult = outer(main, '<section class="container owned-consult">', 'consult section');
  const related = outer(main, '<section class="container studio-related">', 'related products');
  const footer = outer(main, '<footer class="container owned-footer">', 'footer');
  const source = outer(main, '<p class="owned-features__source">', 'source line');
  const tryNow = outer(main, '<p class="owned-try-now">', 'try-now line');
  const access = outer(main, '<details class="owned-access">', 'access conditions');
  const boundaries = outer(main, '<section class="container owned-boundaries">', 'boundaries');
  const prototypeLink = boundaries.match(/<a [^>]*href="https:\/\/forifor\.github\.io\/Launchloom\/design\/index\.html\?product=oathra"[^>]*>[\s\S]*?<\/a>/);
  if (!prototypeLink) throw new Error('Oathra LP: expected the design-study link');
  const startWithTry = start.replace('</div><div class="owned-start__actions">', `${tryNow}</div><div class="owned-start__actions">`);
  if (startWithTry === start) throw new Error('Oathra LP: expected the start actions');
  const composed = `<main id="main">${hero(p, x)}${conceptDemosSection(p)}${ringSection()}${stepsSection(prototypeLink[0])}${delegationSection()}${recordingsSection(p, heroFilm, film15)}${statusSection(p, source, access.replace('<details class="owned-access">', '<details class="owned-access" open>').replace(`>${e(p.ja.license)} · `, '>'))}${startWithTry}${consult}${related}${footer}`;
  let out = html.slice(0, mainStart) + composed + html.slice(mainEnd);
  out = out.replace('<body ', `<body data-oathra-lp="${OATHRA_LP_VERSION}" `);
  // Header links follow the new sections.
  out = out.replace('href="#features">機能</a>', 'href="#ring">しくみ</a>').replace('href="#flow">流れ</a>', 'href="#steps">流れ</a>');
  if ((out.match(/<h1[\s>]/g) || []).length !== 1) throw new Error('Oathra LP: expected one h1');
  return out;
}

export async function writeOathraLp(dist, products = ledgerProducts) {
  for (const asset of [FILM.src, FILM.poster, ...STEPS.map(s => s.src), ...oathra(products).conceptDemos.flatMap(demo => [demo.src, demo.poster])]) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Oathra LP: missing ${asset}`); });
  const file = path.join(dist, PAGE);
  await fs.writeFile(file, refineOathraLp(await fs.readFile(file, 'utf8'), products));
  const assets = path.join(dist, 'assets');
  const [css, layer] = await Promise.all(['showcase.css', 'oathra-lp.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-oathra-lp]')) throw new Error('Oathra LP stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CSS_MARK)[0].trimEnd() + `\n${CSS_MARK}\n${layer}`);
}
