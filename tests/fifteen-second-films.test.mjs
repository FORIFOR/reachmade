import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { FILMS, filmSection, insertFilm } from '../src/fifteen-second-films.mjs';
import { serveOwnedRecording } from '../src/owned-recording-response.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const read = p => fs.readFile(path.join(dist, p), 'utf8');

test('each film appears once, before its anchor, on its Japanese page only', async () => {
  for (const [id, f] of Object.entries(FILMS)) {
    const html = await read(f.page);
    assert.equal(html.split(`data-film15="${id}"`).length - 1, 1, id);
    // The Japanese Oathra page is re-composed by src/oathra-lp.mjs (2026-09-29 brief); there the film sits in its
    // recordings section. Elsewhere it still precedes the anchor it was inserted before.
    if (html.includes('data-oathra-lp=')) assert.ok(html.indexOf('id="recordings"') < html.indexOf(`data-film15="${id}"`) && html.indexOf(`data-film15="${id}"`) < html.indexOf('id="status"'), `${id} sits in the recordings section`);
    else assert.ok(html.indexOf(`data-film15="${id}"`) < html.indexOf(f.before), `${id} precedes its anchor`);
    const en = await read(path.join('en', f.page));
    assert.doesNotMatch(en, /data-film15/, `${id}: the English page gets no Japanese film`);
  }
  // The v4 home links the Genie and Oathra films from their chapters, labelled as edited films.
  const home = await read('index.html');
  assert.doesNotMatch(home, /data-film15=/);
  for (const id of ['genie', 'oathra']) {
    assert.ok(home.includes(`href="/products/${id}/#film15-${id}-title"`), `${id} film reachable without JavaScript`);
  }
  assert.match(home, /演出を含む/);
});

test('players never autoplay, never preload, and say what they are', async () => {
  for (const id of Object.keys(FILMS)) {
    const html = filmSection(id);
    assert.match(html, /<video controls playsinline preload="none"/);
    assert.doesNotMatch(html, /<video[^>]*\ssrc=/, 'the file is a <source>, like the other players');
    assert.match(html, new RegExp(`<source src="${FILMS[id].src}" type="video/mp4">`));
    assert.doesNotMatch(html, /autoplay|loop|muted/);
    // Each player states its own length and sound, as measured from the file (Genie 30 s silent, Oathra 15 s with sound).
    assert.ok(html.includes(`<figcaption>${FILMS[id].meta}</figcaption>`));
    assert.ok(html.includes(`（${FILMS[id].audio}）"`));
    assert.match(FILMS[id].meta, /演出を含む|再現イメージ/);
    assert.equal((html.match(/<h2 /g) || []).length, 1);
    assert.doesNotMatch(html, /<h1|<script|href=/);
  }
  // The owner's 30-second Genie film labels its halves itself: a recreation, then an unshipped design preview.
  assert.match(FILMS.genie.meta, /^30秒 · 音声なし/);
  assert.match(FILMS.genie.note, /再現したイメージ.*設計プレビュー.*まだ実装されていません.*実アプリの録画ではなく/);
  assert.doesNotMatch(FILMS.genie.note, /Genieが生成/);
  assert.match(FILMS.oathra.meta, /^15秒 · 音声あり/);
  assert.match(FILMS.oathra.note, /公開シミュレーター.*再生速度は変えていません/);
});

test('insertion is idempotent and fails closed without its anchor', () => {
  const page = `<main><section class="container owned-flow" id="flow">x</section></main>`;
  const once = insertFilm(page, 'oathra');
  assert.equal(insertFilm(once, 'oathra'), once);
  assert.throws(() => insertFilm('<main></main>', 'oathra'), /exactly one insertion point/);
  assert.throws(() => insertFilm(page + page, 'oathra'), /exactly one insertion point/);
  assert.throws(() => insertFilm(page, 'constructor'), /Unknown film/);
});

test('packaged films match their manifest and stay small', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/media/films/manifest.json'), 'utf8'));
  const listed = new Set(manifest.files.map(f => f.path));
  for (const f of Object.values(FILMS)) for (const p of [f.src, f.poster]) assert.ok(listed.has(p), `${p} is in the manifest`);
  for (const entry of manifest.files) {
    const bytes = await fs.readFile(path.join(root, 'public', entry.path));
    assert.equal(bytes.length, entry.bytes, entry.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, `${entry.path} changed without updating the manifest`);
    assert.ok(bytes.length < 8 * 1024 * 1024, `${entry.path} stays under 8 MiB`);
    assert.match(entry.sourceSha256, /^[0-9a-f]{64}$/);
  }
  const css = await read('assets/showcase.css');
  assert.equal(css.split('/* fifteen-second films */').length - 1, 1, 'the film layer is appended exactly once');
  // Only the films layer itself: later layers (capabilities, home v4) are appended after it and checked by their own tests.
  const filmsLayer = css.split('/* fifteen-second films */')[1].split(/\n\/\* REACHMADE_[A-Z0-9_]+ \*\//)[0];
  assert.ok(filmsLayer.includes('.rm-film15'));
  assert.doesNotMatch(filmsLayer, /animation|transition/);
});

test('every film is served with byte ranges, from its own path', async () => {
  const bytes = new Uint8Array(Array.from({ length: 100 }, (_, i) => i));
  for (const f of Object.values(FILMS)) {
    const assets = { fetch: async req => { assert.equal(new URL(req.url).pathname, f.src); return new Response(bytes, { headers: { 'content-type': 'video/mp4', 'content-length': '100' } }); } };
    const r = await serveOwnedRecording(new Request('https://reachmade.com' + f.src, { headers: { Range: 'bytes=10-19' } }), assets);
    assert.equal(r.status, 206, f.src);
    assert.equal(r.headers.get('content-range'), 'bytes 10-19/100');
    assert.equal(r.headers.get('accept-ranges'), 'bytes');
    assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes.slice(10, 20));
  }
  assert.equal(await serveOwnedRecording(new Request('https://reachmade.com/media/films/other.mp4'), {}), null);
});
