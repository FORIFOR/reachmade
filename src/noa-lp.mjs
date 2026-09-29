/**
 * Japanese 夜澄ノア page, from the owner's patch 「夜澄ノア自己紹介PV制作」 (2026-09-29, products/noa/index.html).
 *
 * The delivered page is plain HTML with inline styles. This site's CSP is style-src 'self', so inline styles
 * would not render in production; the patch asks for classes and markup to follow the site. The copy below is
 * the delivered copy, unchanged, in the delivered order:
 *   1 first view (#recording)   2 the path of one comment (#flow)   3 main features (#features)
 *   4 what actually went wrong (#bug)   5 where to watch (#watch)   6 where it stands   7 consult (existing)
 *
 * The first-view still (15 stacked image parts) is replaced, at the owner's request (2026-09-29), by the introduction
 * film 「Jev Studio LP Video.mp4」. The film states that its studio screens recreate the rc.6 layout and that its
 * comments are examples; the caption says the same, and that it is not a recording of a live stream.
 * The video links still point to the channel top, as delivered, until the videos are published.
 *
 * Checked against Jev_VTuber_Studio (private) origin/main a6aa1b7 and release/rc6-voice on 2026-09-29: sections
 * 1–3 and 6 are implemented or documented there. Section 4 is not recorded in the repository, and chapter 4 of
 * the supplied explainer describes the fix differently; it is kept as delivered and reported to the owner.
 *
 * Idempotent and fail closed, like the Oathra page: a missing piece stops the build.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {products as ledgerProducts} from './products.mjs';

export const NOA_LP_VERSION = '20260929-noa-lp-1';
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
<p class="nlp-sub">返事も、声も、表情も。別々の仕組みを、ひとりに。</p>
<h1>コメントを、声と表情に<span class="nlp-dot">。</span></h1>
<p class="nlp-lead">夜澄ノアは、配信のコメントを受けて、返事を決め、声にして、表情を動かすAIキャラクター。返事・声・見た目はそれぞれ別の仕組みで、その間をつなぐ部分を自作しています。</p>
<div class="nlp-actions">${ext(CHANNEL, `配信を見る（YouTube）${arrowOut}`, 'owned-primary')}<a class="nlp-secondary" href="#watch">5:48の解説を見る${arrow}</a></div>
<p class="owned-action-note">ソースは公開していません。配信とYouTubeの動画で、実際の動きを確かめられます。</p>
<ul class="nlp-points"><li><strong>コードで先に整理</strong><span>重複・古いコメントはAIに渡す前に落とす</span></li><li><strong>声はコハク</strong><span>AivisSpeechの既存音声。専用学習はしていない</span></li><li><strong>画像の重ね描画</strong><span>口・目・視線を声の再生に合わせて動かす</span></li></ul>
</div><figure class="nlp-film"><p class="nlp-film__tag">Jev VTuber Studio / 紹介映像（約35秒・無音・画面は再現・演出を含む）</p><div class="nlp-film__screen"><video controls muted playsinline preload="none" poster="${FILM.poster}" width="1920" height="1080" aria-label="夜澄ノアとJev VTuber Studioの紹介映像（無音・画面は再現）"><source src="${FILM.src}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video></div><figcaption>紹介用に作った映像です。スタジオの画面はrc.6の画面構成を再現したもので、コメントと返事は例です。配信の実録画ではありません。動いている様子は配信と解説動画で確認できます。</figcaption></figure></section>`;

const FLOW = [
  ['01 / 返事', 'Jevが判定して、返事を決める', '重複や古いコメントはコードで除外。数値やゲーム名など間違えやすい答えは、決まった文に正しい値を入れて返します。'],
  ['02 / 声', 'コハクの声で読み上げる', 'AivisSpeechの「コハク」を手元のPCで動かしています。ノア専用に声を学習させたものではありません。'],
  ['03 / 見た目', '画像を重ねて、表情を動かす', '口・目・視線のパーツを声の再生に合わせて切り替えます。6種類の演出も、AIを追加で呼ばずに出しています。']
];
const flow = () => `<section class="nlp-band" id="flow"><div class="container nlp-stack"><p class="nlp-label">ひとつのコメントが通る道</p><h2>コメント → 判定 → 声・表情</h2><ol class="nlp-flow">${FLOW.map(([k, h, b]) => `<li><span class="nlp-code">${k}</span><h3>${h}</h3><p>${b}</p></li>`).join('')}</ol></div></section>`;

const FEATURES = [
  ['F-01 / JUDGE', 'AIに渡す前に、コードで整理', '同じ内容のコメントや、時間が経ったコメントは返事の対象から外します。決まった答えがある質問は、AIに作文させません。', ['重複の除外', '決まった文に値を入れる']],
  ['F-02 / VOICE', '手元のPCで声を作る', 'AivisSpeechの「コハク」で読み上げます。音声合成に1回ごとの料金はかかりませんが、会話AIの利用料とPCの電力はかかります。', ['AivisSpeech', '専用学習なし']],
  ['F-03 / FACE', '声に合わせて、口と目が動く', '口の形4種・まばたき・視線を、再生中の音量に合わせて切り替えます。演出6種類は返事の内容から選び、AIの追加呼び出しはしません。', ['画像パーツ22枚', '演出6種類']]
];
const features = () => `<section class="container nlp-section" id="features"><div class="nlp-head"><p class="nlp-label">主な機能</p><h2>配信で動いている、<br>主な仕組み。</h2></div><div class="nlp-features">${FEATURES.map(([c, h, b, tags]) => `<article><span class="nlp-code">${c}</span><h3>${h}</h3><p>${b}</p><ul class="nlp-tags">${tags.map(t => `<li>${t}</li>`).join('')}</ul></article>`).join('')}</div></section>`;

const bug = () => `<section class="nlp-dark" id="bug"><div class="container nlp-bug"><div class="nlp-stack"><p class="nlp-label">実際に困ったこと</p><h2>質問されていないのに、<br>答え合わせをしていた。</h2><p>ただの感想コメントにも「正解チェック」が走り、返事が遅れたり、的外れな訂正が入ったりしていました。見た目では気づきにくい不具合です。</p></div><dl class="nlp-bug__list"><div><dt>起きたこと</dt><dd>すべてのコメントを「質問」として扱い、答え合わせをしていた</dd></div><div><dt>直したこと</dt><dd>先に「質問かどうか」を判定し、質問のときだけ確認を通すようにした</dd></div><div><dt>残る課題</dt><dd>質問かどうかの判定自体を間違えることはある。解説動画の第4章で、この経緯を見せています</dd></div></dl></div></section>`;

const WATCH = [
  ['LIVE · 配信', 'YouTubeチャンネル', '実際の配信。コメントへの返事はその場で作られます。'],
  ['5:48 · 解説（演出を含む）', '私の中身、見せます。', 'ひとつのコメントが返事・声・表情になるまでを、6章で説明します。'],
  ['0:30 · 自己紹介PV（演出を含む）', '夜澄ノア 自己紹介', '声と口の動きは、実際の読み上げ音声に合わせています。']
];
const watch = () => `<section class="container nlp-section" id="watch"><div class="nlp-head"><p class="nlp-label">見る</p><h2>動いているところは、<br>配信と動画で。</h2></div><div class="nlp-watch">${WATCH.map(([k, h, b]) => ext(CHANNEL, `<span class="nlp-code">${k}</span><strong>${h}${arrowOut}</strong><span>${b}</span>`)).join('')}</div><p class="nlp-note">※ 動画のリンクは現在チャンネルのトップを指しています。公開後に各動画のURLに差し替えます。</p></section>`;

const status = () => `<section class="container nlp-section nlp-status" id="status"><div class="nlp-head"><p class="nlp-label">現在地</p><h2>できることと、まだ言わないこと。</h2></div><div class="nlp-status__cols"><div><h3>いま動いていること</h3><ul><li>YouTubeで配信中。コメントに声と表情で返事をする</li><li>重複・古いコメントの除外、決まった答えの差し込み</li><li>声に合わせた口・目・視線と、6種類の演出</li></ul></div><div><h3>まだ言わないこと</h3><ul><li>不適切な返事を絶対に出さない、とは言えません</li><li>配信の通し運転を記録した実録画は、まだ公開していません</li><li>無料で動くわけではありません。会話AIの利用料と電力がかかります</li></ul></div></div><p class="nlp-terms"><strong>動作条件・ライセンス</strong><span>ソース非公開 · 声：AivisSpeech「コハク」（オズチャット）· 各素材は配布元の規約に従って使用</span></p></section>`;

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
  if (!/<html lang="ja">/.test(html) || !html.includes('data-product-id="noa"')) throw new Error('Noa LP: not the Japanese 夜澄ノア page');
  const p = products.find(q => q.id === 'noa');
  if (!p || !p.closedSource || p.repo !== null) throw new Error('Noa LP: the ledger must mark 夜澄ノア as closed source');
  const mainStart = html.indexOf('<main id="main">'), mainEnd = html.lastIndexOf('</main>');
  if (mainStart < 0 || mainEnd < mainStart || html.indexOf('<main id="main">', mainStart + 1) >= 0) throw new Error('Noa LP: expected one <main id="main">');
  const main = html.slice(mainStart, mainEnd);
  const consult = outer(main, '<section class="container owned-consult">', 'consult section');
  const related = outer(main, '<section class="container studio-related">', 'related products');
  outer(main, '<footer class="container owned-footer">', 'footer');
  const composed = `<main id="main">${hero()}${flow()}${features()}${bug()}${watch()}${status()}${consult}${related}${footer()}`;
  let out = html.slice(0, mainStart) + composed + html.slice(mainEnd);
  out = out.replace('<body ', `<body data-noa-lp="${NOA_LP_VERSION}" `);
  // Header links follow the delivered page: 実演 · 流れ · 機能 · 不具合の記録 · 見る (English stays).
  const nav = '<a href="#recording">実演</a><a href="#features">機能</a><a href="#flow">流れ</a><a href="#start">試す</a>';
  if (!out.includes(nav)) throw new Error('Noa LP: expected the product header links');
  out = out.replace(nav, '<a href="#recording">実演</a><a href="#flow">流れ</a><a href="#features">機能</a><a href="#bug">不具合の記録</a><a href="#watch">見る</a>');
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
