import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {products} from '../src/products.mjs';
import {esc} from '../public/assets/lab-core.mjs';
import {REDESIGN_VERSION, AGENT_TEAM_FILM, productFilm, redesignHome, redesignProduct, topLevel} from '../src/redesign.mjs';
import {redesignCopyFor} from '../src/redesign-copy.mjs';
import {recordings} from '../src/films.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFile(path.join(root, 'dist', p), 'utf8');
const pages = ['ja', 'en'].flatMap(lang => ['', ...products.map(p => `products/${p.id}/`)].map(r => ({lang, route: `${lang === 'en' ? 'en/' : ''}${r}`, id: r.split('/')[1] || null})));
const mainOf = html => html.slice(html.indexOf('<main id="main">'), html.indexOf('</main>'));

test('every redesigned page keeps the site invariants', async () => {
  for (const {route} of pages) {
    const html = await read(`${route}index.html`);
    assert.ok(html.includes(`data-rd="${REDESIGN_VERSION}"`), route);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${route} one h1`);
    assert.equal((html.match(/<script\b/g) || []).length, 1, `${route} one script`);
    assert.equal((html.match(/rel="stylesheet"/g) || []).length, 1, `${route} one stylesheet`);
    assert.doesNotMatch(html, /\sstyle="|\bautoplay\b|<iframe|\bonclick=/, route);
    for (const tag of html.match(/<video\b[^>]*>/g) || []) {
      assert.match(tag, /\bcontrols\b/, route);
      assert.match(tag, /preload="none"/, route);
    }
    for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) assert.match(tag, /rel="noopener noreferrer"/, route);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${route} duplicate ids`);
    for (const [, frag] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(frag), `${route} #${frag} resolves`);
    // The mobile menu contract shared with showcase.mjs.
    assert.match(html, /<button class="nav-toggle rd-toggle" type="button" aria-expanded="false" aria-controls="main-nav">/);
    assert.match(html, /<nav id="main-nav" class="main-nav rd-nav/);
  }
});

test('the deployed homes: ledger facts, honest reel label and routes to evidence', async () => {
  for (const lang of ['ja', 'en']) {
    const html = await read(lang === 'ja' ? 'index.html' : 'en/index.html'), r = redesignCopyFor(lang), b = lang === 'ja' ? '' : '/en';
    const main = mainOf(html);
    // The 15-second film is motion graphics with a soundtrack, made when there were six products.
    assert.ok(main.includes(esc(r.reelCaption)));
    assert.match(r.reelCaption, lang === 'ja' ? /画面は再現・演出を含む.*音声あり.*6製品/ : /recreated screens and staging.*with sound.*six products/);
    assert.doesNotMatch(r.reelCaption, /無音|silent|実録画|recording/i);
    assert.equal((main.match(/<video\b/g) || []).length, 1, 'only the reel plays on the home');
    for (const p of products) {
      const t = p[lang];
      const row = main.match(new RegExp(`<a class="rd-row" href="${b}/products/${p.id}/"[^>]*>[\\s\\S]*?</a>`))?.[0];
      assert.ok(row, `${lang}/${p.id} row`);
      for (const fact of ['headline', 'outcome', 'status']) assert.ok(row.includes(esc(t[fact])), `${lang}/${p.id} ${fact}`);
      assert.ok(row.includes(`data-rd-label="${esc(`${p.index} — ${t.previewLabel}`)}"`), `${lang}/${p.id} preview label`);
      assert.ok(main.includes(`href="${b}/work/#${p.id}"`), `${lang}/${p.id} evidence record`);
    }
    // The cursor preview names the Agent Team film as a design film, never a recording.
    assert.match(main, new RegExp(`data-rd-film="${AGENT_TEAM_FILM.src}" data-rd-film-label="05 — ${esc(r.filmKinds['agent-team']).replace(/[()（）·]/g, '.')}"`));
    assert.match(main, /id="access"/);
    assert.match(main, /id="faq"/);
    assert.doesNotMatch(main, /\d本の実録画|REAL RECORDINGS|10x|導入企業|ユーザー数|満足度|No\.1/i);
  }
});

test('product pages: one film section that says what it is, ledger scope and proof, and a contextual inquiry', async () => {
  for (const {lang, route, id} of pages.filter(p => p.id)) {
    const p = products.find(x => x.id === id), t = p[lang], r = redesignCopyFor(lang), b = lang === 'ja' ? '' : '/en';
    const html = await read(`${route}index.html`), main = mainOf(html);
    const film = main.match(/<section class="rd-film rd-reel" id="film"[\s\S]*?<\/section>/)?.[0];
    assert.ok(film, `${route} film section`);
    // A moved recording block keeps its own labels (bar, edit note, source link); every other film states its kind.
    if (productFilm(id).kind === 'recording' && film.includes('<figure')) {
      assert.match(film, /data-recording-src="\/media\/products\//, `${route} labelled recording block`);
      assert.match(film, lang === 'ja' ? /約13秒.*再生速度は変えていません/ : /about 13 seconds; playback speed is unchanged/, `${route} edit note`);
    } else if (film.includes('class="rd-reel-frame rd-film-link"')) {
      // A still that links to the recording section further down says it is a still, not a player.
      assert.ok(film.includes(`<b>${esc(r.stillKind)}</b>`) && film.includes(esc(r.filmBelow)), `${route} still is labelled`);
      assert.doesNotMatch(film, /<video\b/);
    } else assert.ok(film.includes(`<b>${esc(r.filmKinds[productFilm(id).kind])}</b>`), `${route} film kind`);
    if (id !== 'genie' && id !== 'ai-meeting' && id !== 'oathra' && id !== 'aisecure') assert.doesNotMatch(r.filmKinds[productFilm(id).kind], /^実録画|^Real recording/, `${route} is not a recording`);
    // The film appears once on the page (moved, linked, or rendered, never twice).
    const {src, covers = []} = productFilm(id);
    const count = [src, ...covers].reduce((n, f) => n + (main.match(new RegExp(`(?:\\ssrc|data-recording-src)="${f.replace(/[.]/g, '\\.')}"`, 'g')) || []).length, 0);
    assert.equal(count, 1, `${route} shows ${src} once`);
    for (const fact of ['scope', 'proof', 'consult', 'headline', 'short']) assert.ok(main.includes(esc(t[fact])), `${route} ${fact}`);
    for (const f of t.features) assert.ok(main.includes(esc(f.title)) && main.includes(esc(f.body)), `${route} feature ${f.code}`);
    assert.ok(main.includes(`href="${b}/contact/#product-${id}"`), `${route} contextual inquiry`);
    assert.ok(main.includes(esc(p.evidence)), `${route} evidence link`);
    if (p.closedSource) assert.doesNotMatch(main, /github\.com\/FORIFOR\/[^"]*noa/i);
    const next = products[(products.indexOf(p) + 1) % products.length];
    assert.match(main, new RegExp(`<a class="rd-next-link" href="${b}/products/${next.id}/"`));
    assert.match(html, new RegExp(`<a href="${b}/products/${id}/"[^>]*aria-current="page"`));
  }
});

test('the owner-supplied Agent Team film is the design film, labelled as such, with the real run one click away', async () => {
  for (const lang of ['ja', 'en']) {
    const r = redesignCopyFor(lang);
    const html = await read(`${lang === 'en' ? 'en/' : ''}products/agent-team/index.html`);
    const film = html.match(/<section class="rd-film rd-reel" id="film"[\s\S]*?<\/section>/)[0];
    assert.ok(film.includes(AGENT_TEAM_FILM.src));
    assert.ok(film.includes(esc(r.filmKinds['agent-team'])));
    assert.ok(film.includes(`href="${recordings['agent-team']}"`), 'the real recording stays reachable');
    // The page also keeps the real 13-second recording in its original first view.
    assert.match(html, /data-recording-src="\/media\/products\/agent-team\.mp4"/);
  }
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/media/films/manifest.json'), 'utf8'));
  const entry = manifest.files.find(f => f.path === AGENT_TEAM_FILM.src);
  // agent-team-lp-ja.mp4 as supplied on 2026-09-29, re-encoded without audio for the site.
  assert.equal(entry.sourceSha256, 'c09914a3d0c5ad93fdf833601379f92c6c65c98dfd031a91d0d3023a4e6b84b9');
  assert.match(entry.note, /not recordings of the app/);
});

test('fonts are self-hosted, licensed and never requested from a third party', async () => {
  const css = await read('assets/showcase.css');
  assert.doesNotMatch(css, /url\(\s*['"]?https?:/i);
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/);
  const files = [...new Set([...css.matchAll(/url\(\/assets\/fonts\/([\w.-]+\.woff2)\)/g)].map(m => m[1]))];
  assert.ok(files.length > 100, 'unicode-range slices');
  for (const f of files) await fs.access(path.join(root, 'public/assets/fonts', f));
  assert.match(css, /font-display:swap/);
  const license = await fs.readFile(path.join(root, 'public/assets/fonts/LICENSE.md'), 'utf8');
  for (const family of ['Geist', 'Zen Kaku Gothic', 'Instrument Serif']) assert.match(license, new RegExp(family));
  assert.match(license, /SIL OPEN FONT LICENSE/i);
  assert.equal(css.split('/* REACHMADE_REDESIGN */').length - 1, 1);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
});

test('the client script is progressive, quiet and private', async () => {
  const js = await fs.readFile(path.join(root, 'public/assets/redesign.mjs'), 'utf8');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|\.autoplay\s*=/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /saveData/);
  assert.match(js, /\(hover: hover\) and \(pointer: fine\)/);
  // Elements are hidden for the reveal only from script, so nothing stays hidden without it.
  assert.match(js, /setAttribute\('data-rd-hidden'/);
  const shared = await read('assets/showcase.mjs');
  assert.equal(shared.split('// REACHMADE_REDESIGN').length - 1, 1);
});

test('the layer fails closed and is idempotent', async () => {
  const html = await read('index.html');
  assert.equal(redesignHome(html, products, 'ja'), html, 'a redesigned page is left as is');
  assert.throws(() => redesignProduct('<html lang="ja"><body data-product-id="genie"><main id="main"></main></body></html>', products[1], products, 'ja'), /not the ai-meeting product page/);
  assert.throws(() => redesignProduct('<html lang="ja"><body data-product-id="genie"><main id="main"><section class="x"></section></main></body></html>', products[0], products, 'ja'), /hero not found/);
  assert.throws(() => topLevel('<div><span></div>'), /unbalanced/);
});
