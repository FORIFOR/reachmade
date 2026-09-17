import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const css = await fs.readFile(new URL('../public/assets/brand-rhythm.css', import.meta.url), 'utf8');
const ids = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];

test('homepage hero is reduced to one visual statement and one primary action', () => {
  assert.match(css,/hero-copy h1::after/);
  assert.match(css,/content:none!important/);
  assert.match(css,/hero-actions \.text-link,\.hero-footnote\{display:none!important\}/);
  assert.match(css,/max-width:7ch/);
});

test('all six products change rhythm beyond the hero', () => {
  for (const id of ids) assert.match(css,new RegExp(`\\.owned-product--${id.replace('-','\\-')} \\.owned-flow`));
  assert.match(css,/owned-product--genie[\s\S]*grid-template-columns:72px 220px 1fr/);
  assert.match(css,/owned-product--ai-meeting[\s\S]*box-shadow:0 0 0 100vmax #121815/);
  assert.match(css,/owned-product--oathra[\s\S]*owned-boundaries article:nth-child\(2\)/);
  assert.match(css,/owned-product--aisecure[\s\S]*owned-outcome/);
  assert.match(css,/owned-product--agent-team[\s\S]*li:nth-child\(3\)\{margin-top:112px/);
  assert.match(css,/owned-product--launchloom[\s\S]*font-size:clamp\(56px,6vw,92px\)/);
});

test('rhythm layer stays static and avoids AI-template visual shortcuts', () => {
  assert.doesNotMatch(css,/@keyframes|animation\s*:|backdrop-filter|linear-gradient|radial-gradient|conic-gradient|filter:blur/i);
});
