import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {GENIE_LP_VERSION, FRAMES, DEMOS, refineGenieLp} from '../src/genie-lp.mjs';
import {products} from '../src/products.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFile(path.join(root, 'dist', p), 'utf8');
const shell = `<!doctype html><html lang="ja"><head></head><body class="owned-product owned-product--genie" data-product-id="genie" id="top"><main id="main"><section class="container owned-hero-grid"><h1><img class="owned-product-icon" src="/assets/products/genie/icon-128.png" width="128" height="128" alt="">依頼の先に、使える成果物。</h1></section><section class="container owned-features" id="features"><div class="owned-section-head"><p class="owned-kicker">主要機能・できること</p><h2>いま確かめられる、<br>主な機能。</h2></div><div class="owned-features__grid"></div><p class="owned-features__source">x</p></section><section class="container rm-film15 rm-film15--genie" data-film15="genie"></section><section class="container owned-flow" id="flow"></section><section class="container owned-start" id="start"><div><p class="owned-kicker">試す</p><h2>まず、ひとつの成果物を作る。</h2><p>body</p></div><div class="owned-start__actions"></div></section></main></body></html>`;

test('Genie LP composes once, keeps its anchors in order and fails closed', () => {
  const once = refineGenieLp(shell, products);
  assert.ok(once.includes(`data-genie-lp="${GENIE_LP_VERSION}"`));
  assert.equal(refineGenieLp(once, products), once);
  assert.equal((once.match(/<h1\b/g) || []).length, 1);
  assert.match(once, /<h1><img class="owned-product-icon" src="\/assets\/products\/genie\/icon-128\.png" width="128" height="128" alt="">依頼の先に、<br>使える<span class="glp-trace">成果物<\/span>。<\/h1>/);
  const at = s => once.indexOf(s);
  assert.ok(at('id="features"') < at('id="demos"') && at('id="demos"') < at('id="artifacts"') && at('id="artifacts"') < at('data-film15="genie"'));
  assert.ok(at('data-film15="genie"') < at('id="flow"') && at('id="flow"') < at('id="trust"') && at('id="trust"') < at('id="start"'));
  assert.match(once, /最初の仕事は、<br>小さくていい。/);
  assert.throws(() => refineGenieLp(shell.replace('lang="ja"', 'lang="en"'), products), /Japanese Genie/);
  assert.throws(() => refineGenieLp(shell.replace('主要機能・できること', 'x'), products), /features heading/);
  assert.throws(() => refineGenieLp(shell.replace('data-film15="genie"', '').replace('rm-film15--genie', 'x'), products), /15-second film/);
  const broken = structuredClone(products); broken[0].ja.features = [];
  assert.throws(() => refineGenieLp(shell, broken), TypeError);
});

test('Genie LP never autoplays, labels every demonstration and claims only ledger facts', () => {
  const html = refineGenieLp(shell, products);
  assert.doesNotMatch(html, /\bautoplay\b|<iframe|<form|<script|\bonclick=|<video[^>]*\ssrc=/);
  for (const tag of html.match(/<video\b[^>]*>/g) || []) assert.match(tag, /preload="none"/);
  assert.equal((html.match(/data-glp-demo=/g) || []).length, DEMOS.length);
  assert.equal((html.match(/架空の入力、待ち時間は短縮しています/g) || []).length, DEMOS.length);
  assert.match(html, /押しても新しいAI処理は行いません/);
  assert.match(html, /デモ用の架空データ/);
  for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) assert.match(tag, /rel="noopener noreferrer"/);
  const p = products.find(x => x.id === 'genie').ja;
  const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  // 04 quotes the ledger's screenshot rule; the scope itself is stated in the hero requirements and in
  // "current boundaries", which the built-page test below checks.
  assert.ok(html.includes(esc(p.features[1].body)));
  assert.doesNotMatch(html, /コンピューター操作|完全にローカル|絶対に安全|10x|導入企業|ユーザー数/);
  assert.equal((html.match(/<li><strong>/g) || []).length, 0, 'the LP adds no list items that could be read as hero badges');
});

// (The v2 patch's test for the next-TaskDock figure in 01 was replaced by the current-product test below:
//  that figure depicted unshipped behaviour next to the ledger's current features. Independent review, P1.)

test('built Genie page is the LP in Japanese only, with its assets present', async () => {
  const ja = await read('products/genie/index.html'), en = await read('en/products/genie/index.html');
  assert.match(ja, new RegExp(`data-genie-lp="${GENIE_LP_VERSION}"`));
  assert.doesNotMatch(en, /data-genie-lp/);
  for (const f of Object.values(FRAMES)) await fs.access(path.join(root, 'dist', f.src));
  const css = await read('assets/showcase.css'), js = await read('assets/showcase.mjs');
  assert.equal(css.split('/* REACHMADE_GENIE_LP */').length - 1, 1);
  assert.equal(js.split('// REACHMADE_GENIE_LP').length - 1, 1);
});

test('Genie LP assets stay dependency-free and respect visitor settings', async () => {
  const css = await fs.readFile(path.join(root, 'public/assets/genie-lp.css'), 'utf8');
  const js = await fs.readFile(path.join(root, 'public/assets/genie-lp.mjs'), 'utf8');
  assert.doesNotMatch(css, /@import|url\(|linear-gradient|radial-gradient|backdrop-filter/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
  assert.match(css, /--glp-presence:#48bcec/);
  assert.match(css, /\.glp-trace::after\{[^}]*var\(--glp-presence\)/, 'the heading line is the presence colour');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|autoplay|\.play\(/);
});

test('the Genie LP keeps the reviewed product-page title and ships only the stills it shows', async () => {
  const {landingExperience} = await import('../src/product-landings.mjs');
  const html = await fs.readFile(path.join(root, 'dist/products/genie/index.html'), 'utf8');
  const h1 = html.match(/<h1>[\s\S]*?<\/h1>/)[0].replace(/<[^>]+>/g, '');
  assert.equal(h1, landingExperience.genie.ja.title, 'no new slogan beside the ledger');
  assert.doesNotMatch(html, /頼むだけで/);
  for (const f of Object.values(FRAMES)) assert.ok(html.includes(f.src), `${f.src} is shown, not just shipped`);
});

test('the Genie LP labels its demos as published demos and states the scope once', async () => {
  const {products} = await import('../src/products.mjs');
  const html = await fs.readFile(path.join(root, 'dist/products/genie/index.html'), 'utf8');
  assert.doesNotMatch(html, /REAL WORKFLOWS/);
  assert.match(html, /02 · 公開実演/);
  assert.match(html, /冒頭の題字や字幕を含みます/);
  const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const scope = esc(products.find(x => x.id === 'genie').ja.scope);
  const trust = html.slice(html.indexOf('id="trust"'), html.indexOf('</section>', html.indexOf('id="trust"')));
  assert.ok(html.includes(scope), 'the ledger scope is still on the page');
  assert.ok(!trust.includes(scope), '04 does not repeat the scope that the page already states');
  assert.doesNotMatch(html, /いま抱えているメモ|手元のメモ/, 'first tries use fictional notes, as the start section says');
  assert.match(html, /画像は紹介映像の静止画/);
});

test('01 shows the current product next to the ledger features, not the unshipped next TaskDock', async () => {
  const html = await fs.readFile(path.join(root, 'dist/products/genie/index.html'), 'utf8');
  const start = html.indexOf('data-glp-how');
  const how = html.slice(start, html.indexOf('</figure>', start));
  for (const f of ['lp-ask.jpg', 'lp-question.jpg', 'lp-result.jpg']) assert.ok(how.includes(f), `${f} is shown in 01`);
  // The next-version figure depicted voice capture and auto-save, which the ledger does not list for Genie.
  assert.doesNotMatch(how, /glp-dock|聞いています|録音|保存済み|次の版の TaskDock/);
  assert.match(how, /実アプリの画面を使った紹介映像から切り出した静止画/);
});

test('the closing line returns to the mark before the start heading', () => {
  const html = refineGenieLp(shell, products);
  assert.ok(html.indexOf('data-glp-return') >= 0 && html.indexOf('data-glp-return') < html.indexOf('05 · START'));
});
