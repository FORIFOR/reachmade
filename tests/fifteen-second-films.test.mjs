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
    assert.ok(html.indexOf(`data-film15="${id}"`) < html.indexOf(f.before), `${id} precedes its anchor`);
    const en = await read(path.join('en', f.page));
    assert.doesNotMatch(en, /data-film15/, `${id}: the English page gets no Japanese film`);
  }
  // The home still reads hero → recorded result → films → explore → products.
  const home = await read('index.html');
  const at = s => home.indexOf(s);
  assert.ok(at('data-outcome-recorded-result') < at('data-film15="home"'));
  assert.ok(at('data-film15="home"') < at('id="explore"'));
});

test('players never autoplay, never preload, and say what they are', async () => {
  for (const id of Object.keys(FILMS)) {
    const html = filmSection(id);
    assert.match(html, /<video controls playsinline preload="none"/);
    assert.doesNotMatch(html, /<video[^>]*\ssrc=/, 'the file is a <source>, like the other players');
    assert.match(html, new RegExp(`<source src="${FILMS[id].src}" type="video/mp4">`));
    assert.doesNotMatch(html, /autoplay|loop|muted/);
    assert.match(html, /音声あり/);
    assert.match(html, /演出を含む/);
    assert.equal((html.match(/<h2 /g) || []).length, 1);
    assert.doesNotMatch(html, /<h1|<script|href=/);
  }
  assert.match(FILMS.genie.note, /0〜5\.6秒.*再現.*5\.6〜10\.9秒.*実物.*演出/);
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
  assert.doesNotMatch(css.split('/* fifteen-second films */')[1], /animation|transition/);
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
