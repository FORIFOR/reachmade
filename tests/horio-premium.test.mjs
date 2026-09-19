import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/build.mjs';

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

test('home leads with a clear product promise and a real product surface before JavaScript enhancement',()=>{
  // Assert the current outcome-led design, including the actual saved result.
  // Retired copy is not a contract; evidence, accessible actions and scope are.
  for (const html of [home,en]) {
    assert.match(html,/REACHMADE \/ INDEPENDENT AI STUDIO/);
    assert.match(html,/data-outcome-first="20260919-outcome-1"/);
    assert.match(html,/data-lab-experience="20260919-product-lab-1"/);
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    assert.equal((html.match(/data-studio-choice=/g)||[]).length,6);
    assert.match(html,/src="\/assets\/products\/genie\.jpg"/);
    assert.match(html,/WORKING PREVIEW \/ Genie/);
    assert.match(html,/data-lab-proof/);
    assert.match(html,/data-lab-detail href="(?:\/en)?\/products\/genie\/"/);
    assert.match(html,/data-lab-begin hidden/);
    assert.match(html,/<video data-outcome-real-film controls playsinline preload="none"/);
    assert.match(html,/src="\/media\/originals\/genie\/assets\/genie-orbit-web\.mp4"/);
    assert.match(html,/class="outcome-open-artifact" href="\/media\/originals\/genie\/orbit\.html"/);
    assert.doesNotMatch(html,/<video[^>]*\bautoplay\b/);
  }
  assert.match(home,/思いついたら、<br>使えるかたちに。/);
  assert.match(home,/6つの製品を、実物から選べます/);
  assert.match(home,/サンプルから外部への送信・実行は行いません/);
  assert.match(home,/ここで新しいAI生成は行いません/);
  assert.match(en,/From an idea\.<br>To something real\./);
  assert.match(en,/Choose between six products/);
  assert.match(en,/Samples do not execute workflows or send data/);
  assert.match(en,/does not run a new AI generation/);
  assert.match(rhythm,/CLAIM  →  PROOF/);
});

test('the homepage has one six-product automatic signature moment and manual lower films',()=>{
  assert.match(site,/SIGNATURE FILM \/ 6 REAL PRODUCTS/);
  assert.match(site,/reachmade-signature\.mp4/);
  assert.match(site,/reachmade-signature\.jpg/);
  assert.match(site,/\(min-width:1181px\)/);
  assert.match(site,/prefers-reduced-motion: reduce/);
  assert.match(site,/connection\?\.saveData/);
  assert.match(site,/Two real seconds from each product/);
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
