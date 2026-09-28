import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { root } from '../scripts/build.mjs';
import { products } from '../src/products.mjs';
import { OATHRA_LP_VERSION, FILM, STEPS, refineOathraLp, writeOathraLp } from '../src/oathra-lp.mjs';

const read = p => fs.readFile(path.join(root, 'dist', p), 'utf8');

test('the Japanese Oathra page follows the brief order and states the status of each part', async () => {
  const html = await read('products/oathra/index.html');
  assert.match(html, new RegExp(`data-oathra-lp="${OATHRA_LP_VERSION}"`));
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  const at = s => { const i = html.indexOf(s); assert.ok(i >= 0, s); return i; };
  const order = ['class="container olp-hero"', 'id="ring"', 'id="steps"', 'id="trust"', 'id="recordings"', 'id="status"', 'id="start"', 'class="container owned-consult"', 'class="container studio-related"'].map(at);
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections follow the brief');
  // First view: one primary button, one-line note, the 30-second image film labelled as such, never autoplaying.
  const hero = html.slice(order[0], order[1]);
  assert.equal((hero.match(/class="owned-primary"/g) || []).length, 1);
  assert.match(hero, /照合するのは公開サンプルだけです。電話はかからず、お店のシステムにも登録しません。/);
  assert.match(hero, /イメージ映像（演出を含む）/);
  assert.match(hero, /現行のOathraにはまだありません/);
  assert.ok(hero.includes(`poster="${FILM.poster}"`) && hero.includes(`<source src="${FILM.src}"`));
  assert.doesNotMatch(hero, /基盤/);
  // 2 and 3: the design stills and the delegation levels are not presented as the current product.
  const steps = html.slice(order[2], order[3]);
  assert.equal(steps.split('開発中の画面 · 未リリース').length - 1, STEPS.length);
  assert.match(steps, /現行のOathra（CLIとシミュレーター）には、この画面はまだありません/);
  const trust = html.slice(order[3], order[4]);
  assert.match(trust, /設計 · 現行版には未実装/);
  assert.match(trust, /この3段階の指定、発信前の承認、費用の上限による打ち切り、着信の応対はまだありません/);
  // 4: the existing 13-second recording and the 15-second film, moved not rewritten.
  const rec = html.slice(order[4], order[5]);
  assert.match(rec, /data-recording-src="\/media\/products\/oathra\.mp4"/);
  assert.match(rec, /data-film15="oathra"/);
  assert.match(rec, /最初に出るのは、判定の流れを説明する再現です/);
  assert.match(hero, /設計画面 · 未リリース/);
  const license = products.find(p => p.id === 'oathra').ja.license;
  assert.equal(html.split(license + ' — ').length - 1 + html.split('>' + license + ' · ').length - 1, 1, 'the licence is stated once, in the table');
  assert.match(rec, /公開シミュレーター.*再生速度は変えていません/);
  // 5: the ledger highlights appear once, in the status table, next to the unclaimed items.
  const status = html.slice(order[5], order[6]);
  for (const h of products.find(p => p.id === 'oathra').ja.highlights) assert.ok(status.includes(h.label), h.value);
  assert.match(status, /店舗システムへの登録/);
  assert.match(status, /100件の実電話検証/);
  assert.match(status, /<details class="owned-access" open>/);
  for (const tag of html.match(/<video\b[^>]*>/g) || []) { assert.match(tag, /preload="none"/); assert.doesNotMatch(tag, /autoplay/); }
  for (const s of STEPS) await fs.access(path.join(root, 'dist', s.src));
  assert.doesNotMatch(html, /href="#features"|href="#flow"/, 'header links follow the new sections');
});

test('English Oathra and the other product pages are not re-composed', async () => {
  assert.doesNotMatch(await read('en/products/oathra/index.html'), /data-oathra-lp/);
  for (const id of ['genie', 'ai-meeting', 'aisecure', 'agent-team', 'launchloom']) assert.doesNotMatch(await read(`products/${id}/index.html`), /data-oathra-lp/);
});

test('the pass is idempotent and fails closed', async () => {
  const html = await read('products/oathra/index.html');
  assert.equal(refineOathraLp(html, products), html);
  assert.throws(() => refineOathraLp(html.replace('data-oathra-lp=', 'data-x=').replace('<html lang="ja">', '<html lang="en">'), products), /not the Japanese Oathra page/);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'oathra-lp-'));
  try { await assert.rejects(writeOathraLp(tmp, products), /missing \/media\/films\/oathra-30s\.mp4/); }
  finally { await fs.rm(tmp, { recursive: true, force: true }); }
  const css = await read('assets/showcase.css');
  assert.equal((css.match(/\/\* REACHMADE_OATHRA_LP \*\//g) || []).length, 1);
  const layer = await fs.readFile(path.join(root, 'public/assets/oathra-lp.css'), 'utf8');
  assert.doesNotMatch(layer, /@import|url\(|linear-gradient|radial-gradient|conic-gradient|backdrop-filter/);
  assert.match(layer, /forced-colors/);
});
