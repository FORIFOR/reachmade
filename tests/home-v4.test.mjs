import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {HOME_V4_VERSION, renderHomeV4, refineHomeV4, writeHomeV4} from '../src/home-v4.mjs';
import {products} from '../src/products.mjs';
import {landingExperience} from '../src/product-landings.mjs';
import {esc} from '../public/assets/lab-core.mjs';

const root = path.resolve(import.meta.dirname, '..');
const fixtures = () => structuredClone(products);
const shell = `<!doctype html><html lang="ja"><head><title>t</title></head><body data-home-flagship="x" id="top"><main id="main"><section>old</section></main><footer class="site-footer rm-footer"><a href="#access">a</a><a href="#faq">f</a></footer></body></html>`;
// The 2026-10 redesign (src/redesign.mjs) composes the deployed homes. The v4 checks below still hold on the v4 layer's
// own output, so the module keeps its honesty rules; tests/redesign.test.mjs covers the deployed homes.
const v4Page = lang => refineHomeV4(shell.replace('lang="ja"', `lang="${lang}"`), products, lang);

test('v4 home: one h1, seven products, no autoplay, preload none, safe external links', () => {
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
  assert.throws(() => renderHomeV4(fixtures(), 'fr'), TypeError);
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

test('English refinement uses the real built page and refuses a mismatched language', async () => {
  const built = await fs.readFile(path.join(root, 'dist/en/index.html'), 'utf8');
  const source = built.replace(/data-home-v4="[^"]+"\s*/, '');
  const once = refineHomeV4(source, products, 'en');
  assert.equal(refineHomeV4(once, products, 'en'), once);
  assert.match(once, new RegExp(`data-home-v4="${HOME_V4_VERSION}"`));
  assert.throws(() => refineHomeV4(source, products, 'ja'), /language|locale|shell/i);
  assert.ok(once.indexOf('</main>') < once.indexOf('<footer'), 'English keeps the real footer outside main');
});

test('v4 build layer appends once and repeats cleanly', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-v4-'));
  try {
    await fs.cp(path.join(root, 'public/media'), path.join(tmp, 'media'), {recursive: true});
    await fs.mkdir(path.join(tmp, 'assets'), {recursive: true});
    await fs.cp(path.join(root, 'public/assets/products/genie'), path.join(tmp, 'assets/products/genie'), {recursive: true});
    await fs.writeFile(path.join(tmp, 'index.html'), shell);
    await fs.mkdir(path.join(tmp, 'en'), {recursive: true});
    await fs.copyFile(path.join(root, 'dist/en/index.html'), path.join(tmp, 'en/index.html'));
    await fs.writeFile(path.join(tmp, 'assets/showcase.css'), '/* earlier */');
    await fs.copyFile(path.join(root, 'dist/assets/showcase.mjs'), path.join(tmp, 'assets/showcase.mjs'));
    for (const f of ['home-v4.css', 'home-v4.mjs']) await fs.copyFile(path.join(root, 'public/assets', f), path.join(tmp, 'assets', f));
    await writeHomeV4(tmp, fixtures());
    const css1 = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8'), js1 = await fs.readFile(path.join(tmp, 'assets/showcase.mjs'), 'utf8');
    await writeHomeV4(tmp, fixtures());
    assert.equal(await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8'), css1);
    assert.equal(await fs.readFile(path.join(tmp, 'assets/showcase.mjs'), 'utf8'), js1);
    // Count the build marker itself: the readability layer's own comment (2026-09-30) also starts with REACHMADE_HOME_V4.
    assert.equal((css1.match(/\/\* REACHMADE_HOME_V4 \*\//g) || []).length, 1);
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

test('both built homes use the same v4 architecture with their real localized facts', async () => {
  const ja = v4Page('ja');
  const en = v4Page('en');
  assert.match(ja, new RegExp(`data-home-v4="${HOME_V4_VERSION}"`));
  assert.match(en, new RegExp(`data-home-v4="${HOME_V4_VERSION}"`));
  assert.match(en, /href="\/en\/contact\/"/);
  assert.equal((en.match(/data-v4-chapter=/g) || []).length, products.length);
  assert.equal((en.match(/data-v4-choice\b/g) || []).length, products.length);
  assert.doesNotMatch(en, /AIプロダクトの自主開発と、企業向け開発支援|class="studio-player"/);
  for (const p of products) {
    const start = en.indexOf(`data-v4-chapter="${p.id}"`);
    const chapter = en.slice(start, en.indexOf('</article>', start));
    assert.ok(chapter.includes(`href="/en/products/${p.id}/"`), p.id);
    for (const fact of ['headline', 'outcome', 'status', 'scope', 'license', 'proof']) assert.ok(chapter.includes(esc(p.en[fact])), `${p.id} keeps its English ${fact}`);
    assert.ok(chapter.includes(`alt="${esc(p.en.previewLabel)}"`), `${p.id} uses its English image description`);
  }
  for (const html of [ja, en]) {
    assert.ok(html.indexOf('class="v4-rail"') < html.indexOf('id="v4-reel-panel"'), 'the tablist precedes its panel for keyboard focus order');
    assert.match(html, /id="v4-reel-proof"/);
    assert.match(html, /aria-describedby="v4-reel-proof"/);
    for (const video of html.match(/<video\b[^>]*>/g) || []) {
      assert.match(video, /controls/);
      assert.match(video, /preload="none"/);
      assert.doesNotMatch(video, /\bautoplay\b/);
    }
  }
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
  const html = v4Page('ja');
  const chapterOf = id => html.slice(html.indexOf(`data-v4-chapter="${id}"`), html.indexOf('</article>', html.indexOf(`data-v4-chapter="${id}"`)));
  // Launchloom's footage is a film the tool made about itself (ledger: 自身で作った紹介映像), never a recording.
  const launchloom = chapterOf('launchloom');
  const launchloomFigure = launchloom.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/)?.[0];
  assert.ok(launchloomFigure, 'Launchloom keeps its actual footage and visible caption');
  assert.match(launchloomFigure, /Launchloomが作った紹介映像（無音・編集あり）/);
  assert.doesNotMatch(launchloomFigure, /実録画/);
  assert.doesNotMatch(html, /\d本の実録画|REAL RECORDINGS/);
  // Noa remains the seventh real catalogue entry; its introductory film is never a stream recording.
  assert.equal(products.length, 7);
  assert.match(html, /data-v4-chapter="noa" data-kind="紹介映像（画面は再現・演出を含む）"/);
  assert.match(chapterOf('noa'), /<source src="\/media\/products\/noa\.mp4"/);
  assert.match(chapterOf('noa'), /href="\/products\/noa\/#watch">5:48の解説（演出を含む）を見る/);
  // Genie, Oathra and Agent Team play produced films on the home: illustrative, never called a recording.
  for (const [id, label, src] of [['genie', '再現映像（開発中の次の版）', '/media/films/genie-taskdock-13s.mp4'], ['oathra', 'イメージ映像（演出を含む）', '/media/films/home-oathra-13s.mp4'], ['agent-team', '設計動画（画面は再現・未実装を含む）', '/media/films/home-agent-team-13s.mp4']]) {
    const c = chapterOf(id), figure = c.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/)?.[0];
    assert.ok(figure, `${id} retains its own footage and caption`);
    assert.ok(c.includes(`data-kind="${label}"`), id);
    assert.ok(figure.includes(`<source src="${src}"`), `${id} retains the deployed home film`);
    assert.ok(figure.includes(`poster="${src.replace('.mp4', '.jpg')}"`), `${id} uses the matching home-film poster`);
    assert.doesNotMatch(figure, /実録画/, id);
    assert.ok(html.includes(`data-studio-choice="${id}" data-v4-choice data-kind="${label}"`), id);
    const note = figure.slice(figure.indexOf('<span class="v4-proof">'), figure.indexOf('</figcaption>'));
    assert.match(note, /実(際の通話|アプリ)の録画ではありません。/, id);
    const p = products.find(x => x.id === id);
    assert.ok(c.includes(`<p><b>公開している記録</b><br>${esc(p.ja.proof)}</p>`), `${id} keeps the separate ledger evidence in its scope details`);
  }
  assert.match(html, /Oathraはイメージ映像、Agent Teamは未実装の画面を含む設計動画、星藍ノアは画面を再現した紹介映像です。これらは実アプリや配信の実録画ではありません。/);
  assert.doesNotMatch(html, /実際の画面で。/);
  assert.doesNotMatch(client, /\/media\/products\/\$\{/, 'the client takes each footage source from data-v4-rec');
  for (const p of products) {
    const chapter = chapterOf(p.id);
    const figure = chapter.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/)?.[0];
    assert.ok(figure, `${p.id} keeps its own labelled video with its text`);
    const source = figure.match(/<source src="([^"]+)"/)?.[1];
    const poster = figure.match(/<video\b[^>]*poster="([^"]+)"/)?.[1];
    const proof = figure.match(/<span class="v4-proof">([\s\S]*?)<\/span>/)?.[1];
    assert.ok(source && poster && proof, `${p.id} has a source, poster and evidence caption`);
    if (!['genie', 'oathra', 'agent-team'].includes(p.id)) assert.equal(proof, esc(p.ja.proof), `${p.id} shows its ledger evidence conditions beside its footage`);
    const choice = html.match(new RegExp(`<a\\b[^>]*data-studio-choice="${p.id}"[^>]*>`))?.[0];
    assert.ok(choice?.includes(`data-v4-rec="${source}"`), `${p.id} opens the same footage in the shared player`);
    assert.ok(choice?.includes(`data-src="${source}"`) && choice?.includes(`data-poster="${poster}"`), `${p.id} gives the client its explicit matching source and poster`);
    assert.ok(choice?.includes(`data-proof="${proof}"`), `${p.id} carries its footage-specific evidence into the shared player`);
  }
  const initial = products.find(p => p.id === 'ai-meeting');
  const reelProof = html.match(/<p\b[^>]*data-v4-reel-proof[^>]*>[\s\S]*?<\/p>/)?.[0];
  assert.ok(reelProof?.includes(esc(initial.ja.proof)), 'the shared player initially shows the selected product’s evidence conditions');
  assert.doesNotMatch(reelProof, /\bhidden\b/, 'evidence conditions remain visible before playback');
  assert.match(client, /\$\('\[data-v4-reel-proof\]'[^;]*\.textContent\s*=\s*c\.dataset\.proof/, 'changing the selected footage updates the evidence conditions');
  assert.match(chapterOf('genie'), /href="\/products\/genie\/#next-ui"[^>]*>次のTaskDockの設計プレビューを見る/);
  assert.match(chapterOf('genie'), /設計プレビューは未リリースで、実アプリの録画ではありません/);
  assert.doesNotMatch(html, /data-v4-stage|v4-staged|data-v4-next-root|class="v4-app-icon"/, 'the home keeps each film with its product and does not present unreleased design assets as a current application');
  assert.doesNotMatch(client, /data-v4-stage|v4-staged/);
  assert.doesNotMatch(client, /'実録画 · 約13秒|'STILL · 実録画/, 'the client takes the footage kind from data-kind');
});

test('built v4 home leads with consultation, brings services forward, and links directly to verified product entries', async () => {
  const html = v4Page('ja');
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
  const noa = products.find(p => p.id === 'noa');
  assert.ok(noa && noa.closedSource, 'Noa remains in the verified seven-product ledger');
  assert.ok(html.includes(`href="/products/${noa.id}/"`), 'Noa keeps its existing product page');
  assert.doesNotMatch(html, /class="v4-published"/, 'Noa no longer depends on a temporary external-only card');
});
