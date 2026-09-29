import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/build.mjs';
import {products} from '../src/products.mjs';
import {esc} from '../public/assets/lab-core.mjs';

const css = await fs.readFile(path.join(root,'public/assets/horio-premium.css'),'utf8');
const precision = await fs.readFile(path.join(root,'public/assets/precision-polish.css'),'utf8');
const rhythm = await fs.readFile(path.join(root,'public/assets/brand-rhythm.css'),'utf8');
const declarations = (css+'\n'+precision).replace(/\/\*[\s\S]*?\*\//g,'');
const entryCss = await fs.readFile(path.join(root,'public/assets/site.css'),'utf8');
const films = await fs.readFile(path.join(root,'public/assets/product-films.js'),'utf8');
const site = await fs.readFile(path.join(root,'public/assets/site.js'),'utf8');
const home = await fs.readFile(path.join(root,'dist/index.html'),'utf8');
const en = await fs.readFile(path.join(root,'dist/en/index.html'),'utf8');

test('Horio Premium avoids generic AI visual shortcuts',()=>{
  assert.doesNotMatch(declarations,/linear-gradient|radial-gradient|conic-gradient|backdrop-filter|glassmorphism|particles?|bento/i);
  assert.match(declarations,/--hp-stage:#171a17/);
  assert.match(declarations,/font-size:clamp\(44px/);
});

test('all design layers are imported before any CSS declarations',()=>{
  const stripped=entryCss.replace(/\/\*[\s\S]*?\*\//g,'').trim();
  const lines=stripped.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  assert.deepEqual(lines,[
    '@import url("./site-base.css");',
    '@import url("./site-refinement.css");',
    '@import url("./quiet-cinema.css");',
    '@import url("./horio-premium.css");',
    '@import url("./precision-polish.css");',
    '@import url("./reachmade-art-direction.css");',
    '@import url("./visual-ownership-responsive.css");',
    '@import url("./hero-layouts.css");',
    '@import url("./brand-rhythm.css");',
  ]);
});

test('both homes lead with a clear promise, real footage and localized actions before enhancement',()=>{
  // The old flagship hero is replaced in both locales. Preserve the actual
  // promise -> footage -> product evidence journey with native no-script access.
  for (const [html,lang,prefix] of [[home,'ja',''],[en,'en','/en']]) {
    assert.match(html,/data-home-v4="/);
    assert.equal((html.match(/<h1[\s>]/g)||[]).length,1);
    assert.equal((html.match(/data-studio-choice=/g)||[]).length,products.length);
    assert.equal((html.match(/data-v4-chapter=/g)||[]).length,products.length);
    assert.ok(html.includes(`href="${prefix}/contact/"`));
    assert.match(html,/class="v4-hero"[^]*?href="#products"/);
    assert.match(html,/data-v4-reel-proof/);
    assert.doesNotMatch(html,/<video[^>]*\bautoplay\b/);
    for (const tag of html.match(/<video\b[^>]*>/g)||[]) {
      assert.match(tag,/\bcontrols\b/);
      assert.match(tag,/preload="none"/);
    }
    for (const p of products) {
      const source = ['oathra','agent-team'].includes(p.id) ? `/media/films/home-${p.id}-13s.mp4` : `/media/products/${p.id}.mp4`;
      assert.ok(html.includes(`data-src="${source}"`), `${lang}: ${p.id} real media source`);
      assert.ok(html.includes(`href="${prefix}/products/${p.id}/"`), `${lang}: ${p.id} product detail`);
      assert.ok(html.includes(esc(p[lang].proof)), `${lang}: ${p.id} ledger evidence`);
      assert.ok(html.includes(esc(p[lang].scope)), `${lang}: ${p.id} actual conditions`);
    }
  }
  assert.match(home,/AIプロダクトの自主開発と、企業向け開発支援/);
  assert.match(home,/思いついたら、/);
  assert.match(en,/Independent AI products and development for companies/);
  assert.match(en,/From an idea\./);
  assert.match(en,/To something useful/);
  assert.match(en,/not recordings of the live apps or stream/);
  assert.match(rhythm,/CLAIM  →  PROOF/);
});

test('the homepage has one seven-product automatic signature moment and manual lower films',()=>{
  assert.match(site,/SIGNATURE FILM \/ 7 REAL PRODUCTS/);
  assert.match(site,/reachmade-signature\.mp4/);
  assert.match(site,/reachmade-signature\.jpg/);
  assert.match(site,/\(min-width:1181px\)/);
  assert.match(site,/prefers-reduced-motion: reduce/);
  assert.match(site,/connection\?\.saveData/);
  // Two seconds from each product at normal speed; the Noa segment comes from an introduction film and says so.
  assert.match(site,/Two seconds from each product, at normal speed; the Noa segment is an introduction film with recreated screens\./);
  assert.match(site,/夜澄ノアは画面を再現した紹介映像（演出を含む）です。/);
  assert.match(films,/if \(!isHome\)/);
  assert.match(films,/s\.manual===true\|\|\(s\.autoEligible/);
});

test('automatic media failure stays visually quiet until the visitor explicitly tries playback',()=>{
  assert.match(films,/const disclose = s\.manual === true/);
  assert.match(films,/s\.error\.hidden=!disclose/);
});

test('mobile has a different composition rather than a desktop scale-down',()=>{
  assert.match(declarations,/@media\(max-width:650px\)/);
  assert.match(declarations,/\.hero\.container\{padding-block/);
  assert.match(declarations,/width:100vw/);
  assert.match(declarations,/calc\(50% - 50vw\)/);
  assert.match(site,/matchMedia\('\(max-width:1180px\)'\)/);
  assert.match(site,/heroTitle\.after\(heroProof\)/);
  assert.match(site,/heroCopy\.after\(heroProof\)/);
});

test('English product typography is optically tuned and tablet film density is reduced',()=>{
  assert.match(precision,/html\[lang="en"\] \.owned-product \.owned-hero-grid h1/);
  assert.match(precision,/owned-product--aisecure/);
  assert.match(precision,/owned-product--agent-team/);
  assert.match(precision,/max-width:1100px/);
  assert.match(precision,/width:min\(100%,740px\)!important/);
});
