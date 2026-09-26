/** Fifteen-second introduction films: the Reachmade overview on the Japanese home, and one
 * film each on the Japanese Genie and Oathra pages. They are edited films with motion graphics,
 * so every placement says so beside the player, and says which parts are real. Native controls
 * only: nothing autoplays, nothing downloads before a press, and the page needs no script. */
import fs from 'node:fs/promises';
import path from 'node:path';

const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MARK = '/* fifteen-second films */';
const SECTION = 'data-film15';

export const FILMS = Object.freeze({
  home: Object.freeze({
    page: 'index.html',
    before: '<section class="container lab-explorer" id="explore"',
    src: '/media/films/reachmade-15s.mp4',
    poster: '/media/films/reachmade-15s.jpg',
    label: 'Reachmade Labの15秒紹介映像',
    kicker: '15秒の紹介映像',
    title: ['6つの道具を、', '15秒で。'],
    note: 'モーショングラフィックスで作った紹介映像です。映像内の画面は演出のための再現で、実物の画面と検証記録は、このすぐ下の各製品で確かめられます。',
  }),
  genie: Object.freeze({
    page: 'products/genie/index.html',
    before: '<section class="container owned-flow" id="flow"',
    src: '/media/films/genie-15s.mp4',
    poster: '/media/films/genie-15s.jpg',
    label: 'Genieの15秒紹介映像',
    kicker: '15秒の紹介映像',
    title: ['ひとつの依頼が、', '動くHTMLになるまで。'],
    note: '紹介のために編集した映像です。0〜5.6秒のメモと入力画面は再現（イメージ）、5.6〜10.9秒はGenieが生成したコードとHTMLの実物をそのまま動かしています。それ以降は演出です。音声「小さな宇宙にして」はGenie紹介映像のナレーションからの抜粋です。',
  }),
  oathra: Object.freeze({
    page: 'products/oathra/index.html',
    before: '<section class="container owned-flow" id="flow"',
    src: '/media/films/oathra-15s.mp4',
    poster: '/media/films/oathra-15s.jpg',
    label: 'Oathraの15秒紹介映像',
    kicker: '15秒の紹介映像',
    title: ['一本の電話と、', '確定を決めた一言。'],
    note: '公開シミュレーター（ホテル・リンゴ）との通話記録から、音声を自然な間で切り出して編集した映像です。再生速度は変えていません。画面の時刻は、この動画の再生位置です。',
  }),
});

const film = id => (Object.hasOwn(FILMS, id) ? FILMS[id] : null);

export function filmSection(id) {
  const f = film(id);
  if (!f) throw new Error(`Unknown film: ${id}`);
  const heading = `film15-${id}-title`;
  return `<section class="container rm-film15 rm-film15--${id}" ${SECTION}="${id}" aria-labelledby="${heading}"><div class="rm-film15__head"><p class="rm-film15__kicker">${e(f.kicker)}</p><h2 id="${heading}">${f.title.map(e).join('<br>')}</h2><p class="rm-film15__note">${e(f.note)}</p></div><figure class="rm-film15__figure"><video controls playsinline preload="none" poster="${f.poster}" aria-label="${e(f.label)}（音声あり）"><source src="${f.src}" type="video/mp4">この動画は、このブラウザーでは再生できません。</video><figcaption>15秒 · 音声あり · 押したときだけ再生 · 演出を含む編集映像</figcaption></figure></section>`;
}

// Insert once, before the anchor. Fails closed when the page no longer has the anchor,
// and is idempotent when the section is already there.
export function insertFilm(html, id) {
  const f = film(id);
  if (!f) throw new Error(`Unknown film: ${id}`);
  if (html.includes(`${SECTION}="${id}"`)) return html;
  const at = html.indexOf(f.before);
  if (at < 0 || html.indexOf(f.before, at + 1) >= 0) throw new Error(`Film ${id}: expected exactly one insertion point`);
  return html.slice(0, at) + filmSection(id) + html.slice(at);
}

export async function writeFifteenSecondFilms(dist) {
  for (const [id, f] of Object.entries(FILMS)) {
    for (const asset of [f.src, f.poster]) await fs.access(path.join(dist, asset)).catch(() => { throw new Error(`Film ${id}: missing ${asset}`); });
    const file = path.join(dist, f.page);
    await fs.writeFile(file, insertFilm(await fs.readFile(file, 'utf8'), id));
  }
  const assets = path.join(dist, 'assets');
  const [css, layer] = await Promise.all(['showcase.css', 'fifteen-second-films.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('.rm-film15')) throw new Error('Film stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(MARK)[0].trimEnd() + `\n${MARK}\n${layer}`);
}
