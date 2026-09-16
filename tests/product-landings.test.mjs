import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/build.mjs';
import { products } from '../src/products.mjs';
import { landingIds, landingRoute, renderProductLanding } from '../src/product-landings.mjs';
import { productNavigation } from '../src/site-experience.mjs';
const config = JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8'));
for (const id of landingIds) for (const lang of ['ja','en']) {
  test(`${id}/${lang}: owned introduction keeps real media and proposals distinct`, async () => {
    const p = products.find(p=>p.id===id), route = landingRoute(id,lang);
    const html = await fs.readFile(path.join(root,'dist',route,'index.html'),'utf8');
    assert.match(html,new RegExp(`data-recording-src="/media/products/${id}\\.mp4"`));
    assert.doesNotMatch(html,/<video[^>]*\ssrc=|<video[^>]*\bautoplay\b|<iframe|<form\b/);
    assert.match(html,lang==='ja'?/現行製品の実演や、新UIの実装完了を示すものではありません/:/not a demonstration of the current product/);
    assert.match(html,/preload="none"/);
    assert.equal((html.match(/class="owned-step-index"/g)||[]).length,3);
    assert.ok(html.includes(p[lang].scope.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')));
    assert.equal(productNavigation(p,lang).site,config.origin+route);
    if(id==='ai-meeting') assert.match(html,lang==='ja'?/文字入力でタスクを試す/:/Try text tasks \(Japanese UI\)/);
    else assert.match(html,/Gateway/);
  });
}
test('unknown IDs and language values cannot become output paths',()=>{
  for(const id of ['../private','constructor','other'])assert.throws(()=>landingRoute(id,'ja'),TypeError);
  assert.throws(()=>landingRoute('genie','fr'),TypeError);
});
test('registry text is escaped in the new renderer',()=>{
  const p=structuredClone(products.find(p=>p.id==='genie'));
  p.name='<script>bad</script>'; p.ja.scope='<img onerror="bad">';
  const html=renderProductLanding(p,'ja',config,'https://example.org/film.mp4');
  assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));
  assert.equal((html.match(/<script\b/g)||[]).length,1);
});
test('the original Genie demo anchor is retained correctly',()=>{
  const p=products.find(p=>p.id==='genie');
  for(const lang of ['ja','en'])assert.ok(productNavigation(p,lang).demo.endsWith('#demos'));
});
test('landing player has no telemetry, persistence, form or model transport',async()=>{
  const js=await fs.readFile(path.join(root,'public/assets/product-landings.js'),'utf8');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|\.submit\(/);
  assert.match(js,/addEventListener\('click'/);assert.match(js,/video\.play\(\)/);
});
