import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = path => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const ids = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];

test('Reachmade owns a static Claim to Proof signature without adding a second motion system', async () => {
  const [layers, art] = await Promise.all([
    read('public/assets/site.css'),
    read('public/assets/reachmade-art-direction.css')
  ]);
  assert.match(layers, /reachmade-art-direction\.css/);
  assert.match(art, /CLAIM\s+→\s+PROOF/);
  assert.match(art, /REAL SCREEN\s+\/\s+REAL LIMIT\s+\/\s+REAL EVIDENCE/);
  assert.doesNotMatch(art, /@keyframes|animation\s*:/i, 'Art direction must not compete with the single Signature Film motion moment');
});

test('all six owned product pages have distinct art-direction selectors', async () => {
  const art = await read('public/assets/reachmade-art-direction.css');
  for (const id of ids) assert.match(art, new RegExp(`\\.owned-product--${id.replace('-', '\\-')}(?:\\{|\\s)`));
  for (const signature of [
    'REQUEST\\A\\AWORK\\A\\AARTIFACT',
    'LIVE CONVERSATION',
    'CLAIM\\A   ↓\\AEVIDENCE',
    'SIGNALS  →  ONE INCIDENT',
    'DRAFT   →   REVIEW   →   REVISE',
    '16:9\\A\\A9:16\\A\\ALP\\A\\APOST'
  ]) assert.ok(art.includes(signature), `missing product signature: ${signature}`);
});

test('art direction frames the existing real recording rather than replacing evidence', async () => {
  const landing = await read('src/product-landings.mjs');
  assert.match(landing, /data-recording-src="\/media\/products\/\$\{product\.id\}\.mp4"/);
  assert.match(landing, /REAL PRODUCT/);
  assert.match(landing, /Source recording|元の録画/);
  assert.doesNotMatch(await read('public/assets/reachmade-art-direction.css'), /users|customers|revenue|trusted by/i);
});
