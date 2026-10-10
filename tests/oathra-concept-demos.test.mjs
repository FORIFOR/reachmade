import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from '../scripts/build.mjs';
import {products} from '../src/products.mjs';
import {CONCEPT_DISCLAIMER, conceptDemosSection} from '../src/oathra-lp.mjs';
import {serveOwnedRecording} from '../src/owned-recording-response.mjs';

const product = products.find(p => p.id === 'oathra');

test('three fictional use cases remain usable as links and native players without JavaScript', async () => {
  const html = await fs.readFile(path.join(root, 'dist/products/oathra/index.html'), 'utf8');
  const section = conceptDemosSection(product);
  assert.ok(html.includes(section), 'the final redesign keeps the whole use-case section');
  assert.match(html, /class="rd-btn rd-btn--ink" href="#concept-demos" aria-describedby="oathra-demo-boundary">用途別デモを試す/);
  assert.doesNotMatch(html, /href="https:\/\/reachmade\.com\/demos\/oathra\//, 'preview demo links must stay on the current origin');
  assert.equal(section.split(CONCEPT_DISCLAIMER).length - 1, 4, 'one section notice and one beside each player');
  assert.equal((section.match(/<video controls playsinline preload="none"/g) || []).length, 3);
  assert.doesNotMatch(section, /autoplay|<script|<iframe|<form|tel:/);
  assert.match(section, /合成データ・架空の店舗、電話番号、予約番号のみ/);
  assert.match(section, /料金・購入義務も発生しません/);
  assert.match(section, /条件外の費用、不通、拒否、曖昧な返答は、成功と分けて扱います/);
  const captions = [...section.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g)].map(match => match[1]);
  assert.equal(captions.length, 3);
  for (const demo of product.conceptDemos) {
    assert.equal(new URL(demo.href, 'https://reachmade.com').searchParams.get('flow'), demo.id);
    assert.ok(section.includes(`href="${demo.href}"`));
    assert.ok(section.includes(`poster="${demo.poster}"`));
    assert.ok(section.includes(`<source src="${demo.src}" type="video/mp4">`));
    assert.ok(section.includes('動画ファイルを開く'), 'native fallback remains actionable');
    await fs.access(path.join(root, 'dist', demo.src));
    await fs.access(path.join(root, 'dist', demo.poster));
  }
  captions.forEach((caption, index) => {
    assert.ok(caption.includes(`href="${product.conceptDemos[index].src}"`), 'direct media link remains visible when playback fails');
    assert.match(caption, /<details class="olp-demo__text"><summary>操作の流れをテキストで読む<\/summary>/);
    product.conceptDemos[index].steps.forEach(step => assert.ok(caption.includes(step)));
    assert.ok(caption.includes(product.conceptDemos[index].result), 'the silent film has a text result');
  });
  const en = await fs.readFile(path.join(root, 'dist/en/products/oathra/index.html'), 'utf8');
  assert.ok(!en.includes('id="concept-demos"'), 'Japanese recordings are added only to the requested Japanese LP');
  assert.throws(() => conceptDemosSection({...product, conceptDemos:[]}), /expected three concept demos/);
});

test('new simulation recordings serve bounded ranges and HEAD from their own assets', async () => {
  const bytes = new Uint8Array(Array.from({length:100}, (_, i) => i));
  for (const demo of product.conceptDemos) {
    const assets = {fetch:async req => {
      assert.equal(new URL(req.url).pathname, demo.src);
      return new Response(req.method === 'HEAD' ? null : bytes, {headers:{'content-type':'video/mp4', 'content-length':'100'}});
    }};
    const url = 'https://reachmade.com' + demo.src;
    const response = await serveOwnedRecording(new Request(url, {headers:{Range:'bytes=20-29'}}), assets);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), 'bytes 20-29/100');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes.slice(20,30));
    const head = await serveOwnedRecording(new Request(url, {method:'HEAD'}), assets);
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await serveOwnedRecording(new Request(url, {headers:{Range:'bytes=500-'}}), assets)).status, 416);
  }
});
