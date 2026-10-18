/** Short introduction films (Genie 30 s, Oathra 15 s): one film each on the Genie and Oathra pages, in both languages.
 * The films carry Japanese on-screen text (and Oathra's call audio is Japanese), so the English placement says so.
 * (The Japanese home offers the same two films inside its product stage — see home-v4.mjs.) They are edited films with motion graphics,
 * so every placement says so beside the player, and says which parts are real. Native controls
 * only: nothing autoplays, nothing downloads before a press, and the page needs no script. */
import fs from 'node:fs/promises';
import path from 'node:path';

const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MARK = '/* fifteen-second films */';
const SECTION = 'data-film15';

export const FILMS = Object.freeze({
  // Owner-supplied 「Genie Film 30s.mp4」 (2026-10-04, sha256 b3e777de…27ed, silent), re-encoded for the web. Its frames
  // label themselves: the first half 「現行製品・再現イメージ」, the rest 「次のUI・設計プレビュー（未実装）」. It replaces the
  // earlier 15-second film whose burned-in caption called the Codex-finished HTML "Genie-generated".
  genie: Object.freeze({
    page: 'products/genie/index.html',
    before: '<section class="container owned-flow" id="flow"',
    src: '/media/films/genie-30s.mp4',
    poster: '/media/films/genie-30s.jpg',
    label: 'Genieの30秒紹介映像',
    audio: '音声なし',
    meta: '30秒 · 音声なし · 押したときだけ再生 · 再現イメージと設計プレビューを含む紹介映像',
    kicker: '30秒の紹介映像',
    title: ['呼び出して、頼んで、', '結果を受け取るまで。'],
    note: '紹介のために作った映像です。前半は現行製品の操作を再現したイメージで、「ここからは、次のUIの設計です」以降は次のUIの設計プレビューです。設計プレビューの機能はまだ実装されていません。どちらも実アプリの録画ではなく、メモやページの内容は架空の例です。',
    en: Object.freeze({
      page: 'en/products/genie/index.html',
      label: 'Genie 30-second introduction film',
      audio: 'silent',
      meta: '30 s · silent · plays only when pressed · Japanese on-screen text · includes a reconstruction and a design preview',
      kicker: '30-second introduction film',
      title: ['Call it up, ask,', 'and get the result back.'],
      note: 'A film made to introduce Genie. The first half is a reconstruction of the current product; from “ここからは、次のUIの設計です” (“from here, the next UI design”) it is a design preview of the next UI, whose features are not built yet. Neither part is a recording of the real app, and the notes and pages shown are fictional examples.',
      fallback: 'This video cannot be played in this browser.',
    }),
  }),
  oathra: Object.freeze({
    page: 'products/oathra/index.html',
    before: '<section class="container owned-flow" id="flow"',
    src: '/media/films/oathra-15s.mp4',
    poster: '/media/films/oathra-15s.jpg',
    label: 'Oathraの15秒紹介映像',
    audio: '音声あり',
    meta: '15秒 · 音声あり · 押したときだけ再生 · 演出を含む編集映像',
    kicker: '15秒の紹介映像',
    title: ['一本の電話と、', '確定を決めた一言。'],
    note: '公開シミュレーター（ホテル・リンゴ）との通話記録から、音声を自然な間で切り出して編集した映像です。再生速度は変えていません。画面の時刻は、この動画の再生位置です。',
    en: Object.freeze({
      page: 'en/products/oathra/index.html',
      label: 'Oathra 15-second introduction film',
      audio: 'with Japanese audio',
      meta: '15 s · Japanese audio · plays only when pressed · edited film with staging',
      kicker: '15-second introduction film',
      title: ['One phone call,', 'and the words that settled it.'],
      note: 'Edited from a recorded call with the public simulator (Hotel Ringo), with the audio cut at natural pauses. Playback speed is unchanged. The time on screen is the position in this video.',
      fallback: 'This video cannot be played in this browser.',
    }),
  }),
});

const film = (id, lang = 'ja') => {
  if (!Object.hasOwn(FILMS, id)) return null;
  if (lang === 'ja') return {...FILMS[id], fallback: 'この動画は、このブラウザーでは再生できません。'};
  if (lang === 'en') return {...FILMS[id], ...FILMS[id].en};
  throw new TypeError(`Unsupported film language: ${lang}`);
};

export function filmSection(id, lang = 'ja') {
  const f = film(id, lang);
  if (!f) throw new Error(`Unknown film: ${id}`);
  const paren = lang === 'ja' ? s => `（${s}）` : s => ` (${s})`;
  const heading = `film15-${id}-title`;
  return `<section class="container rm-film15 rm-film15--${id}" ${SECTION}="${id}" aria-labelledby="${heading}"><div class="rm-film15__head"><p class="rm-film15__kicker">${e(f.kicker)}</p><h2 id="${heading}">${f.title.map(e).join('<br>')}</h2><p class="rm-film15__note">${e(f.note)}</p></div><figure class="rm-film15__figure"><video controls playsinline preload="none" poster="${f.poster}" aria-label="${e(f.label)}${e(paren(f.audio))}"><source src="${f.src}" type="video/mp4">${e(f.fallback)}</video><figcaption>${e(f.meta)}</figcaption></figure></section>`;
}

// Insert once, before the anchor. Fails closed when the page no longer has the anchor,
// and is idempotent when the section is already there.
export function insertFilm(html, id, lang = 'ja') {
  const f = film(id, lang);
  if (!f) throw new Error(`Unknown film: ${id}`);
  if (html.includes(`${SECTION}="${id}"`)) return html;
  const at = html.indexOf(f.before);
  if (at < 0 || html.indexOf(f.before, at + 1) >= 0) throw new Error(`Film ${id}: expected exactly one insertion point`);
  return html.slice(0, at) + filmSection(id, lang) + html.slice(at);
}

export async function writeFifteenSecondFilms(dist) {
  for (const [id, f] of Object.entries(FILMS)) {
    for (const asset of [f.src, f.poster]) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Film ${id}: missing ${asset}`); });
    for (const [lang, page] of [['ja', f.page], ['en', f.en.page]]) {
      const file = path.join(dist, page);
      await fs.writeFile(file, insertFilm(await fs.readFile(file, 'utf8'), id, lang));
    }
  }
  const assets = path.join(dist, 'assets');
  const [css, layer] = await Promise.all(['showcase.css', 'fifteen-second-films.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('.rm-film15')) throw new Error('Film stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(MARK)[0].trimEnd() + `\n${MARK}\n${layer}`);
}
