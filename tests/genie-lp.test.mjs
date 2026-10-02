import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {GENIE_LP_VERSION, FRAMES, DEMOS, refineGenieLp} from '../src/genie-lp.mjs';
import {products} from '../src/products.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFile(path.join(root, 'dist', p), 'utf8');
const shell = `<!doctype html><html lang="ja"><head></head><body class="owned-product owned-product--genie" data-product-id="genie" id="top"><nav><a href="#recording">実演</a></nav><main id="main"><section class="container owned-hero-grid"><div class="ad-paper-edge"><p class="ad-label">録画の見どころ</p></div><figure class="owned-film owned-film--hero" id="recording"><div class="owned-film__screen"><video hidden controls muted playsinline preload="none" poster="/media/products/genie.jpg" data-recording-src="/media/products/genie.mp4" aria-label="Genie 実演録画"></video></div><figcaption><span>実アプリの録画</span></figcaption></figure><h1><img class="owned-product-icon" src="/assets/products/genie/icon-128.png" width="128" height="128" alt="">依頼の先に、使える成果物。</h1></section><section class="container owned-features" id="features"><div class="owned-section-head"><p class="owned-kicker">主要機能・できること</p><h2>いま確かめられる、<br>主な機能。</h2></div><div class="owned-features__grid"></div><p class="owned-features__source">x</p></section><section class="container rm-film15 rm-film15--genie" data-film15="genie"></section><section class="container owned-flow" id="flow"></section><section class="container owned-start" id="start"><div><p class="owned-kicker">試す</p><h2>まず、ひとつの成果物を作る。</h2><p>body</p></div><div class="owned-start__actions"></div></section></main></body></html>`;

test('Genie LP composes once, keeps its anchors in order and fails closed', () => {
  const once = refineGenieLp(shell, products);
  assert.ok(once.includes(`data-genie-lp="${GENIE_LP_VERSION}"`));
  assert.equal(refineGenieLp(once, products), once);
  assert.equal((once.match(/<h1\b/g) || []).length, 1);
  assert.match(once, /<h1><img class="owned-product-icon" src="\/assets\/products\/genie\/icon-128\.png" width="128" height="128" alt="">作業の途中で、<br>Genieを<span class="glp-trace">呼び出す<\/span>。/);
  const at = s => once.indexOf(s);
  assert.ok(at('id="features"') < at('id="demos"') && at('id="demos"') < at('id="artifacts"') && at('id="artifacts"') < at('data-film15="genie"'));
  assert.ok(at('data-film15="genie"') < at('id="flow"') && at('id="flow"') < at('id="trust"') && at('id="trust"') < at('id="start"'));
  assert.match(once, /まずは、<br>手元のメモから。/);
  assert.throws(() => refineGenieLp(shell.replace('lang="ja"', 'lang="en"'), products), /Japanese Genie/);
  assert.throws(() => refineGenieLp(shell.replace('主要機能・できること', 'x'), products), /features heading/);
  assert.throws(() => refineGenieLp(shell.replace('data-recording-src="/media/products/genie.mp4"', ''), products), /top recording/);
  assert.throws(() => refineGenieLp(shell.replace('data-film15="genie"', '').replace('rm-film15--genie', 'x'), products), /15-second film/);
  const broken = structuredClone(products); broken[0].ja.features = [];
  assert.throws(() => refineGenieLp(shell, broken), TypeError);
});

test('Genie LP never autoplays, labels every demonstration and claims only ledger facts', () => {
  const html = refineGenieLp(shell, products);
  assert.doesNotMatch(html, /\bautoplay\b|<iframe|<form|<script|\bonclick=|<video[^>]*\ssrc=/);
  for (const tag of html.match(/<video\b[^>]*>/g) || []) assert.match(tag, /preload="none"/);
  assert.equal((html.match(/data-glp-demo=/g) || []).length, DEMOS.length);
  assert.equal((html.match(/実アプリの公開実演から切り出した画面です。入力は架空の例です。/g) || []).length, DEMOS.length);
  assert.match(html, /押しても新しいAI処理は行いません/);
  assert.match(html, /デモ用の架空データ/);
  for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) assert.match(tag, /rel="noopener noreferrer"/);
  const p = products.find(x => x.id === 'genie').ja;
  const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  assert.ok(html.includes(esc(p.features[1].body)) && html.includes(esc(p.scope)));
  assert.doesNotMatch(html, /コンピューター操作|完全にローカル|絶対に安全|10x|導入企業|ユーザー数/);
  assert.equal((html.match(/<li><strong>/g) || []).length, 0, 'the LP adds no list items that could be read as hero badges');
});

test('the top film is the 01 TaskDock reconstruction, never called a recording', async () => {
  const html = refineGenieLp(shell, products);
  const film = html.slice(html.indexOf('<figure class="owned-film owned-film--hero"'), html.indexOf('</figure>', html.indexOf('owned-film--hero')));
  assert.match(film, /data-recording-src="\/media\/films\/genie-taskdock-13s\.mp4"/);
  assert.match(film, /再現映像 · 開発中の次の版/);
  assert.match(film, /次の版のTaskDock（開発中）の動きを再現した約13秒の映像です。.*実アプリの録画ではありません。/);
  assert.doesNotMatch(film, /実演録画|REAL PRODUCT|元の録画/);
  assert.match(html, /<a href="#recording">動き<\/a>/);
  assert.match(html, /<p class="ad-label">映像の見どころ<\/p>/);
  assert.doesNotMatch(html, /録画の見どころ|>実演<\/a>/);
  // The hero's film tab (animated-demos.mjs) reads the film path, so this film is never offered as a real recording.
  const demos = await fs.readFile(path.join(root, 'public/assets/animated-demos.mjs'), 'utf8');
  assert.match(demos, /const produced = \/\^\\\/media\\\/films\\\/\/\.test\(/);
  assert.match(demos, /produced \? t\('再現映像を見る','Reconstruction'\)/);
});

test('02 shows each request as a request still and a result still, with no films', () => {
  const html = refineGenieLp(shell, products);
  const demos = html.slice(html.indexOf('id="demos"'), html.indexOf('id="artifacts"'));
  assert.doesNotMatch(demos, /<video/);
  for (const d of DEMOS) {
    const item = demos.slice(demos.indexOf(`id="demo-${d.id}"`), demos.indexOf('</article>', demos.indexOf(`id="demo-${d.id}"`)));
    assert.equal((item.match(/<img /g) || []).length, 2, d.id);
    assert.match(item, /<span class="glp-demo__tag">依頼<\/span><a class="glp-demo__zoom" [^>]*><img [^>]*alt="[^"]+"[^>]*>.*<span class="glp-demo__tag">結果<\/span><a class="glp-demo__zoom" [^>]*><img [^>]*alt="[^"]+"/, d.id);
  }
  // The published orbit film states that its finished version was made with Codex; the result still says so too.
  assert.match(demos.slice(demos.indexOf('id="demo-prototype"')), /完成版の作成にはCodexを使っています/);
  assert.match(demos, /<a href="\/products\/genie\/demos\/">実演を動画で見る/);
});

test('01 shows one work screen where only the next TaskDock changes, labelled as in development', () => {
  const html = refineGenieLp(shell, products);
  assert.equal((html.match(/data-glp-how-frame=/g) || []).length, 3);
  assert.equal((html.match(/class="glp-dock glp-dock--/g) || []).length, 3);
  assert.equal(html.split(FRAMES.work.src).length - 1, 3, 'all three steps share the same real screen');
  assert.match(html, /次の版の TaskDock（開発中）の動きを再現した図です/);
  assert.match(html, /送信するまで渡しません/);
  assert.ok(html.indexOf('data-glp-return') < html.indexOf('05 · START'), 'the closing line returns to the mark before the start heading');
});

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
