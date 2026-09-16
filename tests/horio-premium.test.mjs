import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/build.mjs';

const css = await fs.readFile(path.join(root,'public/assets/horio-premium.css'),'utf8');
const precision = await fs.readFile(path.join(root,'public/assets/precision-polish.css'),'utf8');
const artDirection = await fs.readFile(path.join(root,'public/assets/art-direction.css'),'utf8');
const declarations = (css+'\n'+precision+'\n'+artDirection).replace(/\/\*[\s\S]*?\*\//g,'');
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
    '@import url("./art-direction.css");',
  ]);
});

test('Reachmade owns one visual signature without replacing real product proof',()=>{
  assert.match(artDirection,/background:url\("\.\/mark\.svg"\)/);
  assert.match(artDirection,/\.hero-footnote\{/);
  assert.match(artDirection,/\.hero \.rm-signature-stage\{/);
  assert.doesNotMatch(artDirection,/filter:blur|animation:|@keyframes/);
  assert.match(home,/src="\/assets\/products\/genie\.jpg"/);
});

test('the six product heroes have six explicit art directions',()=>{
  const ids=['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];
  for(const id of ids) assert.match(artDirection,new RegExp(`owned-product--${id.replace('-','\\-')} \\.owned-hero-grid`));
  const templates=[...artDirection.matchAll(/grid-template-areas:([^!;]+)!important/g)].map(x=>x[1].trim());
  assert.ok(new Set(templates).size>=5,'product heroes must not collapse back to one shared composition');
  assert.match(artDirection,/owned-product--oathra[\s\S]*box-shadow:0 0 0 100vmax #171a17/);
  assert.match(artDirection,/owned-product--agent-team[\s\S]*grid-template-columns:minmax\(230px,.62fr\) minmax\(0,1.42fr\) minmax\(230px,.58fr\)/);
  assert.match(artDirection,/owned-product--launchloom[\s\S]*font-size:clamp\(50px,5.7vw,80px\)/);
});

test('home leads with a real product surface before any JavaScript enhancement',()=>{
  assert.match(home,/6 INDEPENDENT AI PRODUCTS \/ REAL SCREENS/);
  assert.match(home,/仕事も、会話も、調査も/);
  assert.match(home,/src="\/assets\/products\/genie\.jpg"/);
  assert.match(home,/WORKING PREVIEW \/ Genie/);
  assert.match(en,/6 INDEPENDENT AI PRODUCTS \/ REAL SCREENS/);
  assert.match(en,/AI, built into real products/);
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