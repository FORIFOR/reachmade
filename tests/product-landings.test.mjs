import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/build.mjs';
import { products } from '../src/products.mjs';
import { landingIds, landingRoute, renderProductLanding, landingExperience } from '../src/product-landings.mjs';
import { productNavigation } from '../src/site-experience.mjs';
const config = JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8'));
const escaped = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

test('owned landings cover exactly the six Reachmade products',()=>{
  assert.deepEqual([...landingIds].sort(),products.map(p=>p.id).sort());
  assert.equal(landingIds.length,6);
});

for (const id of landingIds) for (const lang of ['ja','en']) {
  test(`${id}/${lang}: product page leads with its real film, first action and honest boundaries`, async () => {
    const p = products.find(p=>p.id===id), route = landingRoute(id,lang), x = landingExperience[id][lang];
    const html = await fs.readFile(path.join(root,'dist',route,'index.html'),'utf8');
    assert.match(html,new RegExp(`data-product-id="${id}"`));
    assert.match(html,new RegExp(`data-recording-src="/media/products/${id}\\.mp4"`));
    assert.match(html,new RegExp(`poster="/media/products/${id}\\.jpg"`));
    assert.doesNotMatch(html,/<video[^>]*\ssrc=|<video[^>]*\bautoplay\b|<iframe|<form\b/);
    assert.match(html,/preload="none"/);
    assert.equal((html.match(/class="owned-step-index"/g)||[]).length,3);
    assert.equal((html.match(/class="owned-try-now"/g)||[]).length,1);
    assert.equal((html.match(/class="owned-action-note"/g)||[]).length,1);
    assert.ok(html.includes(escaped(p[lang].scope)));
    assert.ok(html.includes(escaped(p[lang].proof)));
    assert.ok(html.includes(escaped(x.tryNow)));
    assert.ok(html.includes(escaped(x.actionNote)));
    assert.ok(html.includes(escaped(x.primary[0])));
    assert.match(html,lang==='ja'?/13秒で実演を見る/:/See it in 13 seconds/);
    assert.match(html,lang==='ja'?/約13秒.*再生速度は変えていません/:/about 13 seconds; playback speed is unchanged/);
    assert.match(html,lang==='ja'?/現行製品の実演や、新UIの実装完了を示すものではありません/:/not a demonstration of the current product/);
    assert.equal(productNavigation(p,lang).site,config.origin+route);
  });
}

test('unknown IDs and language values cannot become output paths',()=>{
  for(const id of ['../private','constructor','other'])assert.throws(()=>landingRoute(id,'ja'),TypeError);
  assert.throws(()=>landingRoute('genie','fr'),TypeError);
});

test('registry text is escaped in the renderer',()=>{
  const p=structuredClone(products.find(p=>p.id==='genie'));
  p.name='<script>bad</script>'; p.ja.scope='<img onerror="bad">';
  const html=renderProductLanding(p,'ja',config,'https://example.org/film.mp4');
  assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));
  assert.equal((html.match(/<script\b/g)||[]).length,1);
});

test('every product CTA states a concrete action and sets click expectations',()=>{
  const productDestinations = new Set();
  for(const id of landingIds) for(const lang of ['ja','en']) {
    const x=landingExperience[id][lang];
    const [label,href]=x.primary;
    assert.ok(label.length>=8,`${id}/${lang} primary CTA too vague`);
    assert.equal(new URL(href).protocol,'https:');
    assert.ok(x.tryNow.length>=18,`${id}/${lang} missing first-task description`);
    assert.ok(x.actionNote.length>=24,`${id}/${lang} missing post-click expectation`);
    assert.doesNotMatch(label,/^(見る|開く|詳しく見る|Learn more|Open|View)$/i);
    productDestinations.add(id);
  }
  assert.equal(productDestinations.size,6);
});

test('landing player has no telemetry, persistence, form or model transport',async()=>{
  const js=await fs.readFile(path.join(root,'public/assets/product-landings.js'),'utf8');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|\.submit\(/);
  assert.match(js,/addEventListener\('click'/);assert.match(js,/video\.play\(\)/);
  for(const id of landingIds)assert.ok(js.includes(`'${id}'`));
});
