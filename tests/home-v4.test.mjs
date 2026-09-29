import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {HOME_V4_VERSION, renderHomeV4, refineHomeV4, writeHomeV4} from '../src/home-v4.mjs';
import {products, publishedHomeLinks} from '../src/products.mjs';
import {landingExperience} from '../src/product-landings.mjs';
import {esc} from '../public/assets/lab-core.mjs';

const root = path.resolve(import.meta.dirname, '..');
const fixtures = () => structuredClone(products);
const shell = `<!doctype html><html lang="ja"><head><title>t</title></head><body data-home-flagship="x" id="top"><main id="main"><section>old</section></main><footer class="site-footer rm-footer"><a href="#access">a</a><a href="#faq">f</a></footer></body></html>`;

test('v4 home: one h1, six products, no autoplay, preload none, safe external links', () => {
  const html = renderHomeV4(fixtures(), 'ja');
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/data-studio-choice=/g) || []).length, products.length);
  assert.equal((html.match(/data-v4-chapter=/g) || []).length, products.length);
  assert.doesNotMatch(html, /\bautoplay\b|\bonclick=|<iframe|<form|<script/);
  for (const tag of html.match(/<video\b[^>]*>/g) || []) assert.match(tag, /preload="none"/);
  for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) assert.match(tag, /rel="noopener noreferrer"/);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate IDs');
  for (const id of ['reel', 'products', 'access', 'faq', 'contact']) assert.ok(ids.includes(id), id);
  for (const p of products) {
    assert.ok(html.includes(`href="/products/${p.id}/"`));
    assert.ok(html.includes(p.ja.status) && html.includes(p.ja.license));
  }
  // Honesty labels: recordings are edited, films include motion graphics, TaskDock frames are not app recordings.
  assert.match(html, /実録画（無音・編集あり）/);
  assert.match(html, /15秒の紹介映像（演出を含む）/);
  assert.match(html, /実アプリの録画ではありません/);
  assert.doesNotMatch(html, /10x|導入企業|ユーザー数|満足度|No\.1/i);
});

test('v4 home escapes ledger content and fails closed', () => {
  const hostile = fixtures(); hostile[0].name = '<img onerror="x">';
  const html = renderHomeV4(hostile, 'ja');
  assert.ok(html.includes('&lt;img onerror=&quot;x&quot;&gt;'));
  assert.doesNotMatch(html, /<img onerror=/);
  assert.throws(() => renderHomeV4(fixtures(), 'en'), TypeError);
  const unknown = fixtures(); unknown[0].id = 'other';
  assert.throws(() => renderHomeV4(unknown, 'ja'), TypeError);
  assert.throws(() => refineHomeV4(shell.replace('data-home-flagship="x" ', ''), fixtures(), 'ja'), /flagship/);
  assert.throws(() => refineHomeV4(shell.replace('<main id="main">', '<main>'), fixtures(), 'ja'), /shell/);
});

test('v4 refine is idempotent and keeps the footer outside <main>', () => {
  const once = refineHomeV4(shell, fixtures(), 'ja');
  assert.ok(once.includes(`data-home-v4="${HOME_V4_VERSION}"`));
  assert.doesNotMatch(once, /<section>old<\/section>/);
  assert.match(once, /<footer class="site-footer rm-footer">/);
  assert.equal(refineHomeV4(once, fixtures(), 'ja'), once);
});

test('v4 build layer appends once and repeats cleanly', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-v4-'));
  try {
    await fs.cp(path.join(root, 'public/media'), path.join(tmp, 'media'), {recursive: true});
    await fs.mkdir(path.join(tmp, 'assets'), {recursive: true});
    await fs.cp(path.join(root, 'public/assets/products/genie'), path.join(tmp, 'assets/products/genie'), {recursive: true});
    await fs.writeFile(path.join(tmp, 'index.html'), shell);
    await fs.writeFile(path.join(tmp, 'assets/showcase.css'), '/* earlier */');
    await fs.writeFile(path.join(tmp, 'assets/showcase.mjs'), '// earlier');
    for (const f of ['home-v4.css', 'home-v4.mjs']) await fs.copyFile(path.join(root, 'public/assets', f), path.join(tmp, 'assets', f));
    await writeHomeV4(tmp, fixtures());
    const css1 = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8'), js1 = await fs.readFile(path.join(tmp, 'assets/showcase.mjs'), 'utf8');
    await writeHomeV4(tmp, fixtures());
    assert.equal(await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8'), css1);
    assert.equal(await fs.readFile(path.join(tmp, 'assets/showcase.mjs'), 'utf8'), js1);
    assert.equal((css1.match(/REACHMADE_HOME_V4/g) || []).length, 1);
    assert.match(css1, /^\/\* earlier \*\//);
    assert.match(js1, /import\('\.\/home-v4\.mjs'\)/);
    await fs.rm(path.join(tmp, 'assets/products/genie/next-ui-03.jpg'));
    await assert.rejects(writeHomeV4(tmp, fixtures()), /missing \/assets\/products\/genie\/next-ui-03\.jpg/);
  } finally {
    await fs.rm(tmp, {recursive: true, force: true});
  }
});

test('v4 assets stay dependency-free and respect visitor settings', async () => {
  const css = await fs.readFile(path.join(root, 'public/assets/home-v4.css'), 'utf8');
  const js = await fs.readFile(path.join(root, 'public/assets/home-v4.mjs'), 'utf8');
  assert.doesNotMatch(css, /@import|url\(|linear-gradient|radial-gradient|backdrop-filter/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|\.autoplay\s*=|autoplay/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /saveData/);
  assert.match(js, /setTimeout\(fail, 10000\)/);
});

test('built Japanese home is v4 and the English home is unchanged', async () => {
  const ja = await fs.readFile(path.join(root, 'dist/index.html'), 'utf8');
  const en = await fs.readFile(path.join(root, 'dist/en/index.html'), 'utf8');
  assert.match(ja, new RegExp(`data-home-v4="${HOME_V4_VERSION}"`));
  assert.doesNotMatch(en, /data-home-v4/);
  const css = await fs.readFile(path.join(root, 'dist/assets/showcase.css'), 'utf8');
  assert.equal(css.split('/* REACHMADE_HOME_V4 */').length - 1, 1);
});

test('v4 home retains the public-source check date, and recordings never chain into one another', async () => {
  const config = JSON.parse(await fs.readFile(new URL('../site.config.json', import.meta.url), 'utf8'));
  const html = await fs.readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes(`公開情報の確認日 ${config.checkedAt}`), 'the source note uses the public-source check, not the capability check');
  const client = await fs.readFile(new URL('../public/assets/home-v4.mjs', import.meta.url), 'utf8');
  const ended = client.slice(client.indexOf("addEventListener('ended'"), client.indexOf("addEventListener('ended'") + 400);
  assert.doesNotMatch(ended, /load\(|\.play\(/, 'a finished recording must not start the next one');
  assert.doesNotMatch(html, /\/media\/home\//, 'Genie frames and icon come from the product page assets');
});

test('v4 names each product film for what it is, and shows the ledger conditions under it', async () => {
  const client = await fs.readFile(new URL('../public/assets/home-v4.mjs', import.meta.url), 'utf8');
  const html = await fs.readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const chapterOf = id => html.slice(html.indexOf(`data-v4-chapter="${id}"`), html.indexOf('</article>', html.indexOf(`data-v4-chapter="${id}"`)));
  // Launchloom's footage is a film the tool made about itself (ledger: 自身で作った紹介映像), never a recording.
  const launchloom = chapterOf('launchloom');
  const launchloomFigure = launchloom.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/)?.[0];
  assert.ok(launchloomFigure, 'Launchloom keeps its actual footage and visible caption');
  assert.match(launchloomFigure, /Launchloomが作った紹介映像（無音・編集あり）/);
  assert.doesNotMatch(launchloomFigure, /実録画/);
  assert.doesNotMatch(html, /\d本の実録画|REAL RECORDINGS/);
  for (const p of products) {
    assert.ok(chapterOf(p.id).includes(`<span class="v4-proof">${esc(p.ja.proof)}</span>`), `${p.id} shows its evidence conditions beside its footage`);
    const choice = html.match(new RegExp(`<a\\b[^>]*data-studio-choice="${p.id}"[^>]*>`))?.[0];
    assert.ok(choice?.includes(`data-proof="${esc(p.ja.proof)}"`), `${p.id} carries its ledger evidence into the shared player`);
  }
  const initial = products.find(p => p.id === 'ai-meeting');
  const reelProof = html.match(/<p\b[^>]*data-v4-reel-proof[^>]*>[\s\S]*?<\/p>/)?.[0];
  assert.ok(reelProof?.includes(esc(initial.ja.proof)), 'the shared player initially shows the selected product’s evidence conditions');
  assert.doesNotMatch(reelProof, /\bhidden\b/, 'evidence conditions remain visible before playback');
  assert.match(client, /\$\('\[data-v4-reel-proof\]'[^;]*\.textContent\s*=\s*c\.dataset\.proof/, 'changing the selected footage updates the evidence conditions');
  assert.match(chapterOf('genie'), /href="\/products\/genie\/#next-ui"[^>]*>次のTaskDockの設計プレビューを見る/);
  assert.match(chapterOf('genie'), /設計プレビューは未リリースで、実アプリの録画ではありません/);
  assert.doesNotMatch(html, /data-v4-stage|data-v4-next-root|class="v4-app-icon"/, 'the home does not present unreleased design assets as a current application');
  assert.doesNotMatch(client, /'実録画 · 約13秒|'STILL · 実録画/, 'the client takes the footage kind from data-kind');
});

test('built v4 home leads with consultation, brings services forward, and links directly to verified product entries', async () => {
  const html = await fs.readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const hero = html.match(/<section class="v4-hero">[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, 'the built home has its introduction');
  assert.match(hero, /AIプロダクトの自主開発と、企業向け開発支援/);
  assert.match(hero, /<a class="v4-btn" href="\/contact\/">開発を相談する/);
  assert.match(hero, /<a class="v4-link" href="#products">つくったものを見る/);
  assert.doesNotMatch(hero, /公開情報の確認日/);
  const reelIndex = html.indexOf('id="reel"'), servicesIndex = html.indexOf('id="services"'), productsIndex = html.indexOf('id="products"');
  assert.ok(reelIndex >= 0 && servicesIndex > reelIndex && productsIndex > servicesIndex, 'services follow the demonstration and precede the product catalogue');
  for (const p of products) {
    const start = html.indexOf(`data-v4-chapter="${p.id}"`);
    assert.ok(start >= 0, `${p.id} remains in the catalogue`);
    const chapter = html.slice(start, html.indexOf('</article>', start));
    const href = p.id === 'genie' ? `/products/${p.id}/#start` : p.id === 'ai-meeting' ? landingExperience[p.id].ja.primary[1] : p.demo.replace(/^https:\/\/reachmade\.com(?=\/)/, '');
    const label = p.id === 'genie' ? '利用条件・セットアップ' : p.id === 'ai-meeting' ? 'タスク画面を試す' : p.ja.demoLabel;
    assert.ok(chapter.includes(`<a class="v4-link" href="${esc(href)}"`), `${p.id} links directly to its verified entry`);
    assert.ok(chapter.includes(`>${esc(label)} <span`), `${p.id} describes what its entry actually opens`);
    for (const fact of [p.ja.headline, p.ja.outcome, p.ja.status, p.ja.scope, p.ja.license]) assert.ok(chapter.includes(esc(fact)), `${p.id} retains its ledger facts and conditions`);
  }
  for (const p of publishedHomeLinks) {
    const start = html.indexOf(`class="v4-published" id="${p.id}"`);
    assert.ok(start >= 0, `${p.name} retains its published entry`);
    const card = html.slice(start, html.indexOf('</article>', start));
    assert.ok(card.includes(`href="${esc(p.url)}"`) && card.includes(`>${esc(p.label)} <span`));
    assert.ok(card.includes(esc(p.status)) && card.includes(esc(p.license)));
  }
});
