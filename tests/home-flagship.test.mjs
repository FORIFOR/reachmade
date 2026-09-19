import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {HOME_VERSION, renderHero, renderAccess, renderFaq, renderFooter, refineHome, writeHomeFlagship} from '../src/home-flagship.mjs';
import {products} from '../src/products.mjs';

const LANGS = ['ja', 'en'];
const fixtures = () => products.map(p => ({...p}));
const shell = lang => `<!doctype html><html lang="${lang}"><head><title>Old</title><meta property="og:title" content="Old"></head><body data-outcome-first="20260919-outcome-1" data-lab-experience="20260919-product-lab-1" id="top"><main id="main"><section class="hero container lab-hero outcome-hero"><h1>Old headline</h1></section>
 <section class="container lab-explorer" id="explore"></section>
 <section class="container lab-collection"></section>
 <section class="lab-evidence-band"></section>
 <section class="container lab-work-with"></section></main><footer class="site-footer"><p>old footer</p></footer></body></html>`;

for (const lang of LANGS) {
  test(`hero/${lang}: one headline, one primary action, the original recording, no invented proof`, () => {
    const html = renderHero(fixtures(), lang);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.equal((html.match(/class="rm-primary"/g) || []).length, 1);
    assert.match(html, /class="hero container lab-hero rm-hero"/);
    assert.match(html, /data-outcome-recorded-result/);
    assert.match(html, /href="#explore"/);
    // The promise that has to survive without JavaScript.
    assert.match(html, lang === 'ja' ? /6つの製品を、実物から選べます/ : /Choose between six products/);
    assert.doesNotMatch(html, /<script|<iframe|\bautoplay\b|\bonclick=/);
    assert.doesNotMatch(html, /10x|customers|導入企業|ユーザー数|満足度|No\.1/i);
    // Counts are derived from the ledger, never typed in.
    assert.match(html, new RegExp(`<b>${String(products.length).padStart(2, '0')}</b>`));
  });

  test(`access/${lang}: every product states its own stage, license and entry`, () => {
    const html = renderAccess(fixtures(), lang);
    assert.equal((html.match(/<tr>/g) || []).length, products.length + 1);
    for (const p of products) {
      assert.ok(html.includes(p[lang].status), `${p.id} stage`);
      assert.ok(html.includes(p[lang].license), `${p.id} license`);
      assert.ok(html.includes(p[lang].outcome), `${p.id} outcome`);
      assert.ok(html.includes(`${lang === 'ja' ? '' : '/en'}/products/${p.id}/`), `${p.id} route`);
    }
    assert.match(html, /<th scope="col">/);
    assert.match(html, /<th scope="row">/);
    assert.match(html, lang === 'ja' ? /保証するものではありません/ : /not a guarantee/);
    assert.doesNotMatch(html, /無料プラン|free plan|\$\d|円\/月|per month/i);
  });

  test(`faq/${lang}: six answers that work without script and claim no customers`, () => {
    const html = renderFaq(lang);
    assert.equal((html.match(/<details/g) || []).length, 6);
    assert.equal((html.match(/<details class="rm-faq-item" open>/g) || []).length, 1);
    assert.equal((html.match(/<summary>/g) || []).length, 6);
    assert.doesNotMatch(html, /<script|<button|onclick=/);
    assert.match(html, lang === 'ja' ? /顧客事例・利用者数・性能比較は、検証が済むまで書きません/ : /customer stories, user counts and performance comparisons stay out/);
    assert.match(html, lang === 'ja' ? /広告・アクセス解析タグと外部フォントは読み込みません/ : /No advertising or analytics tags/);
    assert.ok(html.includes(`${lang === 'ja' ? '' : '/en'}/contact/`));
  });

  test(`footer/${lang}: the whole site is reachable and external links are safe`, () => {
    const html = renderFooter(fixtures(), lang);
    const prefix = lang === 'ja' ? '' : '/en';
    for (const p of products) assert.ok(html.includes(`${prefix}/products/${p.id}/`), `${p.id} in footer`);
    for (const route of ['/products/', '/services/', '/work/', '/about/', '/contact/', '/privacy/']) assert.ok(html.includes(`${prefix}${route}`), route);
    assert.ok(html.includes(lang === 'ja' ? 'href="/en/"' : 'href="/"'));
    assert.ok(html.includes('#access') && html.includes('#faq'));
    for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) assert.match(tag, /rel="noopener noreferrer"/);
    assert.doesNotMatch(html, /mailto:/);
  });

  test(`home/${lang}: the final pass composes once and stays idempotent`, () => {
    const once = refineHome(shell(lang), fixtures(), lang);
    assert.ok(once.includes(`data-home-flagship="${HOME_VERSION}"`));
    assert.equal((once.match(/<h1>/g) || []).length, 1);
    assert.equal((once.match(/id="access"/g) || []).length, 1);
    assert.equal((once.match(/id="faq"/g) || []).length, 1);
    assert.doesNotMatch(once, /Old headline|old footer/);
    assert.match(once, /<title>Reachmade Lab — /);
    // Order: hero → recorded result → chooser → access → evidence → FAQ → footer.
    const at = needle => once.indexOf(needle);
    assert.ok(at('rm-hero') < at('data-outcome-recorded-result'));
    assert.ok(at('data-outcome-recorded-result') < at('id="explore"'));
    assert.ok(at('id="explore"') < at('id="access"'));
    assert.ok(at('id="access"') < at('lab-evidence-band'));
    assert.ok(at('lab-evidence-band') < at('id="faq"'));
    assert.ok(at('id="faq"') < at('rm-footer'));
    assert.equal(refineHome(once, fixtures(), lang), once);
  });
}

test('the pass refuses an unknown shell, an unknown locale and a broken ledger', () => {
  for (const lang of ['de', 'constructor', '__proto__']) {
    assert.throws(() => renderHero(fixtures(), lang), TypeError);
    assert.throws(() => renderAccess(fixtures(), lang), TypeError);
    assert.throws(() => renderFaq(lang), TypeError);
    assert.throws(() => renderFooter(fixtures(), lang), TypeError);
  }
  const duplicate = fixtures(); duplicate[1] = duplicate[0];
  assert.throws(() => renderAccess(duplicate, 'ja'), TypeError);
  assert.throws(() => renderHero([], 'ja'), TypeError);
  assert.throws(() => refineHome(shell('ja').replace('data-outcome-first="20260919-outcome-1" ', ''), fixtures(), 'ja'), /outcome pass/);
  assert.throws(() => refineHome(shell('ja').replace('hero container lab-hero outcome-hero', 'hero'), fixtures(), 'ja'), /hero/);
  assert.throws(() => refineHome(shell('ja').replace('<footer class="site-footer">', '<footer>'), fixtures(), 'ja'), /shell/);
});

test('ledger content is escaped in both text and attributes', () => {
  const hostile = fixtures();
  hostile[0] = {...hostile[0], name: '<img onerror="run">', ja: {...hostile[0].ja, license: '" onmouseover="run'}};
  const html = renderAccess(hostile, 'ja') + renderFooter(hostile, 'ja');
  assert.match(html, /&lt;img onerror=&quot;run&quot;&gt;/);
  assert.doesNotMatch(html, /<img onerror=/);
  assert.doesNotMatch(html, /onmouseover="run/);
});

test('build integration appends one stylesheet layer and repeats cleanly', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-home-'));
  try {
    await fs.mkdir(path.join(tmp, 'assets'), {recursive: true});
    await fs.mkdir(path.join(tmp, 'en'), {recursive: true});
    await fs.writeFile(path.join(tmp, 'index.html'), shell('ja'));
    await fs.writeFile(path.join(tmp, 'en/index.html'), shell('en'));
    await fs.writeFile(path.join(tmp, 'assets/showcase.css'), '/* earlier layers */');
    await fs.copyFile(new URL('../public/assets/home-flagship.css', import.meta.url), path.join(tmp, 'assets/home-flagship.css'));
    await writeHomeFlagship(tmp, fixtures());
    const first = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8');
    await writeHomeFlagship(tmp, fixtures());
    const second = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8');
    assert.equal(first, second, 'stylesheet layer must not accumulate');
    assert.equal((second.match(/REACHMADE_HOME_FLAGSHIP/g) || []).length, 1);
    assert.match(second, /^\/\* earlier layers \*\//);
    for (const route of ['index.html', 'en/index.html']) assert.match(await fs.readFile(path.join(tmp, route), 'utf8'), new RegExp(HOME_VERSION));
    // A missing stylesheet must stop the pass instead of shipping an unstyled home.
    await fs.writeFile(path.join(tmp, 'assets/home-flagship.css'), '/* empty */');
    await assert.rejects(writeHomeFlagship(tmp, fixtures()), /stylesheet incomplete/);
  } finally {
    await fs.rm(tmp, {recursive: true, force: true});
  }
});

test('the final stylesheet stays dependency-free and respects visitor settings', async () => {
  const css = await fs.readFile(new URL('../public/assets/home-flagship.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /url\(\s*['"]?https?:|@import|backdrop-filter/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
  assert.match(css, /\[data-home-flagship\]/);
});

test('the local preview serves modules and media the way production does', async () => {
  const source = await fs.readFile(new URL('../scripts/serve.mjs', import.meta.url), 'utf8');
  const headers = await fs.readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.match(source, /'\.mjs':'text\/javascript/);
  assert.match(source, /'\.mp4':'video\/mp4'/);
  assert.match(source, /'\.vtt':'text\/vtt/);
  assert.ok(headers.includes("media-src 'self'") && source.includes("media-src 'self'"), 'preview CSP must match the shipped policy');
  assert.match(source, /contactRoutes/);
});
