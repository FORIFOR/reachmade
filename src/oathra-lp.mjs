/**
 * Oathra page, re-composed from the owner's design brief "Oathra LP 改善案" (2026-09-29). Japanese first; the English
 * page (2026-10-19) follows it section by section.
 *
 * Runs as the last pass on dist/products/oathra/index.html and dist/en/products/oathra/index.html and rebuilds <main>
 * in the brief's order:
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
const PAGES = Object.freeze({ja: 'products/oathra/index.html', en: 'en/products/oathra/index.html'});
const A = '/assets/products/oathra/';
export const FILM = Object.freeze({src: '/media/films/oathra-30s.mp4', poster: '/media/films/oathra-30s.jpg'});
export const STEPS = Object.freeze([
  {src: `${A}lp-step-01.jpg`, title: '用件を書く', body: '電話の相手と、頼みたいことを、ふだんの言葉で書く。', alt: '「電話を頼む」画面。相手に焼肉 たけ、依頼に10月3日（土）19時から2名の予約、任せる範囲の3列が入っている'},
  {src: `${A}lp-step-02.jpg`, title: '確認して発信', body: '相手・内容・上限の費用・記録の扱いを見て、あなたが承認するまで電話はかからない。', alt: 'AIへの指示書と「相手・頼むこと・費用を確かめました」のチェック、「この内容で電話をかける」ボタン'},
  {src: `${A}lp-step-03.jpg`, title: '会話を見守る', body: '相手が答えた項目を、その場で確認する。いつでも通話を終えられる。', alt: '通話中の画面。輪が3/3で閉じ、日付・時刻・人数の3項目が相手の言葉で確認済みになっている'},
  {src: `${A}lp-step-04.jpg`, title: '決まったことを読む', body: '頼んだ内容との違いと、あなたが引き継ぐことも報告する。', alt: '「決まりました」の報告画面。日付・時刻・人数と、それぞれの根拠の発言と時刻'}
]);
const STEPS_EN = Object.freeze([
  {title: 'Write the errand', body: 'Write who to call and what you need, in everyday words.', alt: 'The “Make a call” screen: the other party 焼肉 たけ, a request for a table for two at 19:00 on Saturday 3 October, and three columns for what to hand over'},
  {title: 'Check, then call', body: 'See the other party, the request, the cost ceiling and how the record is handled. Nothing is dialled until you approve.', alt: 'Instructions for the AI, the check “I have confirmed the other party, the request and the cost”, and the button “Call with these details”'},
  {title: 'Watch the conversation', body: 'Check each item as the other party answers it. You can end the call at any time.', alt: 'A call in progress: the ring closed at 3/3, with date, time and party size confirmed in the other party’s words'},
  {title: 'Read what was decided', body: 'The report also covers differences from what you asked for, and what you need to take over.', alt: 'The “Decided” report: date, time and party size, each with the words that support it and when they were said'}
]);
// The concept demos run in Japanese only; the English page explains them in English and says the UI is Japanese.
const CONCEPT_DEMOS_EN = Object.freeze({
  restaurant: {kind: 'Restaurant booking', title: 'Ask a nearby restaurant for a table.', body: 'Check budget, date and party size. Approve the number to call and what to tell them, then check the result of the simulated call.', linkLabel: 'Try a restaurant booking (Japanese UI)',
    result: 'Booking confirmed (simulated). No real booking was made.',
    steps: ['Pick a restaurant from synthetic nearby candidates and check budget, date and party size.', 'Approve the fictional number, what to disclose and how much of the booking to hand over.', 'On the result screen, check the replies in the simulated call and whether the booking conditions were met.']},
  stock: {kind: 'Stock and hold', title: 'Can they hold this model for me?', body: 'Check the model number, price and pickup deadline. Ask, in a simulated call, for a hold with no charge and no obligation to buy.', linkLabel: 'Try a stock check (Japanese UI)',
    result: 'Free hold confirmed (simulated): model AZ1000, ¥6,800, until the pickup deadline. No obligation to buy.',
    steps: ['Check the model number and shop from synthetic data.', 'Approve only a price ceiling, a pickup deadline and a hold with no charge or obligation to buy.', 'Run the simulated call and check the model, price, deadline and the result of the hold.']},
  modify: {kind: 'Changing a booking', title: 'Move the 7 pm booking to 8 pm.', body: 'If it cannot change, the original 7 pm stays. Check the change you asked for and the outcome separately.', linkLabel: 'Try changing a booking (Japanese UI)',
    result: 'The other party declined, so the change did not go through and the original 7 pm booking stays (simulated). Ending the call is not shown as a successful change.',
    steps: ['Check the fictional booking number and the current 7 pm booking.', 'Ask to move it to 8 pm, and approve keeping the original booking if that is not possible.', 'Read the replies in the simulated call and check the change and the original booking separately.']}
});
const e = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const ext = (href, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(label)} ${arrow}</a>`;

// Every visible string that is not a ledger fact or a moved piece, per language.
const COPY = Object.freeze({
  ja: {
    h1: '「できました」を、<br>根拠にしない。',
    lead: 'その予約、相手は何と言った？ OathraはAIによる電話の結果を、相手の発言と時刻に結びつけて報告します。日時・人数・金額を、あとからたどれます。',
    code: 'コードをGitHubで読む',
    filmTag: 'イメージ映像（演出を含む）· 設計画面 · 未リリース', filmLabel: 'Oathraのイメージ映像（30秒・音声なし・演出を含む）', fallback: 'この動画は、このブラウザーでは再生できません。',
    filmCaption: '30秒・音声なし・押したときだけ再生。紹介のために作ったイメージ映像です。映像の中の画面はこれから作るアプリの設計で、現行のOathraにはまだありません。',
    ringCards: [
      ['まず、確認する項目を決める', '日付・時刻・人数なら、輪を3つに区切ります。'],
      ['相手が答えた項目を閉じる', '根拠になった相手の発言と、その開始・終了時刻を記録します。'],
      ['AIの言葉では閉じない', 'AIが「予約できました」と言っても、判定には数えません。']
    ],
    ringStates: ['確認前', '相手が確認', 'AIの発言'],
    ringKicker: '01 · 輪のしくみ', ringTitle: '相手の言葉でだけ、<br>輪が閉じる。',
    ringLead: '日時や人数がそろっていても、AIが言っただけでは確認済みにしません。その判定の考え方を、輪で表しています。',
    ringFigure: '日付・時刻・人数の3項目が、相手の言葉で確認済み',
    ringNote: '緑の区切りは、相手の言葉で確認できた項目です。店舗システムに登録されたことまでは示しません。',
    demosKicker: 'OATHRA / RINGZERO · 操作できる構想デモ', demosTitle: '電話を頼む前に、<br>ひとつ、試してみる。',
    demosLead: '条件を決める。任せる範囲を承認する。相手の返答と結果を確かめる。3つの用件を、ブラウザーで操作できます。',
    disclaimer: CONCEPT_DISCLAIMER, demosData: '合成データ・架空の店舗、電話番号、予約番号のみ。料金・購入義務も発生しません。',
    demoKinds: ['飲食店予約', '在庫と取り置き', '予約の時間変更'],
    demoLabel: title => `${title} 構想デモの操作動画・日本語字幕・音声なし`, demoFallback: 'このブラウザーでは動画を再生できません。', demoFile: '動画ファイルを開く',
    demoMeta: s => `${s}秒 · 操作できるデモUIの連続収録 · 日本語字幕 · 音声なし`, demoSteps: '操作の流れをテキストで読む', demoResult: '動画の結果：',
    demoSimulated: 'すべて架空データによる模擬の結果です。実際の発信・予約・購入は行いません。',
    demosNote: '動画と操作画面は、合成の相手応答を使うシミュレーションです。下の従来の設計映像・判定記録とは別のデモで、実電話や店舗システムへの登録を検証したものではありません。条件外の費用、不通、拒否、曖昧な返答は、成功と分けて扱います。',
    stepsKicker: '02 · 頼んでから報告まで', stepsTitle: '電話の前後に、<br>確認したいこと。',
    stepsLead: '相手、用件、費用を見てから発信し、終わったら報告を読む。その流れを考えた、これから作るアプリの設計画面です。4枚は上のイメージ映像から切り出しています。現行のOathra（CLIとシミュレーター）には、この画面はまだありません。',
    stepsLabel: '開発中の画面 · 未リリース',
    stepsNote: '別公開の設計動画は、次のUIを考えるためのプレビューです。現行製品の実演や、新UIの実装完了を示すものではありません。',
    delegation: [
      ['ok', '○ AIが決めてよい', '例：時間は第一希望から2時間以内'],
      ['hold', '△ 決めずに持ち帰る', '例：コースや前金が必要と言われた'],
      ['no', '✕ しない', '支払いの約束、AIであることを隠す']
    ],
    trustKicker: '03 · 任せる範囲と承認', trustTitle: '任せていいのは、<br>ここまで。', trustLabel: '設計 · 実電話フローには未実装',
    trustLead: '従来の設計案です。実電話フローには、この3段階の指定、発信前の承認、費用の上限による打ち切り、着信の応対はまだありません。上の操作できる構想デモでは、承認と条件の確認をシミュレーション内で試せます。',
    trustNote: '設計では、本番の電話は毎回承認が必要で、この設定は外せません。費用は1回ごとの上限つきです。電話がかかってきたときは、AIが用件だけを聞きます。',
    recKicker: '04 · 実録画', recTitle: 'どの一言で、<br>確定と判断したのか。', recLead: '現行版で確認できる判定の流れを、実録画と紹介映像でご覧ください。',
    recItem: '判定画面 · 約13秒の実録画', recItemLead: '最初に出るのは、判定の流れを説明する再現です。「実録画を見る」で、13秒の実録画に切り替わります。',
    recFilm: '15秒の紹介映像', recCode: 'コードと記録をGitHubで見る',
    statusHeads: ['現在できること', '設定・費用が必要', '対象外・検証前'],
    statusCan: (ms, speech, license) => [`会話上の合意の判定 — ${speech.label}`, `根拠の区間の記録 — ${ms.label}`, `${license.value} — 開発者向けに、${license.label}`],
    statusSetup: ['実際の電話（設定と費用が必要）'], statusNot: ['店舗システムへの登録', '100件の実電話検証'],
    statusKicker: '05 · 現在地', statusTitle: '会話の合意と、<br>予約の登録は別です。', statusTable: 'Oathraの現在地', evidence: '検証資料を見る',
    nav: [['href="#features">機能</a>', 'href="#ring">しくみ</a>'], ['href="#flow">流れ</a>', 'href="#steps">流れ</a>']]
  },
  en: {
    h1: '“Done” is not<br>evidence.',
    lead: 'What did the other party actually say about that booking? Oathra reports the result of an AI phone call tied to the other party’s words and when they said them, so dates, party size and amounts can be traced afterwards.',
    code: 'Read the code on GitHub',
    filmTag: 'Concept film (staged) · design screens · not released', filmLabel: 'Oathra concept film (30 s, silent, staged)', fallback: 'This video cannot be played in this browser.',
    filmCaption: '30 s · silent · plays only when pressed. A concept film made for this introduction. The screens in it are designs for an app still to be built; the current Oathra does not have them yet.',
    ringCards: [
      ['First, decide what to confirm', 'For date, time and party size, the ring is split into three.'],
      ['Close each item they answer', 'Record the other party’s words that serve as evidence, with their start and end times.'],
      ['The AI’s words never close it', 'Even if the AI says “the table is booked”, it does not count toward the judgement.']
    ],
    ringStates: ['Before checking', 'Confirmed by them', 'The AI’s words'],
    ringKicker: '01 · THE RING', ringTitle: 'Only their words<br>close the ring.',
    ringLead: 'Even when the date, time and party size are all there, nothing counts as confirmed just because the AI said it. The ring shows how that judgement works.',
    ringFigure: 'Date, time and party size, all confirmed in the other party’s words',
    ringNote: 'A green segment is an item confirmed in the other party’s words. It does not show that the booking was entered in the shop’s system.',
    demosKicker: 'OATHRA / RINGZERO · INTERACTIVE CONCEPT DEMOS', demosTitle: 'Before you hand over a call,<br>try one.',
    demosLead: 'Set the conditions. Approve what you hand over. Check the reply and the result. Three errands you can operate in the browser (Japanese UI).',
    disclaimer: 'Concept demo · no real calls or bookings', demosData: 'Synthetic data and fictional shops, phone numbers and booking numbers only. No charges and no obligation to buy.',
    demoKinds: null,
    demoLabel: title => `${title} concept demo walkthrough · Japanese subtitles · silent`, demoFallback: 'This browser cannot play the video.', demoFile: 'Open the video file',
    demoMeta: s => `${s} s · continuous capture of the interactive demo UI · Japanese subtitles · silent`, demoSteps: 'Read the steps as text', demoResult: 'Result in the video: ',
    demoSimulated: 'All results are simulated with fictional data. No real calls, bookings or purchases are made.',
    demosNote: 'The videos and demo screens are simulations with synthetic replies. They are separate from the earlier design film and judgement records below, and have not been tested with real calls or entries in a shop’s system. Costs outside the conditions, no answer, refusals and unclear replies are kept apart from success.',
    stepsKicker: '02 · FROM REQUEST TO REPORT', stepsTitle: 'What you want to check,<br>before and after a call.',
    stepsLead: 'See the other party, the errand and the cost before calling; read the report when it is done. These are design screens for an app still to be built, cut from the concept film above. The current Oathra (CLI and simulator) does not have them yet.',
    stepsLabel: 'Screens in development · not released',
    stepsNote: 'The separate design film is a proposal for a future interface. It is not a demonstration of the current product or proof that the proposed UI has shipped.',
    delegation: [
      ['ok', '○ The AI may decide', 'e.g. a time within two hours of the first choice'],
      ['hold', '△ Bring it back undecided', 'e.g. they say a set menu or deposit is required'],
      ['no', '✕ Never', 'Promising payment, or hiding that it is an AI']
    ],
    trustKicker: '03 · WHAT YOU HAND OVER', trustTitle: 'This far,<br>and no further.', trustLabel: 'Design · not in the real-call flow',
    trustLead: 'An earlier design. The real-call flow does not yet have these three levels, approval before dialling, a stop at a cost ceiling, or answering incoming calls. In the interactive concept demos above, you can try approval and condition checks inside the simulation.',
    trustNote: 'In the design, every real call needs approval and this cannot be turned off. Each call has a cost ceiling. When a call comes in, the AI only takes the message.',
    recKicker: '04 · RECORDINGS', recTitle: 'Which words<br>settled it?', recLead: 'See the judgement flow you can check in the current version, in a real recording and an introduction film.',
    recItem: 'Judgement screen · ~13-second real recording', recItemLead: 'It opens on a reconstruction that explains the judgement. “Real recording” switches to the 13-second real recording.',
    recFilm: '15-second introduction film', recCode: 'See the code and records on GitHub',
    statusHeads: ['What it does now', 'Needs setup and cost', 'Out of scope / not yet verified'],
    statusCan: (ms, speech, license) => [`Judging agreement in the conversation — ${speech.label}`, `Recording the evidence span — ${ms.label}`, `${license.value} — for developers: ${license.label}`],
    statusSetup: ['Real phone calls (setup and cost required)'], statusNot: ['Entry into a shop’s booking system', 'Evaluation with 100 real calls'],
    statusKicker: '05 · WHERE IT STANDS', statusTitle: 'Agreement in a call is not<br>a booking in a system.', statusTable: 'Where Oathra stands', evidence: 'See the evidence',
    nav: [['href="#features">Features</a>', 'href="#ring">How it works</a>'], ['href="#flow">Flow</a>', 'href="#steps">Flow</a>']]
  }
});

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

function oathra(products, lang = 'ja') {
  const p = products.find(x => x.id === 'oathra');
  if (!p?.[lang]?.highlights || p[lang].highlights.length !== 3) throw new TypeError('Oathra LP: the ledger entry is missing its highlights');
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

function hero(p, x, c, lang) {
  return `<section class="container olp-hero" aria-labelledby="olp-title"><div class="olp-hero__copy"><p class="owned-kicker">${e(p.index)} / ${e(p.discipline)} / ${e(p[lang].status)}</p><h1 id="olp-title">${c.h1}</h1><p class="olp-lead">${c.lead}</p><div class="olp-actions">${ext(x.primary[1], x.primary[0], 'owned-primary')}${ext(p.repo, c.code, 'olp-link')}</div><p class="owned-action-note">${e(x.actionNote)}</p></div>`
    + `<figure class="olp-film"><p class="olp-film__tag">${c.filmTag}</p><div class="olp-film__screen"><video controls playsinline preload="none" poster="${FILM.poster}" width="1920" height="1080" aria-label="${e(c.filmLabel)}"><source src="${FILM.src}" type="video/mp4">${c.fallback}</video></div><figcaption>${c.filmCaption}</figcaption></figure></section>`;
}

function ringSection(c) {
  const cards = c.ringCards.map(([t, b], i) => [t, b, i === 0 ? 0 : 1, ['', ' is-closed', ' is-open'][i]]);
  return `<section class="container olp-ring" id="ring" aria-labelledby="olp-ring-title"><div class="olp-head"><p class="owned-kicker">${c.ringKicker}</p><h2 id="olp-ring-title">${c.ringTitle}</h2><p>${c.ringLead}</p></div><div class="olp-ring__body"><figure class="olp-ring__figure"><span class="olp-ring__eyebrow">CONFIRMED IN THEIR WORDS</span>${ring(3)}<figcaption>${c.ringFigure}</figcaption></figure><ol class="olp-ring__cards">${cards.map(([t, b, count, cls], i) => `<li class="olp-ring__card${cls}"><div class="olp-ring__state" aria-hidden="true">${ring(count)}</div><div class="olp-ring__explanation"><span class="olp-ring__index">0${i + 1} / ${c.ringStates[i]}</span><strong>${e(t)}</strong><span>${e(b)}</span></div></li>`).join('')}</ol></div><p class="olp-note">${c.ringNote}</p></section>`;
}

export function conceptDemosSection(p, lang = 'ja') {
  if (!Array.isArray(p.conceptDemos) || p.conceptDemos.length !== 3) throw new Error('Oathra LP: expected three concept demos');
  const c = COPY[lang];
  const demos = p.conceptDemos.map((demo, i) => {
    const t = lang === 'en' ? CONCEPT_DEMOS_EN[demo.id] : {...demo, kind: c.demoKinds[i]};
    if (!t) throw new Error(`Oathra LP: no English text for concept demo ${demo.id}`);
    return {...demo, ...t};
  });
  return `<section class="container olp-demos" id="concept-demos" aria-labelledby="olp-demos-title"><div class="olp-head"><p class="owned-kicker">${c.demosKicker}</p><h2 id="olp-demos-title">${c.demosTitle}</h2><p>${c.demosLead}</p><p class="olp-demos__notice"><strong>${c.disclaimer}</strong><span>${c.demosData}</span></p></div><div class="olp-demos__list">${demos.map((demo, i) => `<article class="olp-demo" aria-labelledby="olp-demo-${e(demo.id)}"><div class="olp-demo__copy"><p class="olp-demo__index">0${i + 1} / ${demo.kind}</p><h3 id="olp-demo-${e(demo.id)}">${e(demo.title)}</h3><p>${e(demo.body)}</p>${ext(demo.href, demo.linkLabel, 'olp-demo__action')}</div><figure class="olp-demo__film"><video controls playsinline preload="none" poster="${e(demo.poster)}" width="1440" height="900" aria-label="${e(c.demoLabel(demo.title))}"><source src="${e(demo.src)}" type="video/mp4">${c.demoFallback}${ext(demo.src, c.demoFile)}</video><figcaption><strong>${c.disclaimer}</strong><span>${c.demoMeta(demo.durationSeconds)}</span>${ext(demo.src, c.demoFile, 'olp-demo__file')}<details class="olp-demo__text"><summary>${c.demoSteps}</summary><ol>${demo.steps.map(step => `<li>${e(step)}</li>`).join('')}</ol><p><strong>${c.demoResult}</strong>${e(demo.result)}</p><p>${c.demoSimulated}</p></details></figcaption></figure></article>`).join('')}</div><p class="olp-note">${c.demosNote}</p></section>`;
}

function stepsSection(prototypeLink, c, lang) {
  const steps = STEPS.map((s, i) => (lang === 'en' ? {...s, ...STEPS_EN[i]} : s));
  return `<section class="container olp-steps" id="steps" aria-labelledby="olp-steps-title"><div class="olp-head"><p class="owned-kicker">${c.stepsKicker}</p><h2 id="olp-steps-title">${c.stepsTitle}</h2><p>${c.stepsLead}</p></div><ol class="olp-steps__list">${steps.map((s, i) => `<li class="olp-steps__item"><figure><a href="${s.src}"><img src="${s.src}" width="1600" height="900" loading="lazy" decoding="async" alt="${e(s.alt)}"></a><figcaption><span class="olp-label">${c.stepsLabel}</span><strong>${i + 1}. ${e(s.title)}</strong><span>${e(s.body)}</span></figcaption></figure></li>`).join('')}</ol><p class="olp-note">${c.stepsNote} ${prototypeLink}</p></section>`;
}

function delegationSection(c) {
  return `<section class="container olp-trust" id="trust" aria-labelledby="olp-trust-title"><div class="olp-head"><p class="owned-kicker">${c.trustKicker}</p><h2 id="olp-trust-title">${c.trustTitle}</h2><p class="olp-label olp-label--block">${c.trustLabel}</p><p>${c.trustLead}</p></div><div class="olp-trust__cols">${c.delegation.map(([k, t, b]) => `<div class="olp-trust__col olp-trust__col--${k}"><strong>${e(t)}</strong><span>${e(b)}</span></div>`).join('')}</div><p class="olp-note">${c.trustNote}</p></section>`;
}

function recordingsSection(p, heroFilm, film15, c) {
  const figure15 = outer(film15, '<figure class="rm-film15__figure"', '15-second film figure');
  const note15 = outer(film15, '<p class="rm-film15__note"', '15-second film note');
  return `<section class="container olp-rec" id="recordings" aria-labelledby="film15-oathra-title"><div class="olp-head"><p class="owned-kicker">${c.recKicker}</p><h2 id="film15-oathra-title">${c.recTitle}</h2><p>${c.recLead}</p></div><div class="olp-rec__grid"><div class="olp-rec__item"><p class="olp-rec__kicker">${c.recItem}</p><p class="olp-note olp-rec__lead">${c.recItemLead}</p>${heroFilm}</div><div class="olp-rec__item" data-film15="oathra"><p class="olp-rec__kicker">${c.recFilm}</p>${figure15}${note15}</div></div><p class="olp-note">${ext(p.repo, c.recCode)}</p></section>`;
}

function statusSection(p, source, access, c, lang) {
  const [ms, speech, license] = p[lang].highlights;
  const rows = [
    [c.statusHeads[0], c.statusCan(ms, speech, license)],
    [c.statusHeads[1], c.statusSetup],
    [c.statusHeads[2], c.statusNot]
  ];
  return `<section class="container olp-status" id="status" aria-labelledby="olp-status-title"><div class="olp-head"><p class="owned-kicker">${c.statusKicker}</p><h2 id="olp-status-title">${c.statusTitle}</h2></div><div class="olp-status__table" role="table" aria-label="${e(c.statusTable)}">${rows.map(([h, items]) => `<div class="olp-status__col" role="rowgroup"><p class="olp-status__head" role="columnheader">${e(h)}</p><ul role="row">${items.map(i => `<li role="cell">${e(i)}</li>`).join('')}</ul></div>`).join('')}</div><div class="olp-status__detail">${access}<p>${e(p[lang].proof)}</p>${ext(p.evidence, c.evidence)}</div>${source}</section>`;
}

export function refineOathraLp(html, products = ledgerProducts) {
  if (html.includes(`data-oathra-lp="${OATHRA_LP_VERSION}"`)) return html;
  const lang = /<html lang="(ja|en)">/.exec(html)?.[1];
  if (!lang || !html.includes('data-product-id="oathra"')) throw new Error('Oathra LP: not a Japanese or English Oathra page');
  const p = oathra(products, lang), x = landingExperience.oathra[lang], c = COPY[lang];
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
  const composed = `<main id="main">${hero(p, x, c, lang)}${conceptDemosSection(p, lang)}${ringSection(c)}${stepsSection(prototypeLink[0], c, lang)}${delegationSection(c)}${recordingsSection(p, heroFilm, film15, c)}${statusSection(p, source, access.replace('<details class="owned-access">', '<details class="owned-access" open>').replace(`>${e(p[lang].license)} · `, '>'), c, lang)}${startWithTry}${consult}${related}${footer}`;
  let out = html.slice(0, mainStart) + composed + html.slice(mainEnd);
  out = out.replace('<body ', `<body data-oathra-lp="${OATHRA_LP_VERSION}" `);
  // Header links follow the new sections.
  for (const [from, to] of c.nav) out = out.replace(from, to);
  if ((out.match(/<h1[\s>]/g) || []).length !== 1) throw new Error('Oathra LP: expected one h1');
  return out;
}

export async function writeOathraLp(dist, products = ledgerProducts) {
  for (const asset of [FILM.src, FILM.poster, ...STEPS.map(s => s.src), ...oathra(products).conceptDemos.flatMap(demo => [demo.src, demo.poster])]) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Oathra LP: missing ${asset}`); });
  for (const page of Object.values(PAGES)) {
    const file = path.join(dist, page);
    await fs.writeFile(file, refineOathraLp(await fs.readFile(file, 'utf8'), products));
  }
  const assets = path.join(dist, 'assets');
  const [css, layer] = await Promise.all(['showcase.css', 'oathra-lp.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-oathra-lp]')) throw new Error('Oathra LP stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CSS_MARK)[0].trimEnd() + `\n${CSS_MARK}\n${layer}`);
}
