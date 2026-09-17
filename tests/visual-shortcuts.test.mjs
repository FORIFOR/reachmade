import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const art = readFileSync(new URL('../public/assets/reachmade-art-direction.css', import.meta.url), 'utf8');
const responsive = readFileSync(new URL('../public/assets/visual-ownership-responsive.css', import.meta.url), 'utf8');
const css = `${art}\n${responsive}`;

test('Horio Premium art direction avoids AI-template visual shortcuts', () => {
  for (const pattern of [
    /linear-gradient\s*\(/i,
    /radial-gradient\s*\(/i,
    /conic-gradient\s*\(/i,
    /backdrop-filter\s*:/i,
    /filter\s*:\s*blur\s*\(/i,
  ]) {
    assert.equal(pattern.test(css), false, `forbidden visual shortcut found: ${pattern}`);
  }
});

test('AISecure signature stays aligned to implemented preflight behavior', () => {
  assert.match(art, /INPUT\s+→\s+CHECK[\s\S]*BLOCK/);
  assert.match(art, /not_executed/);
  assert.equal(/SIGNALS\s+→\s+ONE INCIDENT/.test(art), false);
});
