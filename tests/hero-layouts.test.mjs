import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = path => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const ids = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];

test('final layout layer preserves the Claim to Proof system while removing AI-style surface effects', async () => {
  const [layers, layouts] = await Promise.all([
    read('public/assets/site.css'),
    read('public/assets/hero-layouts.css')
  ]);
  assert.match(layers,/hero-layouts\.css/);
  assert.doesNotMatch(layouts,/linear-gradient|radial-gradient|conic-gradient|filter:blur|@keyframes|animation\s*:/i);
  assert.match(layouts,/backdrop-filter:none!important/);
  assert.match(layouts,/background-image:none!important/);
});

test('all six products own a distinct desktop page composition', async () => {
  const layouts = await read('public/assets/hero-layouts.css');
  for (const id of ids) assert.match(layouts,new RegExp(`\\.owned-product--${id.replace('-','\\-')} \\.owned-hero-grid`));
  const templates=[...layouts.matchAll(/grid-template-areas:([^!;]+)!important/g)].map(match=>match[1].trim());
  assert.equal(templates.length,6);
  assert.equal(new Set(templates).size,6);
});

test('distinct composition is functional rather than decorative', async () => {
  const layouts = await read('public/assets/hero-layouts.css');
  assert.match(layouts,/owned-product--genie[\s\S]*"kicker film" "title film"/);
  assert.match(layouts,/owned-product--oathra[\s\S]*"film kicker" "film title"/);
  assert.match(layouts,/owned-product--agent-team[\s\S]*"kicker film try" "title film actions"/);
  assert.match(layouts,/owned-product--launchloom[\s\S]*"title try" "actions try" "film film"/);
  assert.match(layouts,/owned-product--ai-meeting[\s\S]*"title try" "title actions" "film film"/);
  assert.match(layouts,/owned-product--aisecure[\s\S]*"title try" "title actions" "film film"/);
});