/**
 * Japanese 星藍ノア page, from the owner's patch 「夜澄ノア自己紹介PV制作」 (2026-09-29, products/noa/index.html).
 *
 * The delivered page is plain HTML with inline styles. This site's CSP is style-src 'self', so inline styles
 * would not render in production; the patch asks for classes and markup to follow the site. The copy below
 * preserves the documented claims. The opening invites viewers to the stream;
 * implementation details are grouped in the features section:
 *   1 first view (#recording)   2 the path of one comment (#flow)   3 main features (#features)
 *   4 where to watch (#watch)   5 where it stands   6 consult (existing)
 *
 * The first-view still (15 stacked image parts) is replaced, at the owner's request (2026-09-29), by the introduction
 * film 「Jev Studio LP Video.mp4」. The film states that its studio screens recreate the rc.6 layout and that its
 * comments are examples; the caption says the same, and that it is not a recording of a live stream.
 * The channel and individual public videos are linked. Gameplay is labelled as an edited test recording;
 * the explainer and introduction remain distinct from a full live-run record.
 *
 * Checked against Jev_VTuber_Studio (private) origin/main a6aa1b7 and release/rc6-voice on 2026-09-29.
 * 2026-10-02: removed the supplied bug-fix anecdote: the repository did not substantiate it and the supplied
 * explainer described the fix differently. Do not restore it as a verified event without matching evidence.
 *
 * Idempotent and fail closed, like the Oathra page: a missing piece stops the build.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {products as ledgerProducts} from './products.mjs';
import {noaVideos} from './noa-videos.mjs';

export const NOA_LP_VERSION = '20261004-noa-watch-links-1';
const CSS_MARK = '/* REACHMADE_NOA_LP */';
const PAGE = 'products/noa/index.html';
export const CHANNEL = 'https://youtube.com/channel/UCjX52bV1kfUgSuqf3vv_rTQ';
export const FILM = Object.freeze({src: '/media/originals/noa/lp-film.mp4', poster: '/assets/products/noa/lp-film-poster.jpg'});
const e = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ext = (href, inner, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${e(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
const arrowOut = ' <span aria-hidden="true">↗</span>';
const arrow = ' <span aria-hidden="true">→</span>';

const hero = () => `<section class="container nlp-hero" id="recording"><div class="nlp-hero__copy">
<p class="nlp-kicker">07 / CHARACTER &amp; LIVE / <span class="nlp-live"><span aria-hidden="true"></span>配信中</span></p>
<p class="nlp-sub">星藍ノア / ゲームも会話も楽しむAIキャラクター</p>
<h1><span>プレイ中も、</span><span>話しかけて<span class="nlp-dot">。</span></span></h1>
<p class="nlp-lead">ゲームを進めながら、コメントには声と表情で返事。星藍ノアは、プレイとおしゃべりをいっしょに届けるAIキャラクターです。観ているあなたも、ひとことどうぞ。</p>
<div class="nlp-actions">${ext(CHANNEL, `配信を見る（YouTube）${arrowOut}`, 'owned-primary')}<a class="nlp-secondary" href="#watch">配信と動画の案内${arrow}</a></div>
<p class="owned-action-note">YouTubeチャンネルを開きます。配信と動画の一覧から選んでご覧ください。</p>
</div><figure class="nlp-film"><div class="nlp-film__identity"><span class="nlp-film__name">星藍ノア</span><span class="nlp-film__edition">CHARACTER &amp; LIVE<br>Jev VTuber Studio</span></div><p class="nlp-film__tag">Jev VTuber Studio / 紹介映像（約35秒・無音・画面は再現・演出を含む）</p><div class="nlp-film__screen"><video controls muted playsinline preload="none" poster="${FILM.poster}" width="1920" height="1080" aria-label="星藍ノアとJev VTuber Studioの紹介映像（無音・画面は再現）"><source src="${FILM.src}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video></div><figcaption>紹介用に作った映像です。スタジオの画面はrc.6の画面構成を再現したもので、コメントと返事は例です。配信の実録画ではありません。動いている様子は配信と解説動画で確認できます。</figcaption></figure>
<ul class="nlp-points"><li><span class="nlp-point-index" aria-hidden="true">01</span><div><strong>ゲームも、会話も</strong><span>プレイ中のノアに、コメントで話しかける</span></div></li><li><span class="nlp-point-index" aria-hidden="true">02</span><div><strong>映像で知る</strong><span>このページの35秒の紹介映像。画面は再現</span></div></li><li><span class="nlp-point-index" aria-hidden="true">03</span><div><strong>裏側ものぞく</strong><span>ゲーム操作と返事を両立する仕組みを、この先で紹介</span></div></li></ul></section>`;

const FLOW = [
  ['01 / コメント', 'プレイ中に、ひとこと。', 'ゲームを見ながら、YouTubeのコメントでノアに話しかけられます。'],
  ['02 / 返事', '返事は、声で。', 'コメントへの返事はその場で作られ、声で読み上げられます。'],
  ['03 / 表情', '口も、目も、動きます。', '声の再生に合わせて、口の形・まばたき・視線が変わります。']
];
const flow = () => `<section class="nlp-band" id="flow"><div class="container nlp-stack"><div class="nlp-flow__heading"><p class="nlp-label">配信で起きること</p><h2>プレイのそばで、会話が続く。</h2></div><ol class="nlp-flow">${FLOW.map(([k, h, b]) => `<li><span class="nlp-code">${k}</span><h3>${h}</h3><p>${b}</p></li>`).join('')}</ol></div></section>`;

const FEATURES = [
  ['F-01 / GAME &amp; CHAT', '操作することと、話すことを分ける', 'ゲームを動かす処理と、コメントに返事をする処理は別々。プレイを進めながら、ゲームの状況に合わせて実況や返事の順番を調整します。重複したコメントや古いコメントを除き、決まった答えがある質問には用意した文で答えます。', ['ゲーム操作と会話を分離', 'NOA BLOCKS', 'Vampire Survivors']],
  ['F-02 / VOICE', '声は、配信用のPCから', 'AivisSpeechの既存音声「コハク」で読み上げます。ノア専用の学習はしていません。音声合成に1回ごとの料金はかかりませんが、会話AIの利用料とPCの電力はかかります。', ['AivisSpeech', '専用学習なし']],
  ['F-03 / FACE', '声に合わせて、口と目が動く', '口の形4種・まばたき・視線を、再生中の音量に合わせて切り替えます。演出6種類は返事の内容から選び、AIの追加呼び出しはしません。', ['画像パーツ22枚', '演出6種類']]
];
const features = () => `<section class="container nlp-section nlp-feature-section" id="features"><div class="nlp-head"><p class="nlp-label">配信の裏側</p><h2>プレイと会話を支える、<br>三つの仕組み。</h2></div><div class="nlp-features">${FEATURES.map(([c, h, b, tags]) => `<article><span class="nlp-code">${c}</span><div class="nlp-feature-copy"><h3>${h}</h3><p>${b}</p><ul class="nlp-tags">${tags.map(t => `<li>${t}</li>`).join('')}</ul></div></article>`).join('')}</div></section>`;

const WATCH = [
  ['4:08 · ゲームのテスト収録（編集版）', '武器選びから、反省会まで。', 'Vampire Survivorsのテスト収録から、会話・武器選び・振り返りをまとめた編集版。待ち時間をカットしています。', noaVideos.gameplay],
  ['5:49 · 解説（演出を含む）', '返答・声・表情の仕組み。', 'コメントが返事になるまでと、会話モデル・音声合成・表情の役割分担を紹介します。', noaVideos.explainer],
  ['0:34 · 自己紹介PV（演出を含む）', 'はじめまして、星藍ノアです。', 'ノアの自己紹介映像。ゲームや雑談を楽しむキャラクターを紹介します。', noaVideos.introduction]
];
const watch = () => `<section class="container nlp-section nlp-watch-section" id="watch"><div class="nlp-head"><p class="nlp-label">見る</p><h2>動画で見る、<br>ノアの動きとつくり方。</h2></div><div class="nlp-watch">${WATCH.map(([k, h, b, href]) => {
  const content = `<span class="nlp-code">${k}</span><strong>${h}</strong><span class="nlp-watch__description">${b}</span>`;
  return ext(href, `${content}<span class="nlp-watch__arrow" aria-hidden="true">↗</span>`);
}).join('')}</div><p class="nlp-note">それぞれの動画をYouTubeで開きます。ゲーム動画は待ち時間をカットしたテスト収録で、配信の通し運転の実録画ではありません。</p><p class="nlp-note">${ext(noaVideos.judgementShort, `28秒で、ゲーム中の3つの判断を見る${arrowOut}`)} · ${ext(CHANNEL, `チャンネルの動画一覧を見る${arrowOut}`)}</p></section>`;

const status = () => `<section class="container nlp-section nlp-status" id="status"><div class="nlp-head"><p class="nlp-label">現在地</p><h2>できることと、まだ言わないこと。</h2></div><div class="nlp-status__cols"><div><h3>いま動いていること</h3><ul><li>ゲームをプレイしながら、YouTubeのコメントに声と表情で返事をする</li><li>重複・古いコメントの除外、決まった答えの差し込み</li><li>声に合わせた口・目・視線と、6種類の演出</li></ul></div><div><h3>まだ言わないこと</h3><ul><li>不適切な返事を絶対に出さない、とは言えません</li><li>配信の通し運転を記録した実録画は、まだ公開していません</li><li>無料で動くわけではありません。会話AIの利用料と電力がかかります</li></ul></div></div><p class="nlp-terms"><strong>動作条件・ライセンス</strong><span>ソース非公開 · 声：AivisSpeech「コハク」（オズチャット）· 各素材は配布元の規約に従って使用</span></p></section>`;

const footer = () => `<footer class="container owned-footer"><p><a href="/products/">すべてのプロダクト</a>${ext(CHANNEL, `YouTube${arrowOut}`)}</p><small>Reachmade / Shuhei Horio · 配信・解説映像・静止画を区別して公開しています。</small></footer>`;

function outer(html, open, what) {
  const i = html.indexOf(open);
  if (i < 0 || html.indexOf(open, i + 1) >= 0) throw new Error(`Noa LP: expected one ${what}`);
  const tag = open.match(/^<(\w+)/)[1];
  let depth = 0;
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g');
  re.lastIndex = i;
  for (let m; (m = re.exec(html));) { depth += m[0].startsWith('</') ? -1 : 1; if (depth === 0) return html.slice(i, m.index + m[0].length); }
  throw new Error(`Noa LP: unclosed ${what}`);
}

export function refineNoaLp(html, products = ledgerProducts) {
  if (html.includes(`data-noa-lp="${NOA_LP_VERSION}"`)) return html;
  if (!/<html lang="ja">/.test(html) || !html.includes('data-product-id="noa"')) throw new Error('Noa LP: not the Japanese 星藍ノア page');
  const p = products.find(q => q.id === 'noa');
  if (!p || !p.closedSource || p.repo !== null) throw new Error('Noa LP: the ledger must mark 星藍ノア as closed source');
  const mainStart = html.indexOf('<main id="main">'), mainEnd = html.lastIndexOf('</main>');
  if (mainStart < 0 || mainEnd < mainStart || html.indexOf('<main id="main">', mainStart + 1) >= 0) throw new Error('Noa LP: expected one <main id="main">');
  const main = html.slice(mainStart, mainEnd);
  const consult = outer(main, '<section class="container owned-consult">', 'consult section');
  const related = outer(main, '<section class="container studio-related">', 'related products');
  outer(main, '<footer class="container owned-footer">', 'footer');
  const composed = `<main id="main">${hero()}${flow()}${features()}${watch()}${status()}${consult}${related}${footer()}`;
  let out = html.slice(0, mainStart) + composed + html.slice(mainEnd);
  out = out.replace('<body ', `<body data-noa-lp="${NOA_LP_VERSION}" `);
  // Header links follow the visible sections. The unsupported anecdote and its link were removed.
  const nav = '<a href="#recording">実演</a><a href="#features">機能</a><a href="#flow">流れ</a><a href="#start">試す</a>';
  if (!out.includes(nav)) throw new Error('Noa LP: expected the product header links');
  out = out.replace(nav, '<a href="#recording">実演</a><a href="#flow">流れ</a><a href="#features">機能</a><a href="#watch">見る</a>');
  if ((out.match(/<h1[\s>]/g) || []).length !== 1) throw new Error('Noa LP: expected one h1');
  if (/github\.com/i.test(out.slice(out.indexOf('<main'), out.indexOf('</main>')))) throw new Error('Noa LP: a closed-source page must not link a repository');
  return out;
}

export async function writeNoaLp(dist, products = ledgerProducts) {
  for (const asset of [FILM.src, FILM.poster]) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Noa LP: missing ${asset}`); });
  const file = path.join(dist, PAGE);
  await fs.writeFile(file, refineNoaLp(await fs.readFile(file, 'utf8'), products));
  const assets = path.join(dist, 'assets');
  const [css, layer] = await Promise.all(['showcase.css', 'noa-lp.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('[data-noa-lp]')) throw new Error('Noa LP stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CSS_MARK)[0].trimEnd() + `\n${CSS_MARK}\n${layer}`);
}
