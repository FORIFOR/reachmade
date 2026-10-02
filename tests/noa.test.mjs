import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { root } from '../scripts/build.mjs';
import { products } from '../src/products.mjs';
import { recordings } from '../src/films.mjs';
import { premiumFilmCuts } from '../src/premium-film-cuts.mjs';
import { demoCopy, STAGED_FILMS } from '../public/assets/animated-demos.mjs';
import { NOA_LP_VERSION, FILM, CHANNEL, refineNoaLp, writeNoaLp } from '../src/noa-lp.mjs';

const read = p => fs.readFile(path.join(root, 'dist', p), 'utf8');
const noa = products.find(p => p.id === 'noa');
const mainOf = html => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

test('the seventh product is 夜澄ノア: closed source, with its limits stated in the ledger', () => {
  assert.equal(products.length, 7);
  assert.equal(noa.index, '07');
  assert.equal(noa.name, '夜澄ノア');
  // The repository is private: no repository or README link anywhere, and the ledger says why.
  assert.equal(noa.closedSource, true);
  assert.equal(noa.repo, null);
  assert.equal(noa.source, null);
  assert.equal(noa.evidence, CHANNEL);
  assert.equal(noa.ja.license, 'ソース非公開');
  assert.match(noa.ja.scope, /不適切な返事を絶対に出さない仕組みではありません。/);
  assert.match(noa.ja.scope, /配信の通し運転の実録画は未公開です。/);
  // The film on the site is an introduction film with recreated screens, never called a recording of the stream.
  assert.equal(noa.ja.proof, '解説用に作った映像。配信の実録画ではありません。');
  assert.match(noa.en.proof, /not a recording of a live stream/);
});

test('the film is the owner\'s introduction film with a verified hash, and the site edit stays inside it', async () => {
  assert.equal(recordings.noa, `https://reachmade.com${FILM.src}`);
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/media/originals/manifest.json'), 'utf8'));
  const item = manifest.files.find(f => f.path === FILM.src);
  assert.ok(item && item.sha256 && item.bytes > 0 && item.bytes < 25 * 1024 * 1024, 'under the per-file asset limit');
  assert.ok(premiumFilmCuts.noa.clips.at(-1)[1] <= item.duration);
  assert.ok(!manifest.files.some(f => f.path.includes('/vtuber/')), 'the withdrawn demo recording is gone');
});

test('ja: the page follows the delivered order, labels the film and links no repository', async () => {
  const html = await read('products/noa/index.html');
  assert.match(html, new RegExp(`data-noa-lp="${NOA_LP_VERSION}"`));
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  const at = s => { const i = html.indexOf(s); assert.ok(i >= 0, s); return i; };
  const order = ['id="recording"', 'id="flow"', 'id="features"', 'id="bug"', 'id="watch"', 'id="status"', 'class="container owned-consult"', 'class="container owned-footer"'].map(at);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  const main = mainOf(html);
  assert.doesNotMatch(main, /github\.com|README/);
  assert.doesNotMatch(html, /\sstyle="/, 'no inline styles: the CSP is style-src self');
  assert.equal((main.match(/class="owned-primary"/g) || []).length, 2, 'one in the first view, one in consult');
  assert.match(main, /紹介映像（約35秒・無音・画面は再現・演出を含む）/);
  assert.match(main, /スタジオの画面はrc.6の画面構成を再現したもので、コメントと返事は例です。配信の実録画ではありません。/);
  assert.ok(main.includes(`<source src="${FILM.src}" type="video/mp4">`) && main.includes(`poster="${FILM.poster}"`));
  for (const tag of html.match(/<video\b[^>]*>/g) || []) { assert.match(tag, /preload="none"/); assert.doesNotMatch(tag, /autoplay/); }
  assert.match(main, /ソース非公開 · 声：AivisSpeech「コハク」（オズチャット）/);
  assert.match(main, /※ 動画のリンクは現在チャンネルのトップを指しています。/);
  assert.match(html, /<a href="#bug">不具合の記録<\/a><a href="#watch">見る<\/a>/);
  for (const a of [FILM.src, FILM.poster]) await fs.access(path.join(root, 'dist', a));
});

test('en: the generic page is honest about closed source and the staged film', async () => {
  const html = await read('en/products/noa/index.html');
  const main = mainOf(html);
  assert.doesNotMatch(html, /data-noa-lp/);
  assert.doesNotMatch(main, /github\.com|README|Launchloom\/design/);
  assert.match(main, /The source is not public\./);
  assert.match(main, /not a recording of a live stream/);
  assert.match(main, /INTRO FILM · RECREATED SCREENS \/ ~13 SEC \/ 1×/);
  assert.match(main, /aria-label="夜澄ノア introduction film \(recreated screens\)"/);
  assert.doesNotMatch(main, /REAL PRODUCT/);
  assert.match(main, />Source film <span aria-hidden="true">↗<\/span><\/a>/);
  assert.doesNotMatch(main, /Source recording|>Real recording<|REAL PRODUCT/);
  assert.match(html, /Source: the private repository · checked on 2026-09-29/);
});

test('the home names Noa\'s clip for what it is and links the explainer section', async () => {
  const html = await read('index.html');
  assert.match(html, /data-v4-chapter="noa" data-kind="紹介映像（画面は再現・演出を含む）"/);
  assert.match(html, /href="\/products\/noa\/#watch">5:48の解説（演出を含む）を見る/);
  assert.match(html, /夜澄ノアは画面を再現した紹介映像です。これらは実アプリや配信の実録画ではありません。/);
  // The revised hero describes the lab and consultation; Noa remains a full catalogue product with its own film.
  assert.match(html, /AIプロダクトの自主開発と、企業向け開発支援/);
  assert.equal((html.match(/data-v4-chapter=/g) || []).length, products.length);
  const start = html.indexOf('data-v4-chapter="noa"');
  const chapter = html.slice(start, html.indexOf('</article>', start));
  assert.ok(chapter.includes(`<source src="/media/products/noa.mp4"`) && chapter.includes(`poster="/media/products/noa.jpg"`));
  assert.ok(chapter.includes(`href="${CHANNEL}"`) && chapter.includes('>配信を見る '));
  assert.match(html, /夜澄ノアはソース非公開のため、YouTubeの配信と解説動画で動きを確かめられます。/);
});

test('the illustrative scene is labelled as a reconstruction', () => {
  // The widget's film tab names Noa's film as an introduction film, not a real recording.
  assert.deepEqual([...STAGED_FILMS], ['noa']);
  assert.match(demoCopy('noa', 'ja').scope, /説明用の再現UIです。実際の配信の録画ではありません。/);
  assert.match(demoCopy('noa', 'en').scope, /illustrative UI, not a recording of a live stream/);
});

test('the Noa pass is idempotent and fails closed', async () => {
  const html = await read('products/noa/index.html');
  assert.equal(refineNoaLp(html, products), html);
  const plain = html.replace(/data-noa-lp="[^"]*" /, '');
  assert.throws(() => refineNoaLp(plain.replace('<html lang="ja">', '<html lang="en">'), products), /not the Japanese/);
  assert.throws(() => refineNoaLp(plain, products.map(p => p.id === 'noa' ? {...p, repo: 'https://github.com/x/y', closedSource: false} : p)), /closed source/);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'noa-lp-'));
  try { await assert.rejects(writeNoaLp(tmp, products), /Noa LP: missing/); }
  finally { await fs.rm(tmp, { recursive: true, force: true }); }
  const css = await read('assets/showcase.css');
  assert.equal((css.match(/\/\* REACHMADE_NOA_LP \*\//g) || []).length, 1);
  assert.equal((css.match(/\/\* REACHMADE_OATHRA_LP \*\//g) || []).length, 1);
  const layer = await fs.readFile(path.join(root, 'public/assets/noa-lp.css'), 'utf8');
  assert.doesNotMatch(layer, /@import|url\(|linear-gradient|radial-gradient|backdrop-filter/);
  assert.match(layer, /forced-colors/);
});
